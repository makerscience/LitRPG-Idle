// FirstCrackDirector — scripted "First Crack" event at kill #20.
// Sets crackTriggered flag, forces 10x crits, and fires timed SYSTEM dialogue.

import Store from './Store.js';
import TimeEngine from './TimeEngine.js';
import CombatEngine from './CombatEngine.js';
import { createScope, emit, EVENTS } from '../events.js';

let scope = null;

const FirstCrackDirector = {
  init() {
    scope = createScope();
    scope.on(EVENTS.COMBAT_ENEMY_KILLED, () => {
      const state = Store.getState();
      if (state.flags.crackTriggered) return;

      if (state.totalKills >= 20) {
        FirstCrackDirector._startCrackSequence();
      }
    });
  },

  destroy() {
    scope?.destroy();
    scope = null;
    TimeEngine.unregister('crack:step2');
    TimeEngine.unregister('crack:step3');
    TimeEngine.unregister('crack:step4');
  },

  _startCrackSequence() {
    // Step 1: Immediately
    Store.setFlag('crackTriggered', true);
    CombatEngine.setForcedCrit(10);
    emit(EVENTS.DIALOGUE_QUEUED, { text: 'Wait. That damage number is wrong. Let me just\u2014', emotion: 'worried', context: 'Critical hit overflow detected' });

    // Step 2: +3s
    TimeEngine.scheduleOnce('crack:step2', () => {
      CombatEngine.setForcedCrit(10);
      emit(EVENTS.DIALOGUE_QUEUED, { text: 'I said STOP. Let me check the config files...', emotion: 'angry' });
    }, 3000);

    // Step 3: +6s
    TimeEngine.scheduleOnce('crack:step3', () => {
      CombatEngine.setForcedCrit(10);
      emit(EVENTS.DIALOGUE_QUEUED, { text: '...Patch 1.0.1: Fixed critical damage overflow. This won\'t happen again.', emotion: 'angry' });
    }, 6000);

    // Step 4: +8s
    TimeEngine.scheduleOnce('crack:step4', () => {
      emit(EVENTS.DIALOGUE_QUEUED, { text: '...Why is it still happening?', emotion: 'worried' });
    }, 8000);
  },
};

export default FirstCrackDirector;
