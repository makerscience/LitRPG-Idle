# DECISIONS

Format:
- Date:
- Tags: (workflow, architecture, tooling, convention, failure-mode)
- Decision:
- Rationale:
- Alternatives considered:
- Consequences / Follow-ups:

---

## 2026-02-14
- Tags: architecture
- Decision: Replace uniform zone scaling (0.15 for all stats) with asymmetric per-stat scaling: HP 0.10, ATK 0.12, Gold 0.18, XP 0.08. `getZoneScaling(zoneNum, stat)` accepts a stat parameter.
- Rationale: Uniform scaling produced flat TTK curves (HP and rewards grew in lockstep), zero snowball, and area transition collapse. Asymmetric scaling creates snowball (gold outpaces HP), rising danger (ATK outpaces HP), and prevents over-leveling (XP grows slowest).
- Alternatives considered: Halving per-level STR growth (cascade breakage through all bosses), reducing uniform scaling to 0.09 (incomplete — doesn't address reward/difficulty coupling).
- Consequences / Follow-ups: CombatEngine, OfflineProgress, and balance-sim all call `getZoneScaling(zone, 'hp'|'atk'|'gold'|'xp')`. Callers without a stat param default to 0.10 rate. Area-entry enemy stats calibrated to compensate — A2/A3 enemies got 30% HP and 65-75% ATK increases to create difficulty walls.

## 2026-02-14
- Tags: architecture, failure-mode
- Decision: Use native HTML5 `Audio` element for BGM instead of Phaser's Web Audio sound system.
- Rationale: Soundtrack is 207MB (~2.5hr MP3). Phaser's Web Audio decodes entire file into memory before playback — silently fails or hangs. HTML5 Audio streams from disk/network.
- Alternatives considered: Phaser `this.sound.add()` (failed — too large to decode), splitting file into smaller chunks.
- Consequences / Follow-ups: BGM lives outside Phaser's sound manager. Volume synced manually via `_bgm.volume`. If we add SFX later, those can use Phaser's sound system (small files).

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

## 2026-02-12
- Tags: architecture
- Decision: Hard pivot to GDD vertical slice. New save namespace `litrpg_idle_vslice_save` with schema v1. Feature gates disable prestige, territory, town, cheats. Legacy saves archived non-destructively.
- Rationale: Clean break from old progression model. New namespace avoids save conflicts. Feature gates prevent disabled systems from booting or showing in UI while keeping code intact for future re-enablement.
- Alternatives considered: Migrate old saves into new model (too error-prone, GDD stats are fundamentally different). Delete old saves (destructive, prevents rollback testing).
- Consequences / Follow-ups: Old save data preserved under `litrpg_idle_legacy_archive`. TerritoryManager remains imported as passive buff source (returns 0/1 defaults) — avoids null checks in ComputedStats/CombatEngine.

## 2026-02-12
- Tags: architecture
- Decision: V2 enemies use `zones: [min, max]` range instead of single `area` field. Enemy availability at a zone is `zone >= e.zones[0] && zone <= e.zones[1]`. Backward-compat `area` getter derived from `zones[0]`.
- Rationale: Zone ranges allow enemies to span multiple zones and overlap, giving smoother difficulty curves. One enemy can appear in zones 1-3 while another appears in 2-4, creating natural transitions. The old model locked each enemy to a single area with progressive-unlock slicing.
- Alternatives considered: Keep `area` field + unlock index (V1 model, less flexible). Add both `area` and `zones` fields (redundant data).
- Consequences / Follow-ups: `getUnlockedEnemies(areaId, zoneNum)` computes `globalZone = area.zoneStart + zoneNum - 1` then filters by range. `getEnemiesForArea()` filters by zone overlap with area's range. Areas 2-3 currently have no enemies (authored in Phase 5).

## 2026-02-12
- Tags: architecture
- Decision: V2 items use 6-key `statBonuses` object `{str, def, hp, regen, atkSpeed, atk}` with all keys always present (0 for unused). `atk` is an alias equal to `str` for weapons, 0 for non-weapons.
- Rationale: `InventorySystem.getEquippedWeaponDamage()` reads `item.statBonuses.atk`. Setting `atk = str` on weapons preserves backward compat without changing InventorySystem. All 6 keys always present avoids undefined checks when summing equipment bonuses.
- Alternatives considered: Remove `atk`, update InventorySystem to read `str` (premature system change in a data-only phase). Keep only `atk`/`def` (insufficient for V2 stat model).
- Consequences / Follow-ups: `getScaledItem()` now scales all stat keys uniformly via `Object.entries().map()`. Phase 2 will wire `ComputedStats` to sum hp/regen/atkSpeed from equipped gear.

## 2026-02-12
- Tags: architecture
- Decision: V2 bosses are hand-authored data in `src/data/bosses.js`, not auto-generated from enemy templates × multipliers. Each boss has fixed stats, a `baseEnemyId` for sprite reference, and `bossType` (MINI/AREA).
- Rationale: Named bosses with hand-tuned stats give better balance control and narrative identity than multiplicative generation. `baseEnemyId` links boss to an enemy for sprite reuse without coupling stats.
- Alternatives considered: Keep auto-generation from BossManager (less control, generic names). Hybrid approach with base stats from data + runtime multipliers (unnecessary complexity).
- Consequences / Follow-ups: BossManager still auto-generates bosses from enemy templates until Phase 3 rewrite. bosses.js is inert until then. Phase 3 will make BossManager look up bosses from data instead of generating them.

## 2026-02-12
- Tags: tooling
- Decision: Data validator script (`scripts/validate-data.js`, `npm run validate:data`) checks schema, cross-references, and zone coverage for all data files at build time.
- Rationale: With 30 zones, 30+ bosses, and 40+ items across 3 areas, manual cross-reference checking is error-prone. Automated validation catches broken lootTable itemIds, missing boss baseEnemyIds, zone gaps, and schema violations before they become runtime bugs.
- Alternatives considered: Runtime validation in dev mode only (harder to run in CI, mixes concerns). No validation (acceptable for V1's 12 items but not for V2's scale).
- Consequences / Follow-ups: Run after every data file edit. Will need updates as Area 2-3 content is authored (currently warns on empty zones 6-30, which is expected).

## 2026-02-12
- Tags: architecture
- Decision: atkSpeed is NOT stored in playerStats. Computed purely from gear via `ComputedStats.getPlayerAtkSpeed()`. Base value (1.0) lives in `COMBAT_V2.playerBaseAtkSpeed`.
- Rationale: Attack speed is a gear-only stat per GDD. Storing it in playerStats would imply level-ups could increase it, which contradicts the design. Gear-only derivation keeps the stat model clean.
- Alternatives considered: Store atkSpeed in playerStats with 0 growth (confusing — stat exists but never grows). Hardcode in CombatEngine (less flexible).
- Consequences / Follow-ups: ComputedStats.getPlayerAutoAttackInterval() computes the full interval from gear speed + upgrade/territory bonuses. CombatEngine re-registers auto-attack timer on INV_ITEM_EQUIPPED.

## 2026-02-12
- Tags: architecture
- Decision: Per-enemy attack speed replaces fixed global enemy attack interval. Each enemy's `attackSpeed` field determines its attack timer interval. Timer re-registered on every spawn.
- Rationale: GDD specifies different attack speeds per enemy (Feral Hound 1.2/s, Thornback Boar 0.8/s). Fixed 3s interval from V1 doesn't support this. Re-registering on spawn is clean since TimeEngine.register() overwrites existing keys.
- Alternatives considered: Keep fixed interval, scale damage instead (loses tactical feel). Store interval instead of speed (speed is more intuitive for authoring).
- Consequences / Follow-ups: `combat:enemyAttack` timer is unregistered on enemy death and zone change to prevent orphaned tickers. No enemy attack timer runs between spawns.

## 2026-02-12
- Tags: architecture
- Decision: DoT implemented as a `combat:enemyDot` TimeEngine ticker (1s interval) running while a DoT-capable enemy is alive. Flat damage bypasses defense. Cleared on enemy death, zone change, player death.
- Rationale: TimeEngine already handles periodic tickers with clean lifecycle. Flat bypassing defense matches GDD spec ("unavoidable environmental damage"). Strict clear-on-death/zone-change prevents phantom ticks.
- Alternatives considered: DoT as part of enemyAttack callback (couples two different damage sources). DoT as status effect system (over-engineered for current scope).
- Consequences / Follow-ups: _startDot()/_stopDot() called symmetrically in spawn/death/zone-change paths. If DoT becomes more complex (stacking, types), may need a StatusEffect system.

## 2026-02-12
- Tags: architecture
- Decision: ComputedStats owns equipment stat summation via `getEquipmentStatSum(statKey)`. Iterates all equipped slots, calls `getScaledItem()` on each, sums the requested stat. Used by getEffectiveStr, getEffectiveDef, getEffectiveMaxHp, getHpRegen, getPlayerAtkSpeed.
- Rationale: Equipment stats affect 5+ derived values. Centralizing the sum in one helper eliminates duplicate iteration logic. getScaledItem() handles rarity scaling transparently.
- Alternatives considered: Each function iterates equipped slots independently (duplicated code). InventorySystem provides stat sums (wrong responsibility — InventorySystem is for inventory mutations, not stat queries).
- Consequences / Follow-ups: getEquipmentStatSum() is called frequently but equipment changes are rare. If perf becomes an issue, cache sums and invalidate on INV_ITEM_EQUIPPED.

## 2026-02-12
- Tags: architecture
- Decision: V1 combat/progression constants (`COMBAT`, `PROGRESSION`, `DAMAGE_FORMULAS`) fully purged from all src/ imports. Only V2 equivalents (`COMBAT_V2`, `PROGRESSION_V2`) used by runtime code. V1 constants remain defined in config.js for reference but are dead code.
- Rationale: Clean break prevents accidental V1 formula usage. Having both constants available during the Phase 1→2 transition was useful, but now that Phase 2 is complete, no runtime code should reference V1.
- Alternatives considered: Delete V1 constants from config.js (premature — may need for comparison during balance tuning). Keep V1 imports as fallbacks (confusing dual-path logic).
- Consequences / Follow-ups: V1 constants can be removed from config.js in a future cleanup pass once balance is validated.

## 2026-02-13
- Tags: architecture
- Decision: LootEngine V2 uses zone-based item pools + slot-weighted random selection with pity. No per-enemy loot tables. Pity increments on BOSS_DEFEATED (zone clear), resets per-slot on drop.
- Rationale: Zone-based pools are simpler to maintain across 30 zones than per-enemy tables. Slot weighting ensures all gear slots get drops over time. Pity prevents bad-luck streaks from locking out slot upgrades.
- Alternatives considered: Keep per-enemy loot tables (doesn't scale), pure random item selection (some slots starved), pity on every kill (too fast).
- Consequences / Follow-ups: Items only need `zones: [min, max]` — no loot table cross-references needed. Boss lootTable field becomes unused by LootEngine (kept for validator/future use). ACTIVE_SLOT_IDS drives both pity tracking and drop filtering.

## 2026-02-13
- Tags: architecture
- Decision: Boss first-kill detection relies on BossManager.onBossDefeated() being delayed 1300ms after COMBAT_ENEMY_KILLED. LootEngine checks bossesDefeated at event time — absence = first kill.
- Rationale: No new state or events needed. The 1300ms delay exists for the boss defeat animation/transition, and the event ordering is deterministic. Clean separation of concerns.
- Alternatives considered: Add a `firstKill` flag to COMBAT_ENEMY_KILLED payload (requires BossManager to enrich CombatEngine events — coupling). Track first kills in LootEngine's own state (redundant with bossesDefeated).
- Consequences / Follow-ups: If the CombatEngine delay changes, first-kill detection must be re-verified. Document the timing dependency.

## 2026-02-13
- Tags: convention
- Decision: Per-area loot tables are duplicated in both `enemies.js` and `bosses.js` (not shared/imported). Each file defines its own `AREA_1_LOOT_TABLE`, `AREA_2_LOOT_TABLE`, `AREA_3_LOOT_TABLE` constants.
- Rationale: LootEngine V2 doesn't use loot tables at all (zone-based pools instead). The tables are vestigial — kept only for data validator schema consistency and potential future use. Duplicating avoids a cross-file import for dead data. If LootEngine ever reads loot tables again, consolidate into a shared module.
- Alternatives considered: Shared loot table module imported by both files (over-engineered for unused data). Remove loot tables entirely (breaks validator schema checks).
- Consequences / Follow-ups: When adding new items, update loot tables in both enemies.js and bosses.js. Consider removing loot tables from schema if they remain unused after balance tuning.

## 2026-02-13
- Tags: convention
- Decision: Content authoring conventions locked for all 3 areas: enemy gold = `Math.round(HP * 0.25)`, boss gold = HP, all XP = HP. Sell values scale ~2-4x per area tier. Item `atk` = `str` for weapons, 0 for non-weapons. All 6 statBonuses keys always present.
- Rationale: Consistent formulas across 18 enemies and 30 bosses prevent per-entity balance drift. The HP-based approach is simple and self-documenting. Validator enforces the atk/str invariant.
- Alternatives considered: Per-entity gold/XP tuning (time-consuming, error-prone at scale). Formula-based generation at runtime (hides values from data validator).
- Consequences / Follow-ups: **SUPERSEDED by Phase 7 balance pass (see 2026-02-13 balance decision below).** XP and ATK conventions changed: enemy XP ≈ hp × 0.25, boss XP ≈ hp × 0.5, enemy ATK ≈ original × 3, boss ATK ≈ original × 3.5. Gold and item conventions unchanged.

## 2026-02-13
- Tags: architecture
- Decision: COMBAT_ENEMY_SPAWNED payload enriched with `armorPen`, `dot`, `defense` fields. New `COMBAT_DOT_TICK` event emitted every 1s from DoT ticker.
- Rationale: SystemLog needs these fields to show spawn-time warnings and periodic DoT damage. Enriching the existing event is simpler than adding a separate mechanic-info event. DoT ticks are throttled in the UI (every 5th) to avoid log spam.
- Alternatives considered: Separate COMBAT_MECHANIC_INFO event (unnecessary indirection). SystemLog querying CombatEngine for enemy data (coupling).
- Consequences / Follow-ups: Any future combat mechanic feedback (e.g. crit vulnerability, elemental weakness) can follow the same pattern — enrich spawn payload, add a log handler.

## 2026-02-13
- Tags: convention
- Decision: Area names are authoritative in `areas.js` only. ZONE_THEMES in theme.js holds visual config (layers, images, trees, ferns) but no names. ZoneNav, SystemLog, and DialogueManager all read names from `getArea()`.
- Rationale: ZONE_THEMES had stale V1 names ("Forest", "Wilderness") that shadowed V2 names. Single source of truth prevents drift.
- Alternatives considered: Keep names in both places (drift risk). Move visual config into areas.js (mixes data/presentation concerns).
- Consequences / Follow-ups: Any new area must add its name to areas.js and visual config to ZONE_THEMES separately.

## 2026-02-13
- Tags: architecture
- Decision: V2 balance conventions changed. Enemy ATK ×3 from original, XP = ~25% of HP (was 100%). Boss ATK ×3.5, XP = ~50% of HP (was 100%). Gold unchanged.
- Rationale: Original values made enemies trivially weak (ATK < defense*0.5 = minimum 1 damage), and XP too generous (player double-leveled vs GDD targets). New values produce meaningful combat with survival ratios 2-10x for regular zones and 1.2-2.0x for area bosses.
- Alternatives considered: Changing defense coefficient in combat formula (too fundamental), reducing XP table (last resort per plan), reducing kill thresholds (not in tuning scope).
- Consequences / Follow-ups: Balance sim script (`npm run balance:sim`) exists for future tuning. If new content is added, follow new conventions: `xpDrop ≈ hp * 0.25` for enemies, `xpDrop ≈ hp * 0.5` for bosses, `attack ≈ hp * 0.3-0.5` for enemies.

Tip: Search with `rg "Tags:.*workflow" .memory/DECISIONS.md`
