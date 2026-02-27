# CURRENT_FOCUS

## One-liner
- Post-start-screen polish is now centered on combat readability: onboarding popup flow, stance/skill icon clarity, and boss progression pacing are all integrated.

## Active Objectives (max 3)
1. **UI feel tuning:** Validate Flurry icon placement and stance/action readability in expanded gameplay layout.
2. **Progression pacing:** Confirm zone boss-kill thresholds (10..50 capped table) feel right across 15-zone areas.
3. **Regression sweep:** Ensure onboarding, area completion flow, and skill visual priority behave correctly end-to-end.

## Next Actions
- [ ] Playtest full loop: new game -> onboarding popup -> Tempest combat -> Area 2 completion
- [ ] Validate Flurry button position against player sprite after latest left/up move
- [ ] Verify TopBar spacing/readability after removing `MANA` and `FRAGMENTS`
- [ ] Verify tooltip comparisons on enhanced slots across weapon and armor swaps
- [ ] Tune boss threshold table only if real playtest pacing still drags in late zones

## Open Loops / Blockers
- `npm run build` passes; Vite still reports large Phaser chunk warning (>500kB, pre-existing)
- Expanded layout visual QA is still manual (no automated screenshot baseline)
- Prestige, territory, cheats remain feature-gated and not part of this polish pass

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Flurry icon button switched to image-based cooldown fill and moved near left edge/player midpoint
- **Key files (this session):**
  - `src/ui/FlurryButton.js` (icon button + bottom-up cooldown fill + click hitbox behavior)
  - `src/scenes/UIScene.js` (explicit Flurry anchor near left edge)
  - `src/ui/StanceSwitcher.js` + `src/scenes/BootScene.js` (updated Tempest icon style/asset)
  - `src/scenes/GameScene.js` + `src/systems/CombatEngine.js` (skill visual lock + source-aware attack events)
  - `src/ui/OnboardingPopup.js` + `src/data/dialogue.js` + `src/systems/DialogueManager.js` (welcome flow + continue-only dismissal + completion popup)
  - `src/data/areas.js` + `src/systems/BossManager.js` (capped boss kill thresholds + area completion progression)
  - `src/ui/InventoryPanel.js` (enhancement-aware comparison math)
  - `src/ui/TopBar.js` + `src/systems/Store.js` (currency display cleanup + music default volume 0)
- **Verification command:** `npm run build`

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- Architecture: `ARCHITECTURE.md`
- Expanded layout plan: `Plans/expanded-gameplay-layout-reversible-plan.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`, `.memory/LESSONS_LEARNED.md`
- Changelog: `CHANGELOG.md`
- Save namespace: `litrpg_idle_vslice_save_slot{1,2,3}` (schema v3)

---

## Last Session Summary (max ~8 bullets)
- Converted Flurry from text button to icon button with bottom-up cooldown tint fill
- Swapped Tempest/Flurry icon assets and removed aggressive stance icon fill tinting
- Added skill visual lock so Smash/Flurry visuals cannot be interrupted by normal hits
- Limited enemy charge bar visuals to explicit charge-cast attacks
- Changed onboarding popup to continue-only dismissal with button below the panel
- Updated welcome popup copy and added Area 2 completion congratulations popup
- Capped boss kill thresholds with a per-zone table maxing at 50 for 15-zone areas
- Removed `MANA`/`FRAGMENTS` from top bar and made tooltip comparisons enhancement-aware

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- Expanded layout plan: `Plans/expanded-gameplay-layout-reversible-plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`
