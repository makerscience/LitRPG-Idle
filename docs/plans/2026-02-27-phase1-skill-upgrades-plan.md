# Phase 1: Skill Tier Upgrades, UpgradePanel Tabs, and Stance Rename (Ruin / Tempest)

## Decision Lock

- Player-facing stance names are now:
  - `Ruin` (previously `Power`)
  - `Tempest` (previously `Flurry` / fast stance)
  - `Fortress` (unchanged)
- This plan includes the naming change as part of implementation scope, including save compatibility.

## Assessment Critiques (what needed correction)

1. The previous draft had stale agent-specific instructions and encoding artifacts that should not be in an implementation plan.
2. Save compatibility was incomplete. It covered removing old smash upgrades, but missed:
   - `currentStance` migration (`power` / `flurry` -> `ruin` / `tempest`)
   - SaveManager migration side effects (skill-point reconstruction and allowlists)
3. Several implementation details were under-specified for the current codebase:
   - Current `CombatEngine.activateRapidStrikes()` has a fixed hit count and no per-cast parameter.
   - Secondary buttons currently read cooldowns from `ABILITIES` config only.
   - Temporary combat effects need explicit timer cleanup at encounter end/death.
4. UpgradePanel task scope did not clearly separate hidden upgrades (`requiresFlag`) from locked-but-visible tiers (`requires`).
5. Renaming scope was not explicit across all stance key consumers (`config`, `Store`, `UIScene`, `StanceSwitcher`, combat fallbacks).

## Goal

Replace linear Smash upgrades with a 3-tier system for all 6 skills, redesign UpgradePanel with tabs, and migrate stance naming to `Ruin` and `Tempest` with backward-compatible save handling.

## Non-Goals

- No Phase 2 milestone trigger implementation in this phase (see revised Phase 2 plan below).
- No charge-attack redesign work (Phase 3).
- No asset filename renames in this phase unless required for runtime breakage.

## Key Files

- `src/data/upgrades.js`
- `src/systems/UpgradeManager.js`
- `src/systems/CombatEngine.js`
- `src/systems/Store.js`
- `src/systems/SaveManager.js`
- `src/ui/UpgradePanel.js`
- `src/ui/SmashButton.js`
- `src/ui/FlurryButton.js`
- `src/ui/BulwarkButton.js`
- `src/ui/ArmorBreakButton.js`
- `src/ui/InterruptButton.js`
- `src/ui/CleanseButton.js`
- `src/scenes/UIScene.js`
- `src/ui/StanceSwitcher.js`
- `src/config.js`

---

## Task 0: Institute Stance Rename (Ruin / Tempest)

### Files

- Modify: `src/config.js`
- Modify: `src/systems/Store.js`
- Modify: `src/systems/SaveManager.js`
- Modify: `src/scenes/UIScene.js`
- Modify: `src/ui/StanceSwitcher.js`
- Modify: `src/systems/CombatEngine.js`
- Modify: any file using `STANCES.*` fallback defaults

### Changes

1. Rename stance IDs in config:
   - `power` -> `ruin`
   - `flurry` -> `tempest`
   - `fortress` unchanged
2. Update `STANCE_IDS` order to keep existing cycle behavior:
   - `['tempest', 'ruin', 'fortress']`
3. Update all defaults and fallback expressions:
   - `STANCES.power` -> `STANCES.ruin`
   - stance maps keyed by old IDs -> new IDs
4. Migrate save data:
   - If `currentStance === 'power'`, map to `'ruin'`
   - If `currentStance === 'flurry'`, map to `'tempest'`
5. Keep player-facing ability names unchanged in this phase (`Power Smash` may remain as ability name if desired), but stance labels in UI must show `Ruin` and `Tempest`.

### Commit

`refactor: rename power/fast stance to ruin/tempest with save migration`

---

## Task 1: Define 18 Skill Tier Upgrades

### Files

- Modify: `src/data/upgrades.js`

### Changes

1. Remove:
   - `power_smash_damage`
   - `power_smash_recharge`
