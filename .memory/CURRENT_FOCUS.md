# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. Phase 3 COMPLETE — move to Phase 4 (Loot + Inventory)
2. Polish UI (auto-attack toggle in Phase 5, DPS counter)
3. Start loot/inventory groundwork

## Next Actions
- [ ] Verify Phase 3 in-browser: TopBar, SystemLog, ZoneNav, SYSTEM dialogue all working
- [ ] Commit Phase 3 changes
- [ ] Plan Phase 4 (Loot drops, inventory grid, equipment)
- [ ] Add item data definitions and drop tables
- [ ] Implement inventory UI panel

## Open Loops / Blockers
- (none currently)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Next:** Execute the first unchecked item in "Next Actions"
- **If unclear:** Check `MVP_PLAN.md` Phase 4 requirements

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- 8-phase build plan in `MVP_PLAN.md`
- Architecture + event catalog in `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- Phase 3 implemented: full UI shell working
- Created `src/ui/TopBar.js` — gold/mana/fragments display + level/XP bar with pop-tween
- Created `src/ui/SystemLog.js` — scrollable masked log with color-coded lines (green/yellow/indigo/sky blue)
- Created `src/ui/ZoneNav.js` — zone arrow navigation with boundary dimming
- Created `src/systems/DialogueManager.js` — flag-gated SYSTEM dialogue (first kill, first level-up, Zone 2)
- Created `src/scenes/UIScene.js` — parallel overlay orchestrating TopBar, SystemLog, ZoneNav, DialogueManager
- Added LAYOUT + COLORS constants to config.js, setFlag() to Store, repositioned GameScene to 960px game area
- `vite build` passes cleanly

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
