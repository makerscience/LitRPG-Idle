# CURRENT_FOCUS

## One-liner
- Stance visual polish + combat UI overhaul session. Trait indicators, shield bar, charge bar, per-stance sprites all done.

## Active Objectives (max 3)
1. **Continued playtesting:** Tune encounter weights/attackSpeedMult/rewardMult based on feel
2. **Area 2-3 content:** Author multi-member encounter templates, fill sprite gaps
3. **Further stance polish:** Flurry stance could get custom walk sprites like fortress did

## Next Actions
- [ ] Playtest traits: verify regen isn't unkillable, enrage feels dangerous, thorns punishes click spam
- [ ] Author multi-member encounter templates for Areas 2-3
- [ ] Consider custom walk sprites for flurry stance
- [ ] Consider tooltip/legend for trait symbols (player education)

## Open Loops / Blockers
- Prestige, territory, cheats disabled via feature gates — re-enable post-playtesting
- Legacy saves archived under `litrpg_idle_legacy_archive` key
- Store.equipped keeps all 33 keys for hydration compat — only 8 are used at runtime
- UpgradeManager.getAutoAttackInterval() is now dead code (ComputedStats owns interval computation)
- All Area 2-3 enemies/bosses have `sprites: null` — need art assets
- GAME_DATA_REFERENCE.md is stale after balance overhaul + AGI addition + multi-enemy — needs update
- Enemy accuracy values are auto-derived from archetypes — may need hand-tuning per enemy
- Areas 2-3 have solo-only encounters (no authored multi-member templates yet)
- V1 combat constants still defined in config.js (dead code, kept for reference)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Stance-specific combat visuals — per-stance walk sprites, power charge bar, trait indicators on nameplates, shield HP bar, hit reaction immunity per stance.
- **Architecture:** Progression.js owns XP/level + kill rewards. Store is pure state. EventScope pattern for subscriptions. ComputedStats for derived values. BossManager looks up named bosses via `getBossForZone()`. LootEngine uses zone-based item pools with slot weighting and pity.
- **Key new sprites:** `fortressstance_001/002` (fortress walk), `powerstance_001charge` (power charge-up) — loaded + downscaled in BootScene
- **Key new files:** `src/ui/FlurryButton.js`, `src/ui/BulwarkButton.js`, `src/ui/StanceSwitcher.js`
- **Key changes this session:** `GameScene.js` (trait indicators as individual colored text objects per slot, shield HP bar, power charge bar, per-stance walk frames, `_playerAttacking`/`_powerCharging` flags for hit reaction immunity, `_unlockWalk` guards), `TimeEngine.js` (new `getProgress()` method), `BulwarkButton.js` (shield mult 2.0→0.1), `SystemLog.js` (removed group spawn messages)
- **Balance tool:** `npm run balance:sim` — zone-by-zone idle progression simulation

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- Architecture: `ARCHITECTURE.md`
- GDD Plan: `Plans/Redesign Plan.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`, `.memory/LESSONS_LEARNED.md`
- Changelog: `CHANGELOG.md`
- Feature gates: `src/config/features.js`
- Save namespace: `litrpg_idle_vslice_save` (schema v1)
- Data validator: `npm run validate:data`
- Balance sim: `npm run balance:sim`
- Thumbnail generator: `npm run thumbs` (requires Pillow: `pip install Pillow`)

---

## Last Session Summary (max ~8 bullets)
- Added trait indicator symbols on enemy nameplates: ✚ regen, ◆ thorns, ⚡ fast, ⊘ armor pen, ☠ DoT, ⬢ defense, ▲ enrage (appears on trigger only)
- Each trait renders as its own colored text object (supports multi-trait enemies with correct per-symbol colors)
- Moved player HP bar above head, halved to 100x8, added 2px black borders on all HP bars
- Added blue shield HP bar below player HP (shows on Bulwark activation, drains in real-time)
- Added red power charge bar (polls TimeEngine.getProgress, visible in power stance only)
- Per-stance visuals: fortress uses fortressstance_001/002 walk sprites, power uses powerstance_001charge at 75% then strongpunch for 1s, strongpunch removed from flurry/fortress rotation
- Hit reaction immunity: power stance blocks reactions during charge + attack hold, fortress blocks all hit reactions
- Bulwark shield HP mult reduced from 2.0 to 0.1, removed group encounter SystemLog messages

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- GDD Plan: `Plans/Redesign Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
