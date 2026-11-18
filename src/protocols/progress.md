---
description: "Show or update project memory: PROGRESS.md (briefing) + PROGRESS-FULL.md (history)"
agent: build
subtask: false
---
Project memory is TWO files:
- `.opencode/PROGRESS.md` — the briefing. Auto-loaded every session, hard cap 80 lines.
- `.opencode/PROGRESS-FULL.md` — the detailed history. Never auto-loaded, no cap.

If `.opencode/PROGRESS.md` does not exist: tell the user to run `/init` first. If it exists but
`.opencode/PROGRESS-FULL.md` does not, create the second file using the skeleton in
`~/.config/opencode/commands/init.md` STEP 3 and backfill it from the briefing.

NO ARGUMENTS — status only (read-only):
- Read `.opencode/PROGRESS.md`, run `git status --short` and `git log -5 --oneline`.
- Print a compact briefing, max 12 lines: Goal | Done (count) | In flight | Blocked |
  Next 3 | last session-log line.
- Add ONE line if PROGRESS.md is missing information that PROGRESS-FULL.md covers, phrased as
  "more detail available in .opencode/PROGRESS-FULL.md".
- Modify nothing.

WITH ARGUMENTS — record progress in BOTH files:
- Briefing (`.opencode/PROGRESS.md`):
  - Move completed items from `## Next` into `## Current state > done`.
  - Append one line to the TOP of `## Session log`:
    `<ISO date> | <current model> | <the argument text>`
  - Update the `updated:` and `model:` header fields and refresh `## Next` ordering.
- History (`.opencode/PROGRESS-FULL.md`):
  - Append a detailed entry to the TOP of `## Task log`:
    `### <ISO date> | <model> | <the argument text>` followed by `- files:`, `- commands run +
    result:`, `- leftovers:` lines, filled from the actual session (paths touched, commands run
    and their verdicts, what remains). Accuracy beats brevity here — this is the file a future
    model reads after context is lost.
  - If the argument records a decision with a reason, also append it under `## Decisions` with
    `why:` / `rejected:` / `touched:`.
- Keep the BRIEFING under 80 lines. When it grows past that, move the oldest `## Session log`
  lines into PROGRESS-FULL.md `## Archived session log` and retain the newest 10 in the
  briefing. Never create `.opencode/history/` files any more — PROGRESS-FULL.md is the archive.
- Report a 4-line summary: what changed in the briefing, what was appended to history.

$ARGUMENTS
