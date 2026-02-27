# Start Screen ("Exile's Ascension") Plan

## Goal

Add a real main menu scene between `BootScene` and `GameScene` so players can:
- Start a new run
- Continue an existing run
- Adjust volume
- See title/presentation before gameplay

## Critique Of Previous Draft

1. New Game flow used `SaveManager.deleteSave()`, but that method sets `window.__saveWiped = true`, which blocks future saves. That is a debug wipe path, not safe for in-game New Game.
2. Plan relied on `Store.init()` inside scene flow. In runtime startup, `Store.init()` is already part of app boot; reset during play should use state reset APIs, not re-bootstrap.
3. Save existence check was hardcoded via localStorage key string from UI code. This duplicates private key knowledge and increases drift risk.
4. Parallax scope copied too much from `GameScene` (tree systems and full update logic), creating high coupling for menu-only visuals.
5. Settings reuse assumed direct reuse of `SettingsPanel` internals, but that panel is modal and includes wipe/reload behavior designed for `UIScene`, not menu scene.
6. Load behavior was partially redundant. `SaveManager.init(Store)` already runs before scenes start, so Continue should just enter gameplay if save exists.

## Revised Design Decisions

- Keep title: `EXILE'S ASCENSION`.
- Keep buttons: `NEW GAME`, `LOAD GAME`, `SETTINGS`, `QUIT`.
- Keep overwrite confirmation for `NEW GAME` when save exists.
- Keep `QUIT` as cosmetic text (browser-safe).
- Use a lightweight background parallax for the menu (3 layers max, no tree-row system copy).

## Revised Implementation Plan

### Step 1: Add save-safe menu helpers in `SaveManager`

Update `src/systems/SaveManager.js` with public helpers so menu code does not touch raw keys:
- `hasSave()`:
  - Return `true` when either primary or backup save key contains parseable JSON.
  - Return `false` for missing/corrupt-only cases.
- `clearSaveForNewGame()`:
  - Remove primary and backup keys only.
  - Do not set `window.__saveWiped`.
  - Use this for gameplay New Game overwrite flow.

Do not change `deleteSave()` debug semantics; keep it for dev wipe tooling.

### Step 2: Create `StartScene`

Create `src/scenes/StartScene.js`.

`create()`:
1. Build lightweight looping parallax background:
   - `bg002_rear` (slow)
   - `bg002_mid` (medium)
   - `foreground002` (faster)
   - Use paired sprites per layer for wraparound.
2. Add dark readability overlay.
3. Add title text near upper third.
4. Add vertical button stack:
   - `NEW GAME`
   - `LOAD GAME` (disabled style + non-interactive if `!SaveManager.hasSave()`)
   - `SETTINGS`
   - `QUIT`
5. Add menu-local UI states:
   - New Game confirmation row (`Confirm / Cancel`) when save exists.
   - Settings inline sub-panel with music volume slider only.
   - Quit flavor text that auto-fades after ~2 seconds.

`update(time, delta)`:
- Advance parallax X positions and wrap sprites when fully offscreen.

### Step 3: Define button behavior precisely

`NEW GAME`:
- If no save: `Store.resetState()`, request save, then `scene.start('GameScene')`.
- If save exists: show confirm UI.
- Confirm path: `SaveManager.clearSaveForNewGame()`, `Store.resetState()`, request save, then start `GameScene`.
- Cancel path: return to normal menu.

`LOAD GAME`:
- Only enabled when `SaveManager.hasSave()`.
- Start `GameScene` directly (save already loaded during app bootstrap).

`SETTINGS`:
- Toggle inline settings panel.
- Include only `musicVolume` slider bound to `Store.updateSetting('musicVolume', value)`.
- No save wipe/reload controls in start screen.

`QUIT`:
- Show temporary cheeky message; no actual process/window close attempt.

### Step 4: Wire scene flow

Update `src/scenes/BootScene.js`:
- Change delayed transition target from `GameScene` to `StartScene`.

Update `src/main.js`:
- Import `StartScene`.
- Register scenes in order:
  - `BootScene`
  - `StartScene`
  - `GameScene`
  - `UIScene`
  - Optional feature scenes unchanged afterward.

### Step 5: Validation checklist

1. Boot goes to Start screen after preload pulse.
2. `LOAD GAME` is disabled when no save and enabled when save exists.
3. New Game without save enters gameplay and autosave still works.
4. New Game with save shows confirm and correctly overwrites without disabling future saves.
5. Continue enters gameplay with preloaded save state.
6. Settings slider updates `musicVolume`.
7. Quit message displays and fades.
8. Build compiles cleanly.

## Files To Change

| File | Change |
|---|---|
| `src/scenes/StartScene.js` | New main menu scene |
| `src/systems/SaveManager.js` | Add `hasSave()` and `clearSaveForNewGame()` |
| `src/scenes/BootScene.js` | Start `StartScene` instead of `GameScene` |
| `src/main.js` | Import and register `StartScene` |

