// OfflineProgress — rate-based offline reward engine.
// Computes coarse rewards (gold/sec × seconds) on load, applies them once.

import Store from './Store.js';
import Progression from './Progression.js';
import { D } from './BigNum.js';
import { getEffectiveDamage, getCritChance, getCritMultiplier, getAutoAttackInterval, getGoldMultiplier, getXpMultiplier } from './ComputedStats.js';
import { getUnlockedEnemies, getZoneScaling } from '../data/areas.js';
import { SAVE, ECONOMY, COMBAT_V2 } from '../config.js';
import TerritoryManager from './TerritoryManager.js';

let lastResult = null;

/**
 * Format milliseconds into a human-readable duration string.
 * e.g. 8_100_000 → "2h 15m"
 */
function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

const OfflineProgress = {
  /**
   * Compute and apply offline rewards. Call once after all systems are initialized
   * and state is hydrated. Stores the result for UI consumption.
   */
  apply() {
    lastResult = null;
    const state = Store.getState();

    // Skip fresh game (never saved)
    if (!state.timestamps.lastOnline) return;

    const offlineMs = Math.min(
      Math.max(Date.now() - state.timestamps.lastOnline, 0),
      SAVE.maxOfflineTime
    );

    // Skip quick reloads
    if (offlineMs < SAVE.minOfflineTime) return;

    const offlineSeconds = offlineMs / 1000;

    // ── Enemy pool with zone scaling ──────────────────────────────
    const enemies = getUnlockedEnemies(state.currentArea, state.currentZone);
    if (enemies.length === 0) return;

    const scaling = getZoneScaling(state.currentZone);

    let totalHp = 0;
    let totalGold = 0;
    let totalXp = 0;
    for (const e of enemies) {
      totalHp += Number(e.hp) * scaling;
      totalGold += Number(e.goldDrop) * scaling;
      totalXp += Number(e.xpDrop) * scaling;
    }
    const avgHp = totalHp / enemies.length;
    const avgGold = totalGold / enemies.length;
    const avgXp = totalXp / enemies.length;

    // ── Player DPS ────────────────────────────────────────────────
    const effectiveDamage = getEffectiveDamage();
    const critChance = getCritChance();
    const critMult = getCritMultiplier();
    const critFactor = (1 - critChance) + critChance * critMult;
    const attackInterval = getAutoAttackInterval() / 1000; // seconds
    const playerDps = effectiveDamage * critFactor / attackInterval;

    if (playerDps <= 0) return;

    // ── Kill cycle time ───────────────────────────────────────────
    const timePerKill = (avgHp / playerDps) + (COMBAT_V2.spawnDelay / 1000);
    if (timePerKill <= 0) return;

    const estimatedKills = Math.floor(offlineSeconds / timePerKill);
    if (estimatedKills <= 0) return;

    // ── Rewards ───────────────────────────────────────────────────
    const goldGained = D(Math.floor(estimatedKills * avgGold)).times(getGoldMultiplier()).floor();
    const xpGained = D(Math.floor(estimatedKills * avgXp)).times(getXpMultiplier()).floor();

    let fragmentsGained = 0;
    if (state.flags.crackTriggered) {
      const fragMult = TerritoryManager.getBuffMultiplier('fragmentGain');
      fragmentsGained = Math.floor(estimatedKills * ECONOMY.fragmentDropChance * fragMult);
    }

    // Record level before applying
    const levelBefore = state.playerStats.level;

    // Apply rewards
    Store.addGold(goldGained);
    Progression.grantXp(xpGained);
    if (fragmentsGained > 0) Store.addFragments(fragmentsGained);

    // Sync HP with any HP gained from level-ups
    Store.resetPlayerHp();

    const levelsGained = state.playerStats.level - levelBefore;

    lastResult = {
      elapsedMs: offlineMs,
      goldGained,
      xpGained,
      fragmentsGained,
      levelsGained,
      durationText: formatDuration(offlineMs),
    };
  },

  /** Returns the stored result, or null if no offline rewards were applied. */
  getLastResult() {
    return lastResult;
  },

  /** Clear the stored result after UI has consumed it. */
  clearResult() {
    lastResult = null;
  },
};

export default OfflineProgress;
