# Overworld Territory Map - Reviewed and Revised Plan

## Critical Review Summary

## What is solid in the original plan
- The feature goal is clear: 13 enemy-linked territories with explicit claim actions.
- Data-first layering (data -> state -> manager -> UI) is the right implementation order.
- Territory progress tied to `COMBAT_ENEMY_KILLED` fits the current event architecture.
- Persisting territory ownership across prestige is a good long-term progression hook.

## What needs to change
- Scene/time ownership was risky. `TimeEngine.update()` currently runs in `GameScene.update()`. Duplicating or moving this to `OverworldScene` introduces double-tick or pause bugs.
- Buff scope was too broad for one pass. Wiring 13 buff types across Combat/Loot/Upgrade all at once is high regression risk.
- Some buff keys overlapped conceptually (`goldFind`, `goldFromKills`, `allIncome`) and could easily be double-applied.
- `ZoneNav hide/show` and map toggle behavior were underspecified relative to current `UIScene` structure.
- The plan mixed core gameplay delivery with polish/dialogue work; this should be staged after mechanical stability.

---

## Revised Architecture

Use `OverworldScene` as an overlay scene, not a replacement for `GameScene`.

- `GameScene` remains active so combat and `TimeEngine` continue naturally.
- `OverworldScene` is launched/paused (or slept/woken) via `UIScene` toggle.
- `ZoneNav` is hidden while map is open.
- `UIScene` remains active at all times.

This avoids changing timing ownership and reduces regression surface.

---

## Scope Split

## Phase 1 (ship first)
- Territory tracking and claiming
- Overworld map rendering and claim UI
- Persistence + migration
- Only core buff integration needed for immediate value:
  - `goldGain`, `xpGain`, `critChance`, `flatStr`, `flatVit`, `hpRegen`, `fragmentDropRate`, `autoAttackSpeed`

## Phase 2 (follow-up)
- Remaining niche buffs (`allIncome`, `prestigeMultiplier`) after balance/testing
- Dialogue flavor events
- Additional map polish/animation

---

## Data Model

## 1. `src/data/territories.js` (new)

Define 13 territories with canonical buff keys.

Each entry:
```js
{
  id,
  name,
  zone,
  enemyId,
  buff: { key, label, value },
  killsRequired,
  goldCost, // string for BigNum compatibility
  description,
  mapPosition: { x, y }
}
```

Use existing enemy IDs from `src/data/enemies.js`:
- `w1z1_rat`, `w1z1_slime`, `w1z1_goblin`
- `w1z2_wolf`, `w1z2_skeleton`, `w1z2_bandit`
- `w1z3_orc`, `w1z3_troll`, `w1z3_mage`
- `w1z4_whelp`, `w1z4_golem`, `w1z4_lich`
- `w1z5_dragon`

Exports:
- `TERRITORIES`
- `getTerritory(id)`
- `getTerritoriesForZone(zone)`
- `getAllTerritories()`

## 2. `src/events.js` (modify)

Add:
```js
TERRITORY_CLAIMED: 'territory:claimed',
TERRITORY_PROGRESS_UPDATED: 'territory:progressUpdated',
```

`TERRITORY_PROGRESS_UPDATED` is optional but useful for map refresh while open.

## 3. `src/config.js` (modify)

- `SAVE.schemaVersion`: `5 -> 6`
- Add `TERRITORY` visual config (node sizes/colors/panel layout constants).

---

## State and Persistence

## 4. `src/systems/Store.js` (modify)

Add state:
```js
killsPerEnemy: {},      // { [enemyId]: number }
territories: {},        // { [territoryId]: { conquered: true, conqueredAt: timestamp } }
```

Add mutations:
- `incrementEnemyKills(enemyId)`
- `conquerTerritory(territoryId)`

Hydration:
- Merge/deep copy both fields from saved data.

Prestige behavior:
- Keep `killsPerEnemy` and `territories` across prestige (explicitly documented in `performPrestige` comments).

## 5. `src/systems/SaveManager.js` (modify)

Add migration `6`:
```js
6: (data) => {
  data.killsPerEnemy = data.killsPerEnemy || {};
  data.territories = data.territories || {};
  data.schemaVersion = 6;
  return data;
}
```

