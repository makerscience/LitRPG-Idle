# Architecture (MVP)

This document defines:
1) the canonical event names used by EventBus
2) what each system is responsible for

## Event Conventions

- Events are namespaced: `domain:action` (example: `combat:enemyKilled`)
- No ad-hoc string events in code. Import from `src/events.js`.
- Event payloads should be small, serializable POJOs (plain objects).
- Systems may emit events, but should not directly call UI components.

## Canonical Events

### State / Save
- `state:changed` — { changedKeys: string[] }
- `save:requested` — {}
- `save:completed` — { sizeBytes: number }
- `save:loaded` — { schemaVersion: number }
- `save:corrupt` — { reason: string }

### World / Navigation
- `world:zoneChanged` — { world: number, zone: number }

### Combat
- `combat:enemySpawned` — { enemyId: string, hp: string }
- `combat:enemyDamaged` — { enemyId: string, amount: string, isCrit: boolean }
- `combat:enemyKilled` — { enemyId: string }
- `combat:playerDamaged` — { amount: string }
- `combat:playerDied` — {}

### Economy / Currencies
- `econ:goldGained` — { amount: string, source: string }
- `econ:fragmentsGained` — { amount: string, source: string }
- `econ:manaChanged` — { current: string, max: string }

### Progression
- `prog:xpGained` — { amount: string }
- `prog:levelUp` — { newLevel: number }

### Loot / Inventory
- `loot:dropped` — { itemId: string, count: number, rarity: string }
- `inv:itemAdded` — { itemId: string, count: number }
- `inv:itemEquipped` — { slot: string, itemId: string, tier: number }
- `inv:itemSold` — { itemId: string, count: number, goldGained: string }
- `inv:itemMerged` — { itemId: string, merges: number, newTier: number }
- `inv:full` — {}

### Upgrades / Cheats / Prestige
- `upg:purchased` — { upgradeId: string, level: number }
- `cheat:unlocked` — { cheatId: string }
- `cheat:toggled` — { cheatId: string, enabled: boolean }
- `prestige:available` — { reason: string }
- `prestige:performed` — { newCount: number, multiplier: string }

### Dialogue / UI
- `dialogue:queued` — { key: string }
- `dialogue:displayed` — { key: string }
- `ui:toast` — { text: string }

## System Responsibilities

### Store (src/systems/Store.js)
- Owns the single source of truth state
- Only place that mutates state, via **explicit named methods** (e.g. `addGold(amount)`, `equipItem(slot, item)`)
- Each method modifies state then emits `state:changed` with relevant keys
- This keeps mutation centralized without the overhead of a full reducer/dispatch pattern
- If the method count grows unwieldy post-MVP, refactor to a `mutate(type, payload)` reducer

Example:
```js
class Store {
  addGold(amount) {
    this.state.gold = this.state.gold.add(amount);
    this._emit(['gold']);
  }
  equipItem(slot, item) {
    this.state.equipped[slot] = item;
    this._emit(['equipped']);
  }
  _emit(changedKeys) {
    EventBus.emit('state:changed', { changedKeys });
  }
}
```

### EventBus (src/events.js)
- Defines canonical event strings
- Provides `emit(event, payload)` and `on(event, handler)` helpers

### TimeEngine (src/systems/TimeEngine.js)
- **Stubbed in Phase 1, built in Phase 2**
- Centralizes tick timers (auto-attack, autosave cadence hooks)
- Computes offline delta on load (Phase 8)

### CombatEngine (src/systems/CombatEngine.js)
- Enemy spawning, enemy HP, click/auto damage application
- Uses a single `getPlayerDamage(state)` function for all damage calculation
- Emits combat events; does not render UI

### Progression (src/systems/Progression.js)
- XP gains, level-up logic, stat growth
- Emits progression events

### LootEngine (src/systems/LootEngine.js)
- Rolls loot tables on enemy kill
- Emits `loot:dropped`

### InventorySystem (src/systems/InventorySystem.js)
- Maintains inventory as **stacks** (keyed by itemId, not individual objects)
- Equip/sell/merge logic
- Auto-merge math: `while (count >= 100) { count -= 100; nextTier += 1 }` — no animation loops
- Emits inventory events

### UpgradeManager (src/systems/UpgradeManager.js)
- Upgrade purchase rules + scaling costs
- Upgrades modify multipliers, not rewrite formulas
- Exposes multipliers used by combat/loot formulas

### CheatManager (src/systems/CheatManager.js)
- Unlock/toggle cheats
- Provides flags used by other systems (e.g. auto-merge enabled)

### PrestigeManager (src/systems/PrestigeManager.js)
- Applies prestige reset rules + multiplier
- Emits prestige events

### DialogueDirector (src/systems/DialogueDirector.js)
- Maps events → dialogue triggers (with cooldowns so lines don't spam)
- Emits dialogue events; SystemLog/UIScene renders them

### SaveManager (src/systems/SaveManager.js)
- Serializes/deserializes state (BigNum-safe)
- Handles schema migrations and corruption fallback
- Auto-saves every 30 seconds + on `window.beforeunload`

## Damage Formula Reference

Damage tiers are defined in `config.js` and selected based on player progression. The `getPlayerDamage(state)` function in CombatEngine reads from config — combat code never contains formula math directly.

```js
// config.js
DAMAGE_FORMULAS: {
  mortal:   (str, wpn) => str * 1.2 + wpn,
  awakened: (str, wpn, skill) => str ** 2 + skill * wpn ** 2,
  godhood:  (str, wpn, skill) => wpn * Math.exp(skill / 10)
}
```

MVP uses `mortal` only. `awakened` and `godhood` are defined in config so the transition is a data change, not a code change.
