# Architecture

This document defines:
1. the canonical event names and their payload shapes
2. what each system is responsible for
3. key patterns used across the codebase

Last updated: 2026-02-11 (after completing codebase redesign phases 1–9).

---

## Event Conventions

- Events are namespaced: `domain:action` (example: `combat:enemyKilled`)
- No ad-hoc string events in code. Import `EVENTS` from `src/events.js`.
- Event payloads are small POJOs. Decimal values are live `Decimal` instances (not strings).
- Systems emit events but never directly call UI components.
- `createScope()` groups subscriptions for automatic cleanup on `scope.destroy()`.
- `emit()` validates payload shape in dev mode for events listed in `EVENT_CONTRACTS`.

## Canonical Events

### State / Save
- `state:changed` — `{ changedKeys: string[] }`
- `save:requested` — `{}`
- `save:completed` — `{}`
- `save:loaded` — `{}`
- `save:corrupt` — `{ source: string, recoveredFrom?: string }`

### World / Navigation
- `world:zoneChanged` — `{ zone: number, area: number }`
- `world:areaChanged` — `{ area: number, prevArea: number }`

### Combat
- `combat:enemySpawned` — `{ enemyId: string, name: string, maxHp: Decimal }`
- `combat:enemyDamaged` — `{ enemyId: string, amount: Decimal, isCrit: boolean }`
- `combat:enemyKilled` — `{ enemyId: string, name: string, lootTable: array, isBoss: boolean }`
- `combat:playerDamaged` — `{ amount: Decimal, remainingHp: Decimal, maxHp: Decimal }`
- `combat:playerDied` — `{}`

### Economy / Currencies
- `econ:goldGained` — `{ amount: Decimal }`
- `econ:fragmentsGained` — `{ amount: Decimal }`
- `econ:manaChanged` — `{ mana: Decimal }`

### Progression
- `prog:xpGained` — `{ amount: Decimal }`
- `prog:levelUp` — `{ level: number, stats: object }`

### Loot / Inventory
- `loot:dropped` — `{ itemId: string, count: number, rarity: string }`
- `inv:itemAdded` — `{ itemId: string, count: number, totalCount: number }`
- `inv:itemEquipped` — `{ slot: string, itemId: string }`
- `inv:itemSold` — `{ itemId: string, count: number, goldGained: number }`
- `inv:itemMerged` — `{ itemId: string, targetItemId: string, merges: number }`
- `inv:full` — `{ itemId: string }`

### Upgrades / Cheats / Prestige
- `upg:purchased` — `{ upgradeId: string, name: string, level: number, category: string }`
- `cheat:unlocked` — `{ cheatId: string }`
- `cheat:toggled` — `{ cheatId: string, active: boolean }`
- `prestige:available` — `{}`
- `prestige:performed` — `{ count: number }`

### Boss
- `boss:challengeReady` — `{ area: number, zone: number, kills: number, threshold: number }`
- `boss:spawned` — `{ area: number, zone: number, bossType: object }`
- `boss:defeated` — `{ area: number, zone: number, bossType: object, name: string }`
- `boss:areaDefeated` — `{ area: number, name: string }`

### Territory
- `territory:claimed` — `{ territoryId: string, name: string, buff: object }`

### Dialogue / UI
- `dialogue:queued` — `{ text: string, emotion: string, context?: string }`

### Unused (defined but not currently emitted)
- `dialogue:displayed`
- `territory:progressUpdated`
- `ui:toast`

---

## Event Contracts (Dev-Mode Validation)

Four high-traffic events have required-field contracts validated at emit time in dev builds:

| Event | Required Fields |
|-------|----------------|
| `combat:enemyKilled` | `enemyId`, `name`, `isBoss` |
| `state:changed` | *(none — changedKeys is always present)* |
| `prestige:performed` | `count` |
| `territory:claimed` | `territoryId`, `name`, `buff` |

Missing fields produce `console.warn` in dev mode; no-op in production.

---

## System Responsibilities

