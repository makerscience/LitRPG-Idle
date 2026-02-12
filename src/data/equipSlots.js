// Equipment slot definitions — declarative data for all ~33 equipment slots.
// Each slot has: id (Store key), label, tier, side, anchor, itemSlot.
// Tier unlock: maxTier = furthestArea - 1 (area 1→tier 0, area 2→tier 1, etc.)

import Store from '../systems/Store.js';

// Slot definitions ordered by display position within each column.
// side: 'left' | 'right' | 'bottom' (placement relative to silhouette)
// anchor: {x,y} offset from silhouette center for connector line endpoint; null if no line

const EQUIP_SLOTS = [
  // Left column (top to bottom)
  // Anchor coords are offsets from silhouette center, sized for 540x675 display (4.5x scale)
  { id: 'head',      label: 'Helmet',    tier: 0, side: 'left',   anchor: { x: 0, y: -279 },   itemSlot: 'head' },
  { id: 'shoulders', label: 'Shoulders', tier: 1, side: 'left',   anchor: { x: -99, y: -203 }, itemSlot: 'shoulders' },
  { id: 'chest',     label: 'Chest',     tier: 0, side: 'left',   anchor: { x: 0, y: -126 },   itemSlot: 'body' },
  { id: 'tabard',    label: 'Tabard',    tier: 2, side: 'left',   anchor: { x: 0, y: -54 },    itemSlot: 'tabard' },
  { id: 'belt',      label: 'Belt',      tier: 2, side: 'left',   anchor: { x: 0, y: 23 },     itemSlot: 'belt' },
  { id: 'legs',      label: 'Legs',      tier: 0, side: 'left',   anchor: { x: -36, y: 113 },  itemSlot: 'legs' },
  { id: 'greaves',   label: 'Greaves',   tier: 3, side: 'left',   anchor: { x: -36, y: 216 },  itemSlot: 'greaves' },
  { id: 'boots',     label: 'Boots',     tier: 3, side: 'left',   anchor: { x: -36, y: 293 },  itemSlot: 'boots' },

  // Right column (top to bottom)
  { id: 'cape',      label: 'Cape',      tier: 2, side: 'right',  anchor: { x: 0, y: -225 },   itemSlot: 'cape' },
  { id: 'amulet',    label: 'Amulet',    tier: 1, side: 'right',  anchor: { x: 0, y: -171 },   itemSlot: 'amulet' },
  { id: 'main_hand', label: 'Main Hand', tier: 0, side: 'right',  anchor: { x: 126, y: -36 },  itemSlot: 'weapon' },
  { id: 'gauntlets', label: 'Gauntlets', tier: 3, side: 'right',  anchor: { x: 113, y: 0 },    itemSlot: 'gauntlets' },
  { id: 'gloves',    label: 'Gloves',    tier: 2, side: 'right',  anchor: { x: 113, y: 23 },   itemSlot: 'gloves' },
  { id: 'ring1',     label: 'Ring 1',    tier: 4, side: 'right',  anchor: { x: 126, y: 36 },   itemSlot: 'ring' },
  { id: 'ring2',     label: 'Ring 2',    tier: 4, side: 'right',  anchor: { x: 126, y: 54 },   itemSlot: 'ring' },
  { id: 'tattoo',    label: 'Tattoo',    tier: 5, side: 'right',  anchor: { x: -81, y: -90 },  itemSlot: 'tattoo' },

  // Bottom accessories (no connector lines)
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

// Ordered lists for column layout
const LEFT_ORDER  = EQUIP_SLOTS.filter(s => s.side === 'left');
const RIGHT_ORDER = EQUIP_SLOTS.filter(s => s.side === 'right');
const BOTTOM_ORDER = EQUIP_SLOTS.filter(s => s.side === 'bottom');

/** All slot IDs (for Store equipped object). */
export const ALL_SLOT_IDS = EQUIP_SLOTS.map(s => s.id);

/** Map from itemSlot → equip slot id (first match). For ring, returns 'ring1'. */
const ITEM_SLOT_TO_EQUIP = {};
for (const slot of EQUIP_SLOTS) {
  if (!ITEM_SLOT_TO_EQUIP[slot.itemSlot]) {
    ITEM_SLOT_TO_EQUIP[slot.itemSlot] = slot.id;
  }
}

/** Get equip slot ID for an item's slot field. */
export function getEquipSlotForItem(itemSlot) {
  return ITEM_SLOT_TO_EQUIP[itemSlot] || null;
}

/** Get max equipment tier based on furthest area reached. */
export function getMaxEquipTier() {
  const state = Store.getState();
  return Math.max(0, state.furthestArea - 1);
}

/** Get all unlocked slots (tier <= maxTier). */
export function getUnlockedSlots(maxTier) {
  return EQUIP_SLOTS.filter(s => s.tier <= maxTier);
}

/** Get unlocked body slots (left + right columns). */
export function getBodySlots(maxTier) {
  return EQUIP_SLOTS.filter(s => s.tier <= maxTier && (s.side === 'left' || s.side === 'right'));
}

/** Get unlocked left-column body slots in order. */
export function getLeftSlots(maxTier) {
  return LEFT_ORDER.filter(s => s.tier <= maxTier);
}

/** Get unlocked right-column body slots in order. */
export function getRightSlots(maxTier) {
  return RIGHT_ORDER.filter(s => s.tier <= maxTier);
}

/** Get unlocked accessory slots (bottom row). */
export function getAccessorySlots(maxTier) {
  return BOTTOM_ORDER.filter(s => s.tier <= maxTier);
}

/** Find a slot definition by its id. */
export function getSlotById(id) {
  return EQUIP_SLOTS.find(s => s.id === id) || null;
}

export { EQUIP_SLOTS };
