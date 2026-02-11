# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. Grid-based slotted inventory complete — 5x4 grid, 4 equipment box slots, rarity borders, detail panel
2. Phase 2 deferred: `allIncome` + `prestigeMultiplier` buff integration needs balance testing
3. Next: playtesting inventory grid interactions, visual polish, balance pass

## Next Actions
- [ ] Playtest rarity separation: collect multiple drops, verify different rarities appear as separate inventory slots
- [ ] Test equip/unequip cycle: equip a rare item, unequip it, verify it returns to the correct rarity stack
- [ ] Test sell flow with rarity stacks: Shift+click and detail panel Sell buttons
- [ ] Test save/load migration: existing save with old keys should migrate to composite keys on load
- [ ] Balance pass on boss HP/ATK multipliers and zone scaling factor (0.15)
- [ ] Consider rarity stat multipliers (rare items stronger than common) as future enhancement

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
- Fixed rarity-based inventory stacking: items of different rarities now occupy separate slots
- Introduced composite stack keys (`itemId::rarity`) in InventorySystem, Store, and InventoryPanel
- Added `makeStackKey()` / `parseStackKey()` helpers in InventorySystem
- Updated `getItem()` in items.js to transparently handle composite keys
- LootEngine now passes rolled rarity through to `tryAddItem()`
- Equipment slots store composite stack keys preserving rarity through equip/unequip cycle
- Save migration v7→v8 converts old inventory keys and equipped values to composite format
- Schema version bumped to 8

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
