Minimal Claude Organization Setup (Governance-Only)

## **Goal**

Set up a lightweight system to help Claude maintain context across sessions, without needing an MCP server or Python dependencies.

Target overhead: \~2 min session start, \~3–5 min session end

## **What We’ll Create**

In **the current working directory / project root** (i.e., wherever Claude Code is currently operating):

./  
├── CLAUDE.md              \# Governance rules (tells Claude how to behave)  
├── CHANGELOG.md           \# Human-readable record of significant changes  
└── .memory/  
    ├── CURRENT\_FOCUS.md   \# Session state (the "baton" between sessions)  
    └── DECISIONS.md       \# Only expensive-to-re-litigate decisions

---

## **File 1: `CLAUDE.md`**

Location: `./CLAUDE.md` (project root)

\# Claude Governance (Governance-Only Memory)

\#\# Purpose  
This workspace uses lightweight "memory files" so work continues smoothly across Claude Code sessions.

Memory files live in:  
\- .memory/CURRENT\_FOCUS.md  
\- .memory/DECISIONS.md

Project changelog lives in:  
\- CHANGELOG.md

\#\# Core Rules  
1\. Always read CURRENT\_FOCUS first at the start of a session.  
2\. If the user asks "why are we doing it this way?" check DECISIONS before debating.  
3\. Keep memory updates short and skimmable. Prefer bullets. Avoid essays.  
4\. Only record decisions that would be annoying/expensive to rediscover.  
5\. If you make a significant change to code, project structure, or user-facing behavior, update \`CHANGELOG.md\`.

\#\# Session Start Protocol (\~2 minutes)  
1\. Read \`.memory/CURRENT\_FOCUS.md\`  
2\. Read \`.memory/DECISIONS.md\` (recent entries)  
3\. \*\*Sanity check:\*\* If One-liner or Active Objectives don't match reality, update CURRENT\_FOCUS first (keep it short), then proceed.  
4\. Produce a short "Session Plan" in chat:  
   \- 1 sentence: what we're doing today  
   \- 3 bullets: next actions  
   \- 1 bullet: biggest risk/unknown

\#\# During Session  
\- When uncertain, check CURRENT\_FOCUS and DECISIONS before asking the user  
\- Capture "open loops" immediately (questions, blockers, TODOs, pending choices)  
\- Don't wait until session end to note important context  
\- \*\*Stop condition:\*\* If requirements are ambiguous, stop and write one clarifying question OR list assumptions explicitly before proceeding.

\#\# What Counts as a Decision Worth Logging?  
\*\*Log it if:\*\*  
\- It changes architecture, file structure, or workflow  
\- It creates a constraint ("we will not do X")  
\- It resolves a recurring debate  
\- It records a failure mode ("we tried X; it broke because Y")

\*\*Threshold:\*\* If it wouldn't save at least \~10 minutes of re-thinking later, don't log it.

\*\*Don't log:\*\*  
\- Normal implementation details  
\- Temporary choices that will obviously change tomorrow

\#\# What Counts as a "Significant" Changelog Entry?  
\*\*Significant includes:\*\*  
\- New feature or capability  
\- User-facing behavior change  
\- Refactor that changes interfaces/APIs  
\- Dependency or build/config changes  
\- Schema/data format changes  
\- New commands, scripts, or workflows  
\- Non-trivial bug fixes

\*\*Not significant:\*\*  
\- Formatting-only changes  
\- Comments/docstring-only changes  
\- Renames with no behavior change  
\- Tiny tweaks that don't affect usage  
\- WIP experiments not merged/kept

\#\# Session End Protocol (\~3-5 minutes)  
1\. Update \`.memory/CURRENT\_FOCUS.md\`:  
   \- What changed today (max 8 bullets)  
   \- Next steps (max 6 bullets)  
   \- Open loops / blockers  
2\. Append entries to \`.memory/DECISIONS.md\` if applicable  
3\. Update \`CHANGELOG.md\` if significant changes occurred (max 5 bullets, plain language)  
4\. Verify CURRENT\_FOCUS still reflects reality (no stale tasks)  
5\. \*\*Definition of Done:\*\* Ensure "Next Actions" are actionable within 1 session and each starts with a verb (e.g., "Implement…", "Test…", "Refactor…")

---

## **File 2: `.memory/CURRENT_FOCUS.md`**

Location: `./.memory/CURRENT_FOCUS.md`

\# CURRENT\_FOCUS

\#\# One-liner  
\- Maintain governance-only memory for Claude Code sessions; keep CURRENT\_FOCUS \+ DECISIONS accurate and skimmable.

\#\# Active Objectives (max 3\)  
1\. Set up governance-only memory system  
2\. (add more as needed)

\#\# Next Actions  
\- \[ \] Test that Claude reads these files at session start  
\- \[ \] Try the session end protocol  
\- \[ \] (add more as needed)

\#\# Open Loops / Blockers  
\- None yet

\#\# How to Resume in 30 Seconds  
\- \*\*Open:\*\* \`.memory/CURRENT\_FOCUS.md\`  
\- \*\*Next:\*\* Execute the first unchecked item in "Next Actions"  
\- \*\*If unclear:\*\* Run "Follow the Session Start Protocol"

\#\# Key Context  
\- Memory files: \`.memory/CURRENT\_FOCUS.md\`, \`.memory/DECISIONS.md\`  
\- Decision log: \`.memory/DECISIONS.md\`  
\- Changelog: \`CHANGELOG.md\`  
\- How to start session: "Follow the Session Start Protocol"  
\- How to end session: "Do the Session End Protocol"

\---

\#\# Last Session Summary (max \~8 bullets)  
\- Initial setup of governance-only memory system

\#\# Pinned References  
\- Governance rules: \`CLAUDE.md\`  
\- Original guide: \`CLAUDE\_ORGANIZATION\_MVP.md\`

Hard rule: If "Key Context" becomes a wall of text, move it into real docs and link here.

---

## **File 3: `.memory/DECISIONS.md`**

Location: `./.memory/DECISIONS.md`

\# DECISIONS

Format:  
\- Date:  
\- Tags: (workflow, architecture, tooling, convention, failure-mode)  
\- Decision:  
\- Rationale:  
\- Alternatives considered:  
\- Consequences / Follow-ups:

\---

\#\# 2026-01-24  
\- Tags: architecture, workflow  
\- Decision: Governance-only memory (no MCP server) using CLAUDE.md \+ .memory files.  
\- Rationale: Minimum complexity while maintaining continuity across sessions.  
\- Alternatives considered: Full MCP project-memory server with ChromaDB.  
\- Consequences / Follow-ups: If memory friction grows, revisit adding MCP later.

Tip: Search with \`rg "Tags:.\*workflow" .memory/DECISIONS.md\`

---

## **File 4: `CHANGELOG.md`**

Location: `./CHANGELOG.md`

\# CHANGELOG

\#\# Unreleased  
\- (most recent significant changes go here)

\---

\#\# 2026-01-24  
\- Initialized governance-only memory system (CLAUDE.md \+ .memory files).

---

## **Daily Usage**

### **Session Start**

Say to Claude:

“Follow the Session Start Protocol in CLAUDE.md.”

Claude responds with a Session Plan based on CURRENT\_FOCUS.

### **Session End**

Say to Claude:

“Do the Session End Protocol. Keep it short.”

Claude updates CURRENT\_FOCUS \+ DECISIONS, and updates CHANGELOG if significant changes occurred.

---

## **Anti-Bloat Rules**

* One-liner at top of CURRENT\_FOCUS for instant orientation  
* Max 3 active objectives  
* Max 6 next actions  
* Max 8 bullets in last session summary  
* Only log expensive-to-rediscover decisions  
* Sanity check at session start prevents stale plans  
* Changelog entries only for “significant” changes (max 5 bullets)

Optional: Weekly Prune (5 min)

* Delete stale Next Actions  
* Compress Key Context  
* Archive old summaries  
* Move old items from “Unreleased” into a dated section if appropriate

---

## **Verification**

1. Start a new Claude Code session in the **current directory / project root**  
2. Say “Follow the Session Start Protocol”  
3. Claude should produce a Session Plan referencing CURRENT\_FOCUS  
4. Make a small but meaningful change (e.g., add a file, change a script, etc.)  
5. At session end, say “Do the Session End Protocol”  
6. Confirm `CURRENT_FOCUS.md` updated, and `CHANGELOG.md` updated *if* the change was significant  
7. Start another session and verify continuity

