# Enemy Roster Redesign + New Combat Mechanics (Revised)

## Context

The project currently has 3 areas with 30 total global zones, encounter templates, named bosses, and 3 stance skills (Smash, Flurry, Bulwark). This redesign expands Area 1 to 10 zones (35 total global zones), replaces the enemy roster, and adds four mechanics:

- Evasion
- Armor + Armor Break
- Summoning + Interrupt
- Corruption + Cleanse

This revision updates the original plan with implementation constraints from the current codebase.

## Critique-Driven Changes

The original plan was directionally good, but these gaps need correction before implementation:

1. Hardcoded area derivation exists in `src/data/enemies.js` and will be wrong after zone shifts.
2. `src/events.js` has dev-mode payload contracts; new events must add contract keys or the console will spam warnings.
3. `GameScene` only instantiates enemies from `COMBAT_ENCOUNTER_STARTED`; summoning requires a runtime "member added" flow.
4. All stance buttons are currently independent classes at the same coordinates; two buttons per stance need explicit layout ownership in `UIScene`.
5. Corruption math in the original draft can drive regen/attack below zero unless clamped.
6. Summoned adds need reward policy (full rewards can create farm exploits).
7. Large all-at-once data rewrites increase blast radius; this should ship area-by-area with validation gates.
8. Validation script must be expanded for new enemy fields and encounter-size guarantees.

## Design Rules (Must Hold)

1. Keep save compatibility. Existing saves should load without migration.
2. Additive schema only. New enemy fields are optional and default-safe.
3. Timer hygiene. Every new timer must be cleaned up on member death, encounter end, player death, and engine destroy.
4. Event contract parity. Every emitted event must exist in `EVENTS` and `EVENT_CONTRACTS`.
5. Summon cap safety. Encounter member count must never exceed `COMBAT_V2.maxEncounterSize` (5).

---

## Phase 0: Guardrails and Baseline Alignment

**Goal:** Remove known structural mismatches before content/mechanic work.

### Changes

- `src/data/areas.js`
  - Area 2 `zoneStart: 6 -> 11`
  - Area 3 `zoneStart: 16 -> 21`
  - `TOTAL_ZONES: 30 -> 35`
  - Rename area labels:
    - `The Harsh Threshold -> The Whispering Woods`
    - `The Overgrown Frontier -> The Blighted Mire`
    - `The Broken Road -> The Shattered Ruins`
  - Re-key `ZONE_BALANCE` to new global zone numbers.

- `src/data/encounters.js`
  - Update `_AREA_ZONE_STARTS` from `{ 1: 1, 2: 6, 3: 16 }` to `{ 1: 1, 2: 11, 3: 21 }`.

- `src/data/enemies.js`
  - Shift Area 2 and Area 3 zone ranges by +5.
  - Replace hardcoded `area` getter boundaries (`1-5, 6-15, 16-30`) with area-boundary derivation that matches new zone starts.

- `src/data/bosses.js`
  - Shift Area 2 and Area 3 boss `zone` values by +5.

### Validation Gate

1. `npm run validate:data`
2. Verify `getEncountersForZone()` for boundaries: `(area 1, zone 10)`, `(area 2, zone 1)`, `(area 2, zone 10)`, `(area 3, zone 1)`.
3. Boot game and navigate across area boundaries.

---

## Phase 1: Enemy Schema Expansion (No New Behavior Yet)

**Goal:** Add new trait fields safely before behavior changes.

### Target schema (`src/data/enemies.js`)

```js
evasion: 0.12, // 0-1
armor: { reduction: 0.4 }, // reduction in [0,1)
corruption: 1, // stacks applied on hit
summon: {
  enemyId: 'a3_cultist_scavenger',
  count: 1,
  castTime: 5000,
  maxAdds: 2,
  cooldownMs: 12000
}
```

### Runtime carry-through

- `src/systems/CombatEngine.js`
  - Extend `_buildMember()` to copy these fields with defaults.
  - Do not activate behavior yet; this phase is schema + plumbing only.

- `scripts/validate-data.js`
  - Add checks for new fields:
    - `evasion`: number `0..0.95`
    - `armor.reduction`: number `0..0.95`
    - `corruption`: non-negative integer
    - `summon`: valid enemy reference, positive `castTime`, positive `count`, non-negative `maxAdds`

### Validation Gate

1. `npm run validate:data` passes with new checks.
2. Boot game and confirm no runtime errors with existing content.

---

## Phase 2: Enemy Roster Rewrite (Area-by-Area)

**Goal:** Replace roster without a single giant cutover.

### Area 1 (global 1-10)

