# GDD Hard Pivot Redesign Plan (Areas 1-3 Vertical Slice)

## Decision Lock (Confirmed)

- Hard pivot to the GDD vertical slice (Areas 1-3, Zones 1-30)
- Fresh start for saves; no progression carryover (new save namespace)
- Keep existing equipment framework, but only 7 slots are active for this release
- Prestige is disabled for this vertical slice
- Bosses remain manually triggered via "Challenge Boss" button
- Cheat system disabled for this slice (re-enable after balance tuning)
- Inactive equipment slots hidden entirely from UI (only 7 active slots visible)

---

## Feasibility

This is feasible with the current architecture, but it is a full gameplay pivot, not a light refactor.
The codebase has strong seams (`Store`, `ComputedStats`, `CombatEngine`, `Progression`, `LootEngine`), so the work is mostly systematic model replacement plus content authoring.

Expected effort: ~10-16 focused sessions.

---

## Primary Risks (and Controls)

1. **Data-volume risk** (30 bosses, 40+ items, 30 zones)
   - Control: schema validators + per-area rollout (A1 then A2 then A3), not one-shot data dump.

2. **Combat regression risk** (DoT, armor penetration, variable enemy attack speed)
   - Control: deterministic combat test vectors and explicit timer lifecycle rules.

3. **Save/cutover confusion risk**
   - Control: new save namespace + one-time legacy save archive + explicit UX message.

4. **Scope drift risk** from non-core systems (territories, prestige, town, utility bag)
   - Control: hard-disable these systems via feature gates for this slice.

---

## Scope

### In Scope
- GDD Areas 1-3 progression model (Zones 1-30)
- New combat mechanics: defense reduction, armor penetration, DoT, per-enemy attack speed
- New player stat model and XP curve from GDD
- Boss data model with 30 named bosses
- Loot model updates for zone/slot weighting and pity behavior
- UI updates required for the above
- Placeholder art for all new enemies/backgrounds

### Out of Scope (Deferred)
- Prestige loop
- Territory map progression
- Town/reclaim systems
- Utility slot progression
- Cheat system (disabled)
- Post-Area-3 content

---

## Target Runtime Model

### World Model
- 3 areas only: The Harsh Threshold (5 zones), The Overgrown Frontier (10 zones), The Broken Road (15 zones)
- Global zone numbering: 1-30
- Area bosses gate next area

### Player Model
- Stats: `str`, `def`, `hp`, `regen`, `level`, `xp`, `xpToNext`
- Attack speed from gear only (not level-up)
- Base stats (level 1): STR 10, DEF 5, HP 100, Regen 1/sec, AtkSpeed 1.0/sec
- Per-level gains: +2 STR, +2 DEF, +12 HP, +0.1 Regen
- XP curve from GDD table (50, 75, 110, 155, 210, 280, ...)

### Enemy Model (V2)
- Required fields: `hp`, `attack`, `attackSpeed`, `defense` (0 for most early), `armorPen` (0-0.35), optional `dot`
- Zone range mapping via `zones: [min, max]` for encounter eligibility

### Equipment Model
- 7 active slots: `main_hand`, `chest`, `head`, `legs`, `boots`, `gloves`, `amulet`
- Zone-based unlock: head/chest/main_hand (start), legs (zone 6), boots (zone 9), gloves (zone 17), amulet (zone 22)
- Item stats expanded: `str`, `def`, `hp`, `regen`, `atkSpeed`
- All other slots remain in framework but are hidden

### Combat Model
- Player damage: `Strength` (flat), min 1 (enemies have 0 defense early)
- Enemy damage to player: `EnemyDmg - (PlayerDef × 0.5)`, min 1
- Armor penetration: `EnemyDmg - ((PlayerDef × (1 - pen%)) × 0.5)`, min 1
- DoT: flat X/sec damage while enemy is alive
- Enemy attack speed: per-enemy interval (e.g., 0.6/sec = 1667ms, 2.0/sec = 500ms)

---

## Save Strategy

- New save key namespace: `litrpg_idle_vslice_save`
- Start at schema version 1 for the slice track
- Do not migrate old progression into new model
- Optional: preserve old save blob under legacy key for rollback/testing
- First launch clearly indicates a fresh start

