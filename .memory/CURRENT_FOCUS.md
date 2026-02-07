# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. Goblin sprites + enemy attack / player HP system — IMPLEMENTED
2. Manual playtest to verify new sprite system + combat balance
3. Consider additional enemy sprites for other enemies

## Next Actions
- [ ] Manual playtest: verify goblin sprite poses (default, reaction on hit, attack on enemy attack, dead on kill)
- [ ] Manual playtest: verify player HP bar drains on enemy attacks, regens between attacks
- [ ] Manual playtest: verify player death → flash → respawn after 1.5s with full HP
- [ ] Manual playtest: verify non-goblin enemies still render as red rectangles
- [ ] Manual playtest: verify save/load preserves playerHp
- [ ] Consider adding sprites for other enemies (sewer rat, slime, etc.)

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
- Implemented enemy sprite system: Goblin Grunt shows 4 PNG poses (default/reaction/attack/dead) with pose-switching on combat events
- Added enemy attack mechanic: enemies attack player every 3s via CombatEngine timer
- Added player HP system: HP bar below player rect, HP = VIT * 10, 2% regen/sec, death/respawn cycle
- Modified 6 files: enemies.js (sprite metadata + getEnemyById), BootScene.js (preload), config.js (combat params), Store.js (playerHp state/mutations), CombatEngine.js (enemy attack/regen/death timers), GameScene.js (sprite rendering + player HP bar + pose switching)
- Non-sprite enemies gracefully fallback to red rectangle rendering
- Player HP resets on level-up and prestige; persists in saves via DECIMAL_FIELDS hydration

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
