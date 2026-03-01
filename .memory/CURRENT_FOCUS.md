# CURRENT_FOCUS

## One-liner
- Current work is focused on polishing the Area 1 Zone 1-5 demo slice: Slimefang encounter readability, end-of-demo flow, and skill economy tuning.

## Active Objectives (max 3)
1. **Demo endpoint quality:** End the current build cleanly after Slimefang (Area 1 Zone 5) with a dedicated end screen and no accidental progression into later zones.
2. **Boss readability:** Keep Slimefang's encounter telegraphs readable (enrage warnings, countdown timer, death sequence clarity).
3. **Early progression feel:** Tune early skill economy and Fortress skill upgrades for first-demo pacing (respec access/cost, Bulwark t1/t3 behavior).

## Next Actions
- [ ] Full playtest from fresh save through Slimefang kill and demo-complete overlay transition
- [ ] Verify Slimefang timed enrage behavior in live run (50% trigger -> 15s countdown -> expire -> optional 10% retrigger)
- [ ] Verify demoCompleted persistence across save/load and menu return
- [ ] Confirm Area 1 Zone 6+ remains inaccessible during demo lock

## Open Loops / Blockers
- `npm run build` passes; Vite Phaser chunk warning remains pre-existing
- UI QA remains manual (no screenshot diff baseline)
- Demo end screen currently hard-pauses combat/UI; if future builds restore Zones 6-10, this gate must be feature-flagged or removed cleanly

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last changes:**
  - Slimefang got timed enrage support and enrage UI countdown plumbing
  - Added global enrage alerts; Slimefang uses larger `ENRAGED!` + `DEFEND YOURSELF!` warning
  - Slimefang death animation changed to a detached 10s escalating shake/fade sequence
  - Demo endpoint added: defeating Slimefang sets `flags.demoCompleted`, stops enemy spawns, and shows a full-screen demo-complete overlay
  - Demo completion now waits for Slimefang's 10s death animation before end-screen handoff
  - Respec unlock moved to level 5 but gated behind `enhanceTutorialCompleted`; respec gold base cost lowered to 300
  - Bulwark upgrades retuned: t1 absorb 20% max HP, t3 now reduces cooldown to 20s (duration bonus removed)
  - Skills panel now defaults to ACTIVE tab on open
- **Key files (latest session):**
  - `src/systems/BossManager.js`
  - `src/systems/CombatEngine.js`
  - `src/scenes/GameScene.js`
  - `src/scenes/UIScene.js`
  - `src/systems/UpgradeManager.js`
  - `src/ui/BulwarkButton.js`
  - `src/ui/UpgradePanel.js`
  - `src/data/bosses.js`
  - `src/data/upgrades.js`
  - `src/events.js`
  - `src/systems/Store.js`
- **Verification command:** `npm run build`

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- Save namespace: `litrpg_idle_vslice_save_slot{1,2,3}` (schema v3)
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`, `.memory/LESSONS_LEARNED.md`