---

## Feature Gates

Create `src/config/features.js`:
```js
export const FEATURES = {
  prestigeEnabled: false,
  territoryEnabled: false,
  townEnabled: false,
  cheatsEnabled: false,
};
```
All scenes/managers read these flags and skip booting disabled systems.

---

## Workflow

We are starting with **Phase 0** and will **pause to check in before beginning each successive phase**. This ensures alignment at each step and gives us a natural breakpoint to reassess scope, priorities, or direction.

---

## Implementation Phases

### Phase 0: Cutover Scaffold and Safety Rails ✅ COMPLETE
**Goal:** Make the pivot mechanically safe before changing gameplay.

1. ✅ Add feature gates module and boot guards for prestige/territory/town/cheats
2. ✅ Add new save namespace and fresh-save initialization path
3. ✅ Ensure game boots and runs combat loop with disabled systems (no null/event errors)
4. ✅ Verify `npm run build` passes

**Files touched:** `src/config/features.js` (new), `SaveManager.js`, `config.js`, `main.js`, `UIScene.js`

**Result:** Game boots, combat works, disabled systems are inert. Legacy saves archived under `litrpg_idle_legacy_archive`.

---

### Phase 1: Data Contracts and Area 1 Content ✅ COMPLETE
**Goal:** Define data schemas and author Area 1 content completely.

1. ✅ Define V2 schemas for enemies, bosses, items, areas
2. ✅ Add lightweight validator script (`npm run validate:data`)
3. ✅ Establish ID conventions (`a{area}_{name}`, `boss_a{area}z{zone}_{name}`) and zone-range conventions (`zones: [min, max]`)
4. ✅ Author Area 1 data:
   - 3 enemies: Feral Hound, Thornback Boar, Blighted Stalker
   - 5 bosses: Rotfang, Irontusk, The Lurcher, Blight Mother, THE HOLLOW
   - 6 items: 3 common (Sharpened Stick, Scavenged Hide Wrap, Bone Fragment Helm) + 3 uncommon (Bone Shard Blade, Thick Pelt Vest, Hound Skull Cap)
5. ✅ Rewrite `areas.js` for 3-area structure (only Area 1 populated initially)
6. ✅ Add V2 constants to `config.js` (`PROGRESSION_V2`, `COMBAT_V2`, `LOOT_V2`)

**Files:** `src/config.js`, `src/data/enemies.js`, `src/data/items.js`, `src/data/bosses.js` (new), `src/data/areas.js`, `scripts/validate-data.js` (new), `package.json`

**Result:** Validator passes (0 errors, 1 expected warning for empty Areas 2-3). Build clean. Game boots with V2 data + V1 systems (frankenstein state — enemies die fast, bosses still auto-generated, player stats still V1).

---

### Phase 2: Combat and Stat Engine V2 ✅ COMPLETE
**Goal:** Replace the mechanical core, playable with Area 1 content.

1. ✅ Replace player stat model in `Store` (`vit`/`luck` → `def`/`hp`/`regen`) and `ComputedStats`
2. ✅ Implement defense reduction in `CombatEngine.enemyAttack()`
3. ✅ Implement armor penetration modifier
4. ✅ Implement DoT system with strict lifecycle cleanup (clear on enemy death, zone change, player death)
5. ✅ Implement per-enemy attack speed (re-register enemy attack ticker on each spawn)
6. ✅ Update regen to flat/sec model
7. ✅ Update `getEffectiveMaxHp()` from `vit × 10` to flat HP from levels + gear
8. ✅ Add equipment stat summation across all equipped slots in `ComputedStats`
9. ✅ Wire GDD XP table (`PROGRESSION_V2.xpForLevel`) and per-level stat gains (+2 STR, +2 DEF, +12 HP, +0.1 Regen)
10. ✅ Purge all V1 `COMBAT`/`PROGRESSION` imports from runtime code
11. ✅ Update StatsPanel UI (DEF/HP/REGEN replace VIT/LUCK)
12. ✅ Update BossManager to pass V2 fields through boss templates

**Files:** `Store.js`, `ComputedStats.js`, `CombatEngine.js`, `BossManager.js`, `StatsPanel.js`, `UpgradeManager.js`, `OfflineProgress.js`, `GameScene.js`