---

## Territory Runtime Manager

## 6. `src/systems/TerritoryManager.js` (new)

Singleton pattern consistent with existing managers.

Methods:
- `init()` / `destroy()`
- `isConquered(territoryId)`
- `getKillProgress(territoryId)` -> `{ current, required, ratio }`
- `canClaim(territoryId)` -> kills met + enough gold + not already conquered
- `claim(territoryId)` -> spend gold, conquer, emit `TERRITORY_CLAIMED`
- `getBuffValue(buffKey)` / `getBuffMultiplier(buffKey)`
- `getConqueredCount()`

Subscriptions:
- `COMBAT_ENEMY_KILLED` -> increment per-enemy kills and emit progress event when relevant.

## 7. `src/main.js` (modify)

- Initialize `TerritoryManager` after core systems.
- Add `OverworldScene` to Phaser scene list.
- Dev expose `window.TerritoryManager` in DEV mode.

---

## Buff Integration (Phase 1 only)

## 8. `src/systems/CombatEngine.js` (modify)

Apply canonical territory buffs at clear single points:
- `flatStr`: in `getPlayerDamage()` before base formula.
- `critChance`: add to crit chance calc.
- `xpGain`: apply to XP award in `_onEnemyDeath()`.
- `goldGain`: apply to gold award in `_onEnemyDeath()`.
- `hpRegen`: apply in `_regenPlayerHp()`.
- `flatVit`: apply through effective max HP calculation path (Store helper or Combat-side max HP calc).

Auto attack speed:
- Subscribe to `TERRITORY_CLAIMED` and re-register `combat:autoAttack` with `UpgradeManager.getAutoAttackInterval()`.

## 9. `src/systems/LootEngine.js` (modify)

- `fragmentDropRate`: multiply fragment chance inside `_rollFragmentDrop()`.

## 10. `src/systems/UpgradeManager.js` (modify)

- Include territory `autoAttackSpeed` contribution in `getAutoAttackInterval()`.

Note:
- Do not apply `allIncome` in Phase 1 to avoid multi-system double counting.
- Defer `prestigeMultiplier` territory effect to Phase 2 and decide its exact hook in `PrestigeManager`.

---

## Overworld UI

## 11. `src/scenes/OverworldScene.js` (new)

Render map in game area (`LAYOUT.gameArea`), with info panel and claim button.

Node states:
1. Locked
2. Unlocked (progress shown)
3. Claimable
4. Conquered

Map layout:
- Keep static coordinates in `territories.js` for now.
- Zone 1 bottom -> Zone 5 top.

Important:
- `OverworldScene` must not call `TimeEngine.update()`.

## 12. `src/scenes/UIScene.js` (modify)

- Add `M` key toggle and MAP button.
- Toggle `OverworldScene` visibility/activity.
- Hide/show `ZoneNav` while map is open.
- Close modal panels before opening map to avoid input overlap.

## 13. `src/ui/ZoneNav.js` (modify)

Add:
- `show()`
- `hide()`

These should toggle visibility and interactivity for arrows/label.

---

## Optional Polish (Phase 2)

## 14. `src/ui/SystemLog.js` (modify)
- Log territory claim events.

## 15. `src/systems/DialogueManager.js` and `src/data/dialogue.js` (modify)
- First claim one-shot
- Occasional claim commentary with cooldown

---

## Implementation Order

1. Data + events + config (`territories.js`, `events.js`, `config.js`)
2. Store + Save migration
3. `TerritoryManager` + `main.js` init
4. Minimal buff hooks (Combat/Loot/Upgrade)
5. `OverworldScene` rendering + claim interactions
6. `UIScene` toggle + `ZoneNav` show/hide
7. Phase 2 polish (log/dialogue + deferred buff types)

---

## Verification Checklist

1. Press `M` opens/closes map overlay without stopping combat flow.
2. Territory progress increments for the matching enemy ID.
3. Claim blocked if kills or gold are insufficient.
4. Claim deducts gold, marks territory conquered, emits event, and persists after reload.
5. Territories and kill progress persist through prestige.
6. No duplicate buff application (gold/xp especially).
7. Auto attack interval updates after claiming attack speed territory.
8. No TimeEngine double-tick behavior while map is open.
