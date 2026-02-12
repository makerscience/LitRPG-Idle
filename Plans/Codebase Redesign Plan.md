# Codebase Redesign: The Elegant Architecture

## Context

The game has grown organically through 8 build phases - each adding features onto the previous structure. The result is a **working, well-disciplined codebase** (~4500 LOC, 41 files) with strong fundamentals (event-driven, centralized state, no circular deps) but accumulated structural debt: god objects, duplicated boilerplate, scattered concerns, and inconsistent patterns.

This plan redesigns the architecture as if every current feature were a known requirement from day one. The goal is **the simplest thing that works perfectly** - not enterprise architecture, but the elegant solution a thoughtful developer would build knowing the full scope.

**Guiding principles:**
- Every phase leaves the game fully playable and testable
- High-impact, low-risk changes first
- No new libraries, no TypeScript - just better-organized JavaScript
- Measure success by: lines removed > lines added
- Every cross-system formula and event payload has one canonical owner
- Idle-loop guarantees (online + offline) are first-class, not post-MVP add-ons

---

## Implementation Status (2026-02-11)

| Phase | Status | Notes |
|-------|--------|-------|
| 1 | DONE | ModalPanel, ScrollableLog, ui-utils all created. All 5 panels + SystemLog + SystemDialogue refactored. UIScene has closeAllModals(). Build passes. 1E (rarity hex consolidation) deferred — cosmetic. |
| 2 | DONE | ComputedStats.js created with all pure functions. CombatEngine, Store HP methods (damage/heal/max/reset/prestige), and StatsPanel all delegate to it. EffectChannels.js dropped (unnecessary). Territory maxHP buff now works. |
| 3 | DONE | config.js split into config/layout.js (LAYOUT, TERRITORY) + config/theme.js (COLORS, ZONE_THEMES, PARALLAX, TREE_ROWS, FERN_ROWS, UI). config.js re-exports for backward compat. |
| 4 | SKIPPED | Deferred per plan — boot sequence is simple enough. |
| 5 | DONE | Progression.js, granular Store mutations, PrestigeManager owns prestige, UpgradeManager uses addFlatStat(), legacy fields/methods removed. |
| 6 | DONE | Kill reward orchestration (gold, XP, kill counter) moved from CombatEngine._onEnemyDeath() into Progression.grantKillRewards(). CombatEngine drops ComputedStats gold/xp multiplier imports. |
| 7 | DONE | Kill counting centralized in Progression.grantKillRewards() (total, per-enemy, zone-clear). BossManager listener simplified to threshold check only. TerritoryManager listener removed — reads Store on demand. |
| 8 | DONE | createScope() helper in events.js. All 7 system singletons converted from manual unsubs to scoped subscriptions. Event contract registry with dev-mode payload validation for 4 high-traffic events. |
| 9 | DONE | OfflineProgress.js: rate-based catch-up rewards (gold/XP/fragments) from player DPS × zone enemy pool × clamped offline duration. SystemLog summary + DialogueManager welcome-back quip. SAVE.minOfflineTime added. |

---

## Phase 1: UI Foundation Layer (~500 lines removed) — DONE

**Why first:** Highest boilerplate ratio in the codebase. Zero risk to game logic. Immediate visual payoff - every future UI change benefits.

### 1A. ModalPanel Base Class

**New file:** `src/ui/ModalPanel.js`

Extract the shared lifecycle that all 5 modal panels (Inventory, Upgrade, Prestige, Settings, Stats) repeat identically:

```js
class ModalPanel {
  constructor(scene, { key, width, height, hotkey, buttonLabel, buttonX })

  // Lifecycle (shared)
  _createToggleButton()     // Bottom bar button
  _createModal()            // Background, border, title, close button, backdrop
  _toggle()                 // Open/close with mutual exclusion
  _open()                   // scene.closeAllModals() -> show -> refresh
  _close()                  // Hide -> clear dynamic
  _showModal() / _hideModal()
  _clearDynamic()           // Destroy _dynamicObjects[]
  _attachBackdropDismiss()  // Click-outside-to-close
  destroy()                 // Unsubscribe + cleanup

  // Subclass hooks
  _buildContent()           // Override: create dynamic content
  _getTitle()               // Override: return panel title string
  _getEvents()              // Override: return events that trigger refresh
}
```

**Eliminates:**
- Mutual exclusion copy-paste (125 lines across 5 panels)
- Modal lifecycle boilerplate (300 lines across 5 panels)
- Backdrop dismiss duplication (75 lines across 5 panels)