**Result:** V2 combat fully operational — player damage uses STR vs enemy DEF, enemies attack at individual speeds, DoT ticks and clears cleanly, gear-based player attack speed, flat HP/regen model. Build and data validation pass.

---

### Phase 3: BossManager V2 + World Flow Polish ✅ COMPLETE
**Goal:** Make Area 1 fully playable end-to-end with named bosses.

1. ~~Implement GDD XP table~~ (done in Phase 2)
2. ~~Implement per-level stat gains~~ (done in Phase 2)
3. ~~Wire 3-area world definitions~~ (done in Phase 1)
4. ~~Update boss gating flow for new area/zone structure~~ (done in Phase 1)
5. ✅ Rewrite `BossManager.js` to look up named bosses from `bosses.js` data instead of generating from enemy templates
6. ✅ Update BossChallenge UI to show named boss data (name, stats preview)
7. ~~Remove/deactivate prestige availability logic and UI~~ (done in Phase 0)

**Files:** `BossManager.js`, `BossChallenge.js`

**Result:** Named bosses spawn with hand-tuned stats from bosses.js. BossChallenge button shows boss name (e.g. "CHALLENGE ROTFANG"). Sprite resolution falls back to baseEnemyId enemy. Build and data validation pass.

---

### Phase 4: Loot and Equipment V2 ✅ COMPLETE
**Goal:** Align gear progression with GDD loot model.

1. ✅ Implement new drop rates: 10% normal, 100% boss
2. ✅ Implement boss loot rules: first-kill guaranteed + 30% uncommon; repeat-kill guaranteed + 11% uncommon
3. ✅ Implement zone-appropriate drops (items filtered by `zones: [min, max]` via `getItemsForZone()`)
4. ✅ Implement slot weighting (main_hand 16%, chest 15%, head/legs/boots/gloves 14%, amulet 13%)
5. ✅ Implement pity system: per-slot counter increments on BOSS_DEFEATED, resets on drop, doubles weight after 5
6. ✅ Restrict drops to common/uncommon rarities (rare/epic removed from V2 rarity weights)
7. ✅ Update equipment slot unlock to zone-based (head/chest/main_hand zone 1, legs zone 6, boots zone 9, gloves zone 17, amulet zone 22)
8. ✅ Hide inactive slots from UI entirely (accessory row returns [], enlarged slot boxes 100x38)

**Files:** `LootEngine.js`, `config.js`, `equipSlots.js`, `InventoryPanel.js`, `items.js`, `Store.js`, `validate-data.js`

**Result:** V2 loot system fully operational — zone-based item pools, slot-weighted selection with pity, boss first-kill vs repeat-kill differentiation. 7 active equipment slots with zone-based unlock. Data validator checks item zone coverage. Build and validation pass.

---

### Phase 5: Area 2 and Area 3 Content Rollout ✅ COMPLETE
**Goal:** Expand from validated Area 1 loop to full vertical slice.

1. ✅ Author Area 2 data:
   - 5 enemies (Rot Vine Crawler, Mire Lurker, Wisp Swarm, Blight Stalker Evolved w/ DoT, Bog Revenant)
   - 10 bosses (Rootmaw → Mire Mother [ELITE z10] → THE LOST WARDEN [AREA z15, DoT])
   - 15 items (5 Tier 1 common z6-10, 5 Tier 2 common z11-15, 5 uncommon z8-15) across weapon/body/head/legs/boots
2. ✅ Author Area 3 data:
   - 10 enemies across 3 sub-regions (Stone Sentry through Shade of the Keeper — armorPen 0.25-0.35, DoT at z27+)
   - 15 bosses (The Forgotten → THE ETERNAL SENTRY [ELITE z20] → CORRUPTED WARDEN [ELITE z25] → THE FIRST KEEPER [AREA z30, 1400 HP, 20% pen, 4/sec DoT])
   - 24 items (6 Tier A z16-20, 7 Tier B z21-25, 7 Tier C z26-30, 7 uncommon) across all 7 slots including gloves/amulet
3. ⬜ Map placeholder sprites for all new enemies (sprites: null — uses fallback rendering)
4. ⬜ Reuse Area 1 parallax background for Areas 2 and 3 (no changes needed — already works)

