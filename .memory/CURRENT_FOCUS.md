# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. All 8 phases + sprite/HP system implemented — MVP feature-complete
2. SYSTEM dialogue window with emotion-based styling implemented
3. Next: more enemy sprites, playtesting, or Itch.io packaging

## Next Actions
- [ ] Playtest full parallax stack: trees, ferns, bare ground, foreground002 — verify depth ordering
- [ ] Verify zone switching (1→2→1 cycles): all layers destroyed and recreated cleanly
- [ ] Consider adding trees/ferns config for other zones (currently only Zone 1 has sprite parallax)
- [ ] Add sprites for other Zone 1 enemies (Green Slime) if art available
- [ ] Add background images for other zones (currently only Zone 1 has image-based parallax)
- [ ] Tune treeDiagRatio / fernDiagRatio for best visual feel

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
- Replaced strip system with individual tree sprites scrolling diagonally (upper-right → lower-left)
- Trees use normal PNG transparency — ADD/MULTIPLY/SCREEN blend modes all produced ghost artifacts
- Added 3 fern depth rows for undergrowth + bare ground overlay (foreground001_bare) between foreground and ferns
- Tree containers separated from `_parallaxLayers` to avoid main loop interference — scrolled via `_treeLayers` only
- Bare ground layer at depth -0.48, scrolls at ground speed, top edge at mid fern Y=445
- Mid fern row depth adjusted to -0.14 (in front of near tree row at -0.15)
- Config: TREE_ROWS has per-row `keys`, FERN_ROWS for undergrowth, `treeDiagRatio`/`fernDiagRatio` in PARALLAX
- 8 new image assets committed: 4 trees, 2 ferns, foreground002, foreground001_bare

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
