# CURRENT_FOCUS

## One-liner
- Multi-enemy encounter bugs fixed, Area 1 encounters rebalanced. Stances implementation next.

## Active Objectives (max 3)
1. **Stances implementation:** Follow `Plans/Stances_Implementation_Plan.md` (v2)
2. **Enemy traits:** Queued after stances — follow `Plans/Enemy_Traits_Plan.md`
3. **Continued playtesting:** Tune encounter weights/attackSpeedMult/rewardMult based on feel

## Next Actions
- [ ] Begin stances implementation (stance switcher UI, stance data, CombatEngine integration)
- [ ] Tune encounter weights/attackSpeedMult/rewardMult based on playtest feel
- [ ] Author Area 2-3 multi-member encounter templates
- [ ] Dead code cleanup pass (V1 constants, unused loot tables, 33-key equipped object)

## Open Loops / Blockers
- Prestige, territory, cheats disabled via feature gates — re-enable post-playtesting
- Legacy saves archived under `litrpg_idle_legacy_archive` key
- Store.equipped keeps all 33 keys for hydration compat — only 8 are used at runtime
- UpgradeManager.getAutoAttackInterval() is now dead code (ComputedStats owns interval computation)
- All Area 2-3 enemies/bosses have `sprites: null` — need art assets
- GAME_DATA_REFERENCE.md is stale after balance overhaul + AGI addition + multi-enemy — needs update
- Enemy accuracy values are auto-derived from archetypes — may need hand-tuning per enemy
- Areas 2-3 have solo-only encounters (no authored multi-member templates yet)
- Old single-enemy GameScene code fully removed — slot-based rendering is the only path (no fallback)
- V1 combat constants still defined in config.js (dead code, kept for reference)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Fixed encounter cleanup bugs (player death, boss challenge), boss sprites, Area 1 encounter rebalance
- **Architecture:** Progression.js owns XP/level + kill rewards. Store is pure state. EventScope pattern for subscriptions. ComputedStats for derived values. BossManager looks up named bosses via `getBossForZone()`. LootEngine uses zone-based item pools with slot weighting and pity.
- **Multi-enemy plan:** `Plans/Multi_Enemy_Implementation_Plan.md` (v2) — all 14 phases complete
- **Encounter data:** `src/data/encounters.js` — encounter templates + `pickRandomEncounter(areaId, zoneNum)`
- **Stances plan:** `Plans/Stances_Implementation_Plan.md` (v2) — queued after playtesting
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
- Fixed enemy slots persisting after player death (encounter end event wasn't firing → GameScene never cleared slots)
- Fixed enemy slots persisting when challenging a boss mid-encounter (same root cause — `spawnBoss` now calls `_onEncounterEnd('boss_challenge')`)
- Fixed boss sprites not showing: bosses now fall back to `baseEnemyId` for sprite lookup
- Bosses render at 1.4× base enemy sprite size
- Area 1 encounters rebalanced: added Slime Pair (z1-2) and Rat Pair (z1-2), removed Stalker from regular spawns, extended Hound/Boar to zone 5
- 3-rat pack moved from z1-3 to z2-3

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- GDD Plan: `Plans/Redesign Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