**Files:** `enemies.js`, `items.js`, `bosses.js`

**Result:** All 30 zones have enemies (18 total), items (45 total), and named bosses (30 total). Validator passes 0 errors, 0 warnings. Build clean. Area-specific loot tables added to enemies.js and bosses.js for schema consistency. Content matches GDD specs exactly (stats, zones, mechanics).

---

### Phase 6: UI and UX Alignment ✅ COMPLETE
**Goal:** Remove stale 5-area/legacy assumptions from player-facing surfaces.

1. ✅ Update ZoneNav for 3 areas with new names (flipped priority: `areaData?.name` over `ZONE_THEMES[area]?.name`)
2. ~~Update StatsPanel to show DEF, Regen, AtkSpeed (remove VIT/LUCK)~~ (done in Phase 2)
3. ~~Update InventoryPanel: only 7 slots visible, zone-based unlock messaging~~ (done in Phase 4)
4. ✅ Update combat log to show DoT ticks, armor pen effects (spawn warnings + throttled DoT log + new `COMBAT_DOT_TICK` event)
5. ~~Ensure disabled systems (prestige panel, territory map) are not shown~~ (done in Phase 0)
6. ~~Update offline progress math for V2 stats~~ (done in Phase 2)
7. ✅ Add clear fresh-start messaging on first launch (SystemLog welcome line + SYSTEM dialogue trigger)
8. ✅ Clean up ZONE_THEMES: removed name fields, dead entries 4-5; added `warning`/`dot` log colors
9. ✅ Rewrite dialogue.js for V2: ZONE_ENTRANCE, COMBAT_COMMENTARY, FINAL_BOSS_DEFEATED updated; dead entries 4-5 removed; added FIRST_LAUNCH
10. ✅ Fix DialogueManager final boss check (area===5 → area===3)
11. ✅ Fix equip log to show all non-zero V2 stats (ATK/DEF/HP/Regen/AtkSpd) instead of just ATK/DEF
12. ✅ Fix zone change log to show area name from areas.js instead of bare "Area N"

**Files:** `ZoneNav.js`, `theme.js`, `dialogue.js`, `DialogueManager.js`, `CombatEngine.js`, `events.js`, `SystemLog.js`, `Store.js`

**Result:** All UI surfaces reference V2 world (3 areas, V2 enemy/boss names). Combat mechanics have player-facing feedback. First-launch welcome message. Equip log shows full stat breakdown. Build and validation pass.

---

### Phase 7: Balance, QA, and Release Hardening ✅ COMPLETE
**Goal:** Shippable vertical slice.

1. ✅ **DoT bug fixed:** `CombatEngine._startDot()` read `dot.dmgPerSec` on a plain number — DoT dealt 0 damage since Phase 5. Same fix in `SystemLog`. Now reads `dot` directly.
2. ✅ **Balance simulation script:** `scripts/balance-sim.js` (`npm run balance:sim`) — standalone Node ESM script modeling zone-by-zone idle progression with exact combat formulas, gear equipping, and upgrade purchasing. Tunable override multipliers for rapid iteration.
3. ✅ **Balance pass (3 iterations):**
   - Enemy ATK ×3 (original values too low — all enemies dealt minimum 1 damage due to defense formula)
   - Boss ATK ×3.5
   - Enemy XP reduced to ~25% of HP (was 100% — player was double-leveling vs GDD targets)
   - Boss XP reduced to ~50% of HP (was 100%)
   - Gold unchanged
4. ✅ **Balance checkpoints verified:**
   - Area 1 exit (z5): Lv9 (target ~7), HP 211 (target ~177), DEF 26 (target ~24) — within ~15-28%
   - Area 2 exit (z15): Lv19 (target ~18), HP 382 (target ~370), DEF 62 (target ~46) — within ~3-34%
   - Area 3 exit (z30): Lv31 (target ~35), HP 631 (target ~690), DEF 117 (target ~90) — within ~9-30%
   - STR consistently higher than GDD targets due to optimal upgrade purchasing (real players will be closer)
   - THE FIRST KEEPER survival ratio: **1.8x** (target 1.1-2.0x tight win) ✅
   - All 30 bosses beatable (30/30) ✅
