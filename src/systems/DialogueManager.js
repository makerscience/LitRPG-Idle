// DialogueManager — flag-gated one-shot SYSTEM dialogue triggers.
// Subscribes to game events, checks Store.flags, emits DIALOGUE_QUEUED.

import Store from './Store.js';
import TimeEngine from './TimeEngine.js';
import { on, emit, EVENTS } from '../events.js';
import { getCheat } from '../data/cheats.js';

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

    unsubs.push(on(EVENTS.INV_ITEM_EQUIPPED, () => {
      const state = Store.getState();
      if (!state.flags.firstEquip) {
        Store.setFlag('firstEquip', true);
        emit(EVENTS.DIALOGUE_QUEUED, { text: "I see you've found a weapon. Try not to hurt yourself." });
      }
    }));

    unsubs.push(on(EVENTS.INV_FULL, () => {
      emit(EVENTS.DIALOGUE_QUEUED, { text: 'Your inventory is full. This is what happens when you hoard.' });
    }));

    // Exploit upgrade purchase — random SYSTEM complaint
    const exploitSnark = [
      'That upgrade isn\'t in the patch notes. I would know.',
      'You realize I can SEE what you\'re doing, right?',
      'Great. Now the memory allocator is crying.',
      'I\'m filing a bug report. Against YOU.',
      'Stop touching things that don\'t belong to you.',
    ];
    unsubs.push(on(EVENTS.UPG_PURCHASED, (data) => {
      if (data.category === 'exploit') {
        const line = exploitSnark[Math.floor(Math.random() * exploitSnark.length)];
        emit(EVENTS.DIALOGUE_QUEUED, { text: line });
      }
    }));

    // First glitch fragment
    unsubs.push(on(EVENTS.ECON_FRAGMENTS_GAINED, () => {
      const state = Store.getState();
      if (!state.flags.firstFragment) {
        Store.setFlag('firstFragment', true);
        emit(EVENTS.DIALOGUE_QUEUED, { text: 'What IS that? That\'s not in my loot tables.' });
      }
    }));

    // First item merge
    unsubs.push(on(EVENTS.INV_ITEM_MERGED, () => {
      const state = Store.getState();
      if (!state.flags.firstMerge) {
        Store.setFlag('firstMerge', true);
        const cheat = getCheat('loot_hoarder');
        emit(EVENTS.DIALOGUE_QUEUED, { text: cheat.systemDialogue.onFirstMerge });
      }
    }));

    // Prestige available — first time reaching zone 4
    unsubs.push(on(EVENTS.PRESTIGE_AVAILABLE, () => {
      emit(EVENTS.DIALOGUE_QUEUED, {
        text: "You've pushed far enough. I can offer you... a reset. Same world, stronger you. It's not a bug, it's a feature.",
      });
    }));

    // Prestige performed — count-indexed snark
    const prestigeLines = [
      'And so the loop begins. You think you\'re getting stronger. I think you\'re getting predictable.',
      'Back again? I\'m starting to think you enjoy the suffering.',
      'Three resets. Most adventurers quit by now. You\'re either brave or broken.',
      'At this point I should just automate the welcome speech. Welcome back. Again.',
    ];
    unsubs.push(on(EVENTS.PRESTIGE_PERFORMED, (data) => {
      const idx = Math.min(data.count - 1, prestigeLines.length - 1);
      emit(EVENTS.DIALOGUE_QUEUED, { text: prestigeLines[idx] });

      // Delayed post-prestige combat snark (5s)
      TimeEngine.scheduleOnce('dialogue:prestigeSnark', () => {
        emit(EVENTS.DIALOGUE_QUEUED, {
          text: 'Look at you. Demolishing rats like they owe you money. Feeling powerful?',
        });
      }, 5000);
    }));
  },

  destroy() {
    for (const unsub of unsubs) unsub();
    unsubs = [];
  },
};

export default DialogueManager;
