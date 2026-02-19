# Stances Implementation Plan (v2 — revised)

## Goal
Add three combat stances — **Flurry**, **Power**, and **Fortress** — that the player can switch between. Each stance changes the player's combat stats and grants access to a unique active ability. Stances are the player's primary tactical response to enemy variety (traits, archetypes).

## Design Decisions
- Stances replace the current "one build fits all" approach with a read-and-react loop
- Each stance has **one exclusive active ability** (replaces the universal Power Smash)
- Switching stances has **no cooldown** — the player can cycle freely
- Each switch resets a **0.5s attack pause** — auto-attacks won't fire until 0.5s after the last switch. Enemies keep attacking during the pause. Rapid cycling is self-punishing (extended vulnerability) without being artificially gated
- All three stances are available from the start (no unlock gate) — enemy variety teaches the player when to use each
- Stances affect **stats only** at base layer — no mastery, talents, or transition bonuses in v1
- Idle players can park in one stance; active players swap mid-fight for advantage
- **Ability cooldowns tick globally** — if you use Power Smash then switch to Flurry, the cooldown keeps running in the background. Switch back and it may be ready. This rewards active stance swapping
- **Click damage is stance-neutral** — `clickDamageScalar: 0.2` applies in all stances, but stance `damageMult` does NOT apply to clicks. Clicks are always weak; stances don't change that
- **No AbilityManager system** — each stance ability is a self-contained button file (SmashButton, FlurryButton, BulwarkButton). The stance switcher shows/hides the appropriate button. Avoids leaky generic abstraction over mechanically different abilities
- **DrinkButton is stance-independent** — stays at its current position, unaffected by stances

---

## The Three Stances

### Flurry — "Hit a lot"
**Identity:** Volume. Rapid attacks, small hits, sustained pressure.

| Stat | Modifier |
|------|----------|
| Attack Speed | +80% (x1.8) |
| Damage per hit | -40% (x0.6) |
| Damage Reduction | 0% (no change) |

**Active Ability: Rapid Strikes**
- Unleashes a burst of 5 fast hits over ~1 second (staggered ~200ms apart)
- Each hit uses normal Flurry auto-attack damage (small but many)
- If the current enemy dies mid-burst, remaining hits continue firing on their original timing — they whiff if no enemy is alive (e.g., during spawn delay), hit the new enemy if it has spawned
- Cooldown: ~30s (tunable)
- Visual: rapid-fire damage numbers, quick multi-jab animation
- Timer keys: `ability:rapid:0` through `ability:rapid:4` — all cleared on stance switch away from Flurry

**Strong against:** Regen enemies (out-DPS the regen), enemies with brief vulnerability windows (more chances to hit)
**Weak against:** Thorns (many hits = many procs), armored/threshold enemies (small hits bounce off)

---

### Power — "Hit hard"
**Identity:** Commitment. Slow, deliberate, massive single hits.

| Stat | Modifier |
|------|----------|
| Attack Speed | -50% (x0.5) |
| Damage per hit | +100% (x2.0) |
| Damage Reduction | 0% (no change) |

**Active Ability: Power Smash** (existing ability, moved here)
- Single massive hit at `smashMultiplier x base damage`
- Existing upgrades (`power_smash_damage`, `power_smash_recharge`) continue to work unchanged
- These upgrades remain **always purchasable** in the upgrade shop regardless of current stance (investing in your Power toolkit for when you switch back)
- Cooldown: ~60s (existing tuning)
- Visual: existing Power Smash visuals (big lunge, screen shake, orange "SMASH!" text)

**Strong against:** Armored/threshold enemies (punches through flat reduction), thorns (fewer hits = fewer procs), burst windows on phased enemies
**Weak against:** Evasive enemies (each miss is costly at slow attack speed), regen enemies (long gaps between hits let regen recover)

---

### Fortress — "Outlast"
**Identity:** Inevitability. Moderate attacks, heavy damage reduction, sustain.

| Stat | Modifier |
|------|----------|
| Attack Speed | -20% (x0.8) |
| Damage per hit | -20% (x0.8) |
| Damage Reduction | +50% (flat 50% reduction on incoming damage) |

**Active Ability: Bulwark**
- Activates an **absorb shield** that blocks incoming damage
- Shield has both a **damage cap** (e.g., absorbs up to 200% of max HP) and a **duration cap** (e.g., 8 seconds) — whichever is reached first expires the shield
- Incoming damage subtracts from shield HP first; overflow spills to player HP
- Stacks with Fortress base DR: incoming damage is reduced by 50% first, then the remainder hits the shield
- Requires a new `shieldHp` field on module-level state in CombatEngine (ephemeral, not saved)
- Cooldown: ~45s (tunable)
- Visual: golden/blue shield glow around player, damage numbers show shield absorption