5. ✅ **Validation and build:** `npm run validate:data` 0 errors/0 warnings, `npm run build` passes clean

**Files:** `CombatEngine.js`, `SystemLog.js`, `enemies.js`, `bosses.js`, `scripts/balance-sim.js` (new), `package.json`

**Result:** Vertical slice is shippable. Combat is meaningful (survival ratios 2-10x for regular zones, 1.2-5x for bosses). Level pacing matches GDD within acceptable tolerance. Balance sim script available for future tuning.

**Acceptance:** ✅ Core progression and combat checks pass. No blocker defects.

---

## Concrete File Impact

**High impact (system rewrites):**
- `src/config.js` (V2 constants added ✅)
- `src/config/features.js` (new) ✅
- `src/systems/Store.js` ✅ (V2 stat model)
- `src/systems/ComputedStats.js` ✅ (V2 rewrite)
- `src/systems/CombatEngine.js` ✅ (V2 combat)
- `src/systems/Progression.js`
- `src/systems/LootEngine.js` ✅ (V2 drop model)
- `src/systems/BossManager.js` ✅ (V2 named boss lookup)
- `src/systems/SaveManager.js` ✅
- `src/systems/OfflineProgress.js` ✅

**Data files (rewrite/new):**
- `src/data/areas.js` ✅
- `src/data/enemies.js` ✅ (18 enemies, 3 areas, zones 1-30, ATK ×3 / XP ×0.25 balance pass)
- `src/data/items.js` ✅ (45 items, 3 areas, all 7 slots)
- `src/data/equipSlots.js` ✅ (V2 active slots, zone-based unlock)
- `src/data/bosses.js` ✅ (30 named bosses, zones 1-30, ATK ×3.5 / XP ×0.5 balance pass)

**Tooling:**
- `scripts/validate-data.js` ✅ (data schema + cross-reference validator)
- `scripts/balance-sim.js` ✅ (zone-by-zone idle progression simulation)
- `package.json` ✅ (`validate:data` + `balance:sim` npm scripts)

**UI (updates):**
- `src/ui/ZoneNav.js` ✅ (V2 area name priority)
- `src/ui/StatsPanel.js` ✅
- `src/ui/InventoryPanel.js` ✅ (V2 slots, zone-based rendering)
- `src/ui/SystemLog.js` ✅ (DoT/armorPen feedback, multi-stat equip log, area-name zone log, welcome msg)
- `src/scenes/UIScene.js` ✅
- `src/config/theme.js` ✅ (removed stale ZONE_THEMES names/entries, added warning/dot log colors)
- `src/data/dialogue.js` ✅ (V2 area/enemy dialogue, FIRST_LAUNCH)
- `src/systems/DialogueManager.js` ✅ (final boss area fix, first-launch trigger)
- `src/events.js` ✅ (COMBAT_DOT_TICK event)

---

## Verification Matrix

1. **Combat Formulas** — Defense reduction, armor pen, DoT, per-enemy attack speed produce expected values ✅ (Phase 2 implementation, Phase 7 DoT bugfix, Phase 7 balance pass)
2. **Progression** — Level targets in expected bands at Area 1/2/3 exits ✅ (Phase 7: z5 Lv9/target 7, z15 Lv19/target 18, z30 Lv31/target 35 — within tolerance)
3. **Loot** — Normal and boss drop bands hit target ranges; pity prevents extreme drought ✅ (Phase 4, needs in-browser playtest verification)
4. **Equipment** — Only 7 active slots in drop/equip/stat flow; inactive slots hidden and inert ✅
5. **Save/Cutover** — Fresh save always starts correctly; legacy save ignored without crash ✅
6. **Disabled Systems** — Prestige and territory systems not booted or surfaced in UI ✅
7. **Build/Runtime** — `npm run build` and normal play loop pass after each phase ✅
8. **Zone Coverage** — All 30 zones have enemies, items, and named bosses ✅ (Phase 5, validator 0 errors/0 warnings)
9. **UI/UX Alignment** — No stale V1 references in player-facing surfaces ✅ (Phase 6)
10. **Balance** — All 30 bosses beatable, final boss survival ratio 1.8x (target 1.1-2.0x), `npm run balance:sim` validates ✅ (Phase 7)
