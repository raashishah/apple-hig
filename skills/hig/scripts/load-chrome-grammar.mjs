#!/usr/bin/env node
/**
 * Load and validate knowledge/chrome/grammar.yaml.
 * Usage: node load-chrome-grammar.mjs [skillRoot]
 * Prints JSON: { version, rules, byId, byPack }
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSkillRoot = path.resolve(__dirname, "..");

const REQUIRED_CLASSES = [
  "chrome.view-mode.icons",
  "chrome.list-browser.toolbar-budget",
  "chrome.form.column-cohesion",
  "chrome.sidebar.collapsible",
];

function parseSimpleYaml(text) {
  // Minimal YAML subset for this grammar file (no nested objects beyond lists of scalars).
  const lines = text.split(/\r?\n/);
  const doc = { version: null, rules: [] };
  let current = null;
  let multilineKey = null;
  let multilineBuf = [];

  const flushMultiline = () => {
    if (!current || !multilineKey) return;
    current[multilineKey] = multilineBuf.join(" ").replace(/\s+/g, " ").trim();
    multilineKey = null;
    multilineBuf = [];
  };

  for (const raw of lines) {
    const line = raw.replace(/\t/g, "  ");
    if (!line.trim() || line.trim().startsWith("#")) continue;

    if (multilineKey) {
      if (/^\s{4}\S/.test(line) || /^\s{6}/.test(line)) {
        multilineBuf.push(line.trim());
        continue;
      }
      flushMultiline();
    }

    const versionMatch = line.match(/^version:\s*(\d+)\s*$/);
    if (versionMatch) {
      doc.version = Number(versionMatch[1]);
      continue;
    }

    if (/^rules:\s*$/.test(line)) continue;

    const ruleStart = line.match(/^\s*-\s+id:\s*(.+)\s*$/);
    if (ruleStart) {
      current = { id: ruleStart[1].trim() };
      doc.rules.push(current);
      continue;
    }

    if (!current) continue;

    const kv = line.match(/^\s{4}([A-Za-z]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();

    if (val === ">" || val === "|" || val === ">-" || val === "|-") {
      multilineKey = key;
      multilineBuf = [];
      continue;
    }

    if (val.startsWith("[") && val.endsWith("]")) {
      current[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      continue;
    }

    if (/^".*"$/.test(val) || /^'.*'$/.test(val)) {
      val = val.slice(1, -1);
    }
    current[key] = val;
  }
  flushMultiline();
  return doc;
}

export function loadChromeGrammar(skillRoot = defaultSkillRoot) {
  const grammarPath = path.join(skillRoot, "knowledge", "chrome", "grammar.yaml");
  if (!fs.existsSync(grammarPath)) {
    throw new Error(`missing chrome grammar: ${grammarPath}`);
  }
  const doc = parseSimpleYaml(fs.readFileSync(grammarPath, "utf8"));
  if (doc.version !== 1) throw new Error(`unsupported grammar version: ${doc.version}`);
  if (!Array.isArray(doc.rules) || doc.rules.length === 0) {
    throw new Error("grammar.yaml has no rules");
  }

  const byId = {};
  const byPack = {};
  for (const rule of doc.rules) {
    if (!rule.id || !rule.failWhen || !rule.passWhen || !rule.appleUrl) {
      throw new Error(`incomplete rule: ${JSON.stringify(rule)}`);
    }
    if (byId[rule.id]) throw new Error(`duplicate rule id: ${rule.id}`);
    byId[rule.id] = rule;
    const packs = Array.isArray(rule.packs) ? rule.packs : [];
    for (const pack of packs) {
      if (!byPack[pack]) byPack[pack] = [];
      byPack[pack].push(rule.id);
    }
  }

  const missing = REQUIRED_CLASSES.filter((id) => !byId[id]);
  if (missing.length) {
    throw new Error(`grammar missing required rules: ${missing.join(", ")}`);
  }

  return {
    version: doc.version,
    grammarPath,
    rules: doc.rules,
    byId,
    byPack,
    requiredIds: REQUIRED_CLASSES,
  };
}

function main() {
  const skillRoot = process.argv[2] ? path.resolve(process.argv[2]) : defaultSkillRoot;
  const grammar = loadChromeGrammar(skillRoot);
  process.stdout.write(
    JSON.stringify(
      {
        version: grammar.version,
        ruleCount: grammar.rules.length,
        requiredIds: grammar.requiredIds,
        ids: grammar.rules.map((r) => r.id),
        byPack: grammar.byPack,
      },
      null,
      2,
    ) + "\n",
  );
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
