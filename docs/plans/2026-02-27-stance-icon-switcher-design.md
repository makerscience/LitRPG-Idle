# Stance Icon Switcher Design

**Date:** 2026-02-27
**Status:** Approved

## Summary

Replace the single-letter stance indicator in StanceSwitcher with icon sprites (tornado/fist/castle) displayed as white silhouettes on the existing colored circle background.

## Assets

- `Images/TempestIcon.png` — tornado silhouette
- `Images/RuinIcon.png` — fist/crack silhouette
- `Images/FortressIcon.png` — castle silhouette

All are black silhouettes on transparent/white backgrounds.

## Design

- **Icon display:** White-tinted Phaser image sprite replaces the text label
- **Background:** Keep colored circle (blue=Tempest, orange=Ruin, grey=Fortress) with white stroke
- **Sizing:** Icon scaled to fit within the 26px-radius circle (~36px display size)
- **Interaction:** Click-to-cycle (tempest → ruin → fortress), same as current
- **Animation:** Keep pulse tween on stance switch

## Changes Required

1. **BootScene** — Load 3 icon textures (`tempestIcon`, `ruinIcon`, `fortressIcon`)
2. **StanceSwitcher** — Replace `this._label` text with `this._icon` image; swap texture key + keep white tint on stance change

## What Stays the Same

- Position (upper-left, 50px from game area edges)
- Circle radius, stroke, stance colors
- Cycle order, pulse tween, show/hide/destroy
