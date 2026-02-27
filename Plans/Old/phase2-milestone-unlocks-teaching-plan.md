# Phase 2: Milestone Unlocks + SYSTEM Teaching Moments (Revised)

## Assessment Critique

1. The file contains stale assumptions from before Phase 1 completion:
   - It says no dev unlock helper exists, but `window.__unlockSkill` already exists in `src/main.js`.
   - It includes old agent-specific instruction text that should not be part of the plan.
2. Interrupt unlock timing is mismatched with current mechanics:
   - Plan says zone 13-15 trigger, but current code emits `COMBAT_ENEMY_CASTING` only for summon casts (first seen much later).
3. Trigger architecture is overly coupled to `DialogueManager`:
   - Unlock decision logic and dialogue sequencing are mixed. This raises maintenance risk.
4. The proposed milestone detection events are partially redundant:
   - `COMBAT_ENCOUNTER_STARTED` payload already includes member traits (`armor`, `thorns`, `dot`, `corruption`, etc.).
5. Dev helper snippet is unsafe as written:
   - Uses `await` in a non-async global helper and creates avoidable runtime issues.

## Goal

Gate secondary skill buttons behind progression unlock flags and teach those unlock moments with one-time SYSTEM sequences and one-shot combat learning quips.

## Scope

- In scope:
  - Unlock flags: `unlockedArmorBreak`, `unlockedCleanse`, `unlockedInterrupt`
  - Secondary button gating in combat UI
  - Unlock sequence dialogue
  - First-time teaching quips for stance awareness
  - Save-safe persistence via `Store.flags`
- Out of scope:
  - Full charge attack feature implementation (Phase 3)
  - Enemy roster rebalance

## Design Decisions

1. Keep unlock detection in a dedicated system (`SkillUnlockDirector`) and keep `DialogueManager` focused on dialogue policy.
2. Add one optional integration event `SKILL_UNLOCKED` for immediate UI response and pulse effects.
3. Use existing combat events as trigger sources where possible:
   - `COMBAT_ENCOUNTER_STARTED` for trait-based unlocks
   - `COMBAT_ENEMY_CASTING` for interim Interrupt unlock
4. Keep player-facing stance names consistent: `Ruin`, `Tempest`, `Fortress`.

---

## Task P2-1: Add Skill Unlock Director

**Files**
- Add: `src/systems/SkillUnlockDirector.js`
- Modify: `src/scenes/UIScene.js` (init/destroy)

**Responsibilities**
1. Subscribe to trigger events and set unlock flags once.
2. Emit `EVENTS.SKILL_UNLOCKED` after flag is set.
3. Queue the corresponding unlock sequence in a deterministic way.
4. Track and clean temporary timers on destroy.

**Trigger Rules (revised)**
1. Armor Break:
   - Source: `COMBAT_ENCOUNTER_STARTED`
   - Condition: any encounter member has `armor.reduction > 0`
   - Optional pacing guard: `state.currentZone >= 6`
2. Cleanse:
   - Source: `COMBAT_ENCOUNTER_STARTED`
   - Condition: any member has `thorns > 0` OR `dot > 0` OR `corruption > 0`
   - Optional pacing guard: `state.currentZone >= 11`
3. Interrupt (interim until Phase 3 charge attacks):
   - Source: `COMBAT_ENEMY_CASTING`
   - Condition: first observed cast event
   - No strict zone gate in current implementation, because cast events are currently tied to summoners.

**Commit**
`feat: add SkillUnlockDirector for milestone-based secondary skill unlocks`

---

## Task P2-2: Add Unlock Event Contract

**Files**
- Modify: `src/events.js`

**Changes**
1. Add event:
- `SKILL_UNLOCKED: 'skill:unlocked'` with payload `{ skillId: 'armorBreak' | 'cleanse' | 'interrupt' }`
2. Add dev event contract validation entry:
- `[EVENTS.SKILL_UNLOCKED]: ['skillId']`

