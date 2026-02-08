# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. All 8 phases + sprite/HP system implemented — MVP feature-complete
2. SYSTEM dialogue window with emotion-based styling implemented
3. Next: more enemy sprites, playtesting, or Itch.io packaging

## Next Actions
- [ ] Add sprites for other Zone 1 enemies (Green Slime) if art available
- [ ] Manual playtest: verify balance with enemy attacks (player shouldn't die too easily in Zone 1)
- [ ] Consider Itch.io packaging / offline progress (deferred scope)
- [ ] Add background images for other zones (currently only Zone 1 has image-based parallax)

## Open Loops / Blockers
- (none currently)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Next:** Execute the first unchecked item in "Next Actions"
- **If unclear:** Check `Current Phase Plan.md` for Phase 8 verification checklist

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- 8-phase build plan in `MVP_PLAN.md`
- Architecture + event catalog in `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- Defeat lines in system log now white (new `defeat` color in COLORS.logText) instead of yellow
- SYSTEM dialogue window shows dim context lines (`> Sewer Rat defeated!`) above SYSTEM responses
- `say()` in DialogueManager accepts optional 3rd `context` param; emits via DIALOGUE_QUEUED
- Updated ~15 call sites with context strings (first kill, level up, zone entrance, cheats, etc.)
- Direct DIALOGUE_QUEUED emitters (FirstCrackDirector, CheatManager, UpgradePanel) also carry context
- Ambient/delayed lines (COMBAT_COMMENTARY, AMBIENT_SNARK, POST_PRESTIGE_COMBAT, PRESTIGE_AVAILABLE) intentionally have no context
- Context lines render at 10px/#a1a1aa, 2px gap; dialogue lines keep existing emotion styling, 4px gap
- Dialogue panel header: "SYSTEM'S LOG" bold green 18px; system log header: "SYSTEM LOG" white 9px

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
