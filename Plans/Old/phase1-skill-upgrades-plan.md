# Phase 1: Skill Upgrade Tiers + UpgradePanel Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing linear power smash upgrades with a 3-tier system for all 6 skills (3 primary + 3 secondary), and redesign the UpgradePanel with tabs to accommodate them.

**Architecture:** Each skill tier is a standalone upgrade entry (maxLevel: 1) with a `requires` field for prerequisite tiers. The UpgradePanel gets a tab system (Stats | Skills) with skills grouped by stance. Secondary skill tiers are hidden until their unlock flag is set.

**Tech Stack:** Phaser 3, Vite 7, break_infinity.js

---

## Context

The stance/skill/tutorial design (see `docs/plans/2026-02-27-stance-skills-tutorial-design.md`) defines 3 upgrade tiers per skill, 6 skills total = 18 new upgrade entries. This replaces the existing 2 power smash upgrades (`power_smash_damage`, `power_smash_recharge`).

Phase 2 (separate plan) will add milestone unlock triggers, SYSTEM teaching sequences, and button gating. Phase 3 adds the charge attack mechanic. This phase focuses purely on the upgrade data + UI.

## Key Files

- `src/data/upgrades.js` — upgrade definitions (main changes)
- `src/ui/UpgradePanel.js` — panel UI (tab redesign)
- `src/ui/SmashButton.js` — reads upgrade multipliers for damage/cooldown
- `src/ui/FlurryButton.js` — hardcoded 10s cooldown, 5 hits
- `src/ui/BulwarkButton.js` — hardcoded 45s cooldown, 10% HP shield, 8s duration
- `src/ui/ArmorBreakButton.js` — reads config for duration/cooldown
- `src/ui/InterruptButton.js` — reads config for cooldown
- `src/ui/CleanseButton.js` — reads config for cooldown
- `src/systems/CombatEngine.js` — damage calc, skill execution
- `src/systems/UpgradeManager.js` — purchase/query logic
- `src/systems/Store.js` — state, flags
- `src/config.js` — ABILITIES config
- `src/events.js` — event definitions

---

### Task 1: Define Skill Tier Upgrades in upgrades.js

**Files:**
- Modify: `src/data/upgrades.js`

**What to do:**
1. Remove `power_smash_damage` and `power_smash_recharge` entries
2. Add 18 new tier upgrade entries (3 per skill × 6 skills)
3. Add a `requires` field (upgrade ID that must be level 1 before this can be purchased)
4. Add a `requiresFlag` field for secondary skill tiers (e.g., `'unlockedArmorBreak'`)
5. Add a `group` field to organize display: `'stat'` for existing upgrades, `'skill'` for new ones
6. Add a `stance` field on skill upgrades: `'power'`, `'flurry'`, `'fortress'`

New upgrade IDs and structure:

