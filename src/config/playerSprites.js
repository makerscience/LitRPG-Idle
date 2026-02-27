// playerSprites.js — Armor set sprite definitions + detection logic.
// Each set maps pose names to texture keys loaded in BootScene.

export const ARMOR_SETS = {
  armor001: {
    id: 'armor001',
    default: 'player001_default',
    walkFrames: ['player001_walk1', 'player001_walk3'],
    fortressWalkFrames: ['fortressstance_001', 'fortressstance_002'],
    attackSprites: [
      'player001_jumpkick', 'player001_kick',
      'player001_elbow', 'player001_kneestrike',
      'player001_roundhousekick', 'player001_jab',
    ],
    strongPunch: 'player001_strongpunch',
    hitReaction: 'player001_hitreaction',
    powerCharge: 'powerstance_001charge',
    // Frames that need the 1.05× scale bump during walk cycle
    largeFrames: ['player001_walk3', 'fortressstance_001', 'fortressstance_002'],
  },

  armor002: {
    id: 'armor002',
    default: 'player002_default',
    walkFrames: ['player002_default', 'player002_walk2'],
    fortressWalkFrames: ['player002_fortressstance1'],
    attackSprites: [
      'player002_attack1', 'player002_attack2',
      'player002_attack3', 'player002_attack4',
      'player002_attack5',
    ],
    strongPunch: 'player002_stronghit',
    hitReaction: 'player002_hitreaction',
    powerCharge: 'player002_charge',
    largeFrames: ['player002_fortressstance1'],
    scaleOverrides: { 'player002_walk2': 0.98, 'player002_attack1': 1.1, 'player002_attack2': 1.1, 'player002_attack3': 1.1, 'player002_attack4': 1.1, 'player002_attack5': 1.1, 'player002_stronghit': 1.2 },
    yOffsets: { 'player002_attack1': -10, 'player002_attack2': -10, 'player002_stronghit': 15 },
  },
};

// The 5 combat equip slots that count toward armor set detection.
// Waterskin is excluded — it's a utility slot.
const COMBAT_SLOTS = ['chest', 'boots', 'head', 'legs', 'main_hand'];

/**
 * Determine which armor set should be active based on equipped items.
 * Returns armor002 if ALL 5 combat slots have area 2+ items (a2_, a3_, etc.), else armor001.
 *
 * @param {Object} equipped - Store.getState().equipped
 * @param {Function} parseStackKey - InventorySystem.parseStackKey
 * @returns {Object} The active ARMOR_SETS entry
 */
export function getActiveArmorSet(equipped, parseStackKey) {
  const allA2Plus = COMBAT_SLOTS.every(slot => {
    const stackKey = equipped[slot];
    if (!stackKey) return false;
    const { itemId } = parseStackKey(stackKey);
    const m = itemId.match(/^a(\d+)_/);
    return m && parseInt(m[1], 10) >= 2;
  });
  return allA2Plus ? ARMOR_SETS.armor002 : ARMOR_SETS.armor001;
}
