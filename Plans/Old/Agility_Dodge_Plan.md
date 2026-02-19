# Plan: Agility + Accuracy Rework (Low-Level Viability)

## Context
Current combat is guaranteed-hit. Defense is the only reliable survivability stat, and low-level choices heavily favor DEF because `enemyDamage` is linear:

```
enemyDamage = max(enemyAtk - 0.5 * playerDef, 1)
```

The previous AGI plan added dodge, but the proposed curve:

```
dodge = agi / (agi + 150)
```

is too weak at low AGI, so early DEF still dominates.

This revision introduces enemy `accuracy` and a contested hit calculation so AGI gives meaningful value early, while preserving caps and late-game tuning room.

## Design Goals

1. AGI is a real low-level alternative to DEF, not a trap.
2. First AGI pickup should create visible survival improvement in Area 1.
3. Dodge should have diminishing returns and a hard floor/ceiling.
4. Enemy archetypes can express identity via accuracy (brutes, swarms, elites).
5. Offline sim and in-game UI must reflect the same formulas.

## Balance Targets

Use these as acceptance criteria, not flavor goals:

1. Zone 1-3 starter player has roughly 5% to 10% dodge versus common enemies.
2. A single early AGI item (or equivalent AGI gain) adds about 4% to 8% dodge versus same enemies.
3. In Area 1-2, best AGI build survival should be within about 15% to 25% of best DEF build (not 2x worse).
4. Hard caps prevent full immunity:
`enemy hit chance` in [35%, 95%].

## Core Mechanics

### New enemy stat: `accuracy`

- Add `accuracy` to all enemies and bosses.
- Suggested baseline by archetype:
1. Brute/tank enemies: 85-95
2. Standard melee: 75-85
3. Fast swarm types: 65-80
4. Elite/area bosses: baseline +5 to +10

### Player AGI and evade rating

- Keep `agi` as player stat and item bonus key.
- Convert AGI to evade rating:

```
evadeRating = effectiveAgi * evadePerAgi
```

Suggested starting constant:
`evadePerAgi = 2.0`

### Contested hit formula (replace standalone dodge curve)

```
rawHitChance = (enemyAccuracy + accuracyBias) / (enemyAccuracy + evadeRating + accuracyBias)
hitChance = clamp(rawHitChance, minHitChance, maxHitChance)
dodgeChance = 1 - hitChance
```

Suggested constants:
- `accuracyBias = 60`
- `minHitChance = 0.35`
- `maxHitChance = 0.95`

This gives AGI meaningful early returns without enabling immunity.

### Combat resolution order

1. Enemy starts attack.
2. Roll hit using `accuracy` vs player evade.
3. On miss:
   - emit dodge event
   - do not apply damage
4. On hit:
   - calculate damage using existing defense/armor pen formula
   - apply damage
5. DoT remains unavoidable (bypasses defense and dodge).

## Early-Game Itemization Fix

Current issue: early AGI availability is too RNG-dependent. Area 1 has only one AGI conversion and it is uncommon.

Required adjustments:

1. Add at least one deterministic early AGI source (pick one):
   - convert one Area 1 common armor piece to hybrid DEF+AGI, or
   - add a low-cost early upgrade that grants flat AGI, or
   - grant a starter AGI trinket via first boss clear.
2. Keep chest/legs mostly DEF-focused for tank identity.
3. Continue AGI alternatives on head/boots/gloves/amulet, but guarantee one non-rare AGI option by Zone 2-3 progression.

## Revised File Changes

### 1) `src/config.js`

- `PROGRESSION_V2.statGrowthPerLevel`: add `agi`
- `PROGRESSION_V2.startingStats`: add `agi`
- `COMBAT_V2`: add constants and helper funcs:
1. `evadePerAgi`
2. `accuracyBias`
3. `minHitChance`
4. `maxHitChance`
5. `evadeRating(agi)`
6. `enemyHitChance(acc, evade)`
7. `dodgeChance(acc, evade)`

### 2) `src/systems/Store.js`

