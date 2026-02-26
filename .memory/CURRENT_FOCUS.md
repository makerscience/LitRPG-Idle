# CURRENT_FOCUS

## One-liner
- Area 2 parallax backgrounds fully wired (sky, ground, 3 tree layers, 2 fog layers, clutter, path); Goblin Scout, Bog Zombie, Thornback Boar sprites wired; area-based player/enemy tinting added.

## Active Objectives (max 3)
1. **Area 2 visual polish:** Continue wiring remaining Area 2 enemy sprites (fungi, goblin warrior, blighted stalker area2 variants) and tune parallax layers
2. **Playtest & tune:** Run zones 1-20 and validate SP/enhancement economy, sprite animations, area transitions
3. **Data completeness cleanup:** Add droppable item coverage for zones 31-35

## Next Actions
- [ ] Wire remaining Area 2 enemy sprites (a2_fungi, a2_goblin_warrior, a2_blighted_stalker with area2 art)
- [ ] Playtest zones 1-15: validate parallax tuning, area transitions, depth sorting
- [ ] Tune enhancement gold costs from observed gold income pacing
- [ ] Add/retune item drop coverage for zones 31-35 and rerun `npm run validate:data`

## Open Loops / Blockers
- `npm run validate:data` passes with one warning: zones 31-35 have no droppable items
- `npm run build` passes with a pre-existing large bundle warning (Phaser chunk >500kB)
- Prestige, territory, and cheats remain behind feature gates during current balancing pass
- Enemy/boss sprite coverage for Area 2-3 content is still incomplete (fungi, goblin warrior, stalker area2)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Area 2 full parallax system + 3 enemy sprites wired + area tinting
- **Key implementation files:**
  - `src/config/theme.js` (ZONE_THEMES area 2: sky, ground, path, treeRowOverrides with 9 layers, playerTint/enemyTint)
  - `src/scenes/BootScene.js` (sprite loading + downscale entries for area2 backgrounds + enemies)
  - `src/scenes/GameScene.js` (sky scroll, flat scroll, depthSort, groundKey, pathContainer, area tint blending)
  - `src/data/enemies.js` (goblin scout, bog zombie, thornback boar sprites + offsets)
- **Area 2 theme config:** `treeRowOverrides` array with 9 entries (3 tree rows, 2 fog rows, 2 clutter rows, 1 extra fog)
- **Verification commands:** `npm run build`, `npm run validate:data`

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- Architecture: `ARCHITECTURE.md`
- GDD plan: `Plans/Redesign Plan.md`
- Enemy roster plan: `Plans/Enemy_Roster_Redesign_Plan.md`
- Skill/enhancement plan: `Plans/Skill_Points_and_Enhancement_Plan.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`, `.memory/LESSONS_LEARNED.md`
- Changelog: `CHANGELOG.md`
- Feature gates: `src/config/features.js`
- Save namespace: `litrpg_idle_vslice_save` (schema v2)

---

## Last Session Summary (max ~8 bullets)
- Tuned Area 1 parallax: removed tree transparency (all rows alpha 1.0), disabled diagonal drift (diagRatio → 0), removed growRange from all tree/fern rows
- Repositioned tree rows: rear tightened to Y 350–365, mid to Y 400–415, front moved down 80px total to Y 519–555 and scaled up 15%
- Moved rear fern row down 10px (375→385), mid layer background down 10px (380→390)
- Enabled depthSort on all 3 tree rows and all 4 fern rows for Area 1
- Sub-pixel accumulator attempted and reverted — shimmer preferred over stutter at low speeds
- Added critical rule to CLAUDE.md/LESSONS_LEARNED: never use destructive git commands to roll back

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- Redesign plan: `Plans/Redesign Plan.md`
- Enemy roster plan: `Plans/Enemy_Roster_Redesign_Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
