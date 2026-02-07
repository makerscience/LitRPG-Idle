// Cheat definitions — unlockable exploits that bend game rules.
// Shape: { id, name, description, systemDialogue }

const CHEATS = {
  loot_hoarder: {
    id: 'loot_hoarder',
    name: 'Loot Hoarder',
    description: 'Items auto-merge when 100 of the same kind accumulate.',
    systemDialogue: {
      onUnlock: "WARNING: Inventory anomaly detected. Items are... combining? This isn't in the patch notes.",
      onActivate: "You can't just smash swords together and expect\u2014 oh. Oh no. It's working.",
      onDeactivate: "Good. Put the swords down. Slowly.",
      onFirstMerge: "That... that shouldn't be possible. You just FUSED WEAPONS.",
    },
  },
};

export function getCheat(id) {
  return CHEATS[id] ?? null;
}

export function getAllCheats() {
  return Object.values(CHEATS);
}

export { CHEATS };