### Store (`src/systems/Store.js`)
- Single source of truth for all game state
- Pure state container — no business logic
- All writes go through **explicit named mutation methods** (e.g., `addGold()`, `addRawXp()`, `equipItem()`)
- Each mutation emits `state:changed` with relevant `changedKeys`
- State holds live `Decimal` instances; strings only exist in localStorage
- Exposes `init()`, `loadState()`, `resetState()`, `getState()`, `destroy()`

### EventBus (`src/events.js`)
- Defines all canonical event strings in the `EVENTS` object
- Map-based standalone bus (not tied to Phaser)
- Provides `emit()`, `on()`, and `createScope()` helpers
- `createScope()` returns `{ on(), destroy() }` for grouped subscription management
- Event contract registry validates payloads in dev builds

### Progression (`src/systems/Progression.js`)
- Owns the XP/level-up loop via `grantXp()` — the only entry point for XP gains
- Orchestrates all kill rewards via `grantKillRewards(enemy)`: kill counters (total, per-enemy, zone-clear), gold, XP
- Called by CombatEngine on enemy death — single source of truth for kill tracking

### ComputedStats (`src/systems/ComputedStats.js`)
- Pure functions that compute derived stats from Store + system queries
- No state, no events — just math
- Eliminates formula duplication: `getEffectiveDamage()`, `getEffectiveMaxHp()`, `getCritChance()`, `getCritMultiplier()`, `getAutoAttackInterval()`, `getGoldMultiplier()`, `getXpMultiplier()`, `getHpRegen()`, `getAllStats()`
- Used by CombatEngine, Store (HP methods), StatsPanel, OfflineProgress

### CombatEngine (`src/systems/CombatEngine.js`)
- Enemy lifecycle: spawn, death, respawn timer
- Attack resolution: player damage via ComputedStats, crit rolls, enemy attacks
- Player HP regen ticking
- Auto-attack scheduling via TimeEngine
- Calls `Progression.grantKillRewards()` on kill — does not compute rewards itself
- Emits combat events; does not render UI

### BossManager (`src/systems/BossManager.js`)
- Boss template generation from zone's strongest enemy + boss type multipliers
- Boss fight lifecycle: threshold check → challenge ready → spawn → defeat → zone advance
- Zone progression advancement on boss defeat (unlocks next zone/area)
- Listens to kill events for threshold tracking

### LootEngine (`src/systems/LootEngine.js`)
- Rolls loot tables on enemy kill (weighted random)
- Rarity rolling (weighted: common 70%, uncommon 20%, rare 8%, epic 2%)
- Fragment drops (chance-based, gated by `crackTriggered` flag)
- Integrates Loot Hoarder cheat (3x drop count, 1.5x drop chance)
- Emits `loot:dropped`

### InventorySystem (`src/systems/InventorySystem.js`)
- Stack-based inventory keyed by composite `itemId::rarity` keys
- Equip/unequip with slot management (head, body, weapon, legs)
- Sell with rarity-scaled gold value
- Auto-merge: 10 same-tier items → 1 next-tier item (recursive, depth-limited)
- Exports `makeStackKey()`, `parseStackKey()` utilities

### UpgradeManager (`src/systems/UpgradeManager.js`)
- Purchase validation, cost scaling (`base * 1.15^level`), currency spending
- Exposes multiplier aggregation: `getMultiplier(target)`, `getFlatBonus(target)`
- Auto-attack interval calculation with territory buff integration

### PrestigeManager (`src/systems/PrestigeManager.js`)
- Prestige availability check (area 4+)
- Prestige reset orchestration: retains gold fraction, resets stats/upgrades/zones/kills
- Preserves: cheats, territories, killsPerEnemy, inventory, fragments, furthestArea
- Multiplier formula: `1 + count * 0.25`
- Emits `prestige:available` (once) and `prestige:performed`

### TerritoryManager (`src/systems/TerritoryManager.js`)
- Territory conquest gating (kill threshold + gold cost)
- Buff aggregation: `getBuffValue(key)` sums matching conquered territory buffs
- `getBuffMultiplier(key)` returns `1 + sum` for multiplicative buffs
- No state — reads Store on demand

