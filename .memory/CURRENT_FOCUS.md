# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. Phase 1 COMPLETE — move to Phase 2 (TimeEngine + Combat core)
2. Implement CombatEngine with enemy spawning + damage application
3. Get click-to-damage working on an enemy sprite

## Next Actions
- [ ] Fill in `TimeEngine.js` with tick loop + offline time calculation
- [ ] Create `src/systems/CombatEngine.js` with enemy spawning + damage
- [ ] Create `src/scenes/GameScene.js` with basic enemy display
- [ ] Wire BootScene → GameScene transition
- [ ] Add click handler on enemy to deal damage

## Open Loops / Blockers
- (none currently)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Next:** Execute the first unchecked item in "Next Actions"
- **If unclear:** Check `MVP_PLAN.md` Phase 1 requirements

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- 8-phase build plan in `MVP_PLAN.md`
- Architecture + event catalog in `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- Phase 1 complete: data backbone in place
- Created `src/systems/BigNum.js` — D(), fromJSON(), format(), Decimal re-export
- Created `src/systems/Store.js` — centralized state, named mutations, event emission
- Created `src/systems/SaveManager.js` — localStorage save/load, backup rotation, migrations
- Created `src/systems/TimeEngine.js` — stub for boot sequence
- Updated `src/main.js` — boot sequence: Store → SaveManager → TimeEngine → Phaser
- Build passes, all modules resolve correctly

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
