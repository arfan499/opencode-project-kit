#!/usr/bin/env node
/**
 * Copy the live command protocols from the local OpenCode config into this package.
 *
 *   node scripts/sync-protocols.mjs            # copy
 *   node scripts/sync-protocols.mjs --check    # fail if the copies are stale
 *
 * Source: ~/.config/opencode/commands/<name>.md   (override with OPENCODE_COMMANDS_DIR)
 * Target: src/protocols/<name>.md
 *
 * Files are copied verbatim, frontmatter included; the plugin strips the frontmatter at
 * runtime and uses `description:` for the command description.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = join(ROOT, "src", "protocols");
const SOURCE =
  process.env.OPENCODE_COMMANDS_DIR ?? join(homedir(), ".config", "opencode", "commands");

const CHECK_ONLY = process.argv.includes("--check");

/**
 * Only the kit's own commands are bundled. Everything else in the local commands directory
 * (personal prompts, third-party command packs) is deliberately left out.
 */
const KIT_COMMANDS = [
  "new-project",
  "project_new",
  "project-add",
  "project-remove",
  "project-upgrade",
  "project-check",
  "project-doctor",
  "init",
  "progress",
  "handoff",
  "resume",
];


if (!existsSync(SOURCE)) {
  console.error(`Source command directory not found: ${SOURCE}`);
  process.exit(1);
}

mkdirSync(TARGET, { recursive: true });

const files = KIT_COMMANDS.map((name) => `${name}.md`);
const missing = files.filter((file) => !existsSync(join(SOURCE, file)));
if (missing.length > 0) {
  console.error(`Missing kit protocol(s) in ${SOURCE}: ${missing.join(", ")}`);
  process.exit(1);
}

const added = [];
const stale = [];

for (const file of files) {
  const from = join(SOURCE, file);
  const to = join(TARGET, file);

  if (existsSync(to) && readFileSync(to, "utf8") === readFileSync(from, "utf8")) continue;

  if (CHECK_ONLY) {
    stale.push(file);
    continue;
  }

  copyFileSync(from, to);
  added.push(file);
}

if (CHECK_ONLY) {
  if (stale.length > 0) {
    console.error(`Stale protocol copies: ${stale.join(", ")}`);
    process.exit(1);
  }
  console.log(`Protocols in sync (${files.length} files).`);
} else {
  console.log(
    added.length > 0
      ? `Copied ${added.length} protocol file(s): ${added.join(", ")}`
      : `Already in sync (${files.length} files).`,
  );
}
