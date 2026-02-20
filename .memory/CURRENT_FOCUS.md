# CURRENT_FOCUS

## One-liner
- Area 1 expanded to 10 zones; balance GUI overhauled with sliders, heat-map, and sparklines.

## Active Objectives (max 3)
1. **Playtest Area 1 zones 1–10:** Verify zone-by-zone encounter mix feels right in-game
2. **Author zones 6–10 content:** Need named bosses for zones 6–10 (currently none); add boss definitions to bosses.js
3. **Area 2-3 content:** Author multi-member encounter templates, fill sprite gaps

## Next Actions
- [ ] Playtest zones 1–5: confirm rat/slime/hound progression feels correct per-zone
- [ ] Playtest zone 6+: confirm only boar solo + boar_duo appear (no rats/slimes/hounds)
- [ ] Author bosses for Area 1 zones 6–10 in bosses.js (currently no bosses cover those zones)
- [ ] Author multi-member encounter templates for Areas 2-3
- [ ] Tune ZONE_BALANCE dials in areas.js using `npm run balance:gui` (GUI now available)
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
- **Balance tools:** `npm run balance:sim` (CLI), `npm run balance:gui` (visual GUI editor for ZONE_BALANCE, port 3001)

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
- Zone Balance GUI visual redesign: three upgrades to `scripts/zone-balance-gui.js` (HTML template only)
- Upgrade 1: heat-map td backgrounds — orange (< 1.0) to green (> 1.0), interpolated opacity; scan 30×7 grid at a glance
- Upgrade 2: slider + readout per cell — `range` input (0.5–2.0) with live fill-color gradient track; `×1.00` span below; click span to open inline number input for precision entry
- Upgrade 3: sparklines — 7 SVG bar charts (120×44px) above table, one per stat; bars above center = green, below = orange; clicking a bar scrolls to that zone row with a red flash pulse
- `cellRefs` map (`zone-stat` → `{slider, span, td}`) powers `refreshCell()` and `resetRow()` without DOM queries
- Server-side code, Save/Run Sim/Copy Code buttons, and data format all unchanged

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- GDD Plan: `Plans/Redesign Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
