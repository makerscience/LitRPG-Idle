# CURRENT_FOCUS

## One-liner
- Waterskin system polished: boss-only drop, thumbnail art, instant heal, DRINK button bottom-left. Combat sprite drift fixed. Ready for playtesting.

## Active Objectives (max 3)
1. **Playtesting:** Validate waterskin flow + balance feel in-browser, then publish to Itch.io
2. **Polish:** Add sprites for Area 2-3 enemies/bosses (currently null — uses placeholder)
3. **Future:** Phase 8+ — town/territory re-enablement, prestige loop, art assets

## Next Actions
- [ ] Playtest waterskin flow: kill Rotfang → waterskin drops → equip → DRINK button appears → heals 20% max HP → 30s cooldown
- [ ] Playtest in-browser: verify area transitions feel like real walls (z6, z16 should feel noticeably harder)
- [ ] Verify gear upgrades feel impactful — cross-tier drops should produce visible DPS jumps
- [ ] Update GAME_DATA_REFERENCE.md with new balance numbers (enemy stats, gear stats, scaling rates)
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
- **Last change:** Waterskin polish — boss-only drop, thumbnail, instant heal, sprite drift fix
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
- Moved DRINK button to bottom-left of game area (was centered)
- Waterskin heal now updates HP bar instantly (Store.healPlayer emits COMBAT_PLAYER_DAMAGED with amount:0)
- Fixed enemy sprite drift: tweens killed + position reset before new lunge/knockback animations
- Waterskin thumbnail wired up: `waterskin001.png` → `npm run thumbs` → BootScene load → item data
- Waterskin removed from normal loot pool — boss-only guaranteed first-kill drop (removed from slotWeights, EQUIP_TO_ITEM_SLOT, lootPity)
- Fixed double attack animation caused by healPlayer reusing COMBAT_PLAYER_DAMAGED (early return on amount ≤ 0)

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- GDD Plan: `Plans/Redesign Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
