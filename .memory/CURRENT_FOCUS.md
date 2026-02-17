# CURRENT_FOCUS

## One-liner
- Power Smash active ability implemented: 3x damage burst, 60s cooldown, unlocks at level 3, two upgrade tracks, enhanced visuals. Ready for playtesting.

## Active Objectives (max 3)
1. **Playtesting:** Validate Power Smash + waterskin flow in-browser, then publish to Itch.io
2. **Polish:** Add sprites for Area 2-3 enemies/bosses (currently null — uses placeholder)
3. **Future:** Phase 8+ — town/territory re-enablement, prestige loop, art assets

## Next Actions
- [ ] Playtest Power Smash: reach level 3 → SMASH button appears → click → orange damage, screen shake, 60s cooldown
- [ ] Playtest upgrade purchases: buy Power Smash Damage/Recharge upgrades → verify multiplier/cooldown changes
- [ ] Playtest both abilities: SMASH + DRINK buttons side by side, both visible and functional
- [ ] Playtest in-browser: verify area transitions feel like real walls (z6, z16 should feel noticeably harder)
- [ ] Polish: add sprites for Area 2-3 enemies/bosses (currently null — uses placeholder)

## Open Loops / Blockers
- Prestige, territory, cheats disabled via feature gates — re-enable post-playtesting
- Legacy saves archived under `litrpg_idle_legacy_archive` key
- Store.equipped keeps all 33 keys for hydration compat — only 8 are used at runtime (was 7, +waterskin)
- territories.js references old V1 enemy IDs (disabled, not a runtime issue)
- UpgradeManager.getAutoAttackInterval() is now dead code (ComputedStats owns interval computation)
- All Area 2-3 enemies/bosses have `sprites: null` — need art assets
- GAME_DATA_REFERENCE.md is stale after balance overhaul — needs update

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Power Smash active ability — 3x damage burst, 60s cooldown, level 3 unlock, 2 upgrade tracks, enhanced visuals
- **Architecture:** Progression.js owns XP/level + kill rewards. Store is pure state. EventScope pattern for subscriptions. ComputedStats for derived values. BossManager looks up named bosses via `getBossForZone()`. LootEngine uses zone-based item pools with slot weighting and pity. Bosses can have `guaranteedFirstKillItem` for bonus drops.
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
- Implemented Power Smash active ability: 3x base click damage, 60s cooldown, unlocks at level 3
- Created SmashButton.js following DrinkButton pattern (dark orange-brown, to the right of DRINK)
- Added `powerSmashAttack()` to CombatEngine — uses `getPlayerDamage(state, true)` × smashMultiplier
- Added `POWER_SMASH_USED` event + contract in events.js
- Added 2 upgrades in upgrades.js: power_smash_damage (8 levels) + power_smash_recharge (5 levels)
- Modified GameScene: forced strong punch sprite, bigger lunge (40px), screen shake (150ms), orange SMASH! damage numbers with glow
- Wired SmashButton into UIScene (import, create, show/hide/destroy)
- Added SystemLog messages: "Power Smash!" on use, "Power Smash unlocked!" at level 3

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- GDD Plan: `Plans/Redesign Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
