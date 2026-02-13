# CHANGELOG

## 2026-02-13 — Inventory UX Overhaul: Drag, Tooltips, Sell Zone
- **Equip slot highlighting**: hovering or selecting an inventory item highlights the target equipment slot with an amber border
- **Drag-to-equip**: drag an inventory item onto its target equipment slot to equip it; ghost text follows cursor during drag
- **Drag-to-sell**: SELL drop zone in the upper-right of inventory; drag any item onto it to sell the full stack; highlights on hover during drag
- **Cursor-following tooltips**: compact tooltip (280px) follows the mouse instead of fixed at panel bottom; shows stats with inline green/red comparison diffs, description, and "vs." reference line
- **Font size increase**: all inventory panel text bumped +2px for readability
- **Crisp text rendering**: added `roundPixels: true` to Phaser game config, fixing sub-pixel blur on centered text

---

## 2026-02-13 — Inventory Hover Tooltip with Equipment Comparison
- **Hover tooltips**: hovering any equipped or inventory item shows full stats and description in a tooltip at the bottom of the panel
- **Equipment comparison**: hovering an inventory item shows stat diffs (green +N / red -N) vs. the currently equipped item in that slot; shows "Nothing equipped" when slot is empty
- **All stats shown**: tooltip displays all non-zero stat bonuses (ATK, DEF, HP, REGEN, ATK SPD, STR) — weapons skip redundant STR when it equals ATK

---

## 2026-02-13 (GDD Hard Pivot — Phase 7: Balance, QA, and Release Hardening)
- **DoT bug fixed**: `CombatEngine._startDot()` and `SystemLog` now read `dot` as a plain number instead of `dot.dmgPerSec` — DoT damage actually works now (was dealing 0 since Phase 5)
- **Balance pass**: enemy ATK tripled, boss ATK ×3.5, enemy XP reduced to ~25% of HP, boss XP to ~50% of HP — survival ratios now meaningful instead of infinite
- **Balance simulation script**: `npm run balance:sim` — standalone Node ESM script that models zone-by-zone idle progression with exact combat formulas, gear, and upgrades
- **Final boss validated**: THE FIRST KEEPER survival ratio 1.8x (target 1.1-2.0x), all 30 bosses beatable, level/HP checkpoints within ~10% of GDD targets
- **Build clean**: `npm run validate:data` 0 errors/0 warnings, `npm run build` passes

---

## 2026-02-13 (GDD Hard Pivot — Phase 6: UI and UX Alignment)
- **Area names fixed**: ZoneNav now shows V2 area names ("The Harsh Threshold", "The Overgrown Frontier", "The Broken Road") instead of old ZONE_THEMES names; dead theme entries 4-5 removed
- **Combat mechanic feedback**: enemy spawn log warns about Armor Penetration and DoT; DoT ticks shown every 5 seconds in SystemLog; new `COMBAT_DOT_TICK` event
- **Dialogue V2 alignment**: ZONE_ENTRANCE, COMBAT_COMMENTARY, and FINAL_BOSS_DEFEATED rewritten for V2 area names and enemies; dead entries 4-5 removed; final boss check fixed from area 5 to area 3
- **Equip log upgraded**: now shows all non-zero stat bonuses (STR, DEF, HP, Regen, AtkSpd) instead of just ATK/DEF; zone change log shows area name
- **First-launch welcome**: new players see "Welcome to the Harsh Threshold. Survive." in SystemLog and SYSTEM dialogue

---

