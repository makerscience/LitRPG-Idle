// LootEngine — rolls loot drops on enemy kill.
// Subscribes to COMBAT_ENEMY_KILLED, uses InventorySystem to add items.

import Store from './Store.js';
import { on, emit, EVENTS } from '../events.js';
import { INVENTORY, LOOT, ECONOMY, CHEATS } from '../config.js';
import InventorySystem from './InventorySystem.js';
import TerritoryManager from './TerritoryManager.js';

let unsubs = [];

const LootEngine = {
  init() {
    unsubs.push(on(EVENTS.COMBAT_ENEMY_KILLED, (data) => {
      LootEngine._rollDrop(data);
      LootEngine._rollFragmentDrop();
    }));
  },

  destroy() {
    for (const unsub of unsubs) unsub();
    unsubs = [];
  },

  _rollDrop(data) {
    const { lootTable } = data;
    if (!lootTable || lootTable.length === 0) return;

    const state = Store.getState();
    const area = state.currentArea;
    const lootHoarderActive = state.activeCheats['loot_hoarder'] === true;

    // Base drop chance, boosted if Loot Hoarder active (keyed by area)
    let dropChance = INVENTORY.dropChanceByZone[area] ?? 0.20;
    if (lootHoarderActive) {
      dropChance = Math.min(dropChance * CHEATS.lootHoarder.dropChanceBoost, CHEATS.lootHoarder.dropChanceCap);
    }

    // Roll drop chance
    if (Math.random() > dropChance) return;

    // Weighted random pick from loot table
    const totalWeight = lootTable.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;
    let selectedItemId = lootTable[0].itemId;

    for (const entry of lootTable) {
      roll -= entry.weight;
      if (roll <= 0) {
        selectedItemId = entry.itemId;
        break;
      }
    }

    // Roll cosmetic rarity
    const rarity = LootEngine._rollRarity();

    // Drop count boosted when Loot Hoarder active
    const dropCount = lootHoarderActive ? CHEATS.lootHoarder.dropMultiplier : 1;

    // Try to add to inventory (rarity determines which stack it goes into)
    const added = InventorySystem.tryAddItem(selectedItemId, dropCount, rarity);

    if (added) {
      emit(EVENTS.LOOT_DROPPED, { itemId: selectedItemId, count: dropCount, rarity });
    }
  },

  _rollFragmentDrop() {
    const state = Store.getState();
    if (!state.flags.crackTriggered) return;
    const dropChance = ECONOMY.fragmentDropChance * TerritoryManager.getBuffMultiplier('fragmentDropRate');
    if (Math.random() < dropChance) {
      Store.addFragments(1);
    }
  },

  _rollRarity() {
    const weights = LOOT.rarityWeights;
    const entries = Object.entries(weights);
    const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * totalWeight;

    for (const [rarity, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return rarity;
    }
    return 'common';
  },
};

export default LootEngine;
