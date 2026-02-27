# Phase 3: Charge Attack Mechanic (Revised)

## Assessment Critique

1. The event strategy is overcomplicated.
   - Adding `COMBAT_ENEMY_CHARGING` duplicates existing `COMBAT_ENEMY_CASTING` subscribers (`GameScene`, `SkillUnlockDirector`) and creates unnecessary migration churn.
   - Better: keep `COMBAT_ENEMY_CASTING`, add `castKind: 'summon' | 'charge'`.

2. Some method references do not match current engine structure.
   - `CombatEngine` uses `_registerMemberTimers`, `_unregisterMemberTimers`, and `_onEncounterEnd`.
   - The current plan references `_onEncounterEnded` / `_teardownEncounter`, which do not exist.

3. UI integration is underspecified for existing bar behavior.
   - `GameScene` already uses enemy slot `chargeBar*` for slow auto-attack timing.
   - A charge-cast wind-up must temporarily take over that same bar and then hand control back cleanly.

4. Data validation is missing from scope.
   - `scripts/validate-data.js` currently validates `summon` but has no `chargeAttack` schema checks.

5. Unlock trigger migration is risky if done as a hard swap.
   - Replacing summon-cast unlock completely can create edge-case lockouts during rollout/tests.
   - Better: prioritize charge-cast trigger, keep summon as fallback until Phase 3 is fully stabilized.

6. Verification coverage is incomplete.
   - We already have `npm run verify:combat`; Phase 3 should extend that script with charge-specific assertions.

## Goal

Add an enemy `chargeAttack` trait with visible telegraph and interrupt gameplay, while preserving existing summon-cast behavior and minimizing event/API churn.

## Scope

- In scope:
  - `chargeAttack` enemy trait (data + runtime)
  - Interrupt support for canceling charge casts
  - Enemy cast UI updates in `GameScene`
  - Interrupt unlock tuning to react to charge casts first
  - Data validator + combat verifier updates
- Out of scope:
  - Broad roster rebalance
  - New art pipeline requirements

## Design Decisions

1. Reuse `COMBAT_ENEMY_CASTING` with `castKind` instead of adding a separate charging-start event.
2. Add one completion event: `COMBAT_ENEMY_CHARGE_RESOLVED` for clean UI teardown on successful cast.
3. Keep timer ownership inside existing member timer lifecycle (`_registerMemberTimers` / `_unregisterMemberTimers`).
4. Reuse existing enemy slot cast bar for charge wind-up with amber color and explicit state tracking.
5. Keep summon-cast interrupt behavior unchanged; extend interrupt to cancel charge casts too.
6. Keep player-facing stance names: `Ruin`, `Tempest`, `Fortress`.

---

## Task P3-1: Extend Enemy Trait Schema + Validator

**Files**
- Modify: `src/data/enemies.js`
- Modify: `scripts/validate-data.js`

**Changes**
1. Add optional enemy trait schema:
   ```js
   chargeAttack: {
     damageMult: number,   // > 1
     castTimeMs: integer,  // > 0
     cooldownMs: integer,  // > 0
   }
   ```
2. Add validator checks for `chargeAttack` shape and ranges.
3. Add charge trait to at least one area-2 enemy that appears in global zones 13-15.
   - Recommended: add to existing `a2_zombie` to avoid introducing unnecessary new assets/content IDs.

**Commit**
`feat: add chargeAttack enemy trait schema and data validation`

---

## Task P3-2: Update Event Contracts (No New Charging-Start Event)

**Files**
- Modify: `src/events.js`

**Changes**
1. Extend existing casting payload contract:
   - `COMBAT_ENEMY_CASTING` now includes:
     - `castTime` (existing, keep for compatibility)
     - `castKind` (`'summon' | 'charge'`)
2. Add completion event:
   - `COMBAT_ENEMY_CHARGE_RESOLVED: 'combat:enemyChargeResolved'`
   - payload: `{ encounterId, instanceId, slot, enemyId, damage }`
3. Extend interrupted payload contract:
   - `COMBAT_INTERRUPTED` adds `kind` (`'summon' | 'charge'`).

**Commit**
`feat: extend cast/interrupt event contracts for charge attacks`

---

## Task P3-3: Implement Charge Attack Runtime in CombatEngine

**Files**
- Modify: `src/systems/CombatEngine.js`

**Changes**
1. In `_buildMember`, add normalized charge trait + runtime fields:
   - `chargeAttack` (or `null`)
   - `_chargeCasting`, `_chargeCastTimerId`
