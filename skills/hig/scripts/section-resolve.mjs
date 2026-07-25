#!/usr/bin/env node
/**
 * Resolve a section id against knowledge/registry.yaml and report pack path.
 * Usage: node section-resolve.mjs <section-id>
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");
const sectionId = process.argv[2];

if (!sectionId) {
  console.error("Usage: node section-resolve.mjs <section-id>");
  process.exit(2);
}

const registryPath = path.join(skillRoot, "knowledge", "registry.yaml");
const registryText = fs.readFileSync(registryPath, "utf8");
const ids = [...registryText.matchAll(/^\s+- id: (\S+)/gm)].map((m) => m[1]);

if (!ids.includes(sectionId)) {
  process.stdout.write(
    JSON.stringify(
      {
        ok: false,
        sectionId,
        error: "unknown_section",
        knownCount: ids.length,
        hint: "List ids from knowledge/registry.yaml",
      },
      null,
      2,
    ) + "\n",
  );
  process.exit(1);
}

const blockMatch = registryText.split(/\n  - id: /).find((b) => b.startsWith(sectionId + "\n") || b === sectionId);
const entry = { id: sectionId };
if (blockMatch) {
  for (const line of blockMatch.split("\n").slice(1)) {
    const m = line.match(/^\s+(hig_url|topic|phase|relevance|batch):\s*(.+)$/);
    if (m) entry[m[1]] = m[2].trim();
  }
}

const packPath = path.join(skillRoot, "knowledge", "packs", `${sectionId}.md`);
const hasPack = fs.existsSync(packPath);

process.stdout.write(
  JSON.stringify(
    {
      ok: true,
      entry,
      hasPack,
      packPath: hasPack ? path.relative(process.cwd(), packPath) : null,
      packAbsolute: hasPack ? packPath : null,
      stub: !hasPack,
    },
    null,
    2,
  ) + "\n",
);
