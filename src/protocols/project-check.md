---
description: "Run this project's own verification chain serially: typecheck -> lint -> test (/project-check)"
agent: build
subtask: false
---
Run this project's checks in a fixed order and report a short pass/fail table. Never invent a
command that the project does not define.

1. Read `.opencode/PROGRESS.md` § "Stack & entry points". Take `test` / `lint` VERBATIM.
   If missing or "unknown", detect from manifests (`package.json` scripts, `pyproject.toml` /
   `uv.lock`, `Cargo.toml`, `go.mod`, `Makefile`) and state which command you inferred and why.
2. Determine a typecheck command for the stack (`tsc --noEmit`, `mypy .`, `go build ./...`,
   `cargo check`). If the stack has none, mark SKIP — do not substitute something else.
3. Execute SERIALLY, one at a time, never in watch mode, with a bounded timeout. Do not launch
   the next step while one is running, and do not run the same suite twice.
   Order: typecheck -> lint -> test.
4. A failure in typecheck or lint does not cancel the run: tests are an independent signal. A
   missing command is SKIP with a reason, never a fake PASS.
5. On failure capture the FIRST `file:line` and the last ~15 lines of output only. Do not dump
   full logs. Fix nothing unless `$ARGUMENTS` explicitly asks for a fix or the user says so after
   seeing the report — this command reports, it does not silently refactor.
6. Output, max ~15 lines:

   CHECK | COMMAND | RESULT
   then one line per failure: `file:line — <short cause>`
   then exactly one closing line: `Next: <single highest-value fix>` or
   `All green — safe to commit.`

$ARGUMENTS
