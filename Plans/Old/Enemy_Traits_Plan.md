# Enemy Traits Implementation Plan

## Goal
Add three new combat trait axes — **Regen**, **Enrage**, and **Thorns** — to the enemy system. Each trait creates a distinct pressure on the player and interacts differently with existing mechanics (DEF, AGI, click, Power Smash). Traits are composable: an enemy can have zero, one, or multiple traits.

---

## Current State

Enemies are implicitly typed by their stat spread:

| Field | Purpose |
|-------|---------|
| `hp, attack, attackSpeed` | Core combat stats (zone-scaled) |
| `accuracy` | Auto-derived from archetype signals |
| `defense` | Reduces player damage (`str - def * 0.3`) |
| `armorPen` | Bypasses player DEF (`effDef = DEF * (1 - armorPen)`) |
| `dot` | Flat damage/sec bypassing defense |

There are no explicit trait tags. The auto-derivation block in `enemies.js:453-462` infers accuracy from stat signals. We'll extend this pattern: traits are **data fields on the enemy template**, processed by CombatEngine at runtime.

---

## Design: Three Traits

### 1. Regen — "The HP bar won't stay down"

**Data field:** `regen: <number>` (HP restored per second, flat)

**Mechanic:**
- New `combat:enemyRegen` ticker in CombatEngine, 1s interval (mirrors the existing DoT ticker pattern)
- Each tick: `currentEnemy.hp = Decimal.min(currentEnemy.hp.plus(regen), currentEnemy.maxHp)`
- Starts on spawn via `_startEnemyRegen()`, stops on death/despawn via `_stopEnemyRegen()`
- Zone scaling: regen scales with the `atk` scaling rate (0.12 per zone) so it stays relevant

**Player pressure:** DPS check. If sustained DPS < regen, you can't kill it. Rewards:
- Power Smash burst to chunk through regen
- Damage upgrades over attack speed
- Active clicking adds chip damage (even at 20% scalar)

**Visual feedback:**
- Green floating `+N` heal number on enemy each tick (same system as `_spawnDamageNumber` but green, positioned on enemy)
- HP bar briefly pulses green on regen tick (subtle tint flash)

**Files touched:**
- `src/data/enemies.js` — add `regen` field to select enemies
- `src/data/bosses.js` — add `regen` field to select bosses
- `src/systems/CombatEngine.js` — `_startEnemyRegen()`, `_stopEnemyRegen()`, call from spawn/death
- `src/scenes/GameScene.js` — listen for `COMBAT_ENEMY_REGEN` event, spawn green heal number
- `src/events.js` — add `COMBAT_ENEMY_REGEN` event key

---

### 2. Enrage — "It's getting worse"

**Data field:** `enrage: { threshold: 0.5, atkMult: 1.8, speedMult: 1.4 }` (or `null`)

- `threshold` — HP ratio that triggers enrage (e.g., 0.5 = below 50% HP)
- `atkMult` — multiplier on enemy attack damage while enraged
- `speedMult` — multiplier on enemy attack speed while enraged

**Mechanic:**
- Checked inside `_onEnemyDamaged` path in CombatEngine (after HP is reduced)
- One-time trigger: set `currentEnemy._enraged = true` flag when `hp/maxHp < threshold`
- On trigger:
  - Multiply `currentEnemy.attack` by `atkMult`
  - Re-register enemy attack timer with `attackSpeed * speedMult` (call `_registerEnemyAttackTimer()` again — it already does `TimeEngine.unregister` + `register`)
- Does NOT un-enrage if healed above threshold (one-way trigger)
- No zone scaling needed — multipliers are ratios, they scale naturally with the base stats

**Player pressure:** Kill it fast or tank through. Rewards:
- Power Smash to burst past the threshold before enrage ramps up
- DEF stacking to survive the enraged phase
- High single-hit damage to skip the threshold entirely

**Visual feedback:**
- On enrage trigger: emit `COMBAT_ENEMY_ENRAGED` event
- GameScene handler: red screen flash (brief `cameras.main.flash`), enemy tint shifts to angry red/orange
- Persistent red pulsing tint on enemy sprite while enraged (subtle tween loop)
- Floating "ENRAGED!" text (red, bold) similar to "DODGE!" text

**Files touched:**
- `src/data/enemies.js` — add `enrage` object to select enemies
- `src/data/bosses.js` — add `enrage` object to select bosses
- `src/systems/CombatEngine.js` — enrage check in `playerAttack` after HP reduction, re-register timer
- `src/scenes/GameScene.js` — listen for `COMBAT_ENEMY_ENRAGED`, red flash + tint + text
- `src/events.js` — add `COMBAT_ENEMY_ENRAGED` event key

---

### 3. Thorns — "Hitting it hurts me"

**Data field:** `thorns: <number>` (flat damage reflected to player per hit received)