**Panels become ~40-60% shorter**, focused purely on their unique content.

### 1B. Centralize Modal Registry in UIScene

**Modified file:** `src/scenes/UIScene.js`

```js
// UIScene owns the modal registry
this._modals = [inventoryPanel, upgradePanel, prestigePanel, settingsPanel, statsPanel];

closeAllModals() {
  this._modals.forEach(m => m._isOpen && m._close());
}
```

`_toggleMap()` calls `this.closeAllModals()` instead of 5 hardcoded if-checks.

### 1C. UI Utilities

**New file:** `src/ui/ui-utils.js`

Small helpers that eliminate scattered boilerplate:

```js
// Button with hover states (replaces 20+ inline pointer handlers)
export function makeButton(scene, x, y, text, { bg, color, onDown })

// Text with preset styles (replaces inline fontFamily/fontSize/color everywhere)
export const TEXT_STYLES = {
  panelTitle: { fontFamily: 'monospace', fontSize: '16px', ... },
  label:      { fontFamily: 'monospace', fontSize: '11px', ... },
  value:      { fontFamily: 'monospace', fontSize: '11px', ... },
  small:      { fontFamily: 'monospace', fontSize: '9px', ... },
};
export function addText(scene, x, y, text, style, overrides = {})
```

### 1D. ScrollableLog Base Class

**New file:** `src/ui/ScrollableLog.js`

Extract shared scroll logic from SystemLog and SystemDialogue:

```js
class ScrollableLog {
  constructor(scene, { x, y, width, height, maxLines, lineHeight })
  addLine(text, style)
  _render()
  _scroll(dy)
  _scrollToBottom()
  _createMask()
  destroy()
}
```

SystemLog and SystemDialogue become thin subclasses that only define their event handlers and line formatting.

### 1E. Move Rarity Colors to Single Source

**Modified file:** `src/config.js` - ensure `COLORS.rarity` is the canonical source.
**Modified file:** `src/ui/InventoryPanel.js` - delete local `RARITY_HEX` dict, import from config.

### Files modified/created:
- **New:** `src/ui/ModalPanel.js`, `src/ui/ui-utils.js`, `src/ui/ScrollableLog.js`
- **Modified:** `InventoryPanel.js`, `UpgradePanel.js`, `PrestigePanel.js`, `SettingsPanel.js`, `StatsPanel.js`, `UIScene.js`, `SystemLog.js`, `SystemDialogue.js`

### Verification:
- Open each panel (I, U, P, ESC, C) - verify content renders identically
- Open one panel, open another - verify first closes (mutual exclusion)
- Click backdrop outside panel - verify it closes
- Press M for map - verify all panels close first
- Scroll system log and dialogue - verify scrolling works
- Resize check: verify no layout shifts

---

## Phase 2: Computed Stats Layer (~180 lines centralized, coupling reduced) — DONE

> **Status:** ComputedStats.js created with all pure functions. CombatEngine delegates to it. Store HP methods (damagePlayer, healPlayer, getPlayerMaxHp, resetPlayerHp, performPrestige) all use `getEffectiveMaxHp()`. StatsPanel uses `ComputedStats.getAllStats()`. EffectChannels.js dropped — existing buff key strings work fine without a formal registry. Territory maxHP buff (territories 2, 11) now actually works.

**Why second:** StatsPanel, CombatEngine, and UI code all independently compute the same derived values (effective damage, max HP, crit chance, multipliers). This duplication means formula changes must be made in 3+ places. A single ComputedStats module fixes this and decouples UI from game systems.

### 2A. ComputedStats Module

**New file:** `src/systems/ComputedStats.js`

Pure functions that compute derived stats from state + system queries. **No state mutation, no events - just math.**

```js
export function getEffectiveDamage(state)      // base damage x all multipliers
export function getEffectiveMaxHp(state)       // vit x hpPerVit + territory buffs
export function getCritChance(state)           // base + upgrade + territory
export function getCritMultiplier(state)       // base or forced
export function getAutoAttackInterval(state)   // base - upgrade - territory
export function getGoldMultiplier(state)       // prestige x upgrade x territory
export function getXpMultiplier(state)         // prestige x upgrade x territory
export function getFragmentDropMultiplier(state)
export function getPrestigeMultiplier(state)
export function getIncomeMultipliers(state)    // { gold, xp, fragments }
export function getAllStats(state)             // full computed stat object
```

Each function reads from Store state and domain systems, but callers only depend on ComputedStats.

### 2B. Consumers Switch to ComputedStats

