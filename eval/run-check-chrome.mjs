#!/usr/bin/env node
/**
 * Prove check-chrome.mjs detects antipattern fixtures and stays quiet on pass fixtures.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkChrome } from "../skills/hig/scripts/check-chrome.mjs";
import { loadContext } from "../skills/hig/scripts/load-context.mjs";
import { loadChromeGrammar } from "../skills/hig/scripts/load-chrome-grammar.mjs";

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
  const webDir = path.join(__dirname, "fixtures", "chrome-antipatterns-web");
  const swiftDir = path.join(__dirname, "fixtures", "chrome-antipatterns-swift");
  const webExpected = JSON.parse(fs.readFileSync(path.join(webDir, "expected.json"), "utf8"));
  const swiftExpected = JSON.parse(fs.readFileSync(path.join(swiftDir, "expected.json"), "utf8"));
  const web = checkChrome({ cwd: webDir, skillRoot, register: "product" });
  const native = checkChrome({ cwd: swiftDir, skillRoot, register: "product" });
  const webCtx = loadContext(webDir);
  const nativeCtx = loadContext(swiftDir);
  const webIds = new Set(web.fails.map((f) => f.id));
  const nativeIds = new Set(native.fails.map((f) => f.id));
  const shared = webExpected.filter((id) => webIds.has(id) && nativeIds.has(id));
  const grammar = loadChromeGrammar(skillRoot);
  const p0Shared = shared.filter((id) => grammar.byId[id]?.severity === "P0");
  const kindsDiffer =
    webCtx.stack.supported &&
    nativeCtx.stack.supported &&
    webCtx.stack.kind !== nativeCtx.stack.kind;
  results.push({
    case: "same-fail-on-web-and-swift",
    ok:
      p0Shared.length >= 2 &&
      webExpected.every((id) => webIds.has(id)) &&
      swiftExpected.every((id) => nativeIds.has(id)) &&
      kindsDiffer,
    p0Shared,
    webKind: webCtx.stack.kind,
    nativeKind: nativeCtx.stack.kind,
    webFound: [...webIds],
    nativeFound: [...nativeIds],
  });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
