// Equipment slot definitions — V2 active slots (7) + legacy full set (33 IDs for Store shape).
// V2 uses zone-based unlock instead of tier-based unlock.

import Store from '../systems/Store.js';
import { getArea } from './areas.js';

// ── V2 Active Slots (7 slots used in vertical slice) ──────────────────

const V2_ACTIVE_SLOTS = [
  // Left column
  { id: 'head',      label: 'Helmet',    unlockZone: 1,  side: 'left',  anchor: { x: 0, y: -279 },  itemSlot: 'head' },
  { id: 'chest',     label: 'Chest',     unlockZone: 1,  side: 'left',  anchor: { x: 0, y: -126 },  itemSlot: 'body' },
  { id: 'legs',      label: 'Legs',      unlockZone: 6,  side: 'left',  anchor: { x: -36, y: 113 }, itemSlot: 'legs' },
  { id: 'boots',     label: 'Boots',     unlockZone: 9,  side: 'left',  anchor: { x: -36, y: 293 }, itemSlot: 'boots' },

  // Right column
  { id: 'main_hand', label: 'Main Hand', unlockZone: 1,  side: 'right', anchor: { x: 126, y: -36 }, itemSlot: 'weapon' },
  { id: 'gloves',    label: 'Gloves',    unlockZone: 17, side: 'right', anchor: { x: 113, y: 23 },  itemSlot: 'gloves' },
  { id: 'amulet',    label: 'Amulet',    unlockZone: 22, side: 'right', anchor: { x: 0, y: -171 },  itemSlot: 'amulet' },
];

/** IDs of the 7 active V2 equipment slots. */
export const ACTIVE_SLOT_IDS = V2_ACTIVE_SLOTS.map(s => s.id);

// ── Legacy full slot list (33 IDs — Store.equipped needs all for state shape) ──

const EQUIP_SLOTS = [
  { id: 'head',      label: 'Helmet',    tier: 0, side: 'left',   anchor: { x: 0, y: -279 },   itemSlot: 'head' },
  { id: 'shoulders', label: 'Shoulders', tier: 1, side: 'left',   anchor: { x: -99, y: -203 }, itemSlot: 'shoulders' },
  { id: 'chest',     label: 'Chest',     tier: 0, side: 'left',   anchor: { x: 0, y: -126 },   itemSlot: 'body' },
  { id: 'tabard',    label: 'Tabard',    tier: 2, side: 'left',   anchor: { x: 0, y: -54 },    itemSlot: 'tabard' },
  { id: 'belt',      label: 'Belt',      tier: 2, side: 'left',   anchor: { x: 0, y: 23 },     itemSlot: 'belt' },
  { id: 'legs',      label: 'Legs',      tier: 0, side: 'left',   anchor: { x: -36, y: 113 },  itemSlot: 'legs' },
  { id: 'greaves',   label: 'Greaves',   tier: 3, side: 'left',   anchor: { x: -36, y: 216 },  itemSlot: 'greaves' },
  { id: 'boots',     label: 'Boots',     tier: 3, side: 'left',   anchor: { x: -36, y: 293 },  itemSlot: 'boots' },
  { id: 'cape',      label: 'Cape',      tier: 2, side: 'right',  anchor: { x: 0, y: -225 },   itemSlot: 'cape' },
  { id: 'amulet',    label: 'Amulet',    tier: 1, side: 'right',  anchor: { x: 0, y: -171 },   itemSlot: 'amulet' },
  { id: 'main_hand', label: 'Main Hand', tier: 0, side: 'right',  anchor: { x: 126, y: -36 },  itemSlot: 'weapon' },
  { id: 'gauntlets', label: 'Gauntlets', tier: 3, side: 'right',  anchor: { x: 113, y: 0 },    itemSlot: 'gauntlets' },
  { id: 'gloves',    label: 'Gloves',    tier: 2, side: 'right',  anchor: { x: 113, y: 23 },   itemSlot: 'gloves' },
  { id: 'ring1',     label: 'Ring 1',    tier: 4, side: 'right',  anchor: { x: 126, y: 36 },   itemSlot: 'ring' },
  { id: 'ring2',     label: 'Ring 2',    tier: 4, side: 'right',  anchor: { x: 126, y: 54 },   itemSlot: 'ring' },
  { id: 'tattoo',    label: 'Tattoo',    tier: 5, side: 'right',  anchor: { x: -81, y: -90 },  itemSlot: 'tattoo' },
  { id: 'bag',            label: 'Bag',       tier: 1, side: 'bottom', anchor: null, itemSlot: 'bag' },
  { id: 'relic',          label: 'Relic',     tier: 3, side: 'bottom', anchor: null, itemSlot: 'relic' },
  { id: 'trophy',         label: 'Trophy',    tier: 2, side: 'bottom', anchor: null, itemSlot: 'trophy' },
  { id: 'companion_gear', label: 'Companion', tier: 4, side: 'bottom', anchor: null, itemSlot: 'companion_gear' },
  { id: 'mount_gear',     label: 'Mount',     tier: 4, side: 'bottom', anchor: null, itemSlot: 'mount_gear' },
  { id: 'light',          label: 'Light',     tier: 2, side: 'bottom', anchor: null, itemSlot: 'light' },
  { id: 'tome',           label: 'Tome',      tier: 3, side: 'bottom', anchor: null, itemSlot: 'tome' },
  { id: 'map_slot',       label: 'Map',       tier: 3, side: 'bottom', anchor: null, itemSlot: 'map' },
  { id: 'waterskin',      label: 'Waterskin', tier: 2, side: 'bottom', anchor: null, itemSlot: 'waterskin' },
  { id: 'title_slot',     label: 'Title',     tier: 5, side: 'bottom', anchor: null, itemSlot: 'title' },
  { id: 'shadow',         label: 'Shadow',    tier: 6, side: 'bottom', anchor: null, itemSlot: 'shadow' },
  { id: 'familiar',       label: 'Familiar',  tier: 5, side: 'bottom', anchor: null, itemSlot: 'familiar' },
  { id: 'aura',           label: 'Aura',      tier: 6, side: 'bottom', anchor: null, itemSlot: 'aura' },
  { id: 'meal',           label: 'Meal',      tier: 1, side: 'bottom', anchor: null, itemSlot: 'meal' },
  { id: 'dream',          label: 'Dream',     tier: 7, side: 'bottom', anchor: null, itemSlot: 'dream' },
  { id: 'true_name',      label: 'True Name', tier: 7, side: 'bottom', anchor: null, itemSlot: 'true_name' },
  { id: 'secret',         label: 'Secret',    tier: 7, side: 'bottom', anchor: null, itemSlot: 'secret' },
];

