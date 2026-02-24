# Stances Implementation Plan (v2.1 - locked decisions)

## Goal
Add three combat stances - **Flurry**, **Power**, and **Fortress** - that the player can switch between.  
Each stance modifies core combat stats and exposes one stance-specific active ability.

## Locked Design Decisions
- Stance switching has **no cooldown**.
- Every stance switch applies a **0.5s pause to auto-attacks only**.
- Manual clicks are **not** paused by stance switching.
- Ability cooldowns are **global wall-clock** timers (`Date.now()` based) and continue through death/respawn.
- Ability execution timers are owned by **CombatEngine** (buttons are trigger/UI only).
- Switching away from Flurry **cancels** any remaining Rapid Strikes hits.
- During Rapid Strikes, if the current target dies, remaining hits retarget the current live target.
- During Rapid Strikes, if no target exists (spawn-delay gap), that tick **whiffs**.
- Fortress damage reduction applies to **all incoming damage**, including DoT.
- Bulwark absorbs **all incoming damage**, including DoT.
- Stance switching is **blocked while player is dead**.
- All stance abilities are available from **level 1** (no level gate).
- Click damage remains stance-neutral (`stance.damageMult` does not apply to clicks).
- No AbilityManager abstraction in v1; keep three explicit button files.

---

## Stance Data

```js
export const STANCES = {
  flurry:   { id: 'flurry',   label: 'Flurry',   atkSpeedMult: 1.8, damageMult: 0.6, damageReduction: 0.0 },
  power:    { id: 'power',    label: 'Power',    atkSpeedMult: 0.5, damageMult: 2.0, damageReduction: 0.0 },
  fortress: { id: 'fortress', label: 'Fortress', atkSpeedMult: 0.8, damageMult: 0.8, damageReduction: 0.5 },
};

export const STANCE_IDS = ['flurry', 'power', 'fortress'];
export const STANCE_SWITCH_PAUSE_MS = 500;
```

---

## Ability Behavior

### Flurry: Rapid Strikes
- 5 timed hits at 200ms spacing.
- Uses normal auto-attack damage model (`playerAttack(false)` semantics).
- Engine-owned timer keys per cast (for safe cancellation/cleanup).
- Cancel remaining hits on stance switch away from Flurry.

### Power: Power Smash
- Existing smash behavior retained.
- Gated by current stance (`power`) only.
- Existing upgrades (`power_smash_damage`, `power_smash_recharge`) unchanged.

### Fortress: Bulwark
- Shield absorb amount: `floor(getEffectiveMaxHp() * 2.0)`.
- Duration cap: 8s.
- Incoming damage flow: stance DR first, then shield absorb, overflow to HP.
- Shield persists if player switches stance after activation.

---

## Implementation Plan

### Phase 1 - Data, Store, Events

### Step 1 - Config
File: `src/config.js`
- Add `STANCES`, `STANCE_IDS`, `STANCE_SWITCH_PAUSE_MS`.

### Step 2 - Store state and mutation
File: `src/systems/Store.js`
- Add `currentStance: 'power'` to initial state.
- Hydrate with validation:
  - If saved stance is invalid/missing, keep default `'power'`.
- Add `setStance(stanceId)`:
  - Validate stance ID.
  - No-op if unchanged.
  - Emit `STANCE_CHANGED` with `{ stanceId, previousStance }`.
- No schema bump required.
- No stance pause timer fields in save (ephemeral engine state only).

### Step 3 - Events and contracts
File: `src/events.js`
- Add `STANCE_CHANGED` and `BULWARK_ACTIVATED` event keys.
- Add event contracts using current array style:
  - `STANCE_CHANGED`: `['stanceId', 'previousStance']`
  - `BULWARK_ACTIVATED`: `['shieldHp', 'durationMs']`

---

### Phase 2 - Core Combat Integration

