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
- Fixed fern clumping: spacing-aware respawn + initial spawn enforce min step between ferns
- All tree rows unified to growRange [0.8, 1.5] — continuous scaling from off-screen spawn to despawn
- Tree growth no longer plateaus at screen edge — scales through full travel range including off-screen
- 4th dense fern row added between mid/near trees (depth -0.25, tight xSpacingMult 0.3)
- Near tree row diagMult raised to 1.2; far tree speedMult raised to 0.48
- Mid bg scroll slowed to 0.4× front speed and shifted down to Y=380
- Front fern row repositioned (yMin 540, yMax 560); back fern row raised to 375 and sped up 20%
- Tree spawn extended to 1.5× screen width with tighter wrap padding to eliminate gaps

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
