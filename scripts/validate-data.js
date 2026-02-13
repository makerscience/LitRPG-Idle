#!/usr/bin/env node
// Data schema + cross-reference validator for V2 game data.
// Usage: node scripts/validate-data.js   (or: npm run validate:data)

import { ENEMIES } from '../src/data/enemies.js';
import { BOSSES } from '../src/data/bosses.js';
import { ITEMS } from '../src/data/items.js';
import { AREAS, TOTAL_ZONES, AREA_COUNT } from '../src/data/areas.js';

let errors = 0;
let warnings = 0;

function error(msg) { errors++; console.error(`  ERROR: ${msg}`); }
function warn(msg)  { warnings++; console.warn(`  WARN:  ${msg}`); }
function section(title) { console.log(`\n── ${title} ──`); }

const VALID_SLOTS = ['weapon', 'body', 'head', 'legs', 'boots', 'gloves', 'amulet'];
const VALID_RARITIES = ['common', 'uncommon', 'rare', 'epic'];
const VALID_BOSS_TYPES = ['MINI', 'ELITE', 'AREA'];
const STAT_KEYS = ['str', 'def', 'hp', 'regen', 'atkSpeed', 'atk'];

// ── 1. Enemy Schema ─────────────────────────────────────────────────
section('Enemy Validation');
const enemyIds = new Set();

for (const e of ENEMIES) {
  const ctx = `Enemy "${e.id || '???'}"`;
  if (!e.id || typeof e.id !== 'string') error(`${ctx}: missing or invalid id`);
  if (enemyIds.has(e.id)) error(`${ctx}: duplicate id`);
  enemyIds.add(e.id);

  if (!e.name || typeof e.name !== 'string') error(`${ctx}: missing name`);
  if (typeof e.hp !== 'number' || e.hp <= 0) error(`${ctx}: hp must be positive number, got ${e.hp}`);
  if (typeof e.attack !== 'number' || e.attack < 0) error(`${ctx}: invalid attack`);
  if (typeof e.attackSpeed !== 'number' || e.attackSpeed <= 0) error(`${ctx}: invalid attackSpeed`);
  if (typeof e.defense !== 'number' || e.defense < 0) error(`${ctx}: invalid defense`);
  if (typeof e.armorPen !== 'number' || e.armorPen < 0 || e.armorPen > 1) error(`${ctx}: armorPen must be 0-1`);
  if (e.dot !== null && typeof e.dot !== 'number') error(`${ctx}: dot must be number or null`);

  if (!Array.isArray(e.zones) || e.zones.length !== 2) {
    error(`${ctx}: zones must be [min, max]`);
  } else {
    if (e.zones[0] > e.zones[1]) error(`${ctx}: zones[0] > zones[1]`);
    if (e.zones[0] < 1 || e.zones[1] > TOTAL_ZONES) error(`${ctx}: zones out of range 1-${TOTAL_ZONES}`);
  }

  if (typeof e.goldDrop !== 'number' || e.goldDrop < 0) error(`${ctx}: invalid goldDrop`);
  if (typeof e.xpDrop !== 'number' || e.xpDrop < 0) error(`${ctx}: invalid xpDrop`);

  if (!Array.isArray(e.lootTable)) error(`${ctx}: missing lootTable`);
}
console.log(`  ${ENEMIES.length} enemies checked.`);

// ── 2. Item Schema ──────────────────────────────────────────────────
section('Item Validation');
const itemIds = new Set();
const itemEntries = Object.values(ITEMS);

for (const item of itemEntries) {
  const ctx = `Item "${item.id || '???'}"`;
  if (!item.id || typeof item.id !== 'string') error(`${ctx}: missing or invalid id`);
  if (itemIds.has(item.id)) error(`${ctx}: duplicate id`);
  itemIds.add(item.id);

  if (!item.name || typeof item.name !== 'string') error(`${ctx}: missing name`);
  if (!item.description || typeof item.description !== 'string') error(`${ctx}: missing description`);
  if (!item.abbr || typeof item.abbr !== 'string') error(`${ctx}: missing abbr`);
  if (!VALID_SLOTS.includes(item.slot)) error(`${ctx}: invalid slot "${item.slot}"`);
  if (!VALID_RARITIES.includes(item.rarity)) error(`${ctx}: invalid rarity "${item.rarity}"`);
  if (typeof item.tier !== 'number') error(`${ctx}: missing tier`);

  if (!Array.isArray(item.zones) || item.zones.length !== 2) {
    error(`${ctx}: zones must be [min, max]`);
  } else {
    if (item.zones[0] > item.zones[1]) error(`${ctx}: zones[0] > zones[1]`);
  }

  // statBonuses must have all 6 keys
  if (!item.statBonuses || typeof item.statBonuses !== 'object') {
    error(`${ctx}: missing statBonuses`);
  } else {
    for (const key of STAT_KEYS) {
      if (typeof item.statBonuses[key] !== 'number') error(`${ctx}: statBonuses.${key} must be a number`);
    }
    // Weapons: atk must equal str
    if (item.slot === 'weapon' && item.statBonuses.atk !== item.statBonuses.str) {
      error(`${ctx}: weapon atk (${item.statBonuses.atk}) must equal str (${item.statBonuses.str})`);
    }
    // Non-weapons: atk must be 0
    if (item.slot !== 'weapon' && item.statBonuses.atk !== 0) {
      error(`${ctx}: non-weapon atk must be 0, got ${item.statBonuses.atk}`);
    }
  }

  if (typeof item.sellValue !== 'number' || item.sellValue < 0) error(`${ctx}: invalid sellValue`);
}
console.log(`  ${itemEntries.length} items checked.`);