2. Add 18 tier entries (3 tiers x 6 skills), each `maxLevel: 1`, with:
   - `group: 'skill'`
   - `stance: 'ruin' | 'tempest' | 'fortress'`
   - `requires` for tier chains
   - `requiresFlag` for secondary skills
3. Add `group: 'stat'` for existing stat and exploit upgrades.
4. Add helpers:
   - `getUpgradesByGroup(group)`
   - `getSkillUpgradesByStance(stance)`
5. Ensure tier IDs are stable and migration-safe (do not rename after shipping).

### Commit

`feat: add 18 skill tier upgrades grouped by stance`

---

## Task 2: UpgradeManager Gating and Convenience APIs

### Files

- Modify: `src/systems/UpgradeManager.js`

### Changes

1. `canPurchase(upgradeId)` checks in order:
   - upgrade exists
   - not maxed
   - `requires` tier owned
   - `requiresFlag` enabled
   - currency affordability
2. Add:
   - `hasUpgrade(upgradeId): boolean`
   - `isVisible(upgradeId): boolean` (false only when `requiresFlag` missing)
3. Keep backward compatibility for stat upgrades with no `group`.

### Commit

`feat: add requires/requiresFlag gating to upgrade manager`

---

## Task 3: Save and Migration Hardening

### Files

- Modify: `src/config.js` (`SAVE.schemaVersion` bump)
- Modify: `src/systems/SaveManager.js`
- Modify: `src/systems/Store.js` (hydrate fallback safety)

### Changes

1. Bump save schema version and add migration step for:
   - stance ID remap (`power`/`flurry` -> `ruin`/`tempest`)
   - old Smash upgrade refund:
     - refund spent points from `power_smash_damage` + `power_smash_recharge`
     - remove orphaned keys from `purchasedUpgrades`
2. Update any standard-upgrade bookkeeping in SaveManager so skill-point math does not regress after old IDs are removed.
3. Verify migrated saves do not lose valid new tier purchases.

### Commit

`feat: migrate saves for ruin/tempest stance ids and old smash refunds`

---

## Task 4: Wire Primary Skill Tier Effects

### Files

- Modify: `src/ui/SmashButton.js`
- Modify: `src/ui/FlurryButton.js` (Tempest stance skill button class can remain named `FlurryButton` for now)
- Modify: `src/ui/BulwarkButton.js`
- Modify: `src/systems/CombatEngine.js`

### Changes

1. Smash (Ruin primary):
   - t1: damage mult 3.0 -> 4.0
   - t2: apply vulnerability debuff (+15% incoming player damage for 10s)
   - t3: cooldown 30s -> 22s
2. Rapid Strikes (Tempest primary):
   - t1: hit count 5 -> 6
   - t2: apply per-hit DOT
   - t3: cooldown 10s -> 7s
3. Bulwark (Fortress primary):
   - t1: absorb from 10% max HP -> 14%
   - t2: reflect damage while shield active
   - t3: duration 8s -> 14s
4. `CombatEngine.activateRapidStrikes(hitCount = 5)` must accept per-cast hit count.
5. Add explicit cleanup for new temporary effects/timers on encounter end, death, and target death.

### Commit

`feat: wire primary tier effects for ruin tempest and fortress skills`

---

## Task 5: Wire Secondary Skill Tier Effects

### Files

- Modify: `src/ui/ArmorBreakButton.js`
- Modify: `src/ui/InterruptButton.js`
- Modify: `src/ui/CleanseButton.js`
- Modify: `src/systems/CombatEngine.js`

### Changes

1. Armor Break (Ruin secondary):
   - t1: shred 35% -> 50%
   - t2: duration 6s -> 9s
   - t3: cooldown 15s -> 10s
   - move from binary `_armorBroken` to numeric shred field
2. Interrupt (Tempest secondary):
   - t1: stun duration 1s -> 2s
   - t2: grant +30% player attack speed for 3s on successful interrupt
   - t3: cooldown 10s -> 8s
3. Cleanse (Fortress secondary):
   - t1: 3s corruption/DOT immunity after cleanse
   - t2: deal purge-scaling damage on cleanse
   - t3: cooldown 20s -> 14s
