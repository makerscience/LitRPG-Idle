# CURRENT_FOCUS

## One-liner
- Road Bandit sprites wired; armor crack overlay on armor break; image assets reorganized; hit reaction cooldown added. Next: playtesting and tuning.

## Active Objectives (max 3)
1. **Playtest & tune:** Run zones 1-10 and validate new SP/enhancement economy, split-on-death flow, and sprite animations in live combat
2. **Post-implementation tuning:** Adjust evasion/armor/corruption/summon numbers and ABILITIES cooldowns from playtest data
3. **Data completeness cleanup:** Add droppable item coverage for zones 31-35

## Next Actions
- [ ] Playtest zones 1-10: validate SP gain, skill purchase UX, enhancement flow, armor crack overlay
- [ ] Verify Greater Slime split-on-death visually (dead fade → child split → Hollow Slime spawn)
- [ ] Verify Razorwing flapping animation and sprite offset in combat
- [ ] Tune enhancement gold costs from observed gold income pacing
- [ ] Wire remaining Area 2-3 enemy sprites as art becomes available
- [ ] Add/retune item drop coverage for zones 31-35 and rerun `npm run validate:data`

## Open Loops / Blockers
- `npm run validate:data` passes with one warning: zones 31-35 have no droppable items
- `npm run build` passes with a pre-existing large bundle warning (Phaser chunk >500kB)
- Prestige, territory, and cheats remain behind feature gates during current balancing pass
- Enemy/boss sprite coverage for Area 2-3 content is still incomplete

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Road Bandit sprites wired; armor crack overlay on armor break; image folder reorganization; hit reaction cooldown.
- **Key implementation files:**
  - `src/scenes/BootScene.js` (sprite loading + downscale entries)
  - `src/scenes/GameScene.js` (armor crack overlay, hit reaction cooldown, spriteSpreadBonus sync)
  - `src/data/enemies.js` (sprites, spriteSize, spriteSpreadBonus per enemy)
  - `src/systems/CombatEngine.js` (armorBreakTarget, ARMOR_BROKEN/RESTORED events)
  - `src/ui/ArmorBreakButton.js` (armor break skill button)
- **Verification commands:** `npm run verify:combat`, `npm run build`, `npm run validate:data`

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
- Wired Road Bandit 4-pose sprites (256x256, offsetY -50, spriteSpreadBonus 50)
- Added `spriteSpreadBonus` per-enemy field for wider spacing in multi-enemy encounters
- Added 1s cooldown on enemy hit reaction pose to prevent flickering during fast attacks
- Reorganized image assets: backgrounds/ferns/ground → `Images/Backgrounds/area1/`, player sprites → `Images/Player Images/armor001/`
- Added cracked armor visual overlay on armor break (0.6 alpha, 50% sprite size, syncs position with sprite each frame)
- Overlay triggers on `COMBAT_ARMOR_BROKEN`, fades out on `COMBAT_ARMOR_RESTORED`, removed on death
- `npm run build` passes

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- Redesign plan: `Plans/Redesign Plan.md`
- Enemy roster plan: `Plans/Enemy_Roster_Redesign_Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