/** All slot IDs (for Store equipped object — all 33 keys). */
export const ALL_SLOT_IDS = EQUIP_SLOTS.map(s => s.id);

// ── V2 item-slot-to-equip mapping (active slots only) ──────────────────

const V2_ITEM_SLOT_TO_EQUIP = {};
for (const slot of V2_ACTIVE_SLOTS) {
  if (!V2_ITEM_SLOT_TO_EQUIP[slot.itemSlot]) {
    V2_ITEM_SLOT_TO_EQUIP[slot.itemSlot] = slot.id;
  }
}

/** Get equip slot ID for an item's slot field. Only maps to active V2 slots. */
export function getEquipSlotForItem(itemSlot) {
  return V2_ITEM_SLOT_TO_EQUIP[itemSlot] || null;
}

// ── Zone-based helpers ─────────────────────────────────────────────────

/** Compute the player's current global zone from Store state. */
export function getPlayerGlobalZone() {
  const state = Store.getState();
  const area = getArea(state.currentArea);
  if (!area) return 1;
  return area.zoneStart + state.currentZone - 1;
}

/** Get the unlock zone for an active slot. Returns Infinity if not an active slot. */
export function getSlotUnlockZone(equipId) {
  const slot = V2_ACTIVE_SLOTS.find(s => s.id === equipId);
  return slot ? slot.unlockZone : Infinity;
}

/** Get unlocked left-column active slots in order. */
export function getLeftSlots(globalZone) {
  return V2_ACTIVE_SLOTS.filter(s => s.side === 'left' && globalZone >= s.unlockZone);
}

/** Get unlocked right-column active slots in order. */
export function getRightSlots(globalZone) {
  return V2_ACTIVE_SLOTS.filter(s => s.side === 'right' && globalZone >= s.unlockZone);
}

/** Get accessory slots — empty in vertical slice. */
export function getAccessorySlots() {
  return [];
}

/** Find a slot definition by its id. Searches V2 active slots first, then legacy. */
export function getSlotById(id) {
  return V2_ACTIVE_SLOTS.find(s => s.id === id) || EQUIP_SLOTS.find(s => s.id === id) || null;
}

export { EQUIP_SLOTS, V2_ACTIVE_SLOTS };
