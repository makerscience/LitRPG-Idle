// CombatEngine — core combat module. No Phaser dependency.
// All callbacks reference CombatEngine.method() by name to avoid `this` binding issues.

import Store from './Store.js';
import TimeEngine from './TimeEngine.js';
import BossManager from './BossManager.js';
import Progression from './Progression.js';
import { D, Decimal } from './BigNum.js';
import { createScope, emit, EVENTS } from '../events.js';
import { COMBAT_V2 } from '../config.js';
import { getUnlockedEnemies, getZoneScaling } from '../data/areas.js';
import UpgradeManager from './UpgradeManager.js';
import TerritoryManager from './TerritoryManager.js';
import { getEffectiveMaxHp, getBaseDamage, getCritChance, getEffectiveDef, getPlayerAutoAttackInterval, getHpRegen } from './ComputedStats.js';

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
      getPlayerAutoAttackInterval(),
      true,
    );

    // Re-register auto-attack when speed upgrade purchased
    scope.on(EVENTS.UPG_PURCHASED, (data) => {
      if (data.upgradeId === 'auto_attack_speed') {
        TimeEngine.register(
          'combat:autoAttack',
          () => CombatEngine.playerAttack(),
          getPlayerAutoAttackInterval(),
          true,
        );
      }
    });

    // Re-register auto-attack when equipment changes (atkSpeed from gear may change)
    scope.on(EVENTS.INV_ITEM_EQUIPPED, () => {
      TimeEngine.register(
        'combat:autoAttack',
        () => CombatEngine.playerAttack(),
        getPlayerAutoAttackInterval(),
        true,
      );
    });

    // Player HP regen — fires every 1s
    TimeEngine.register(
      'combat:playerRegen',
      () => CombatEngine._regenPlayerHp(),
      1000,
      true,
    );

    // Subscribe to player death
    scope.on(EVENTS.COMBAT_PLAYER_DIED, () => {
      CombatEngine._onPlayerDeath();
    });

    // On level-up, restore HP to new max
    scope.on(EVENTS.PROG_LEVEL_UP, () => {
      Store.resetPlayerHp();
    });

    // Re-register auto-attack when territory attack speed buff is claimed
    scope.on(EVENTS.TERRITORY_CLAIMED, (data) => {
      if (data.buff.key === 'autoAttackSpeed') {
        TimeEngine.register(
          'combat:autoAttack',
          () => CombatEngine.playerAttack(),
          getPlayerAutoAttackInterval(),
          true,
        );
      }
    });

    // Subscribe to zone changes — spawn new enemy (not boss)
    scope.on(EVENTS.WORLD_ZONE_CHANGED, () => {
      // Cancel pending spawn delay
      TimeEngine.unregister('combat:spawnDelay');
      TimeEngine.unregister('combat:enemyAttack');
      CombatEngine._stopDot();
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
    TimeEngine.unregister('combat:enemyDot');
    TimeEngine.unregister('combat:playerRegen');
    TimeEngine.unregister('combat:playerRespawn');
    scope?.destroy();
    scope = null;
    currentEnemy = null;
  },

  /** Register per-enemy attack timer based on enemy's attackSpeed. */
  _registerEnemyAttackTimer() {
    if (!currentEnemy) return;
    const speed = currentEnemy.attackSpeed ?? 1.0;
    const interval = Math.max(400, Math.floor(COMBAT_V2.baseAttackIntervalMs / speed));
    TimeEngine.register(
      'combat:enemyAttack',
      () => CombatEngine.enemyAttack(),
      interval,
      true,
    );
  },

  /** Start DoT ticker if current enemy has a dot field. */
  _startDot() {
    if (!currentEnemy || !currentEnemy.dot) return;
    const dot = currentEnemy.dot;
    let dotTickCount = 0;
    TimeEngine.register(
      'combat:enemyDot',
      () => {
        // Flat damage bypasses defense
        Store.damagePlayer(dot);
        dotTickCount++;
        emit(EVENTS.COMBAT_DOT_TICK, {
          damage: dot,
          tickNumber: dotTickCount,
        });
      },
      1000,
      true,
    );
  },

  /** Stop DoT ticker. */
  _stopDot() {
    TimeEngine.unregister('combat:enemyDot');
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

    const scaledHp = D(template.hp).times(getZoneScaling(zone, 'hp')).floor();
    const scaledAtk = Math.floor(template.attack * getZoneScaling(zone, 'atk'));
    const scaledGold = D(template.goldDrop).times(getZoneScaling(zone, 'gold')).floor();
    const scaledXp = D(template.xpDrop).times(getZoneScaling(zone, 'xp')).floor();

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
      defense: template.defense ?? 0,
      armorPen: template.armorPen ?? 0,
      attackSpeed: template.attackSpeed ?? 1.0,
      dot: template.dot ?? null,
    };

    emit(EVENTS.COMBAT_ENEMY_SPAWNED, {
      enemyId: currentEnemy.id,
      name: currentEnemy.name,
      maxHp: currentEnemy.maxHp,
      isBoss: false,
      armorPen: currentEnemy.armorPen,
      dot: currentEnemy.dot,
      defense: currentEnemy.defense,
    });

    CombatEngine._registerEnemyAttackTimer();
    CombatEngine._startDot();
  },

  /** Spawn a boss enemy (called by BossManager via BossChallenge UI). */
  spawnBoss(bossTemplate) {
    // Cancel any pending spawn
    TimeEngine.unregister('combat:spawnDelay');
    TimeEngine.unregister('combat:enemyAttack');
    CombatEngine._stopDot();
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
      defense: bossTemplate.defense ?? 0,
      armorPen: bossTemplate.armorPen ?? 0,
      attackSpeed: bossTemplate.attackSpeed ?? 1.0,
      dot: bossTemplate.dot ?? null,
    };

    emit(EVENTS.COMBAT_ENEMY_SPAWNED, {
      enemyId: bossTemplate.baseEnemyId || bossTemplate.id,
      name: currentEnemy.name,
      maxHp: currentEnemy.maxHp,
      isBoss: true,
      bossType: bossTemplate.bossType,
      spriteSize: bossTemplate.spriteSize || null,
      spriteOffsetY: bossTemplate.spriteOffsetY ?? null,
      armorPen: currentEnemy.armorPen,
      dot: currentEnemy.dot,
      defense: currentEnemy.defense,
    });

    CombatEngine._registerEnemyAttackTimer();
    CombatEngine._startDot();
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
    const str = getBaseDamage();
    const enemyDef = currentEnemy?.defense ?? 0;
    const rawDamage = COMBAT_V2.playerDamage(str, enemyDef);

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
      const baseCritMult = state.flags.crackTriggered ? 10 : (COMBAT_V2.critMultiplier ?? 2);
      critMult = isCrit ? baseCritMult : 1;
    }

    const damage = D(rawDamage).times(clickDmgMult).times(prestigeMult).times(critMult)
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
    const playerDef = getEffectiveDef();
    const armorPen = currentEnemy.armorPen ?? 0;
    const damage = COMBAT_V2.enemyDamage(currentEnemy.attack, playerDef, armorPen);
    Store.damagePlayer(damage);
  },

  _regenPlayerHp() {
    const regenAmount = getHpRegen();
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
    CombatEngine._stopDot();

    // If fighting a boss, cancel the boss fight
    if (currentEnemy && currentEnemy.isBoss) {
      BossManager.cancelBoss();
    }
    currentEnemy = null;

    // Respawn after delay
    TimeEngine.scheduleOnce('combat:playerRespawn', () => {
      Store.resetPlayerHp();
      TimeEngine.setEnabled('combat:autoAttack', true);
      TimeEngine.setEnabled('combat:playerRegen', true);
      CombatEngine.spawnEnemy();
    }, COMBAT_V2.playerDeathRespawnDelay);
  },

  _onEnemyDeath() {
    const dead = currentEnemy;

    // Stop DoT and enemy attack before nulling
    CombatEngine._stopDot();
    TimeEngine.unregister('combat:enemyAttack');
    currentEnemy = null;

    // Reward orchestration lives in Progression
    Progression.grantKillRewards(dead);

    emit(EVENTS.COMBAT_ENEMY_KILLED, {
      enemyId: dead.id, name: dead.name, lootTable: dead.lootTable,
      isBoss: dead.isBoss || false,
    });

    // If boss was killed, delay zone advancement so the death anim can play
    // (120ms knockback + 200ms slide-away in GameScene, plus breathing room)
    if (dead.isBoss) {
      TimeEngine.scheduleOnce('combat:bossDefeatedDelay', () => {
        BossManager.onBossDefeated();
      }, 500);
      return;
    }

    TimeEngine.scheduleOnce('combat:spawnDelay', () => {
      CombatEngine.spawnEnemy();
    }, COMBAT_V2.spawnDelay);
  },
};

export default CombatEngine;
