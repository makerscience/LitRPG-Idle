# CURRENT_FOCUS

## One-liner
- Codebase redesign COMPLETE (all phases done). ~4600 LOC idle game. Post-redesign phase: balance testing, content, polish.

## Active Objectives (max 3)
1. **Redesign complete:** All 9 phases done (Phase 4 skipped as unnecessary).
2. **Post-redesign:** Balance testing, territory buff integration, new content
3. **Polish:** Boss sprites, cosmetic cleanup, gameplay testing

## Next Actions
- [ ] Integrate `allIncome` and `prestigeMultiplier` territory buffs (defined in data, not yet wired)
- [ ] Balance test: territory maxHP buff — verify not too strong/weak
- [ ] Balance test: offline progress rewards — verify gold/XP rates feel right
- [ ] Boss sprites — currently reuse base enemy sprites
- [ ] Phase 1E: consolidate InventoryPanel local RARITY_HEX into config (cosmetic, low priority)

## Open Loops / Blockers
- `allIncome` and `prestigeMultiplier` territory buffs defined in data but NOT yet integrated (deferred)
- InventoryPanel still has local `RARITY_HEX` dict (Phase 1E incomplete — cosmetic, low priority)
- Boss sprites currently reuse base enemy sprites
- `dropChanceByZone` naming cosmetic mismatch (works fine)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Redesign status:** ALL PHASES COMPLETE. Phase 9 (offline progress) was the final one.
- **Architecture:** Progression.js owns XP/level + kill rewards. Store is pure state. EventScope pattern for subscriptions. ComputedStats for derived values. OfflineProgress computes catch-up rewards at boot.
- **Plan:** `Codebase Redesign Plan.md` has full phase plan with status notes

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- Redesign plan: `Codebase Redesign Plan.md`
- Architecture: `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`, `.memory/LESSONS_LEARNED.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- **Phase 9:** Offline progress engine — rate-based catch-up rewards on game load
- Created `src/systems/OfflineProgress.js` (~130 lines): computes gold/XP/fragments from player DPS × zone enemy pool × clamped offline duration
- Added `SAVE.minOfflineTime: 60_000` to config.js (skip rewards if <60s away)
- Added 5 `OFFLINE_RETURN` dialogue lines to `src/data/dialogue.js`
- Updated `main.js` boot sequence: `OfflineProgress.apply()` after TerritoryManager.init()
- Updated `SystemLog.js`: displays "Welcome back!" summary line on construction
- Updated `DialogueManager.js`: fires snarky SYSTEM quip if away >5 minutes
- Build verified clean (`npm run build` passes)

## Pinned References
- Governance rules: `CLAUDE.md`
- Redesign plan: `Codebase Redesign Plan.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
