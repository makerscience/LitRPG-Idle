// Area definitions — each area contains multiple zones with progressive enemy unlocks.
// Enemies are sorted by base HP ascending (weakest first) for progressive unlock order.

import { WORLD_1_ENEMIES } from './enemies.js';

/**
 * Area configurations.
 * - enemies: sorted weakest→strongest (unlock order)
 * - zoneCount: total zones in this area
 * - bossStructure: defines boss type per zone
 */
const AREAS = {
  1: {
    id: 1,
    name: 'Forest',
    zoneCount: 5,
    enemies: () => getEnemiesForArea(1),
  },
  2: {
    id: 2,
    name: 'Wilderness',
    zoneCount: 7,
    enemies: () => getEnemiesForArea(2),
  },
  3: {
    id: 3,
    name: 'Deep Caverns',
    zoneCount: 7,
    enemies: () => getEnemiesForArea(3),
  },
  4: {
    id: 4,
    name: 'Volcanic Ruins',
    zoneCount: 10,
    enemies: () => getEnemiesForArea(4),
  },
  5: {
    id: 5,
    name: "Dragon's Lair",
    zoneCount: 5,
    enemies: () => getEnemiesForArea(5),
  },
};

/** Total zones across all areas. */
export const TOTAL_ZONES = Object.values(AREAS).reduce((sum, a) => sum + a.zoneCount, 0); // 34

/** Number of areas. */
export const AREA_COUNT = Object.keys(AREAS).length; // 5

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
 * Get all enemies for an area, sorted by HP ascending (unlock order).
 * Uses the existing `area` field on enemy definitions (renamed from `zone`).
 */
function getEnemiesForArea(areaId) {
  return WORLD_1_ENEMIES
    .filter(e => e.area === areaId)
    .sort((a, b) => Number(a.hp) - Number(b.hp));
}

/**
 * Get the enemies unlocked at a specific zone within an area.
 * Zone 1: enemy #1 only. Zone 2: enemies #1-#2. Zone 3+: all enemies.
 * Capped by the number of enemies available in that area.
 */
export function getUnlockedEnemies(areaId, zoneNum) {
  const areaEnemies = getEnemiesForArea(areaId);
  const unlockCount = Math.min(zoneNum, areaEnemies.length);
  return areaEnemies.slice(0, unlockCount);
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