**Strong against:** Enrage enemies (survive the enrage phase), high-damage slow hitters, DoT enemies (damage reduction applies), debuffers
**Weak against:** Regen enemies (can't out-DPS regen with reduced damage), fights with time pressure (everything takes forever)

---

## Implementation Plan

### Phase 1: Core Data + State

**Step 1 — Stance definitions in config** (`src/config.js`)
```js
export const STANCES = {
  flurry:   { id: 'flurry',   label: 'Flurry',   atkSpeedMult: 1.8, damageMult: 0.6, damageReduction: 0   },
  power:    { id: 'power',    label: 'Power',    atkSpeedMult: 0.5, damageMult: 2.0, damageReduction: 0   },
  fortress: { id: 'fortress', label: 'Fortress', atkSpeedMult: 0.8, damageMult: 0.8, damageReduction: 0.5 },
};
export const STANCE_IDS = Object.keys(STANCES); // ['flurry', 'power', 'fortress'] — cycle order
export const STANCE_SWITCH_PAUSE_MS = 500; // 0.5s attack pause on each switch
```

**Step 2 — Store state** (`src/systems/Store.js`)
- Add `currentStance: 'power'` to `createInitialState()` (default to Power = current behavior)
- Add `setStance(stanceId)` action that updates `currentStance` and emits `STANCE_CHANGED`
- Add to save hydration: `if (saved.currentStance) fresh.currentStance = saved.currentStance`
- **No schema version bump needed** — hydration defaults handle missing field on old saves
- **No `stanceSwitchCooldownEnd` in save** — attack pause is ephemeral state owned by the stance switcher UI

**Step 3 — Events** (`src/events.js`)
- Add `STANCE_CHANGED` event key
- Add to `EVENT_CONTRACTS`: `STANCE_CHANGED: { stanceId: 'string', previousStance: 'string' }`

---

### Phase 2: Combat Integration

**Step 4 — CombatEngine reads stance for damage** (`src/systems/CombatEngine.js`)

Insert stance `damageMult` into `getPlayerDamage()` multiplier chain (after territory buff, before `.floor()`):
```js
const stanceMult = STANCES[Store.getState().currentStance].damageMult;
const damage = D(rawDamage)
  .times(clickDmgMult)
  .times(prestigeMult)
  .times(critMult)
  .times(TerritoryManager.getBuffMultiplier('baseDamage'))
  .times(isClick ? 1 : stanceMult)  // stance mult on auto-attacks only, NOT clicks
  .floor();
```

**Important: `isClick ? 1 : stanceMult`** — click damage is stance-neutral per design decision. Power Smash calls `getPlayerDamage(state, true)` so it gets `isClick=true`, but Power Smash then applies its own `smashMultiplier` separately. Since `powerSmashAttack()` is gated to Power stance, the stance damageMult (2.0x) is NOT double-applied — the smash multiplier IS the Power stance's burst ability.

> **Parallel pipeline note:** `CombatEngine.getPlayerDamage()` and `ComputedStats.getEffectiveDamage()` are separate functions that apply similar multipliers independently. Both need stance `damageMult`. This matches the existing pattern where both apply `prestigeMultiplier` and `territoryDmgMult` separately. They are NOT stacked — CombatEngine is for actual combat, ComputedStats is for display.

**Step 5 — CombatEngine reads stance for damage reduction** (`src/systems/CombatEngine.js`)

In `enemyAttack()`, after computing raw damage and before calling `Store.damagePlayer()`:
```js
// Apply Fortress damage reduction
const dr = STANCES[Store.getState().currentStance].damageReduction;
const reducedDamage = Math.max(1, Math.floor(damage * (1 - dr)));

// Apply Bulwark absorb shield (if active)
let finalDamage = reducedDamage;
if (shieldHp > 0) {
  if (reducedDamage <= shieldHp) {
    shieldHp -= reducedDamage;
    finalDamage = 0;
  } else {
    finalDamage = reducedDamage - shieldHp;
    shieldHp = 0;
    // emit shield broken event for visual feedback
  }
}

Store.damagePlayer(finalDamage);
```

This keeps `Store.damagePlayer()` as a pure "subtract HP" function. DR and shield absorption are combat mechanics that belong in CombatEngine.

**Step 6 — ComputedStats reads stance** (`src/systems/ComputedStats.js`)

These changes are for **display purposes** (StatsPanel, OfflineProgress):
- `getEffectiveDamage()`: multiply by `STANCES[currentStance].damageMult`
- `getPlayerAutoAttackInterval()`: divide base interval by `STANCES[currentStance].atkSpeedMult` (faster = shorter interval)
- `getClickDamage()`: **NO change** — clicks are stance-neutral
- New: `getDamageReduction()` — returns `STANCES[currentStance].damageReduction` (for StatsPanel display)

Attack speed insertion point in `getPlayerAutoAttackInterval()`:
```js
const effectiveSpeed = getPlayerAtkSpeed() * STANCES[Store.getState().currentStance].atkSpeedMult;
const baseInterval = Math.floor(COMBAT_V2.baseAttackIntervalMs / effectiveSpeed);
// ... rest unchanged
```

**Step 7 — Re-register auto-attack timer on stance switch**

When `STANCE_CHANGED` fires, CombatEngine:
1. Unregisters `combat:autoAttack`
2. Waits `STANCE_SWITCH_PAUSE_MS` (0.5s) — uses `TimeEngine.scheduleOnce('combat:stancePause', 500, callback)`
3. In the callback: re-registers `combat:autoAttack` with the new interval from `getPlayerAutoAttackInterval()`
4. If another `STANCE_CHANGED` fires during the pause, the `scheduleOnce` key `combat:stancePause` is overwritten (TimeEngine.register overwrites existing keys), resetting the 0.5s timer

This means rapid clicking keeps resetting the pause. Auto-attacks only resume 0.5s after the LAST switch.

**Step 8 — Attack animation handling on stance switch**

When `STANCE_CHANGED` fires in GameScene:
- If a lunge animation is in progress, let it finish visually (it's ~200ms) but the attack has already resolved
- The 0.5s pause from Step 7 naturally covers this — no special animation cancellation needed
- The walk timer (`_walkTimer`) continues normally; only the auto-attack timer pauses

---

### Phase 3: Active Abilities

**Step 9 — Three separate ability button files**

Keep `SmashButton.js` as-is (minor changes). Create `FlurryButton.js` and `BulwarkButton.js` following the same pattern.

All three buttons occupy the **same screen position** (`ga.x + 110, ga.y + ga.h - 10`). Only the one matching the current stance is visible.

Each button file is self-contained:
- Owns its own cooldown state (`_cooldownStart`, `_cooldownEnd`, `_cooldownTimer`)
- Cooldowns are **global** — they tick via `Date.now()` timestamps regardless of which stance is active
- Each button subscribes to `STANCE_CHANGED` to show/hide itself
- Each button subscribes to `COMBAT_PLAYER_DIED` to reset its cooldown

**SmashButton.js changes** (minimal):
- Add `STANCE_CHANGED` subscription: `this._btn.setVisible(Store.getState().currentStance === 'power')`
- Add stance check to `_onSmash()`: bail if not in Power stance (safety check, button should be hidden anyway)
- `_isUnlocked()` stays (level 3 gate still applies)
- No other changes — cooldown, damage multiplier, upgrade reading all stay the same

**FlurryButton.js** (new file, follows SmashButton pattern):
- Label: "FLURRY" / "FLURRY (Ns)"
- Color: `#b45309` (amber) ready, `#d97706` hover, `#333333` cooldown
- Visible when `currentStance === 'flurry'` AND player level >= 3
- On use:
  1. Schedule 5 one-shot timers via TimeEngine: `ability:rapid:0` through `ability:rapid:4`, spaced 200ms apart
  2. Each callback calls `CombatEngine.playerAttack(false)` — uses normal auto-attack damage (with Flurry stance mult applied)
  3. If `currentEnemy` is null when a hit fires, it whiffs (CombatEngine.playerAttack already returns early if no enemy)
  4. Track timer keys for cleanup: on stance switch away from Flurry, unregister all `ability:rapid:*` keys
- Cooldown: 30s base
- No upgrades in v1 (future: `rapid_strikes_damage`, `rapid_strikes_recharge` upgrade targets)

**BulwarkButton.js** (new file, follows SmashButton pattern):
- Label: "BULWARK" / "BULWARK (Ns)"
- Color: `#1e40af` (steel blue) ready, `#2563eb` hover, `#333333` cooldown
- Visible when `currentStance === 'fortress'` AND player level >= 3
- On use:
  1. Calculate shield HP: `Math.floor(getEffectiveMaxHp() * 2.0)` (200% of max HP)
  2. Set `CombatEngine.activateShield(shieldHp, 8000)` — CombatEngine stores `shieldHp` and schedules `ability:bulwark:expire` one-shot at 8s to clear it
  3. Emit `BULWARK_ACTIVATED` event for visual feedback
  4. On stance switch away from Fortress: shield persists (it was already activated, let it run out naturally)
- Cooldown: 45s base
- No upgrades in v1 (future: `bulwark_absorb`, `bulwark_recharge` upgrade targets)

**CombatEngine additions for Bulwark:**
- Module-level state: `let shieldHp = 0; let shieldMaxHp = 0;`
- `activateShield(amount, durationMs)`: sets `shieldHp = shieldMaxHp = amount`, schedules expire timer
- `getShieldHp()`: returns `{ current: shieldHp, max: shieldMaxHp }` for UI display
- Shield cleared on: timer expiry, player death, or manual clear
- Shield is **ephemeral** — not saved. On reload, no shield active (acceptable — it's a short-duration combat ability)

---

### Phase 4: Stance Switcher UI

**Step 10 — Rotary stance button** (`src/ui/StanceSwitcher.js` — new file)

Single circular widget in the **upper-left corner** of the game area.

Design:
- Center: current stance icon/symbol (v1 placeholder: colored circle with letter — "F" amber, "P" red, "B" blue)
- Ring: shows cycle order, highlights current stance segment
- Click: cycles to next stance in order (Flurry -> Power -> Fortress -> Flurry)
- Each click emits `STANCE_CHANGED` via `Store.setStance(nextStanceId)`
- During the 0.5s attack pause: brief visual feedback (pulse or flash) to show the switch is processing

Position: `ga.x + 50, ga.y + 50` (upper-left of game area, away from enemy/player sprites)

Subscriptions:
- `STANCE_CHANGED`: update visual to show new stance
- `COMBAT_PLAYER_DIED`: no special handling needed (stance persists through death)

**Step 11 — Player visual per stance** (optional polish)
- Minimal v1: tint the player sprite per stance
  - Flurry: `0xFFD700` (gold/amber tint)
  - Power: `0xFF4500` (orange-red tint)
  - Fortress: `0x4169E1` (royal blue tint)
- Applied on `STANCE_CHANGED` in GameScene
- Future: particle effects, aura sprites, afterimages

---

### Phase 5: StatsPanel + Polish

**Step 12 — StatsPanel updates** (`src/ui/StatsPanel.js`)
- Show current stance name (e.g., "STANCE: Power")
- AUTO DMG and ATK SPEED rows already update correctly if ComputedStats is stance-aware
- Add DAMAGE REDUCTION row: `getDamageReduction() * 100 + '%'` — shows "0%" for Flurry/Power, "50%" for Fortress
- Show shield HP when Bulwark is active (optional, nice-to-have)

**Step 13 — SystemLog messages**
- "Switched to [Stance] stance" on `STANCE_CHANGED`
- "Rapid Strikes!" on Flurry ability use
- "Bulwark activated! (shield: Xhp)" on Fortress ability use
- Existing "Power Smash!" message stays unchanged

**Step 14 — OfflineProgress** (`src/systems/OfflineProgress.js`)
- No code changes needed if ComputedStats is stance-aware
- `getEffectiveDamage()` and `getAutoAttackInterval()` already include stance multipliers from Step 6
- Offline farming uses whichever stance the player left active — this is the intended behavior ("park in a stance and idle")
- Acknowledged: offline DPS will differ per stance. A player in Fortress stance farms slower offline but that's the tradeoff

**Step 15 — Balance simulation** (`scripts/balance-sim.js`)
- Add stance-aware DPS columns: run simulation 3 times (once per stance) per zone
- Show kill times and survival ratios for each stance
- Helps validate that no stance is universally dominant and that Fortress trades DPS for survivability

---

## File Change Summary

| File | Changes |
|------|---------|
| `src/config.js` | Add `STANCES`, `STANCE_IDS`, `STANCE_SWITCH_PAUSE_MS` |
| `src/systems/Store.js` | Add `currentStance` to state + save hydration, `setStance()` action |
| `src/events.js` | Add `STANCE_CHANGED`, `BULWARK_ACTIVATED` events + contracts |
| `src/systems/CombatEngine.js` | Stance `damageMult` in `getPlayerDamage()`, DR + shield in `enemyAttack()`, shield state, attack pause on switch, `activateShield()` |
| `src/systems/ComputedStats.js` | Stance mult in `getEffectiveDamage()` and `getPlayerAutoAttackInterval()`, new `getDamageReduction()` |
| `src/ui/SmashButton.js` | Add stance visibility gate + `STANCE_CHANGED` subscription |
| `src/ui/FlurryButton.js` | **New file** — Rapid Strikes ability button |
| `src/ui/BulwarkButton.js` | **New file** — Bulwark ability button |
| `src/ui/StanceSwitcher.js` | **New file** — rotary stance selector widget |
| `src/ui/StatsPanel.js` | Show stance name, damage reduction row |
| `src/scenes/UIScene.js` | Create StanceSwitcher, FlurryButton, BulwarkButton |
| `src/scenes/GameScene.js` | Player tint per stance on `STANCE_CHANGED` |
| `scripts/balance-sim.js` | Stance-aware DPS columns |

---

## Migration Notes
- Default stance is Power — existing combat feel preserved exactly. Players won't notice stances until they click the switcher
- Power Smash unlocks at level 3. Stances are available from level 1, but all three ability buttons share the level 3 gate. Before level 3, the stance switcher works (stat changes apply) but no ability button appears
- Power Smash upgrades (`power_smash_damage`, `power_smash_recharge`) continue to work, always purchasable regardless of current stance
- Flurry and Fortress abilities have no upgrades in v1 — future upgrade targets are stubbed in design but not in code
- Old saves auto-default to `currentStance: 'power'` via hydration — no migration function needed
- `clickDamageScalar: 0.2` still applies in all stances; stance `damageMult` does NOT apply to clicks

---

## Balance Considerations
- Flurry effective DPS: `baseDPS x 1.8 x 0.6 = 1.08x` — slightly above baseline, spread across many small hits
- Power effective DPS: `baseDPS x 0.5 x 2.0 = 1.0x` — exactly baseline, concentrated in big hits
- Fortress effective DPS: `baseDPS x 0.8 x 0.8 = 0.64x` — 36% DPS loss, compensated by 50% damage reduction
- These are intentionally close in raw DPS so no stance is "always best" — enemy traits determine which is optimal
- Stance switch pause (0.5s) costs ~25-50% of one auto-attack cycle depending on stance speed. Frequent switching has a real DPS cost
- Power Smash in Power stance: `base_click_damage x 3.0-7.0x` (unchanged from current). The 2.0x stance damageMult does NOT stack with smash — smash uses `isClick=true` which bypasses stance mult
- Rapid Strikes in Flurry: 5 hits at Flurry damage = `5 x 0.6 = 3.0x` base damage burst. Comparable to Power Smash but spread over 1 second
- Bulwark in Fortress: 200% max HP shield + 50% DR = effectively absorbs ~400% of max HP worth of raw damage. Strong but temporary (8s)
- Tuning via `npm run balance:sim` with per-stance columns

---

## Damage Pipeline Reference

Where stance multipliers insert into the existing pipeline:

**Auto-attack damage (CombatEngine.getPlayerDamage with isClick=false):**
```
floor(max(STR - enemyDef*0.3, 1) x prestigeMult x critMult x territoryMult x stanceDamageMult)
```

**Click damage (CombatEngine.getPlayerDamage with isClick=true):**
```
floor(max(STR - enemyDef*0.3, 1) x clickDmgMult x prestigeMult x critMult x territoryMult x 1)
                                                                                              ^ stance mult = 1 for clicks
```

**Incoming enemy damage (CombatEngine.enemyAttack):**
```
rawDmg = max(enemyAtk - playerDef*0.5*(1-armorPen), 1)
reduced = max(1, floor(rawDmg x (1 - stanceDamageReduction)))
final   = reduced - min(reduced, shieldHp)  // Bulwark absorb
Store.damagePlayer(final)
```

**Display damage (ComputedStats.getEffectiveDamage):**
```
floor(STR x prestigeMult x territoryMult x stanceDamageMult)
```

**Attack interval (ComputedStats.getPlayerAutoAttackInterval):**
```
max(400, floor(2000 / (playerAtkSpeed x stanceAtkSpeedMult) x (1 - speedBonus - territoryBonus)))
```

---

## What's NOT in v1
- Stance mastery / XP per stance
- Talent trees / branching specializations within stances
- Stance transition bonuses (Flurry->Power combo, etc.)
- Auto-stance-switching for idle play
- Stance-specific gear affixes ("Flurry damage +10%")
- AoE / multi-target (separate feature — see Multi-Enemy plan)
- Rapid Strikes / Bulwark upgrades (upgrade targets designed but not implemented)
- AbilityManager system (not needed — three self-contained button files suffice)
- Stance momentum mechanics (combo stacks, charge-up, etc.)

All of these are great future features that build on this foundation without requiring rework.