- **CombatEngine:** `getPlayerDamage()` delegates to `ComputedStats.getEffectiveDamage()`
- **CombatEngine:** `getEffectiveMaxHp()` delegates to `ComputedStats.getEffectiveMaxHp()`
- **StatsPanel:** Rows call `ComputedStats.getAllStats()` instead of querying managers directly
- **LootEngine:** Gold and fragment multipliers come from ComputedStats
- **Prestige/Stats UI:** Uses `getPrestigeMultiplier()` / `getIncomeMultipliers()`

### 2C. Effect Channels Contract

**New file:** `src/systems/EffectChannels.js`

Define one canonical list of effect keys and composition rules used by TerritoryManager, UpgradeManager, and ComputedStats:
- `flatStr`, `flatVit`, `critChance`
- `baseDamage`, `goldGain`, `xpGain`, `fragmentDropRate`
- `autoAttackSpeed`, `hpRegen`, `maxHp`
- `prestigeMultiplier`, `allIncome`

Unknown effect keys are ignored safely and warn in dev mode.

### Files modified/created:
- **New:** `src/systems/ComputedStats.js`, `src/systems/EffectChannels.js`
- **Modified:** `CombatEngine.js`, `StatsPanel.js`, `LootEngine.js`, relevant UI panels

### Verification:
- Kill an enemy - verify damage numbers match pre-refactor
- Open Stats panel - verify displayed values match formulas
- Equip/unequip weapon - verify damage changes correctly
- Buy upgrade - verify stat recalculation
- Claim territory - verify buffs apply (including `prestigeMultiplier`, `allIncome`)
- Unknown buff keys do not silently fail

---

## Phase 3: Config Decomposition (~0 lines changed, better organization)

**Why third:** `config.js` mixes game balance, UI layout, visual theming, and parallax physics. Splitting by concern makes each file smaller and more focused.

### Split config.js into:

```text
src/config.js              -> Game balance only (DAMAGE_FORMULAS, COMBAT, PROGRESSION,
                              ECONOMY, LOOT, INVENTORY, PRESTIGE, WORLD, CHEATS, SAVE)
src/config/layout.js       -> LAYOUT, TERRITORY visual layout, UI positioning
src/config/theme.js        -> COLORS, ZONE_THEMES, PARALLAX, TREE_ROWS, FERN_ROWS,
                              UI.damageNumberTiers
```

`config.js` re-exports everything for backward compatibility.

### Files modified/created:
- **New:** `src/config/layout.js`, `src/config/theme.js`
- **Modified:** `src/config.js` (extracted, re-exports)

### Verification:
- `npm run build` succeeds
- Game loads and plays identically

---

## Phase 4: System Kernel & Lifecycle (~70 lines added, boot order explicit)

**Why fourth:** Initialization order is currently implicit (main.js ordering + CombatEngine.init() calling BossManager.init() internally). A lightweight kernel makes dependencies explicit and ensures proper cleanup.

### 4A. System Kernel

**New file:** `src/systems/Kernel.js`

```js
const coreSystems = [];
const uiSystems = [];

export function registerCore(system) { coreSystems.push(system); }
export function registerUi(system) { uiSystems.push(system); }

export function bootCore() { for (const s of coreSystems) s.init(); }
export function shutdownCore() { for (const s of [...coreSystems].reverse()) s.destroy?.(); }

export function bootUi() { for (const s of uiSystems) s.init(); }
export function shutdownUi() { for (const s of [...uiSystems].reverse()) s.destroy?.(); }
```

### 4B. main.js Becomes Declarative

```js
registerCore(Store);
registerCore(SaveManager);
registerCore(TimeEngine);
registerCore(LootEngine);
registerCore(TerritoryManager);
bootCore();
```

UIScene boots/shuts down UI-lifetime systems via `bootUi()` / `shutdownUi()`.

### 4C. CombatEngine Stops Calling BossManager.init()

BossManager gets explicit lifecycle ownership. CombatEngine.init() only sets up its own listeners and tickers.

### 4D. Lifecycle Ownership Matrix

Document this in the plan and kernel docs:
- **Core lifetime:** Store, SaveManager, TimeEngine, LootEngine, TerritoryManager
- **Combat-scene lifetime:** CombatEngine, BossManager
- **UI-scene lifetime:** DialogueManager, FirstCrackDirector, CheatManager, PrestigeManager

### Files modified/created:
- **New:** `src/systems/Kernel.js`
- **Modified:** `src/main.js`, `src/scenes/UIScene.js`, `src/systems/CombatEngine.js`, system init sites

