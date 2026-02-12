// CombatEngine — core combat module. No Phaser dependency.
// All callbacks reference CombatEngine.method() by name to avoid `this` binding issues.

import Store from './Store.js';
import TimeEngine from './TimeEngine.js';
import BossManager from './BossManager.js';
import Progression from './Progression.js';
import { D, Decimal } from './BigNum.js';
import { createScope, emit, EVENTS } from '../events.js';
import { COMBAT } from '../config.js';
import { getUnlockedEnemies, getZoneScaling } from '../data/areas.js';
import UpgradeManager from './UpgradeManager.js';
import TerritoryManager from './TerritoryManager.js';
import { getEffectiveMaxHp, getBaseDamage, getCritChance } from './ComputedStats.js';

let currentEnemy = null;
let scope = null;
let forcedCritMultiplier = null;

const CombatEngine = {
  init() {
    // Initialize BossManager
    BossManager.init();

    scope = createScope();

    // Register auto-attack ticker (enabled by default — it's an idle game)
    TimeEngine.register(
      'combat:autoAttack',
      () => CombatEngine.playerAttack(),
      COMBAT.autoAttackInterval,
      true,
    );

    // Re-register auto-attack when speed upgrade purchased
    scope.on(EVENTS.UPG_PURCHASED, (data) => {
      if (data.upgradeId === 'auto_attack_speed') {
        TimeEngine.register(
          'combat:autoAttack',
          () => CombatEngine.playerAttack(),
          UpgradeManager.getAutoAttackInterval(),
          true,
        );
      }
    });

    // Enemy attack timer — fires every 3s
    TimeEngine.register(
      'combat:enemyAttack',
      () => CombatEngine.enemyAttack(),
      COMBAT.enemyAttackInterval,
      true,
    );

    // Player HP regen — fires every 1s
    TimeEngine.register(
      'combat:playerRegen',
      () => CombatEngine._regenPlayerHp(),
      COMBAT.playerRegenInterval,
      true,
    );

    // Subscribe to player death
    scope.on(EVENTS.COMBAT_PLAYER_DIED, () => {
      CombatEngine._onPlayerDeath();
    });

    // On level-up, restore HP to new max (VIT increases)
    scope.on(EVENTS.PROG_LEVEL_UP, () => {
      Store.resetPlayerHp();
    });

    // Re-register auto-attack when territory attack speed buff is claimed
    scope.on(EVENTS.TERRITORY_CLAIMED, (data) => {
      if (data.buff.key === 'autoAttackSpeed') {
        TimeEngine.register(
          'combat:autoAttack',
          () => CombatEngine.playerAttack(),
          UpgradeManager.getAutoAttackInterval(),
          true,
        );
      }
    });

    // Subscribe to zone changes — spawn new enemy (not boss)
    scope.on(EVENTS.WORLD_ZONE_CHANGED, () => {
      // Cancel pending spawn delay
      TimeEngine.unregister('combat:spawnDelay');
      currentEnemy = null;
      CombatEngine.spawnEnemy();
    });

    // Spawn first enemy
    CombatEngine.spawnEnemy();
  },

  destroy() {
    BossManager.destroy();
    TimeEngine.unregister('combat:autoAttack');
    TimeEngine.unregister('combat:spawnDelay');
    TimeEngine.unregister('combat:bossDefeatedDelay');
    TimeEngine.unregister('combat:enemyAttack');
    TimeEngine.unregister('combat:playerRegen');
    TimeEngine.unregister('combat:playerRespawn');
    scope?.destroy();
    scope = null;
    currentEnemy = null;
  },

  /** Spawn a regular enemy using area/zone progressive unlock + zone scaling. */
  spawnEnemy() {
    const state = Store.getState();
    const area = state.currentArea;
    const zone = state.currentZone;

    // Get unlocked enemies for this area+zone
    const pool = getUnlockedEnemies(area, zone);
    if (!pool || pool.length === 0) return;

    const template = pool[Math.floor(Math.random() * pool.length)];
    const zoneScale = getZoneScaling(zone);

    const scaledHp = D(template.hp).times(zoneScale).floor();
    const scaledAtk = Math.floor(template.attack * zoneScale);
    const scaledGold = D(template.goldDrop).times(zoneScale).floor();
    const scaledXp = D(template.xpDrop).times(zoneScale).floor();

    currentEnemy = {
      id: template.id,
      name: template.name,
      maxHp: scaledHp,
      hp: scaledHp,
      attack: scaledAtk,
      goldDrop: scaledGold.toString(),
      xpDrop: scaledXp.toString(),
      lootTable: template.lootTable,
      isBoss: false,
    };

    emit(EVENTS.COMBAT_ENEMY_SPAWNED, {
      enemyId: currentEnemy.id,
      name: currentEnemy.name,
      maxHp: currentEnemy.maxHp,
      isBoss: false,
    });
  },

  /** Spawn a boss enemy (called by BossManager via BossChallenge UI). */
  spawnBoss(bossTemplate) {
    // Cancel any pending spawn
    TimeEngine.unregister('combat:spawnDelay');
    currentEnemy = null;

    const maxHp = D(bossTemplate.hp);
    currentEnemy = {
      id: bossTemplate.id,
      name: bossTemplate.name,
      maxHp,
      hp: maxHp,
      attack: bossTemplate.attack,
      goldDrop: bossTemplate.goldDrop,
      xpDrop: bossTemplate.xpDrop,
      lootTable: bossTemplate.lootTable,
      isBoss: true,
      bossType: bossTemplate.bossType,
    };

    emit(EVENTS.COMBAT_ENEMY_SPAWNED, {
      enemyId: bossTemplate.baseEnemyId || bossTemplate.id,
      name: currentEnemy.name,
      maxHp: currentEnemy.maxHp,
      isBoss: true,
      bossType: bossTemplate.bossType,
      spriteSize: bossTemplate.spriteSize || null,
    });
  },

  playerAttack(isClick = false) {
    if (!currentEnemy) return;

    const state = Store.getState();
    const { damage, isCrit } = CombatEngine.getPlayerDamage(state, isClick);

    currentEnemy.hp = Decimal.max(currentEnemy.hp.minus(damage), 0);

    emit(EVENTS.COMBAT_ENEMY_DAMAGED, {
      enemyId: currentEnemy.id,
      amount: damage,
      isCrit,
      remainingHp: currentEnemy.hp,
      maxHp: currentEnemy.maxHp,
    });

    if (currentEnemy.hp.lte(0)) {
      CombatEngine._onEnemyDeath();
    }
  },

  getPlayerDamage(state, isClick = false) {
    const baseDamage = getBaseDamage();
    const prestigeMult = state.prestigeMultiplier;
    const clickDmgMult = isClick ? UpgradeManager.getMultiplier('clickDamage') : 1;
    const critChance = getCritChance();

    // Forced crit from FirstCrackDirector consumes the override
    let isCrit;
    let critMult;
    if (forcedCritMultiplier != null) {
      isCrit = true;
      critMult = forcedCritMultiplier;
      forcedCritMultiplier = null;
    } else {
      isCrit = Math.random() < critChance;
      // After crack, crits are permanently 10x
      const baseCritMult = state.flags.crackTriggered ? 10 : COMBAT.critMultiplier;
      critMult = isCrit ? baseCritMult : 1;
    }

    const damage = D(baseDamage).times(clickDmgMult).times(prestigeMult).times(critMult)
      .times(TerritoryManager.getBuffMultiplier('baseDamage')).floor();
    return { damage, isCrit };
  },

  setForcedCrit(mult) {
    forcedCritMultiplier = mult;
  },

  getCurrentEnemy() {
    if (!currentEnemy) return null;
    return {
      id: currentEnemy.id,
      name: currentEnemy.name,
      hp: currentEnemy.hp,
      maxHp: currentEnemy.maxHp,
      isBoss: currentEnemy.isBoss || false,
    };
  },

  enemyAttack() {
    if (!currentEnemy) return;
    const damage = currentEnemy.attack;
    Store.damagePlayer(damage);
  },

  _regenPlayerHp() {
    const maxHp = getEffectiveMaxHp();
    const regenAmount = maxHp.times(COMBAT.playerRegenPercent)
      .times(TerritoryManager.getBuffMultiplier('hpRegen'));
    Store.healPlayer(regenAmount);
  },

  /** Delegates to ComputedStats.getEffectiveMaxHp(). Kept for backward compat. */
  getEffectiveMaxHp() {
    return getEffectiveMaxHp();
  },

  _onPlayerDeath() {
    // Pause combat
    TimeEngine.setEnabled('combat:autoAttack', false);
    TimeEngine.setEnabled('combat:enemyAttack', false);
    TimeEngine.setEnabled('combat:playerRegen', false);

    // If fighting a boss, cancel the boss fight
    if (currentEnemy && currentEnemy.isBoss) {
      BossManager.cancelBoss();
    }
    currentEnemy = null;

    // Respawn after delay
    TimeEngine.scheduleOnce('combat:playerRespawn', () => {
      Store.resetPlayerHp();
      TimeEngine.setEnabled('combat:autoAttack', true);
      TimeEngine.setEnabled('combat:enemyAttack', true);
      TimeEngine.setEnabled('combat:playerRegen', true);
      CombatEngine.spawnEnemy();
    }, COMBAT.playerDeathRespawnDelay);
  },

  _onEnemyDeath() {
    const dead = currentEnemy;
    currentEnemy = null;

    // Reward orchestration lives in Progression
    Progression.grantKillRewards(dead);

    emit(EVENTS.COMBAT_ENEMY_KILLED, {
      enemyId: dead.id, name: dead.name, lootTable: dead.lootTable,
      isBoss: dead.isBoss || false,
    });

    // If boss was killed, delay zone advancement so the death sprite can play
    // (1000ms hold + 300ms fade in GameScene)
    if (dead.isBoss) {
      TimeEngine.scheduleOnce('combat:bossDefeatedDelay', () => {
        BossManager.onBossDefeated();
      }, 1300);
      return;
    }

    TimeEngine.scheduleOnce('combat:spawnDelay', () => {
      CombatEngine.spawnEnemy();
    }, COMBAT.spawnDelay);
  },
};

export default CombatEngine;
