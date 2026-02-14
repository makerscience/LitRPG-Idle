# CURRENT_FOCUS

## One-liner
- Balance overhaul complete: asymmetric zone scaling, enemy/boss stat calibration, gear jumps widened, upgrade costs raised. All 30 bosses pass, final boss 1.27x survival.

## Active Objectives (max 3)
1. **Balance Overhaul:** COMPLETE — asymmetric scaling, area-entry walls, gear check moments
2. **Next:** Playtest in-browser to validate feel with new balance, then publish to Itch.io
3. **Future:** Phase 8+ — town/territory re-enablement, prestige loop, art assets

## Next Actions
- [ ] Playtest in-browser: verify area transitions feel like real walls (z6, z16 should feel noticeably harder)
- [ ] Playtest Area 1: THE HOLLOW should be a tight fight (~1.02x survival) at level 8
- [ ] Playtest armored enemies: Stone Sentry/Blighted Guardian/Hearthguard Construct should slow kills noticeably
- [ ] Verify gear upgrades feel impactful — cross-tier drops should produce visible DPS jumps
- [ ] Update GAME_DATA_REFERENCE.md with new balance numbers (enemy stats, gear stats, scaling rates)
- [ ] Polish: add sprites for Area 2-3 enemies/bosses (currently null — uses placeholder)

## Open Loops / Blockers
- Prestige, territory, cheats disabled via feature gates — re-enable post-playtesting
- Legacy saves archived under `litrpg_idle_legacy_archive` key
- Store.equipped keeps all 33 keys for hydration compat — only 7 are used at runtime
- territories.js references old V1 enemy IDs (disabled, not a runtime issue)
- UpgradeManager.getAutoAttackInterval() is now dead code (ComputedStats owns interval computation)
- `getBossType`, `getStrongestEnemy`, `getBossDropMultiplier` in areas.js are now dead code
- All Area 2-3 enemies/bosses have `sprites: null` — need art assets
- Balance sim assumes optimal upgrade purchasing — real players will be weaker (more safety margin)
- GAME_DATA_REFERENCE.md is stale after balance overhaul — needs update

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Balance overhaul — asymmetric scaling, enemy calibration, gear widening
- **Architecture:** Progression.js owns XP/level + kill rewards. Store is pure state. EventScope pattern for subscriptions. ComputedStats for derived values. BossManager looks up named bosses via `getBossForZone()`. LootEngine uses zone-based item pools with slot weighting and pity.
- **Plan:** `Plans/Redesign Plan.md` — 8-phase implementation, Phase 7 complete
- **Balance tool:** `npm run balance:sim` — zone-by-zone idle progression simulation
- **Balance guide:** `Plans/LitRPG_Idle_Game_Feel_Balance_Guide.md` — analysis + critique

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
- Implemented asymmetric zone scaling: HP +10%/zone, ATK +12%, Gold +18%, XP +8% (was uniform 15%)
- Updated CombatEngine, OfflineProgress, and balance-sim to use per-stat scaling
- Added DEF to armored enemies: Stone Sentry (10), Blighted Guardian (15), Hearthguard Construct (20), plus 5 bosses
- Calibrated A2/A3 enemy base stats: ~30% HP increase, ~65-75% ATK increase for area-entry walls
- Calibrated A2/A3 boss stats proportionally; final boss tightened from 2.2x to 1.27x survival
- Increased upgrade base costs by 1.5x for early-game tension
- Widened cross-tier gear jumps by 30-40% for satisfying breakthrough moments
- All 30 bosses still pass, data validation clean

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- GDD Plan: `Plans/Redesign Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