### Verification:
- Game boots normally
- Boss challenges still work
- Save/load still works
- Re-enter scenes and map sleep/wake cycles without duplicate handlers

---

## Phase 5: Store Slimming (~100 lines moved, responsibilities clarified)

**Why fifth:** Store.js is a god object. Rather than splitting into multiple stores (which would complicate saves), extract business logic back into domain systems.

### Strategy: Store Stays as State Container, Systems Own Logic

Store keeps: simple state reads/writes + event emission. Systems own: validation, computation, multi-step logic.

**Boundary rule:** no direct mutation of `Store.getState()` outside `Store.js`; managers call explicit Store mutation methods.

### 5A. Extract Level-Up Logic from Store.addXp()

**New file:** `src/systems/Progression.js`

```js
export function grantXp(amount) {
  Store.addRawXp(amount);
  while (canLevelUp()) performLevelUp();
}
```

### 5B. Extract Prestige Reset Logic from Store.performPrestige()

PrestigeManager orchestrates reset via Store domain methods.

### 5C. Remove Legacy Compatibility Methods

Remove `Store.setZone()`, `Store.setFurthestZone()`, and legacy fields (`furthestZone`, `currentWorld`) with save migration.

### 5D. Clean Up Silent Mutations

Keep high-frequency counters event-free, but document the pattern explicitly.

### 5E. Mutation Boundary Enforcement

- Add missing Store mutation methods for manager use (e.g., flat stat gains)
- Remove direct writes in managers
- Add dev-only `getStateReadOnly()` snapshot for accidental-write detection

### Files modified/created:
- **New:** `src/systems/Progression.js`
- **Modified:** `Store.js`, `PrestigeManager.js`, `UpgradeManager.js`, `SaveManager.js` (migration)
- **Removed:** legacy methods and fields

### Verification:
- Gain XP, level up - verify stats grow correctly
- Perform prestige - verify reset/keep behavior
- Load old save - verify migration works
- Save, reload - verify no data loss
- Upgrade purchases and prestige still behave correctly with no out-of-Store writes

---

## Phase 6: CombatEngine Decomposition (~315 lines -> ~200 + ~80 + ~50)

**Why sixth:** CombatEngine has the highest dependency count and mixes damage calculation, enemy lifecycle, buff aggregation, and event orchestration.

### Split into:

**`src/systems/CombatEngine.js` (slimmed, ~200 lines)**
- Enemy lifecycle (spawn, death, respawn)
- Attack resolution
- Event wiring
- Uses ComputedStats instead of importing multiple managers

**`src/systems/Progression.js` (expanded, ~80 lines)**
- XP/level loop
- Kill reward orchestration (gold, XP, fragments)

CombatEngine calls `Progression.grantKillRewards(enemy)` on kill.

### Files modified:
- `CombatEngine.js`
- `Progression.js`

### Verification:
- Kill enemies - rewards are correct
- Auto-attack timing unchanged
- Boss flow intact
- Player death/respawn works

---

## Phase 7: Unified Kill Tracking (~30 lines removed)

**Why seventh:** BossManager and TerritoryManager independently count kills from the same event, creating consistency risk.

### Solution: Single Kill Tracker

CombatEngine/Progression emits `COMBAT_ENEMY_KILLED` with full context:

```js
{ enemyId, area, zone, totalKills, enemyKills }
```

BossManager and TerritoryManager read Store state after central counting, rather than counting independently.

### Files modified:
- `CombatEngine.js` or `Progression.js`
- `BossManager.js`
- `TerritoryManager.js`

### Verification:
- Boss progress advances correctly
- Territory progress advances correctly
- Boss kills unlock expected progression

---

## Phase 8: Event Cleanup Helpers (~35 lines added, leak risk eliminated)

**Why last in core refactor:** Low urgency but prevents subtle bugs. Systems currently manage `_unsubs` manually.

### 8A. EventScope Helper

**Modified file:** `src/events.js`

```js
export function createScope() {
  const unsubs = [];
  return {
    on(event, handler) { unsubs.push(on(event, handler)); },
    destroy() { unsubs.forEach(fn => fn()); unsubs.length = 0; },
  };
}
```

### 8B. Systems Adopt EventScope

Before:

```js
const unsubs = [];
unsubs.push(on(EVENTS.COMBAT_ENEMY_KILLED, handleKill));
unsubs.forEach(fn => fn());
```

After:

```js
const scope = createScope();
scope.on(EVENTS.COMBAT_ENEMY_KILLED, handleKill);
scope.destroy();
```

### 8C. Event Contract Registry

