# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. Phase 8 COMPLETE — commit and test
2. All 8 phases implemented — game is feature-complete for MVP
3. Manual playtest to verify balance targets (zone 1-3 in ~10 min, first prestige at ~15-20 min)

## Next Actions
- [ ] Commit Phase 8 changes
- [ ] Manual playtest: verify dialogue triggers fire correctly (first kill, milestones, zone entrances, ambient)
- [ ] Manual playtest: verify visual juice (gold particles, death anim, level flash, cheat glitch, parallax)
- [ ] Manual playtest: verify balance targets (zone 1-3 ~10 min, prestige ~15-20 min)
- [ ] Verify save migration v4→v5 with old save data
- [ ] Consider Itch.io packaging / offline progress (deferred scope)

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
- Phase 8 implemented: Polish pass — dialogue, visual juice, parallax, balance
- Created `src/data/dialogue.js` — ~80 SYSTEM lines across 15 trigger categories
- Refactored `DialogueManager` — data-driven imports, cooldown tracking, kill milestone arbitration, ambient timer, big damage detection, timer cleanup in destroy()
- Rewrote `GameScene` — magnitude-tiered damage numbers with shake/glow, gold particles on kill, expand→shrink death anim, level-up flash, cheat glitch effect, procedural parallax backgrounds (5 zones, 3 layers each)
- Balance pass: HP cuts ~50%, XP bumps zones 2-3, cheaper upgrade costs, faster auto-attack (800ms) + spawn (400ms), fragment drop 8%, higher loot drop rates
- Kill counting moved from FirstCrackDirector to CombatEngine (increment before emit)
- CheatDeck dialogue emit removed (now handled by DialogueManager via CHEAT_TOGGLED)
- UpgradePanel: always-clickable buy buttons with failed-purchase dialogue (10s local cooldown)

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