### DialogueManager (`src/systems/DialogueManager.js`)
- Data-driven SYSTEM dialogue from `src/data/dialogue.js` (80+ lines)
- Event → trigger mapping with cooldowns and one-shot flag gating
- Covers: first kill, level-up, equip, sell, fragment, area entrance, kill milestones, combat commentary, boss encounters, prestige, territory claims, big damage, ambient snark, offline return
- Emits `dialogue:queued` with `{ text, emotion, context }`

### FirstCrackDirector (`src/systems/FirstCrackDirector.js`)
- Scripted event at kill #20: multi-step timed dialogue + forced crit + `crackTriggered` flag
- One-shot (checks `crackTriggered` flag)
- Unlocks glitch fragment drops globally

### CheatManager (`src/systems/CheatManager.js`)
- Monitors fragment count for unlock thresholds
- Unlock + activate cheats via Store mutations
- Currently one cheat: Loot Hoarder (auto-merge, boosted drops)

### OfflineProgress (`src/systems/OfflineProgress.js`)
- Rate-based offline reward calculation on game load
- Computes player DPS × zone enemy pool × clamped offline duration (60s min, 12h max)
- Applies gold, XP (with level-ups via Progression), and fragments (if crack triggered)
- Stores result for deferred UI consumption (avoids Phaser scene timing issues)
- `apply()` called during boot, `getLastResult()` / `clearResult()` consumed by SystemLog and DialogueManager

### SaveManager (`src/systems/SaveManager.js`)
- Serializes/deserializes state (BigNum ↔ string conversion)
- Schema migrations (currently version 8) applied on load
- Dual-slot save rotation (primary + backup) with corruption recovery
- Auto-saves every 30s + on `window.beforeunload` + on `save:requested`
- Receives Store via `init(Store)` parameter to avoid circular imports

### TimeEngine (`src/systems/TimeEngine.js`)
- Dependency-free tick scheduler
- `register(id, callback, interval, enabled)` for recurring ticks
- `scheduleOnce(id, callback, delay)` for one-shot timers
- `update(dt)` called from GameScene's Phaser update loop
- No events — pure tick dispatch

### BigNum (`src/systems/BigNum.js`)
- Thin wrapper around break_infinity.js `Decimal`
- `D(value)` — shorthand constructor
- `format(decimal, places)` — human-readable display (K/M/B/T/scientific)
- `fromJSON(str)` — deserialization alias

---

## Boot Sequence

```
Store.init()              — create default state
SaveManager.init(Store)   — hydrate from localStorage, run migrations
TimeEngine.init()         — initialize tick scheduler
LootEngine.init()         — subscribe to kill events
TerritoryManager.init()   — (empty — reads Store on demand)
OfflineProgress.apply()   — compute + apply offline rewards, store result

Phaser.Game created       — scenes begin loading
  BootScene               — preload assets, transition to GameScene
  GameScene.create()      — parallax, sprites, CombatEngine.init(), BossManager wiring
  UIScene.create()        — HUD, panels, logs, DialogueManager/CheatManager/PrestigeManager init
```

Store mutation events from OfflineProgress fire during boot but no UI listeners exist yet — harmless. UI scenes read current (already-updated) state when they create.

---

## Key Patterns

### EventScope
```js
const scope = createScope();
scope.on(EVENTS.COMBAT_ENEMY_KILLED, handleKill);
scope.on(EVENTS.PROG_LEVEL_UP, handleLevelUp);
// Later:
scope.destroy(); // unsubscribes all at once
```
Used by all 7 system singletons. UI components use `this._unsubs` arrays via base classes (ModalPanel, ScrollableLog).

### Stored Result Pattern (OfflineProgress)
Producer runs during boot before Phaser scenes exist. Stores result in module variable. UI reads `getLastResult()` when scenes create, then calls `clearResult()`. No new events needed, no race conditions.

### Composite Stack Keys (Inventory)
`itemId::rarity` (e.g., `iron_dagger::rare`). Allows same base item with different rarities in separate inventory slots. `makeStackKey()` / `parseStackKey()` helpers in InventorySystem.

