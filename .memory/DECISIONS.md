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

Tip: Search with `rg "Tags:.*workflow" .memory/DECISIONS.md`
