# CHANGELOG

## Unreleased
- Phase 1: BigNum utility module (`D()`, `format()`, Decimal re-export)
- Phase 1: Centralized Store with named mutation methods (addGold, addXp, etc.)
- Phase 1: SaveManager with localStorage persistence, backup rotation, migration framework
- Phase 1: TimeEngine stub for boot sequence
- Boot sequence wired: Store.init() → SaveManager.init() → TimeEngine.init() → Phaser

---

## 2026-02-06
- Phase 0 complete: Vite + Phaser 3 + break_infinity.js scaffolded
- EventBus with 33 canonical events (`src/events.js`)
- Balance/config constants for all game systems (`src/config.js`)
- BootScene renders green pulsing rectangle as proof of life
- Dev server, production build, and Phaser chunking all working

---

## 2026-01-24
- Initialized governance-only memory system (CLAUDE.md + .memory files).
