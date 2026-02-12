# DECISIONS

Format:
- Date:
- Tags: (workflow, architecture, tooling, convention, failure-mode)
- Decision:
- Rationale:
- Alternatives considered:
- Consequences / Follow-ups:

---

## 2026-01-24
- Tags: architecture, workflow
- Decision: Governance-only memory (no MCP server) using CLAUDE.md + .memory files.
- Rationale: Minimum complexity while maintaining continuity across sessions.
- Alternatives considered: Full MCP project-memory server with ChromaDB.
- Consequences / Follow-ups: If memory friction grows, revisit adding MCP later.

## 2026-02-06
- Tags: architecture
- Decision: BigNum.js exports utility functions (D, format, fromJSON) — not a Decimal subclass. State holds live Decimal instances; strings only in localStorage.
- Rationale: Decimal already has toJSON() → string. No wrapper class needed. JSON.stringify just works.
- Alternatives considered: Custom BigNum class wrapping Decimal.
- Consequences / Follow-ups: All mutation methods must use D() to construct Decimals. Hydration in Store.loadState() converts strings → Decimals.

## 2026-02-06
- Tags: architecture
- Decision: Store is a module singleton with named mutation methods as the only write path. SaveManager receives Store as init() parameter.
- Rationale: Avoids circular imports. Named methods give a clear audit trail + event emission.
- Alternatives considered: Store as class instance, SaveManager importing Store directly.
- Consequences / Follow-ups: Every new state field needs a corresponding mutation method or integration into an existing one.

## 2026-02-08
- Tags: architecture, failure-mode
- Decision: Tree/fern sprites use normal blend mode (NORMAL) with PNG alpha transparency. No ADD, MULTIPLY, or SCREEN.
- Rationale: Tree images have dark-but-not-black backgrounds behind transparent areas. ADD/SCREEN made the non-black pixels visible as ghostly rectangles. MULTIPLY only works for white-bg images. PNG alpha handles it correctly with no blend tricks.
- Alternatives considered: ADD (ghost rectangles), SCREEN (same issue, slightly less), MULTIPLY (only works on white-bg tree003).
- Consequences / Follow-ups: Future foreground sprites should be PNGs with transparent backgrounds — no need for blend mode config per asset.

## 2026-02-08
- Tags: architecture
- Decision: Tree containers tracked in `_treeLayers` separately from `_parallaxLayers`. Not added to the main parallax array.
- Rationale: Main parallax loop's fallback branch was interfering with tree movement. Separating them ensures only the dedicated diagonal scroll code moves trees.
- Alternatives considered: `isTreeLayer` data flag with continue in main loop (caused intermittent issues).
- Consequences / Follow-ups: `_destroyParallax()` must iterate `_treeLayers` separately for cleanup.

## 2026-02-10
- Tags: architecture
- Decision: Overworld Territory Map runs as a parallel overlay scene (OverworldScene). GameScene stays active underneath so TimeEngine.update() keeps ticking. OverworldScene does NOT touch TimeEngine.
- Rationale: Eliminates double-tick and pause bugs. Map is opaque bg over game area, UIScene elements (TopBar, Log, Dialogue) remain visible since they're outside the game area rect.
- Alternatives considered: Sleep/wake GameScene when map opens (would pause combat). Run map in UIScene as a panel (too complex, different lifecycle).
- Consequences / Follow-ups: Territory buffs use TerritoryManager.getBuffValue/getBuffMultiplier pattern. Store doesn't import TerritoryManager (avoids circular deps) — CombatEngine provides getEffectiveMaxHp() wrapper instead.

## 2026-02-10
- Tags: architecture
- Decision: Territory `killsPerEnemy` and `territories` persist across prestige resets. They are NOT reset in Store.performPrestige().
- Rationale: Territories are meant to be permanent progression that rewards long-term play across prestige cycles.
- Alternatives considered: Reset territories on prestige (too punishing), reset kills only (confusing UX).
- Consequences / Follow-ups: Phase 2 will add `prestigeMultiplier` and `allIncome` buffs — need balance testing before integration.

