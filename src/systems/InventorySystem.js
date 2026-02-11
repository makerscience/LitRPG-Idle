// InventorySystem — bridges Store mutations with game logic for inventory/equipment.
// Called directly by LootEngine and UI (no event subscriptions needed).
// Stack keys use composite format: 'itemId::rarity' (e.g. 'iron_dagger::rare').

import Store from './Store.js';
import { emit, EVENTS } from '../events.js';
import { getItem, getScaledItem } from '../data/items.js';
import { INVENTORY, LOOT } from '../config.js';

let _mergeDepth = 0;

/** Build a composite stack key from itemId and rarity. */
export function makeStackKey(itemId, rarity) {
  return `${itemId}::${rarity}`;
}

/** Parse a composite stack key into { itemId, rarity }. */
export function parseStackKey(stackKey) {
  if (stackKey && stackKey.includes('::')) {
    const [itemId, rarity] = stackKey.split('::');
    return { itemId, rarity };
  }
  // Legacy fallback: plain itemId with no rarity
  return { itemId: stackKey, rarity: 'common' };
}

const InventorySystem = {
  /**
   * Try to add an item to inventory. Returns true on success.
   * Emits INV_FULL if inventory is at capacity and item is a new stack.
   */
  tryAddItem(itemId, count = 1, rarity = 'common') {
    const stackKey = makeStackKey(itemId, rarity);
    const state = Store.getState();
    const stacks = state.inventoryStacks;

    // If item already exists as a stack, always allow (stacks are unlimited)
    if (stacks[stackKey]) {
      Store.addInventoryItem(stackKey, count);
      InventorySystem._tryAutoMerge(stackKey);
      return true;
    }

    // New stack — check capacity
    if (Object.keys(stacks).length >= INVENTORY.maxUniqueStacks) {
      emit(EVENTS.INV_FULL, { itemId });
      return false;
    }

    Store.addInventoryItem(stackKey, count);
    InventorySystem._tryAutoMerge(stackKey);
    return true;
  },

  /**
   * Equip an item from inventory. Unequips existing item in that slot first.
   * stackKey is the composite key (e.g. 'iron_dagger::rare').
   */
  equipItem(stackKey) {
    const item = getItem(stackKey);
    if (!item) return;

    const state = Store.getState();
    const slot = item.slot;

    // Unequip existing item in that slot (return to inventory)
    const currentlyEquipped = state.equipped[slot];
    if (currentlyEquipped) {
      Store.addInventoryItem(currentlyEquipped, 1);
      Store.unequipItem(slot);
    }

    // Remove 1 from inventory stack
    Store.removeInventoryItem(stackKey, 1);

    // Equip the item (store full stack key so rarity is preserved)
    Store.equipItem(slot, stackKey);
  },

  /**
   * Unequip an item from a slot, returning it to inventory.
   */
  unequipItem(slot) {
    const state = Store.getState();
    const stackKey = state.equipped[slot];
    if (!stackKey) return;

    // Check if inventory has room for the unequipped item
    const stacks = state.inventoryStacks;
    if (!stacks[stackKey] && Object.keys(stacks).length >= INVENTORY.maxUniqueStacks) {
      emit(EVENTS.INV_FULL, { itemId: stackKey });
      return;
    }

    Store.unequipItem(slot);
    Store.addInventoryItem(stackKey, 1);
  },

  /**
   * Sell items from inventory for gold.
   * stackKey is the composite key (e.g. 'iron_dagger::rare').
   */
  sellItem(stackKey, count = 1) {
    const scaled = getScaledItem(stackKey);
    if (!scaled) return;

    const state = Store.getState();
    const stack = state.inventoryStacks[stackKey];
    if (!stack) return;

    const actualCount = Math.min(count, stack.count);
    const totalGold = scaled.sellValue * actualCount;

    Store.removeInventoryItem(stackKey, actualCount);
    Store.addGold(totalGold);

    emit(EVENTS.INV_ITEM_SOLD, { itemId: stackKey, count: actualCount, goldGained: totalGold });
  },

  /**
   * Auto-merge items when Loot Hoarder is active and stack >= mergeThreshold.
   * Chain merges happen naturally: tryAddItem → _tryAutoMerge → tryAddItem.
   * Bounded by _mergeDepth (max 4) to prevent runaway recursion.
   */
  _tryAutoMerge(stackKey) {
    if (_mergeDepth >= 4) return;

    const state = Store.getState();
    if (!state.activeCheats['loot_hoarder']) return;

    const item = getItem(stackKey);
    if (!item || !item.mergesInto) return;

    const stack = state.inventoryStacks[stackKey];
    if (!stack || stack.count < LOOT.mergeThreshold) return;

    const mergeCount = Math.floor(stack.count / LOOT.mergeThreshold);
    const consumed = mergeCount * LOOT.mergeThreshold;

    Store.removeInventoryItem(stackKey, consumed);

    // Merged item inherits the rarity of the source stack
    const { rarity } = parseStackKey(stackKey);
    const targetItem = getItem(item.mergesInto);

    // Increment depth before adding merged items (tryAddItem will call _tryAutoMerge again)
    _mergeDepth++;
    InventorySystem.tryAddItem(item.mergesInto, mergeCount, rarity);
    _mergeDepth--;

    emit(EVENTS.INV_ITEM_MERGED, {
      itemId: stackKey,
      targetItemId: item.mergesInto,
      merges: mergeCount,
      newTier: targetItem ? targetItem.tier : item.tier + 1,
    });
  },

  /**
   * Get the ATK bonus from the currently equipped weapon (or 0).
   */
  getEquippedWeaponDamage() {
    const state = Store.getState();
    const weaponKey = state.equipped.weapon;
    if (!weaponKey) return 0;

    const item = getScaledItem(weaponKey);
    return item ? item.statBonuses.atk : 0;
  },
};

export default InventorySystem;
