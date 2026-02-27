// SkillUnlockDirector - progression-based unlocks for stance secondary skills.
// Owns unlock triggers and emits SKILL_UNLOCKED for UI/dialogue reactions.

import Store from './Store.js';
import { getArea } from '../data/areas.js';
import { createScope, emit, EVENTS } from '../events.js';

let scope = null;

const SKILL_TO_FLAG = {
  armorBreak: 'unlockedArmorBreak',
  interrupt: 'unlockedInterrupt',
  cleanse: 'unlockedCleanse',
};

const GLOBAL_ZONE_GATES = {
  armorBreak: 6,
  cleanse: 11,
};

function getCurrentGlobalZone() {
  const state = Store.getState();
  const area = getArea(state.currentArea);
  if (!area) return state.currentZone;
  return area.zoneStart + state.currentZone - 1;
}

function isSkillUnlocked(skillId) {
  const flag = SKILL_TO_FLAG[skillId];
  if (!flag) return false;
  return !!Store.getState().flags[flag];
}

function unlockSkill(skillId) {
  const flag = SKILL_TO_FLAG[skillId];
  if (!flag || isSkillUnlocked(skillId)) return false;
  Store.setFlag(flag, true);
  emit(EVENTS.SKILL_UNLOCKED, { skillId });
  return true;
}

function hasArmorTrait(member) {
  return (member?.armor?.reduction ?? 0) > 0;
}

function hasCleansePressureTrait(member) {
  const thorns = Number(member?.thorns || 0);
  const corruption = Number(member?.corruption || 0);
  return thorns > 0 || !!member?.dot || corruption > 0;
}

const SkillUnlockDirector = {
  init() {
    if (scope) return;
    scope = createScope();

    scope.on(EVENTS.COMBAT_ENCOUNTER_STARTED, (data) => {
      const members = data?.members || [];
      const globalZone = getCurrentGlobalZone();

      if (
        !isSkillUnlocked('armorBreak')
        && globalZone >= GLOBAL_ZONE_GATES.armorBreak
        && members.some(hasArmorTrait)
      ) {
        unlockSkill('armorBreak');
      }

      if (
        !isSkillUnlocked('cleanse')
        && globalZone >= GLOBAL_ZONE_GATES.cleanse
        && members.some(hasCleansePressureTrait)
      ) {
        unlockSkill('cleanse');
      }
    });

    scope.on(EVENTS.COMBAT_ENEMY_CASTING, (data) => {
      if (!isSkillUnlocked('interrupt')) {
        // Phase 3: prefer charge-based unlock. Keep summon/no-kind as fallback.
        if (data?.castKind === 'charge' || data?.castKind === 'summon' || !data?.castKind) {
          unlockSkill('interrupt');
        }
      }
    });
  },

  destroy() {
    scope?.destroy();
    scope = null;
  },
};

export default SkillUnlockDirector;
