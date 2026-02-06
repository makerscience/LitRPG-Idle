# Claude Governance (Governance-Only Memory)

## Purpose
This workspace uses lightweight "memory files" so work continues smoothly across Claude Code sessions.

Memory files live in:
- .memory/CURRENT_FOCUS.md
- .memory/DECISIONS.md

Project changelog lives in:
- CHANGELOG.md

## Core Rules
1. Always read CURRENT_FOCUS first at the start of a session.
2. If the user asks "why are we doing it this way?" check DECISIONS before debating.
3. Keep memory updates short and skimmable. Prefer bullets. Avoid essays.
4. Only record decisions that would be annoying/expensive to rediscover.
5. If you make a significant change to code, project structure, or user-facing behavior, update `CHANGELOG.md`.

## Session Start Protocol (~2 minutes)
1. Read `.memory/CURRENT_FOCUS.md`
2. Read `.memory/DECISIONS.md` (recent entries)
3. **Sanity check:** If One-liner or Active Objectives don't match reality, update CURRENT_FOCUS first (keep it short), then proceed.
4. Produce a short "Session Plan" in chat:
   - 1 sentence: what we're doing today
   - 3 bullets: next actions
   - 1 bullet: biggest risk/unknown

## During Session
- When uncertain, check CURRENT_FOCUS and DECISIONS before asking the user
- Capture "open loops" immediately (questions, blockers, TODOs, pending choices)
- Don't wait until session end to note important context
- **Stop condition:** If requirements are ambiguous, stop and write one clarifying question OR list assumptions explicitly before proceeding.

## What Counts as a Decision Worth Logging?
**Log it if:**
- It changes architecture, file structure, or workflow
- It creates a constraint ("we will not do X")
- It resolves a recurring debate
- It records a failure mode ("we tried X; it broke because Y")

**Threshold:** If it wouldn't save at least ~10 minutes of re-thinking later, don't log it.

**Don't log:**
- Normal implementation details
- Temporary choices that will obviously change tomorrow

## What Counts as a "Significant" Changelog Entry?
**Significant includes:**
- New feature or capability
- User-facing behavior change
- Refactor that changes interfaces/APIs
- Dependency or build/config changes
- Schema/data format changes
- New commands, scripts, or workflows
- Non-trivial bug fixes

**Not significant:**
- Formatting-only changes
- Comments/docstring-only changes
- Renames with no behavior change
- Tiny tweaks that don't affect usage
- WIP experiments not merged/kept

## Session End Protocol (~3-5 minutes)
1. Update `.memory/CURRENT_FOCUS.md`:
   - What changed today (max 8 bullets)
   - Next steps (max 6 bullets)
   - Open loops / blockers
2. Append entries to `.memory/DECISIONS.md` if applicable
3. Update `CHANGELOG.md` if significant changes occurred (max 5 bullets, plain language)
4. Verify CURRENT_FOCUS still reflects reality (no stale tasks)
5. **Definition of Done:** Ensure "Next Actions" are actionable within 1 session and each starts with a verb (e.g., "Implement...", "Test...", "Refactor...")
