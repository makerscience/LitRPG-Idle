# CURRENT_FOCUS

## One-liner
- GDD Hard Pivot PHASE 7 COMPLETE. Balance tuned, DoT fixed, all 30 bosses beatable, final boss survival ratio 1.8x. Vertical slice shippable.

## Active Objectives (max 3)
1. **GDD Vertical Slice (Areas 1-3, Zones 1-30):** ALL 7 PHASES COMPLETE — shippable vertical slice
2. **Next:** Playtesting in-browser to validate feel, then publish to Itch.io
3. **Future:** Phase 8+ — town/territory re-enablement, prestige loop, art assets

## Next Actions
- [ ] Playtest in-browser: verify DoT damage visible in SystemLog for Blight Stalker Evolved (z11+) and Blighted Scholar (z27+)
- [ ] Playtest Area 1 difficulty: THE HOLLOW should be a tight fight (~1.2x survival) at level 8-9
- [ ] Playtest Area 3: verify gear progression feels meaningful (new slot unlocks at z17 gloves, z22 amulet)
- [ ] Polish: add sprites for Area 2-3 enemies/bosses (currently null — uses placeholder)
- [ ] Consider Phase 8: re-enable prestige/territory systems with V2 balance
- [ ] Itch.io deployment prep: build, test dist/, create page

## Open Loops / Blockers
- Prestige, territory, cheats disabled via feature gates — re-enable post-playtesting
- Legacy saves archived under `litrpg_idle_legacy_archive` key
- Store.equipped keeps all 33 keys for hydration compat — only 7 are used at runtime
- territories.js references old V1 enemy IDs (disabled, not a runtime issue)
- UpgradeManager.getAutoAttackInterval() is now dead code (ComputedStats owns interval computation)
- `getBossType`, `getStrongestEnemy`, `getBossDropMultiplier` in areas.js are now dead code
- All Area 2-3 enemies/bosses have `sprites: null` — need art assets
- Balance sim assumes optimal upgrade purchasing — real players will be weaker (more safety margin)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Bulk equipment thumbnails with Lanczos downscaling, thumb generator script
- **Architecture:** Progression.js owns XP/level + kill rewards. Store is pure state. EventScope pattern for subscriptions. ComputedStats for derived values. BossManager looks up named bosses via `getBossForZone()`. LootEngine uses zone-based item pools with slot weighting and pity.
- **Plan:** `Plans/Redesign Plan.md` — 8-phase implementation, Phase 7 complete
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
- Added background music: `Sound/soundtrack/ambient progression.mp3` streams via HTML5 Audio element in GameScene (not Phaser Web Audio — file is 207MB/2.5hr, too large to decode into memory)
- Added `Store.updateSetting(key, value)` generic mutation for settings with STATE_CHANGED emit
- Added `musicVolume: 0.5` default to Store settings (old saves auto-merge via hydration)
- GameScene subscribes to STATE_CHANGED to sync `_bgm.volume` in real-time; handles autoplay policy with retry on first click
- SettingsPanel now has a SOUND section with clickable/draggable volume slider (200px track, green fill, percentage label)
- Panel height increased from 340 to 420 to fit the new controls; danger zone pushed down
- BGM cleaned up on scene shutdown (pause + clear src)
- Files modified: `src/systems/Store.js`, `src/scenes/GameScene.js`, `src/ui/SettingsPanel.js`, `CHANGELOG.md`

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- GDD Plan: `Plans/Redesign Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
