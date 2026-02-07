// DialogueManager — data-driven SYSTEM dialogue with cooldowns and arbitration.
// Subscribes to game events, checks Store.flags, emits DIALOGUE_QUEUED.

import Store from './Store.js';
import TimeEngine from './TimeEngine.js';
import { on, emit, EVENTS } from '../events.js';
import { getCheat } from '../data/cheats.js';
import {
  FIRST_KILL, FIRST_LEVEL_UP, FIRST_EQUIP, FIRST_FRAGMENT, FIRST_SELL,
  ZONE_ENTRANCE, KILL_MILESTONES, COMBAT_COMMENTARY, EXPLOIT_UPGRADE,
  CHEAT_TOGGLE_ON, CHEAT_TOGGLE_OFF,
  PRESTIGE_AVAILABLE, PRESTIGE_PERFORMED, PRESTIGE_PERFORMED_DEFAULT, POST_PRESTIGE_COMBAT,
  BIG_DAMAGE, AMBIENT_SNARK, INVENTORY_FULL,
} from '../data/dialogue.js';

let unsubs = [];

/** Cooldown tracker — stores last-fired timestamps (Date.now). */
const cooldowns = {};

function isOnCooldown(key, durationMs) {
  const last = cooldowns[key] || 0;
  return (Date.now() - last) < durationMs;
}

