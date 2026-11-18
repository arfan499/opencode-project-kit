---
description: "Resume work from project memory after a model or session switch"
agent: build
subtask: false
---
1. Read `.opencode/PROGRESS.md`. If it is missing, say so once and offer `/init`; stop.
   Note whether `.opencode/PROGRESS-FULL.md` exists — it is the detailed backup.
2. Run `git status --short` and `git log -5 --oneline` to reconcile the briefing with reality.
   If they disagree (e.g. items marked in-flight are already committed), say so explicitly
   instead of assuming the file is right.
3. STALENESS CHECK. Parse the `updated:` line at the top of the briefing.
   - If it is older than 14 days AND `git log -5 --oneline` shows commits newer than that date,
     say so in one line, e.g. "PROGRESS.md is N days stale; M newer commits exist — treating it
     as a pointer, not the truth," and treat the briefing's Current state as suspect.
   - If the `model:` shown differs from the current model, note it in one line.
   - Never silently trust a stale file; never rewrite it in this step.
4. WHEN THE BRIEFING IS INSUFFICIENT, READ THE HISTORY. Open `.opencode/PROGRESS-FULL.md` and
   use its `## Task log`, `## Decisions`, `## Archived session log`, and `## Handoffs` when:
   the file or git disagreement in step 2 is unexplained, a decision has no rationale, work
   appears unaccounted for, the session was compacted, or more than one task is missing from the
   briefing. Rebuild your understanding from it — do not ask the user to re-explain what is
   already written there. Say in one line that you consulted the full history and what it added.
5. Print a briefing, max 12 lines: Goal | where we stopped | what is half-done (with paths) |
   the next action | any gotcha that will bite the next edit.
6. Then ask exactly one question: "Continue with <next action>?" — do not edit files until the
   user confirms.

$ARGUMENTS
