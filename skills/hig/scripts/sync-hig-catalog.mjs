#!/usr/bin/env node
/**
 * Fetch Apple's live HIG DocC index and write knowledge/catalog.yaml.
 * Usage: node sync-hig-catalog.mjs [skillRoot]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadSurfaces } from "./load-surfaces.mjs";
import {
  CATALOG_SOURCE_URL,
  buildCatalog,
  stringifyCatalog,
  validateCatalog,
} from "./catalog-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSkillRoot = path.resolve(__dirname, "..");

export async function fetchHigIndex(sourceUrl = CATALOG_SOURCE_URL) {
  const res = await fetch(sourceUrl, {
    headers: { "user-agent": "apple-hig-catalog-sync" },
  });
  if (!res.ok) {
    throw new Error(`HIG index fetch failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function syncHigCatalog(skillRoot = defaultSkillRoot, fetched = null) {
  const index = await fetchHigIndex();
  const surfaces = loadSurfaces(skillRoot);
  const day = fetched || new Date().toISOString().slice(0, 10);
  const doc = buildCatalog({ index, surfaces, fetched: day });
  validateCatalog(doc);
  const outPath = path.join(skillRoot, "knowledge", "catalog.yaml");
  fs.writeFileSync(outPath, stringifyCatalog(doc));
  return { outPath, count: doc.topics.length, fetched: day };
}

async function main() {
  const skillRoot = process.argv[2] ? path.resolve(process.argv[2]) : defaultSkillRoot;
  const result = await syncHigCatalog(skillRoot);
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

const isCli =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isCli) {
  main().catch((err) => {
    process.stderr.write(String(err?.stack || err) + "\n");
    process.exit(1);
  });
}
