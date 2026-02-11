# CURRENT_FOCUS

## One-liner
- Codebase redesign in progress — Phase 2 complete, Phase 3+ pending. ~4500 LOC idle game.

## Active Objectives (max 3)
1. **Phase 2 complete:** ComputedStats fully integrated — CombatEngine, Store HP methods, and StatsPanel all delegate to it
2. **Phase 1 complete:** ModalPanel base class, ScrollableLog base class, ui-utils, all panels refactored
3. **Phases 3–8 pending:** Config decomposition, Store slimming, CombatEngine decomposition, kill tracking, event cleanup

## Next Actions
- [ ] Begin Phase 3: split config.js into config/layout.js + config/theme.js
- [ ] Phase 4: Slim Store — extract SaveManager hydration, reduce mutation surface
- [ ] Phase 5: CombatEngine decomposition — separate HP regen, auto-attack, spawn logic
- [ ] Continue through Phases 6–8 per redesign plan
- [ ] Balance test: territory maxHP buff now works — verify it's not too strong/weak
- [ ] Address InventoryPanel local RARITY_HEX dict (Phase 1E cosmetic, low priority)

## Open Loops / Blockers
- `allIncome` and `prestigeMultiplier` territory buffs defined in data but NOT yet integrated (deferred)
- InventoryPanel still has local `RARITY_HEX` dict (Phase 1E incomplete — cosmetic, low priority)
- Boss sprites currently reuse base enemy sprites
- `dropChanceByZone` naming cosmetic mismatch (works fine)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Phase 2 done:** ComputedStats wired into Store, CombatEngine, StatsPanel
- **Next:** Phase 3 — config decomposition
- **Plan:** `Codebase Redesign Plan.md` has full 8-phase plan with status notes

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- Redesign plan: `Codebase Redesign Plan.md`
- Architecture: `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- Fixed Store.js broken `require()` → clean ESM `import { getEffectiveMaxHp }` from ComputedStats
- Wired 5 Store HP methods (damagePlayer, healPlayer, getPlayerMaxHp, resetPlayerHp) to `getEffectiveMaxHp()`
- Fixed performPrestige HP reset to use `getEffectiveMaxHp()` — now includes territory VIT + maxHP buffs
- Refactored StatsPanel `_getCombatRows()` to use `ComputedStats.getAllStats()` — eliminated 6 direct manager queries
- Refactored StatsPanel `_getEconomyRows()` to use ComputedStats — eliminated manual multiplier assembly
- Removed StatsPanel imports: CombatEngine, UpgradeManager, InventorySystem, DAMAGE_FORMULAS
- Build passes cleanly (npm run build)
- **Territory maxHP buff (territories 2, 11) now actually works** — was previously ignored in Store HP calculations

## Pinned References
- Governance rules: `CLAUDE.md`
- Redesign plan: `Codebase Redesign Plan.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