**Commit**
`feat: add SKILL_UNLOCKED event contract`

---

## Task P2-3: Add Unlock Sequences + Teaching Quips Data

**Files**
- Modify: `src/data/dialogue.js`

**Changes**
1. Add sequence arrays for:
   - `UNLOCK_ARMOR_BREAK`
   - `UNLOCK_CLEANSE`
   - `UNLOCK_INTERRUPT`
2. Add one-shot teaching quips:
   - `FIRST_STANCE_SWITCH`
   - `FIRST_THORNS_HIT`
   - `FIRST_EVASION_DODGE`
   - `FIRST_REGEN_HEAL`
3. Ensure wording uses `Ruin` and `Tempest` labels.

**Commit**
`feat: add phase2 unlock sequences and stance teaching quips`

---

## Task P2-4: Dialogue Sequencing Support

**Files**
- Modify: `src/systems/DialogueManager.js`

**Changes**
1. Add a small reusable `saySequence(lines)` helper.
2. Keep sequence scheduling IDs trackable so timers can be cleaned up in `destroy()`.
3. Add one-shot quip hooks using existing event stream and flags:
   - `STANCE_CHANGED` -> first stance switch
   - `COMBAT_THORNS_DAMAGE` -> first thorns hit
   - `COMBAT_PLAYER_MISSED` -> first evasion dodge
   - `COMBAT_ENEMY_REGEN` -> first regen teach
4. Import and use new dialogue constants from `dialogue.js`.

**Commit**
`feat: add dialogue sequence helper and one-shot phase2 teaching quips`

---

## Task P2-5: Gate Secondary Action Buttons by Unlock Flags

**Files**
- Modify: `src/scenes/UIScene.js`

**Changes**
1. Keep slot A always visible for current stance.
2. Show slot B only when matching unlock flag is true:
   - `ruin` -> `unlockedArmorBreak`
   - `tempest` -> `unlockedInterrupt`
   - `fortress` -> `unlockedCleanse`
3. Refresh action buttons on:
   - `EVENTS.SKILL_UNLOCKED`
   - `EVENTS.SAVE_LOADED`
   - `EVENTS.STANCE_CHANGED`

**Commit**
`feat: gate stance slotB actions behind unlock flags`

---

## Task P2-6: Optional Unlock Pulse Affordance

**Files**
- Modify: `src/ui/ArmorBreakButton.js`
- Modify: `src/ui/InterruptButton.js`
- Modify: `src/ui/CleanseButton.js`

**Changes**
1. Add `pulseUnlock()` method to each secondary button.
2. On `SKILL_UNLOCKED`, pulse only the newly unlocked button.
3. Stop pulse/tween on hide/destroy.

**Commit**
`feat: add unlock pulse affordance for newly available secondary skills`

---

## Task P2-7: Dev/Test Helpers

**Files**
- Modify: `src/main.js`

**Changes**
1. Keep existing helper:
   - `__unlockSkill(name)`
2. Add counterparts for regression loops:
   - `__lockSkill(name)`
   - `__resetUnlockFlags()`
3. Keep helpers synchronous and DEV-only.

**Commit**
`chore: add lock/reset dev helpers for phase2 unlock testing`

---

## Verification Checklist

1. `npm run build` passes.
2. Fresh save start:
   - Slot B buttons hidden for all stances.
3. First armored encounter:
   - Armor Break unlocks once, sequence plays once, Ruin slot B appears.
4. First thorns/dot/corruption pressure encounter:
   - Cleanse unlocks once, sequence plays once, Fortress slot B appears.
5. First cast event:
   - Interrupt unlocks once, sequence plays once, Tempest slot B appears.
6. Teaching quips fire once each and do not repeat.
7. Save and reload:
   - unlock flags persist
   - completed unlock sequences do not replay
8. Skill upgrade panel remains consistent:
   - secondary tier groups become visible only after matching unlock flag.

## Final Integration Commit

`feat: phase2 milestone unlocks button gating and teaching sequences`
