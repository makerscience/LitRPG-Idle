# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. Phase 6 COMPLETE — move to Phase 7 (Prestige / Reboot system)
2. Test cheat unlock + merge chain + toggle persistence in-browser
3. Balance drop pacing with Loot Hoarder active

## Next Actions
- [ ] Commit Phase 6 changes
- [ ] Test full cheat loop: 10 fragments → unlock → toggle ON → drops boost → 100 daggers auto-merge
- [ ] Test chain merge: enough steel swords → mithril blade
- [ ] Test toggle OFF stops merges, toggle ON resumes
- [ ] Test save/load persists unlockedCheats, activeCheats, firstMerge flag
- [ ] Plan Phase 7 (Prestige system)

## Open Loops / Blockers
- (none currently)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Next:** Execute the first unchecked item in "Next Actions"
- **If unclear:** Check `MVP_PLAN.md` Phase 7 requirements

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- 8-phase build plan in `MVP_PLAN.md`
- Architecture + event catalog in `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- Phase 6 implemented: Loot Hoarder cheat + Cheat Deck UI
- Created `src/data/cheats.js` — cheat definitions with systemDialogue per lifecycle event
- Created `src/systems/CheatManager.js` — fragment threshold detection, auto-unlock at 10 fragments
- Created `src/ui/CheatDeck.js` — bottom bar toggle cards with pulsing green glow, hidden until unlocked
- Updated Store with activeCheats, unlockCheat/toggleCheat/isCheatActive mutations, firstMerge flag
- Added _tryAutoMerge to InventorySystem with chain merge support (depth-bounded), triggered on every tryAddItem
- LootEngine boosts drop chance ×1.5 and drop count ×3 when Loot Hoarder active
- Save migration v2→v3; DialogueManager + SystemLog wired for merge/unlock/toggle events

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
