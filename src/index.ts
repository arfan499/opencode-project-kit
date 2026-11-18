/**
 * opencode-project-kit — lean, opt-in per-project scaffolding for OpenCode V2.
 *
 * Registers the project-kit slash commands (/project_new, /project-add, /project-remove,
 * /project-mcp, /init, /progress, /handoff, /resume, /project-check, /project-doctor,
 * /project-upgrade) from the bundled markdown protocols, and injects a short "how to keep
 * the project memory alive" rule set for projects that have already been scaffolded.
 *
 * V2 plugin API only (`Plugin.define`). Not compatible with V1 plugin signatures.
 */
import { Plugin } from "@opencode/plugin";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROTOCOL_DIR = join(HERE, "protocols");

/** A protocol file name becomes a slash command name, so keep it boring. */
const VALID_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export interface ProjectKitOptions {
  /** Register the bundled slash commands. Default: true. */
  commands?: boolean;
  /** Inject the project-memory rules for scaffolded projects. Default: true. */
  rules?: boolean;
}

interface Protocol {
  name: string;
  description: string;
  body: string;
}

interface Frontmatter {
  data: Record<string, string>;
  body: string;
}

/** Split a leading `---` YAML block from the protocol body. */
function splitFrontmatter(raw: string): Frontmatter {
  const text = raw.replace(/^\uFEFF/, "");
  const match = text.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!match) return { data: {}, body: text.trim() };

  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^([A-Za-z0-9_-]+):[ \t]*(.*)$/);
    if (!entry) continue;
    const value = entry[2].trim().replace(/^["']|["']$/g, "");
    if (value) data[entry[1]] = value;
  }

  return { data, body: text.slice(match[0].length).trim() };
}

function loadProtocols(): Protocol[] {
  if (!existsSync(PROTOCOL_DIR)) return [];

  const protocols: Protocol[] = [];
  for (const file of readdirSync(PROTOCOL_DIR)) {
    if (!file.endsWith(".md")) continue;

    const name = file.slice(0, -".md".length);
    if (!VALID_NAME.test(name)) continue;

    const { data, body } = splitFrontmatter(readFileSync(join(PROTOCOL_DIR, file), "utf8"));
    if (!body) continue;

    protocols.push({
      name,
      description: data.description || `Project kit: ${name}`,
      body,
    });
  }

  return protocols;
}

/**
 * Rules injected for scaffolded projects whose AGENTS.md does not carry them already.
 * Deliberately short: this is paid for on every request.
 */
const RULES = `## Project kit — project memory (automatic)
This project has \`.opencode/PROGRESS.md\` (briefing, capped at 80 lines) and \`.opencode/PROGRESS-FULL.md\` (detailed history, not auto-loaded).
- Session start: read the briefing and open with the goal + next action.
- After each task: update Current state/Next and \`updated:\` in the briefing, and append a detailed entry (files, commands + results, leftovers) to PROGRESS-FULL.md.
- Missing detail or post-compaction: read PROGRESS-FULL.md before guessing or asking the user.
- If the files disagree with git, trust git and fix both files.
- Never work degraded: if a task needs a capability the project has off, say so in one line and enable it with /project-add.`;

/** Project has been scaffolded: a briefing file exists next to the config. */
function isScaffolded(directory: string): boolean {
  return existsSync(join(directory, ".opencode", "PROGRESS.md"));
}

/** Rules already present (e.g. written into the project AGENTS.md by /project_new). */
function hasRules(directory: string): boolean {
  for (const candidate of ["AGENTS.md", join(".opencode", "AGENTS.md")]) {
    const path = join(directory, candidate);
    if (!existsSync(path)) continue;
    try {
      if (readFileSync(path, "utf8").includes("Session memory")) return true;
    } catch {
      // unreadable file: fall through to the next candidate
    }
  }
  return false;
}

export default Plugin.define({
  id: "opencode-project-kit",

  async setup(ctx) {
    const options = (ctx.options ?? {}) as ProjectKitOptions;

    if (options.commands !== false) {
      const protocols = loadProtocols();
      if (protocols.length > 0) {
        // Commands may already be defined (e.g. the same .md files installed in the
        // global ~/.config/opencode/commands directory). Skip those so nothing is
        // registered twice — whichever source defined the name first wins.
        const existing = new Set<string>();
        try {
          const listed = (await ctx.command.list()) as { name?: string }[];
          for (const entry of listed) if (entry?.name) existing.add(entry.name);
        } catch {
          // listing failed: fall through and register everything; it is still
          // deterministic per name so OpenCode resolves collisions the same way
        }

        await ctx.command.transform((editor) => {
          for (const protocol of protocols) {
            if (existing.has(protocol.name)) continue;
            editor.add({
              name: protocol.name,
              description: protocol.description,
              execute: async ({ sessionID, prompt, delivery }) => {
                // The protocols end with a literal $ARGUMENTS placeholder, matching
                // the file-command convention. Substitute the typed text in place.
                const args = (prompt?.text ?? "").trim();
                const text = protocol.body.replace(/\$ARGUMENTS/g, args).trimEnd();
                await ctx.session.prompt({ sessionID, delivery, text });
              },
            });
          }
        });
      }
    }

    if (options.rules !== false) {
      const directory = ctx.location?.directory;
      if (directory && isScaffolded(directory) && !hasRules(directory)) {
        await ctx.session.hook("context", (event) => {
          event.system.push({ type: "text", text: RULES });
        });
      }
    }
  },
});
