# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. Phase 2 COMPLETE — move to Phase 3 (Auto-Attack + DPS)
2. Polish combat feel (auto-attack toggle, DPS counter)
3. Start inventory/loot groundwork

## Next Actions
- [ ] Verify Phase 2 in-browser: click enemy, see damage, kill, respawn, gold/XP accumulate
- [ ] Commit Phase 2 changes
- [ ] Plan Phase 3 (Auto-Attack, DPS display, passive income)
- [ ] Add HUD overlay showing gold, level, XP bar
- [ ] Enable auto-attack toggle via Store.settings.autoAttack

## Open Loops / Blockers
- (none currently)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Next:** Execute the first unchecked item in "Next Actions"
- **If unclear:** Check `MVP_PLAN.md` Phase 2/3 requirements

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- 8-phase build plan in `MVP_PLAN.md`
- Architecture + event catalog in `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- Phase 2 implemented: full combat loop working
- Created `src/data/enemies.js` — 13 enemies across 5 zones (W1)
- Replaced TimeEngine stub with tick scheduler (register, scheduleOnce, etc.)
- Created `src/systems/CombatEngine.js` — damage calc, crit, death, respawn cycle
- Created `src/scenes/GameScene.js` — HP bar, floating damage numbers, hit flash, death anim
- Added WORLD_ZONE_CHANGED emit to Store.setZone()
- BootScene auto-transitions to GameScene after 1s
- `vite build` passes cleanly

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
