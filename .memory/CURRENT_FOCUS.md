# CURRENT_FOCUS

## One-liner
- Area 2 fog layers heavily tuned (3 fog layers with doubled counts, repositioned, opacity/scale adjustments); Area 1 sky compressed to top 1/3; player tint lightened.

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
- **Last change:** Area 2 fog tuning (doubled counts, repositioned, opacity 0.7), Area 1 sky compressed, player tint lightened
- **Key implementation files:**
  - `src/config/theme.js` (ZONE_THEMES area 2: sky, ground, path, treeRowOverrides with 9 layers, playerTint/enemyTint)
  - `src/scenes/BootScene.js` (sprite loading + downscale entries for area2 backgrounds + enemies)
  - `src/scenes/GameScene.js` (sky scroll, flat scroll, depthSort, groundKey, pathContainer, area tint blending)
  - `src/data/enemies.js` (goblin scout, bog zombie, thornback boar sprites + offsets)
- **Area 2 theme config:** `treeRowOverrides` array with 12 entries (3 tree rows, 3 fog layers split into 6 rows for per-key scaling, 2 clutter rows)
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
- Compressed Area 1 sky background to top 1/3 of screen (`skyHeightScale: 0.333`)
- Area 2 front fog: doubled to 32 sprites, moved down 20px, opacity 0.7, speed +20%, split fog001/fog002+fog003 rows for independent sizing
- Area 2 middle fog: doubled to 24 sprites, tightened scale to [0.12, 0.14], opacity 0.7, split into fog001/fog002+fog003 rows
- Area 2 rear fog: doubled to 40 sprites, moved down 10px
- Area 2 front trees: scale increased 10%
- Lightened Area 2 player tint from 0x666666 to 0x888888
- Restored Area 2 sky to original `skyHeightScale: 0.5775` (was accidentally changed to 0.333 with Area 1)

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- Redesign plan: `Plans/Redesign Plan.md`
- Enemy roster plan: `Plans/Enemy_Roster_Redesign_Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
