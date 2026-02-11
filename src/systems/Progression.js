// Progression — XP/level loop and kill reward orchestration.
// Owns the multi-level-up logic and reward math; Store provides the raw mutation primitives.

import Store from './Store.js';
import { D } from './BigNum.js';
import { getGoldMultiplier, getXpMultiplier } from './ComputedStats.js';

const Progression = {
  /**
   * Grant XP and process any resulting level-ups.
   * This is the only entry point for XP gains — replaces Store.addXp().
   */
  grantXp(amount) {
    Store.addRawXp(D(amount));

    const state = Store.getState();
    while (state.playerStats.xp.gte(state.playerStats.xpToNext)) {
      Store.applyLevelUp();
    }
  },

  /**
   * Process all rewards for killing an enemy: kill counters, gold, XP.
   * Called by CombatEngine on enemy death — single source of truth for kill tracking.
   */
  grantKillRewards(enemy) {
    Store.incrementKills();
    Store.incrementEnemyKills(enemy.id);

    // Zone clear kills drive boss thresholds — boss kills don't count
    if (!enemy.isBoss) {
      const state = Store.getState();
      Store.incrementZoneClearKills(state.currentArea, state.currentZone);
    }

    const goldAmount = D(enemy.goldDrop).times(getGoldMultiplier()).floor();
    Store.addGold(goldAmount);

    const xpAmount = D(enemy.xpDrop).times(getXpMultiplier()).floor();
    Progression.grantXp(xpAmount);
  },
};

export default Progression;
