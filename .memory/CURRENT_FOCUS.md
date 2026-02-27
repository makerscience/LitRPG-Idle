# CURRENT_FOCUS

## One-liner
- 3-slot save system implemented. Start screen, stance icons, and stance announcements all in place. Ready for playtesting.

## Active Objectives (max 3)
1. **Playtest save slots:** Validate New Game/Load Game/Delete across 3 slots, migration from single save
2. **Playtest stance system:** Validate unlock flow, tier effects, teaching moments
3. **Next feature planning:** Identify next priority from GDD

## Next Actions
- [ ] Playtest save slots: create saves in different slots, load each, delete one, verify migration
- [ ] Playtest start screen UI: slot picker layout, overwrite confirmation, Load Game graying
- [ ] Playtest stance icon switcher + announcement feel
- [ ] Playtest full unlock flow: Armor Break at zone 6, Cleanse at zone 11+, Interrupt at zone 13+
- [ ] Identify next feature priority from `Plans/Redesign Plan.md`

## Open Loops / Blockers
- `npm run build` passes with a pre-existing large bundle warning (Phaser chunk >500kB)
- Prestige, territory, and cheats remain behind feature gates
- Upgrade IDs still use `flurry_*` prefix despite stance rename to `tempest` (intentional — keeps save compat)
- Game title changed to "Exile's Ascension" — may want to update package.json, HTML title, etc.
- OfflineProgress.apply() runs at boot before slot load (safe — no-ops on fresh state) but ideally should run after slot load

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** 3-slot save system with slot picker UI
- **Key files (this session):**
  - `src/systems/SaveManager.js` (slot-aware: slotKey/slotBackupKey, activeSlot, migration, getSlotSummary)
  - `src/scenes/StartScene.js` (slot picker, overwrite/delete confirmation, parallax menu)
  - `src/ui/StanceSwitcher.js` (icon sprites on white circle, per-stance colors)
  - `src/scenes/GameScene.js` (`_announceStance()` — text + screen shake on stance switch)
  - `src/scenes/BootScene.js` (loads start screen + stance icon textures, transitions to StartScene)
- **Verification commands:** `npm run build`, `npm run validate:data`

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- Architecture: `ARCHITECTURE.md`
- GDD plan: `Plans/Redesign Plan.md`
- Save slots design: `docs/plans/2026-02-27-save-slots-design.md`
- Start screen plan: `Plans/start-screen-plan.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`, `.memory/LESSONS_LEARNED.md`
- Changelog: `CHANGELOG.md`
- Feature gates: `src/config/features.js`
- Save namespace: `litrpg_idle_vslice_save_slot{1,2,3}` (schema v3, migrated from single save)

---

## Last Session Summary (max ~8 bullets)
- Added shadow system for player and enemies (ellipses at feet)
- Player shadow: single ellipse below player sprite
- Enemy shadows: per-slot ellipse in container, auto-sized to enemy sprite
- Per-enemy `shadowOffsetY` field added to all sprite-bearing enemies in `enemies.js`
- Shadows gated behind `FEATURES.shadowsEnabled` (currently `false`) — needs per-enemy tuning
- Feature gate in `src/config/features.js`

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- Redesign plan: `Plans/Redesign Plan.md`
- Enemy roster plan: `Plans/Old/Enemy_Roster_Redesign_Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