```js
// Power Smash tiers
{ id: 'smash_t1', name: 'Heavy Impact', description: 'Power Smash damage increased to 4x',
  group: 'skill', stance: 'power', category: 'legit', currency: 'skillPoints',
  maxLevel: 1, costFormula: () => 1,
  effect: { type: 'multiplier', target: 'smashDamageMult', valuePerLevel: 1.0 } },
{ id: 'smash_t2', name: 'Crushing Blow', description: 'Smash applies 15% vulnerability for 4s',
  group: 'skill', stance: 'power', requires: 'smash_t1', ...
  effect: { type: 'flag', target: 'smashVulnerability' } },
{ id: 'smash_t3', name: 'Cataclysm', description: 'Power Smash cooldown reduced to 22s',
  group: 'skill', stance: 'power', requires: 'smash_t2', ...
  effect: { type: 'multiplier', target: 'smashCooldownReduction', valuePerLevel: 0.267 } },

// Rapid Strikes tiers
{ id: 'flurry_t1', name: 'Sixth Strike', description: 'Rapid Strikes hits increased to 6',
  group: 'skill', stance: 'flurry', ...
  effect: { type: 'flat', target: 'rapidStrikesHits', valuePerLevel: 1 } },
{ id: 'flurry_t2', name: 'Bleeding Cuts', description: 'Each Rapid Strike hit applies a small DOT',
  group: 'skill', stance: 'flurry', requires: 'flurry_t1', ...
  effect: { type: 'flag', target: 'rapidStrikesDot' } },
{ id: 'flurry_t3', name: 'Relentless', description: 'Rapid Strikes cooldown reduced to 7s',
  group: 'skill', stance: 'flurry', requires: 'flurry_t2', ...
  effect: { type: 'multiplier', target: 'rapidStrikesCooldownReduction', valuePerLevel: 0.3 } },

// Bulwark tiers
{ id: 'bulwark_t1', name: 'Reinforced Shell', description: 'Shield absorb increased by 40%',
  group: 'skill', stance: 'fortress', ...
  effect: { type: 'multiplier', target: 'bulwarkAbsorb', valuePerLevel: 0.4 } },
{ id: 'bulwark_t2', name: 'Thorned Barrier', description: 'Attackers take reflected damage while shield holds',
  group: 'skill', stance: 'fortress', requires: 'bulwark_t1', ...
  effect: { type: 'flag', target: 'bulwarkThorns' } },
{ id: 'bulwark_t3', name: 'Bastion', description: 'Shield duration increased to 14s',
  group: 'skill', stance: 'fortress', requires: 'bulwark_t2', ...
  effect: { type: 'multiplier', target: 'bulwarkDuration', valuePerLevel: 0.75 } },

// Armor Break tiers (requiresFlag: 'unlockedArmorBreak')
{ id: 'armorbreak_t1', name: 'Deeper Fractures', description: 'Armor shred increased to 50%',
  group: 'skill', stance: 'power', requiresFlag: 'unlockedArmorBreak', ...
  effect: { type: 'multiplier', target: 'armorBreakShred', valuePerLevel: 0.15 } },
{ id: 'armorbreak_t2', name: 'Lingering Weakness', description: 'Armor Break duration increased to 9s',
  group: 'skill', stance: 'power', requiresFlag: 'unlockedArmorBreak', requires: 'armorbreak_t1', ...
  effect: { type: 'multiplier', target: 'armorBreakDuration', valuePerLevel: 0.5 } },
{ id: 'armorbreak_t3', name: 'Shatter', description: 'Armor Break cooldown reduced to 10s',
  group: 'skill', stance: 'power', requiresFlag: 'unlockedArmorBreak', requires: 'armorbreak_t2', ...
  effect: { type: 'multiplier', target: 'armorBreakCooldown', valuePerLevel: 0.333 } },

// Interrupt tiers (requiresFlag: 'unlockedInterrupt')
{ id: 'interrupt_t1', name: 'Staggering Blow', description: 'Interrupt stun increased to 2s',
  group: 'skill', stance: 'flurry', requiresFlag: 'unlockedInterrupt', ...
  effect: { type: 'multiplier', target: 'interruptStun', valuePerLevel: 1.0 } },
{ id: 'interrupt_t2', name: 'Opportunist', description: 'Interrupting grants 3s of +30% attack speed',
  group: 'skill', stance: 'flurry', requiresFlag: 'unlockedInterrupt', requires: 'interrupt_t1', ...
  effect: { type: 'flag', target: 'interruptSpeedBuff' } },
{ id: 'interrupt_t3', name: 'Hair Trigger', description: 'Interrupt cooldown reduced to 8s',
  group: 'skill', stance: 'flurry', requiresFlag: 'unlockedInterrupt', requires: 'interrupt_t2', ...
  effect: { type: 'multiplier', target: 'interruptCooldown', valuePerLevel: 0.2 } },

// Cleanse tiers (requiresFlag: 'unlockedCleanse')
{ id: 'cleanse_t1', name: 'Residual Ward', description: 'Grants 3s DOT immunity after cleanse',
  group: 'skill', stance: 'fortress', requiresFlag: 'unlockedCleanse', ...
  effect: { type: 'flag', target: 'cleanseImmunity' } },
{ id: 'cleanse_t2', name: 'Purifying Flame', description: 'Cleanse deals damage based on stacks purged',
  group: 'skill', stance: 'fortress', requiresFlag: 'unlockedCleanse', requires: 'cleanse_t1', ...
  effect: { type: 'flag', target: 'cleanseDamage' } },
{ id: 'cleanse_t3', name: 'Inner Peace', description: 'Cleanse cooldown reduced to 14s',
  group: 'skill', stance: 'fortress', requiresFlag: 'unlockedCleanse', requires: 'cleanse_t2', ...
  effect: { type: 'multiplier', target: 'cleanseCooldown', valuePerLevel: 0.3 } },
```

