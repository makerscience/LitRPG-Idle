# LitRPG Clicker — MVP Build Plan (Revised)

## Decision Summary

| Decision | Choice |
|---|---|
| Developer | Solo, newer to coding |
| MVP World | World 1: Fantasy + Loot Hoarder cheat |
| Timeline | No deadline, quality first |
| Platform | Desktop-first (Itch.io) |
| Saves | localStorage (MVP) **with schema version + migration** |
| SYSTEM Dialogue | Curated ~50–100 lines (data-driven triggers) |
| Art | Placeholder first, swap later |
| Big Numbers | break_infinity.js (wrapped; avoid excess allocations) |
| Prestige | Keep cheats/titles; reset world progress; multiplier scaling |
| Done = | 15–30 min playable demo for forum feedback |

---

## The "Future Issues" We're Defusing Up Front

1. **Event spaghetti**
   Early projects drift into "enemyKilled / enemy-killed / enemy_dead"… and nothing listens anymore.
   **Fix:** one canonical `events.js` map + namespaced event names + documented payloads in `ARCHITECTURE.md`.

2. **State desync (aka "why is my DPS wrong?")**
   A big central state is correct, but chaos starts when multiple systems mutate overlapping fields.
   **Fix:** treat game state as *data only*. All writes go through Store's explicit named methods (e.g. `store.addGold(amount)`). Compute derived stats in one place.

3. **Inventory scale will murder localStorage**
   If you store 10,000 swords as 10,000 objects, saves balloon and merge scans get slow.
   **Fix:** represent inventory as **stacks/counts keyed by itemId**, not object-per-drop.

4. **Offline progress + auto-merge can freeze the browser**
   Simulating every missed second via loops causes lock-ups on return.
   **Fix:** cap offline time, compute gains with coarse math, apply merges arithmetically (count→tier promotion), not animation loops.

5. **Phaser scene lifecycle leaks**
   Parallel scenes make duplicate listeners/timers easy to create.
   **Fix:** every system gets `init()` + `destroy()` and unsubscribes from EventBus on shutdown.

---

## Architecture Overview

```
litrpg-clicker/
├── index.html
├── package.json
├── vite.config.js
├── ARCHITECTURE.md            ← event names + system responsibilities (Phase 0)
├── src/
│   ├── main.js                ← Phaser boot + scene startup
│   ├── config.js              ← balance + constants + damage formulas (no logic)
│   ├── events.js              ← canonical event name map + helper emit/on
│   ├── scenes/
│   │   ├── BootScene.js       ← load assets
│   │   ├── GameScene.js       ← battle stage + world visuals
│   │   └── UIScene.js         ← HUD overlay, panels, log
│   ├── systems/
│   │   ├── Store.js           ← single source of truth + explicit mutation methods
│   │   ├── BigNum.js          ← break_infinity wrapper + format + JSON
│   │   ├── TimeEngine.js      ← tick scheduling + offline delta (stub Phase 1, build Phase 2)
│   │   ├── CombatEngine.js    ← enemy lifecycle + damage + deaths
│   │   ├── Progression.js     ← XP, level-ups, stat growth
│   │   ├── LootEngine.js      ← drop rolls + item generation
│   │   ├── InventorySystem.js ← stacks, equip/sell, merge math
│   │   ├── UpgradeManager.js  ← legit + exploit upgrades
│   │   ├── CheatManager.js    ← cheat unlocks + toggles
│   │   ├── PrestigeManager.js ← reset rules + multiplier
│   │   ├── DialogueDirector.js← SYSTEM lines + trigger gating
│   │   └── SaveManager.js     ← localStorage, schemaVersion, migrations
│   ├── ui/
│   │   ├── TopBar.js
│   │   ├── SystemLog.js
│   │   ├── CheatDeck.js
│   │   ├── CharacterSheet.js
│   │   └── InventoryPanel.js
│   ├── data/
│   │   ├── enemies.json
│   │   ├── items.json
│   │   ├── upgrades.json
│   │   └── dialogue.json
│   └── utils/
│       └── NumberFormat.js
```

**Removed from MVP scope:**
- `RNG.js` (seeded RNG) — no player-facing benefit for a single-player demo. Add post-MVP if needed for reproducible testing.
- `validateData.js` (JSON validation) — you're the only one writing the data files. Malformed JSON will error immediately in the console. Add when collaborators join or data files grow complex.

---

## The Plan: 8 Phases

