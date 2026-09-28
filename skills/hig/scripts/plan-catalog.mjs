#!/usr/bin/env node
/**
 * Plan the next /hig apply wave from the live catalog snapshot.
 * Wave 0 is surfaces.yaml requiredIds until chrome P0 is clean.
 * Usage: node plan-catalog.mjs [--cwd host] [--chromePass true|false] [--write]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadContext } from "./load-context.mjs";
import { loadSurfaces } from "./load-surfaces.mjs";
import {
  loadCatalog,
  parseCatalogStatus,
  planGoalLoop,
  scanAffordances,
  stringifyCatalogStatus,
} from "./catalog-lib.mjs";
import { walkSource } from "./check-chrome.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSkillRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = { cwd: process.cwd(), chromePass: false, write: false, skillRoot: defaultSkillRoot };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cwd") out.cwd = path.resolve(argv[++i]);
    else if (a === "--skill") out.skillRoot = path.resolve(argv[++i]);
    else if (a === "--chromePass") out.chromePass = argv[++i] !== "false";
    else if (a === "--write") out.write = true;
  }
  return out;
}

export function runPlanCatalog({ cwd, skillRoot, chromePass, write }) {
  const preflight = loadContext(cwd);
  const catalog = loadCatalog(skillRoot);
  const surfaces = loadSurfaces(skillRoot);
  const statusPath = path.join(cwd, ".hig", "catalog-status.yaml");
  const status = fs.existsSync(statusPath)
    ? parseCatalogStatus(fs.readFileSync(statusPath, "utf8"))
    : null;
  const files = walkSource(cwd);
  const affordances = scanAffordances(files);
  const plan = planGoalLoop({
    catalog,
    surfaces,
    preflight: { ...preflight, affordances },
    chromePass: Boolean(chromePass),
    status,
  });
  if (write) {
    fs.mkdirSync(path.join(cwd, ".hig"), { recursive: true });
    fs.writeFileSync(statusPath, stringifyCatalogStatus(plan, { chromePass }));
  }
  return {
    ...plan,
    affordances,
    statusPath: path.relative(cwd, statusPath),
    stopLine: preflight.stopLine,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const result = runPlanCatalog(args);
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

const isCli =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isCli) {
  try {
    main();
  } catch (err) {
    process.stderr.write(String(err?.stack || err) + "\n");
    process.exit(1);
  }
}
