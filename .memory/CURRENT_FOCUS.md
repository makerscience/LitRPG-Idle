# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. All 8 phases + sprite/HP system implemented — MVP feature-complete
2. Ground layer + background002 parallax overhaul done
3. Next: more enemy sprites, playtesting, or Itch.io packaging

## Next Actions
- [ ] Add sprites for other Zone 1 enemies (Green Slime) if art available
- [ ] Manual playtest: verify balance with enemy attacks (player shouldn't die too easily in Zone 1)
- [ ] Consider Itch.io packaging / offline progress (deferred scope)
- [ ] Add background images for other zones (currently only Zone 1 has image-based parallax)

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
- Added ground section (bottom 25%) using ground001 texture, replacing solid color rect
- Switched parallax images from background001 to background002 set
- Front parallax layer overlaps ground at 88% height, depth -0.25 (above ground)
- Rear/mid parallax layers compressed to 83% height, sitting above ground
- Ground and front layer scroll together at same speed (0.45 px/frame)
- Ground uses dual-image seamless wrapping like parallax layers

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
