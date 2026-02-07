// Item definitions — 12 items across 5 zones.
// Shape: { id, name, slot, rarity, tier, statBonuses, sellValue, mergesInto, description }

const ITEMS = {
  // Zone 1
  iron_dagger: {
    id: 'iron_dagger',
    name: 'Iron Dagger',
    slot: 'weapon',
    rarity: 'common',
    tier: 0,
    statBonuses: { atk: 5, def: 0 },
    sellValue: 10,
    mergesInto: 'steel_sword',
    description: 'A rusty blade. Better than nothing.',
  },
  iron_helm: {
    id: 'iron_helm',
    name: 'Iron Helm',
    slot: 'head',
    rarity: 'common',
    tier: 0,
    statBonuses: { atk: 0, def: 3 },
    sellValue: 8,
    mergesInto: null,
    description: 'Dented, but functional.',
  },
  leather_tunic: {
    id: 'leather_tunic',
    name: 'Leather Tunic',
    slot: 'body',
    rarity: 'common',
    tier: 0,
    statBonuses: { atk: 0, def: 5 },
    sellValue: 12,
    mergesInto: null,
    description: 'Smells faintly of cow.',
  },

  // Zone 2
  steel_sword: {
    id: 'steel_sword',
    name: 'Steel Sword',
    slot: 'weapon',
    rarity: 'uncommon',
    tier: 1,
    statBonuses: { atk: 15, def: 0 },
    sellValue: 50,
    mergesInto: 'mithril_blade',
    description: 'Sharp enough to shave a troll.',
  },
  leather_cap: {
    id: 'leather_cap',
    name: 'Leather Cap',
    slot: 'head',
    rarity: 'common',
    tier: 0,
    statBonuses: { atk: 0, def: 8 },
    sellValue: 30,
    mergesInto: null,
    description: 'Protects against mild disapproval.',
  },
  chainmail_vest: {
    id: 'chainmail_vest',
    name: 'Chainmail Vest',
    slot: 'body',
    rarity: 'uncommon',
    tier: 1,
    statBonuses: { atk: 0, def: 12 },
    sellValue: 60,
    mergesInto: null,
    description: 'Jingly but effective.',
  },
  iron_greaves: {
    id: 'iron_greaves',
    name: 'Iron Greaves',
    slot: 'legs',
    rarity: 'common',
    tier: 0,
    statBonuses: { atk: 0, def: 7 },
    sellValue: 25,
    mergesInto: null,
    description: 'Heavy. Good for kicking.',
  },

  // Zone 3
  mithril_blade: {
    id: 'mithril_blade',
    name: 'Mithril Blade',
    slot: 'weapon',
    rarity: 'rare',
    tier: 2,
    statBonuses: { atk: 50, def: 0 },
    sellValue: 500,
    mergesInto: 'adamantine_axe',
    description: 'Lighter than air, sharper than wit.',
  },
  steel_helm: {
    id: 'steel_helm',
    name: 'Steel Helm',
    slot: 'head',
    rarity: 'uncommon',
    tier: 1,
    statBonuses: { atk: 0, def: 20 },
    sellValue: 300,
    mergesInto: null,
    description: 'Makes you look important.',
  },
  steel_greaves: {
    id: 'steel_greaves',
    name: 'Steel Greaves',
    slot: 'legs',
    rarity: 'uncommon',
    tier: 1,
    statBonuses: { atk: 0, def: 20 },
    sellValue: 300,
    mergesInto: null,
    description: 'Stompy and reliable.',
  },

  // Zone 4
  adamantine_axe: {
    id: 'adamantine_axe',
    name: 'Adamantine Axe',
    slot: 'weapon',
    rarity: 'epic',
    tier: 3,
    statBonuses: { atk: 200, def: 0 },
    sellValue: 5000,
    mergesInto: 'dragonbone_blade',
    description: 'Cuts through excuses.',
  },

  // Zone 5
  dragonbone_blade: {
    id: 'dragonbone_blade',
    name: 'Dragonbone Blade',
    slot: 'weapon',
    rarity: 'epic',
    tier: 4,
    statBonuses: { atk: 1000, def: 0 },
    sellValue: 50000,
    mergesInto: null,
    description: 'Forged from what used to be a god.',
  },
};

export function getItem(id) {
  return ITEMS[id] ?? null;
}

export function getItemsForSlot(slot) {
  return Object.values(ITEMS).filter(item => item.slot === slot);
}

export { ITEMS };