### Step 4 - Stance damage multiplier (auto-attacks only)
File: `src/systems/CombatEngine.js`
- In `getPlayerDamage(state, isClick)` apply:
  - `stance.damageMult` when `isClick === false`
  - `1` when `isClick === true`

### Step 5 - Stance-aware display formulas
File: `src/systems/ComputedStats.js`
- `getEffectiveDamage()` multiplies by `stance.damageMult`.
- `getPlayerAutoAttackInterval()` multiplies speed by `stance.atkSpeedMult`.
- `getClickDamage()` unchanged (still stance-neutral).
- Add `getDamageReduction()` for UI display.

### Step 6 - Unified incoming damage pipeline
File: `src/systems/CombatEngine.js`
- Add helper (engine-owned), e.g. `_applyIncomingDamage(rawDamage, source)`:
  1. Apply stance DR (Fortress, etc.).
  2. Apply Bulwark absorb.
  3. Call `Store.damagePlayer(finalDamage)`.
- Route all incoming damage through this helper:
  - `enemyAttack(...)`
  - DoT ticker callbacks
- This makes Fortress DR and Bulwark consistent across hit types.

### Step 7 - Auto-attack pause on stance change
File: `src/systems/CombatEngine.js`
- Listen for `STANCE_CHANGED`.
- On change:
  - `TimeEngine.unregister('combat:autoAttack')`
  - `TimeEngine.scheduleOnce('combat:stancePause', ..., STANCE_SWITCH_PAUSE_MS)`
  - In callback, re-register `combat:autoAttack` with new interval.
- If another stance change occurs during pause, timer key overwrite resets pause.
- Guard callback: if player is dead, do not restart auto-attack early.

### Step 8 - Flurry cancel hook
File: `src/systems/CombatEngine.js`
- On `STANCE_CHANGED` away from `flurry`, cancel active Rapid Strikes timers.

---

### Phase 3 - Ability Execution + Buttons

### Step 9 - Engine-owned ability execution API
File: `src/systems/CombatEngine.js`
- Add `activateRapidStrikes()`:
  - Create cast ID.
  - Schedule 5 one-shot timers (`ability:rapid:${castId}:${i}`).
  - Each tick calls `playerAttack(false)` if target exists.
  - Whiff silently if no target exists.
- Add `cancelRapidStrikes()` to clear all active Rapid Strikes timer IDs.
- Add `activateShield(amount, durationMs)`.
- Add `getShieldHp()`.
- Clear shield and rapid timers on:
  - player death
  - engine destroy
  - relevant encounter lifecycle cleanup

### Step 10 - Button responsibilities (UI only)
Files:
- `src/ui/SmashButton.js`
- `src/ui/FlurryButton.js` (new)
- `src/ui/BulwarkButton.js` (new)

Rules:
- Buttons own only:
  - stance visibility
  - local cooldown display state (`Date.now()` based)
  - click handlers calling engine methods
- Buttons do **not** own combat execution timers.
- Buttons do **not** reset cooldown on `COMBAT_PLAYER_DIED`.
- No level-gate checks; abilities available at level 1.

Per-button behavior:
- Smash: visible when stance is `power`, calls `CombatEngine.powerSmashAttack(multiplier)`.
- Flurry: visible when stance is `flurry`, calls `CombatEngine.activateRapidStrikes()`.
- Bulwark: visible when stance is `fortress`, calls `CombatEngine.activateShield(...)`.

---

### Phase 4 - Stance Switcher + Scene Wiring

### Step 11 - StanceSwitcher UI
File: `src/ui/StanceSwitcher.js` (new)
- Rotary switch button in top-left of game area (`ga.x + 50, ga.y + 50`).
- Click cycles `flurry -> power -> fortress -> flurry`.
- Uses `Store.setStance(nextId)`.
- Guard: if `CombatEngine.isPlayerDead()` return early (no switch while dead).
- Visual pulse while pause window is active (optional but recommended).