### Phase 0: Environment Setup + Guardrails
**Goal:** runnable Phaser project *plus* the basic discipline scaffolding.

1. Install Node.js, create project folder, `npm init`
2. `npm install phaser break_infinity.js`
3. Set up Vite (`npm install vite --save-dev`)
4. Create `index.html` with `<div id="game">`
5. Create `src/main.js` booting Phaser with a blank scene; draw a colored rectangle
6. Set canvas size 1280×720
7. Init git repo. Commit after every phase.
8. Add `ARCHITECTURE.md` (see companion file)
9. Add `src/events.js` with canonical event strings (no ad-hoc event names)
10. Add `src/config.js` with damage formulas for all three tiers (mortal/awakened/godhood). MVP uses `mortal` only, but having all three defined as data from the start means the tier transition is a config change, not a code rewrite.
11. (Optional) ESLint + Prettier to prevent code sprawl

**Done when:** rectangle renders + repo clean + ARCHITECTURE.md + events.js + config.js committed.

---

### Phase 1: Core Store + Big Numbers + Saving (The Skeleton)
**Goal:** clean data flow before visuals.

1. **`BigNum.js`**
   - Wrap break_infinity.js
   - Must support: `add`, `mul`, `gte`, `min/max`, `format`
   - Must support `toJSON()` and `fromJSON()` (store as string) so saves are stable

2. **`Store.js`**
   - `getState()` returns the canonical state
   - **Explicit named methods** are the only write path (e.g. `addGold(amount)`, `equipItem(slot, item)`)
   - Each method modifies state then emits `state:changed` with relevant keys
   - This keeps mutation centralized without needing to learn a reducer/dispatch pattern
   - If the method count gets unwieldy later, refactor to `mutate(type, payload)`

3. **State shape (MVP)**
   - Store **inventory as stacks** (keyed by itemId with count + tier)
   - Store **schemaVersion** (for save migrations)
   - Store timestamps in milliseconds (`Date.now()`)

   Example:
   ```js
   {
     schemaVersion: 1,
     gold: "0",              // BigNum as string
     glitchFragments: "0",
     mana: "100",
     playerStats: { str: 5, vit: 5, agi: 5, level: 1, xp: "0", xpToNext: "100" },
     equipped: { head: null, body: null, weapon: null, legs: null },
     inventoryStacks: {
       "iron_sword": { count: 237, tier: 0 },
       "iron_helm":  { count: 12, tier: 0 }
     },
     currentWorld: 1,
     currentZone: 1,
     prestigeCount: 0,
     prestigeMultiplier: "1",
     unlockedCheats: [],
     titles: [],
     flags: { crackTriggered: false },
     settings: { autoAttack: false },
     timestamps: { lastSave: 0, lastOnline: 0 }
   }
   ```

4. **`SaveManager.js`**
   - `save(state)` / `load()`
   - Includes: `schemaVersion`, `migrate(oldSave)`, corruption fallback (`save_backup`)
   - Auto-save every 30 seconds + on `window.beforeunload`

5. **`TimeEngine.js`** — **stub only** (empty file with `init()` and `destroy()`). Built out in Phase 2 when auto-attack needs a tick.

**Done when:** you can set gold to 1e12 via `store.addGold(...)`, save, refresh, load, and it's correct.

---

### Phase 2: Combat Loop (Heartbeat)
**Goal:** click enemy → damage → death → rewards → next enemy.

1. **`enemies.json`**
   - 5 zones of World 1 enemies with stable IDs (`goblin_01`, `rat_01`, etc.)
   - Zone 1: Rat, Slime, Goblin (HP: 10-50)
   - Zone 2: Wolf, Skeleton, Bandit (HP: 100-500)
   - Zone 3: Orc, Troll, Dark Mage (HP: 1K-10K)
   - Zone 4: Dragon Whelp, Golem, Lich (HP: 50K-500K)
   - Zone 5: Elder Dragon Boss (HP: 1M+)
   - Each has: id, name, hp, attack, goldDrop, xpDrop, lootTable

2. **`CombatEngine.js`**
   - Spawns enemy for current zone
   - Click-to-attack: each click calls `getPlayerDamage(state)` from config
   - Auto-attack tick: starts at 0 DPS, unlocked via upgrades
   - Emits: `combat:enemySpawned`, `combat:enemyDamaged`, `combat:enemyKilled`
   - All state writes go through Store methods

