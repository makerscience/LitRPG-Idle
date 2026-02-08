// CheatManager — detects cheat unlock conditions and manages cheat lifecycle.
// Subscribes to economy/save events, triggers unlocks via Store.

import Store from './Store.js';
import { on, emit, EVENTS } from '../events.js';
import { CHEATS } from '../config.js';
import { getCheat } from '../data/cheats.js';

let unsubs = [];

const CheatManager = {
  init() {
    // Handle already-loaded saves where SAVE_LOADED fired before manager init.
    CheatManager._checkLootHoarderUnlock();

    unsubs.push(on(EVENTS.ECON_FRAGMENTS_GAINED, () => {
      CheatManager._checkLootHoarderUnlock();
    }));

    unsubs.push(on(EVENTS.SAVE_LOADED, () => {
      CheatManager._checkLootHoarderUnlock();
    }));
  },

  destroy() {
    for (const unsub of unsubs) unsub();
    unsubs = [];
  },

  isActive(cheatId) {
    return Store.isCheatActive(cheatId);
  },

  _checkLootHoarderUnlock() {
    const state = Store.getState();
    if (state.unlockedCheats.includes(CHEATS.lootHoarder.id)) return;

    if (state.glitchFragments.gte(CHEATS.lootHoarder.fragmentsRequired)) {
      Store.unlockCheat(CHEATS.lootHoarder.id);
      const cheat = getCheat(CHEATS.lootHoarder.id);
      emit(EVENTS.DIALOGUE_QUEUED, { text: cheat.systemDialogue.onUnlock, emotion: 'worried', context: 'Fragment threshold reached' });
    }
  },
};

export default CheatManager;
