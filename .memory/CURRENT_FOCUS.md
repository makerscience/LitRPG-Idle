# CURRENT_FOCUS

## One-liner
- Building a LitRPG idle/clicker game with a snarky SYSTEM narrator, using Phaser + Vite + break_infinity.js.

## Active Objectives (max 3)
1. Zone/Area Progression Restructure complete — 5 areas with 34 zones, boss gate system, progressive enemy unlocks
2. Phase 2 deferred: `allIncome` + `prestigeMultiplier` buff integration needs balance testing
3. Next: playtesting area/zone progression, boss fights, save migration, visual polish

## Next Actions
- [ ] Playtest new game flow: Area 1 Zone 1 → kill rats → boss challenge → advance to Zone 2
- [ ] Test area boss defeat → next area unlock flow
- [ ] Test prestige with new area/zone system (should reset areaProgress, keep furthestArea)
- [ ] Test save migration v6→v7 (load old save, verify generous mapping)
- [ ] Test overworld map with `furthestArea` gating (territories use area, not zone)
- [ ] Balance pass on boss HP/ATK multipliers and zone scaling factor (0.15)

## Open Loops / Blockers
- `allIncome` and `prestigeMultiplier` territory buffs are defined in data but NOT yet integrated into gameplay systems (deferred to Phase 2)
- `getEffectiveMaxHp()` in CombatEngine accounts for flatVit + maxHp territory buffs, but Store's `healPlayer()` and `damagePlayer()` still use base max HP — may need alignment
- Boss sprites currently reuse base enemy sprites — no unique boss sprites yet
- INVENTORY.dropChanceByZone keys still named `dropChanceByZone` (maps to area now) — cosmetic, works fine

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Next:** Playtest the zone/area progression (start new game, kill enemies, challenge boss)
- **If unclear:** Check the implementation plan in `Current Phase Plan.md`

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- 8-phase build plan in `MVP_PLAN.md`
- Architecture + event catalog in `ARCHITECTURE.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`
- Changelog: `CHANGELOG.md`

---

## Last Session Summary (max ~8 bullets)
- Zone/Area Progression Restructure: 5 areas with 34 zones, boss gates, progressive enemy unlocks, zone scaling
- Created areas.js, BossManager.js, BossChallenge.js; rewrote ZoneNav, CombatEngine, Store
- Save migration v6→v7; updated OverworldScene, PrestigeManager, DialogueManager, SystemLog
- Polish: halved Sewer Rat HP, ZoneNav text readability (black outlines, brighter, no transparency)
- Arrows moved closer to labels and hidden when navigation unavailable

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- MVP Plan: `MVP_PLAN.md`
- Original setup guide: `Minimal Claude Organization Setup (Governance-Only).md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