## 2026-02-10
- Tags: architecture
- Decision: Renamed flat "zones" (1-5) to "areas". Each area contains multiple "zones" (sub-levels). Enemies use `area` field instead of `zone`.
- Rationale: Deeper progression system. 34 total zones across 5 areas. Progressive enemy unlocks and boss gates add more granular progression.
- Alternatives considered: Keep flat 5-zone system with more enemies per zone (less progression depth).
- Consequences / Follow-ups: Save migration v6→v7. `furthestArea` replaces `furthestZone` as high-water mark. `areaProgress` stores per-area zone clear state. Parallax rebuilds on area change only (not zone change). Territory gating uses `furthestArea`.

## 2026-02-10
- Tags: architecture
- Decision: Boss fights are player-initiated via "Challenge Boss" button, not automatic. Boss fight cancels if player navigates away.
- Rationale: Gives player agency over when to fight bosses. Prevents accidental boss fights when browsing zones. Reduces frustration from boss death loops.
- Alternatives considered: Auto-spawn boss after kill threshold (too punishing), persistent boss fight across navigation (complex state).
- Consequences / Follow-ups: BossManager tracks `activeBoss` state. CombatEngine.spawnBoss() is separate from spawnEnemy(). Zone change events cancel active boss.

## 2026-02-10
- Tags: architecture
- Decision: Zone progress (areaProgress) resets on prestige. Territories and killsPerEnemy persist. furthestArea is permanent.
- Rationale: Re-clearing zones each prestige cycle gives the prestige loop meaning. Territories are permanent progression that compounds across cycles. furthestArea gates territory access.
- Alternatives considered: Keep zone progress on prestige (trivializes replay), reset territories too (too punishing).
- Consequences / Follow-ups: createAreaProgress() called in performPrestige() to reset. Area 1 zone 1 starts unlocked on prestige.