2. In `_toMemberPayload`, include `chargeAttack` for UI/trait rendering.
3. In `_registerMemberTimers`, register recurring charge-attempt timer when `member.chargeAttack` exists.
4. In `_unregisterMemberTimers`, fully clean up charge timers/state.
5. Add helpers:
   - `_tryStartChargeCast(instanceId)`
   - `_resolveChargeCast(instanceId)`
   - `_cancelChargeCast(member, source = 'interrupt')`
6. Emit `COMBAT_ENEMY_CASTING` with `castKind: 'charge'` when charge wind-up starts.
7. On resolve:
   - apply incoming damage via `_applyIncomingDamage(rawDamage, 'attack', member)`
   - emit `COMBAT_ENEMY_CHARGE_RESOLVED` with context.
8. Ensure summon flow remains intact and unchanged.

**Commit**
`feat: implement chargeAttack runtime in CombatEngine`

---

## Task P3-4: Extend Interrupt to Cancel Charge Casts

**Files**
- Modify: `src/systems/CombatEngine.js`

**Changes**
1. Update `interruptTarget()` cancel path:
   - try `_cancelChargeCast(target, 'player')` first
   - fallback to `_cancelSummonCast(target, 'player')`
2. Keep existing stun and interrupt upgrade effects unchanged.
3. Emit `COMBAT_INTERRUPTED` with `kind` from the canceled cast type.

**Commit**
`feat: allow interrupt to cancel charge casts`

---

## Task P3-5: Integrate Charge-Cast UI in GameScene

**Files**
- Modify: `src/scenes/GameScene.js`

**Changes**
1. Add slot cast state:
   - `slot.state.castTimerKey`
   - `slot.state.castKind`
2. Update `_onEnemyCasting(data)`:
   - For `castKind === 'charge'`:
     - show amber wind-up bar on enemy slot (`#f59e0b` / `0xf59e0b`)
     - show status text `CHARGING!`
     - set cast state keys
   - For `castKind === 'summon'`:
     - keep existing `CASTING` behavior
3. In `update()`:
   - If slot has active cast state, drive bar progress from cast timer key.
   - Otherwise preserve existing slow-auto-attack bar behavior.
4. On `_onInterrupted(data)`:
   - clear cast state/bar for interrupted slot.
5. Add handler for `COMBAT_ENEMY_CHARGE_RESOLVED`:
   - clear cast state/bar and return to normal bar behavior.
6. Ensure cleanup in encounter-end / member-death paths resets cast state.

**Commit**
`feat: add charge-cast telegraph UI and cleanup flow`

---

## Task P3-6: Update Skill Unlock Trigger Policy

**Files**
- Modify: `src/systems/SkillUnlockDirector.js`

**Changes**
1. Prefer charge casts for Interrupt unlock:
   - listen to `COMBAT_ENEMY_CASTING`
   - unlock when `castKind === 'charge'`
2. Keep summon-cast fallback temporarily:
   - if `castKind === 'summon'` and still locked, allow unlock
   - remove fallback in a later cleanup pass once charge enemy pacing is validated.

**Commit**
`feat: prioritize charge-cast trigger for interrupt unlock`

---

## Task P3-7: Expand Automated Verification

**Files**
- Modify: `scripts/verify-combat-mechanics.js`

**Add tests for**
1. Charge cast start emits `COMBAT_ENEMY_CASTING` with `castKind: 'charge'`.
2. Uninterrupted charge resolves and emits `COMBAT_ENEMY_CHARGE_RESOLVED`.
3. Interrupt during charge emits `COMBAT_INTERRUPTED` with `kind: 'charge'` and prevents resolve.
4. Summon interrupt behavior remains unchanged (regression guard).

**Commit**
`test: add charge-attack combat verification coverage`

---

## Verification Checklist

1. `npm run validate:data` passes (with `chargeAttack` schema checks).
2. `npm run verify:combat` passes (including new charge tests).
3. `npm run build` passes.
4. In zones 13-15, at least one enemy uses charge attack telegraph.
5. Charge cast shows amber wind-up and `CHARGING!` status text.
6. Uninterrupted charge deals heavy damage and clears cast UI.
7. Interrupt cancels charge cast, emits `INTERRUPTED!`, applies stun/buffs as before.
8. Summon casts still function and remain interruptible.
9. Interrupt unlock occurs reliably from charge casts (summon fallback still works).
10. Save/load has no regressions for stance skills and unlock flags.

## Final Integration Commit

`feat: phase3 charge attack mechanic and interrupt integration`