function setCooldown(key) {
  cooldowns[key] = Date.now();
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function say(text) {
  emit(EVENTS.DIALOGUE_QUEUED, { text });
}

const DialogueManager = {
  init() {
    // Reset cooldowns on init
    for (const k in cooldowns) delete cooldowns[k];

    // ── First kill (one-shot) ────────────────────────────────────
    unsubs.push(on(EVENTS.COMBAT_ENEMY_KILLED, () => {
      const state = Store.getState();
      if (!state.flags.firstKill) {
        Store.setFlag('firstKill', true);
        say(pick(FIRST_KILL));
      }
    }));

    // ── Kill milestones + random combat commentary ───────────────
    unsubs.push(on(EVENTS.COMBAT_ENEMY_KILLED, () => {
      const state = Store.getState();
      const kills = state.totalKills;

      // Kill milestones (priority over random commentary)
      let milestoneHit = false;
      for (const [threshold, line] of Object.entries(KILL_MILESTONES)) {
        const t = Number(threshold);
        const flagKey = `kills${t}`;
        if (kills >= t && !state.flags[flagKey]) {
          Store.setFlag(flagKey, true);
          say(line);
          milestoneHit = true;
          break; // one milestone per kill
        }
      }

      // Random combat commentary (~3% chance, 30s cooldown, suppressed by milestone)
      if (!milestoneHit && Math.random() < 0.03 && !isOnCooldown('combatCommentary', 30000)) {
        const zone = state.currentZone;
        const lines = COMBAT_COMMENTARY[zone];
        if (lines && lines.length > 0) {
          setCooldown('combatCommentary');
          say(pick(lines));
        }
      }
    }));

    // ── First level up (one-shot) ────────────────────────────────
    unsubs.push(on(EVENTS.PROG_LEVEL_UP, () => {
      const state = Store.getState();
      if (!state.flags.firstLevelUp) {
        Store.setFlag('firstLevelUp', true);
        say(pick(FIRST_LEVEL_UP));
      }
    }));

    // ── Zone entrances (one-shot per zone) ───────────────────────
    unsubs.push(on(EVENTS.WORLD_ZONE_CHANGED, (data) => {
      const state = Store.getState();
      const zone = data.zone;
      if (zone >= 2) {
        const flagKey = `reachedZone${zone}`;
        if (!state.flags[flagKey] && ZONE_ENTRANCE[zone]) {
          Store.setFlag(flagKey, true);
          say(ZONE_ENTRANCE[zone]);
        }
      }
    }));

    // ── First equip (one-shot) ───────────────────────────────────
    unsubs.push(on(EVENTS.INV_ITEM_EQUIPPED, () => {
      const state = Store.getState();
      if (!state.flags.firstEquip) {
        Store.setFlag('firstEquip', true);
        say(pick(FIRST_EQUIP));
      }
    }));

    // ── First sell (one-shot) ────────────────────────────────────
    unsubs.push(on(EVENTS.INV_ITEM_SOLD, () => {
      const state = Store.getState();
      if (!state.flags.firstSell) {
        Store.setFlag('firstSell', true);
        say(pick(FIRST_SELL));
      }
    }));

    // ── Inventory full (repeatable) ──────────────────────────────
    unsubs.push(on(EVENTS.INV_FULL, () => {
      say(pick(INVENTORY_FULL));
    }));

    // ── First glitch fragment (one-shot) ─────────────────────────
    unsubs.push(on(EVENTS.ECON_FRAGMENTS_GAINED, () => {
      const state = Store.getState();
      if (!state.flags.firstFragment) {
        Store.setFlag('firstFragment', true);
        say(pick(FIRST_FRAGMENT));
      }
    }));

    // ── First item merge (one-shot, reads from cheats.js data) ──
    unsubs.push(on(EVENTS.INV_ITEM_MERGED, () => {
      const state = Store.getState();
      if (!state.flags.firstMerge) {
        Store.setFlag('firstMerge', true);
        const cheat = getCheat('loot_hoarder');
        say(cheat.systemDialogue.onFirstMerge);
      }
    }));

    // ── Exploit upgrade snark ────────────────────────────────────
    unsubs.push(on(EVENTS.UPG_PURCHASED, (data) => {
      if (data.category === 'exploit') {
        say(pick(EXPLOIT_UPGRADE));
      }
    }));

    // ── Cheat toggle snark ───────────────────────────────────────
    unsubs.push(on(EVENTS.CHEAT_TOGGLED, (data) => {
      if (data.active) {
        say(pick(CHEAT_TOGGLE_ON));
      } else {
        say(pick(CHEAT_TOGGLE_OFF));
      }
    }));

    // ── Prestige available (one-shot) ────────────────────────────
    unsubs.push(on(EVENTS.PRESTIGE_AVAILABLE, () => {
      say(pick(PRESTIGE_AVAILABLE));
    }));

    // ── Prestige performed (count-indexed) ───────────────────────
    unsubs.push(on(EVENTS.PRESTIGE_PERFORMED, (data) => {
      const line = PRESTIGE_PERFORMED[data.count] || PRESTIGE_PERFORMED_DEFAULT;
      say(line);

      // Delayed post-prestige combat snark (5s)
      TimeEngine.scheduleOnce('dialogue:prestigeSnark', () => {
        say(pick(POST_PRESTIGE_COMBAT));
      }, 5000);
    }));

    // ── Big damage (>1M, 15s cooldown) ───────────────────────────
    unsubs.push(on(EVENTS.COMBAT_ENEMY_DAMAGED, (data) => {
      if (data.amount.gte && data.amount.gte(1e6) && !isOnCooldown('bigDamage', 15000)) {
        setCooldown('bigDamage');
        say(pick(BIG_DAMAGE));
      }
    }));

    // ── Ambient snark (every ~120s, starts after 180s uptime) ────
    TimeEngine.register('dialogue:ambient', () => {
      say(pick(AMBIENT_SNARK));
    }, 120000, false); // starts disabled

    TimeEngine.scheduleOnce('dialogue:ambientEnable', () => {
      TimeEngine.setEnabled('dialogue:ambient', true);
    }, 180000);
  },

  destroy() {
    for (const unsub of unsubs) unsub();
    unsubs = [];
    TimeEngine.unregister('dialogue:prestigeSnark');
    TimeEngine.unregister('dialogue:ambient');
    TimeEngine.unregister('dialogue:ambientEnable');
  },
};

export default DialogueManager;
