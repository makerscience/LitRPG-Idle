// Game balance constants — all tuning numbers live here.

export const DAMAGE_FORMULAS = {
  mortal:   (str, wpn) => str * 1.2 + wpn,
  awakened: (str, wpn, skill) => str ** 2 + skill * wpn ** 2,
  godhood:  (str, wpn, skill) => wpn * Math.exp(skill / 10),
};

export const COMBAT = {
  critChance: 0.05,
  critMultiplier: 2,
  autoAttackInterval: 1000,   // ms
  spawnDelay: 500,            // ms after kill before next enemy
};

export const PROGRESSION = {
  xpForLevel: (level) => Math.floor(100 * level ** 1.5),
  statGrowthPerLevel: {
    str: 2,
    vit: 1,
    luck: 0.5,
  },
  startingStats: {
    str: 5,
    vit: 10,
    luck: 1,
    level: 1,
    xp: 0,
  },
};

export const ECONOMY = {
  startingGold: 0,
  startingFragments: 0,
  goldMultiplierPerZone: 1.5,
  fragmentDropChance: 0.05,
};

export const LOOT = {
  rarityWeights: {
    common:    70,
    uncommon:  20,
    rare:       8,
    epic:       2,
  },
  mergeThreshold: 10,
};

export const INVENTORY = {
  maxUniqueStacks: 20,
  dropChanceByZone: { 1: 0.40, 2: 0.35, 3: 0.30, 4: 0.25, 5: 0.20 },
};

export const PRESTIGE = {
  multiplierFormula: (count) => 1 + count * 0.25,
  goldRetention: 0.10,
};

export const WORLD = {
  zoneCount: 5,
  width: 1280,
  height: 720,
};

export const CHEATS = {
  lootHoarder: {
    id: 'loot_hoarder',
    fragmentsRequired: 10,
    dropMultiplier: 3,        // items per successful drop roll when active
    dropChanceBoost: 1.5,     // multiplier on base drop chance when active
    dropChanceCap: 0.80,      // cap after boost
  },
};

export const SAVE = {
  schemaVersion: 3,
  autosaveInterval: 30_000,   // ms
  maxOfflineTime: 12 * 60 * 60 * 1000,  // 12 hours in ms
};

export const LAYOUT = {
  topBar:   { x: 0, y: 0, w: 1280, h: 50 },
  gameArea: { x: 0, y: 50, w: 960, h: 670 },
  logPanel: { x: 960, y: 50, w: 320, h: 670 },
  bottomBar:{ x: 0, y: 670, w: 960, h: 50 },   // placeholder for Phase 6 cheat deck
  zoneNav:  { y: 70, centerX: 480 },             // relative to gameArea top
};

export const COLORS = {
  panelBg:      0x111111,
  topBarBg:     0x0a0a0a,
  separator:    0x333333,
  logText: {
    combat:     '#22c55e',   // green
    gold:       '#eab308',   // yellow
    system:     '#eab308',   // yellow (same as gold)
    levelUp:    '#818cf8',   // indigo
    zoneChange: '#38bdf8',   // sky blue
    loot:       '#a855f7',   // purple
    default:    '#a1a1aa',   // zinc-400
  },
  rarity: {
    common:   '#a1a1aa',
    uncommon: '#22c55e',
    rare:     '#3b82f6',
    epic:     '#a855f7',
  },
  xpBar: {
    bg:         0x374151,
    fill:       0x6366f1,    // indigo-500
  },
};

export const UI = {
  formatThresholds: {
    thousand: 1e3,
    million: 1e6,
    billion: 1e9,
  },
  damageNumbers: {
    duration: 800,
    floatDistance: 40,
    fontSize: 18,
    critFontSize: 26,
  },
  logMaxLines: 50,
};
