// DialogueManager — flag-gated one-shot SYSTEM dialogue triggers.
// Subscribes to game events, checks Store.flags, emits DIALOGUE_QUEUED.

import Store from './Store.js';
import { on, emit, EVENTS } from '../events.js';

let unsubs = [];

const DialogueManager = {
  init() {
    unsubs.push(on(EVENTS.COMBAT_ENEMY_KILLED, () => {
      const state = Store.getState();
      if (!state.flags.firstKill) {
        Store.setFlag('firstKill', true);
        emit(EVENTS.DIALOGUE_QUEUED, { text: 'Adequate. You can hit things.' });
      }
    }));

    unsubs.push(on(EVENTS.PROG_LEVEL_UP, () => {
      const state = Store.getState();
      if (!state.flags.firstLevelUp) {
        Store.setFlag('firstLevelUp', true);
        emit(EVENTS.DIALOGUE_QUEUED, { text: 'You leveled up. A statistical anomaly, surely.' });
      }
    }));

    unsubs.push(on(EVENTS.WORLD_ZONE_CHANGED, (data) => {
      const state = Store.getState();
      if (data.zone >= 2 && !state.flags.reachedZone2) {
        Store.setFlag('reachedZone2', true);
        emit(EVENTS.DIALOGUE_QUEUED, { text: 'Zone 2. The monsters here are marginally less pathetic.' });
      }
    }));
  },

  destroy() {
    for (const unsub of unsubs) unsub();
    unsubs = [];
  },
};

export default DialogueManager;
