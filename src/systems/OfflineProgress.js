// OfflineProgress — rate-based offline reward engine.
// Computes coarse rewards (gold/sec × seconds) on load, applies them once.

import Store from './Store.js';
import Progression from './Progression.js';
import { D } from './BigNum.js';
import { getEffectiveDamage, getCritChance, getCritMultiplier, getAutoAttackInterval, getGoldMultiplier, getXpMultiplier } from './ComputedStats.js';
import { getUnlockedEnemies, getZoneScaling, getZoneBias, getArea } from '../data/areas.js';
import { getEncountersForZone } from '../data/encounters.js';
import { getEnemyById } from '../data/enemies.js';
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

    // ── Encounter pool with zone scaling ─────────────────────────
    const encounterPool = getEncountersForZone(state.currentArea, state.currentZone);
    if (encounterPool.length === 0) return;

    const offlineArea = getArea(state.currentArea);
    const offlineGlobalZone = offlineArea ? offlineArea.zoneStart + state.currentZone - 1 : state.currentZone;
    const hpScale   = getZoneScaling(state.currentZone, 'hp')   * getZoneBias(offlineGlobalZone, 'hp');
    const goldScale = getZoneScaling(state.currentZone, 'gold') * getZoneBias(offlineGlobalZone, 'gold');
    const xpScale   = getZoneScaling(state.currentZone, 'xp')   * getZoneBias(offlineGlobalZone, 'xp');

    // Weighted average across encounter templates
    let weightedHp = 0;
    let weightedGold = 0;
    let weightedXp = 0;
    let totalWeight = 0;
    for (const { template, weight } of encounterPool) {
      let encHp = 0;
      let encGold = 0;
      let encXp = 0;
      for (const memberId of template.members) {
        const enemy = getEnemyById(memberId);
        if (!enemy) continue;
        encHp += Number(enemy.hp) * hpScale;
        encGold += Number(enemy.goldDrop) * goldScale;
        encXp += Number(enemy.xpDrop) * xpScale;
      }
      // Apply encounter reward multiplier
      encGold *= template.rewardMult;
      encXp *= template.rewardMult;

      weightedHp += encHp * weight;
      weightedGold += encGold * weight;
      weightedXp += encXp * weight;
      totalWeight += weight;
    }
    if (totalWeight === 0) return;

    const avgHp = weightedHp / totalWeight;
    const avgGold = weightedGold / totalWeight;
    const avgXp = weightedXp / totalWeight;

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
