# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. Character Stats Panel complete — two-column layout with base/combat/economy/progression stats
2. Phase 2 deferred: `allIncome` + `prestigeMultiplier` buff integration needs balance testing
3. Next: playtesting stats panel, visual polish, balance pass

## Next Actions
- [ ] Playtest STATS panel: open with C key, verify all values match actual game state
- [ ] Test mutual exclusion: open STATS then press I/U/P/ESC/M — verify STATS closes
- [ ] Test refresh: level up / buy upgrade / claim territory / equip weapon → values update live
- [ ] Balance pass on boss HP/ATK multipliers and zone scaling factor (0.15)
- [ ] Consider adding tooltips or expandable stat breakdowns as future enhancement

## Open Loops / Blockers
- `allIncome` and `prestigeMultiplier` territory buffs are defined in data but NOT yet integrated into gameplay systems (deferred to Phase 2)
- `getEffectiveMaxHp()` in CombatEngine accounts for flatVit + maxHp territory buffs, but Store's `healPlayer()` and `damagePlayer()` still use base max HP — may need alignment
- Boss sprites currently reuse base enemy sprites — no unique boss sprites yet
- INVENTORY.dropChanceByZone keys still named `dropChanceByZone` (maps to area now) — cosmetic, works fine

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Next:** Playtest the grid inventory (press I or click BAG, verify grid layout)
- **If unclear:** Check the implementation in `src/ui/InventoryPanel.js`

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- 8-phase build plan in `MVP_PLAN.md`
- Architecture + event catalog in `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- Created Character Stats Panel (`src/ui/StatsPanel.js`) — modal overlay following existing panel pattern
- Two-column layout: base stats + combat (left), economy + progression (right)
- Shows computed values: effective damage, crit chance, atk speed, gold/XP multipliers, territory breakdowns
- Toggle via STATS [C] button in bottom bar or C key
- Mutual exclusion added to all 4 existing panels + MAP toggle
- Integrated into UIScene (create, _toggleMap, _shutdown)

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