- Hydration numeric keys: include `agi`
- `applyLevelUp()`: increase `agi`
- `resetPlayerStats()`: reset `agi`
- Comment/doc updates that mention flat stat set should include AGI where valid.

### 3) `src/systems/ComputedStats.js`

- Add:
1. `getEffectiveAgi()`
2. `getEvadeRating()`
3. `getEnemyHitChance(enemyAccuracy)`
4. `getDodgeChance(enemyAccuracy)`
- Update `getAllStats()` with:
1. `effectiveAgi`
2. `evadeRating`
3. `dodgeChanceVsDefaultAcc` (or similar display-safe value)

### 4) `src/data/enemies.js`

- Add `accuracy` to every enemy definition.

### 5) `src/data/bosses.js`

- Add `accuracy` to every boss definition.

### 6) `scripts/validate-data.js`

- Validate enemy `accuracy` and boss `accuracy` ranges.
- Suggested validation bounds: 1 to 200.
- Add `agi` to item `STAT_KEYS`.

### 7) `src/systems/CombatEngine.js`

- Import evade/hit helpers.
- In `enemyAttack()`:
1. compute hit chance from `currentEnemy.accuracy` vs player evade
2. roll RNG
3. on miss emit dodge event and return
4. on hit continue existing damage path

### 8) `src/events.js`

- Add:
1. `COMBAT_ENEMY_DODGED`
- Optional but recommended:
2. `COMBAT_ENEMY_ATTACKED` to drive attack animation even on misses.

### 9) `src/scenes/GameScene.js`

- Show floating `DODGE!` on dodge events.
- Ensure enemy lunge/attack feedback still plays on misses (if using `COMBAT_ENEMY_ATTACKED`).

### 10) `src/ui/StatsPanel.js`

- Add AGI row in base stats.
- Add dodge row in combat stats.
- If dodge requires enemy accuracy context, display as:
`DODGE (vs 80 ACC): X%`

### 11) `src/ui/InventoryPanel.js`

- Add `agi` label in tooltip stat map.
- Item summary should prefer ATK, DEF, then AGI for AGI-focused items.

### 12) `src/ui/SystemLog.js`

- Add AGI logging for equipped item stat summaries.
- Optional warning when spawning high-accuracy enemies.

### 13) `src/systems/UpgradeManager.js`

- If flat upgrades can target stats generically, include `agi` in allowed flat stat targets.

### 14) `scripts/balance-sim.js`

- Add player AGI progression and effective AGI.
- Add enemy/boss accuracy in combat model.
- Apply hit chance to incoming DPS.
- Add AGI/evade/hit/dodge columns.
- Add at least two gear-choice policies:
1. DEF-priority
2. AGI-priority
- Report survival and boss pass rates for both.

## Implementation Order

1. Data + constants: `config`, enemy/boss accuracy, validator updates.
2. Player stat plumbing: `Store`, `ComputedStats`.
3. Combat execution: `CombatEngine`, events.
4. UI and feedback: `StatsPanel`, `InventoryPanel`, `SystemLog`, `GameScene`.
5. Sim and checkpoints: `balance-sim` dual-policy outputs.
6. Run validation and sim; tune constants until targets pass.

## Verification Checklist

1. `npm run validate:data` passes with `agi` and `accuracy` schema.
2. `npm run balance:sim` prints AGI + accuracy metrics and dual-policy outcomes.
3. In-game, AGI gear reliably raises dodge in Area 1.
4. In-game, enemy attacks can miss and show `DODGE!`.
5. In-game, DoT still cannot be dodged.
6. Early DEF-only and AGI-focused builds both clear Area 1 without one path being non-viable.

## Save Compatibility

No hard migration required if defaults are handled:

1. Missing `playerStats.agi` falls back to starting stat on hydration.
2. Missing `item.statBonuses.agi` reads as 0.
3. Missing `enemy.accuracy` / `boss.accuracy` should default to a safe baseline (temporary fallback only; data should be fully authored).
