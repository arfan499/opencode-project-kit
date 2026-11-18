---
description: "Turn an MCP server ON or OFF for this project only — borrow it for a task, return it afterwards"
agent: build
subtask: false
---

# /project-mcp — MCP servers on demand

## WHY THIS COMMAND EXISTS

Every **enabled** MCP server injects the full schema of every tool it exposes into
**every request**. That is permanent token cost whether or not you use it:

| server | tools | cost |
|---|---|---|
| `rea` | ~255 | very heavy — easily 10k+ tokens per request |
| `kitesurf` | ~35 | heavy — several thousand tokens per request |

So MCP servers are **borrowed, not installed**. Nothing is on by default. When a task
needs one, enable it, do the work, disable it. This command is the switch.

Never enable an MCP "just in case". Never leave one on after the task that needed it.

## PARSING

`$ARGUMENTS` is one of:

- *(empty)* or `list` → show the table below.
- `on <name>` → enable `<name>` in THIS project.
- `off <name>` → disable `<name>` in THIS project.

Refuse `--global` / `global` with: "MCP servers are never global here — global costs
tokens in every project. Pick a project."

## STEP 0 — LOCATE THE PROJECT CONFIG

Find `.opencode/opencode.jsonc` (or `.opencode/opencode.json`, `opencode.jsonc`,
`opencode.json`) in the project root. If none exists, this is not a configured
project → tell the user to run `/project_new` (or `/init`) first, and stop.

## STEP 1 — LIST

For each registry entry print: name · tools · `[on]` if defined in this project's
`mcp` block AND allowed by a `mcp.use` allow, otherwise `[off]` · one-line purpose.

Then one line: `Enable with /project-mcp on <name> — it reloads instantly; disable with /project-mcp off <name> when done.`
Also flag any server defined but NOT allowed (dead weight — it still loads).

## STEP 2 — ON <name>

1. Resolve `<name>` in the registry (below). Unknown name → list what exists and stop.
2. If already on → say so, nothing to do.
3. Add the definition to the project config's `mcp` object (create the key if absent):

```jsonc
"mcp": {
  "<name>": {
    "type": "local",
    "command": [ /* registry command array, verbatim */ ],
    "timeout": 60000,
    "enabled": true
  }
}
```

4. Add `{ "action": "mcp.use", "resource": "<name>", "effect": "allow" }` **after** the
   `mcp.use deny *` statement (order matters — deny first, allow after).
5. If the registry entry has a companion `instructions` path, add it to the project's
   `instructions` array too (kitesurf only) and tell the user it costs tokens while on.
6. Announce in one line: `Enabled <name> for this project — ~<cost> per request; say "done" and I will turn it off.`
7. Config hot-reloads on save; no restart, no `/reload` needed.

## STEP 3 — OFF <name>

1. Delete the `<name>` entry from the project's `mcp` object. Drop the `mcp` key
   entirely if it becomes empty.
2. Delete the matching `mcp.use` allow for `<name>`. Leave `mcp.use deny *` in place.
3. If the registry entry has a companion `instructions` path, remove it from the
   project's `instructions` array too — that file is part of the cost.
4. Announce in one line: `Disabled <name> — schemas no longer sent, tokens recovered.`
5. Do not touch the global config, ever.

## STEP 4 — NEVER DELETE A DEFINITION YOU DID NOT WRITE

If the project's `mcp` block contains a server that is **not** in the registry, leave
it alone and report `unknown MCP "<x>" — not in registry, left untouched`.

---

## REGISTRY (definitions live here, not in any config)

Copy these verbatim when enabling. Absolute paths, forward or double backslashes both
work; keep whatever form is already in the file.

### `rea` — reverse engineering (REA: binaries, managed code, browser pages). ~255 tools. VERY HEAVY.

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

No companion instructions file.

### `kitesurf` — Cloudflare agent browser (CDP-driven page control). ~35 tools. HEAVY.

```jsonc
"kitesurf": {
  "type": "local",
  "command": [
    "C:\\Program Files\\nodejs\\node.exe",
    "C:\\Users\\Arfan Mahmood\\AppData\\Roaming\\npm\\node_modules\\chrome-devtools-mcp\\out\\Default\\gen\\src\\bin\\chrome-devtools-mcp.js",
    "--wsEndpoint=wss://kitesurf.dev/devtools/browser",
    "--category-experimental-webmcp",
    "--no-page-id-routing",
    "--workspace=/",
    "--no-usage-statistics"
  ],
  "timeout": 60000,
  "enabled": true
}
```

Companion instructions: `C:\Users\Arfan Mahmood\.config\opencode\kitesurf.md`
(add to the project's `instructions` while enabled, remove when disabled).

### Adding a new server to this registry

Append an entry here with its verbatim `command` array, its approximate tool count, and
whether it needs a companion instructions file. The registry is the only place a
server definition lives when it is off.

---

## DONE MEANS OFF

When the task that needed the server is finished, run `/project-mcp off <name>` in the
same turn you report the task done. Leaving it on is the exact token leak this command
exists to prevent.

$ARGUMENTS
