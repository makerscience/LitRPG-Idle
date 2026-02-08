# CHANGELOG

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
