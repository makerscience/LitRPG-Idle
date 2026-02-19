# CURRENT_FOCUS

## One-liner
- Enemy traits Phases 1-6 mostly complete. Visuals done (regen/enrage/thorns + player damage numbers). SystemLog messages still TODO.

## Active Objectives (max 3)
1. **Enemy traits polish:** SystemLog messages for regen/enrage/thorns + trait indicators on nameplates
2. **Continued playtesting:** Tune encounter weights/attackSpeedMult/rewardMult based on feel
3. **Area 2-3 content:** Author multi-member encounter templates, fill sprite gaps

## Next Actions
- [ ] Enemy traits: SystemLog messages for regen/enrage/thorns events
- [ ] Enemy traits: trait indicators on enemy nameplates (icons or text tags)
- [ ] Playtest traits: verify regen isn't unkillable, enrage feels dangerous, thorns punishes click spam
- [ ] Author multi-member encounter templates for Areas 2-3

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
- Stances fully complete (Phases 1-5) — plan can be archived

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Fixed Rapid Strikes spawn freeze (TimeEngine one-shot splice bug + missing cancelRapidStrikes on encounter end).
- **Architecture:** Progression.js owns XP/level + kill rewards. Store is pure state. EventScope pattern for subscriptions. ComputedStats for derived values. BossManager looks up named bosses via `getBossForZone()`. LootEngine uses zone-based item pools with slot weighting and pity.
- **Enemy traits plan:** `Plans/Enemy_Traits_Plan.md` — Regen, Enrage, Thorns (6 phases)
- **Key new files:** `src/ui/FlurryButton.js`, `src/ui/BulwarkButton.js`, `src/ui/StanceSwitcher.js`
- **Key changes:** `src/scenes/UIScene.js` (StanceSwitcher create/show/hide/destroy), `src/scenes/GameScene.js` (stance tint on STANCE_CHANGED + respawn, walk-lock balance fix in _onEnemyDamaged)
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
- Fixed Rapid Strikes spawn freeze: one-shot timer splice in TimeEngine used stale index after callback-induced array mutations, causing the same timer to re-fire multiple times (cascading kills in multi-member encounters)
- TimeEngine fix: `tickers.indexOf(t)` finds timer by object reference instead of trusting stale index `i` — correct regardless of callback splices
- CombatEngine fix: `cancelRapidStrikes()` added to `_onEncounterEnd` — ability timers no longer outlive their encounter
- Added lessons 43-44 to LESSONS_LEARNED.md

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- GDD Plan: `Plans/Redesign Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
