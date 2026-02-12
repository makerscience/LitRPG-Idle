# CURRENT_FOCUS

## One-liner
- Codebase redesign COMPLETE. Character silhouette equipment screen implemented. Post-redesign: balance testing, content, polish.

## Active Objectives (max 3)
1. **Silhouette equipment screen done:** 33 slots defined, paper-doll layout with connector lines, tier-gated rendering
2. **Post-redesign:** Balance testing, territory buff integration, new content
3. **Polish:** Boss sprites, cosmetic cleanup, gameplay testing

## Next Actions
- [ ] Visual test: open inventory panel in-game, verify silhouette + 4 tier-0 slots render correctly
- [ ] Test equip/unequip cycle with old saves (body→chest, weapon→main_hand migration)
- [ ] Add items for new slot types (tier 1+ content, future task)
- [ ] Integrate `allIncome` and `prestigeMultiplier` territory buffs
- [ ] Balance test: territory maxHP buff, offline progress rewards
- [ ] Boss sprites — currently reuse base enemy sprites

## Open Loops / Blockers
- No items exist yet for tier 1+ equipment slots (shoulders, amulet, bag, meal, etc.)
- `allIncome` and `prestigeMultiplier` territory buffs defined but NOT integrated
- InventoryPanel still has local `RARITY_HEX` dict (cosmetic, low priority)
- Boss sprites currently reuse base enemy sprites
- Circular import: equipSlots↔Store is safe (lazy function calls only) but worth noting

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** Silhouette equipment screen — new `src/data/equipSlots.js`, expanded Store.equipped, InventoryPanel rewrite
- **Architecture:** Progression.js owns XP/level + kill rewards. Store is pure state. EventScope pattern for subscriptions. ComputedStats for derived values.
- **Equipment:** 33 slots defined in equipSlots.js, tier unlock = furthestArea - 1, InventorySystem resolves item.slot → equipped key

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- Architecture: `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`, `.memory/LESSONS_LEARNED.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- Created `src/data/equipSlots.js`: 33 slot definitions with id, label, tier, side, anchor, itemSlot
- Helper functions: getMaxEquipTier, getLeftSlots, getRightSlots, getAccessorySlots, getEquipSlotForItem
- Expanded Store.equipped to 33 null-initialized slots via ALL_SLOT_IDS
- Added save migration: old `body`→`chest`, `weapon`→`main_hand` in hydrateState
- Added InventorySystem._resolveEquipSlot() with ring disambiguation
- Updated getEquippedWeaponDamage() to use `main_hand` key
- Rewrote InventoryPanel: 880x560 panel, silhouette sprite, column layout, connector lines, accessory grid
- Build verified clean (npm run build passes)

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