3. **Build out `TimeEngine.js`**
   - Now that auto-attack needs a tick, implement the timer system
   - Centralizes all recurring timers (auto-attack interval, autosave)
   - Single `update(delta)` called from Phaser's scene update

4. **Damage formula**
   - One function: `getPlayerDamage(state)` reads from `config.js`
   - MVP uses `mortal` tier: `(str * 1.2) + weapon_dmg`
   - All multipliers (upgrades, prestige, equipment) applied here in one place
   - Crit check: base 5% chance, 2x multiplier

5. **`Progression.js`**
   - On enemy kill: grant XP
   - Level-up: `xpToNext = floor(100 * (level ^ 1.5))`
   - Each level increases base stats
   - Emits `prog:xpGained`, `prog:levelUp`

6. **GameScene visuals**
   - Placeholder player rectangle (left), placeholder enemy rectangle (right)
   - Enemy HP bar above enemy
   - **Floating damage numbers:** spawn at hit point, tween up 50px over 0.5s, fade alpha to 0, destroy. Random slight X offset so numbers don't stack. This must feel good — it's the core feedback.

**Done when:** kill enemies, see satisfying damage numbers, get gold/XP, level up, face tougher zones.

---

### Phase 3: UI Shell (Layout + Log)
**Goal:** your 4-panel layout feels real.

1. **UIScene** — runs as parallel overlay scene on top of GameScene

2. **TopBar**
   - Gold, Mana, Glitch Fragments with `NumberFormat`
   - For BigNum: scale/pop tween on change (safer than fake count-up animations for huge values)

3. **SystemLog** (right 25% of screen)
   - Green monospace text on black background
   - Subscribes to combat/economy/progression events — systems don't call it directly
   - Timestamped combat lines: `[04:21:09] You hit Rat for 15 DMG`
   - SYSTEM lines in distinct color (brighter green or yellow)
   - Initial SYSTEM lines (hardcoded for now):
     - First kill: "Adequate. You can hit things."
     - First level-up: "You leveled up. A statistical anomaly, surely."
     - Zone clear: contextual snark

4. **Zone navigation**
   - Simple arrow buttons: "← Zone 1 | Zone 2 →"
   - Only forward-unlocked zones clickable
   - Emits `world:zoneChanged`

5. **Bottom panel placeholder** — empty bar where Cheat Deck will go

**Done when:** layout matches the design doc wireframe. Resources update visibly. Log scrolls. SYSTEM says things. It looks like a game.

---

### Phase 4: Loot + Inventory + Equipment
**Goal:** loot loop is online without creating huge saves.

1. **`items.json`**
   - Merge chain defined in data:
     ```
     iron_sword (ATK +5) → x100 → steel_sword (ATK +50)
     → x100 → mithril_sword (ATK +500) → x100 → adamantine_sword (ATK +5000)
     ```
   - Item properties: id, name, slot, statBonuses, tier, mergesInto, funnyDescription
   - Passive-aggressive names: "Sword of Please Stop (+500 ATK, +0 Respect)"
   - Rarity: Common (white), Uncommon (green), Rare (blue), Epic (purple), Legendary (orange)

2. **`LootEngine.js`**
   - On `combat:enemyKilled`: roll loot table, generate item drops
   - Emits `loot:dropped` with `{ itemId, count, rarity }`

3. **`InventorySystem.js`**
   - Converts drops into **stack counts** (not individual objects)
   - Equip: move item from stacks to equipped slot, update Store
   - Sell: remove from stacks, grant gold via Store
   - Emits: `inv:itemAdded`, `inv:itemEquipped`, `inv:itemSold`

4. **Inventory UI (InventoryPanel.js)**
   - Grid renders stacks (icon placeholder + count badge)
   - Equipment slots on left (Head, Body, Legs, Weapon)
   - Click item → equip (if slot matches) or sell for gold
   - Placeholder character silhouette

5. **SYSTEM reactions to loot:**
   - Equip first item: "I see you've equipped the Rusty Sword. An appropriate choice for someone of your... caliber."
   - Inventory full: "Your inventory is full. This is what happens when you hoard."

**Done when:** kill → get item → equip → damage increases → sell works. Core RPG loop complete.

---

### Phase 5: Upgrades + The First Crack (Make It Yours)
**Goal:** upgrades + the tonal shift into "the game is broken on purpose."

