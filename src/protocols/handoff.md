---
description: "Write a model-switch handoff into PROGRESS.md + PROGRESS-FULL.md before changing models"
agent: build
subtask: false
---
Prepare this project so a DIFFERENT model can continue from cold with zero guesswork.
Do NOT change any source code.

1. Read `.opencode/PROGRESS.md` (if missing, create both memory files per the `/init` skeleton
   first), then run `git status --short`, `git log -5 --oneline`, and `git diff --stat`.
2. Rewrite `## Current state` and `## Next` in the BRIEFING (`PROGRESS.md`) so a stranger can act
   on them: exact file paths, exact commands, exact remaining steps. No vague phrasing like
   "finish the refactor". Keep the briefing UNDER 80 lines.
3. Insert at the TOP of the briefing's `## Session log`:
   `<ISO date> | <current model> | HANDOFF: <one line>`
   and make `## Current state` answer three things concretely:
   - what already works,
   - what is half-done (file path + precisely what remains),
   - the single first action for the next model.
4. Append the FULL narrative to `.opencode/PROGRESS-FULL.md` under `## Handoffs` (newest first):
   what was attempted, what failed and why, the exact state of every half-finished file, the
   commands that work, and anything the next model would otherwise have to rediscover. This file
   is not capped — be complete, not brief.
5. Overflow from the briefing (old `## Session log` lines) moves into PROGRESS-FULL.md
   `## Archived session log`; never into a separate history directory.
6. Report "Handoff written" plus the exact three next actions, and state the two file paths that
   now hold the state.

$ARGUMENTS