### Data-Driven Triggers (Dialogue)
All dialogue content in `src/data/dialogue.js`. DialogueManager maps events → arrays of lines, with cooldowns, one-shot flags, and random selection. Adding new quips requires zero system changes.

---

## Damage Formula Reference

Damage tiers are defined in `config.js`. ComputedStats resolves the final effective damage.

```js
DAMAGE_FORMULAS: {
  mortal:   (str, wpn) => str * 1.2 + wpn,
  awakened: (str, wpn, skill) => str ** 2 + skill * wpn ** 2,
  godhood:  (str, wpn, skill) => wpn * Math.exp(skill / 10)
}
```

MVP uses `mortal` only. Effective damage = `mortal(effectiveStr, weaponDmg) * clickDmgMult * prestigeMult * territoryDmgMult`.

Crit factor: `critChance` (base 0.05 + upgrades + territory) with `critMultiplier` (2x base, 10x after First Crack).

---

## File Organization

```
src/
├── main.js                  Boot sequence + Phaser config
├── config.js                Game balance constants (re-exports layout + theme)
├── config/
│   ├── layout.js            UI positioning (LAYOUT, TERRITORY)
│   └── theme.js             Visual theming (COLORS, ZONE_THEMES, PARALLAX, etc.)
├── events.js                Canonical events + EventBus + EventScope + contracts
├── data/
│   ├── areas.js             5 areas × 34 zones, zone scaling, boss types
│   ├── enemies.js           13 enemy types with sprites + loot tables
│   ├── items.js             12 items with rarity scaling + merge chains
│   ├── upgrades.js          6 upgrades (3 legit, 3 exploit)
│   ├── territories.js       13 territories with buff definitions
│   ├── cheats.js            Cheat definitions + dialogue hooks
│   └── dialogue.js          80+ SYSTEM dialogue lines by trigger category
├── systems/
│   ├── Store.js             Centralized state + named mutations
│   ├── BigNum.js            Decimal wrapper (D, format, fromJSON)
│   ├── ComputedStats.js     Pure derived stat functions
│   ├── Progression.js       XP/level-up + kill reward orchestration
│   ├── CombatEngine.js      Enemy lifecycle + attack resolution
│   ├── BossManager.js       Boss fights + zone progression gates
│   ├── LootEngine.js        Drop rolling + rarity selection
│   ├── InventorySystem.js   Stack management + equip/sell/merge
│   ├── UpgradeManager.js    Purchase rules + multiplier aggregation
│   ├── PrestigeManager.js   Prestige reset orchestration
│   ├── TerritoryManager.js  Territory unlock + buff queries
│   ├── DialogueManager.js   Event → dialogue triggers
│   ├── FirstCrackDirector.js  Scripted "First Crack" event
│   ├── CheatManager.js      Cheat unlock/toggle
│   ├── OfflineProgress.js   Rate-based offline catch-up rewards
│   ├── TimeEngine.js        Tick scheduler
│   └── SaveManager.js       Serialization + migrations + corruption recovery
├── scenes/
│   ├── BootScene.js         Asset preload
│   ├── GameScene.js         Parallax + combat rendering + damage visuals
│   ├── UIScene.js           HUD orchestration + modal registry
│   └── OverworldScene.js    Territory map overlay
└── ui/
    ├── ModalPanel.js        Base class for modal panels
    ├── ScrollableLog.js     Base class for scrollable text logs
    ├── ui-utils.js          makeButton() + TEXT_STYLES helpers
    ├── TopBar.js            Gold/mana/fragments + XP bar
    ├── ZoneNav.js           Area/zone navigation
    ├── SystemLog.js         Green monospace combat log
    ├── SystemDialogue.js    SYSTEM dialogue display with emotions
    ├── BossChallenge.js     Boss fight initiation UI
    ├── CheatDeck.js         Cheat toggle cards
    ├── InventoryPanel.js    5×4 grid inventory
    ├── UpgradePanel.js      Upgrade purchase UI
    ├── PrestigePanel.js     Prestige confirmation + preview
    ├── SettingsPanel.js     Settings + save wipe
    └── StatsPanel.js        Full computed stat sheet
```
