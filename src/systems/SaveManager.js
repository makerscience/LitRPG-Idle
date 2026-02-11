// SaveManager — persists Store state to localStorage with backup rotation.
// Receives Store as a parameter to init() to avoid circular imports.

import { SAVE } from '../config.js';
import { emit, on, EVENTS } from '../events.js';

const PRIMARY_KEY = 'litrpg_idle_save';
const BACKUP_KEY = 'litrpg_idle_save_backup';

let store = null;
let autosaveTimer = null;
let boundBeforeUnload = null;
let saveRequestedUnsub = null;

/** Migration functions keyed by target schemaVersion. */
const migrations = {
  2: (data) => {
    data.purchasedUpgrades = data.purchasedUpgrades || {};
    data.totalKills = data.totalKills || 0;
    if (data.flags) {
      data.flags.firstFragment = data.flags.firstFragment ?? false;
    }
    data.schemaVersion = 2;
    return data;
  },
  3: (data) => {
    data.activeCheats = data.activeCheats || {};
    data.unlockedCheats = data.unlockedCheats || [];
    if (data.flags) data.flags.firstMerge = data.flags.firstMerge ?? false;
    data.schemaVersion = 3;
    return data;
  },
  4: (data) => {
    data.furthestZone = data.furthestZone ?? data.currentZone ?? 1;
    if (data.flags) data.flags.firstPrestige = data.flags.firstPrestige ?? false;
    data.schemaVersion = 4;
    return data;
  },
  5: (data) => {
    if (data.flags) {
      data.flags.firstSell = data.flags.firstSell ?? false;
      data.flags.reachedZone3 = data.flags.reachedZone3 ?? false;
      data.flags.reachedZone4 = data.flags.reachedZone4 ?? false;
      data.flags.reachedZone5 = data.flags.reachedZone5 ?? false;
      data.flags.kills100 = data.flags.kills100 ?? false;
      data.flags.kills500 = data.flags.kills500 ?? false;
      data.flags.kills1000 = data.flags.kills1000 ?? false;
      data.flags.kills5000 = data.flags.kills5000 ?? false;
    }
    data.schemaVersion = 5;
    return data;
  },
  6: (data) => {
    data.killsPerEnemy = data.killsPerEnemy || {};
    data.territories = data.territories || {};
    if (data.flags) data.flags.firstTerritoryClaim = data.flags.firstTerritoryClaim ?? false;
    data.schemaVersion = 6;
    return data;
  },
  7: (data) => {
    // Area/zone hierarchy migration.
    // Map old flat zone progression to new area/zone system generously.
    const oldZone = data.currentZone ?? 1;
    const oldFurthest = data.furthestZone ?? oldZone;

    data.currentArea = oldZone;
    data.currentZone = 1;              // Start at zone 1 of the area
    data.furthestArea = oldFurthest;

    // Build areaProgress — generous: mark all cleared areas as fully complete
    const areaCounts = { 1: 5, 2: 7, 3: 7, 4: 10, 5: 5 };
    data.areaProgress = {};
    for (let a = 1; a <= 5; a++) {
      if (a < oldFurthest) {
        // Fully cleared area
        const zc = areaCounts[a];
        const bosses = [];
        for (let z = 1; z <= zc; z++) bosses.push(z);
        data.areaProgress[a] = { furthestZone: zc, bossesDefeated: bosses, zoneClearKills: {} };
      } else if (a === oldFurthest) {
        // Current frontier area — unlocked but at zone 1
        data.areaProgress[a] = { furthestZone: 1, bossesDefeated: [], zoneClearKills: {} };
      } else {
        // Locked area
        data.areaProgress[a] = { furthestZone: 0, bossesDefeated: [], zoneClearKills: {} };
      }
    }

    // Add area entrance flags
    if (data.flags) {
      data.flags.reachedArea2 = data.flags.reachedArea2 ?? (oldFurthest >= 2);
      data.flags.reachedArea3 = data.flags.reachedArea3 ?? (oldFurthest >= 3);
      data.flags.reachedArea4 = data.flags.reachedArea4 ?? (oldFurthest >= 4);
      data.flags.reachedArea5 = data.flags.reachedArea5 ?? (oldFurthest >= 5);
    }

    data.schemaVersion = 7;
    return data;
  },
};

/** Run all applicable migrations in order. */
function migrate(data) {
  let current = data.schemaVersion ?? 1;
  const versions = Object.keys(migrations).map(Number).sort((a, b) => a - b);
  for (const version of versions) {
    if (current < version) {
      data = migrations[version](data);
      current = version;
    }
  }
  return data;
}

const SaveManager = {
  /**
   * Initialize with a store reference.
   * Attempts to load existing save, then starts autosave interval + beforeunload.
   */
  init(storeRef) {
    store = storeRef;

    // Attempt to load existing save
    this.load();

    // Autosave on interval
    autosaveTimer = setInterval(() => this.save(), SAVE.autosaveInterval);

    // Save on page close
    boundBeforeUnload = () => this.save();
    window.addEventListener('beforeunload', boundBeforeUnload);

    // Save on explicit request (e.g. after prestige)
    saveRequestedUnsub = on(EVENTS.SAVE_REQUESTED, () => SaveManager.save());
  },

  destroy() {
    if (autosaveTimer) {
      clearInterval(autosaveTimer);
      autosaveTimer = null;
    }
    if (boundBeforeUnload) {
      window.removeEventListener('beforeunload', boundBeforeUnload);
      boundBeforeUnload = null;
    }
    if (saveRequestedUnsub) {
      saveRequestedUnsub();
      saveRequestedUnsub = null;
    }
    store = null;
  },

  /** Serialize state to localStorage. Rotates current → backup before writing. */
  save() {
    if (!store) return;

    const state = store.getState();
    if (!state) return;

    // Update timestamp before serializing
    store.updateTimestamps({ lastSave: Date.now(), lastOnline: Date.now() });

    // Decimal.toJSON() auto-converts to string, so JSON.stringify just works
    const json = JSON.stringify(state);

    // Rotate: current → backup, then write new current
    const existing = localStorage.getItem(PRIMARY_KEY);
    if (existing) {
      localStorage.setItem(BACKUP_KEY, existing);
    }
    localStorage.setItem(PRIMARY_KEY, json);

    emit(EVENTS.SAVE_COMPLETED, {});
  },

  /** Load from localStorage. Falls back to backup if primary is corrupt. */
  load() {
    if (!store) return;

    let raw = localStorage.getItem(PRIMARY_KEY);
    let data = null;

    // Try primary
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        emit(EVENTS.SAVE_CORRUPT, { source: 'primary' });
        data = null;
      }
    }

    // Fall back to backup
    if (!data) {
      raw = localStorage.getItem(BACKUP_KEY);
      if (raw) {
        try {
          data = JSON.parse(raw);
          emit(EVENTS.SAVE_CORRUPT, { source: 'primary', recoveredFrom: 'backup' });
        } catch {
          emit(EVENTS.SAVE_CORRUPT, { source: 'both' });
          return; // No valid save — Store keeps its default state
        }
      }
    }

    if (!data) return; // Fresh game — no save exists

    // Run migrations
    data = migrate(data);

    // Hydrate store
    store.loadState(data);
    emit(EVENTS.SAVE_LOADED, {});
  },

  /** Wipe both save keys. Dev/debug tool. */
  deleteSave() {
    localStorage.removeItem(PRIMARY_KEY);
    localStorage.removeItem(BACKUP_KEY);
  },
};

export default SaveManager;