1. **`UpgradeManager.js`** + **`upgrades.json`**
   - **Legitimate upgrades** (Gold cost, SYSTEM-approved):
     - Sharpen Blade: +10% click damage (scaling cost)
     - Toughen Up: +20 max HP
     - Auto-Attack I: Unlock 1 auto-attack per second
     - Auto-Attack Speed: Reduce auto-attack interval
     - Gold Find: +15% gold drops
   - Upgrades modify **multipliers read by formulas**, not rewrite formula logic
   - Displayed in upgrade panel, costs visible, greyed-out if too expensive

2. **The First Crack (scripted event):**
   - Triggered after ~2-3 minutes of play (around zone 2)
   - Uses a `crackTriggered` flag in state so it only fires once
   - Sequence via `DialogueDirector`:
     - Player's damage randomly crits for 10x. SYSTEM: "Wait. That damage number is wrong. Let me just—"
     - Happens again. SYSTEM: "I said STOP. Let me check the config files..."
     - Third time: "...Patch 1.0.1: Fixed critical damage overflow. This won't happen again."
     - It keeps happening. The "bug" is permanent.
   - **This moment teaches the player:** the game is broken, and breaking it is the point.

3. **Glitch Fragments begin dropping:**
   - After the First Crack, enemies occasionally drop Glitch Fragments
   - SYSTEM: "What IS that? That's not in my loot tables."
   - New currency visible in TopBar

4. **Exploit upgrades** (Glitch Fragment cost, SYSTEM hates):
   - Unstable Crit: +5% crit chance
   - Memory Leak: +25% gold ("shouldn't exist")
   - Each purchase triggers a SYSTEM complaint

**Done when:** player experiences the tonal shift. Upgrades provide constant micro-goals. Glitch Fragments exist as a second economy.

---

### Phase 6: Loot Hoarder Cheat + Cheat Deck (The Dopamine Engine)
**Goal:** auto-merge that feels illegal.

1. **Loot Hoarder unlock:**
   - Triggered after collecting 100 Glitch Fragments (or narrative beat)
   - SYSTEM: "WARNING: Inventory anomaly detected. Items are... combining? This isn't in the patch notes."
   - Unlock animation: brief UI glitch (screen shake, color shift, static overlay)

2. **Auto-merge mechanic (performance-safe):**
   - When a stack changes, check **only that itemId**
   - `while (count >= 100) { count -= 100; nextTierCount += 1 }`
   - Emit one `inv:itemMerged` with `{ itemId, merges: N, newTier }`
   - **UI animation strategy:** animate 1-3 merges visually, summarize the rest as "+47 merges" toast. Never animate thousands of merges.

3. **`CheatDeck.js`** (Bottom panel):
   - Toggle button for Loot Hoarder: ON/OFF
   - When ON: auto-merge is active
   - Visual indicator: glowing/pulsing border when active
   - SYSTEM: "You can't just smash swords together and expect— oh. Oh no. It's working."

4. **Drop pacing (tune in data):**
   - Increase drop rates via `enemies.json` knobs so merging happens satisfyingly
   - Target: first merge within 1-2 minutes of activating the cheat
   - Subsequent merges accelerate as drop rates compound

**Done when:** toggle Loot Hoarder → merges happen without lag → power jumps → SYSTEM complains. The cheat mechanic is proven.

---

### Phase 7: Prestige Loop (Power Fantasy)
**Goal:** reset for multiplier, blast through old content, hit new wall.

1. **The Wall:**
   - Zone 5 boss (Elder Dragon) should be nearly impossible on first pass
   - SYSTEM: "Finally. Something you CAN'T break."
   - Progress slows to a crawl — player *feels* the ceiling

2. **Prestige trigger:**
   - Once player reaches Zone 4+, "PRESTIGE" button appears
   - SYSTEM: "You want to... start over? After everything you've done to my world? ...Fine. But I'm keeping notes."
   - Confirmation dialog with preview of what's kept/reset/gained

3. **`PrestigeManager.js` rules:**
   - **Keeps:** All unlocked cheats, titles/achievements, equipped gear, Glitch Fragments, inventory stacks
   - **Resets:** Current zone to 1-1, gold (keep 10%), enemy scaling
   - **Grants:** Prestige multiplier: `1 + (0.5 × furthestZoneReached / totalZones)`
   - Multiplier applies to: damage, gold drops, XP gains
   - Each prestige stacks multiplicatively
   - Emits `prestige:performed`

