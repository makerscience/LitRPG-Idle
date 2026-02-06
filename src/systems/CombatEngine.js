// CombatEngine — core combat module. No Phaser dependency.
// All callbacks reference CombatEngine.method() by name to avoid `this` binding issues.

import Store from './Store.js';
import TimeEngine from './TimeEngine.js';
import { D, Decimal } from './BigNum.js';
import { emit, on, EVENTS } from '../events.js';
import { DAMAGE_FORMULAS, COMBAT } from '../config.js';
import { getRandomEnemy } from '../data/enemies.js';

let currentEnemy = null;
let unsubs = [];

const CombatEngine = {
  init() {
    // Register auto-attack ticker (disabled until Phase 3 or settings toggle)
    TimeEngine.register(
      'combat:autoAttack',
      () => CombatEngine.playerAttack(),
      COMBAT.autoAttackInterval,
      false,
    );

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
    const wpnDmg = 0; // No weapons until Phase 4
    const baseDamage = DAMAGE_FORMULAS.mortal(str, wpnDmg);
    const prestigeMult = state.prestigeMultiplier;

    const isCrit = Math.random() < COMBAT.critChance;
    const critMult = isCrit ? COMBAT.critMultiplier : 1;

    const damage = D(baseDamage).times(prestigeMult).times(critMult).floor();
    return { damage, isCrit };
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

  _onEnemyDeath() {
    const dead = currentEnemy;
    currentEnemy = null;

    emit(EVENTS.COMBAT_ENEMY_KILLED, { enemyId: dead.id, name: dead.name });

    Store.addGold(dead.goldDrop);
    Store.addXp(dead.xpDrop);

    TimeEngine.scheduleOnce('combat:spawnDelay', () => {
      CombatEngine.spawnEnemy();
    }, COMBAT.spawnDelay);
  },
};

export default CombatEngine;
