---
description: "Audit this project's .opencode setup: config validity, policy order, dead allows, token cost (/project-doctor)"
agent: build
subtask: false
---
READ-ONLY audit. Change nothing unless the user asks after seeing the report.

1. LOCATE the project config, first match wins: `.opencode/opencode.jsonc`,
   `.opencode/opencode.json`, `opencode.jsonc`, `opencode.json`.
   None found -> "not configured here; run `/project_new`" and stop.
2. PARSE it. If invalid JSON/JSONC, report the failing line and stop — nothing else is meaningful.
3. POLICY ORDER: within each `*.use` category, the `deny *` statement must come BEFORE its
   `allow` lines (last match wins). A category with `allow` lines but no preceding `deny *` is
   WIDE OPEN — flag it loudly. An `allow` shadowed by a later `deny` is silently dead — flag it.
4. RESOURCE EXISTENCE — check every `allow` against the real global inventory:
   - `plugin.use` absolute path -> that directory / package must exist on disk
   - `plugin.use` npm name -> must appear, unversioned, in the global plugin list
     (`@latest` / `@x.y.z` stripped)
   - `mcp.use` -> name must exist under `mcp` in the global config
   - `skill.use` -> directory must exist under `~/.config/opencode/skills/`
   Anything unmatched is a DEAD ALLOW: the capability is denied with no error anywhere. Report as
   "typo suspect" with the closest real name if there is one.
5. WIRING: `.opencode/PROGRESS.md` must be listed in `instructions` AND exist on disk. Report the
   `updated:` age in days (a stale file means memory is lying to every new session).
   `.opencode/PROGRESS-FULL.md` must exist, must NOT be in `instructions` (it is the zero-token
   backup), and the briefing's header must point at it. Missing backup = no recovery path after
   context loss: flag it and offer `/progress` (which creates it) — never write it yourself here.
   Also flag a briefing over 80 lines (the cap is what keeps the auto-load cheap).
6. `AGENTS.md` must contain the "Session memory — AUTOMATIC" block; if missing, call it a stale
   project and note that an older scaffold wrote the passive version.
7. ALWAYS-ON + INVENTORY: `opencode-mem`, `opencode-swarm` and `@tarquinen/opencode-dcp` must
   each have an `allow` here (the persistent baseline) — flag a missing one as a regression.
   `.opencode/AVAILABLE.md`
   must exist and mention every capability that has an `allow`; a stale inventory date or a
   capability missing from it means the project is working blind — flag it.
8. TOKEN COST — count what loads on EVERY request here: instruction files (+approx lines), skills
   enabled, plugins enabled, MCP servers enabled (each server injects its full tool schema).
   Flag any enabled capability that this repo shows no sign of ever using as a removal candidate.
9. Output a compact table, then ONE `Next:` line naming the single most important defect. Never
   auto-fix; never touch the global config.

$ARGUMENTS