### Step 12 - UIScene lifecycle wiring
File: `src/scenes/UIScene.js`
- Instantiate `StanceSwitcher`, `FlurryButton`, `BulwarkButton`.
- Add them to map open/close hide/show flow alongside existing buttons.
- Add full shutdown destroy wiring for all new UI objects.

### Step 13 - GameScene integration
File: `src/scenes/GameScene.js`
- Subscribe to `STANCE_CHANGED` and tint player sprite by stance.
- Keep existing attack animation model.
- Fix player walk lock balancing for rapid hit bursts:
  - If replacing `_playerPoseTimer`, release the prior lock before creating a new one.

---

### Phase 5 - Stats, Log, Offline, Sim

### Step 14 - StatsPanel
File: `src/ui/StatsPanel.js`
- Add stance row (`STANCE: Power`, etc.).
- Add damage reduction row from `ComputedStats.getDamageReduction()`.
- Optional: shield row from `CombatEngine.getShieldHp()`.

### Step 15 - SystemLog
File: `src/ui/SystemLog.js`
- Add messages:
  - `STANCE_CHANGED`: switched stance
  - Rapid Strikes used
  - Bulwark activated with shield amount
- Remove/avoid level-based ability unlock messaging (abilities are level 1).

### Step 16 - OfflineProgress
File: `src/systems/OfflineProgress.js`
- No direct logic changes expected if ComputedStats is stance-aware.
- Offline uses the currently saved stance by design.

### Step 17 - balance-sim
File: `scripts/balance-sim.js`
- Add per-stance simulation outputs (kill speed + survival).

---

## File Change Summary

| File | Changes |
|------|---------|
| `src/config.js` | Add stance constants |
| `src/systems/Store.js` | Add `currentStance`, hydration validation, `setStance()` |
| `src/events.js` | Add `STANCE_CHANGED`, `BULWARK_ACTIVATED`, contracts |
| `src/systems/CombatEngine.js` | Stance multipliers, unified incoming damage pipeline, auto-attack pause handling, engine-owned ability execution timers, shield state |
| `src/systems/ComputedStats.js` | Stance-aware damage/interval + `getDamageReduction()` |
| `src/ui/SmashButton.js` | Stance visibility + no level gate + no death cooldown reset |
| `src/ui/FlurryButton.js` | New trigger/cooldown UI for Rapid Strikes |
| `src/ui/BulwarkButton.js` | New trigger/cooldown UI for Bulwark |
| `src/ui/StanceSwitcher.js` | New rotary stance selector |
| `src/scenes/UIScene.js` | Create/show/hide/destroy new stance UI controls |
| `src/scenes/GameScene.js` | Stance tint + lock-balance fix for rapid burst animation |
| `src/ui/StatsPanel.js` | Stance + DR rows |
| `src/ui/SystemLog.js` | Stance/ability log messages |
| `scripts/balance-sim.js` | Per-stance reporting |

---

## Migration Notes
- Default stance is `power` for backward compatibility with existing feel.
- Old saves without `currentStance` hydrate to `power`.
- No save schema migration needed.
- Cooldowns are timestamp-based and naturally survive scene transitions/death.
- Shield state is ephemeral and not persisted (expected behavior).

---

## Damage Pipeline Reference

**Auto-attack damage**
```txt
floor(max(STR - enemyDef*0.3, 1) * clickOrAutoMult * prestigeMult * critMult * territoryMult * stanceDamageMultForAutoOnly)
```

**Incoming damage (all sources, including DoT)**
```txt
rawIncoming
-> stance reduction (Fortress)
-> shield absorb (Bulwark)
-> overflow to player HP
```

**Attack interval**
```txt
max(400, floor(baseAttackIntervalMs / (playerAtkSpeed * stanceAtkSpeedMult) * (1 - speedBonus - territoryBonus)))
```

---

## Not in v1
- Stance mastery
- Stance talents
- Transition bonuses
- Auto stance switching
- Stance-specific item affixes
- Rapid Strikes/Bulwark upgrade lines
- AbilityManager abstraction

