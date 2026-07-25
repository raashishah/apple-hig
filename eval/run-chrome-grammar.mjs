#!/usr/bin/env node
/**
 * Dry proof that chrome grammar gates exist and cover the four anti-pattern classes.
 * Does not mutate designed apps. Does not run an LLM.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadChromeGrammar } from "../skills/hig/scripts/load-chrome-grammar.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const skillRoot = path.join(pluginRoot, "skills", "hig");
const fixtureDir = path.join(__dirname, "fixtures", "chrome-antipatterns");

function parseManifest(text) {
  const surfaces = [];
  let current = null;
  let inViolates = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\t/g, "  ");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (/^version:/.test(line) || /^surfaces:/.test(line)) continue;

    const start = line.match(/^\s*-\s+id:\s*(.+)\s*$/);
    if (start) {
      current = { id: start[1].trim(), file: null, violates: [] };
      surfaces.push(current);
      inViolates = false;
      continue;
    }
    if (!current) continue;

    const fileMatch = line.match(/^\s{4}file:\s*(.+)\s*$/);
    if (fileMatch) {
      current.file = fileMatch[1].trim();
      inViolates = false;
      continue;
    }

    if (/^\s{4}violates:\s*\[(.*)\]\s*$/.test(line)) {
      const inner = line.match(/\[(.*)\]/)[1];
      current.violates = inner
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      inViolates = false;
      continue;
    }
    if (/^\s{4}violates:\s*$/.test(line)) {
      inViolates = true;
      continue;
    }
    if (inViolates) {
      const item = line.match(/^\s{6}-\s+(.+)\s*$/);
      if (item) current.violates.push(item[1].trim());
    }
  }
  return { surfaces };
}

const results = [];

{
  let ok = false;
  let detail = {};
  try {
    const grammar = loadChromeGrammar(skillRoot);
    const required = grammar.requiredIds;
    const present = required.every((id) => grammar.byId[id]);
    ok = present && grammar.rules.length >= 4;
    detail = { ruleCount: grammar.rules.length, required, ids: Object.keys(grammar.byId) };
  } catch (err) {
    detail = { error: String(err.message || err) };
  }
  results.push({ case: "grammar-load", ok, ...detail });
}

{
  const expectedPath = path.join(fixtureDir, "expected.json");
  const manifestPath = path.join(fixtureDir, "manifest.yaml");
  const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));
  const manifest = parseManifest(fs.readFileSync(manifestPath, "utf8"));
  const grammar = loadChromeGrammar(skillRoot);

  const fromManifest = new Set();
  let filesOk = true;
  for (const surface of manifest.surfaces) {
    const abs = path.join(fixtureDir, surface.file);
    if (!fs.existsSync(abs)) filesOk = false;
    for (const id of surface.violates) fromManifest.add(id);
  }

  const expectedSet = new Set(expected);
  const missingExpected = [...expectedSet].filter((id) => !grammar.byId[id]);
  const missingManifest = [...expectedSet].filter((id) => !fromManifest.has(id));
  const extraManifest = [...fromManifest].filter((id) => !expectedSet.has(id));

  const packs = [
    "patterns-lists-detail.md",
    "patterns-forms.md",
    "patterns-navigation.md",
    "foundations-layout.md",
  ];
  const packHits = {};
  for (const pack of packs) {
    const text = fs.readFileSync(path.join(skillRoot, "knowledge", "packs", pack), "utf8");
    packHits[pack] = (text.match(/chrome\.[a-z0-9.-]+/g) || []).length > 0;
  }

  const skillText = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  const reviewText = fs.readFileSync(
    path.join(skillRoot, "references", "verbs", "review.md"),
    "utf8",
  );
  const designText = fs.readFileSync(
    path.join(skillRoot, "references", "verbs", "design.md"),
    "utf8",
  );

  const ok =
    filesOk &&
    missingExpected.length === 0 &&
    missingManifest.length === 0 &&
    extraManifest.length === 0 &&
    Object.values(packHits).every(Boolean) &&
    skillText.includes("Chrome grammar") &&
    reviewText.includes("structure:chrome") &&
    designText.includes("load-chrome-grammar");

  results.push({
    case: "chrome-antipattern-coverage",
    ok,
    filesOk,
    expected,
    fromManifest: [...fromManifest],
    missingExpected,
    missingManifest,
    extraManifest,
    packHits,
    skillWired: skillText.includes("Chrome grammar"),
    reviewWired: reviewText.includes("structure:chrome"),
    designWired: designText.includes("load-chrome-grammar"),
  });
}

{
  // Brand veto orthogonality: structure codes remain in grammar as mutationClass=structure
  const grammar = loadChromeGrammar(skillRoot);
  const allStructure = grammar.rules.every((r) => r.mutationClass === "structure");
  const sidebarProductOnly =
    grammar.byId["chrome.sidebar.collapsible"]?.registers?.includes?.("product") &&
    !grammar.byId["chrome.sidebar.collapsible"]?.registers?.includes?.("brand") &&
    !grammar.byId["chrome.sidebar.collapsible"]?.registers?.includes?.("any");
  results.push({
    case: "structure-mutation-class",
    ok: allStructure && sidebarProductOnly,
    allStructure,
    sidebarProductOnly,
  });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
