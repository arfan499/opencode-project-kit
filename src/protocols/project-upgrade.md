---
description: "Re-sync this project with the global inventory: offer newly installed capabilities, flag dead ones (/project-upgrade)"
agent: build
subtask: false
---
Your global inventory grows (new plugins, skills, MCP servers get installed). This command
reconciles ONE project with it. Read-only until the user picks.

1. Re-run DISCOVER from `~/.config/opencode/commands/new-project.md` STEP 1: union of global
   plugins (policy resource = exact path with forward slashes for directory plugins, unversioned
   npm name for npm plugins), MCP server names, skill IDs from `~/.config/opencode/skills/`.
1b. MCP HYGIENE — enforce the dormancy rule while you are here: every MCP entry in the GLOBAL
   config must be `"enabled": false` (dormant catalogue, zero tokens). If any is enabled
   globally, say so plainly and offer `/project-mcp off <name> --global`. Never enable an MCP
   as part of an upgrade: MCPs are activated per task with `/project-mcp on <name>`, never
   added to a project's long-lived allows.
2. Read this project's `policies`. Compute two sets:
   - ALWAYS-ON = `opencode-mem`, `opencode-swarm`, `@tarquinen/opencode-dcp`: never offered as
     NEW, never proposed for removal. Report them as one fixed line, and if any lacks its `allow`
     here, offer to restore it — they are the persistent baseline.
   - NEW  = available globally, NOT enabled here, and NOT already present as an allow
   - DEAD = enabled here but no longer exists globally (plugin deleted, skill removed, server
            renamed) — see the RESOURCE EXISTENCE rules in
            `~/.config/opencode/commands/project-doctor.md` STEP 4.
            EXCEPTION: an MCP server DEFINED in this project's own `mcp` block (project-local
            servers such as `kitesurf`) is alive by definition — never report it as DEAD just
            because it is absent from the global config. Report it as a separate line
            "project-local MCP: <name>".
3. If NEW is non-empty: ONE `question` call, `multiple: true`, grouped by category, each option
   carrying a one-line cost note (what it adds / what it costs in context). Pre-select NOTHING.
   Apply the picked ones exactly as `/project-add` does: allow AFTER the category's `deny *`,
   exact resource strings, project file only.
4. If DEAD is non-empty: list them plainly and offer removal per `/project-remove`. Do not remove
   silently — a temporarily missing plugin path on another machine is not a decision to drop it.
5. Also report, without changing anything, any category whose `deny *` is missing or ordered after
   its allows (same check as `/project-doctor` STEP 3).
6. Regenerate `.opencode/AVAILABLE.md` from the new inventory (format = `new-project.md` STEP 4),
   with `[on]`/`[off]` taken from the resulting policies, and update the AGENTS.md
   enabled/disabled lists if they changed.
7. Close with the resulting enabled list per category. If nothing changed: `already in sync`
   plus the counts. Config hot-reloads; no restart.

$ARGUMENTS