Also add helper exports:
```js
export function getUpgradesByGroup(group) {
  return UPGRADES.filter(u => (u.group || 'stat') === group);
}
export function getSkillUpgradesByStance(stance) {
  return UPGRADES.filter(u => u.group === 'skill' && u.stance === stance);
}
```

Add `group: 'stat'` to all existing stat upgrades (sharpen_blade, battle_hardening, etc.).

**Commit:** `feat: add 18 skill tier upgrade definitions`

---

### Task 2: Update UpgradeManager for requires/requiresFlag

**Files:**
- Modify: `src/systems/UpgradeManager.js`

**What to do:**
1. Update `canPurchase()` to check the `requires` field (prerequisite upgrade must be at level 1)
2. Update `canPurchase()` to check `requiresFlag` (Store flag must be truthy)
3. Add a new `isVisible(upgradeId)` method that returns false if the upgrade's `requiresFlag` isn't set

```js
canPurchase(upgradeId) {
  const upgrade = getUpgrade(upgradeId);
  if (!upgrade) return false;
  const level = this.getLevel(upgradeId);
  if (level >= upgrade.maxLevel) return false;

  // Check prerequisite tier
  if (upgrade.requires && this.getLevel(upgrade.requires) < 1) return false;

  // Check flag gate
  if (upgrade.requiresFlag) {
    const state = Store.getState();
    if (!state.flags[upgrade.requiresFlag]) return false;
  }

  // Check currency
  const cost = D(upgrade.costFormula(level));
  const state = Store.getState();
  // ... existing currency checks
},

isVisible(upgradeId) {
  const upgrade = getUpgrade(upgradeId);
  if (!upgrade) return false;
  if (upgrade.requiresFlag) {
    return !!Store.getState().flags[upgrade.requiresFlag];
  }
  return true;
},
```

Also add a `hasUpgrade(upgradeId)` convenience:
```js
hasUpgrade(upgradeId) {
  return this.getLevel(upgradeId) >= 1;
},
```

**Commit:** `feat: add requires/requiresFlag checks to UpgradeManager`

---

### Task 3: Add Unlock Flags to Store

**Files:**
- Modify: `src/systems/Store.js` (no schema change needed — flags are already a freeform object)

**What to do:**
Nothing structural — `Store.setFlag(key, value)` already supports any key. Just document the new flag names used by the upgrade system:
- `unlockedArmorBreak` — set when Armor Break milestone fires (Phase 2)
- `unlockedInterrupt` — set when Interrupt milestone fires (Phase 2)
- `unlockedCleanse` — set when Cleanse milestone fires (Phase 2)

For testing during Phase 1, add a temporary dev helper in the browser console (via `window`):
```js
// In Store.js init or main.js — only in DEV mode
if (import.meta.env?.DEV) {
  window.__unlockSkill = (name) => Store.setFlag(`unlocked${name}`, true);
}
```

**Commit:** `feat: add dev helper for skill unlock flags`

---

### Task 4: Wire Primary Skill Upgrade Effects

**Files:**
- Modify: `src/ui/SmashButton.js`
- Modify: `src/ui/FlurryButton.js`
- Modify: `src/ui/BulwarkButton.js`
- Modify: `src/systems/CombatEngine.js`

