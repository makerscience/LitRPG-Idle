// V2 area definitions — 3 areas, 30 total zones.
// Enemies use zone-range filtering instead of area field matching.

import { ENEMIES } from './enemies.js';

const AREAS = {
  1: {
    id: 1,
    name: 'The Harsh Threshold',
    zoneCount: 5,
    zoneStart: 1,
    enemies: () => getEnemiesForArea(1),
  },
  2: {
    id: 2,
    name: 'The Overgrown Frontier',
    zoneCount: 10,
    zoneStart: 6,
    enemies: () => getEnemiesForArea(2),
  },
  3: {
    id: 3,
    name: 'The Broken Road',
    zoneCount: 15,
    zoneStart: 16,
    enemies: () => getEnemiesForArea(3),
  },
};

/** Total zones across all areas. */
export const TOTAL_ZONES = 30;

/** Number of areas. */
export const AREA_COUNT = 3;

// ── Boss multipliers ────────────────────────────────────────────────

export const BOSS_TYPES = {
  MINI:  { label: 'Mini-Boss',       hpMult: 6,  atkMult: 3,   sizeMult: 1.5 },
  ELITE: { label: 'Elite Mini-Boss', hpMult: 5,  atkMult: 2,   sizeMult: 1.5 },
  AREA:  { label: 'Area Boss',       hpMult: 8,  atkMult: 2.5, sizeMult: 2 },
};

// ── Zone scaling ────────────────────────────────────────────────────

/** Stat multiplier applied to regular enemies based on zone number within an area. */
export function getZoneScaling(zoneNum) {
  return 1 + (zoneNum - 1) * 0.15;
}

/** Kill threshold to trigger "Challenge Boss" button. */
export function getBossKillThreshold(zoneNum) {
  return 10 + (zoneNum - 1) * 5;
}

/** Gold/XP drop multiplier for bosses: base × hpMult × 1.5 */
export function getBossDropMultiplier(bossType) {
  return bossType.hpMult * 1.5;
}

// ── Boss type resolution ────────────────────────────────────────────

/**
 * Returns the boss type for a given zone within an area.
 * - Last zone of area: AREA boss
 * - Every 5th zone: ELITE mini-boss
 * - All other zones: MINI boss
 */
export function getBossType(areaId, zoneNum) {
  const area = AREAS[areaId];
  if (!area) return BOSS_TYPES.MINI;

  if (zoneNum === area.zoneCount) return BOSS_TYPES.AREA;
  if (zoneNum % 5 === 0) return BOSS_TYPES.ELITE;
  return BOSS_TYPES.MINI;
}

// ── Enemy access helpers ────────────────────────────────────────────

/**
 * Get all enemies whose zone range overlaps with an area's zone range.
 * Sorted by HP ascending (unlock order).
 */
function getEnemiesForArea(areaId) {
  const area = AREAS[areaId];
  if (!area) return [];
  const start = area.zoneStart;
  const end = start + area.zoneCount - 1;
  return ENEMIES
    .filter(e => e.zones[1] >= start && e.zones[0] <= end)
    .sort((a, b) => a.hp - b.hp);
}

/**
 * Get the enemies available at a specific zone within an area.
 * Uses zone-range filtering: enemy is available if globalZone falls within its [min, max] range.
 */
export function getUnlockedEnemies(areaId, zoneNum) {
  const area = AREAS[areaId];
  if (!area) return [];
  const globalZone = area.zoneStart + zoneNum - 1;
  return ENEMIES
    .filter(e => globalZone >= e.zones[0] && globalZone <= e.zones[1])
    .sort((a, b) => a.hp - b.hp);
}

/**
 * Get the strongest enemy available at a specific zone within an area.
 * Used as the base template for boss stat scaling.
 */
export function getStrongestEnemy(areaId, zoneNum) {
  const unlocked = getUnlockedEnemies(areaId, zoneNum);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

export function getArea(areaId) {
  return AREAS[areaId] || null;
}

export function getAllAreas() {
  return Object.values(AREAS);
}

export { AREAS };
