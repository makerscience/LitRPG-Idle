# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. Overworld Territory Map implemented (13 territories, buffs, overlay scene, claim flow)
2. Phase 2 deferred: `allIncome` + `prestigeMultiplier` buff integration needs balance testing
3. Next: playtesting territory balance, visual polish, or additional features

## Next Actions
- [ ] Playtest territory claim flow end-to-end (kill enemies, open map, claim, verify buff)
- [ ] Verify map overlay renders correctly over game area with UIScene elements visible
- [ ] Test save/load with territory state (killsPerEnemy + territories persistence)
- [ ] Test prestige with territories (should NOT reset kills or conquered territories)
- [ ] Add Phase 2 buff integration: `allIncome` and `prestigeMultiplier` after balance testing
- [ ] Consider visual polish: node icons, territory images, transition animations

## Open Loops / Blockers
- `allIncome` and `prestigeMultiplier` territory buffs are defined in data but NOT yet integrated into gameplay systems (deferred to Phase 2)
- `getEffectiveMaxHp()` in CombatEngine accounts for flatVit + maxHp territory buffs, but Store's `healPlayer()` and `damagePlayer()` still use base max HP — may need alignment if HP display shows incorrect max

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Next:** Playtest the territory map (press M key in-game)
- **If unclear:** Check the implementation plan in `Overworld Territory Map Plan.md`

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- 8-phase build plan in `MVP_PLAN.md`
- Architecture + event catalog in `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- Created `src/data/territories.js` with 13 territory definitions (map positions, buffs, costs)
- Added `TERRITORY_CLAIMED` and `TERRITORY_PROGRESS_UPDATED` events
- Added `TERRITORY` config block and bumped save schema to v6
- Added `killsPerEnemy` and `territories` to Store with hydration and prestige persistence
- Created `TerritoryManager` singleton (kill tracking, claim flow, buff aggregation)
- Integrated territory buffs into CombatEngine (STR, crit, baseDamage, goldGain, xpGain, hpRegen, maxHp, flatVit), LootEngine (fragmentDropRate), UpgradeManager (autoAttackSpeed)
- Created `OverworldScene` with interactive map nodes, info panel, and claim UI
- Added MAP button + M key toggle in UIScene, ZoneNav show/hide, SystemLog + DialogueManager territory hooks

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
