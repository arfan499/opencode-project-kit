# opencode-project-kit

Lean, opt-in **per-project setup for [OpenCode](https://opencode.ai) V2** — plus a project
memory that survives model switches, context compaction, and coming back a week later.

Most OpenCode installs accumulate plugins, MCP servers, and skills globally. Every one of them
costs tokens on every request. This kit does the opposite: a new project starts with almost
nothing enabled, you choose what it needs once, and the choice is written into the project's own
config so the rest of your machine does not leak in.

It also solves the other half of that problem — remembering where you were.

> **OpenCode V2 only.** Built on `Plugin.define` / `ctx.command.transform` / `ctx.session.hook`.
> V1 plugin signatures are not supported.

---

## What you get

| Command | What it does |
| --- | --- |
| `/project_new` (alias `/new-project`) | Interviews you (project info → preset → exact plugins/MCP/skills → model), then writes `.opencode/opencode.jsonc`, `.opencode/AVAILABLE.md`, `.opencode/PROGRESS.md`, `.opencode/PROGRESS-FULL.md`, and `AGENTS.md`. |
| `/project-add <name>` | Enable one plugin, MCP server, or skill in this project only. |
| `/project-remove <name>` | Disable one again in this project only. |
| `/project-mcp [on\|off\|list] <name>` | Activate an MCP server on demand, deactivate when done. Every server is defined but dormant (`enabled: false`) — zero tokens until switched on. |
| `/project-upgrade` | Pick up capabilities installed *after* the project was created (and detect dead ones). |
| `/project-check [fix]` | Run typecheck → lint → test serially using the commands recorded in `PROGRESS.md`. |
| `/project-doctor` | Read-only audit: policy order, dead allows, wiring, token cost, memory files. |
| `/init` | Add the project memory to an existing project. |
| `/progress [note]` | Briefing at a glance; with an argument, record progress in both memory files. |
| `/handoff` | Rewrite state so a different model can continue cold. |
| `/resume` | Read the memory, reconcile with git, brief you, ask before editing. |

Commands are markdown protocols. The plugin registers each bundled file as a slash command and
sends its body to the model — so a command is just a prompt you no longer have to retype.

---

## Install

Add the plugin to **one** OpenCode config — global (`~/.config/opencode/opencode.jsonc`) if you
want it everywhere, or a project config if you only want it there:

```jsonc
{
  "plugins": ["opencode-project-kit"]
}
```

From a local checkout instead of npm:

```jsonc
{
  "plugins": ["C:/path/to/opencode-project-kit"]
}
```

Config reloads on save — no restart.

### Coexistence with your global commands

If the same protocol files are also installed in `~/.config/opencode/commands/` (the original
home of this kit), you do **not** get duplicates: on startup the plugin lists the commands that
are already defined and skips those names. Either source wins cleanly — install the plugin
globally *and* keep the command files, or delete the files and let the plugin provide them.

The rule injection is deduplicated the same way: if a project's `AGENTS.md` already contains the
`Session memory` block, the plugin does not push its rules again.

---

## What a scaffolded project looks like

```
project/
├── AGENTS.md                    # rules for this project (committed)
└── .opencode/
    ├── opencode.jsonc           # deny-by-default allow-list (committed)
    ├── AVAILABLE.md             # inventory of the machine: [on]/[off]/[dormant] (committed)
    ├── PROGRESS.md              # briefing, <= 80 lines, AUTO-LOADED (committed)
    └── PROGRESS-FULL.md         # detailed history, never auto-loaded (committed)
```

### The two memory files

This is the part that makes model switching painless.

| | `PROGRESS.md` | `PROGRESS-FULL.md` |
| --- | --- | --- |
| Purpose | Where you are now | Everything that happened |
| Loaded | Automatically, every session (`instructions`) | Never — read on demand |
| Size | Hard cap 80 lines | Unbounded |
| Token cost | ~700–900 tokens per request | 0 until read |
| Written | After each task, automatically | After each task, automatically |
| Read when | Session start | A detail is missing, context was compacted, or the file and git disagree |

The briefing points at the history in its header, so a fresh model always knows the recovery path:

```
full: .opencode/PROGRESS-FULL.md — detailed history (not auto-loaded; read it when a detail here is missing)
```

Old session-log lines are moved *into* `PROGRESS-FULL.md` (under `## Archived session log`), not
deleted, once the briefing would exceed 80 lines.

### Deny by default, but never blind

`.opencode/opencode.jsonc` uses OpenCode policies:

```jsonc
{
  "policies": [
    { "action": "plugin.use", "resource": "*", "effect": "deny" },
    { "action": "mcp.use", "resource": "*", "effect": "deny" },
    { "action": "skill.use", "resource": "*", "effect": "deny" }
    // ... followed by one allow per enabled resource
  ]
}
```

That keeps token cost down, but a project that cannot see what is installed will silently do
worse work. So the scaffold also writes `.opencode/AVAILABLE.md`: every plugin, MCP server, and
skill on the machine, marked `[on]` or `[off]`, and the rules tell the model to **read it before
assuming something is missing** and to enable what it needs with `/project-add` instead of
degrading quietly.

### MCP servers are installed but dormant

Every MCP server this kit knows about is defined in the global config with `"enabled": false`.
It is listed and discoverable, and it costs **zero** tokens. That matters because an enabled
server injects the full schema of every tool it exposes into **every** request —
`rea` alone ships ~255 tools.

`/project-mcp on <name>` activates one for the current project (definition + `mcp.use` allow +
any companion `instructions` path) and `/project-mcp off <name>` deactivates it again. The
dormant global definition stays behind as the catalogue, so a disabled server is always one
command away. `/project-mcp on <name> --global` flips it everywhere instead, and warns.

**Always on** in every project (not a choice, and `/project-remove` refuses them):
`opencode-mem` (cross-session memory), `opencode-swarm` (agents/orchestration),
`@tarquinen/opencode-dcp` (context compression).

### Presets

`/project_new` offers presets that pre-select a coherent set of capabilities:

| Preset | Picks |
| --- | --- |
| `web` | MCP `kitesurf` (defined project-locally — no global server); gstack browse/qa/qa-only/review/verify/ship/design-review/design-html/benchmark/health; karpathy-guidelines |
| `python` | karpathy-guidelines |
| `embedded` | plugins `oh-my-embedded-v2`, `opencode-embedded-plugin` |
| `ios` | gstack ios-qa/ios-fix/ios-design-review/ios-sync/ios-clean |
| `docs` | gstack document-generate/document-release/make-pdf/write-skill; karpathy-guidelines |

Presets are suggestions, not contracts — the interview shows the exact list and you can change
any of it.

---

## Options

```jsonc
{
  "plugins": [
    { "package": "opencode-project-kit", "options": { "commands": true, "rules": true } }
  ]
}
```

| Option | Default | Effect |
| --- | --- | --- |
| `commands` | `true` | Register the bundled slash commands. Names already defined elsewhere (e.g. the global commands directory) are skipped, so nothing is ever registered twice. |
| `rules` | `true` | For projects that already have `.opencode/PROGRESS.md` but no rules in `AGENTS.md`, inject a short memory-upkeep rule block per request (skipped when `AGENTS.md` already contains `Session memory`, so nothing is duplicated). |

---

## Development

```sh
git clone https://github.com/<you>/opencode-project-kit
cd opencode-project-kit
npm install
```

The command texts live in `src/protocols/*.md`. To refresh them from a local OpenCode install:

```sh
node scripts/sync-protocols.mjs          # copy from ~/.config/opencode/commands
node scripts/sync-protocols.mjs --check  # CI: fail when the copies are stale
```

Test against a live install by pointing `plugins` at the checkout directory and running
`/project_new` in a throwaway folder.

---

## Publishing

```sh
npm publish          # public package
git init && git add . && git commit -m "initial"
git remote add origin https://github.com/<you>/opencode-project-kit.git
git push -u origin main
```

Then anyone can install it with `"plugins": ["opencode-project-kit"]`.

---

## License

MIT — see [LICENSE](./LICENSE). Use it, fork it, ship it, sell it; just keep the copyright
notice and the license text, and understand it comes with no warranty.