## 2026-02-13 (GDD Hard Pivot — Phase 5: Area 2-3 Content Rollout)
- **15 new enemies**: 5 Area 2 (Rot Vine Crawler, Mire Lurker, Wisp Swarm, Blight Stalker Evolved, Bog Revenant) + 10 Area 3 (Stone Sentry, Fractured Echo, Ruin Pilgrim, Shade Remnant, Blighted Guardian, Ruin Pilgrim Frenzied, Hearthguard Construct, Blighted Scholar, Corruption Tendril, Shade of the Keeper) — introduces DoT at zone 11, armorPen at zone 21
- **39 new items**: Area 2 has 2 common tiers (zones 6-10, 11-15) + uncommons (zones 8-15) for 5 slots; Area 3 has 3 common tiers (zones 16-20, 21-25, 26-30) + uncommons for all 7 slots including gloves/amulet
- **25 new bosses**: 10 Area 2 (Rootmaw through THE LOST WARDEN) + 15 Area 3 (The Forgotten through THE FIRST KEEPER) — hand-tuned stats from GDD, ELITE at zones 10/20/25, AREA at zones 15/30
- **Full zone coverage**: all 30 zones now have enemies, items, and named bosses; validator passes with 0 errors, 0 warnings

---

## 2026-02-13 (GDD Hard Pivot — Phase 4: Loot and Equipment V2)
- **V2 drop model** (`LootEngine.js`): replaced V1 per-area drop rates + per-enemy loot tables with V2 system — 10% normal drop chance, 100% boss drops, zone-based item pools filtered by `item.zones` range
- **Boss loot differentiation**: first-kill = guaranteed drop with 30% uncommon chance; repeat-kill = guaranteed drop with 11% uncommon chance (exploits BossManager's 1300ms delayed `recordBossDefeated` for timing)
- **Pity system** (`Store.js` + `LootEngine.js`): per-slot pity counters increment on every boss defeat, reset on drop; after 5 boss kills without a drop for a slot, that slot's selection weight doubles
- **7 active equipment slots** (`equipSlots.js`): zone-based unlock replaces tier-based — head/chest/main_hand at zone 1, legs at zone 6, boots at zone 9, gloves at zone 17, amulet at zone 22; no accessory row
- **Data validator**: item zone coverage check ensures every Area 1 zone has droppable items (warns for Areas 2-3)

---

## 2026-02-12 (GDD Hard Pivot — Phase 3: BossManager V2)
- **Named boss lookup** (`BossManager.js`): `generateBossTemplate()` now looks up hand-authored bosses from `bosses.js` via `getBossForZone()` instead of auto-generating from enemy template multipliers
- **Boss data gating**: `isChallengeReady()` and `_checkThreshold()` now verify a named boss exists for the zone before enabling the challenge button
- **BossChallenge UI** (`BossChallenge.js`): challenge button shows named boss name (e.g. "CHALLENGE ROTFANG", "CHALLENGE THE HOLLOW") instead of generic "CHALLENGE BOSS"
- **Sprite resolution**: bosses inherit sprites from `baseEnemyId` enemy with `bossType.sizeMult` scaling; boss data can override with its own sprites

---

## 2026-02-12 (GDD Hard Pivot — Phase 2: Combat and Stat Engine V2)
- **V2 stat model** (`Store.js`): player stats switched from str/vit/luck to str/def/hp/regen — createInitialState, hydrateState, applyLevelUp, resetPlayerStats all use `PROGRESSION_V2`
- **ComputedStats rewrite** (`ComputedStats.js`): equipment stat summing via `getEquipmentStatSum()`, new exports `getEffectiveDef`, `getPlayerAtkSpeed`, `getPlayerAutoAttackInterval`, `getHpRegen` — flat regen model replaces %-of-maxHP
- **V2 combat engine** (`CombatEngine.js`): V2 damage formulas (`COMBAT_V2.playerDamage/enemyDamage`), per-enemy attack speed timers, gear-based player attack speed, DoT system (`combat:enemyDot` ticker), defense/armorPen on enemy spawn
- **BossManager V2 fields**: boss templates now pass through defense, armorPen, attackSpeed, dot from base enemies
- **StatsPanel V2 UI**: base stats show DEF/HP/REGEN instead of VIT/LUCK; combat descriptions updated for V2 formulas
- **V1 constant purge**: all `COMBAT`/`PROGRESSION` imports replaced with V2 equivalents across OfflineProgress, UpgradeManager, GameScene — no remaining V1 combat/progression references in src/

---

## 2026-02-12 (GDD Hard Pivot — Phase 1: Data Contracts + Area 1 Content)
- **V2 constants** (`config.js`): added `PROGRESSION_V2`, `COMBAT_V2`, `LOOT_V2` alongside V1 constants — new stat model (str/def/hp/regen/atkSpeed), combat formulas, and loot tuning
- **V2 enemies** (`enemies.js`): replaced 13 V1 enemies with 3 Area 1 enemies (Feral Hound, Thornback Boar, Blighted Stalker) — new schema adds attackSpeed, defense, armorPen, dot, zone-range filtering
- **V2 items** (`items.js`): replaced 12 V1 items with 6 Area 1 items (3 common, 3 uncommon) — new schema adds str/hp/regen/atkSpeed stats, `atk` alias for backward compat; `getScaledItem()` now scales all stat fields
- **V2 bosses** (`bosses.js`): new file with 5 named Area 1 bosses (Rotfang → THE HOLLOW) — not consumed until Phase 3 BossManager rewrite
- **V2 areas** (`areas.js`): 3 areas (The Harsh Threshold / The Overgrown Frontier / The Broken Road, zones 1-30) with zone-range enemy filtering replacing progressive-unlock model
- **Data validator** (`scripts/validate-data.js`): schema + cross-reference validator for enemies, items, bosses, areas; `npm run validate:data`

---

## 2026-02-12 (GDD Hard Pivot — Phase 0: Cutover Scaffold)
- **Feature gates** (`src/config/features.js`): prestige, territory, town, cheats all disabled for the vertical slice
- **New save namespace** `litrpg_idle_vslice_save` with schema v1 — fresh start, no progression carryover; legacy saves archived non-destructively under `litrpg_idle_legacy_archive`
- **Boot guards**: PrestigeManager, CheatManager, FirstCrackDirector only init when feature-enabled; PrestigePanel, CheatDeck, MAP button conditionally hidden in UIScene
- **OverworldScene** excluded from Phaser scene list when territory disabled
- **Build verified** clean — game boots and runs combat loop with all disabled systems safely inert

---

## 2026-02-12 (Character Silhouette Equipment Screen)
- **Equipment slot data** (`src/data/equipSlots.js`): declarative definitions for 33 equipment slots across 8 tiers (0–7), with body anchors, side placement, and tier-gated unlock helpers
- **Silhouette paper-doll layout**: inventory panel left side now shows a dimmed player sprite with equipment slots in left/right columns connected by lines to body anchor points, plus accessory grid below
- **Panel resized** to 880x560 (from 700x450) — separator and inventory grid/detail shifted right to accommodate equipment zone
- **Store equipped expansion**: `equipped` object now holds all 33 slot IDs (was 4); save migration renames old `body`→`chest`, `weapon`→`main_hand`
- **Equip slot resolution**: `InventorySystem._resolveEquipSlot()` maps item slot fields to equipped keys, with ring→ring1/ring2 disambiguation

---

## 2026-02-11 (Codebase Redesign — Phase 9: Offline Progress Engine)
- **Offline progress engine** (`src/systems/OfflineProgress.js`): rate-based catch-up rewards on load — computes gold/XP/fragments from player DPS × zone enemy pool × clamped offline duration (60s min, 12h max)
- **SystemLog summary**: "Welcome back! +X Gold, +Y XP" line with fragment/level-up info on game load
- **SYSTEM dialogue**: snarky welcome-back quip from 5 new `OFFLINE_RETURN` lines (triggers if away >5 min)
- **Config**: added `SAVE.minOfflineTime` (60s threshold to skip quick reloads)

---

## 2026-02-11 (Codebase Redesign — Phases 3, 6–8)
- **Config decomposition** (Phase 3): split `config.js` into `config/layout.js` (LAYOUT, TERRITORY) + `config/theme.js` (COLORS, ZONE_THEMES, PARALLAX, TREE_ROWS, FERN_ROWS, UI) — `config.js` re-exports for backward compat
- **CombatEngine decomposition** (Phase 6): kill reward orchestration (gold, XP, kill counters) moved into `Progression.grantKillRewards()` — CombatEngine now focused on enemy lifecycle + attack resolution
- **Unified kill tracking** (Phase 7): all kill counting centralized in Progression — BossManager simplified to threshold check, TerritoryManager kill listener removed (reads Store on demand)
- **EventScope helper** (Phase 8): `createScope()` in events.js replaces manual `unsubs` arrays across all 7 system singletons — eliminates leak risk
- **Event contracts** (Phase 8): dev-mode payload validation for `COMBAT_ENEMY_KILLED`, `STATE_CHANGED`, `PRESTIGE_PERFORMED`, `TERRITORY_CLAIMED`

---

## 2026-02-11 (Codebase Redesign — Store Slimming)
- **Progression module** (`src/systems/Progression.js`): extracted XP/level-up loop from Store into `Progression.grantXp()` — Store now exposes `addRawXp()` and `applyLevelUp()` as primitives
- **PrestigeManager owns prestige reset**: prestige orchestration moved from `Store.performPrestige()` into `PrestigeManager.performPrestige()`, calling granular Store mutations
- **New Store mutations**: `addFlatStat()`, `retainGold()`, `incrementPrestigeCount()`, `resetPlayerStats()`, `resetPurchasedUpgrades()`, `resetTotalKills()`, `resetAreaProgress()`
- **UpgradeManager mutation fix**: direct `state.playerStats.str +=` replaced with `Store.addFlatStat()` — no more bypassing Store mutation boundary
- **Legacy cleanup**: removed `Store.setZone()`, `Store.setFurthestZone()`, `Store.addXp()`, `Store.performPrestige()`, and dead state fields (`currentWorld`, top-level `furthestZone`)

---

## 2026-02-11 (Codebase Redesign — Phase 1 + Phase 2 complete)
- **ModalPanel base class** (`src/ui/ModalPanel.js`): extracted shared modal lifecycle (backdrop, panel chrome, toggle button, mutual exclusion, keyboard binding, event subscriptions, dynamic object management) into a single base class
- **All 5 modal panels refactored** to extend ModalPanel — InventoryPanel, UpgradePanel, PrestigePanel, SettingsPanel, StatsPanel now only contain their unique content logic (~400 lines of duplicated boilerplate eliminated)
- **ScrollableLog base class** (`src/ui/ScrollableLog.js`): extracted shared scroll/mask/render logic from SystemLog and SystemDialogue (~120 lines eliminated)
- **ui-utils.js** (`src/ui/ui-utils.js`): `makeButton()` helper (replaces 20+ inline pointer handler blocks), `TEXT_STYLES` presets, `addText()` helper
- **UIScene.closeAllModals()**: centralized modal registry replaces 5 hardcoded if-checks in `_toggleMap()` and per-panel mutual exclusion
- **ComputedStats module** (`src/systems/ComputedStats.js`): pure functions for all derived stats (effective damage, max HP, crit chance, gold/XP multipliers, HP regen, etc.)
- **CombatEngine + Store** now delegate to ComputedStats — Store HP methods (damage, heal, max, reset, prestige) use `getEffectiveMaxHp()`, fixing territory maxHP buff bug
- **StatsPanel** refactored to use `ComputedStats.getAllStats()`, removing direct imports of CombatEngine, UpgradeManager, InventorySystem, and DAMAGE_FORMULAS

---

## 2026-02-10 (Character Stats Panel)
- New STATS [C] panel showing all player stats in one place (base stats, combat, economy, progression)
- Two-column layout: left shows LEVEL/STR/VIT/LUCK + combat stats (MAX HP, DMG, CRIT, ATK SPEED), right shows ECONOMY + PROGRESSION
- Territory buff breakdowns shown inline (e.g. "7 + 2" for STR with territory bonus)
- Auto-refreshes on level up, upgrade purchase, territory claim, equip/unequip, prestige
- Mutual exclusion with all other modal panels (BAG, UPGRADES, PRESTIGE, SETTINGS, MAP)

---

## 2026-02-10 (Rarity-Separated Inventory Stacks + Stat Scaling)
- Items of different rarities now occupy separate inventory slots (Iron Dagger Common ≠ Iron Dagger Rare)
- Rarity now scales stats and sell value: common ×1, uncommon ×1.5, rare ×2.5, epic ×5
- Inventory uses composite stack keys (`itemId::rarity`) so each rarity variant is its own stack
- Equipment preserves rolled rarity through equip/unequip cycle
- Save migration v7→v8 converts existing inventory and equipment to new format

---

## 2026-02-10 (Grid-Based Slotted Inventory)
- Inventory panel now uses a 5x4 visual grid (20 slots) with 64px slot boxes instead of a text list
- Equipment section shows 4 box slots (HEAD/BODY/WEAPON/LEGS) with item abbreviations and rarity-colored borders
- Filled inventory slots display 4-char item abbreviation, rarity border color, and gold count badge (x3)
- Selected slot shows item detail panel below grid: name, rarity, slot, stat bonus, description, Sell/Equip buttons
- Added `abbr` field to all 12 items in items.js (IrDa, IrHe, LeTu, StSw, etc.)

---

## 2026-02-10 (ZoneNav Polish)
- Sewer Rat HP halved (100 → 50) for easier early game
- ZoneNav text: black stroke outlines, brighter colors, no transparency
- Navigation arrows moved closer to labels (area ±90px, zone ±65px)
- Arrows now hidden entirely when navigation in that direction is unavailable

---

## 2026-02-10 (Zone/Area Progression Restructure)
- Restructured flat 5-zone system into 5 areas with 34 total zones (Sewers 5, Wilderness 7, Deep Caverns 7, Volcanic Ruins 10, Dragon's Lair 5)
- Progressive enemy unlocks within areas: zone 1 = weakest enemy only, zone 2 adds next, zone 3+ adds all
- Zone scaling: enemies get 15% stronger per zone within an area
- Boss gate system: kill threshold per zone unlocks "Challenge Boss" button (mini-boss 3x, elite 5x every 5th, area boss 8x last zone)
- Two-tier navigation UI: area arrows (top row) + zone arrows (bottom row) with boss progress indicator
- Area bosses unlock next area on defeat; prestige resets zone progress but keeps area high-water mark
- Save migration v6→v7: existing progress mapped generously to new area/zone hierarchy
- Boss dialogue: encounter/defeat/area-clear lines with elite and final boss variants

---

## 2026-02-10 (Overworld Territory Map)
- Added overworld map overlay (M key / MAP button) with 13 conquerable territories across 5 zones
- Each territory requires kill threshold + gold cost to claim, grants a permanent buff (gold gain, XP, crit, STR, VIT, HP regen, damage, attack speed, fragment drops, max HP)
- Territory progress and conquered status persist across prestige resets
- Buff integration: CombatEngine (damage, gold, XP, crit, regen, max HP), LootEngine (fragment drops), UpgradeManager (attack speed)
- Save schema bumped to v6 with migration for killsPerEnemy/territories state

---

## 2026-02-08 (Parallax Spacing & Growth Tuning)
- Fixed fern clumping: spacing-aware respawn places each fern one step after the rightmost in its row
- Initial fern spawn enforces minimum step spacing with small forward jitter (no more overlaps)
- All tree rows now grow [0.8, 1.5] — continuous scaling from spawn to despawn with no plateau
- Front fern row moved down (yMin 540, yMax 560); back fern row raised 5px and sped up 20%
- Mid fern row speed matched to near tree row (speedMult 1.0)

---

## 2026-02-08 (Parallax Polish Pass)
- Added dense fern row between mid and near tree rows (depth -0.25, tight spacing)
- Tree perspective growth now spans full off-screen-to-despawn range (no flat spots)
- Near tree row downward drift increased to diagMult 1.2; far row speed bumped 20%
- Mid background scroll slowed to 0.4× front speed; shifted down to Y=380
- Back fern row moved down 5px and made less transparent (alpha 0.85)
- Tree wrap padding tightened (0–30px) and spawn range extended to 1.5× screen width for fewer gaps

---

## 2026-02-08 (Parallax Depth & Perspective Tuning)
- Perspective growth: trees and ferns scale from 90% → 130% (trees) / 110% (ferns) as they travel right to left
- Per-row `diagMult` controls downward drift rate independently from global `treeDiagRatio`
- Tree spawn Y ranges tightened (50% closer to end position) for subtler vertical travel
- Mid background layer shifted down 30px; mid fern row opacity increased to 0.85

## 2026-02-08 (Tree & Fern Parallax Overhaul)
- Replaced front layer strip system with individual tree sprites scrolling diagonally (upper-right → lower-left)
- Trees render as normal sprites with PNG transparency — no blend mode tricks needed
- Added fern rows (3 depth layers) and bare ground overlay (foreground001_bare) between foreground and ferns/trees
- Configurable diagonal slope via `treeDiagRatio` and `fernDiagRatio` in PARALLAX
- Mid fern row depth adjusted to render in front of near tree row

---

## 2026-02-08 (Diagonal Scroll Fix)
- Front layer strips now tile in a 2×2 grid (4 images per strip) for seamless vertical + horizontal wrapping
- Per-strip diagonal Y offset: rightmost strip (VP) sits 200px above leftmost, creating a diagonal top edge
- Vertical drift no longer pops — modulo wraps at tile height instead of fixed yDriftRange
- Config: added `frontDiagPx`, removed `yDriftRange`

---

## 2026-02-08 (Vertical-Strip Pseudo-3D)
- Front layer strips switched from horizontal bands to vertical columns for upper-right VP convergence
- Right strips (VP) are narrow + slow; left strips (camera) are wide + fast — perspective width variation
- Horizontal features (bricks, pipes) now bend/slant toward VP instead of vertical features bending
- Texture frames slice source image into vertical columns with integer-quantized widths (no seams)
- Removed unused `diagonalOffsetPx` config; convergence is now inherent in strip width distribution

## 2026-02-08 (Pseudo-3D Scanline Parallax)
- Zone 1 bg layers now use strip-based perspective scrolling (10 strips per layer)
- Per-strip scroll speed creates OutRun-style perspective depth within each layer
- Custom texture frames with integer-quantized sizes prevent sub-pixel seams
- Parallax and ground scroll converted to delta-based timing (FPS-independent)
- New `PARALLAX` config: `strips`, `perspectivePow`, `baseSpeedPxPerSec`

---

## 2026-02-08 (Combat UI Polish)
- Damage numbers: larger font sizes (+6-10px per tier), all bold, 4px black stroke, brighter yellows
- Damage numbers stay fully opaque for 70% of lifetime, fade only in the last 30%
- HP bars moved to bottom of battle window (60px from edge); name labels sit just above them
- Name labels (Player + enemy) have 4px black stroke outline for readability

---

## 2026-02-08 (White Defeat Lines + Context Lines + Panel Headers)
- Defeat lines in system log now render white instead of yellow (new `defeat` color type)
- SYSTEM dialogue window shows context lines above responses (muted `> Sewer Rat defeated!` style) so player knows what triggered the comment
- Context strings added to 15+ dialogue triggers; ambient/delayed lines intentionally omit context
- Direct DIALOGUE_QUEUED emitters (FirstCrackDirector, CheatManager, UpgradePanel) also carry context
- Dialogue panel header: "SYSTEM'S LOG" in bold bright green (18px); system log header: "SYSTEM LOG" in white (9px)

---

## 2026-02-08 (SYSTEM Dialogue Window)
- New SYSTEM dialogue panel above the system log (top 150px of right sidebar)
- Emotion-based text styling: sarcastic (yellow), angry (red/bold), impressed (green/bold), worried (blue/italic), neutral (white)
- Each `say()` call in DialogueManager now carries an emotion tag; FAILED_PURCHASE in UpgradePanel also tagged
- System log pushed down to y=201 (auto-adjusts via LAYOUT.logPanel); both panels scroll independently

---

## 2026-02-08 (Player Attack Sprites)
- Player now shows a random attack pose (7 sprites: punch, kick, elbow, jab, etc.) when hitting enemies
- Attack pose displays for 400ms then reverts to default stance
- Triggers on both click attacks and auto-attacks via existing COMBAT_ENEMY_DAMAGED event
- Player shows hit reaction sprite when taking enemy damage (400ms, with red tint flash)

---

## 2026-02-07 (Ground Layer + Background Overhaul)
- Added ground section covering bottom 25% of game area using ground001 texture
- Replaced background001 parallax images with background002 set
- Front parallax layer overlaps ground and scrolls together with it
- Rear and mid parallax layers sized to 83% height, sitting above the ground
- Ground and front layer scroll in sync at the same speed

---

## 2026-02-07 (Sewer Rat Sprites)
- Sewer Rat: 4 sprite poses (default, reaction, attack, dead) replacing red rectangle fallback
- Per-enemy sprite sizing: enemies can define custom spriteSize in data (Sewer Rat: 125x125)

---

## 2026-02-07 (Player Sprite + Layout Polish)
- Player sprite: replaced blue rectangle with Player001_default.png, scaled 50% larger (300x375)
- Moved player and enemy name labels higher above sprites
- Moved enemy HP bar below the enemy sprite

---

## 2026-02-07 (Settings Menu + Bug Fix)
- Settings panel: SETTINGS button in bottom bar + ESC key toggle, modal with close button and backdrop click-to-dismiss
- Wipe Save: two-click confirmation (3s timeout) that clears localStorage and reloads for a fresh start
- Mutual exclusion with all other panels (Inventory, Upgrades, Prestige)
- Fixed invisible enemy bug: death animation tweens outlasted spawn delay, fading new enemy to 0 alpha
- Increased enemy spawn delay from 400ms to 1000ms to let death animations complete

---

## 2026-02-07 (Post-Phase: Goblin Sprites + Enemy Attack / Player HP)
- Enemy sprite system: Goblin Grunt renders with 4 poses (default, reaction, attack, dead) instead of red rectangle; pose-switching on combat events
- Enemy attack mechanic: enemies deal damage to player every 3s, triggering attack pose on sprite enemies
- Player HP system: HP bar under player, HP = VIT * 10, 2% regen/sec, death at 0 HP pauses combat + respawns after 1.5s
- HP resets on level-up (VIT growth) and prestige; playerHp persists in save data
- Non-goblin enemies still render as red rectangles (graceful fallback for enemies without sprites)
- Sprite enemies use fade-only death animation (no squish/scale tweens) to avoid display size warping

---

## 2026-02-07 (Phase 8)
- 80+ SYSTEM dialogue lines across 15 trigger categories (data-driven `src/data/dialogue.js`), replacing hardcoded strings in DialogueManager
- Visual juice: gold particles on kill, expand→shrink death animation, level-up golden flash, cheat activation glitch effect
- Magnitude-tiered damage numbers (size/color/shake/glow scale with damage), screen shake on 100K+/1M+ hits
- Procedural parallax backgrounds per zone (5 themes, 3 scrolling layers each)
- Balance pass: ~50% HP reductions, XP bumps zones 2-3, cheaper early upgrades, faster auto-attack (800ms) + spawn (400ms), higher fragment/loot drop rates

---

## 2026-02-06 (Phase 7)
- Prestige loop: reset at zone 4+ for permanent +25% damage/gold/XP multiplier per prestige
- PrestigePanel modal with keeps/resets/gains display and two-click confirm safeguard
- PrestigeManager tracks furthestZone (permanent high-water mark), eligibility, and prestige execution
- TopBar prestige counter (P1 x1.25), SYSTEM dialogue on prestige available/performed + 5s post-prestige combat snark
- Save migration v3→v4 for furthestZone + firstPrestige flag; SAVE_REQUESTED event for immediate saves

---

## 2026-02-06 (Phase 6)
- Loot Hoarder cheat: auto-merges 10 items into 1 higher-tier weapon (iron_dagger→steel_sword→mithril_blade→adamantine_axe→dragonbone_blade chain)
- CheatDeck bottom bar UI: toggleable cheat cards with pulsing green glow, hidden until first cheat unlocked
- CheatManager: auto-unlocks Loot Hoarder at 10 glitch fragments with SYSTEM dialogue
- Drop pacing boost when Loot Hoarder active: 3x items per drop + 1.5x drop chance (capped 80%)
- Save migration v2→v3 for activeCheats, firstMerge flag; cheat data module at `src/data/cheats.js`

---

## 2026-02-06 (Phase 5)
- Upgrade system: 4 legit upgrades (gold-cost) + 2 exploit upgrades (fragment-cost) with scaling costs and max levels
- First Crack event at kill #20: scripted 4-step SYSTEM dialogue sequence, permanently sets crits to 10x
- Glitch fragment drops (5% after crack) with first-fragment SYSTEM snark dialogue
- UpgradePanel modal overlay with UPGRADES [U] toggle, mutual exclusion with inventory panel
- CombatEngine applies upgrade multipliers to damage/gold/crit/speed; save migration v1→v2 for new state fields

---

## 2026-02-06 (Phase 4)
- Loot system: enemies drop items on kill (40%/35%/30%/25%/20% by zone), weighted random from loot tables
- 12 items across 5 zones (weapons, head, body, legs) with stat bonuses in `src/data/items.js`
- Inventory system: stack-based (max 20 unique stacks), equip/unequip/sell via InventorySystem module
- InventoryPanel modal overlay: BAG [I] toggle, equipment slots + inventory grid + sell/equip buttons
- CombatEngine now reads equipped weapon ATK for damage; SystemLog + DialogueManager wired for loot events

---

## 2026-02-06 (Phase 3)
- UI Shell: TopBar (gold/mana/fragments + level/XP bar with pop-tween), SystemLog (scrollable masked green monospace log, color-coded by event type), ZoneNav (arrow navigation for zones 1-5)
- UIScene parallel overlay orchestrating all UI components
- DialogueManager with flag-gated one-shot SYSTEM triggers (first kill, first level-up, Zone 2)
- LAYOUT + COLORS constants in config.js; Store.setFlag() mutation method
- GameScene combat elements repositioned to 960px game area (right 320px reserved for log)
- Kill log lines condensed: "Sewer Rat defeated! +5 Gold, +8 XP" (single line per kill)

---

## 2026-02-06 (Phase 2)
- Combat loop: click enemy → damage → death → gold/XP → respawn after 500ms
- Enemy data for World 1 (5 zones, 13 enemies) in `src/data/enemies.js`
- TimeEngine tick scheduler with register/unregister/scheduleOnce
- CombatEngine module — damage calc, crit rolls (5%/2x), death/spawn cycle
- GameScene with HP bar, floating damage numbers, hit flash, death animation
- BootScene → GameScene auto-transition after 1s

## 2026-02-06 (Phase 1)
- BigNum utility module (`D()`, `format()`, Decimal re-export)
- Centralized Store with named mutation methods (addGold, addXp, etc.)
- SaveManager with localStorage persistence, backup rotation, migration framework
- TimeEngine stub for boot sequence
- Boot sequence wired: Store.init() → SaveManager.init() → TimeEngine.init() → Phaser

## 2026-02-06 (Phase 0)
- Phase 0 complete: Vite + Phaser 3 + break_infinity.js scaffolded
- EventBus with 33 canonical events (`src/events.js`)
- Balance/config constants for all game systems (`src/config.js`)
- BootScene renders green pulsing rectangle as proof of life
- Dev server, production build, and Phaser chunking all working

---

## 2026-01-24
- Initialized governance-only memory system (CLAUDE.md + .memory files).
