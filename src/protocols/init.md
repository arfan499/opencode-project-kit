---
description: "Initialise persistent model-switch-safe project memory (/init)"
agent: build
subtask: false
---
Initialise durable project memory in the CURRENT directory so ANY model can resume cold.
Two files, two jobs: a small auto-loaded briefing and a complete detailed history as backup.

STEP 1 — GUARD
- If `.opencode/PROGRESS.md` already exists: do NOT overwrite. Report that it exists and
  offer `/progress` instead. Stop (still create PROGRESS-FULL.md if only that one is missing).

STEP 2 — CREATE `.opencode/PROGRESS.md` (the BRIGHT BRIEFING — auto-loaded, hard cap 80 lines)
- Infer content from the repo (README, package.json / pyproject.toml / Cargo.toml / go.mod,
  `git log -5 --oneline`, existing config). Keep the whole file UNDER 80 LINES.
- Use exactly this skeleton:

# PROJECT STATE
updated: <ISO date> | model: <current model id>
full: .opencode/PROGRESS-FULL.md — detailed history (not auto-loaded; read it when a detail here is missing)
## Goal
<one or two lines: what this project is for>
## Stack & entry points
- language/framework: <...>
- run: <command or "unknown">
- test: <command or "unknown">
- lint: <command or "unknown">
## Current state
- done: <bullets, or "nothing yet">
- in flight: <bullets, or "none">
- blocked: <bullets, or "none">
## Next (ordered)
1. <next concrete action>
2. <...>
3. <...>
## Decisions (append-only: date — decision — why)
## Gotchas / constraints
## Session log (newest first, max 10 lines, one line each)

STEP 3 — CREATE `.opencode/PROGRESS-FULL.md` (the DETAILED LOG — never auto-loaded, no cap)
- Same inferred facts, but complete. Use exactly this skeleton:

# PROJECT FULL HISTORY (detailed — NOT auto-loaded)
updated: <ISO date> | model: <current model id>
loaded: .opencode/PROGRESS.md is the auto-loaded briefing; this file is the backup. Read it when
the briefing lacks a detail, after a compaction lost context, or when briefing and git disagree.

## Decisions (append-only, full rationale)
### <ISO date> — <decision>
- why: <reasoning>
- rejected: <alternatives and why they lost>
- touched: <paths>

## Task log (append-only, newest first)
### <ISO date> | <model> | <task one-line>
- files: <paths created/changed>
- commands run + result: <command → pass/fail/output summary>
- leftovers: <what is still unfinished, or "none">

## Gotchas / constraints (full detail)
## Archived session log (lines moved out of PROGRESS.md, newest first)
## Handoffs (full narrative, newest first)

STEP 4 — WIRE AUTO-LOAD
- If `opencode.jsonc` or `.opencode/opencode.jsonc` exists: add the string
  `.opencode/PROGRESS.md` to its `instructions` array when absent. Preserve every other
  setting byte-for-byte otherwise. NEVER add PROGRESS-FULL.md to `instructions` — it is the
  backup and must cost zero tokens until something reads it.
- If no project config exists, create `.opencode/opencode.jsonc` containing only:
  { "$schema": "https://opencode.ai/config.json", "instructions": [".opencode/PROGRESS.md"] }
- In the project `AGENTS.md` (create if missing) ensure these sections exist:
  ## Session memory — AUTOMATIC (never wait to be asked)
  - SESSION START: `.opencode/PROGRESS.md` is auto-loaded; open with one line confirming the
    goal + next action before doing any work. If the file is missing, create it.
  - TWO FILES: PROGRESS.md is the <= 80 line briefing; PROGRESS-FULL.md is the uncapped history
    and is NOT auto-loaded. Write to both, read the second only when needed.
  - AFTER EACH COMPLETED TASK: update Current state + Next and bump the `updated:` line (with
    the current model id) in PROGRESS.md — and append a detailed entry to the TOP of
    PROGRESS-FULL.md `## Task log` (files, commands + results, leftovers). Do not ask permission.
  - CONTEXT MISSING OR SUSPICIOUS (summary feels thin, a decision has no rationale, work is
    unaccounted for, briefing and git disagree): read `.opencode/PROGRESS-FULL.md` FIRST, then
    act. Never guess and never ask the user to re-explain what is already written there.
  - WHEN WORK IS INTERRUPTED or the user signals a handoff/model switch: run /handoff.
  - IF THE FILES AND GIT DISAGREE: trust git, fix both files, and say what you corrected.
  - COMMIT `.opencode/` with the project so memory survives clones.
  ## Working rules — AUTOMATIC (same force as above)
  - VERIFY BEFORE "DONE": run the exact `test` / `lint` commands recorded above — never a
    guessed alternative. If they fail or cannot run, say so; never claim done untested.
  - REUSE BEFORE ADDING: search the repo for an existing helper/type before writing a new one.
  - SMALL COMMITS: one commit per completed task; message says what changed and why.
  - LOCAL ONLY: never edit `~/.config/opencode/` from inside a project; use /project-add and
    /project-remove.
  - NO SECRETS in tracked files — env vars only.
  ## Capabilities - AUTOMATIC
  - NEVER WORK BLIND OR DEGRADED: if a task would clearly go better with a capability that is
    not enabled here, say so in ONE line, name it, enable it with /project-add <name>, and
    continue. Announcing and enabling beats silently substituting a worse approach.
  - MCP SERVERS ARE DORMANT, NOT LOADED. Every server is defined globally with
    `"enabled": false` (zero tokens). An enabled one costs tokens in every request. Need one?
    `/project-mcp on <name>`, do the work, then `/project-mcp off <name>` before you report
    the task done.
  - `opencode-mem`, `opencode-swarm` and `@tarquinen/opencode-dcp` are always on and are not
    removed without explicit insistence from the user.

STEP 5 — REPORT
- List created vs. modified paths, confirm config hot-reloads (no restart), and show the
  three commands now available: /progress, /handoff, /resume.
- Explain the split: `PROGRESS.md` costs tokens every session (capped), `PROGRESS-FULL.md` costs
  nothing until read and is the recovery source when context is lost.
- Recommend `/project-upgrade` once to generate `.opencode/AVAILABLE.md`, the inventory of what
  this computer has, so the agent never works blind.

$ARGUMENTS
