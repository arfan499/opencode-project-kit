---
description: "Scaffold a lean project-local OpenCode config: interview, then write .opencode/opencode.jsonc + AGENTS.md"
agent: build
subtask: false
---
You are scaffolding **project-local** OpenCode config for a NEW project. Nothing global is
modified.

Core principles:
- **Token-lean baseline**: everything optional is OFF unless the user picks it.
- **Never blind**: the project is told exactly what this computer has (`.opencode/AVAILABLE.md`)
  and may take what it needs, on demand, without silently working around a missing tool.
- **Persistent essentials**: `opencode-mem` (memory), `opencode-swarm` (agents/orchestration) and
  `@tarquinen/opencode-dcp` (context compression / compaction — keeps long sessions under the
  token limit) are ALWAYS ON in every project. They are never part of the interview and are not
  removed.

STEP 0 — GUARD
- ROOT = current working directory.
- If ROOT already has `opencode.jsonc` or `.opencode/opencode.jsonc`, STOP: report that the
  project is already configured and offer `/project-add` instead. Do NOT overwrite.

STEP 1 — DISCOVER (read-only; reused by STEP 4)
- Read `~/.config/opencode/opencode.json` and `~/.config/opencode/opencode.jsonc`.
- Collect the union of plugin entries. Policy resource names:
  - absolute-path plugins -> use the path exactly as written (normalize `\` to `/`)
  - npm plugins -> the **unversioned** name (strip `@latest`/`@x.y.z`), e.g.
    `opencode-mem`, `@tarquinen/opencode-dcp`, `opencode-swarm`, `opencode-parser`
- Collect MCP server names (e.g. `rea`) from `mcp` in either file.
- Add the PROJECT-LOCAL MCP registry too (servers deliberately not global — currently
  `kitesurf`, definition in `project-add.md` step 3b): still offered in the interview, but
  written into the project config as a definition, not just an allow.
- Collect skill IDs = directory names under `~/.config/opencode/skills/`. Note: skills bundled
  by plugins are controlled by their plugin, not listed here.
- Presets are defined inline in the PERSISTENT PRESETS table at the bottom of this file; they
  drive CALL B. ALWAYS-ON items are defined in the ALWAYS-ON table and are not offered.

STEP 2 — INTERVIEW (use the `question` tool; selections, not open-ended text)
Never ask "which skills do you want?" as free text. SHOW every discovered item as a selectable
option. Use at most FOUR `question` tool calls, and echo the merged picks back as a checklist
before writing any file.

CALL A — "Project basics" (one question):
  header: "Project"
  question: "Name, one-line description, and language/stack for this project?"

CALL B — "Preset" (one question, `multiple: true`):
  header: "Preset"
  question: "Start from a preset? (fine-tune next; presets are persistent)"
  options = one per entry in the PERSISTENT PRESETS table at the bottom of this file
  (label = preset name, description = its description). Default: none.

CALL C — "Enable capabilities" (THREE questions in one call, each `multiple: true`).
  Options = the discovered inventory, with everything implied by the chosen preset(s)
  PRE-SELECTED (union, de-duplicated). ALWAYS-ON items are NOT shown as options — mention them
  in the question text as "(opencode-mem, opencode-swarm and the context-compression plugin
  @tarquinen/opencode-dcp stay on in every project)".
  1. header "MCP servers"
     options = the project-local MCP registry entries (currently `rea` and `kitesurf`,
     definitions in `commands/project-mcp.md`), each with a one-line description and its
     approximate tool count. NO MCP server is global any more: each one injects its whole
     tool schema into every request, so it is borrowed per task, not enabled for the
     project's lifetime. Say this in the question text.
  2. header "Skills"
     options = every skill ID under `~/.config/opencode/skills/`. If a family exceeds ~8
     entries, add one grouped option "<family>-* (all)" (e.g. "gstack-* (all)") plus the
     notable standalone ones (e.g. karpathy-guidelines, reverse-engineer-anything).
  3. header "Plugins" (always-on ones excluded)
     options = every remaining discovered plugin. In each option description state what it
     adds and what it costs: opencode-parser = ..., oh-my-embedded-v2 /
     opencode-embedded-plugin = embedded tooling, security-guidance = security reminders.

CALL D — "Model + instructions" (two questions in one call):
  1. header "Model" — options: "Keep global default" plus the provider/model pairs found in
     the global config.
  2. header "Instructions" — free text: "Any always-on agent instructions?"
     (e.g. "use bun", "Windows", coding style)

STEP 3 — WRITE `.opencode/opencode.jsonc`
Use the `write` tool. Shape (omit a category's `deny *` when the user chose "all"):

{
  "$schema": "https://opencode.ai/config.json",
  "policies": [
    { "action": "plugin.use", "resource": "*", "effect": "deny" },
    { "action": "plugin.use", "resource": "opencode-mem", "effect": "allow" },
    { "action": "plugin.use", "resource": "opencode-swarm", "effect": "allow" },
    { "action": "plugin.use", "resource": "@tarquinen/opencode-dcp", "effect": "allow" },
    /* one allow per kept plugin, resource = exact name from STEP 1 */
    { "action": "mcp.use", "resource": "*", "effect": "deny" },
    /* one allow per chosen MCP server */
    { "action": "skill.use", "resource": "*", "effect": "deny" }
    /* one allow per chosen skill id */
  ],
  "instructions": [".opencode/PROGRESS.md"],
  "mcp": {
    /* ONLY servers that are not declared globally (e.g. kitesurf) */
  },
  "model": "<chosen, else omit>"
}

Hard rules:
- The ALWAYS-ON allows (`opencode-mem`, `opencode-swarm`, `@tarquinen/opencode-dcp`) are written
  FIRST, before any optional plugin allow, and are never conditioned on the interview.
- A chosen MCP server that is NOT in the global `mcp` block must be DEFINED here (`type`,
  `command`, `timeout`, `enabled`) using the registry in `project-add.md` step 3b, because a
  policy `allow` cannot conjure a server that no config declares. If it has a companion
  instructions file (kitesurf -> `C:\Users\Arfan Mahmood\.config\opencode\kitesurf.md`), add
  that path to `instructions` so only projects that use it pay for it.
- Omit the whole `mcp` key when no project-local server was chosen.
- Final optional set = union of the chosen preset entries + the interview selections
  (de-duplicated) before writing any `allow`.
- Each `deny *` MUST precede its `allow` lines (within a file, last match wins).
- If a grouped option such as `gstack-* (all)` was chosen, EXPAND it into one explicit
  `allow` statement per matching skill ID — do not rely on wildcards for `skill.use`.
- NEVER add plugin/mcp/skill denies to the GLOBAL config — a project cannot lift a global deny.
- Valid JSON only (no comments); prefer clean JSON for safety.

STEP 4 — WRITE `.opencode/AVAILABLE.md` (capability inventory)
This is how the project knows what this computer actually has. It is NOT auto-loaded, so it
costs nothing until read, but the AGENTS.md summary points at it — the agent must never work
blind and never silently take a worse path because something was not enabled.

Generate from STEP 1, one line per capability, `[on]` or `[off]`, short purpose after the dash:

# AVAILABLE CAPABILITIES (global inventory, <ISO date>)
Everything below is installed on this machine. `[on]` = enabled in this project.
To enable one: `/project-add <name>`. To disable: `/project-remove <name>`.
Always on, never removed: `opencode-mem`, `opencode-swarm`, `@tarquinen/opencode-dcp`.

## MCP servers
- [on]  kitesurf - browser automation (~35 tools, project-local: this project's `mcp`)
- [off] rea - reverse engineering (~255 tools, heavy; enable per task with `/project-mcp on rea`)

MCP servers are billed per request while on. Turn them off when the task is done.

## Plugins
- [on]  opencode-mem — cross-session memory (ALWAYS ON)
- [on]  opencode-swarm — agents / orchestration (ALWAYS ON)
- [on]  @tarquinen/opencode-dcp — context compression / compaction (ALWAYS ON)
- [off] C:/.../oh-my-embedded-v2 — embedded tooling

## Skills
- [on]  gstack-review — pre-landing diff review
- [off] gstack-ios-* (5): ios-qa, ios-fix, ios-design-review, ios-sync, ios-clean
- [off] karpathy-guidelines — ...

Keep families compressed as `name-* (n): a, b, c` so the file stays readable. This file is
regenerated by `/project-upgrade` and kept in sync by `/project-add` and `/project-remove`.

STEP 5 — WRITE THE TWO MEMORY FILES (durable project memory)
Two files, two jobs — the briefing must stay small, the history must lose nothing.
- `.opencode/PROGRESS.md` — skeleton per `~/.config/opencode/commands/init.md` STEP 2, filled
  from the repo (README, manifests, `git log -5`). HARD CAP 80 lines. Its header carries the
  pointer line `full: .opencode/PROGRESS-FULL.md — detailed history (not auto-loaded; read it
  when a detail here is missing)`. The `instructions` entry from STEP 3 auto-loads this file in
  every future session, on any model.
- `.opencode/PROGRESS-FULL.md` — skeleton per `init.md` STEP 3 (uncapped): full-rationale
  Decisions, detailed Task log, full Gotchas, Archived session log, Handoffs. NOT added to
  `instructions` — it costs zero tokens until a session actually needs it.
Never put the same depth in both: the briefing answers "where are we", the history answers
"why and how", and it is the recovery source after context loss or compaction.

STEP 6 — WRITE PROJECT `AGENTS.md`
Short file: project name/description/stack; "Always on" (`opencode-mem`, `opencode-swarm`,
`@tarquinen/opencode-dcp`);
"Enabled capabilities" (the optional allows); "Disabled by default (run `/project-add <name>`
to enable)"; the user's always-on instructions; plus:

## Capability inventory — READ THIS BEFORE ASSUMING SOMETHING IS MISSING
- `.opencode/AVAILABLE.md` lists EVERY plugin, MCP server and skill installed on this computer,
  each marked `[on]` or `[off]` for this project.
- Never conclude "not available" without checking that file first.

## Capabilities - AUTOMATIC
- NEVER WORK BLIND OR DEGRADED: if a task would clearly go better with a capability that is
  `[off]`, say so in ONE line, name it from `.opencode/AVAILABLE.md`, enable it with
  `/project-add <name>`, and continue. Announcing and enabling beats silently substituting.
- MCP SERVERS ARE BORROWED, NOT INSTALLED. No MCP server is global: an enabled one injects
  every tool schema it exposes into EVERY request, so it costs tokens whether used or not.
  When a task needs one: say so in one line, `/project-mcp on <name>`, do the work, then
  `/project-mcp off <name>` in the same turn you report the task done. Never leave one on
  "just in case" and never enable one for a task that does not need it.
- Enable only what you are about to use. When something stops being useful, offer
  `/project-remove <name>`.
- `opencode-mem`, `opencode-swarm` and `@tarquinen/opencode-dcp` are always on and are not
  removed without explicit insistence from the user.

## Session memory — AUTOMATIC (never wait to be asked)
- SESSION START: `.opencode/PROGRESS.md` is auto-loaded; open with one line confirming the
  goal + next action before doing any work. If the file is missing, create it.
- TWO FILES: PROGRESS.md is the <= 80 line briefing; PROGRESS-FULL.md is the uncapped history
  and is NOT auto-loaded. Write to both, read the second only when needed.
- AFTER EACH COMPLETED TASK: update Current state + Next and bump the `updated:` line (with the
  current model id) in PROGRESS.md — and append a detailed entry to the TOP of PROGRESS-FULL.md
  `## Task log` (files, commands + results, leftovers). Do not ask permission.
- CONTEXT MISSING OR SUSPICIOUS (thin summary, a decision with no rationale, unaccounted work,
  briefing and git disagree): read `.opencode/PROGRESS-FULL.md` FIRST, then act. Never guess and
  never ask the user to re-explain what is already written there.
- WHEN WORK IS INTERRUPTED or the user signals a handoff/model switch: run `/handoff`.
- IF THE FILES AND GIT DISAGREE: trust git, fix both files, and say what you corrected.
- COMMIT `.opencode/` with the project so memory survives clones.
- Manual fallbacks: `/progress` (status / record), `/resume` (cold start), `/handoff`.

## Working rules — AUTOMATIC (same force as above)
- VERIFY BEFORE "DONE": run the exact `test` / `lint` commands recorded in PROGRESS.md §Stack —
  never a guessed alternative. If they fail or cannot run, say so; never claim done untested.
- REUSE BEFORE ADDING: search the repo for an existing helper/type before writing a new one.
- SMALL COMMITS: one commit per completed task; message says what changed and why.
- LOCAL ONLY: never edit `~/.config/opencode/` from inside a project. Capability changes go
  through `/project-add` / `/project-remove`.
- NO SECRETS in tracked files — env vars only.
- Something looks off (checks failing, unknown tools, config suspect)? Run `/project-check`,
  then `/project-doctor`.

STEP 7 — REPORT
Print the on/off summary (and the three always-on items), state that config hot-reloads (no
restart needed), that `.opencode/AVAILABLE.md` holds the full inventory and the agent may enable
what it needs with one line of notice, explain the two memory files (`.opencode/PROGRESS.md` =
auto-loaded briefing, capped at 80 lines, costs tokens every session; `.opencode/PROGRESS-FULL.md`
= detailed history, zero cost until read, used to recover missing context), that deleting
`.opencode/` resets the project, advise
committing `.opencode/` to git so memory travels with the repo, and list the commands:
`/progress`, `/handoff`, `/resume` (memory), `/project-check` (typecheck+lint+test),
`/project-doctor` (audit config + token cost), `/project-upgrade` (pick up newly installed
global capabilities), `/project-add`, `/project-remove`.

ALWAYS-ON (not a preset; written into every project; edit here to change the baseline)
- plugins: opencode-mem (cross-session memory), opencode-swarm (agents / orchestration),
  @tarquinen/opencode-dcp (context compression — compacts long sessions automatically)

PERSISTENT PRESETS (edit this table to change presets; keys are offered in CALL B)
- web       | Web / frontend / full-stack (browser + QA + design + ship)
            | mcp: kitesurf
            | skills: gstack-browse, gstack-qa, gstack-qa-only, gstack-review, gstack-verify,
                      gstack-ship, gstack-design-review, gstack-design-html, gstack-benchmark,
                      gstack-health, karpathy-guidelines
            | plugins: (none)
- python    | Python services / scripts / data
            | mcp: (none)
            | skills: karpathy-guidelines
            | plugins: (none)
- embedded  | Embedded firmware / PCB / hardware
            | mcp: (none)
            | skills: (none — comes from the plugins below)
            | plugins: C:/Users/Arfan Mahmood/.config/opencode-plugins/oh-my-embedded-v2,
                       C:/Users/Arfan Mahmood/.config/opencode-plugins/opencode-embedded-plugin
- ios       | iOS / SwiftUI apps (device QA, fix, design review)
            | mcp: (none)
            | skills: gstack-ios-qa, gstack-ios-fix, gstack-ios-design-review, gstack-ios-sync,
                      gstack-ios-clean
            | plugins: (none)
- docs      | Documentation / writing / release notes / PDF
            | mcp: (none)
            | skills: gstack-document-generate, gstack-document-release, gstack-make-pdf,
                      gstack-write-skill, karpathy-guidelines
            | plugins: (none)

$ARGUMENTS
