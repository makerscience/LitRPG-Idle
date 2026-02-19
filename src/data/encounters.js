// Encounter templates — define weighted spawn options per zone range.
// Solo encounters are auto-generated for any enemy without a multi-member template.
// zones use global zone numbers (matching enemy zone ranges in enemies.js).

import { getUnlockedEnemies } from './areas.js';

// ── Authored multi-member encounters ─────────────────────────────────

const ENCOUNTERS = [
  // ── Area 1: The Harsh Threshold (global zones 1-5) ────────────────

  // Early zones: weak packs, roughly same total difficulty as a solo medium enemy
  {
    id: 'a1_slime_pair',
    members: ['a1_hollow_slime', 'a1_hollow_slime'],
    weight: 2,
    zones: [1, 2],
    attackSpeedMult: 1.0,
    rewardMult: 1.0,
    lootBonus: { dropChanceMult: 1.0, rarityBoost: 0 },
  },
  {
    id: 'a1_rat_pair',
    members: ['a1_forest_rat', 'a1_forest_rat'],
    weight: 2,
    zones: [1, 2],
    attackSpeedMult: 1.0,
    rewardMult: 1.0,
    lootBonus: { dropChanceMult: 1.0, rarityBoost: 0 },
  },
  {
    id: 'a1_rat_pack',
    members: ['a1_forest_rat', 'a1_forest_rat', 'a1_forest_rat'],
    weight: 2,
    zones: [2, 3],
    attackSpeedMult: 1.0,
    rewardMult: 1.0,
    lootBonus: { dropChanceMult: 1.0, rarityBoost: 0 },
  },
  {
    id: 'a1_wolf_pair',
    members: ['a1_feral_hound', 'a1_feral_hound'],
    weight: 1,
    zones: [2, 5],
    attackSpeedMult: 0.7,
    rewardMult: 1.15,
    lootBonus: { dropChanceMult: 1.1, rarityBoost: 0 },
  },

  // Late zones: strong groups as gear-check
  {
    id: 'a1_boar_duo',
    members: ['a1_thornback_boar', 'a1_thornback_boar'],
    weight: 1,
    zones: [2, 5],
    attackSpeedMult: 0.5,
    rewardMult: 1.3,
    lootBonus: { dropChanceMult: 1.3, rarityBoost: 0.05 },
  },
];

// ── Encounter pool builder ───────────────────────────────────────────

/**
 * Build a solo encounter wrapper for an enemy template.
 * Used for any enemy that isn't part of an authored multi-member encounter.
 */
export function getSoloEncounter(enemyTemplate) {
  return {
    id: `solo_${enemyTemplate.id}`,
    members: [enemyTemplate.id],
    weight: 3,
    attackSpeedMult: 1.0,
    rewardMult: 1.0,
    lootBonus: { dropChanceMult: 1.0, rarityBoost: 0 },
  };
}

/**
 * Get the weighted encounter pool for a given area + zone.
 * Combines authored multi-member encounters with auto-generated solo wrappers.
 * Returns array of { template, weight } objects for weighted random selection.
 */
export function getEncountersForZone(areaId, zoneNum) {
  // Import dynamically would be circular — areas.js already resolves this
  const area = _getArea(areaId);
  if (!area) return [];
  const globalZone = area.zoneStart + zoneNum - 1;

  const pool = [];

  // 1. Add authored multi-member encounters whose zone range covers this zone
  for (const enc of ENCOUNTERS) {
    if (globalZone >= enc.zones[0] && globalZone <= enc.zones[1]) {
      pool.push({ template: enc, weight: enc.weight });
    }
  }

  // 2. Add solo wrappers for all unlocked enemies at this zone
  const enemies = getUnlockedEnemies(areaId, zoneNum);
  for (const enemy of enemies) {
    pool.push({ template: getSoloEncounter(enemy), weight: 3 });
  }

  return pool;
}

/**
 * Pick a weighted random encounter template from the pool.
 * Returns the encounter template object, or null if pool is empty.
 */
export function pickRandomEncounter(areaId, zoneNum) {
  const pool = getEncountersForZone(areaId, zoneNum);
  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.template;
  }

  // Fallback (shouldn't reach here due to float precision)
  return pool[pool.length - 1].template;
}

// ── Area lookup (avoid circular import with areas.js) ────────────────

// Inline minimal area data to avoid importing AREAS from areas.js
// (areas.js already imports from enemies.js; adding encounters.js → areas.js
//  would create a potential import cycle)
const _AREA_ZONE_STARTS = { 1: 1, 2: 6, 3: 16 };

function _getArea(areaId) {
  const zoneStart = _AREA_ZONE_STARTS[areaId];
  if (zoneStart == null) return null;
  return { zoneStart };
}

export { ENCOUNTERS };
