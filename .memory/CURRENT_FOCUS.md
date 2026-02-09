# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. All 8 phases + sprite/HP system implemented — MVP feature-complete
2. SYSTEM dialogue window with emotion-based styling implemented
3. Next: more enemy sprites, playtesting, or Itch.io packaging

## Next Actions
- [ ] Playtest tree scrolling: verify 3 depth rows visible, no clumping, correct blend modes
- [ ] Verify tree003 (white bg) renders without visible white rectangle (MULTIPLY blend)
- [ ] Verify zone switching (1→2→1 cycles): trees destroyed and recreated cleanly
- [ ] Consider adding trees config for other zones (currently only Zone 1 has tree-based parallax)
- [ ] Add sprites for other Zone 1 enemies (Green Slime) if art available
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
- Replaced front layer strip system (10 strips × 4 images = 40 objects) with scrolling tree sprites (13 objects)
- 4 tree textures loaded in BootScene: fg_tree001–004
- TREE_ROWS config: 3 depth rows (far=6 trees, mid=4, near=3) with per-row speed, scale, Y range, alpha
- Per-key blend modes: ADD for dark-bg trees (001/002/004), MULTIPLY for white-bg tree003
- Trees wrap from left edge to right edge with random Y repositioning each cycle
- Geometry mask clips each tree row container to game area
- Removed PARALLAX strip config (strips, perspectivePow, yDriftFactor, frontDiagPx)
- Rear (static) and mid (horizontal scroll) background layers unchanged

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
