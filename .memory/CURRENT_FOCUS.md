# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. All 8 phases + sprite/HP system implemented — MVP feature-complete
2. Settings menu added (wipe save)
3. Next: more enemy sprites, playtesting, or Itch.io packaging

## Next Actions
- [ ] Add sprites for other Zone 1 enemies (Sewer Rat, Green Slime) if art available
- [ ] Manual playtest: verify balance with enemy attacks (player shouldn't die too easily in Zone 1)
- [ ] Consider Itch.io packaging / offline progress (deferred scope)
- [ ] Consider player sprite to replace blue rectangle

## Open Loops / Blockers
- (none currently)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Next:** Execute the first unchecked item in "Next Actions"
- **If unclear:** Check `Current Phase Plan.md` for Phase 8 verification checklist

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- 8-phase build plan in `MVP_PLAN.md`
- Architecture + event catalog in `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- Added SettingsPanel: SETTINGS button in bottom bar + ESC toggle, modal with wipe save (two-click confirm)
- Wipe save fix: destroy SaveManager before deleting localStorage to prevent beforeunload re-saving
- Fixed invisible enemy bug: death animation (800ms) outlasted spawn delay (400ms), tweens faded new enemy to 0 alpha
- Fix: increased spawnDelay from 400ms → 1000ms + added killTweensOf on spawn for safety
- Mutual exclusion wired for all 4 panels (Inventory, Upgrades, Prestige, Settings)

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
