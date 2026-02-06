# CHANGELOG

## Unreleased

---

## 2026-02-06 (Phase 2)
- Combat loop: click enemy → damage → death → gold/XP → respawn after 500ms
- Enemy data for World 1 (5 zones, 13 enemies) in `src/data/enemies.js`
- TimeEngine tick scheduler with register/unregister/scheduleOnce
- CombatEngine module — damage calc, crit rolls (5%/2x), death/spawn cycle
- GameScene with HP bar, floating damage numbers, hit flash, death animation
- BootScene → GameScene auto-transition after 1s

## 2026-02-06 (Phase 1)
- BigNum utility module (`D()`, `format()`, Decimal re-export)
- Centralized Store with named mutation methods (addGold, addXp, etc.)
- SaveManager with localStorage persistence, backup rotation, migration framework
- TimeEngine stub for boot sequence
- Boot sequence wired: Store.init() → SaveManager.init() → TimeEngine.init() → Phaser

## 2026-02-06 (Phase 0)
- Phase 0 complete: Vite + Phaser 3 + break_infinity.js scaffolded
- EventBus with 33 canonical events (`src/events.js`)
- Balance/config constants for all game systems (`src/config.js`)
- BootScene renders green pulsing rectangle as proof of life
- Dev server, production build, and Phaser chunking all working

---

## 2026-01-24
- Initialized governance-only memory system (CLAUDE.md + .memory files).
