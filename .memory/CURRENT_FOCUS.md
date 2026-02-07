# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. Phase 7 COMPLETE — move to Phase 8 (Polish / Final)
2. Test prestige loop: zone 4 → prestige → multiplier → zone 1 enemies melt
3. Verify save/load persistence of prestigeCount, multiplier, furthestZone

## Next Actions
- [ ] Commit Phase 7 changes
- [ ] Test full prestige loop: reach zone 4 → button appears → confirm → reset → multiplier applies
- [ ] Test two-click confirm safeguard (3s timeout)
- [ ] Test mutual exclusion: BAG/UPGRADES/PRESTIGE panels don't overlap
- [ ] Test save migration v3→v4 with old save data
- [ ] Plan Phase 8 (Polish / Final pass)

## Open Loops / Blockers
- (none currently)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Next:** Execute the first unchecked item in "Next Actions"
- **If unclear:** Check `MVP_PLAN.md` Phase 8 requirements

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- 8-phase build plan in `MVP_PLAN.md`
- Architecture + event catalog in `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- Phase 7 implemented: Prestige loop — reset for multiplier
- Created `src/systems/PrestigeManager.js` — zone tracking, eligibility, prestige execution, transient flags
- Created `src/ui/PrestigePanel.js` — modal with keeps/resets/gains columns, two-click confirm, P key toggle
- Updated Store with furthestZone, setFurthestZone(), performPrestige() (resets stats/upgrades/kills, keeps gear/cheats/fragments)
- CombatEngine now applies prestigeMultiplier to gold + XP drops, re-spawns enemy on prestige
- DialogueManager: prestige available/performed dialogue + 5s delayed post-prestige combat snark
- TopBar prestige counter (hidden when 0, shows P1 x1.25 format), SystemLog prestige event lines
- Save migration v3→v4; mutual exclusion across all 3 panels; SAVE_REQUESTED event subscription

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
