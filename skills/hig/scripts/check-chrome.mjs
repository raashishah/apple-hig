#!/usr/bin/env node
/**
 * Mechanical chrome FAIL scanner.
 * Prints JSON. P0 hits → exit 1.
 * Agents must run this after apply; they may not emit HIG_CHROME PASS while P0 remains.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadChromeGrammar } from "./load-chrome-grammar.mjs";
import { loadContext } from "./load-context.mjs";
import { DETECTORS } from "../knowledge/chrome/detectors.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSkillRoot = path.resolve(__dirname, "..");

const SOURCE_EXTS = new Set([
  ".swift",
  ".m",
  ".h",
  ".mm",
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".vue",
  ".svelte",
  ".dart",
  ".qml",
  ".storyboard",
  ".xib",
]);

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "DerivedData",
  "build",
  "dist",
  ".next",
  "Pods",
  "vendor",
  ".build",
  "coverage",
  ".worktrees",
  "xcuserdata",
  "Carthage",
  "Checkouts",
  "skills",
  "knowledge",
]);

function skipDir(name, cwd) {
  if (SKIP_DIRS.has(name)) return true;
  if (name === "eval") {
    const norm = cwd.replace(/\\/g, "/");
    return !norm.includes("/eval/fixtures/");
  }
  return false;
}

function walkSource(cwd, maxFiles = 400) {
  const files = [];
  function walk(dir, depth) {
    if (files.length >= maxFiles || depth > 6) return;
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of ents) {
      if (files.length >= maxFiles) return;
      const name = ent.name;
      if (name.startsWith(".") && name !== ".swift") continue;
      const full = path.join(dir, name);
      if (ent.isDirectory()) {
        if (skipDir(name, cwd)) continue;
        walk(full, depth + 1);
        continue;
      }
      if (!ent.isFile()) continue;
      const ext = path.extname(name).toLowerCase();
      if (!SOURCE_EXTS.has(ext)) continue;
      let text = "";
      try {
        text = fs.readFileSync(full, "utf8");
      } catch {
        continue;
      }
      files.push({ path: path.relative(cwd, full) || name, text });
    }
  }
  walk(cwd, 0);
  return files;
}

function ruleApplies(rule, register) {
  const regs = Array.isArray(rule.registers) ? rule.registers : ["any"];
  if (register === "brand") {
    return regs.includes("any") || regs.includes("brand");
  }
  return regs.includes("product") || regs.includes("any") || regs.length === 0;
}

export function checkChrome(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const skillRoot = path.resolve(options.skillRoot || defaultSkillRoot);
  const grammar = loadChromeGrammar(skillRoot);
  let register = options.register;
  if (!register) {
    try {
      register = loadContext(cwd).register || "unknown";
    } catch {
      register = "unknown";
    }
  }
  const effectiveRegister = register === "brand" ? "brand" : "product";
  const files = options.files || walkSource(cwd);
  const fails = [];
  const skipped = [];
  const checked = [];

  for (const rule of grammar.rules) {
    if (!ruleApplies(rule, effectiveRegister)) {
      skipped.push(rule.id);
      continue;
    }
    const detector = DETECTORS[rule.id];
    if (!detector) {
      skipped.push(rule.id);
      continue;
    }
    checked.push(rule.id);
    const hits = detector(files) || [];
    for (const h of hits) {
      fails.push({
        id: rule.id,
        severity: rule.severity || "P1",
        mutationClass: rule.mutationClass || "structure",
        file: h.file,
        evidence: h.evidence,
      });
    }
  }

  const p0 = fails.filter((f) => f.severity === "P0");
  return {
    cwd,
    register: effectiveRegister,
    filesScanned: files.length,
    checked,
    skipped,
    fails,
    p0Count: p0.length,
    p1Count: fails.filter((f) => f.severity === "P1").length,
    pass: p0.length === 0,
  };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const cwdArg = process.argv[2];
  const result = checkChrome({
    cwd: cwdArg ? path.resolve(cwdArg) : process.cwd(),
  });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(result.pass ? 0 : 1);
}