4. **Post-prestige feel:**
   - Zone 1 enemies melt instantly — this is the "feel overpowered" moment
   - SYSTEM: "Oh, you're back. And you're... stronger? That's not how resetting works."
   - Player rockets through old content, hits new wall further out

5. **Prestige counter** visible in TopBar — badge of honor

**Done when:** prestige → restart overpowered → blast through → push further → understand the loop.

---

### Phase 8: Polish, Offline Progress, Demo Readiness
**Goal:** a tight 20–30 minute run that people actually finish.

1. **SYSTEM dialogue pass (50–100 lines across all triggers):**
   - First kill, 100 kills, 1000 kills
   - Each zone entrance
   - Each upgrade purchased (at least the first few)
   - Loot Hoarder activation and first merge
   - Prestige and post-prestige
   - Idle return (1 min, 10 min, 1 hour)
   - Edge cases: dying, selling legendary items, failed purchase attempts
   - All stored in `dialogue.json`, keyed by event trigger

2. **Number formatting polish:**
   - Small: plain white text
   - Medium (1K+): slightly larger, yellow
   - Large (1M+): glow effect
   - Absurd (1B+): screen shake on crit, SYSTEM comments on the size

3. **Visual juice (Phaser built-ins only):**
   - Screen shake on big hits (Phaser camera shake)
   - Gold particles flying to TopBar counter on pickup
   - Enemy death: flash white, fade out (tween)
   - Level-up: brief golden border flash
   - Cheat activation: screen static/glitch (overlay sprite, quick flash)

4. **Parallax background:**
   - 2-3 layer scrolling placeholder backgrounds per zone
   - Subtle movement gives depth even with simple art

5. **Offline progress (safe version):**
   - On load, calculate elapsed time since last save
   - Cap offline time (e.g. 12 hours max)
   - Compute rewards with **coarse estimates** (average gold/sec × seconds), not per-second simulation loops
   - Apply merges arithmetically, not as animations
   - Apply all results in one Store mutation
   - Show summary popup + SYSTEM line: "You were gone for 3 hours. I didn't miss you."

6. **Balance pass:**
   - Zone 1-3 clear: ~10 minutes
   - Hit Zone 5 wall: ~15 minutes
   - First prestige decision: ~15-20 minutes
   - Post-prestige to exceeding previous wall: ~5-10 minutes
   - Total demo: ~25-30 minutes of escalating fun

7. **Itch.io packaging:**
   - Build with Vite → static files
   - Upload to Itch.io as HTML5 game
   - Set embed dimensions to 1280×720

**Done when:** a friend can play 20-30 minutes, laugh at SYSTEM, feel the prestige power spike, and want "one more run."

---

## Milestone Checklist

| # | Milestone | Test |
|---:|---|---|
| 0 | Phaser runs + guardrails | Rectangle renders; ARCHITECTURE.md + events.js + config.js committed |
| 1 | Store + Save stable | Save/load works; schemaVersion present; corruption fallback |
| 2 | Combat loop | Kill 10 enemies; damage numbers; zone scaling; auto-attack ticks |
| 3 | UI layout | Top bar + log + zone nav responding via events |
| 4 | Loot & equip | Stacks work; equip changes DPS; sell works |
| 5 | Upgrades + First Crack | Upgrades work; Crack triggers dialogue; Glitch Fragments drop |
| 6 | Loot Hoarder | Merges happen without lag; satisfying feedback |
| 7 | Prestige | Prestige works; restart overpowered; new wall appears |
| 8 | Demo-ready | Offline progress, polish, balance pass, Itch.io upload |

---

## Key Principles

**Build playable, then pretty.** Every phase ends with something you can click on and test. Resist the urge to make art or write dialogue before the mechanics work.

**The SYSTEM sells the game.** The mechanics are solid idle-clicker fare. The SYSTEM personality is what makes this game *memorable*. Invest real time in writing good lines.

**One cheat is enough for MVP.** Loot Hoarder is your proof of concept. If it feels good, the other cheats (Temporal Overclock, Shadow Instance, etc.) follow the same pattern — toggle in Cheat Deck, visual flair, SYSTEM reacts.

**Numbers are the dopamine.** If the numbers don't feel good going up, nothing else matters. Spend time on formatting, on the *feel* of damage numbers floating up, on the satisfying crunch of a big crit.

**Data drives everything.** Enemies, items, upgrades, dialogue — all in JSON. When you want to add World 2, you add data files. When you want to rebalance, you edit numbers, not code.