**Mechanic:**
- Applied in `CombatEngine.playerAttack()` and `CombatEngine.activateAbility()` (Power Smash) — anywhere the player deals a hit
- After damage is dealt to enemy: `Store.damagePlayer(currentEnemy.thorns)`
- Flat damage, **ignores player DEF** (it's magical/environmental — like stepping on spikes)
- Does NOT trigger on DoT or other non-hit sources
- Zone scaling: thorns scales with `atk` rate (0.12 per zone)

**Player pressure:** Punishes hit count. Rewards:
- Fewer, bigger hits (slow weapon + high damage)
- DEF is useless against thorns — forces HP/regen investment
- Click spam is actively harmful (low damage dealt, full thorns taken)
- Power Smash is efficient (one hit, one thorns proc, massive damage)

**Visual feedback:**
- On thorns proc: emit `COMBAT_THORNS_DAMAGE` event
- GameScene handler: small purple/magenta damage number on the player (reuse damage number system, different color + position)
- Brief purple flash on player sprite
- Enemy gets a subtle spiky particle or static tint to signal "don't spam me"

**Files touched:**
- `src/data/enemies.js` — add `thorns` field to select enemies
- `src/data/bosses.js` — add `thorns` field to select bosses
- `src/systems/CombatEngine.js` — thorns check after damage in `playerAttack` and `activateAbility`
- `src/scenes/GameScene.js` — listen for `COMBAT_THORNS_DAMAGE`, spawn player-side damage number
- `src/events.js` — add `COMBAT_THORNS_DAMAGE` event key

---

## Implementation Order

### Phase 1: Data Schema + Spawn Flow (foundation)

**Step 1 — Event keys** (`src/events.js`)
- Add: `COMBAT_ENEMY_REGEN`, `COMBAT_ENEMY_ENRAGED`, `COMBAT_THORNS_DAMAGE`

**Step 2 — Enemy data fields** (`src/data/enemies.js`)
- Add `regen: null`, `enrage: null`, `thorns: null` defaults to a few test enemies
- Don't mass-assign yet — pick 1 enemy per trait for testing

**Step 3 — Spawn flow** (`src/systems/CombatEngine.js`)
- In `spawnEnemy()`: copy `regen`, `enrage`, `thorns` from template to runtime `currentEnemy` object (with zone scaling for regen/thorns)
- In `spawnBoss()`: same, no zone scaling (bosses use raw values)
- Add `_enraged: false` flag to runtime enemy

**Step 4 — Emit trait data on spawn**
- Include `regen`, `enrage`, `thorns` in the `COMBAT_ENEMY_SPAWNED` event payload so the UI can display trait indicators

### Phase 2: Regen Mechanic

**Step 5 — CombatEngine regen ticker**
- `_startEnemyRegen()`: if `currentEnemy.regen > 0`, register `combat:enemyRegen` ticker (1s interval)
- Each tick: heal enemy, cap at maxHp, emit `COMBAT_ENEMY_REGEN` with `{ amount, remainingHp, maxHp }`
- Also emit `COMBAT_ENEMY_DAMAGED` (with negative-ish semantics) OR just update HP bar via the regen event — cleaner to use a separate event and update the HP bar in GameScene's regen handler
- `_stopEnemyRegen()`: unregister ticker. Call from `_onEnemyDeath` and `stop()`

**Step 6 — GameScene regen visuals**
- Listen for `COMBAT_ENEMY_REGEN`
- Update HP bar (same ratio → color logic as `_onEnemyDamaged`)
- Spawn green `+N` text floating up from enemy (small font, no shake)

### Phase 3: Enrage Mechanic

**Step 7 — CombatEngine enrage trigger**
- After HP reduction in `playerAttack()` (and in `activateAbility()` for Power Smash):
  - If `currentEnemy.enrage && !currentEnemy._enraged`
  - Check `currentEnemy.hp.div(currentEnemy.maxHp).toNumber() < currentEnemy.enrage.threshold`
  - Set `currentEnemy._enraged = true`
  - Multiply `currentEnemy.attack` by `enrage.atkMult`
  - Re-register enemy attack timer with boosted speed: `currentEnemy.attackSpeed *= enrage.speedMult`, then `_registerEnemyAttackTimer()`
  - Emit `COMBAT_ENEMY_ENRAGED`

**Step 8 — GameScene enrage visuals**
- Listen for `COMBAT_ENEMY_ENRAGED`
- Red camera flash: `this.cameras.main.flash(200, 255, 50, 50, true)`
- Spawn "ENRAGED!" floating text (red, bold, 28px)
- Start persistent red tint pulse on enemy sprite (looping tween on tint/alpha)
- Store the pulse tween reference so it can be cleaned up on enemy death/despawn

### Phase 4: Thorns Mechanic

**Step 9 — CombatEngine thorns reflection**
- In `playerAttack()`, after damage is applied to enemy:
  - If `currentEnemy.thorns > 0`: `Store.damagePlayer(currentEnemy.thorns)`
  - Emit `COMBAT_THORNS_DAMAGE` with `{ amount: currentEnemy.thorns }`
- In `activateAbility()` (Power Smash), same logic after damage
- Thorns triggers even if the hit kills the enemy (you still swung into the spikes)

**Step 10 — GameScene thorns visuals**
- Listen for `COMBAT_THORNS_DAMAGE`
- Spawn purple/magenta damage number near the player (mirror of enemy damage numbers but player-side)
- Brief purple tint flash on player sprite (80ms)

### Phase 5: Enemy Assignment + Balance

**Step 11 — Assign traits to existing enemies**

Suggested assignments (tuning TBD via playtesting):

| Enemy | Trait | Rationale |
|-------|-------|-----------|
| Hollow Slime | `regen: 2` | Classic regen fantasy, slow + regenerating |
| Thornback Boar | `thorns: 3` | It's literally called "thornback" — name writes itself |
| Feral Hound | `enrage: { threshold: 0.4, atkMult: 1.6, speedMult: 1.3 }` | Cornered animal goes berserk |
| Area 2-3 variants | Mix traits at higher values | Scale pressure with progression |

Bosses should have amplified versions of their base enemy's trait (e.g., Rotfang = enrage boss, slime boss = regen boss).

**Step 12 — Balance pass**
- Run `npm run balance:sim` — add trait columns (regen DPS offset, enrage effective DPS, thorns damage taken)
- Verify no enemy is unkillable at the expected gear level for its zone
- Verify thorns doesn't make an enemy a death trap for idle play (thorns < player HP regen at expected level)

### Phase 6: UI Polish

**Step 13 — Trait indicators on enemy nameplate**
- Small icons or text tags under the enemy name showing active traits
- E.g., green "REGEN" tag, red "ENRAGE" tag, purple "THORNS" tag
- Appear on spawn, so the player knows what they're fighting before engaging

**Step 14 — SystemLog messages**
- "[EnemyName] regenerates N HP" (throttled, every 5th tick like DoT)
- "[EnemyName] becomes ENRAGED!" (one-time)
- "You take N thorns damage!" (every proc, or throttled if too spammy)

**Step 15 — StatsPanel / tooltip hints**
- Not strictly needed for v1 — enemy traits are visual, not player stats
- Optional: show "Thorns: N" in an enemy info tooltip if we add one later

---

## File Change Summary

| File | Changes |
|------|---------|
| `src/events.js` | +3 event keys |
| `src/data/enemies.js` | +`regen`, `enrage`, `thorns` fields on select enemies |
| `src/data/bosses.js` | +trait fields on select bosses |
| `src/systems/CombatEngine.js` | Regen ticker, enrage trigger, thorns reflection, spawn flow updates |
| `src/scenes/GameScene.js` | 3 new event handlers (regen heal number, enrage flash+tint, thorns player damage number), trait indicators on spawn |
| `src/config.js` | Optional: trait-related constants in `COMBAT_V2` if needed (e.g., `thornsIgnoresDefense: true`) |

**No new files needed.** Everything fits into existing architecture.

---

## Interactions with Existing Mechanics

| Trait | vs Click (20%) | vs Power Smash | vs DEF | vs AGI/Dodge |
|-------|----------------|----------------|--------|--------------|
| **Regen** | Clicks add chip DPS to overcome regen | Burst chunks past regen | Neutral | Neutral |
| **Enrage** | Neutral | Burst past threshold before enrage | DEF helps survive enraged phase | Dodge helps survive enraged phase |
| **Thorns** | Clicking is bad (low dmg, full thorns) | Efficient (1 hit = 1 proc, huge dmg) | DEF doesn't help (thorns bypasses) | Neutral (dodge is on enemy attacks, not thorns) |

---

## Risks / Open Questions

1. **Regen + high HP enemies could feel unkillable** — need a sanity check that `playerDPS - regen > 0` at the expected gear level. Balance sim should catch this.
2. **Enrage re-registering the attack timer mid-fight** — should work fine since `_registerEnemyAttackTimer` already unregisters first, but needs testing for edge cases (what if enrage triggers on the same frame as an enemy attack?).
3. **Thorns + player death** — if thorns kills the player on the same hit that kills the enemy, who "wins"? Proposal: enemy dies first (player gets kill credit + loot), then thorns damage applies. If player dies from it, normal respawn flow.
4. **Multiple traits on one enemy** — a regen + thorns enemy is a nightmare. Intentional? Yes, but save multi-trait combos for later zones / bosses. Start with single traits.
5. **Visual clutter** — three new floating text types + existing damage numbers + dodge text. May need to stagger/offset positions. Regen numbers should be smaller/subtler than damage numbers.
6. **Balance sim support** — the balance sim needs updating to model regen (reduces effective DPS), enrage (increases average incoming DPS), and thorns (adds to incoming damage proportional to player attack speed). This is important for automated balance validation.