// ── 3. Boss Schema ──────────────────────────────────────────────────
section('Boss Validation');
const bossIds = new Set();

for (const b of BOSSES) {
  const ctx = `Boss "${b.id || '???'}"`;
  if (!b.id || typeof b.id !== 'string') error(`${ctx}: missing or invalid id`);
  if (bossIds.has(b.id)) error(`${ctx}: duplicate id`);
  bossIds.add(b.id);

  if (!b.name || typeof b.name !== 'string') error(`${ctx}: missing name`);
  if (!b.title || typeof b.title !== 'string') error(`${ctx}: missing title`);
  if (typeof b.zone !== 'number' || b.zone < 1 || b.zone > TOTAL_ZONES) error(`${ctx}: zone out of range`);
  if (typeof b.area !== 'number') error(`${ctx}: missing area`);
  if (typeof b.hp !== 'number' || b.hp <= 0) error(`${ctx}: invalid hp`);
  if (typeof b.attack !== 'number' || b.attack < 0) error(`${ctx}: invalid attack`);
  if (typeof b.attackSpeed !== 'number' || b.attackSpeed <= 0) error(`${ctx}: invalid attackSpeed`);
  if (typeof b.defense !== 'number' || b.defense < 0) error(`${ctx}: invalid defense`);
  if (typeof b.armorPen !== 'number' || b.armorPen < 0 || b.armorPen > 1) error(`${ctx}: armorPen must be 0-1`);
  if (b.dot !== null && typeof b.dot !== 'number') error(`${ctx}: dot must be number or null`);
  if (!VALID_BOSS_TYPES.includes(b.bossType)) error(`${ctx}: invalid bossType "${b.bossType}"`);
  if (b.isBoss !== true) error(`${ctx}: isBoss must be true`);
  if (typeof b.goldDrop !== 'number' || b.goldDrop < 0) error(`${ctx}: invalid goldDrop`);
  if (typeof b.xpDrop !== 'number' || b.xpDrop < 0) error(`${ctx}: invalid xpDrop`);
  if (!b.description || typeof b.description !== 'string') error(`${ctx}: missing description`);

  // Cross-reference: baseEnemyId must exist in ENEMIES
  if (!b.baseEnemyId || !enemyIds.has(b.baseEnemyId)) {
    error(`${ctx}: baseEnemyId "${b.baseEnemyId}" not found in ENEMIES`);
  }

  // Cross-reference: boss zone must fall within its area's range
  const bossArea = AREAS[b.area];
  if (bossArea) {
    const areaEnd = bossArea.zoneStart + bossArea.zoneCount - 1;
    if (b.zone < bossArea.zoneStart || b.zone > areaEnd) {
      error(`${ctx}: zone ${b.zone} outside area ${b.area} range (${bossArea.zoneStart}-${areaEnd})`);
    }
  } else {
    error(`${ctx}: area ${b.area} not found in AREAS`);
  }

  if (!Array.isArray(b.lootTable)) error(`${ctx}: missing lootTable`);
}
console.log(`  ${BOSSES.length} bosses checked.`);

// ── 4. Area Schema ──────────────────────────────────────────────────
section('Area Validation');
const areaEntries = Object.values(AREAS);

if (areaEntries.length !== AREA_COUNT) {
  error(`AREA_COUNT (${AREA_COUNT}) != actual area count (${areaEntries.length})`);
}

