// Store — centralized game state. Named mutation methods are the only write path.
// State holds live Decimal instances; strings only exist in localStorage.

import { D, fromJSON, Decimal } from './BigNum.js';
import { PROGRESSION, ECONOMY, SAVE, PRESTIGE, COMBAT } from '../config.js';
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
    playerHp: D(stats.vit * COMBAT.playerHpPerVit),
    equipped: { head: null, body: null, weapon: null, legs: null },
    inventoryStacks: {},
    purchasedUpgrades: {},
    totalKills: 0,
    currentWorld: 1,
    currentZone: 1,
    furthestZone: 1,
    prestigeCount: 0,
    prestigeMultiplier: D(1),
    unlockedCheats: [],
    activeCheats: {},
    titles: [],
    flags: { crackTriggered: false, firstKill: false, firstLevelUp: false, reachedZone2: false, reachedZone3: false, reachedZone4: false, reachedZone5: false, firstEquip: false, firstFragment: false, firstMerge: false, firstPrestige: false, firstSell: false, kills100: false, kills500: false, kills1000: false, kills5000: false },
    settings: { autoAttack: false },
    timestamps: { lastSave: 0, lastOnline: 0 },
  };
}

// Fields that are stored as Decimal (BigNum) — used for hydration
const DECIMAL_FIELDS = ['gold', 'glitchFragments', 'mana', 'prestigeMultiplier', 'playerHp'];
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
  if (saved.purchasedUpgrades) fresh.purchasedUpgrades = { ...saved.purchasedUpgrades };
  if (saved.totalKills != null) fresh.totalKills = saved.totalKills;
  if (saved.currentWorld != null) fresh.currentWorld = saved.currentWorld;
  if (saved.currentZone != null) fresh.currentZone = saved.currentZone;
  if (saved.furthestZone != null) fresh.furthestZone = saved.furthestZone;
  if (saved.prestigeCount != null) fresh.prestigeCount = saved.prestigeCount;
  if (saved.unlockedCheats) fresh.unlockedCheats = [...saved.unlockedCheats];
  if (saved.activeCheats) fresh.activeCheats = { ...saved.activeCheats };
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

  setFurthestZone(zone) {
    state.furthestZone = Math.max(state.furthestZone, zone);
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['furthestZone'] });
  },

  performPrestige() {
    state.prestigeCount += 1;
    state.prestigeMultiplier = D(PRESTIGE.multiplierFormula(state.prestigeCount));
    state.gold = state.gold.times(PRESTIGE.goldRetention).floor();
    state.currentZone = 1;
    state.currentWorld = 1;
    // furthestZone NOT reset — permanent high-water mark

    // Reset stats to starting values
    const stats = PROGRESSION.startingStats;
    state.playerStats.str = stats.str;
    state.playerStats.vit = stats.vit;
    state.playerStats.luck = stats.luck;
    state.playerStats.level = stats.level;
    state.playerStats.xp = D(stats.xp);
    state.playerStats.xpToNext = D(PROGRESSION.xpForLevel(stats.level));

    state.playerHp = D(stats.vit * COMBAT.playerHpPerVit);
    state.purchasedUpgrades = {};
    state.totalKills = 0;

    // Keeps: equipped, inventoryStacks, glitchFragments, unlockedCheats, activeCheats, titles, flags
    emit(EVENTS.WORLD_ZONE_CHANGED, { world: 1, zone: 1 });
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['all'] });
  },

  setFlag(key, value) {
    state.flags[key] = value;
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['flags'] });
  },

  // ── Inventory / Equipment mutations ─────────────────────────────

  addInventoryItem(itemId, count = 1) {
    const stacks = state.inventoryStacks;
    if (stacks[itemId]) {
      stacks[itemId].count += count;
    } else {
      stacks[itemId] = { count, tier: 0 };
    }
    emit(EVENTS.INV_ITEM_ADDED, { itemId, count, totalCount: stacks[itemId].count });
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['inventoryStacks'] });
  },

  removeInventoryItem(itemId, count = 1) {
    const stacks = state.inventoryStacks;
    if (!stacks[itemId]) return;
    stacks[itemId].count -= count;
    if (stacks[itemId].count <= 0) {
      delete stacks[itemId];
    }
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['inventoryStacks'] });
  },

  equipItem(slot, itemId) {
    state.equipped[slot] = itemId;
    emit(EVENTS.INV_ITEM_EQUIPPED, { slot, itemId });
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['equipped'] });
  },

  unequipItem(slot) {
    state.equipped[slot] = null;
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['equipped'] });
  },

  // ── Upgrade / Economy mutations ──────────────────────────────────

  spendGold(amount) {
    state.gold = state.gold.minus(D(amount));
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['gold'] });
  },

  spendFragments(amount) {
    state.glitchFragments = state.glitchFragments.minus(D(amount));
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['glitchFragments'] });
  },

  upgradeLevel(upgradeId) {
    if (!state.purchasedUpgrades[upgradeId]) {
      state.purchasedUpgrades[upgradeId] = 0;
    }
    state.purchasedUpgrades[upgradeId] += 1;
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['purchasedUpgrades'] });
    return state.purchasedUpgrades[upgradeId];
  },

  // ── Cheat mutations ───────────────────────────────────────────────

  unlockCheat(cheatId) {
    if (state.unlockedCheats.includes(cheatId)) return;
    state.unlockedCheats.push(cheatId);
    state.activeCheats[cheatId] = true;
    emit(EVENTS.CHEAT_UNLOCKED, { cheatId });
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['unlockedCheats', 'activeCheats'] });
  },

  toggleCheat(cheatId) {
    state.activeCheats[cheatId] = !state.activeCheats[cheatId];
    emit(EVENTS.CHEAT_TOGGLED, { cheatId, active: state.activeCheats[cheatId] });
    emit(EVENTS.STATE_CHANGED, { changedKeys: ['activeCheats'] });
  },

  isCheatActive(cheatId) {
    return state.activeCheats[cheatId] === true;
  },

  // ── Player HP mutations ──────────────────────────────────────────

  damagePlayer(amount) {
    state.playerHp = Decimal.max(state.playerHp.minus(D(amount)), D(0));
    const maxHp = D(state.playerStats.vit * COMBAT.playerHpPerVit);
    emit(EVENTS.COMBAT_PLAYER_DAMAGED, {
      amount: D(amount),
      remainingHp: state.playerHp,
      maxHp,
    });
    if (state.playerHp.lte(0)) {
      emit(EVENTS.COMBAT_PLAYER_DIED, {});
    }
  },

  healPlayer(amount) {
    const maxHp = D(state.playerStats.vit * COMBAT.playerHpPerVit);
    state.playerHp = Decimal.min(state.playerHp.plus(D(amount)), maxHp);
  },

  getPlayerMaxHp() {
    return D(state.playerStats.vit * COMBAT.playerHpPerVit);
  },

  resetPlayerHp() {
    state.playerHp = D(state.playerStats.vit * COMBAT.playerHpPerVit);
  },

  incrementKills() {
    state.totalKills += 1;
  },

  updateTimestamps(partial) {
    Object.assign(state.timestamps, partial);
    // Internal bookkeeping — no event emitted
  },
};

export default Store;
