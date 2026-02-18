# CURRENT_FOCUS

## One-liner
- Agility stat + dodge mechanic implemented with contested accuracy formula. 9 items converted to AGI-focused. Needs playtesting.

## Active Objectives (max 3)
1. **Playtesting:** Validate AGI/dodge feels good — DEF and AGI builds should both be viable in each area
2. **Balance tuning:** Run `npm run balance:sim` with dual-policy (DEF vs AGI) and adjust constants if needed
3. **Polish:** Add sprites for Area 2-3 enemies/bosses (currently null — uses placeholder)

## Next Actions
- [ ] Playtest AGI build: equip AGI gear → verify dodge % increases in stats panel, "DODGE!" text appears in combat
- [ ] Playtest DEF vs AGI: compare survival in Area 1-2 with tank gear vs evasion gear — both should be viable
- [ ] Verify DoT bypasses dodge (fight a DoT enemy with high AGI — DoT should still land)
- [ ] Run `npm run validate:data` — ensure all items have agi key, all enemies/bosses have accuracy
- [ ] Run `npm run balance:sim` — verify AGI/dodge columns appear, survival ratios reasonable for both builds
- [ ] Playtest early game: bone_fragment_helm now hybrid DEF+AGI — is the AGI visible and useful at level 1?

## Open Loops / Blockers
- Prestige, territory, cheats disabled via feature gates — re-enable post-playtesting
- Legacy saves archived under `litrpg_idle_legacy_archive` key
- Store.equipped keeps all 33 keys for hydration compat — only 8 are used at runtime (was 7, +waterskin)
- territories.js references old V1 enemy IDs (disabled, not a runtime issue)
- UpgradeManager.getAutoAttackInterval() is now dead code (ComputedStats owns interval computation)
- All Area 2-3 enemies/bosses have `sprites: null` — need art assets
- GAME_DATA_REFERENCE.md is stale after balance overhaul + AGI addition — needs update
- Enemy accuracy values are auto-derived from archetypes (attackSpeed, defense, armorPen, dot) — may need hand-tuning per enemy
- Balance sim needs dual-policy (DEF-priority vs AGI-priority) gear selection to validate both build paths

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Agility stat + contested dodge mechanic (accuracy vs evade) + 9 equipment conversions
- **Architecture:** Progression.js owns XP/level + kill rewards. Store is pure state. EventScope pattern for subscriptions. ComputedStats for derived values (now includes getEffectiveAgi, getEvadeRating, getDodgeChance). BossManager looks up named bosses via `getBossForZone()`. LootEngine uses zone-based item pools with slot weighting and pity. Bosses can have `guaranteedFirstKillItem` for bonus drops.
- **AGI plan:** `Plans/Agility_Dodge_Plan.md` — contested accuracy formula, equipment conversion table
- **Balance tool:** `npm run balance:sim` — zone-by-zone idle progression simulation (now includes AGI/dodge columns)
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
- Added AGI stat + contested dodge mechanic (accuracy vs evade), 9 items converted to AGI-focused
- Floating cyan "DODGE!" text, enemy lunge on all attacks (hit or miss), StatsPanel/InventoryPanel support
- Removed dodge spam from SystemLog (high-accuracy warning + per-dodge log lines)
- Fixed boss challenge during player death: respawn no longer overwrites active boss with regular enemy
- Added `CombatEngine.isPlayerDead()` flag; BossChallenge blocks clicks while player is dead
- Set up per-account SSH keys for two GitHub accounts (makerscience + ott3rpilot)

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- GDD Plan: `Plans/Redesign Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