Define required payload fields for high-traffic events next to `EVENTS`:
- `combat:enemyKilled`
- `state:changed`
- `prestige:performed`
- `territory:claimed`

Dev-mode warnings for missing required fields.

### Files modified:
- `events.js` (scope + contract metadata)
- Systems/UI components adopting scope pattern

### Verification:
- Open/close OverworldScene repeatedly - no duplicate handlers
- Navigate zones - no stale listeners
- Event payload shape warnings stay clean in normal play

---

## Phase 9: Offline Progress Engine (~80 lines added, idle loop completed) — DONE

> **Status:** OfflineProgress.js created (~130 lines). Rate-based: computes player DPS from ComputedStats, averages zone enemy pool with scaling, estimates kills = offlineSeconds / killCycleTime, applies gold/XP/fragments via Store/Progression. Stored result pattern avoids Phaser scene timing issues. SystemLog shows "Welcome back!" summary. DialogueManager fires snarky quip if away >5 min. SAVE.minOfflineTime (60s) skips quick reloads. No loot drops, kill counters, boss sim, or death modeling — by design.

**Why ninth:** Idle progression is a core requirement. `SAVE.maxOfflineTime` already exists but is unused; this phase makes offline catch-up deterministic and bounded.

### 9A. OfflineProgress Module

**New file:** `src/systems/OfflineProgress.js`

On load:
- Compute `offlineMs = clamp(now - lastOnline, 0, SAVE.maxOfflineTime)`
- Simulate coarse reward ticks (gold/xp/fragments only; no render/boss simulation)
- Emit summary event `prog:offlineApplied` for UI/log feedback

### 9B. SaveManager Integration

Call `OfflineProgress.apply()` after migration + hydration and before normal runtime resumes.

### Files modified/created:
- **New:** `src/systems/OfflineProgress.js`
- **Modified:** `SaveManager.js`, `events.js`, `SystemLog.js` (optional summary line)

### Verification:
- Close game for 5+ minutes, reopen, verify bounded offline rewards
- Rapid reload does not duplicate offline rewards
- Old saves still load and migrate correctly

---

## Summary

| Phase | Focus | Lines Removed | Lines Added | Net | Risk |
|-------|-------|--------------|-------------|-----|------|
| 1 | UI Foundation (ModalPanel, utils, scroll) | ~500 | ~200 | -300 | Low |
| 2 | Computed Stats + Effect Channels | ~80 | ~140 | +60 | Low |
| 3 | Config Decomposition | ~0 | ~20 | +20 | None |
| 4 | System Kernel + Lifecycle Matrix | ~10 | ~70 | +60 | Low |
| 5 | Store Slimming + Mutation Boundaries | ~100 | ~100 | ~0 | Medium |
| 6 | CombatEngine Decomposition | ~50 | ~30 | -20 | Medium |
| 7 | Unified Kill Tracking | ~30 | ~10 | -20 | Low |
| 8 | Event Cleanup + Contract Registry | ~30 | ~35 | +5 | None |
| 9 | Offline Progress Engine | ~0 | ~80 | +80 | Medium |
| **Total** | | **~800** | **~685** | **-115** | |

**Net result:** cleaner boundaries and stronger guarantees: a reusable UI foundation, centralized derived stat/effect logic, explicit lifecycle ownership, and deterministic offline progression with migration-safe behavior.

### What We Intentionally Don't Change
- **Event system architecture** - it is already clean and disciplined
- **Single Store object** - splitting domain stores would complicate saves
- **Data file structure** - areas, enemies, items, upgrades, territories, dialogue are already organized
- **TimeEngine fundamentals** - simple and effective
- **BigNum wrapper** - thin and appropriate

### End-to-End Verification (After All Phases)
1. Fresh game: boot -> kill enemies -> level up -> buy upgrades -> loot items -> equip
2. Boss flow: clear zone kills -> challenge boss -> defeat -> area unlock
3. Territory: open map (M) -> claim territory -> verify buff in stats panel (C)
4. Prestige: reach area 4+ -> prestige -> verify reset/keep behavior -> blast through area 1
5. Cheats: collect 10 fragments -> Loot Hoarder unlocks -> auto-merge working
6. Save/load: save -> reload page -> verify all state persisted
7. Panels: open each panel (I/U/P/ESC/C) -> verify mutual exclusion -> backdrop dismiss
8. Old save migration: load pre-refactor save -> verify graceful migration
9. Offline loop: close game 5+ minutes -> reopen -> verify bounded catch-up rewards
10. Contract checks: run dev build and verify no unknown buff/event payload warnings
