# CURRENT_FOCUS

## One-liner
- Enemy Roster Redesign plan is implemented through Phase 7 (guardrails, roster, encounters, bosses, mechanics, stance UI, verification); next step is manual balance/playtest validation and follow-up tuning.

## Active Objectives (max 3)
1. **Phase 7 manual gate:** Playtest zones 1-10 and run mechanic spot checks (miss, armor break, summon/interrupt, corruption/cleanse), plus boundary checks 10->11 and 20->21
2. **Post-implementation tuning:** Adjust evasion/armor/corruption/summon numbers and ABILITIES cooldowns from playtest data
3. **Data completeness cleanup:** Remove the validator warning by adding droppable item coverage for zones 31-35

## Next Actions
- [ ] Run focused Area 1 playthrough (zones 1-10) and note TTK/survival spikes by zone
- [ ] Run mechanic checklist in live combat and confirm feedback readability (`MISS!`, casting, interrupted, corruption stack UI)
- [ ] Tune `COMBAT_V2.corruption` and `ABILITIES` constants from observed pacing
- [ ] Add/retune item drop coverage for zones 31-35 and rerun `npm run validate:data`
- [ ] Capture any manual-test regressions as targeted checks in `scripts/verify-combat-mechanics.js`

## Open Loops / Blockers
- `npm run validate:data` passes with one warning: zones 31-35 have no droppable items
- `npm run build` passes with a pre-existing large bundle warning (Phaser chunk >500kB)
- Prestige, territory, and cheats remain behind feature gates during current balancing pass
- Enemy/boss sprite coverage for some late content is still incomplete

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Completed Enemy Roster Redesign plan through Phase 7 with automated verification harness.
- **Key implementation files:**
  - `src/data/areas.js`, `src/data/enemies.js`, `src/data/encounters.js`, `src/data/bosses.js`
  - `scripts/validate-data.js` (new schema + encounter validations)
  - `src/systems/CombatEngine.js` (evasion, armor break, summon/interrupt, corruption)
  - `src/events.js` (new events + contracts)
  - `src/scenes/GameScene.js` (runtime member-add + combat feedback hooks)
  - `src/scenes/UIScene.js` + `src/ui/ArmorBreakButton.js` + `src/ui/InterruptButton.js` + `src/ui/CleanseButton.js` + `src/ui/CorruptionIndicator.js`
  - `scripts/verify-combat-mechanics.js` + `package.json` (`verify:combat`)
- **Verification commands:** `npm run verify:combat`, `npm run build`, `npm run validate:data`

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- Architecture: `ARCHITECTURE.md`
- GDD plan: `Plans/Redesign Plan.md`
- Enemy roster plan: `Plans/Enemy_Roster_Redesign_Plan.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`, `.memory/LESSONS_LEARNED.md`
- Changelog: `CHANGELOG.md`
- Feature gates: `src/config/features.js`
- Save namespace: `litrpg_idle_vslice_save` (schema v1)

---

## Last Session Summary (max ~8 bullets)
- Shifted world structure to 35 global zones and updated area starts/boundaries to 1/11/21
- Expanded enemy schema with `evasion`, `armor`, `corruption`, and `summon` fields plus validator checks
- Re-authored enemy roster/zone coverage and encounter templates for the redesigned progression
- Updated boss roster to one boss per zone (35 total) including Area 1 zones 6-10 additions
- Implemented mechanics: player miss handling, armor break/restore lifecycle, summon/interrupt flow, corruption stacks + decay + cleanse
- Added runtime encounter member-add events and GameScene handling for mid-encounter summons
- Refactored stance action UI ownership into UIScene with two action slots and three new stance utility buttons
- Added Phase 7 verification harness (`npm run verify:combat`) and validated with build + data checks

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- Redesign plan: `Plans/Redesign Plan.md`
- Enemy roster plan: `Plans/Enemy_Roster_Redesign_Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
