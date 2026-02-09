# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. All 8 phases + sprite/HP system implemented — MVP feature-complete
2. SYSTEM dialogue window with emotion-based styling implemented
3. Next: more enemy sprites, playtesting, or Itch.io packaging

## Next Actions
- [ ] Verify zone switching (1→2→1 cycles): all layers destroyed and recreated cleanly
- [ ] Consider adding trees/ferns config for other zones (currently only Zone 1 has sprite parallax)
- [ ] Add sprites for other Zone 1 enemies (Green Slime) if art available
- [ ] Add background images for other zones (currently only Zone 1 has image-based parallax)
- [ ] Playtest perspective growth effect — verify no jarring size pops on wrap

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
- Added perspective growth (`growRange`) to all tree and fern rows — sprites scale up as they travel right → left
- Trees grow [0.9, 1.3], ferns grow [0.9, 1.1] — creates depth illusion as sprites approach camera
- Per-row `diagMult: 0.65` controls downward drift independently from global `treeDiagRatio`
- Tree spawn Y ranges tightened 50% (start closer to end position) for subtler vertical travel
- Added bare ground overlay (foreground001_bare) at depth -0.48 between foreground and ferns/trees
- Mid background layer shifted down 30px (midLayerBottomTargetY 330 → 360)
- Mid fern row opacity increased from 0.7 → 0.85
- Near tree row growRange end bumped to 1.3, then applied to all rows

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
