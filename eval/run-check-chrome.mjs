#!/usr/bin/env node
/**
 * Prove check-chrome.mjs detects antipattern fixtures and stays quiet on pass fixtures.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkChrome } from "../skills/hig/scripts/check-chrome.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const skillRoot = path.join(pluginRoot, "skills", "hig");
const antipatternDir = path.join(__dirname, "fixtures", "chrome-antipatterns");
const passDir = path.join(__dirname, "fixtures", "chrome-pass");

const results = [];

{
  const expected = JSON.parse(
    fs.readFileSync(path.join(antipatternDir, "expected.json"), "utf8"),
  );
  const report = checkChrome({ cwd: antipatternDir, skillRoot, register: "product" });
  const found = new Set(report.fails.map((f) => f.id));
  const missing = expected.filter((id) => !found.has(id));
  const ok = missing.length === 0 && report.p0Count > 0 && report.pass === false;
  results.push({
    case: "antipatterns-detected",
    ok,
    missing,
    found: [...found],
    p0Count: report.p0Count,
    filesScanned: report.filesScanned,
  });
}

{
  const report = checkChrome({ cwd: passDir, skillRoot, register: "product" });
  const p0Ids = report.fails.filter((f) => f.severity === "P0").map((f) => f.id);
  const ok = report.pass === true && p0Ids.length === 0;
  results.push({
    case: "pass-fixtures-clean",
    ok,
    p0Ids,
    fails: report.fails,
    filesScanned: report.filesScanned,
  });
}

{
  const skillText = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  const designText = fs.readFileSync(
    path.join(skillRoot, "references", "verbs", "design.md"),
    "utf8",
  );
  const recipes = fs.existsSync(path.join(skillRoot, "knowledge", "chrome", "recipes.md"));
  const ok =
    recipes &&
    skillText.includes("check-chrome.mjs") &&
    skillText.includes("Any-model contract") &&
    designText.includes("check-chrome.mjs") &&
    designText.includes("requiredIds");
  results.push({
    case: "skill-contract-wired",
    ok,
    recipes,
  });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
