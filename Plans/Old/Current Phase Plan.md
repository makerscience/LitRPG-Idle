# Plan v2: Pseudo-3D Scanline Parallax (Upper-Right VP Bias)

## Goal

Upgrade Zone 1 image parallax from flat side-scroll to a pseudo-3D scanline effect that reads as forward diagonal travel, while preserving combat readability and performance stability.

This phase targets **image-based layers only**. Rectangle fallback behavior for other zones remains unchanged in this phase.

## Scope

### In scope
- Zone 1 (`theme.images`) parallax rewrite to strip/scanline model
- Per-strip speed variation (top slower, bottom faster)
- Upper-right vanishing-point bias via per-strip horizontal phase offset
- Resource lifecycle safety (frame add/remove + zone switch cleanup)
- Delta-based movement for FPS-independent behavior

### Out of scope
- New rectangle fallback particle/VP system for Zones 2+
- Ground perspective warping
- Camera transforms or shader pipeline changes

## Files to Modify

1. `src/config.js`
2. `src/scenes/GameScene.js`

## Config Changes (`src/config.js`)

Add:

```js
export const PARALLAX = {
  strips: 10,              // horizontal strips per image layer
  perspectivePow: 1.8,     // >1 makes horizon strips thinner
  diagonalOffsetPx: 80,    // top-strip horizontal lead toward upper-right VP
  baseSpeedPxPerSec: 9,    // equivalent to 0.15 px/frame at 60fps
};
```

Update `GameScene` import:

```js
import { UI, LAYOUT, ZONE_THEMES, COMBAT, PARALLAX } from '../config.js';
```

## Implementation Design (`src/scenes/GameScene.js`)

### 1. Zone 1 image layers: strip containers

For each image layer (`rear/mid/front`):
- Build one container.
- Slice source texture into `N` horizontal frames.
- Create 2 images per strip (`imgA`, `imgB`) for seamless wrap.
- Keep existing depth ordering.

### 2. Strip sizing and rounding (required to avoid seams)

Use weighted strip heights via exponent curve, then quantize to integers:

1. Compute raw weights:
- `w[i] = ((i+1)/N)^pow - (i/N)^pow`

2. Convert to integer texture rows:
- `texH[i] = floor(sourceH * w[i] / sumW)`
- Distribute remaining rows to last strip (`texH[N-1] += remainder`)
- `texY` is cumulative integer sum

3. Convert to integer display heights:
- `dispH[i] = floor(layerH * w[i] / sumW)`
- Distribute remaining pixels to last strip
- `dispY` is cumulative integer sum from `ga.y`

This ensures full coverage without 1px gaps from float accumulation.

### 3. Per-strip state

For each strip `j`:
- `speedMult = (j + 1) / N`
- `scrollPosPx = diagonalOffsetPx * (N - 1 - j) / (N - 1)` (top has largest lead)

Store in layer data:
- `isStripLayer`
- `strips: [{ imgA, imgB, scrollPosPx, speedMult }]`
- `imgW` (game area width)
- `textureKey`
- `frameNames[]`

### 4. Frame lifecycle safety

Before adding each generated frame:
- If frame exists, remove it first.

On parallax destroy/zone switch:
- Remove all generated frame names from each layer texture.
- Destroy containers and clear `_parallaxLayers`.
- Keep ground cleanup as existing behavior.

### 5. Update loop (delta-based)

Replace frame-based scroll with delta-based motion:

- `dt = delta / 1000`
- `layerBaseSpeed = PARALLAX.baseSpeedPxPerSec * (layerIdx + 1)`  
  (rear/mid/front = 9/18/27 px/s)
- For each strip:
  - `scrollPosPx += layerBaseSpeed * speedMult * dt`
  - `phase = scrollPosPx % imgW`
  - `imgA.x = ga.x - phase`
  - `imgB.x = imgA.x + imgW`

Ground scroll should also use delta-based speed equivalent to current front rate.

## Data Model

`this._parallaxLayers`:
- image zones: strip containers with generated frame metadata
- non-image zones: unchanged rectangle containers

`this._groundContainer`:
- unchanged structure, only speed update becomes delta-based

## Performance Expectations

Do not hard-code draw-call guarantees in plan text.  
Acceptance is based on observed performance:
- No visible hitching/jank compared with current build
- 60fps target maintained on development machine in a 30s capture

## Verification Checklist

1. Zone 1: top strips move slower than bottom strips.
2. Visual bias reads as diagonal forward travel toward lower-left with upper-right convergence.
3. No visible seams/flicker between strips during motion.
4. Ground remains flat and stable for combat silhouettes.
5. Switch zones repeatedly (1 -> 2 -> 1, multiple cycles): no broken frames or orphan visuals.
6. No console errors on frame add/remove during zone changes.
7. Behavior remains consistent at variable FPS (throttled and normal).
8. 30s performance recording shows no meaningful regression.

## Risks and Mitigations

- Risk: strip seams from float math  
  Mitigation: integer quantization + remainder assignment.

- Risk: generated frame collisions on rebuild  
  Mitigation: remove-if-exists before add; deterministic frame name tracking.

- Risk: scope expansion delays delivery  
  Mitigation: defer rectangle fallback redesign to next phase.
