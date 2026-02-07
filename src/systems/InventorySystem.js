// InventorySystem — bridges Store mutations with game logic for inventory/equipment.
// Called directly by LootEngine and UI (no event subscriptions needed).

import Store from './Store.js';
import { emit, EVENTS } from '../events.js';
import { getItem } from '../data/items.js';
import { INVENTORY, LOOT } from '../config.js';

let _mergeDepth = 0;

const InventorySystem = {
  /**
   * Try to add an item to inventory. Returns true on success.
   * Emits INV_FULL if inventory is at capacity and item is a new stack.
   */
  tryAddItem(itemId, count = 1) {
    const state = Store.getState();
    const stacks = state.inventoryStacks;

    // If item already exists as a stack, always allow (stacks are unlimited)
    if (stacks[itemId]) {
      Store.addInventoryItem(itemId, count);
      InventorySystem._tryAutoMerge(itemId);
      return true;
    }

    // New stack — check capacity
    if (Object.keys(stacks).length >= INVENTORY.maxUniqueStacks) {
      emit(EVENTS.INV_FULL, { itemId });
      return false;
    }

    Store.addInventoryItem(itemId, count);
    InventorySystem._tryAutoMerge(itemId);
    return true;
  },

  /**
   * Equip an item from inventory. Unequips existing item in that slot first.
   */
  equipItem(itemId) {
    const item = getItem(itemId);
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
    Store.removeInventoryItem(itemId, 1);

    // Equip the item
    Store.equipItem(slot, itemId);
  },

  /**
   * Unequip an item from a slot, returning it to inventory.
   */
  unequipItem(slot) {
    const state = Store.getState();
    const itemId = state.equipped[slot];
    if (!itemId) return;

    // Check if inventory has room for the unequipped item
    const stacks = state.inventoryStacks;
    if (!stacks[itemId] && Object.keys(stacks).length >= INVENTORY.maxUniqueStacks) {
      emit(EVENTS.INV_FULL, { itemId });
      return;
    }

    Store.unequipItem(slot);
    Store.addInventoryItem(itemId, 1);
  },

  /**
   * Sell items from inventory for gold.
   */
  sellItem(itemId, count = 1) {
    const item = getItem(itemId);
    if (!item) return;

    const state = Store.getState();
    const stack = state.inventoryStacks[itemId];
    if (!stack) return;

    const actualCount = Math.min(count, stack.count);
    const totalGold = item.sellValue * actualCount;

    Store.removeInventoryItem(itemId, actualCount);
    Store.addGold(totalGold);

    emit(EVENTS.INV_ITEM_SOLD, { itemId, count: actualCount, goldGained: totalGold });
  },

  /**
   * Auto-merge items when Loot Hoarder is active and stack >= mergeThreshold.
   * Chain merges happen naturally: tryAddItem → _tryAutoMerge → tryAddItem.
   * Bounded by _mergeDepth (max 4) to prevent runaway recursion.
   */
  _tryAutoMerge(itemId) {
    if (_mergeDepth >= 4) return;

    const state = Store.getState();
    if (!state.activeCheats['loot_hoarder']) return;

    const item = getItem(itemId);
    if (!item || !item.mergesInto) return;

    const stack = state.inventoryStacks[itemId];
    if (!stack || stack.count < LOOT.mergeThreshold) return;

    const mergeCount = Math.floor(stack.count / LOOT.mergeThreshold);
    const consumed = mergeCount * LOOT.mergeThreshold;

    Store.removeInventoryItem(itemId, consumed);

    const targetItem = getItem(item.mergesInto);

    // Increment depth before adding merged items (tryAddItem will call _tryAutoMerge again)
    _mergeDepth++;
    InventorySystem.tryAddItem(item.mergesInto, mergeCount);
    _mergeDepth--;

    emit(EVENTS.INV_ITEM_MERGED, {
      itemId,
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
    const weaponId = state.equipped.weapon;
    if (!weaponId) return 0;

    const item = getItem(weaponId);
    return item ? item.statBonuses.atk : 0;
  },
};

export default InventorySystem;
