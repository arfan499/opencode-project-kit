---
description: "Disable one plugin / MCP server / skill in THIS project (/project-remove <name>)"
agent: build
subtask: false
---
Disable exactly ONE capability in the CURRENT project. Never touch the global config — a
project cannot lift a global deny, so removal is always done project-locally.

0. ALWAYS-ON GUARD: `opencode-mem`, `opencode-swarm` and `@tarquinen/opencode-dcp` are the
   persistent baseline of every project. If `$ARGUMENTS` names any of them, refuse by default and
   explain what is lost (`opencode-mem` = cross-session memory, `opencode-swarm` =
   agents/orchestration, `@tarquinen/opencode-dcp` = context compression, so long sessions start
   losing detail). Only proceed if the user has explicitly insisted in this conversation, and say
   so in the report.

1. Locate the project config: `.opencode/opencode.jsonc`, else `.opencode/opencode.json`,
   else `opencode.jsonc`, else `opencode.json`. If none exists, say the project is not
   configured and offer `/project_new`; stop.
2. Resolve `$ARGUMENTS` to its category and resource string:
   - plugins: absolute path exactly as written (forward slashes) for directory plugins, or the
     unversioned npm name (`opencode-mem`, `@tarquinen/opencode-dcp`, `opencode-swarm`,
     `opencode-parser`)
   - MCP servers: the server name (`rea`, `kitesurf`, ...)
   - skills: the skill ID (directory name under the global `skills/`)
   If the name is ambiguous (matches more than one category), list the matches with their
   categories and ask which one before changing anything.
3. Edit only that file:
   - Remove the matching `allow` statement (`{ "action": "<cat>.use", "resource": "<name>" }`).
   - Make sure the category still has its `deny *` statement, and that every remaining
     `allow` comes AFTER it (within a file, last match wins). Do not reorder other categories.
   - Never delete the whole `policies` array; never add a global deny.
   - Preserve unrelated settings byte-for-byte.
   - If the removed MCP server is DEFINED in this project's own `mcp` block (a project-local
     server such as `kitesurf`, not a global one), delete that definition too — otherwise it
     keeps loading and keeps costing tokens with no `allow` behind it. Also remove its companion
     instructions path from `instructions` (kitesurf ->
     `C:\Users\Arfan Mahmood\.config\opencode\kitesurf.md`). Drop the whole `mcp` / `instructions`
     key if it becomes empty.
4. If the project `AGENTS.md` lists the capability under "Enabled capabilities", move it to the
   "Disabled by default (run `/project-add <name>` to enable)" list.
5. Keep `.opencode/AVAILABLE.md` in sync: flip that capability's line to `[off]` (it stays listed —
   it is still installed on this machine and can be re-enabled with `/project-add`).
6. Report: what was disabled, the resulting enabled list per category, and that config
   hot-reloads (no restart). Add one warning line if the removed item was `opencode-parser`
   (loses parsing) or `security-guidance` (loses security reminders).

$ARGUMENTS
