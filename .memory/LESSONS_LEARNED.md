# Lessons Learned

Honest retrospective on the LitRPG Idle project — what worked, what didn't, and what to do differently next time. Written after completing the full 9-phase codebase redesign.

---

## What Worked Better Than Expected

### 1. Memory governance system (CLAUDE.md + .memory/)
The lightweight session protocol — read CURRENT_FOCUS, check DECISIONS, produce a session plan — was the single biggest productivity multiplier. Expected it to be bureaucratic overhead; instead it **prevented re-debating the same architectural questions** across sessions. The "resume in 30 seconds" section alone saved at least 10 minutes per session. DECISIONS.md caught two cases where we were about to undo a prior choice.

**Takeaway:** Invest in session continuity infrastructure early. The cost is ~5 minutes/session; the payoff is never losing context.

### 2. Phased redesign with "always playable" constraint
Each redesign phase was independently valuable and left the game fully functional. Could have stopped after Phase 2 and the code would still be better. The phased approach also made it psychologically easier to start — "just do Phase 1" is less daunting than "redesign everything."

**Takeaway:** "Every phase leaves the game playable" is the right constraint for refactors. It prevents the trap of a multi-day rewrite that never converges.

### 3. Event-driven architecture from day one
The canonical `events.js` with namespaced events (`domain:action`) was established in Phase 0 of the original MVP plan. It paid dividends continuously — systems stayed decoupled, dialogue triggers were trivial to add, and the EventScope pattern in Phase 8 was possible because the event system was already clean.

**Takeaway:** Event architecture is one of the few things worth getting right upfront. The cost of retrofitting it later is enormous.

### 4. Store mutation boundary
Making all state writes go through named Store methods caught real bugs during the redesign. UpgradeManager was directly mutating `state.playerStats.str` — discovered and fixed during Phase 5. The boundary also made it trivial to add event emission to every write path.

**Takeaway:** Centralized mutation is worth the verbosity. Every `addFlatStat()` method is one more place to hook logging, validation, or events.

### 5. Data-driven dialogue
80+ lines of SYSTEM personality, all in `dialogue.js`, all triggered by events with cooldowns. The game's entire personality lives in a data file. Adding new quips requires zero system changes — just append to an array.

**Takeaway:** Personality should be data, not code. Trigger conditions in the system, content in the data file.

### 6. ModalPanel base class (Phase 1)
Eliminated ~500 lines of copy-pasted modal lifecycle code. After this, adding a new panel (StatsPanel) took 30 minutes instead of 2 hours. The mutual exclusion registry (`UIScene.closeAllModals()`) was the key insight — it replaced N² panel-to-panel coupling with a central registry.

**Takeaway:** UI base classes have enormous leverage when panels share lifecycle patterns. Do this before the third panel, not after the fifth.