| Enemy | Traits | Zones |
|---|---|---|
| `a1_rat` | none | 1-5 |
| `a1_slime` | regen | 1-5 |
| `a1_feral_hound` | enrage | 2-5 |
| `a1_thornback_boar` | thorns | 5-10 |
| `a1_big_slime` | high regen | 7-9 |
| `a1_bandit` | high damage | 8-10 |
| `a1_bird` | evasion (0.10-0.15) | 6-10 |

### Area 2 (global 11-20)

| Enemy | Traits | Zones |
|---|---|---|
| `a2_goblin_scout` | none | 11-15 |
| `a2_goblin_warrior` | enrage + armor | 16-20 |
| `a2_giant_beetle` | armor | 14-15 |
| `a2_fungi` | dot | 11-15 |
| `a2_zombie` | regen | 11-15 |
| `a2_insect_swarm` | evasion (0.15-0.20) | 16-20 |
| `a2_vine_crawler` | thorns | 16-20 |
| `a2_bog_revenant` | regen | 17-20 |

### Area 3 (global 21-35)

| Enemy | Traits | Zones |
|---|---|---|
| `a3_stone_sentry` | high armor | 21-25 |
| `a3_cultist_scavenger` | dot + summon | 21-25 |
| `a3_corrupted_wolf` | enrage + corruption | 21-25 |
| `a3_eternal_guardian` | enrage + armor | 26-30 |
| `a3_corrupted_cultist` | enrage + corruption | 26-30 |
| `a3_shade_remnant` | evasion (0.25-0.30), low defense | 26-30 |
| `a3_cultist_scholar` | high attack | 31-35 |
| `a3_resurrected_shade` | high regen | 31-35 |
| `a3_corrupted_guardian` | armor + corruption | 32-35 |

### Validation Gate

1. `npm run validate:data`
2. `scripts/balance-sim.js` smoke pass for zones 1, 10, 11, 20, 21, 35.

---

## Phase 3: Encounter Rewrite

**Goal:** Author a complete encounter pool while keeping solo fallback.

### Changes (`src/data/encounters.js`)

1. Rewrite authored multi-member templates for all 35 zones.
2. Keep auto-solo fallback in `getEncountersForZone()`.
3. Add validator checks:
   - Encounter `members.length <= COMBAT_V2.maxEncounterSize`
   - Every zone has at least one encounter option (authored or solo).

### Validation Gate

1. `npm run validate:data`
2. Log 500 random rolls per representative zone and verify diversity.

---

## Phase 4: Boss Roster Update

**Goal:** One boss per global zone (35 bosses total).

### Changes (`src/data/bosses.js`)

1. Keep/retune current Area 1 bosses for zones 1-5.
2. Add bosses for Area 1 zones 6-10:
   - Zone 6: Thornback Alpha
   - Zone 7: The Grime King
   - Zone 8: Hawkeye
   - Zone 9: Bandit Captain
   - Zone 10: Rotfang (area boss)
3. Shift Area 2 and Area 3 boss zones by +5.
4. Recheck `bossType` consistency after zone shift.

### Validation Gate

1. `npm run validate:data`
2. Manual boss challenge pass for zones 5, 10, 20, 35.

---

## Phase 5: Combat Mechanics

### 5A: Evasion

**Files:** `src/systems/CombatEngine.js`, `src/events.js`, `src/scenes/GameScene.js`

1. Add a shared pre-hit check for all player damage sources (`playerAttack`, `powerSmashAttack`, and any future active hit skills).
2. On miss, emit:
   - `COMBAT_PLAYER_MISSED: 'combat:playerMissed'`
   - Payload: `encounterId`, `instanceId`, `slot`, `enemyId`, `source`
3. Add contract in `EVENT_CONTRACTS`.
4. `GameScene`: show `MISS!` near enemy slot.

### 5B: Armor + Armor Break

**Files:** `src/systems/CombatEngine.js`, `src/events.js`

1. Armor reduces incoming player damage while active.
2. Track temporary armor-break state per member with explicit expiry timers.
3. Do not permanently mutate base `defense`; use temporary multiplier state for debuffs.
4. Emit:
   - `COMBAT_ARMOR_BROKEN: 'combat:armorBroken'`
   - `COMBAT_ARMOR_RESTORED: 'combat:armorRestored'`

### 5C: Summoning + Interrupt

**Files:** `src/systems/CombatEngine.js`, `src/events.js`, `src/scenes/GameScene.js`

1. Summon casts use encounter-scoped timer keys.
2. If summoner dies or encounter ends, cast timers are canceled.
3. Summons only spawn if:
   - Summoner has not exceeded `maxAdds`
   - Encounter has free slot(s) under `COMBAT_V2.maxEncounterSize`