4. Secondary buttons should compute cooldown dynamically from upgrades, not only static `ABILITIES`.

### Commit

`feat: wire secondary tier effects and dynamic cooldowns`

---

## Task 6: UpgradePanel Redesign (Stats | Skills)

### Files

- Modify: `src/ui/UpgradePanel.js`

### Changes

1. Add tab state:
   - `_currentTab: 'stats' | 'skills'`
2. `STATS` tab:
   - preserve current standard/exploit behavior
3. `SKILLS` tab:
   - sections: `Ruin`, `Tempest`, `Fortress`
   - show primary tiers always
   - hide secondary tiers when `requiresFlag` is false
   - show locked tiers (missing `requires`) as disabled with prerequisite text
   - show purchased tiers as complete
4. Add scroll behavior or panel size changes to prevent clipping.
5. Keep hotkey and modal behavior unchanged.

### Commit

`feat: redesign upgrade panel with stats and skills tabs`

---

## Task 7: Dev Helper and Verification Support

### Files

- Modify: `src/main.js` or another central dev bootstrap location

### Changes

1. In DEV only:
   - `window.__unlockSkill(name)` sets unlock flags
   - optional helper: `window.__grantSP(n)` for rapid testing
2. Keep helper out of production builds.

### Commit

`chore: add dev-only helpers for skill tier testing`

---

## Task 8: Verification Checklist

1. `npm run build` passes.
2. Load existing pre-change save and verify automatic migration:
   - stance name maps correctly
   - old smash upgrades refunded once
3. Skills panel shows `Ruin`, `Tempest`, `Fortress`.
4. Tier progression works:
   - tier 2 requires tier 1
   - tier 3 requires tier 2
5. Secondary tiers remain hidden until unlock flag is enabled.
6. Each tier effect is observable in combat.
7. Save, reload, and verify all tier purchases persist.
8. Regression check:
   - standard upgrades still purchase and apply correctly
   - exploit upgrades still gated by crack flag

## Final Integration Commit

`feat: phase 1 skill tiers panel redesign and ruin-tempest stance naming`

---

## Phase 2 (Revised): Milestone Unlocks, Teaching Sequences, and Action Button Gating

### Phase 2 Critique

1. The current document only mentioned Phase 2 as a non-goal, but had no executable Phase 2 implementation plan.
2. Unlock rules were described narratively elsewhere but not mapped to concrete runtime triggers and code paths.
3. Secondary action buttons are currently always shown in stance action slot B; there is no unlock gating.
4. Dialogue/tutorial sequencing risks repeated spam without idempotent guard flags and cooldown handling.
5. The "charge attack" unlock path for Interrupt depended on an enemy mechanic that needs a deterministic trigger definition.

### Phase 2 Goal

Ship progression-based unlock flow for Armor Break, Cleanse, and Interrupt, including:
- first-encounter unlock triggers
- one-time SYSTEM teaching sequences
- slot B action button visibility gating by unlock flags
- clear QA hooks for forced unlock testing

### Scope

- In scope:
  - unlock detection and persistence via `Store.flags`
  - tutorial line sequencing and one-time gating
  - UI slot B visibility tied to unlock flags
  - pulse/highlight affordance when newly unlocked
- Out of scope:
  - broad enemy roster rebalance
  - redesign of existing dialogue systems unrelated to skill unlocks
  - Phase 3 mechanics beyond existing cast interruption hooks

### Unlock Source of Truth

Use these flag keys (already used by skill tiers):
- `unlockedArmorBreak`
- `unlockedCleanse`
- `unlockedInterrupt`

Additional recommended one-shot tutorial flags:
- `tutorialArmorBreakShown`
- `tutorialCleanseShown`
- `tutorialInterruptShown`

### Revised Phase 2 Tasks

#### Task P2-1: Add Deterministic Unlock Trigger Director

**Files**
- Add: `src/systems/SkillUnlockDirector.js`
- Modify: `src/scenes/UIScene.js` (init/destroy director)