### 7. Stored result pattern for offline progress
Instead of emitting an event that no UI scene would catch (Phaser scenes don't exist yet during boot), OfflineProgress stores its result and UI reads it when ready. Zero timing issues, zero new events needed.

**Takeaway:** When the producer runs before the consumer exists, store-and-read beats emit-and-hope.

---

## Mistakes Made

### 1. Redesign came too late
Built 8 feature phases, accumulated significant structural debt, THEN did a 9-phase redesign. The redesign would have been 60% cheaper if done after Phase 3-4 of the original MVP, when the architecture was simpler and fewer systems existed. By the time we redesigned, every change required understanding cross-system interactions.

**Takeaway:** Schedule a "structural health check" after every 3-4 feature phases. Refactor while the codebase is small enough to hold in your head.

### 2. GameScene is still a 945-line god object
The redesign improved every system module but never touched GameScene — the single largest file. It mixes parallax rendering, combat visuals, damage number animations, particle effects, sprite management, and scene lifecycle. This is the file most likely to cause bugs in future development.

**Takeaway:** Don't skip the hardest file in a redesign. If it's too scary to split, at least extract the clearly separable concerns (parallax could be its own module; damage numbers could be a utility).

### 3. Hardcoded magic numbers in visual code
Despite Phase 3 (config decomposition), GameScene and OverworldScene still have dozens of hardcoded Y positions, sizes, and spacing values. The config split extracted game balance and UI layout, but visual positioning was left scattered. Adding a 6th area would require hunting through multiple files.

**Takeaway:** Visual layout constants deserve the same treatment as game balance constants. If a number controls where something appears on screen, it belongs in a config file.

### 4. No automated tests
Zero tests for any system. SaveManager migrations, Progression math, ComputedStats formulas, offline progress calculations — all verified manually by playing. One migration bug could corrupt every player's save with no automated way to catch it.

**Takeaway:** At minimum, write tests for: (a) save migrations, (b) core math formulas (damage, XP, offline rewards), (c) state mutation boundaries. These are the highest-leverage tests — not UI tests, not integration tests, just pure-function unit tests.

### 5. Zone/Area naming confusion persists
The rename from flat "zones" to hierarchical "areas containing zones" left vestiges everywhere. `dropChanceByZone` is keyed by area number. `getZoneScaling()` scales within an area's zones. Function parameter names, comments, and config keys are inconsistent. The DECISIONS log records the rename but doesn't track cleanup.

**Takeaway:** When renaming a core concept, do a full grep-and-rename pass in the same session. Leaving "cosmetic" naming mismatches creates cognitive load that compounds over time.

### 6. Save schema version 8 before release
Eight schema migrations for a pre-release game. Each migration is code that will never execute for new players. The data model changed too frequently during development — inventory format alone went through 3 revisions (flat → stacks → rarity-keyed stacks).

**Takeaway:** During early development, consider wiping saves between major changes instead of writing migrations. Save migrations have a purpose — protecting existing players' data. Before release, there are no existing players.

### 7. Territory buff wiring left incomplete
`allIncome` and `prestigeMultiplier` territory buffs are defined in territory data, cost real gold and kills to unlock, but **do nothing**. They're not wired into ComputedStats or any multiplier path. A player who claims these territories gets zero benefit. This is a broken promise in the game design.

**Takeaway:** Don't ship (or commit) data that references unimplemented mechanics. Either wire the buffs or remove the data entries. "Deferred" is fine for a TODO, not for content the player can interact with.

### 8. ARCHITECTURE.md drifted from reality
The architecture doc still describes the original event payload shapes (e.g., `combat:enemyKilled` with just `{ enemyId }` instead of the current `{ enemyId, name, isBoss }`). It references `DialogueDirector` (renamed to `DialogueManager`). It doesn't mention ComputedStats, Progression, EventScope, or OfflineProgress. The doc became a historical artifact rather than a living reference.

**Takeaway:** Architecture docs should be updated during the same session as architectural changes, or they become misleading. A wrong doc is worse than no doc.

### 9. Over-built cheat infrastructure
The cheat system has a full unlock/toggle/persist lifecycle, CheatManager singleton, cheat data structure with dialogue hooks, a CheatDeck UI panel — all for a single cheat (Loot Hoarder). The infrastructure cost was probably 3x what a simple boolean flag would have been.

**Takeaway:** Build the second abstraction when you need the second instance, not when you build the first. One cheat doesn't justify a cheat framework.

### 10. BigNum boundary is blurry
Some values are Decimal objects (gold, XP, HP), others are plain numbers (enemy HP, damage, stats). The conversion happens at inconsistent points — sometimes at the formula level, sometimes at the Store mutation level, sometimes at display time. This creates subtle bugs where `Number(decimal)` silently truncates.

**Takeaway:** Define a clear boundary: "Decimal above X threshold, plain number below." Document which fields are which type. In this game, most values don't need BigNum until very late prestige cycles.

---

## Patterns Worth Reusing

| Pattern | Where Used | Why It Works |
|---------|-----------|--------------|
| Memory governance (CLAUDE.md + .memory/) | Project root | Cross-session continuity without tooling overhead |
| Canonical event registry | events.js | Prevents ad-hoc string drift, enables validation |
| EventScope | events.js → all systems | Groups subscriptions, prevents leaks on destroy |
| Store mutation boundary | Store.js | Single write path = audit trail + event hooks |
| ComputedStats pure functions | ComputedStats.js | One formula per derived value, zero duplication |
| ModalPanel base class | ui/ModalPanel.js | Shared lifecycle eliminates 100+ lines per panel |
| Stored result pattern | OfflineProgress.js | Producer stores, consumer reads when ready |
| Data-driven triggers | dialogue.js + DialogueManager | Content in data files, logic in systems |
| Phased redesign | Codebase Redesign Plan.md | Always-playable constraint prevents rewrite hell |

---

## What To Do Differently On The Next Project

1. **Redesign at phase 3, not phase 8.** Schedule a structural checkpoint after the core loop works.
2. **Tests for math and migrations.** 10 unit tests would catch 80% of the bugs that matter.
3. **Extract GameScene early.** Visual rendering should be split into composable modules (parallax, combat renderer, damage display) before it hits 500 lines.
4. **Don't write migrations pre-release.** Wipe saves during development. Write the first migration when the first real player exists.
5. **Wire it or delete it.** No data entries for unimplemented mechanics. "Deferred" belongs in a TODO, not in the game.
6. **Update ARCHITECTURE.md during the same session as architectural changes.** Treat it like a test — if it's out of date, the change isn't done.
7. **Config-ify visual layout.** Every hardcoded pixel position is a future bug.
