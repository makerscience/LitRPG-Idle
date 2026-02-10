// TerritoryManager — tracks territory conquest, kill progress, and buff aggregation.
// Singleton following PrestigeManager pattern (init/destroy, unsubs array).

import Store from './Store.js';
import { on, emit, EVENTS } from '../events.js';
import { D } from './BigNum.js';
import { getAllTerritories, getTerritory } from '../data/territories.js';

let unsubs = [];

const TerritoryManager = {
  init() {
    unsubs.push(on(EVENTS.COMBAT_ENEMY_KILLED, (data) => {
      Store.incrementEnemyKills(data.enemyId);
    }));
  },

  destroy() {
    for (const unsub of unsubs) unsub();
    unsubs = [];
  },

  isConquered(territoryId) {
    return !!Store.getState().territories[territoryId]?.conquered;
  },

  getKillProgress(territoryId) {
    const t = getTerritory(territoryId);
    const current = Store.getState().killsPerEnemy[t.enemyId] || 0;
    return { current, required: t.killsRequired, ratio: Math.min(1, current / t.killsRequired) };
  },

  canClaim(territoryId) {
    if (this.isConquered(territoryId)) return false;
    const t = getTerritory(territoryId);
    const state = Store.getState();
    const kills = state.killsPerEnemy[t.enemyId] || 0;
    if (kills < t.killsRequired) return false;
    return state.gold.gte(D(t.goldCost));
  },

  claim(territoryId) {
    if (!this.canClaim(territoryId)) return false;
    const t = getTerritory(territoryId);
    Store.spendGold(t.goldCost);
    Store.conquerTerritory(territoryId);
    emit(EVENTS.TERRITORY_CLAIMED, { territoryId, name: t.name, buff: t.buff });
    emit(EVENTS.SAVE_REQUESTED, {});
    return true;
  },

  /** Sum buff values from all conquered territories matching buffKey. */
  getBuffValue(buffKey) {
    const state = Store.getState();
    let sum = 0;
    for (const t of getAllTerritories()) {
      if (state.territories[t.id]?.conquered && t.buff.key === buffKey) {
        sum += t.buff.value;
      }
    }
    return sum;
  },

  /** Returns 1 + sum for multiplier-style buffs. */
  getBuffMultiplier(buffKey) {
    return 1 + this.getBuffValue(buffKey);
  },

  getConqueredCount() {
    return Object.values(Store.getState().territories).filter(t => t.conquered).length;
  },
};

export default TerritoryManager;