**Plan**
1. Subscribe to `EVENTS.COMBAT_ENCOUNTER_STARTED`:
   - unlock Armor Break on first encounter containing any member with `armor.reduction > 0`
   - unlock Cleanse on first encounter containing high-pressure effect member:
     - `thorns > 0` OR `dot > 0` OR `corruption > 0`
2. Subscribe to `EVENTS.COMBAT_ENEMY_CASTING`:
   - unlock Interrupt on first enemy cast event (first live telegraph)
3. Ensure each unlock is idempotent:
   - if flag already true, do nothing
4. Emit a focused event when unlocked (recommended):
   - new event: `EVENTS.SKILL_UNLOCKED` payload `{ skill: 'ArmorBreak'|'Cleanse'|'Interrupt', source, encounterId? }`

#### Task P2-2: Add Tutorial Sequences for Unlock Moments

**Files**
- Modify: `src/data/dialogue.js`
- Modify: `src/systems/DialogueManager.js`
- Optional: `src/systems/SkillUnlockDirector.js` (orchestration)

**Plan**
1. Add three scripted unlock line bundles keyed by skill:
   - Armor Break
   - Cleanse
   - Interrupt
2. On `SKILL_UNLOCKED`, queue 3-4 lines with short delays.
3. Protect with tutorial shown flags:
   - do not replay after first completion
4. Keep text aligned with renamed stance labels:
   - Ruin / Tempest / Fortress (not Power / Flurry)

#### Task P2-3: Gate Slot B Secondary Buttons by Unlock Flags

**Files**
- Modify: `src/scenes/UIScene.js`

**Plan**
1. In `_refreshStanceActions()`, show slot A always.
2. Show slot B conditionally by stance:
   - Ruin slot B (`ArmorBreakButton`) only if `flags.unlockedArmorBreak`
   - Tempest slot B (`InterruptButton`) only if `flags.unlockedInterrupt`
   - Fortress slot B (`CleanseButton`) only if `flags.unlockedCleanse`
3. Subscribe to unlock/state change events so slot visibility updates immediately.

#### Task P2-4: Add Unlock Affordance Pulse

**Files**
- Modify: `src/ui/ArmorBreakButton.js`
- Modify: `src/ui/InterruptButton.js`
- Modify: `src/ui/CleanseButton.js`

**Plan**
1. Add `pulseUnlock()` method to each secondary button.
2. On first unlock event, pulse the newly available button in slot B for discoverability.
3. Ensure pulse cancels cleanly on hide/destroy.

#### Task P2-5: Add Phase 2 Verification Harness

**Files**
- Modify: `src/main.js` (DEV only helpers)

**Plan**
1. Keep `__unlockSkill(name)` and add optional convenience:
   - `__lockSkill(name)` for regression testing
2. Optional test helper:
   - `__setZone(area, zone)` if not already exposed through existing systems

### Testing Checklist (Phase 2)

1. Fresh profile:
   - secondary slot B hidden in all stances at start
2. Encounter armored enemy:
   - `unlockedArmorBreak` becomes true once
   - tutorial sequence plays once
   - Ruin slot B appears and is usable
3. Encounter thorns/dot/corruption pressure:
   - `unlockedCleanse` becomes true once
   - tutorial sequence plays once
   - Fortress slot B appears and is usable
4. First enemy cast/charge telegraph:
   - `unlockedInterrupt` becomes true once
   - tutorial sequence plays once
   - Tempest slot B appears and is usable
5. Save/load persistence:
   - unlock flags and tutorial-shown flags persist and do not replay
6. Regression:
   - Skills tab secondary tier visibility remains tied to same unlock flags
   - no duplicate unlock spam when re-encountering trigger enemies

### Suggested Phase 2 Commits

1. `feat: add skill unlock director with milestone triggers`
2. `feat: add one-time skill unlock tutorial sequences`
3. `feat: gate stance secondary action buttons by unlock flags`
4. `feat: add unlock pulse affordance for secondary skills`
5. `chore: add phase2 dev helpers and verification hooks`
