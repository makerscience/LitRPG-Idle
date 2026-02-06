// Store — centralized game state. Named mutation methods are the only write path.
// State holds live Decimal instances; strings only exist in localStorage.

import { D, fromJSON, Decimal } from './BigNum.js';
import { PROGRESSION, ECONOMY, SAVE } from '../config.js';
import { emit, EVENTS } from '../events.js';

let state = null;

/** Build a fresh default state from config values. */
function createInitialState() {
  const stats = PROGRESSION.startingStats;
  return {
    schemaVersion: SAVE.schemaVersion,
    gold: D(ECONOMY.startingGold),
    glitchFragments: D(ECONOMY.startingFragments),
    mana: D(100),
    playerStats: {
      str: stats.str,
      vit: stats.vit,
      luck: stats.luck,
      level: stats.level,
      xp: D(stats.xp),
      xpToNext: D(PROGRESSION.xpForLevel(stats.level)),
    },
    equipped: { head: null, body: null, weapon: null, legs: null },
    inventoryStacks: {},
    currentWorld: 1,
    currentZone: 1,
    prestigeCount: 0,
    prestigeMultiplier: D(1),
    unlockedCheats: [],
    titles: [],
    flags: { crackTriggered: false },
    settings: { autoAttack: false },
    timestamps: { lastSave: 0, lastOnline: 0 },
  };
}

// Fields that are stored as Decimal (BigNum) — used for hydration
const DECIMAL_FIELDS = ['gold', 'glitchFragments', 'mana', 'prestigeMultiplier'];
const DECIMAL_STAT_FIELDS = ['xp', 'xpToNext'];

/**
 * Hydrate a saved plain object (strings from JSON) into live Decimal instances.
 * Merges field-by-field onto a fresh default so missing keys get defaults.
 */
function hydrateState(saved) {
  const fresh = createInitialState();

  // Schema version
  fresh.schemaVersion = saved.schemaVersion ?? fresh.schemaVersion;

  // Top-level Decimal fields
  for (const key of DECIMAL_FIELDS) {
    if (saved[key] != null) fresh[key] = fromJSON(saved[key]);
  }

  // playerStats — plain numbers + Decimal sub-fields
  if (saved.playerStats) {
    for (const key of ['str', 'vit', 'luck', 'level']) {
      if (saved.playerStats[key] != null) fresh.playerStats[key] = saved.playerStats[key];
    }
    for (const key of DECIMAL_STAT_FIELDS) {
      if (saved.playerStats[key] != null) fresh.playerStats[key] = fromJSON(saved.playerStats[key]);
    }
  }

  // Simple objects / arrays — shallow copy
  if (saved.equipped) fresh.equipped = { ...fresh.equipped, ...saved.equipped };
  if (saved.inventoryStacks) fresh.inventoryStacks = saved.inventoryStacks;
  if (saved.currentWorld != null) fresh.currentWorld = saved.currentWorld;
  if (saved.currentZone != null) fresh.currentZone = saved.currentZone;
  if (saved.prestigeCount != null) fresh.prestigeCount = saved.prestigeCount;
  if (saved.unlockedCheats) fresh.unlockedCheats = [...saved.unlockedCheats];
  if (saved.titles) fresh.titles = [...saved.titles];
  if (saved.flags) fresh.flags = { ...fresh.flags, ...saved.flags };
  if (saved.settings) fresh.settings = { ...fresh.settings, ...saved.settings };
  if (saved.timestamps) fresh.timestamps = { ...fresh.timestamps, ...saved.timestamps };

  return fresh;
}

// ── Public API ──────────────────────────────────────────────────────

const Store = {
  /** Initialize with default state. */
  init() {
    state = createInitialState();
  },

  /** Tear down — null out state. */
  destroy() {
    state = null;
  },

  /** Read-only access to live state. */
  getState() {
    return state;
  },

  /** Replace state with hydrated save data. Called by SaveManager on load. */
  loadState(saved) {
    state = hydrateState(saved);
  },

  /** Reset to factory defaults. */
  resetState() {
    state = createInitialState();
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['all'] });
  },

  // ── Mutation methods ──────────────────────────────────────────────

  addGold(amount) {
    state.gold = state.gold.plus(D(amount));
    emit(EVENTS.ECON_GOLD_GAINED, { amount: D(amount) });
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['gold'] });
  },

  addFragments(amount) {
    state.glitchFragments = state.glitchFragments.plus(D(amount));
    emit(EVENTS.ECON_FRAGMENTS_GAINED, { amount: D(amount) });
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['glitchFragments'] });
  },

  setMana(current) {
    state.mana = D(current);
    emit(EVENTS.ECON_MANA_CHANGED, { mana: state.mana });
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['mana'] });
  },

  addXp(amount) {
    const xpGain = D(amount);
    state.playerStats.xp = state.playerStats.xp.plus(xpGain);
    emit(EVENTS.PROG_XP_GAINED, { amount: xpGain });

    // Multi-level-up loop
    while (state.playerStats.xp.gte(state.playerStats.xpToNext)) {
      state.playerStats.xp = state.playerStats.xp.minus(state.playerStats.xpToNext);
      state.playerStats.level += 1;

      // Apply stat growth
      const growth = PROGRESSION.statGrowthPerLevel;
      state.playerStats.str += growth.str;
      state.playerStats.vit += growth.vit;
      state.playerStats.luck += growth.luck;

      // Recalculate xpToNext for new level
      state.playerStats.xpToNext = D(PROGRESSION.xpForLevel(state.playerStats.level));

      emit(EVENTS.PROG_LEVEL_UP, {
        level: state.playerStats.level,
        stats: { ...state.playerStats },
      });
    }

    emit(EVENTS.STATE_CHANGED, { changedKeys: ['playerStats'] });
  },

  setZone(world, zone) {
    state.currentWorld = world;
    state.currentZone = zone;
    emit(EVENTS.WORLD_ZONE_CHANGED, { world, zone });
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['currentWorld', 'currentZone'] });
  },

  updateTimestamps(partial) {
    Object.assign(state.timestamps, partial);
    // Internal bookkeeping — no event emitted
  },
};

export default Store;
