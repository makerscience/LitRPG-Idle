// Canonical event names — always import from here, never use ad-hoc strings.

export const EVENTS = {
  // State / Save
  STATE_CHANGED:        'state:changed',
  SAVE_REQUESTED:       'save:requested',
  SAVE_COMPLETED:       'save:completed',
  SAVE_LOADED:          'save:loaded',
  SAVE_CORRUPT:         'save:corrupt',

  // World / Navigation
  WORLD_ZONE_CHANGED:   'world:zoneChanged',
  WORLD_AREA_CHANGED:   'world:areaChanged',

  // Combat
  COMBAT_ENEMY_SPAWNED: 'combat:enemySpawned',
  COMBAT_ENEMY_DAMAGED: 'combat:enemyDamaged',
  COMBAT_ENEMY_KILLED:  'combat:enemyKilled',
  COMBAT_PLAYER_DAMAGED:'combat:playerDamaged',
  COMBAT_PLAYER_DIED:   'combat:playerDied',

  // Economy / Currencies
  ECON_GOLD_GAINED:     'econ:goldGained',
  ECON_FRAGMENTS_GAINED:'econ:fragmentsGained',
  ECON_MANA_CHANGED:    'econ:manaChanged',

  // Progression
  PROG_XP_GAINED:       'prog:xpGained',
  PROG_LEVEL_UP:        'prog:levelUp',

  // Loot / Inventory
  LOOT_DROPPED:         'loot:dropped',
  INV_ITEM_ADDED:       'inv:itemAdded',
  INV_ITEM_EQUIPPED:    'inv:itemEquipped',
  INV_ITEM_SOLD:        'inv:itemSold',
  INV_ITEM_MERGED:      'inv:itemMerged',
  INV_FULL:             'inv:full',

  // Upgrades / Cheats / Prestige
  UPG_PURCHASED:        'upg:purchased',
  CHEAT_UNLOCKED:       'cheat:unlocked',
  CHEAT_TOGGLED:        'cheat:toggled',
  PRESTIGE_AVAILABLE:   'prestige:available',
  PRESTIGE_PERFORMED:   'prestige:performed',

  // Boss
  BOSS_CHALLENGE_READY:       'boss:challengeReady',
  BOSS_SPAWNED:               'boss:spawned',
  BOSS_DEFEATED:              'boss:defeated',
  AREA_BOSS_DEFEATED:         'boss:areaDefeated',

  // Territory
  TERRITORY_CLAIMED:          'territory:claimed',
  TERRITORY_PROGRESS_UPDATED: 'territory:progressUpdated',

  // Dialogue / UI
  DIALOGUE_QUEUED:      'dialogue:queued',
  DIALOGUE_DISPLAYED:   'dialogue:displayed',
  UI_TOAST:             'ui:toast',
};

/**
 * Standalone EventBus — Map-based, not tied to Phaser.
 */
class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return () => this._listeners.get(event)?.delete(handler);
  }

  /**
   * Emit an event with an optional payload.
   */
  emit(event, payload) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(payload);
      }
    }
  }

  /**
   * Remove all listeners for a specific event, or all events if none specified.
   */
  removeAllListeners(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }
}

// Singleton instance
export const bus = new EventBus();

// Convenience helpers
export const emit = (event, payload) => bus.emit(event, payload);
export const on = (event, handler) => bus.on(event, handler);
