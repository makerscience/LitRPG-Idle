// SaveManager — persists Store state to localStorage with backup rotation.
// Receives Store as a parameter to init() to avoid circular imports.

import { SAVE } from '../config.js';
import { emit, EVENTS } from '../events.js';

const PRIMARY_KEY = 'litrpg_idle_save';
const BACKUP_KEY = 'litrpg_idle_save_backup';

let store = null;
let autosaveTimer = null;
let boundBeforeUnload = null;

/** Migration functions keyed by target schemaVersion. */
const migrations = {
  // Pattern: 2: (data) => { data.newField = defaultValue; data.schemaVersion = 2; return data; }
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
