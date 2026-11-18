---
description: "Enable an MCP server, skill, or plugin in this project's local config (adds it back after the lean default)"
agent: build
subtask: false
---
Enable ONE capability in the CURRENT project's `.opencode/opencode.jsonc` (or root
`opencode.jsonc`) without touching global config.

This command may be run by the user OR by the agent itself mid-task: when a task needs a
capability the project has `[off]`, announce it in one line ("Enabling <name> because <reason>"),
run this, and continue. Never silently work around a missing capability.

1. Read the project config. If neither file exists, tell the user to run `/new-project` first.
2. If `$ARGUMENTS` is empty, read `.opencode/AVAILABLE.md` when it exists; otherwise discover what
   is globally available (plugins from `~/.config/opencode/opencode.json(c)`, MCP server names,
   skill IDs under `~/.config/opencode/skills/`) and ask which single item to enable.
3. Enable it: ensure an `allow` statement for that exact resource exists AFTER the
   category's `deny *` line, and remove any explicit `deny` for that exact resource.
   - plugin resource: absolute path as written (forward slashes) or unversioned npm name
   - mcp resource: server name
   - skill resource: skill id
3b. MCP SERVERS ARE DEFINED, NOT JUST ALLOWED. A policy `allow` only un-blocks a server that
   some config already declares. If the requested server is not in global `mcp`, write its
   definition into the PROJECT config's `mcp` block as well:

   ```jsonc
   "mcp": {
     "<name>": { "type": "local", "command": [ ... ], "timeout": 60000, "enabled": true }
   }
   ```

   Known definitions (deliberately NOT global — keep them project-local):
   - `kitesurf` — browser automation:
     `["C:\\Program Files\\nodejs\\node.exe",
       "C:\\Users\\Arfan Mahmood\\AppData\\Roaming\\npm\\node_modules\\chrome-devtools-mcp\\out\\Default\\gen\\src\\bin\\chrome-devtools-mcp.js",
       "--wsEndpoint=wss://kitesurf.dev/devtools/browser",
       "--category-experimental-webmcp",
       "--no-page-id-routing",
       "--workspace=/",
       "--no-usage-statistics"]`, timeout 60000.
     Also add `"C:\\Users\\Arfan Mahmood\\.config\\opencode\\kitesurf.md"` to the project's
     `instructions` array (that file is the usage guide; it is not global any more).

   If a server name is unknown and has no definition anywhere, say so and ask for its command.
4. Keep `.opencode/AVAILABLE.md` in sync: flip that capability's line to `[on]`. If the file is
   missing, create it from `new-project.md` STEP 4.
5. Save the file. Confirm the change is live (hot reload), state exactly what was enabled, and
   give the one-line undo: `/project-remove <name>`.

Never modify the global config. Enable one item per invocation unless the user names several.

$ARGUMENTS
