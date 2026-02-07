// CombatEngine — core combat module. No Phaser dependency.
// All callbacks reference CombatEngine.method() by name to avoid `this` binding issues.

import Store from './Store.js';
import TimeEngine from './TimeEngine.js';
import { D, Decimal } from './BigNum.js';
import { emit, on, EVENTS } from '../events.js';
import { DAMAGE_FORMULAS, COMBAT } from '../config.js';
import { getRandomEnemy } from '../data/enemies.js';
import InventorySystem from './InventorySystem.js';
import UpgradeManager from './UpgradeManager.js';

let currentEnemy = null;
let unsubs = [];
let forcedCritMultiplier = null;

const CombatEngine = {
  init() {
    // Register auto-attack ticker (enabled by default — it's an idle game)
    TimeEngine.register(
      'combat:autoAttack',
      () => CombatEngine.playerAttack(),
      COMBAT.autoAttackInterval,
      true,
    );

    // Re-register auto-attack when speed upgrade purchased
    unsubs.push(on(EVENTS.UPG_PURCHASED, (data) => {
      if (data.upgradeId === 'auto_attack_speed') {
        TimeEngine.register(
          'combat:autoAttack',
          () => CombatEngine.playerAttack(),
          UpgradeManager.getAutoAttackInterval(),
          true,
        );
      }
    }));

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
    unsubs.push(on(EVENTS.COMBAT_PLAYER_DIED, () => {
      CombatEngine._onPlayerDeath();
    }));

    // On level-up, restore HP to new max (VIT increases)
    unsubs.push(on(EVENTS.PROG_LEVEL_UP, () => {
      Store.resetPlayerHp();
    }));

    // Subscribe to zone changes
    unsubs.push(on(EVENTS.WORLD_ZONE_CHANGED, () => {
      // Cancel pending spawn delay
      TimeEngine.unregister('combat:spawnDelay');
      currentEnemy = null;
      CombatEngine.spawnEnemy();
    }));

    // Spawn first enemy
    CombatEngine.spawnEnemy();
  },

  destroy() {
    TimeEngine.unregister('combat:autoAttack');
    TimeEngine.unregister('combat:spawnDelay');
    TimeEngine.unregister('combat:enemyAttack');
    TimeEngine.unregister('combat:playerRegen');
    TimeEngine.unregister('combat:playerRespawn');
    for (const unsub of unsubs) unsub();
    unsubs = [];
    currentEnemy = null;
  },

  spawnEnemy() {
    const state = Store.getState();
    const template = getRandomEnemy(state.currentZone);
    if (!template) return;

    const maxHp = D(template.hp);
    currentEnemy = {
      id: template.id,
      name: template.name,
      maxHp,
      hp: maxHp,
      attack: template.attack,
      goldDrop: template.goldDrop,
      xpDrop: template.xpDrop,
      lootTable: template.lootTable,
    };

    emit(EVENTS.COMBAT_ENEMY_SPAWNED, {
      enemyId: currentEnemy.id,
      name: currentEnemy.name,
      maxHp: currentEnemy.maxHp,
    });
  },

  playerAttack() {
    if (!currentEnemy) return;

    const state = Store.getState();
    const { damage, isCrit } = CombatEngine.getPlayerDamage(state);

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

  getPlayerDamage(state) {
    const str = state.playerStats.str;
    const wpnDmg = InventorySystem.getEquippedWeaponDamage();
    const baseDamage = DAMAGE_FORMULAS.mortal(str, wpnDmg);
    const prestigeMult = state.prestigeMultiplier;
    const clickDmgMult = UpgradeManager.getMultiplier('clickDamage');

    // Crit chance includes flat bonus from upgrades
    const critChance = COMBAT.critChance + UpgradeManager.getFlatBonus('critChance');

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

    const damage = D(baseDamage).times(clickDmgMult).times(prestigeMult).times(critMult).floor();
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
    };
  },

  enemyAttack() {
    if (!currentEnemy) return;
    const damage = currentEnemy.attack;
    Store.damagePlayer(damage);
  },

  _regenPlayerHp() {
    const maxHp = Store.getPlayerMaxHp();
    const regenAmount = maxHp.times(COMBAT.playerRegenPercent);
    Store.healPlayer(regenAmount);
  },

  _onPlayerDeath() {
    // Pause combat
    TimeEngine.setEnabled('combat:autoAttack', false);
    TimeEngine.setEnabled('combat:enemyAttack', false);
    TimeEngine.setEnabled('combat:playerRegen', false);
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

    Store.incrementKills();
    emit(EVENTS.COMBAT_ENEMY_KILLED, { enemyId: dead.id, name: dead.name, lootTable: dead.lootTable });

    const state = Store.getState();
    const goldAmount = D(dead.goldDrop)
      .times(UpgradeManager.getMultiplier('goldMultiplier'))
      .times(state.prestigeMultiplier)
      .floor();
    Store.addGold(goldAmount);
    Store.addXp(D(dead.xpDrop).times(state.prestigeMultiplier).floor());

    TimeEngine.scheduleOnce('combat:spawnDelay', () => {
      CombatEngine.spawnEnemy();
    }, COMBAT.spawnDelay);
  },
};

export default CombatEngine;
