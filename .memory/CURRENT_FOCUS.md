# CURRENT_FOCUS

## One-liner
- Area 2 enemy sprite wiring and combat visual polish (hit reaction, attack poses, death animations).

## Active Objectives (max 3)
1. **Area 2 enemy sprites:** Wire remaining Area 2 enemies and tune sprite sizes/offsets/tints
2. **Combat visual polish:** Tune attack/reaction pose timing, walk cycle guards, death animations
3. **Playtest & tune:** Run zones 1-20 and validate SP/enhancement economy, sprite animations, area transitions

## Next Actions
- [ ] Playtest zones 11-20: validate new enemy sprites, death animations, tint levels
- [ ] Wire any remaining Area 2 enemies without sprites (check enemies.js for `sprites: null`)
- [ ] Tune enhancement gold costs from observed gold income pacing
- [ ] Add/retune item drop coverage for zones 31-35 and rerun `npm run validate:data`

## Open Loops / Blockers
- `npm run build` passes with a pre-existing large bundle warning (Phaser chunk >500kB)
- Prestige, territory, and cheats remain behind feature gates during current balancing pass
- Bog Revenant split-death uses `setCrop` — user manually cropped images to fix squish issue

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Wired 5 Area 2 enemy sprites + combat visual fixes (hit reaction tint, attack pose timing, death animations)
- **Key implementation files:**
  - `src/config/playerSprites.js` (ARMOR_SETS definitions, scaleOverrides, yOffsets)
  - `src/config/theme.js` (ZONE_THEMES area 2: playerTint lightened to 0xc4c4c4)
  - `src/scenes/BootScene.js` (sprite loading + downscale entries)
  - `src/scenes/GameScene.js` (walk timer guards, hit reaction tint fix, per-enemy death anims, dying flag, per-enemy spriteTint)
  - `src/data/enemies.js` (sprite configs, spriteTint, nameplateOffsetY for all wired enemies)
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
- Fixed hit reaction tint being overridden by stance tint at t=120ms (guarded with `_hitReacting` flag)
- Fixed attack visuals disappearing: added `_playerAttacking` guard to walk callback + reset `_walkTimer.elapsed` on unpause
- Halved attack pose durations (power: 500ms, normal/flurry: 300ms) and hit reaction (350ms)
- Wired 5 Area 2 enemies: Blightcap Fungi, Goblin Warrior, Insect Swarm, Vine Crawler, Bog Revenant
- Added per-enemy `spriteTint` system (blended with area + effect tints)
- Added `dying` flag to prevent `_onEncounterEnded` from killing death animation tweens
- Custom death animations: Insect Swarm (expand+fade dispersal), Vine Crawler (collapse downward), Bog Revenant (split upper/lower halves)
- Lightened area 2 player tint from 0x888888 to 0xc4c4c4

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- Redesign plan: `Plans/Redesign Plan.md`
- Enemy roster plan: `Plans/Enemy_Roster_Redesign_Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
