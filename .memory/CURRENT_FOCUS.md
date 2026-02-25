# CURRENT_FOCUS

## One-liner
- Skill points + equipment enhancement system shipped; enemy sprites wired (Beetle, Greater Slime, Razorwing) with split-on-death and flap animations; next is playtesting and tuning.

## Active Objectives (max 3)
1. **Playtest & tune:** Run zones 1-10 and validate new SP/enhancement economy, split-on-death flow, and sprite animations in live combat
2. **Post-implementation tuning:** Adjust evasion/armor/corruption/summon numbers and ABILITIES cooldowns from playtest data
3. **Data completeness cleanup:** Add droppable item coverage for zones 31-35

## Next Actions
- [ ] Playtest zones 1-10: validate SP gain per level, skill purchase UX, enhancement purchase flow
- [ ] Verify Greater Slime split-on-death visually (dead fade → child split → Hollow Slime spawn)
- [ ] Verify Razorwing flapping animation and sprite offset in combat
- [ ] Tune enhancement gold costs from observed gold income pacing
- [ ] Add/retune item drop coverage for zones 31-35 and rerun `npm run validate:data`

## Open Loops / Blockers
- `npm run validate:data` passes with one warning: zones 31-35 have no droppable items
- `npm run build` passes with a pre-existing large bundle warning (Phaser chunk >500kB)
- Prestige, territory, and cheats remain behind feature gates during current balancing pass
- Enemy/boss sprite coverage for Area 2-3 content is still incomplete

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Skill points replace gold upgrades; equipment enhancement is new gold sink; 3 enemy sprites wired with custom animations.
- **Key implementation files:**
  - `src/systems/Store.js` (skillPoints state, enhancementLevels, resetSkillPoints)
  - `src/systems/EnhancementManager.js` (per-slot enhancement logic, costs, bonuses)
  - `src/systems/UpgradeManager.js` (SP currency handling)
  - `src/systems/SaveManager.js` (v2 migration)
  - `src/systems/CombatEngine.js` (splitOnDeath, pendingSplits counter)
  - `src/scenes/GameScene.js` (split animation, flap timer, attackSpriteOffsetY)
  - `src/data/enemies.js` (sprites, splitOnDeath, default2, attackSpriteOffsetY, nameplateOffsetY)
  - `src/ui/UpgradePanel.js` (Skills panel with SP display)
  - `src/ui/InventoryPanel.js` (enhancement badges + enhance button)
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
- Replaced gold-cost upgrades with skill points (1 SP per level, 35 total, flat 1 SP per upgrade level)
- Added per-slot equipment enhancement system (gold sink, +5%/level, max +10, 7 enhanceable slots)
- Save schema bumped to v2 with migration; prestige resets SP but keeps enhancement levels
- Wired Armored Beetle sprites (`a2_giant_beetle`)
- Wired Greater Slime sprites + split-on-death mechanic (1s delay, dead-fade → child-split animation, `pendingSplits` prevents premature encounter end)
- Wired Razorwing sprites with flapping animation (`default`/`default2` oscillation at 300ms)
- Added `attackSpriteOffsetY` for per-pose Y offset and `nameplateOffsetY` for Razorwing
- `npm run build` passes

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- Redesign plan: `Plans/Redesign Plan.md`
- Enemy roster plan: `Plans/Enemy_Roster_Redesign_Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
