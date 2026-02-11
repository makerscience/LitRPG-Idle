# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. Grid-based slotted inventory complete — 5x4 grid, 4 equipment box slots, rarity borders, detail panel
2. Phase 2 deferred: `allIncome` + `prestigeMultiplier` buff integration needs balance testing
3. Next: playtesting inventory grid interactions, visual polish, balance pass

## Next Actions
- [ ] Playtest inventory grid: open BAG, verify 5x4 grid renders, items display abbreviations
- [ ] Test equip flow: click slot to select, click again to equip, verify equipment box updates
- [ ] Test sell flow: Shift+click to sell all, detail panel Sell 1 / Sell All buttons
- [ ] Test unequip: click equipped item box to unequip back to inventory
- [ ] Balance pass on boss HP/ATK multipliers and zone scaling factor (0.15)
- [ ] Visual polish: consider item icons replacing abbreviation text in future

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
- Rewrote InventoryPanel from text list to 5x4 visual grid with 64px slot boxes
- Equipment section: 4 box slots (120x60) with slot label, item abbreviation, rarity border + word
- Inventory grid: rarity-colored borders, bold abbreviation text, gold count badges, selection glow
- Detail panel below grid: item name + rarity + slot + stat, italic description, Sell 1 / Sell All / Equip buttons
- Added `abbr` field to all 12 items in items.js
- Renamed `_invListObjects` → `_invGridObjects`, `_sellObjects` → `_detailObjects`
- Added `RARITY_HEX` map for Phaser rectangle stroke colors

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
