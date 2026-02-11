// PrestigeManager — prestige loop orchestrator.
// Tracks furthest area, eligibility, and executes prestige resets.

import Store from './Store.js';
import { on, emit, EVENTS } from '../events.js';
import { PRESTIGE } from '../config.js';

let unsubs = [];
let prestigeAvailableEmitted = false;
let justPrestiged = false;

const PrestigeManager = {
  init() {
    // Handle already-loaded saves where SAVE_LOADED fired before manager init.
    const initialState = Store.getState();
    if (initialState.furthestArea >= PRESTIGE.minArea) {
      prestigeAvailableEmitted = true;
    }

    // Track furthest area on area changes
    unsubs.push(on(EVENTS.WORLD_AREA_CHANGED, (data) => {
      const state = Store.getState();
      const prevFurthest = state.furthestArea;
      Store.setFurthestArea(data.area);

      // Emit PRESTIGE_AVAILABLE once when first reaching minArea
      if (!prestigeAvailableEmitted && data.area >= PRESTIGE.minArea && prevFurthest < PRESTIGE.minArea) {
        prestigeAvailableEmitted = true;
        emit(EVENTS.PRESTIGE_AVAILABLE, {});
      }
    }));

    // On save loaded, check if prestige already available
    unsubs.push(on(EVENTS.SAVE_LOADED, () => {
      const state = Store.getState();
      if (state.furthestArea >= PRESTIGE.minArea) {
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
    return state.furthestArea >= PRESTIGE.minArea;
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
