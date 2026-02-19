---
name: session-start
description: Read all memory files and produce a session plan with next actions and risks
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob
---

# Session Start

Read the project memory files and produce a concise session plan for the user.

## Steps

1. Read all of these files in parallel:
   - `.memory/CURRENT_FOCUS.md`
   - `.memory/DECISIONS.md` (skim recent entries — last 2-3 dated sections)
   - `CHANGELOG.md` (first 30 lines — most recent entry)

2. Sanity-check CURRENT_FOCUS:
   - Does the One-liner match the Last Session Summary?
   - Are Next Actions still actionable (not already done)?
   - If anything is stale, note it but do NOT update files (that's what `/update-memory` is for).

3. Output a **Session Plan** in chat:
   ```
   **Session Plan**

   **Resuming:** <one-liner from CURRENT_FOCUS>

   **Next actions:**
   - <action 1>
   - <action 2>
   - <action 3>

   **Biggest risk/unknown:** <one bullet>

   **Stale items noticed:** <if any, else "None">
   ```

## Rules

- Do NOT modify any files. This skill is read-only.
- Keep output short — the session plan should fit in one screen.
- If CURRENT_FOCUS doesn't exist, say so and suggest running `/update-memory`.
