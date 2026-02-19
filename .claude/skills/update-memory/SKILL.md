---
name: update-memory
description: Update all memory files (CURRENT_FOCUS, DECISIONS, CHANGELOG) to reflect current session state
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep
---

# Update Memory Files

Update all project memory files to reflect the current session's work.

## Steps

1. **Read current state** — read all of these in parallel:
   - `.memory/CURRENT_FOCUS.md`
   - `.memory/DECISIONS.md`
   - `CHANGELOG.md` (first 50 lines)

2. **Assess what changed this session** — review the conversation history to identify:
   - What was implemented, fixed, or refactored
   - Any architectural decisions made
   - Any new open loops or blockers discovered
   - Any stale items that should be removed

3. **Update `.memory/CURRENT_FOCUS.md`**:
   - Update One-liner to reflect current state
   - Update Active Objectives (mark completed, add new if needed)
   - Update Next Actions (remove done items, add new ones — each starts with a verb)
   - Update Open Loops / Blockers (add new, remove resolved)
   - Update "How to Resume in 30 Seconds" with key changes
   - Replace Last Session Summary with this session's bullets (max 8)
   - Keep Key Context and Pinned References stable unless something changed

4. **Append to `.memory/DECISIONS.md`** (only if applicable):
   - Only log decisions that meet the threshold in CLAUDE.md (would save ≥10 min of re-thinking)
   - Use the existing format: Date, Tags, Decision, Rationale, Alternatives considered, Consequences
   - If no new decisions worth logging, skip this file entirely

5. **Update `CHANGELOG.md`** (only if significant changes occurred):
   - Prepend a new dated section at the top of the file
   - Max 5 bullets, plain language
   - Only log significant changes per the CLAUDE.md criteria (new features, behavior changes, refactors, bug fixes)
   - If no significant changes, skip this file entirely

## Rules

- Keep all updates short and skimmable. Prefer bullets. Avoid essays.
- Do NOT invent or assume work that wasn't done — only document what actually happened.
- Do NOT remove Open Loops unless they were explicitly resolved this session.
- Verify CURRENT_FOCUS Next Actions are actionable within 1 session and each starts with a verb.
- If uncertain whether something counts as a decision or changelog entry, err on the side of skipping it.
