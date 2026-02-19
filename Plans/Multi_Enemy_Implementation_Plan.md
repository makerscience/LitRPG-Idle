# Multi-Enemy Combat Implementation Plan (v2)

## Goal

Refactor combat from single-target runtime state to encounter-based combat (1..N enemies) with per-enemy timers, stable target control, per-slot visuals, and data-driven encounter composition.

## Design Vision

Groups serve as both visual variety and progression gating:
- **Early zones** (1-10 of an area): Weak enemies appear in small groups. A pack of 3 rats feels roughly the same as fighting one medium enemy. Introduces the mechanic without punishing the player.
- **Late zones** (11+ of an area): Strong enemies start spawning in groups. This is genuinely harder and acts as a gear-check wall. Players who haven't farmed equipment in earlier zones bounce off and learn to go back.
- **Solo encounters remain the default.** Groups are the interesting exception, not the norm.

## Design Principles

1. **Runtime identity and UI position are separate concerns.** `instanceId` is combat identity. `slot` is presentation.
2. **Encounter rules are deterministic and data-driven.** Composition, attack pacing, and rewards all come from encounter templates.
3. **Existing behavior for solo encounters must remain unchanged.** A 1-member encounter is indistinguishable from the current system.
4. **Every timer created by combat is tracked and cleaned up by combat.** No orphaned timers, ever.
5. **Groups that are harder should be more rewarding.** Difficulty and reward scale together.

## Locked Decisions

1. **Encounter members are fixed at spawn.** Mid-fight summoning is out of scope for v1.
2. **Auto-attack targets the lowest-index living slot by default.** Retargets on death.
3. **Clicking a living enemy sets target and performs click-attack immediately.**
4. **Power Smash is single-target.** Hits the current target only. AoE abilities come later with stances.
5. **Boss encounters: boss-dies-encounter-ends.** Remaining adds despawn without granting rewards.
6. **Boss adds architecture is built but not wired to data in v1.** `adds` field on bosses is supported but no boss uses it yet.
7. **Boss threshold pacing is encounter-based.** `zoneClearKills` increments once per cleared normal encounter, not per member kill.
8. **`forcedCritMultiplier` is scoped to `targetId`.** Consumed only when the current target is actually hit, preventing waste on auto-attacks against the wrong member.

## Runtime Model

```js
EncounterRuntime {
  id: string,                     // unique encounter id (e.g. 'enc_1708300000_001')
  templateId: string | null,      // encounter template id (null for boss encounters)
  type: 'normal' | 'boss',
  members: EnemyRuntime[],        // stable member array, never reordered
  memberById: Map<string, EnemyRuntime>,
  targetId: string | null,        // current target's instanceId
  activeTimerIds: Set<string>,    // every TimeEngine timer owned by this encounter
  bossMemberId: string | null,    // set for boss encounters
  attackSpeedMult: number,        // from encounter template (1.0 for solo)
  rewardMult: number,             // XP/gold multiplier for this encounter
  lootBonus: {                    // loot modifiers for group encounters
    dropChanceMult: number,       // multiplier on normal drop chance (1.0 = no change)
    rarityBoost: number,          // additive bonus to uncommon+ weight (0.0 = no change)
  },
  attackLockCount: number,        // tracks concurrent enemy attacks for walk timer
}

EnemyRuntime {
  instanceId: string,             // unique runtime id (never reused)
  slot: number,                   // visual slot index (0-based)
  enemyId: string,                // data template id
  name: string,
  hp: Decimal,
  maxHp: Decimal,
  attack: number,
  attackSpeed: number,            // effective speed (template speed * encounter attackSpeedMult)
  defense: number,
  accuracy: number,
  armorPen: number,
  dot: number | null,
  lootTable: LootTable,
  goldDrop: string,
  xpDrop: string,
  isBoss: boolean,
  isAdd: boolean,
  alive: boolean,
}
```

Key rule: `instanceId` is combat identity. `slot` is presentation. They never change after spawn.

## Data Schema Changes

### New file: `src/data/encounters.js`

Encounter templates define weighted spawn options per zone range:

```js
export const ENCOUNTERS = [
  // ── Area 1: Whispering Thicket ────────────────────────────
  // Early zones: weak packs, solo medium/strong
  {
    id: 'a1_rat_pack',
    members: ['a1_forest_rat', 'a1_forest_rat', 'a1_forest_rat'],
    weight: 2,
    zones: [1, 4],
    attackSpeedMult: 1.0,     // rats are weak, let them attack at normal speed
    rewardMult: 1.0,          // roughly same total reward as a solo medium enemy
    lootBonus: { dropChanceMult: 1.0, rarityBoost: 0 },
  },
  {
    id: 'a1_wolf_pair',
    members: ['a1_wolf', 'a1_wolf'],
    weight: 1,
    zones: [3, 6],
    attackSpeedMult: 0.7,     // wolves attack at 70% normal speed in pairs
    rewardMult: 1.15,         // slight bonus for handling two
    lootBonus: { dropChanceMult: 1.1, rarityBoost: 0 },
  },
  // Late zones: strong groups as gear-check
  {
    id: 'a1_boar_duo',
    members: ['a1_thornback_boar', 'a1_thornback_boar'],
    weight: 1,
    zones: [8, 10],
    attackSpeedMult: 0.5,     // boars hit hard, halve their attack rate in groups
    rewardMult: 1.3,          // meaningful bonus for hard fight
    lootBonus: { dropChanceMult: 1.3, rarityBoost: 0.05 },
  },
  // Solo encounters (most enemies default to this via auto-generation)
];

// Helper: get weighted encounter pool for a given global zone
export function getEncountersForZone(globalZone) { ... }

// Auto-generate solo encounter wrappers for enemies without explicit templates
export function getSoloEncounter(enemyTemplate) {
  return {
    id: `solo_${enemyTemplate.id}`,
    members: [enemyTemplate.id],
    weight: 3,  // solo encounters are common
    attackSpeedMult: 1.0,
    rewardMult: 1.0,
    lootBonus: { dropChanceMult: 1.0, rarityBoost: 0 },
  };
}
```

Every enemy that doesn't appear in a multi-member encounter template gets an auto-generated solo wrapper. This means the encounter selection system is uniform — CombatEngine always picks an encounter template, never a raw enemy.

### `src/data/bosses.js`

Add optional field (not used in v1):
```js
adds: string[],  // enemy template IDs that spawn as adds (slots 1+)
```

### `src/data/enemies.js`

No changes to enemy definitions. Encounter composition lives in `encounters.js`, not on individual enemies.

## Timer Key Strategy

**Problem:** TimeEngine uses a flat string-key registry. Two DoT enemies with the same `'combat:enemyDot'` key would overwrite each other.

**Solution:** All per-member timer keys include the encounter ID and instance ID:

```
Format: `enc:${encounterId}:${timerType}:${instanceId}`

Examples:
  enc:enc_001:atk:mem_abc        // member abc's attack timer
  enc:enc_001:dot:mem_def        // member def's DoT timer
  enc:enc_001:spawnDelay         // encounter-level spawn delay (no instanceId)
  enc:enc_001:bossDelay          // encounter-level boss defeat delay
```

`_clearEncounterTimers()` iterates `encounter.activeTimerIds` and unregisters each. No prefix-based API needed on TimeEngine — the Set is the source of truth.

**Optional enhancement:** Add `TimeEngine.unregisterByPrefix(prefix)` as a safety net for cleanup. Low cost, prevents leaks if the Set gets out of sync.

## Event Contract

### New events

| Event | Payload |
|-------|---------|
| `COMBAT_ENCOUNTER_STARTED` | `{ encounterId, templateId, type, memberCount, members: [{ instanceId, slot, enemyId, name, maxHp, isBoss, isAdd }] }` |
| `COMBAT_ENCOUNTER_ENDED` | `{ encounterId, type, reason: 'cleared' \| 'boss_killed' \| 'zone_change' \| 'player_death' }` |
| `COMBAT_TARGET_CHANGED` | `{ encounterId, instanceId, slot, enemyId }` |

### Existing events — enriched, not replaced

All per-member combat events gain these fields alongside their existing payloads:

```js
// Added to COMBAT_ENEMY_SPAWNED, COMBAT_ENEMY_DAMAGED, COMBAT_ENEMY_KILLED,
// COMBAT_ENEMY_ATTACKED, COMBAT_ENEMY_DODGED, COMBAT_DOT_TICK:
{
  encounterId,    // which encounter
  instanceId,     // which member
  slot,           // visual position
  // ...existing fields unchanged
}
```

**Migration rule:** Emit `COMBAT_ENCOUNTER_STARTED` (one event with full member list). Do NOT emit per-member `COMBAT_ENEMY_SPAWNED` — downstream handlers migrate to the encounter event. This avoids the N+1 event problem where old handlers would create/destroy visuals N times.

## `getPlayerDamage()` Refactor

Current signature: `getPlayerDamage(state, isClick)` — reads `currentEnemy?.defense` from module scope.

New behavior: reads defense from the current target member:

```js
getPlayerDamage(state, isClick = false) {
  const target = encounter?.memberById.get(encounter.targetId);
  const enemyDef = target?.defense ?? 0;
  // ...rest unchanged
}
```

No signature change needed. The function still reads from module-scoped encounter state, just drills into the target member instead of a flat `currentEnemy`.