**SmashButton changes:**
- `_getDamageMultiplier()`: base 3.0, +1.0 if `smash_t1` purchased → `3.0 + UpgradeManager.getFlatBonus('smashDamageMult')` (or use `hasUpgrade('smash_t1') ? 4.0 : 3.0`)
- `_getCooldownMs()`: base 30000, 22000 if `smash_t3` → `UpgradeManager.hasUpgrade('smash_t3') ? 22000 : 30000`
- Remove dependency on old `power_smash_damage` / `power_smash_recharge` upgrade IDs

**FlurryButton changes:**
- Replace hardcoded `COOLDOWN_MS = 10000` with getter: `_getCooldownMs()` → `UpgradeManager.hasUpgrade('flurry_t3') ? 7000 : 10000`
- Pass hit count to CombatEngine: `const hits = 5 + UpgradeManager.getFlatBonus('rapidStrikesHits')`
- Update event emit: `emit(EVENTS.RAPID_STRIKES_USED, { hitCount: hits })`

**BulwarkButton changes:**
- Shield amount: multiply by `(1 + UpgradeManager.getMultiplier('bulwarkAbsorb') - 1)` if t1 → simpler: `UpgradeManager.hasUpgrade('bulwark_t1') ? 0.14 : 0.10` for SHIELD_HP_MULT
- Duration: `UpgradeManager.hasUpgrade('bulwark_t3') ? 14000 : 8000`
- Cooldown: remains 45s (no cooldown tier for Bulwark — it's on-demand already)

**CombatEngine changes:**
- `activateRapidStrikes()`: accept `hitCount` parameter instead of hardcoded 5
- `powerSmashAttack()`: after applying damage, if `UpgradeManager.hasUpgrade('smash_t2')`, set a vulnerability debuff on target: `target._vulnerable = true`, schedule removal after 4s, make `getPlayerDamage()` check for it (+15% damage)
- Bulwark Thorned Barrier (t2): in `_applyIncomingDamage()`, if shield is active AND `UpgradeManager.hasUpgrade('bulwark_t2')`, reflect a portion of pre-shield damage back to enemy
- Rapid Strikes DOT (t2): in `activateRapidStrikes()`, if `UpgradeManager.hasUpgrade('flurry_t2')`, each hit also applies a small DOT to the target

**Commit:** `feat: wire primary skill tier upgrade effects`

---

### Task 5: Wire Secondary Skill Upgrade Effects

**Files:**
- Modify: `src/ui/ArmorBreakButton.js`
- Modify: `src/ui/InterruptButton.js`
- Modify: `src/ui/CleanseButton.js`
- Modify: `src/systems/CombatEngine.js`

**ArmorBreakButton changes:**
- Duration: base 6000ms, +3000ms if t2 → `UpgradeManager.hasUpgrade('armorbreak_t2') ? 9000 : 6000`
- Cooldown: base 15000ms, 10000ms if t3 → `UpgradeManager.hasUpgrade('armorbreak_t3') ? 10000 : 15000`
- Import UpgradeManager

**CombatEngine.armorBreakTarget() changes:**
- Shred amount: currently sets `_armorBroken = true` (full bypass). For the tier system, change to partial shred: `target._armorShredPercent = UpgradeManager.hasUpgrade('armorbreak_t1') ? 0.50 : 0.35`
- In `_applyTargetArmorReduction()`: instead of binary `_armorBroken` check, use `_armorShredPercent` to reduce armor.reduction proportionally

**InterruptButton changes:**
- Cooldown: base 10000ms → `UpgradeManager.hasUpgrade('interrupt_t3') ? 8000 : 10000`
- Import UpgradeManager

**CombatEngine.interruptTarget() changes:**
- Stun: base 1s, 2s if t1 → after interrupt, pause enemy attack timer for stun duration
- Speed buff (t2): after successful interrupt, if `hasUpgrade('interrupt_t2')`, temporarily boost player attack speed by 30% for 3s

**CleanseButton changes:**
- Cooldown: base 20000ms → `UpgradeManager.hasUpgrade('cleanse_t3') ? 14000 : 20000`
- Import UpgradeManager

**CombatEngine.cleanseCorruption() changes:**
- DOT immunity (t1): after cleanse, set a 3s immunity flag that blocks incoming DOT/corruption
- Purifying Flame (t2): deal damage to current target based on stacks purged

**Commit:** `feat: wire secondary skill tier upgrade effects`

---

### Task 6: Redesign UpgradePanel with Tabs

**Files:**
- Modify: `src/ui/UpgradePanel.js`

**What to do:**
Replace the current two-column layout with a tabbed panel:

**Tab 1: STATS** (default)
- Shows the 6 existing stat upgrades (sharpen_blade, battle_hardening, auto_attack_speed, gold_find)
- Exploit column still appears on the right after crackTriggered

**Tab 2: SKILLS**
- Three sections: Power, Flurry, Fortress
- Each section header shows stance name in stance color
- Under each header: primary skill tiers (always visible), then secondary skill tiers (only if unlocked)
- Tiers show prerequisite status: locked tiers greyed out with "Requires: [tier name]" text
- Purchased tiers show checkmark or green text

**Layout sketch:**
```
┌──────────────────────────────────────────────────┐
│  SKILLS          SP: 5                           │
│  [STATS]  [SKILLS]                               │
│──────────────────────────────────────────────────│
│  ── POWER ──                                     │
│  ✓ Heavy Impact        [4x damage]               │
│  ☐ Crushing Blow       [BUY] 1 SP                │
│  🔒 Cataclysm          Requires: Crushing Blow   │
│  ── Armor Break ── (if unlocked)                 │
│  ☐ Deeper Fractures    [BUY] 1 SP                │
│  ...                                             │
│  ── FLURRY ──                                    │
│  ...                                             │
│  ── FORTRESS ──                                  │
│  ...                                             │
└──────────────────────────────────────────────────┘
```

Implementation:
- Add `_currentTab` state ('stats' | 'skills')
- Add tab buttons at top of panel (styled as underlined text toggles)
- `_buildContent()` checks `_currentTab` and calls `_buildStatsTab()` or `_buildSkillsTab()`
- Skills tab needs vertical scrolling if content exceeds panel height — use Phaser mask + scroll logic (or increase panel height to 600px)
- Import new helper: `getSkillUpgradesByStance` from upgrades.js

**Commit:** `feat: redesign UpgradePanel with Stats/Skills tabs`

---

### Task 7: Save Migration for Removed Upgrades

**Files:**
- Modify: `src/systems/Store.js` (in save loading / migration code)

**What to do:**
When loading a save, check for orphaned `power_smash_damage` and `power_smash_recharge` in `state.purchasedUpgrades`. If found:
1. Calculate total SP spent: `levels_damage * 1 + levels_recharge * 1`
2. Refund those SP to `state.skillPoints`
3. Delete the orphaned keys from `purchasedUpgrades`

This is a one-time migration that runs on save load.

**Commit:** `feat: migrate old power smash upgrades to refund SP`

---

### Task 8: Verify & Commit

**Steps:**
1. Run `npm run build` — should pass with no new errors
2. Run dev server, open browser
3. Test Stats tab: existing upgrades still work, buy sharpen blade, etc.
4. Test Skills tab: see 3 stances with primary tiers, buy Heavy Impact, verify Crushing Blow becomes available
5. Test secondary skills hidden: Armor Break tiers should not appear until flag is set
6. Test dev helper: `window.__unlockSkill('ArmorBreak')` then reopen panel — tiers appear
7. Test in-game effects: buy Heavy Impact, use Power Smash — should deal 4x damage instead of 3x
8. Test save/load: purchase some tiers, refresh page, verify they persist

**Commit:** `feat: Phase 1 complete — skill tier upgrades + tabbed panel`

---

## Verification

1. `npm run build` passes
2. Open `localhost:3000`, play through a few zones
3. Open Skills panel (U key) → Stats tab works as before
4. Switch to Skills tab → 3 stance sections visible with primary tiers
5. Buy tier 1, verify tier 2 unlocks, tier 3 stays locked
6. Use console `__unlockSkill('ArmorBreak')` → secondary tiers appear
7. Buy Armor Break tier → verify longer duration / more shred in combat
8. Save and reload → all purchases persist
