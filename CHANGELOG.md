# CHANGELOG

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
