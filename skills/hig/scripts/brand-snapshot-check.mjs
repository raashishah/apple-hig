#!/usr/bin/env node
/**
 * Compare current brand CSS vars/fonts to a snapshot JSON from load-context.
 * Usage: node brand-snapshot-check.mjs <project-cwd> [expected.json]
 * If expected omitted, writes snapshot to .hig/brand-snapshot.json and exits 0.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loadContext = path.join(__dirname, "load-context.mjs");

const cwd = path.resolve(process.argv[2] || process.cwd());
const expectedPath =
  process.argv[3] || path.join(cwd, ".hig", "brand-snapshot.json");

const r = spawnSync(process.execPath, [loadContext, cwd], { encoding: "utf8" });
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(1);
}
const ctx = JSON.parse(r.stdout);
const snap = ctx.brandSnapshot;

if (!fs.existsSync(expectedPath)) {
  fs.mkdirSync(path.dirname(expectedPath), { recursive: true });
  fs.writeFileSync(expectedPath, JSON.stringify(snap, null, 2) + "\n");
  process.stdout.write(
    JSON.stringify({ wrote: path.relative(cwd, expectedPath), snap }, null, 2) +
      "\n",
  );
  process.exit(0);
}

const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));
const keys = ["bg", "fg", "rule", "muted", "frame-border"];
const mismatches = [];
for (const k of keys) {
  if (expected.cssVars?.[k] && snap.cssVars?.[k] !== expected.cssVars[k]) {
    mismatches.push({
      key: k,
      expected: expected.cssVars[k],
      actual: snap.cssVars?.[k],
    });
  }
}

const expFonts = new Set(expected.fontFamilies || []);
const actFonts = new Set(snap.fontFamilies || []);
for (const f of expFonts) {
  if (!actFonts.has(f)) {
    mismatches.push({ key: "fontFamily", expected: f, actual: "missing" });
  }
}

const ok = mismatches.length === 0;
process.stdout.write(
  JSON.stringify({ ok, mismatches, expectedPath }, null, 2) + "\n",
);
process.exit(ok ? 0 : 1);