## 2026-02-10
- Tags: architecture
- Decision: Inventory stack keys use composite format `itemId::rarity` (e.g. `iron_dagger::rare`). Equipment slots store full composite keys. `getItem()` transparently strips the rarity suffix for item lookups.
- Rationale: Allows same base item with different rarities to occupy separate inventory slots. Rarity is rolled at drop time by LootEngine and preserved through the full lifecycle (add → equip → unequip → sell).
- Alternatives considered: Array of stacks per itemId (more complex iteration), rarity as a stack field only without changing keys (can't differentiate stacks of same item).
- Consequences / Follow-ups: Save migration v8. All code touching inventoryStacks or equipped must use composite keys. `parseStackKey()` and `makeStackKey()` helpers in InventorySystem. Future: rarity could affect stat bonuses and sell value.

## 2026-02-11
- Tags: architecture
- Decision: ModalPanel base class uses `scene.closeAllModals(this)` for mutual exclusion instead of each panel checking every other panel. UIScene owns `_modals` array registry.
- Rationale: Adding a new panel no longer requires updating N existing panels. Central registry is the single source of truth.
- Alternatives considered: Each panel imports and checks others (original pattern, N² coupling), global event-based close (over-engineered).
- Consequences / Follow-ups: New panels just extend ModalPanel and get added to `_modals` in UIScene.create(). No other panels need modification.

## 2026-02-11
- Tags: architecture
- Decision: ComputedStats is a pure-function module (no state, no events). Store → ComputedStats circular import is acceptable because all usage is in function bodies, not at module evaluation time.
- Rationale: ESM handles circular imports correctly when functions are called lazily. ComputedStats needs Store.getState(), Store needs ComputedStats.getEffectiveMaxHp(). Neither calls the other during module init.
- Alternatives considered: Passing state as parameter (verbose, every caller must provide it), setter injection (unnecessary complexity).
- Consequences / Follow-ups: Store.js currently has a broken `require()` attempt — must be replaced with direct ESM `import` which will work fine.

## 2026-02-11
- Tags: architecture
- Decision: Dropped EffectChannels.js from Phase 2 plan. The existing buff key strings (`flatStr`, `baseDamage`, etc.) work fine without a formal registry.
- Rationale: Only 11 buff keys exist, all used consistently. A formal registry adds complexity for negligible benefit in a solo project.
- Alternatives considered: Implementing EffectChannels as planned (over-engineered for current scope).
- Consequences / Follow-ups: If buff keys proliferate or cause bugs, revisit.

## 2026-02-11
- Tags: architecture
- Decision: Store becomes a pure state container — no business logic. Progression.js owns XP/level-up. PrestigeManager owns prestige orchestration. Store only exposes granular mutation primitives.
- Rationale: Store was a god object mixing state, XP loop, prestige reset logic. Extracting business logic into domain systems reduces coupling and makes each module easier to understand.
- Alternatives considered: Keep Store.addXp() with level-up (simpler, but violates single responsibility). Full Progression system with kill rewards (deferred to Phase 6).
- Consequences / Follow-ups: CombatEngine imports Progression. UpgradeManager uses Store.addFlatStat() instead of direct mutation. Phase 6 will expand Progression with kill reward orchestration.

## 2026-02-11
- Tags: architecture
- Decision: Removed legacy state fields (currentWorld, top-level furthestZone) and legacy methods (setZone, setFurthestZone). No save migration needed — hydration defaults handle missing fields.
- Rationale: These fields were only written/read inside Store.js, kept in sync with currentArea/furthestArea. Nobody outside Store consumed them. Removing eliminates dead state.
- Alternatives considered: Keep for potential future multi-world support (YAGNI).
- Consequences / Follow-ups: Old saves with these fields silently ignore them during hydration. WORLD_ZONE_CHANGED event payload no longer includes `world` field (nobody read it).

## 2026-02-11
- Tags: architecture
- Decision: EventScope pattern (`createScope()`) replaces manual `let unsubs = []` arrays in all system singletons. Event contract registry validates payloads in dev mode only.
- Rationale: Manual unsubs arrays are error-prone (forget to push, forget to clear). Scope groups subscriptions and guarantees cleanup. Contracts catch payload shape bugs early without production overhead.
- Alternatives considered: Convert UI classes too (unnecessary — base classes already handle cleanup). Full runtime type validation (over-engineered for solo project).
- Consequences / Follow-ups: New systems should use `createScope()` instead of manual arrays. UI components keep `this._unsubs` via base classes (ModalPanel, ScrollableLog).

## 2026-02-11
- Tags: architecture
- Decision: All kill counting (total, per-enemy, zone-clear) centralized in Progression.grantKillRewards(). BossManager and TerritoryManager no longer count kills independently.
- Rationale: Three systems independently counting from the same event created consistency risk. Single source of truth in Progression ensures counts are always in sync.
- Alternatives considered: Keep distributed counting with event payload enrichment (still duplicated logic).
- Consequences / Follow-ups: BossManager listener simplified to threshold check only. TerritoryManager init/destroy are now empty (reads Store on demand via canClaim/getKillProgress).

## 2026-02-11
- Tags: architecture
- Decision: Offline progress uses rate-based calculation (DPS × time), not tick-by-tick simulation. Stored result pattern — OfflineProgress stores result, UI reads it when scenes create.
- Rationale: Rate-based is simpler, faster, and matches MVP Plan guidance. Stored result avoids timing dependency on Phaser scene creation order. Events fire during apply() but no UI listeners exist yet — harmless.
- Alternatives considered: Per-second tick simulation (expensive, unnecessary for coarse estimate). Event-based notification (timing issues with scenes not yet created).
- Consequences / Follow-ups: No loot/items, kill counters, boss sim, or death modeling offline. If offline rewards feel too generous/stingy, tune the formula or add an efficiency multiplier (<1.0).

## 2026-02-12
- Tags: architecture
- Decision: Equipment slot IDs in Store.equipped use descriptive names (`chest`, `main_hand`) instead of item slot field names (`body`, `weapon`). equipSlots.js maps between them via `itemSlot` field.
- Rationale: 33 equipment slots need clear names (e.g., `ring1`/`ring2` for two ring slots, `main_hand` vs future `off_hand`). Item `slot` field stays generic for filtering. equipSlots data bridges the two.
- Alternatives considered: Keep store keys matching item.slot (simpler but ambiguous for rings, future off-hand). Use numeric IDs (less readable).
- Consequences / Follow-ups: Save migration in hydrateState maps old `body`→`chest`, `weapon`→`main_hand`. SaveManager v7→v8 migration still uses old names (runs first, then hydration remaps). InventorySystem._resolveEquipSlot() handles item.slot → equipped key mapping.

Tip: Search with `rg "Tags:.*workflow" .memory/DECISIONS.md`
