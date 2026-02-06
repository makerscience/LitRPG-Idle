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
  mergeThreshold: 100,
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

export const SAVE = {
  schemaVersion: 1,
  autosaveInterval: 30_000,   // ms
  maxOfflineTime: 12 * 60 * 60 * 1000,  // 12 hours in ms
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
