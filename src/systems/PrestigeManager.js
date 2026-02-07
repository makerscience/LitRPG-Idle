// PrestigeManager — prestige loop orchestrator.
// Tracks furthest zone, eligibility, and executes prestige resets.

import Store from './Store.js';
import { on, emit, EVENTS } from '../events.js';
import { PRESTIGE } from '../config.js';

let unsubs = [];
let prestigeAvailableEmitted = false;
let justPrestiged = false;

const PrestigeManager = {
  init() {
    // Track furthest zone on zone changes
    unsubs.push(on(EVENTS.WORLD_ZONE_CHANGED, (data) => {
      const state = Store.getState();
      const prevFurthest = state.furthestZone;
      Store.setFurthestZone(data.zone);

      // Emit PRESTIGE_AVAILABLE once when first reaching minZone
      if (!prestigeAvailableEmitted && data.zone >= PRESTIGE.minZone && prevFurthest < PRESTIGE.minZone) {
        prestigeAvailableEmitted = true;
        emit(EVENTS.PRESTIGE_AVAILABLE, {});
      }
    }));

    // On save loaded, check if prestige already available
    unsubs.push(on(EVENTS.SAVE_LOADED, () => {
      const state = Store.getState();
      if (state.furthestZone >= PRESTIGE.minZone) {
        prestigeAvailableEmitted = true;
      }
    }));
  },

  destroy() {
    for (const unsub of unsubs) unsub();
    unsubs = [];
    prestigeAvailableEmitted = false;
    justPrestiged = false;
  },

  canPrestige() {
    const state = Store.getState();
    return state.furthestZone >= PRESTIGE.minZone;
  },

  getNextMultiplier() {
    const state = Store.getState();
    return PRESTIGE.multiplierFormula(state.prestigeCount + 1);
  },

  getCurrentMultiplier() {
    const state = Store.getState();
    return PRESTIGE.multiplierFormula(state.prestigeCount);
  },

  performPrestige() {
    if (!PrestigeManager.canPrestige()) return;

    Store.performPrestige();
    justPrestiged = true;
    emit(EVENTS.PRESTIGE_PERFORMED, { count: Store.getState().prestigeCount });
    emit(EVENTS.SAVE_REQUESTED, {});
  },

  wasJustPrestiged() {
    return justPrestiged;
  },

  clearJustPrestiged() {
    justPrestiged = false;
  },
};

export default PrestigeManager;