let expectedStart = 1;
for (const area of areaEntries.sort((a, b) => a.id - b.id)) {
  const ctx = `Area ${area.id} "${area.name}"`;
  if (!area.name || typeof area.name !== 'string') error(`${ctx}: missing name`);
  if (typeof area.zoneCount !== 'number' || area.zoneCount <= 0) error(`${ctx}: invalid zoneCount`);
  if (typeof area.zoneStart !== 'number') error(`${ctx}: missing zoneStart`);

  // Check contiguous zone ranges (no gaps)
  if (area.zoneStart !== expectedStart) {
    error(`${ctx}: zoneStart is ${area.zoneStart}, expected ${expectedStart} (gap in zone numbering)`);
  }
  expectedStart = area.zoneStart + area.zoneCount;

  if (typeof area.enemies !== 'function') error(`${ctx}: enemies must be a function`);
}

const computedTotal = areaEntries.reduce((sum, a) => sum + a.zoneCount, 0);
if (computedTotal !== TOTAL_ZONES) {
  error(`TOTAL_ZONES (${TOTAL_ZONES}) != sum of area zoneCounts (${computedTotal})`);
}
console.log(`  ${areaEntries.length} areas checked.`);

// ── 5. Cross-references: lootTable itemIds ──────────────────────────
section('Loot Table Cross-References');

function checkLootTable(entityType, entity) {
  if (!Array.isArray(entity.lootTable)) return;
  for (const entry of entity.lootTable) {
    if (!entry.itemId || !itemIds.has(entry.itemId)) {
      error(`${entityType} "${entity.id}": lootTable references unknown item "${entry.itemId}"`);
    }
    if (typeof entry.weight !== 'number' || entry.weight <= 0) {
      error(`${entityType} "${entity.id}": lootTable entry for "${entry.itemId}" has invalid weight`);
    }
  }
}

for (const e of ENEMIES) checkLootTable('Enemy', e);
for (const b of BOSSES) checkLootTable('Boss', b);
console.log('  Loot table references checked.');

// ── 6. Zone Coverage ────────────────────────────────────────────────
section('Zone Coverage');
const uncoveredZones = [];

for (let z = 1; z <= TOTAL_ZONES; z++) {
  const available = ENEMIES.filter(e => z >= e.zones[0] && z <= e.zones[1]);
  if (available.length === 0) {
    uncoveredZones.push(z);
  }
}

if (uncoveredZones.length > 0) {
  // Only warn for zones in areas that don't have content yet (areas 2-3)
  const area1End = AREAS[1].zoneStart + AREAS[1].zoneCount - 1;
  const earlyUncovered = uncoveredZones.filter(z => z <= area1End);
  const laterUncovered = uncoveredZones.filter(z => z > area1End);

  if (earlyUncovered.length > 0) {
    error(`Area 1 zones with no enemies: [${earlyUncovered.join(', ')}]`);
  }
  if (laterUncovered.length > 0) {
    warn(`Zones ${laterUncovered[0]}-${laterUncovered[laterUncovered.length - 1]} have no enemies (Areas 2-3 not yet authored)`);
  }
} else {
  console.log('  All zones 1-30 have enemy coverage.');
}

// ── 7. Item Zone Coverage ────────────────────────────────────────────
section('Item Zone Coverage');
const uncoveredItemZones = [];

for (let z = 1; z <= TOTAL_ZONES; z++) {
  const available = itemEntries.filter(item => z >= item.zones[0] && z <= item.zones[1]);
  if (available.length === 0) {
    uncoveredItemZones.push(z);
  }
}

if (uncoveredItemZones.length > 0) {
  const a1End = AREAS[1].zoneStart + AREAS[1].zoneCount - 1;
  const earlyUncoveredItems = uncoveredItemZones.filter(z => z <= a1End);
  const laterUncoveredItems = uncoveredItemZones.filter(z => z > a1End);

  if (earlyUncoveredItems.length > 0) {
    error(`Area 1 zones with no droppable items: [${earlyUncoveredItems.join(', ')}]`);
  }
  if (laterUncoveredItems.length > 0) {
    warn(`Zones ${laterUncoveredItems[0]}-${laterUncoveredItems[laterUncoveredItems.length - 1]} have no droppable items (Areas 2-3 not yet authored)`);
  }
} else {
  console.log('  All zones 1-30 have item coverage.');
}
console.log('  Item zone coverage checked.');

// ── Summary ─────────────────────────────────────────────────────────
section('Summary');
console.log(`  Errors:   ${errors}`);
console.log(`  Warnings: ${warnings}`);

if (errors > 0) {
  console.log('\n  VALIDATION FAILED\n');
  process.exit(1);
} else {
  console.log('\n  VALIDATION PASSED\n');
  process.exit(0);
}
