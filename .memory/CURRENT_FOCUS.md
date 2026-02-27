# CURRENT_FOCUS

## One-liner
- Stance skill progression system fully implemented (all 3 phases complete). Ready for playtesting and next feature work.

## Active Objectives (max 3)
1. **Playtest stance system:** Validate full unlock flow (zones 6, 11-12, 13-15), tier effects, teaching moments
2. **Balance tuning:** SP economy, charge attack damage/timing, unlock pacing
3. **Next feature planning:** Identify next priority from GDD

## Next Actions
- [ ] Playtest full unlock flow: Armor Break at zone 6 (armored enemy), Cleanse at zone 11+ (DOT/thorns), Interrupt at zone 13+ (charge attack)
- [ ] Validate skill upgrade balance (SP economy, tier power spikes)
- [ ] Validate charge attack feel (2.5s wind-up, 4x damage, interrupt window)
- [ ] Validate teaching quips fire correctly (stance switch, thorns, evasion, regen)
- [ ] Identify next feature priority from `Plans/Redesign Plan.md`

## Open Loops / Blockers
- `npm run build` passes with a pre-existing large bundle warning (Phaser chunk >500kB)
- Prestige, territory, and cheats remain behind feature gates
- Upgrade IDs still use `flurry_*` prefix despite stance rename to `tempest` (intentional — keeps save compat)

## How to Resume in 30 Seconds
- **Open:** `.memory/CURRENT_FOCUS.md`
- **Last change:** All 3 phases of stance skill progression implemented by Codex
- **Key planning files:**
  - `docs/plans/2026-02-27-stance-skills-tutorial-design.md` (full design doc)
  - `Plans/phase1-skill-upgrades-plan.md` (DONE)
  - `Plans/phase2-milestone-unlocks-teaching-plan.md` (DONE)
  - `Plans/phase3-charge-attack-mechanic-plan.md` (DONE)
- **Key implementation files:**
  - `src/data/upgrades.js` (18 skill tier entries, group/stance/requires/requiresFlag fields)
  - `src/systems/UpgradeManager.js` (hasUpgrade, isVisible, requires/requiresFlag checks)
  - `src/systems/CombatEngine.js` (tier effects, charge attack, interrupt extension)
  - `src/systems/SkillUnlockDirector.js` (milestone detection, unlock sequences)
  - `src/systems/DialogueManager.js` (saySequence, teaching quips)
  - `src/ui/UpgradePanel.js` (tabbed Stats/Skills layout, stance sections)
  - `src/config.js` (stances: tempest/ruin/fortress)
  - `src/data/dialogue.js` (unlock sequences, teaching quips)
- **Verification commands:** `npm run build`, `npm run validate:data`

## Key Context
- Tech stack: Phaser 3, Vite 7, break_infinity.js, localStorage saves
- Platform: Desktop-first, 1280x720, targeting Itch.io
- Architecture: `ARCHITECTURE.md`
- GDD plan: `Plans/Redesign Plan.md`
- Enemy roster plan: `Plans/Enemy_Roster_Redesign_Plan.md`
- Skill/enhancement plan: `Plans/Skill_Points_and_Enhancement_Plan.md`
- Stance/skill design: `docs/plans/2026-02-27-stance-skills-tutorial-design.md`
- Memory files: `.memory/CURRENT_FOCUS.md`, `.memory/DECISIONS.md`, `.memory/LESSONS_LEARNED.md`
- Changelog: `CHANGELOG.md`
- Feature gates: `src/config/features.js`
- Save namespace: `litrpg_idle_vslice_save` (schema v3 — stance migration + upgrade refund)

---

## Last Session Summary (max ~8 bullets)
- All 3 phases of stance skill progression now implemented by Codex
- Phase 1: 18 skill tier upgrades, tabbed UpgradePanel, stance renames (ruin/tempest), save schema v3
- Phase 2: SkillUnlockDirector, secondary button gating, SYSTEM unlock sequences, teaching quips
- Phase 3: chargeAttack enemy trait, charge bar UI, interrupt extension, COMBAT_ENEMY_CASTING castKind
- Codex revised Phase 2 plan: separated unlock logic into SkillUnlockDirector (not DialogueManager)
- Codex revised Phase 3 plan: reused COMBAT_ENEMY_CASTING with `castKind` field (no new event)
- Dev helpers: `__unlockSkill(name)`, `__grantSP(amount)`, `__lockSkill(name)`, `__resetUnlockFlags()` in main.js

## Pinned References
- Governance rules: `CLAUDE.md`
- Architecture: `ARCHITECTURE.md`
- Redesign plan: `Plans/Redesign Plan.md`
- Enemy roster plan: `Plans/Enemy_Roster_Redesign_Plan.md`
- Lessons learned: `.memory/LESSONS_LEARNED.md`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.