## `forcedCritMultiplier` Fix

**Problem:** With auto-attack ticking, a forced crit could be consumed by an auto-attack against a non-target member (if targeting changes between set and use).

**Solution:** `forcedCritMultiplier` is only consumed when `getPlayerDamage()` is called for an attack against `encounter.targetId`. Since `playerAttack()` always hits `targetId` and `powerSmashAttack()` always hits `targetId`, the forced crit naturally applies to the intended target. No change needed — the current architecture already does this correctly because auto-attack also hits targetId.

## CombatEngine Refactor

### Phase 1 — Encounter state and selectors (no behavior change)

1. Replace module-level `currentEnemy` with `encounter` (EncounterRuntime | null).
2. Add selectors:
   - `getEncounter()` — returns encounter or null
   - `getTargetMember()` — returns the EnemyRuntime targeted by `encounter.targetId`
   - `getLivingMembers()` — returns array of alive members
   - `getMemberByInstanceId(id)` — Map lookup
   - `hasTarget()` — returns boolean (replaces `getCurrentEnemy() !== null` checks)
3. Add `setTarget(instanceId)` — sets `encounter.targetId`, emits `COMBAT_TARGET_CHANGED`.
4. Keep `getCurrentEnemy()` temporarily — maps to `getTargetMember()` shape. Remove in cleanup phase. Only consumer is SmashButton.
5. Add timer helpers:
   - `_registerMemberTimers(member)` — registers attack + DoT timers with unique keys, adds to `encounter.activeTimerIds`
   - `_unregisterMemberTimers(member)` — unregisters and removes from Set
   - `_clearEncounterTimers()` — iterates Set, unregisters all
   - `_setEncounterTimersEnabled(enabled)` — iterates Set, calls `TimeEngine.setEnabled()` on each

### Phase 2 — Encounter spawning

1. `spawnEnemy()`:
   - Get encounter pool for current zone via `getEncountersForZone(globalZone)`
   - Pick weighted random encounter template
   - Build members: for each member ID in template, look up enemy data, apply zone scaling
   - Apply `attackSpeedMult`: each member's effective `attackSpeed = template.attackSpeed * encounter.attackSpeedMult`
   - Create EncounterRuntime with all fields from template (`rewardMult`, `lootBonus`, `attackSpeedMult`)
   - Set `targetId` to `members[0].instanceId`
   - Register all member timers
   - Emit `COMBAT_ENCOUNTER_STARTED` with full member list
2. `spawnBoss(bossTemplate)`:
   - Clear any active encounter via `_clearEncounterTimers()`
   - Build boss member from template (as today)
   - If `bossTemplate.adds` exists (v2+): build add members from enemy data
   - Create EncounterRuntime with `type: 'boss'`, `bossMemberId` set
   - Set `targetId` to boss member
   - Register timers, emit `COMBAT_ENCOUNTER_STARTED`
3. Shared builder: `_buildMember(enemyData, slot, opts)` — creates one EnemyRuntime with unique instanceId.

### Phase 3 — Combat actions

