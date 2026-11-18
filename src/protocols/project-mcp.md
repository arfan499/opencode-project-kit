---
description: "Activate or deactivate an MCP server on demand — keep it out of the token bill until a task needs it"
agent: build
subtask: false
---

# /project-mcp — MCP servers on demand

## WHY THIS COMMAND EXISTS

Every **enabled** MCP server injects the full schema of every tool it exposes into
**every request**. That cost is paid whether or not you use it:

| server | tools | cost while enabled |
|---|---|---|
| `rea` | ~255 | very heavy — easily 10k+ tokens per request |

So the servers are **installed and dormant**: every definition exists in the global
config with `"enabled": false`, which means it is known, listed, and costs **zero tokens**
until something switches it on. This command is the switch.

Rule of thumb: activate for the task, deactivate the moment it is done. Never leave one
enabled "just in case".

## PARSING

`$ARGUMENTS` is one of:

- *(empty)* or `list` → show the table.
- `on <name>` → activate `<name>` for THIS project.
- `off <name>` → deactivate it again.
- `on <name> --global` / `off <name> --global` → flip the global `enabled` flag (warns that
  every project pays while it is on).

## STEP 0 — LOCATE THE PROJECT CONFIG

Find `.opencode/opencode.jsonc` (or `.opencode/opencode.json`, `opencode.jsonc`,
`opencode.json`) in the project root. If none exists, this is not a configured project →
tell the user to run `/project_new` (or `/init`) first, and stop.
`--global` skips this step.

## STEP 1 — LIST

For each registry entry print: name · tools · `[on]` if active for this project ·
`[dormant]` if defined globally with `enabled: false` · `[off]` if not defined at all ·
one-line purpose.

Then one line: `Activate with /project-mcp on <name>; deactivate with /project-mcp off <name> when the task is done.`

## STEP 2 — ON <name> (project scope, the normal case)

1. Resolve `<name>` in the registry (below). Unknown name → list what exists and stop.
2. If already active in this project → say so, nothing to do.
3. Write the definition into the **project** config's `mcp` object with `"enabled": true`
   (create the `mcp` key if absent). Copy the registry command array verbatim:

```jsonc
"mcp": {
  "<name>": { "type": "local", "command": [ ... ], "timeout": 60000, "enabled": true }
}
```

4. Add `{ "action": "mcp.use", "resource": "<name>", "effect": "allow" }` **after** the
   `mcp.use deny *` statement (order matters — deny first, allow after).
5. If the registry entry has a companion `instructions` path, add it to the
   project's `instructions` array while active and say it costs tokens too.
6. Announce one line: `Activated <name> here (~<cost> per request). Say "done" and I turn it off.`
   Config hot-reloads on save; a freshly started MCP may need `/reload` or a new session
   before its tools appear — say so if the tools are not listed yet.

## STEP 3 — OFF <name>

1. Delete the `<name>` entry from the project's `mcp` object; drop the `mcp` key if empty.
2. Delete the matching `mcp.use` allow. Keep `mcp.use deny *`.
3. Remove any companion `instructions` path.
4. Announce: `Deactivated <name> — dormant again, zero token cost.`
5. Never delete the dormant global definition in STEP 2/3 — deactivation means
   `enabled: false`, not deletion.

## STEP 4 — --GLOBAL (rare)

- On: set the global `mcp.<name>.enabled` to `true` in
  `~/.config/opencode/opencode.jsonc`. Warn: "this is active in EVERY project until you turn
  it off — often a mistake; prefer project scope."
- Off: set it back to `false` (never delete the entry — the dormant definition is the
  catalogue).
- Only use `--global` when the user explicitly says "everywhere" / "in all projects".

## STEP 5 — NEVER DELETE A DEFINITION YOU DID NOT WRITE

If a project's `mcp` block contains a server that is not in the registry, leave it alone:
`unknown MCP "<x>" — not in registry, left untouched`.

---

## REGISTRY

These are the same definitions that sit dormant in the global config. Copy them verbatim
when activating per project; keep the global copies in sync if a command changes.

### `rea` — reverse engineering (binaries, managed code, browser pages). ~255 tools. VERY HEAVY.

```jsonc
"rea": {
  "type": "local",
  "command": [
    "C:\\Program Files\\nodejs\\node.exe",
    "C:\\Users\\Arfan Mahmood\\AppData\\Roaming\\npm\\node_modules\\rea-agents\\scripts\\rea.mjs",
    "mcp"
  ],
  "timeout": 60000,
  "enabled": true
}
```

### Adding a new server — MANDATORY for every future MCP

Any time an MCP server is installed or added to this machine, do all four, in this order:

1. Add its definition to the **global** config `mcp` block with `"enabled": false`.
2. Append it to this registry (command array verbatim, approximate tool count, companion
   instructions file if it needs one).
3. List it in every project's `.opencode/AVAILABLE.md` as `[dormant]` with its tool count.
4. Never make it part of a project's permanent allows — it is activated per task with
   `/project-mcp on <name>` and deactivated with `off`.

An MCP that is enabled globally is a defect: it bills every project on every request.
`/project-doctor` reports it, `/project-upgrade` offers to switch it off.

---

## DONE MEANS OFF

When the task that needed the server is finished, run `/project-mcp off <name>` in the same
turn you report the task done. Leaving it active is the exact token leak this command exists
to prevent.

$ARGUMENTS
