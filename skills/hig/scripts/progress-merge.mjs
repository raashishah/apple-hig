#!/usr/bin/env node
/**
 * Idempotent upsert of section progress into .hig/progress.yaml
 * Usage: node progress-merge.mjs --id foundations-color --status spec_draft [--spec .hig/specs/foundations-color.md]
 */

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--id") out.id = argv[++i];
    else if (a === "--status") out.status = argv[++i];
    else if (a === "--spec") out.spec = argv[++i];
    else if (a === "--cwd") out.cwd = argv[++i];
  }
  return out;
}

const args = parseArgs(process.argv);
const cwd = args.cwd ? path.resolve(args.cwd) : process.cwd();
if (!args.id || !args.status) {
  console.error("Usage: progress-merge.mjs --id <section-id> --status <status> [--spec path]");
  process.exit(2);
}

const higDir = path.join(cwd, ".hig");
const progressPath = path.join(higDir, "progress.yaml");
fs.mkdirSync(higDir, { recursive: true });

let text = fs.existsSync(progressPath) ? fs.readFileSync(progressPath, "utf8") : "version: 1\nsections: {}\n";
const iso = new Date().toISOString();
const specLine = args.spec ? `    spec: ${args.spec}\n` : "";
const entry = `  ${args.id}:\n    status: ${args.status}\n${specLine}    updatedAt: ${iso}\n`;

if (/^sections:\s*\{\}\s*$/m.test(text) || /sections:\s*$/m.test(text) && !/\n  \S+:/m.test(text)) {
  text = `version: 1\nsections:\n${entry}`;
} else if (new RegExp(`^  ${args.id}:`, "m").test(text)) {
  text = text.replace(
    new RegExp(`^  ${args.id}:\\n(?:    .+\\n)*`, "m"),
    entry,
  );
} else {
  if (!/sections:\n/.test(text)) text += "\nsections:\n";
  text = text.replace(/sections:\n/, `sections:\n${entry}`);
}

const tmp = progressPath + ".tmp";
fs.writeFileSync(tmp, text);
fs.renameSync(tmp, progressPath);

process.stdout.write(
  JSON.stringify({ ok: true, progressPath: path.relative(cwd, progressPath), id: args.id, status: args.status }, null, 2) +
    "\n",
);