1. `playerAttack(isClick)`:
   - Get target via `getTargetMember()`. Return early if null.
   - Call `getPlayerDamage(state, isClick)` (reads target's defense internally).
   - Apply damage to target member's HP.
   - Emit `COMBAT_ENEMY_DAMAGED` with enriched payload (encounterId, instanceId, slot).
   - If target HP <= 0, call `_onMemberDeath(target.instanceId)`.
2. `powerSmashAttack(smashMultiplier)`:
   - Same pattern, hits `getTargetMember()`.
3. `enemyAttack(instanceId)`:
   - Look up member by instanceId. Return early if not alive.
   - Roll accuracy vs dodge per-member (each member has its own accuracy).
   - Emit `COMBAT_ENEMY_ATTACKED` with member context.
   - On hit: damage player as today.
   - On miss: emit `COMBAT_ENEMY_DODGED` with member context.
4. Per-member DoT:
   - Each DoT member gets its own timer: `enc:${encId}:dot:${instanceId}`
   - Callback: damage player, emit `COMBAT_DOT_TICK` with `{ instanceId, ... }`
   - Stopped when that member dies (not when encounter ends — other members may still have DoT)

### Phase 4 — Death, retargeting, and encounter completion

1. `_onMemberDeath(instanceId)`:
   - Look up member. Mark `alive = false`.
   - Unregister that member's timers via `_unregisterMemberTimers(member)`.
   - Grant rewards: `Progression.grantKillRewards(member)` — per-member, scaled by `encounter.rewardMult`.
   - Emit `COMBAT_ENEMY_KILLED` with enriched payload.
   - **Retarget:** If dead member was the target, set `targetId` to lowest-slot living member. Emit `COMBAT_TARGET_CHANGED`. If no living members remain, proceed to encounter end.
   - **Boss check:** If `member.instanceId === encounter.bossMemberId`, end encounter immediately (reason: `boss_killed`).
   - **Normal check:** If no living members remain, end encounter (reason: `cleared`).
2. `_onEncounterEnd(reason)`:
   - Clear all remaining encounter timers.
   - Despawn remaining alive members (boss adds): mark dead, no rewards, emit `COMBAT_ENEMY_KILLED` with `{ despawned: true }` so GameScene can animate removal.
   - Emit `COMBAT_ENCOUNTER_ENDED` with reason.
   - If reason is `cleared`: increment `zoneClearKills` once. Schedule spawn delay → `spawnEnemy()`.
   - If reason is `boss_killed`: schedule boss defeated delay → `BossManager.onBossDefeated()`.
   - If reason is `zone_change` or `player_death`: no spawn scheduling (handled by those paths).
   - Set `encounter = null`.

### Phase 5 — Lifecycle correctness

All existing lifecycle paths updated:

1. **Zone change** (`WORLD_ZONE_CHANGED`):
   - If encounter active: `_onEncounterEnd('zone_change')`.
   - Cancel `spawnDelay` timer if pending.
   - `spawnEnemy()`.
2. **Player death** (`_onPlayerDeath`):
   - Set `_playerDead = true`.
   - If encounter active: disable all encounter timers via `_setEncounterTimersEnabled(false)`.
   - If boss encounter: `BossManager.cancelBoss()`.
   - Set `encounter = null` (don't call `_onEncounterEnd` — no rewards, no events).
   - Disable `combat:autoAttack`, `combat:playerRegen`.
   - Schedule respawn (as today, re-enables timers and calls `spawnEnemy()`).
3. **Boss spawn override** (`spawnBoss`):
   - If encounter active: `_clearEncounterTimers()`, set `encounter = null`.
   - Proceed with boss encounter build.
4. **Engine destroy**:
   - If encounter active: `_clearEncounterTimers()`.
   - Unregister global timers (autoAttack, playerRegen, playerRespawn).
   - Destroy scope, null state.

## GameScene Refactor

### EnemySlotView — Phaser Container per slot

Each slot is a `Phaser.GameObjects.Container` that owns all its visual children:

```js
EnemySlotView {
  container: Phaser.GameObjects.Container,  // root — position, visibility, destroy
  sprite: Phaser.GameObjects.Image,         // enemy sprite (or null)
  rect: Phaser.GameObjects.Rectangle,       // fallback rect (or null)
  hpBarBg: Phaser.GameObjects.Rectangle,
  hpBarFill: Phaser.GameObjects.Rectangle,
  nameText: Phaser.GameObjects.Text,
  targetIndicator: Phaser.GameObjects.Image | null,
  state: {
    instanceId: string | null,
    enemyId: string | null,
    currentSprites: object | null,    // { default, reaction, attack, dead, dead2 }
    spriteW: number,
    spriteH: number,
    spriteOffsetY: number,
    bottomAlignOffsetY: number,
    lungeDist: number,
    // Per-slot animation timers (Phaser timer events)
    poseRevertTimer: Phaser.Time.TimerEvent | null,
    reactDelayTimer: Phaser.Time.TimerEvent | null,
    deathFadeTimer: Phaser.Time.TimerEvent | null,
    // Per-slot extra objects (e.g. stalker head)
    extraObjects: Phaser.GameObjects.GameObject[],
  },
  baseX: number,   // slot's home X position (for tween yoyo)
  baseY: number,   // slot's home Y position
}
```

Benefits of Container:
- `container.setPosition(x, y)` moves everything together
- `container.setVisible(false)` hides everything
- `container.destroy(true)` cleans up all children
- Click hitarea goes on the container
- `this.tweens.killTweensOf(container)` kills all slot tweens (actually: kill tweens of sprite/rect individually, container tweens are for position)

### Slot pool

Pre-create `MAX_ENCOUNTER_SIZE` (e.g., 5) slot views in `create()`. All start hidden. On encounter start, bind members to slots, position them, show them. On encounter end, hide all.

### Slot positioning

```js
_getSlotPositions(count) {
  const ga = LAYOUT.gameArea;
  const centerX = ga.x + 700;   // current _enemyX
  const spread = 140;            // px between slot centers (tune per count)
  const positions = [];
  const startX = centerX - ((count - 1) * spread) / 2;
  for (let i = 0; i < count; i++) {
    positions.push({
      x: startX + i * spread,
      y: this._enemyY,           // same Y as current (bottom-aligned)
    });
  }
  return positions;
}
```

For 1 enemy: centered at current position (exact parity). For 3 enemies: spread across 280px. Sprite sizes may need scaling for 4-5 enemies to avoid overlap.

### Walk timer lock counting

**Problem:** Multiple enemies attacking on independent timers would pause/unpause `_walkTimer` rapidly, causing visual jitter.

**Solution:** Track `_attackLockCount`. Each enemy attack increments it and pauses walk. Each pose revert decrements it. Walk only unpauses when count reaches 0.

```js
_lockWalk() {
  this._attackLockCount++;
  this._walkTimer.paused = true;
}
_unlockWalk() {
  this._attackLockCount = Math.max(0, this._attackLockCount - 1);
  if (this._attackLockCount === 0) this._walkTimer.paused = false;
}
```

### Damage number positioning

Damage numbers spawn at the slot's `baseX` position, not the global `_enemyX`:

```js
_spawnDamageNumber(amount, isCrit, isPowerSmash, slotView) {
  const x = slotView.baseX + (Math.random() * 60 - 30);
  const y = slotView.baseY - 50;
  // ...rest unchanged
}
```

### Per-slot death animations

Special death animations (rat spin, slime wobble, stalker decap) remain enemy-ID-specific but scoped to the slot:

```js
_onEnemyKilled(data) {
  const slot = this._getSlotByInstanceId(data.instanceId);
  if (!slot) return;
  // Clean up slot's in-flight tweens and timers
  this.tweens.killTweensOf(slot.sprite);
  this.tweens.killTweensOf(slot.rect);
  if (slot.state.poseRevertTimer) slot.state.poseRevertTimer.remove();
  if (slot.state.reactDelayTimer) slot.state.reactDelayTimer.remove();
  // Branch on enemyId for special deaths
  switch (data.enemyId) {
    case 'a1_forest_rat':    this._deathRatSpin(slot); break;
    case 'a1_hollow_slime':  this._deathSlimeWobble(slot); break;
    case 'a1_blighted_stalker': this._deathStalkerDecap(slot); break;
    default:                 this._deathDefault(slot); break;
  }
  // Fade out slot's name/HP bar
  // ...
}
```

Stalker decapitation spawns the head sprite into `slot.state.extraObjects` for cleanup.

### Target highlight

Active target gets a subtle visual indicator (pulsing border, underline, or arrow). Non-targets are slightly dimmed (alpha 0.7). Click on any living slot calls `CombatEngine.setTarget(instanceId)` then `CombatEngine.playerAttack(true)`.

### Player death — disable all slots

```js
_onPlayerDied() {
  // ...existing death animation...
  for (const slot of this._enemySlots) {
    slot.container.disableInteractive();
  }
  // On respawn:
  // Re-enable is unnecessary — new encounter will create fresh interactive state
}
```

## Downstream System Updates

### `src/systems/OfflineProgress.js`

**Currently missing from the plan.** Must be updated.

Offline combat model changes from "one enemy at a time" to "one encounter at a time":

```js
// Current: timePerKill = avgHp / playerDps + spawnDelay
// New:     timePerEncounter = avgEncounterTotalHp / playerDps + spawnDelay

// For the current zone, get the encounter pool
// Average total HP = weighted average of sum(member HPs) across encounter templates
// Average total rewards = weighted average of sum(member rewards * rewardMult)
// estimatedEncounters = offlineSeconds / timePerEncounter
// goldGained = estimatedEncounters * avgEncounterGold
// xpGained = estimatedEncounters * avgEncounterXp
```

Solo encounters (1 member) produce identical results to the current formula. Grouped encounters correctly model longer kill times with proportionally higher rewards.

### `src/systems/LootEngine.js`

1. Per-member kill events still fire `COMBAT_ENEMY_KILLED` — LootEngine handles each normally.
2. New: read `encounter.lootBonus` from enriched event payload:
   - `dropChanceMult`: multiply the base 10% drop chance for normal kills.
   - `rarityBoost`: add to the uncommon weight in `LOOT_V2.rarityWeights` for this roll.
3. Boss kill logic unchanged (boss encounters don't use lootBonus).
4. `rewardMult` is handled by Progression (gold/XP), not LootEngine.

### `src/systems/Progression.js`

1. `grantKillRewards(member)` still called per-member.
2. Gold and XP are multiplied by `encounter.rewardMult` before granting. CombatEngine passes the multiplier: `Progression.grantKillRewards(member, encounter.rewardMult)`.
3. `zoneClearKills` increment moves to `_onEncounterEnd('cleared')` in CombatEngine — Progression no longer needs to count this.

### `src/systems/BossManager.js`

1. Threshold check trigger shifts from `COMBAT_ENEMY_KILLED` to `COMBAT_ENCOUNTER_ENDED` (reason: `cleared`).
2. `activeBoss` remains a single reference — only one boss encounter at a time.
3. `cancelBoss()` and `onBossDefeated()` unchanged — CombatEngine calls them at the right encounter lifecycle points.

### `src/ui/SmashButton.js`

1. Replace `CombatEngine.getCurrentEnemy()` with `CombatEngine.hasTarget()` for the alive check.
2. `powerSmashAttack(multiplier)` continues to hit the current target. No change needed.
3. Remove `getCurrentEnemy()` dependency entirely.

### `src/ui/SystemLog.js`

1. Subscribe to `COMBAT_ENCOUNTER_STARTED` instead of per-member `COMBAT_ENEMY_SPAWNED`.
2. Log encounter summary: "A pack of 3 Forest Rats appears!" or "Thornback Boar appears!" (solo).
3. Mechanic warnings (armorPen, DoT) logged once per encounter, showing the most dangerous member's stats.
4. `_currentEnemyName` replaced with encounter-level context or removed.

### `src/systems/DialogueManager.js`

1. Verify `COMBAT_ENEMY_KILLED` listeners still work — they fire per-member, cooldowns prevent spam.
2. Boss defeat dialogue: unchanged, `BOSS_DEFEATED` fires once per boss encounter.
3. `COMBAT_ENEMY_DAMAGED` big-damage callout: still works per-hit, unaffected.

### `src/scenes/OverworldScene.js`

1. `COMBAT_ENEMY_KILLED` refresh: fires per member. Safe — refreshing N times in one frame is idempotent.
2. No logic changes needed.

### `src/ui/StatsPanel.js` (if applicable)

1. Dodge chance display: show dodge chance against the current target's accuracy. Updates on `COMBAT_TARGET_CHANGED`.

### `scripts/validate-data.js`

1. Add validation for `encounters.js`: valid member enemy IDs exist, zones are valid ranges, weights are positive.
2. Add validation for boss `adds` field: referenced enemy IDs exist.

### `scripts/balance-sim.js`

1. Model encounter pools instead of individual enemies.
2. Time per encounter = sum(member HPs) / playerDPS + spawnDelay.
3. Incoming DPS = sum of (member ATK * member attackSpeed * attackSpeedMult) with dodge applied per-member.
4. Report survival ratios for grouped encounters separately.

## Execution Checklist (Implementation Order)

### 1) Contracts and constants (no behavior change) ✅

- [x] `src/events.js`
  1. Add `COMBAT_ENCOUNTER_STARTED`, `COMBAT_ENCOUNTER_ENDED`, `COMBAT_TARGET_CHANGED` to `EVENTS`.
  2. Add `EVENT_CONTRACTS` for new events.
  3. Extend existing combat event contracts to include `encounterId`, `instanceId`, `slot`.

- [x] `src/config.js`
  1. Add `COMBAT_V2.maxEncounterSize` (5).
  2. Add encounter layout constants: `COMBAT_V2.encounterSpread` (140px between slot centers).

### 2) Encounter data ✅

- [x] `src/data/encounters.js` (new file)
  1. Define encounter templates for Area 1 (rat_pack, wolf_pair, boar_duo).
  2. Export `getEncountersForZone(areaId, zoneNum)` — returns weighted pool.
  3. Export `getSoloEncounter(enemyTemplate)` — auto-generates solo wrapper.
  4. Export `pickRandomEncounter(areaId, zoneNum)` — weighted random selection.
  5. Areas 2-3 get solo-only encounters automatically (no authored templates yet).

- [x] `src/data/bosses.js`
  1. Documented optional `adds: string[]` field in header comment. No boss uses it in v1.

### 3) CombatEngine scaffolding (no behavior change yet) ⬅️ CURRENT

- [ ] `src/systems/CombatEngine.js`
  1. Add `encounter` module-level variable (null initially).
  2. Add selectors: `getEncounter()`, `getTargetMember()`, `getLivingMembers()`, `getMemberByInstanceId()`, `hasTarget()`.
  3. Add `setTarget(instanceId)`.
  4. Add timer helpers: `_registerMemberTimers()`, `_unregisterMemberTimers()`, `_clearEncounterTimers()`, `_setEncounterTimersEnabled()`.
  5. Add `_buildMember(enemyData, slot, opts)` — creates EnemyRuntime with unique instanceId.
  6. Keep `getCurrentEnemy()` mapped to `getTargetMember()` temporarily.

### 4) CombatEngine spawn pipeline

- [ ] `src/systems/CombatEngine.js`
  1. Refactor `spawnEnemy()`: pick encounter template, build members, create EncounterRuntime, start encounter.
  2. Refactor `spawnBoss()`: build boss encounter (+ adds if present), create EncounterRuntime.
  3. `_startEncounter(enc)`: set targetId, register all member timers (unique keys per member), emit `COMBAT_ENCOUNTER_STARTED`.
  4. Remove per-member `COMBAT_ENEMY_SPAWNED` emission — replaced by encounter event.

### 5) CombatEngine combat actions

- [ ] `src/systems/CombatEngine.js`
  1. `playerAttack(isClick)` → target from `getTargetMember()`.
  2. `powerSmashAttack(mult)` → target from `getTargetMember()`.
  3. `getPlayerDamage()` → reads `getTargetMember().defense`.
  4. `enemyAttack(instanceId)` → per-member callback, registered with unique timer key.
  5. Per-member DoT: unique timer key `enc:${id}:dot:${instanceId}`, stopped on member death.

### 6) CombatEngine death and encounter completion

- [ ] `src/systems/CombatEngine.js`
  1. `_onMemberDeath(instanceId)`: mark dead, unregister timers, grant rewards (with `rewardMult`), emit `COMBAT_ENEMY_KILLED`, retarget, check encounter end.
  2. `_onEncounterEnd(reason)`: clear timers, despawn remaining adds (if boss), emit `COMBAT_ENCOUNTER_ENDED`, schedule next spawn or boss flow.
  3. `zoneClearKills` incremented once in `_onEncounterEnd('cleared')`.

### 7) CombatEngine lifecycle correctness

- [ ] `src/systems/CombatEngine.js`
  1. Zone change: end encounter with reason `zone_change`, spawn new.
  2. Player death: disable encounter timers, cancel boss if active, null encounter, schedule respawn.
  3. Boss override: clear active encounter, build boss encounter.
  4. Destroy: clear encounter, unregister globals, destroy scope.

### 8) GameScene slot model

- [ ] `src/scenes/GameScene.js`
  1. Pre-create `MAX_ENCOUNTER_SIZE` EnemySlotView containers in `create()`, all hidden.
  2. Add slot lookup helpers: `_getSlotByInstanceId()`, `_getSlotByIndex()`.
  3. Add `_attackLockCount` and `_lockWalk()` / `_unlockWalk()` for walk timer management.
  4. Subscribe to `COMBAT_ENCOUNTER_STARTED`, `COMBAT_ENCOUNTER_ENDED`, `COMBAT_TARGET_CHANGED`.

### 9) GameScene encounter rendering

- [ ] `src/scenes/GameScene.js`
  1. `_onEncounterStarted(data)`: compute slot positions, bind members to slots, load sprites, show containers, highlight target.
  2. `_onEncounterEnded(data)`: hide all slots, kill all slot tweens, clean up extra objects.
  3. `_highlightTarget(instanceId)`: dim non-targets, highlight active target.
  4. Click handlers per slot: `container.on('pointerdown', ...)` → `setTarget()` + `playerAttack(true)`.

### 10) GameScene per-member animations

- [ ] `src/scenes/GameScene.js`
  1. `_onEnemyDamaged(data)`: resolve slot by `instanceId`, update that slot's HP bar and hit reaction.
  2. `_onEnemyAttacked(data)`: animate only the attacking member's slot lunge. Use `_lockWalk()` / `_unlockWalk()`.
  3. `_onEnemyKilled(data)`: animate that slot's death. Special deaths (rat, slime, stalker) scoped to slot. Extra objects tracked in `slot.state.extraObjects`.
  4. `_onEnemyDodged(data)`: "DODGE!" text at player position (unchanged — dodge is a player reaction).
  5. `_onPlayerDied()`: disable all slot containers. Respawn doesn't need to re-enable — new encounter creates fresh state.
  6. Damage numbers spawn at `slotView.baseX`, not global `_enemyX`.

### 11) Downstream integration

- [ ] `src/systems/BossManager.js` — shift threshold to `COMBAT_ENCOUNTER_ENDED`.
- [ ] `src/systems/Progression.js` — accept `rewardMult` parameter in `grantKillRewards()`.
- [ ] `src/systems/LootEngine.js` — read `lootBonus` from enriched event, apply `dropChanceMult` and `rarityBoost`.
- [ ] `src/ui/SystemLog.js` — subscribe to encounter event, log summary, suppress per-member spam.
- [ ] `src/ui/SmashButton.js` — replace `getCurrentEnemy()` with `hasTarget()`.
- [ ] `src/systems/DialogueManager.js` — verify, no changes expected.
- [ ] `src/scenes/OverworldScene.js` — verify, no changes expected.
- [ ] `src/systems/OfflineProgress.js` — model encounters as composite kills.

### 12) Tooling updates

- [ ] `scripts/validate-data.js` — validate encounters.js schema, boss adds references.
- [ ] `scripts/balance-sim.js` — model encounter pools, group incoming DPS, survival ratios.

### 13) Rollout and tuning

- [ ] Author Area 1 encounter templates with tuned weights, attackSpeedMult, rewardMult, lootBonus.
- [ ] Playtest: solo parity first, then enable 1-2 group encounters.
- [ ] Stub Area 2-3 encounters (solo-only until sprites/content exist).

### 14) Cleanup

- [ ] Remove `getCurrentEnemy()` compatibility shim.
- [ ] Remove any single-enemy code paths in CombatEngine.
- [ ] Remove single-enemy visual code in GameScene.
- [ ] Update `GAME_DATA_REFERENCE.md` if maintained.

## Validation Matrix

### Solo parity (must pass before enabling groups)
1. Normal fight loop: spawn, damage, kill, respawn delay — identical to pre-refactor.
2. Boss fight loop: challenge, kill, delay, zone advance — identical.
3. Player death: clears combat, respawns, spawns new enemy.
4. DoT enemy: ticks every 1s, bypasses defense, stops on death/zone change.
5. Zone change: cancels encounter, spawns new.
6. Offline progress: produces same results for solo encounters.
7. All downstream systems behave identically with 1-member encounters.

### Group combat
1. Group spawn shows all members with independent sprites and HP bars.
2. Click targeting switches target, applies click damage to selected member.
3. Each member attacks independently at encounter-modified speed.
4. Killing one member unregisters only that member's timers.
5. Target auto-advances to lowest-slot living member on death.
6. Encounter ends when all members die. One spawn delay follows.
7. `zoneClearKills` increments once per encounter clear.
8. Rewards scale by `rewardMult`. Loot uses `lootBonus`.
9. Damage numbers appear at the correct slot position.
10. Player walk timer doesn't jitter (lock counting works).

### Boss encounters (v1: solo boss only)
1. Boss challenge works as before.
2. Boss kill ends encounter, triggers boss defeated flow.
3. `adds` field is accepted in data but not used in v1.

### Regression
1. All downstream systems stable: SystemLog, LootEngine, DialogueManager, SmashButton, OverworldScene.
2. No orphan timers after zone change, player death, or scene shutdown.
3. Offline progress accurate for both solo and grouped encounters.
4. Balance sim runs without errors and reports group encounter metrics.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| **Visual clutter at 4-5 enemies** | Cap `MAX_ENCOUNTER_SIZE` at 5. Compact HP bars. Target emphasis via dimming non-targets. Scale sprites slightly smaller for large groups. |
| **DPS spikes from simultaneous attackers** | `attackSpeedMult` on encounter templates. Strong groups attack at 50-70% speed. Weak swarms keep normal speed but deal trivial damage. |
| **Timer leaks** | `activeTimerIds` Set on EncounterRuntime. `_clearEncounterTimers()` on every exit path. Optional `TimeEngine.unregisterByPrefix()` safety net. |
| **Walk timer jitter** | `_attackLockCount` with `_lockWalk()` / `_unlockWalk()`. Walk only unpauses when all locks released. |
| **Damage number overlap** | Numbers spawn at slot's `baseX`, not global `_enemyX`. Slight random X offset per slot. |
| **forcedCrit consumed by wrong target** | Not an issue — `playerAttack()` and `powerSmashAttack()` both hit `targetId`, and `forcedCrit` is only consumed in `getPlayerDamage()`. |
| **Groups making early game too hard** | Early-zone groups are weak enemies only (rats). Same total difficulty as solo medium enemies. `rewardMult: 1.0`, `attackSpeedMult: 1.0`. |
| **Groups making loot too generous** | `lootBonus` is per-encounter-template, not automatic. Early groups have `dropChanceMult: 1.0`. Only late-zone hard groups get bonus loot. |
| **OfflineProgress wrong for groups** | Model encounters as composite kills with total HP and total rewards. Solo encounters produce identical results to current formula. |

## Build Order Relative to Other Features

1. **Multi-enemy encounter runtime** (this plan)
2. **Enemy traits** (`regen`, `thorns`, `enrage`) — per member, composable on EnemyRuntime
3. **Stances** — targeting modes (single-target, cleave, AoE) that interact with encounter members
4. **Boss adds** (v2) — wire `adds` field on boss templates, enable specific bosses

This order ensures each feature composes naturally on the encounter foundation rather than being retrofitted.

## Future Extensions (Not in v1)

- Mid-fight summons (dynamic member insertion into EncounterRuntime)
- Cleave/splash targeting (stance-driven, hits N members)
- Smart auto-target modes (lowest HP, highest threat)
- Formation buffs/debuffs (member proximity bonuses)
- Boss adds with unique mechanics (healer add, shielder add)