4. Emit cast lifecycle events:
   - `COMBAT_ENEMY_CASTING: 'combat:enemyCasting'`
   - `COMBAT_INTERRUPTED: 'combat:interrupted'`
   - `COMBAT_MEMBER_ADDED: 'combat:memberAdded'` (full member payload for GameScene slot spawn)
5. Reward policy: summoned adds use reduced rewards (or zero), explicitly documented in code to prevent farm loops.

### 5D: Corruption + Cleanse

**Files:** `src/systems/CombatEngine.js`, `src/events.js`, `src/systems/ComputedStats.js`

1. Add encounter-scoped corruption stacks.
2. On hit from corruption enemy, add stacks up to cap.
3. Apply effects with clamps:
   - `regenMult = max(0.2, 1 - stacks * perStackRegenReduction)`
   - `attackMult = max(0.5, 1 - stacks * perStackAtkReduction)`
4. DoT ticks once per second while stacks > 0.
5. Natural decay timer removes one stack at interval.
6. Reset corruption on death, zone change, and encounter end.
7. Emit:
   - `CORRUPTION_CHANGED: 'corruption:changed'`
   - `CORRUPTION_CLEANSED: 'corruption:cleansed'`

---

## Phase 6: Stance Skill UX and UI Integration

**Goal:** Two skills per stance without brittle per-button logic.

### Required refactor

1. Keep existing skill classes but move visibility/layout authority into `src/scenes/UIScene.js`.
2. Define two explicit action slots in UI layout:
   - Slot A: existing skill (Smash/Flurry/Bulwark)
   - Slot B: new skill (Armor Break/Interrupt/Cleanse)
3. Add new buttons:
   - `src/ui/ArmorBreakButton.js`
   - `src/ui/InterruptButton.js`
   - `src/ui/CleanseButton.js`
4. Add corruption indicator:
   - `src/ui/CorruptionIndicator.js`

### New ability config

Prefer ability constants in `src/config.js` under a dedicated namespace:

```js
export const ABILITIES = {
  armorBreak: { durationMs: 6000, defReductionPercent: 0.35, cooldownMs: 15000 },
  interrupt: { cooldownMs: 10000, fallbackDelayMs: 1200 },
  cleanse: { cooldownMs: 20000 }
};
```

---

## Phase 7: Verification and Balance

### Automated

1. `npm run validate:data`
2. Add targeted unit-ish checks for:
   - Event payload contracts for new events
   - Summon cap and slot behavior
   - Corruption clamp behavior
   - Armor break expiry restore

### Manual

1. Full progression playthrough: zones 1-10 (Area 1 pacing check).
2. Mechanic spot checks:
   - Evasion: visible miss text and no damage applied.
   - Armor break: damage delta before/after break.
   - Summoning: cast, interrupt, and add spawn path.
   - Corruption: stack gain, decay, cleanse, reset paths.
3. Boundary navigation checks around zone transitions:
   - 10 -> 11
   - 20 -> 21

---

## Dependencies

1. Phase 0 must complete first.
2. Phase 1 should complete before roster authoring.
3. Phases 2, 3, 4 can run in parallel after Phase 0/1.
4. Phase 5 mechanics can start after Phase 1, but 5C requires GameScene runtime-add support.
5. Phase 6 follows 5A-5D.
6. Phase 7 is final gate.

---

## Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Zone renumbering breaks lookups | High | Complete Phase 0 first; test transitions and boss lookup paths |
| Summon runtime state leaks timers | High | Central timer registry + strict cleanup on all exits |
| Event payload mismatch in dev mode | High | Add every new event to `EVENT_CONTRACTS` at implementation time |
| UI overlap from 2-skill stance design | Medium | Make `UIScene` the single layout owner for action slots |
| Corruption over-penalizes player | Medium | Clamp multipliers and test 1/5/max stack breakpoints |
| New roster pacing drift | Medium | Area-by-area rollout + balance sim checkpoints |

---

## File Impact Summary

| File | Planned phases |
|---|---|
| `src/data/areas.js` | 0 |
| `src/data/enemies.js` | 0, 1, 2 |
| `src/data/encounters.js` | 0, 3 |
| `src/data/bosses.js` | 0, 4 |
| `scripts/validate-data.js` | 1, 3, 7 |
| `src/systems/CombatEngine.js` | 1, 5 |
| `src/events.js` | 5, 7 |
| `src/scenes/GameScene.js` | 5, 6 |
| `src/scenes/UIScene.js` | 6 |
| `src/ui/ArmorBreakButton.js` | 6 |
| `src/ui/InterruptButton.js` | 6 |
| `src/ui/CleanseButton.js` | 6 |
| `src/ui/CorruptionIndicator.js` | 6 |
| `src/config.js` | 6 |

