#!/usr/bin/env node
/**
 * Prove check-chrome.mjs detects antipattern fixtures and stays quiet on pass fixtures.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyChrome, MECHANICAL_CHROME_IDS } from "../skills/hig/scripts/apply-chrome.mjs";
import { checkChrome, walkSource } from "../skills/hig/scripts/check-chrome.mjs";
import { loadContext } from "../skills/hig/scripts/load-context.mjs";
import { loadChromeGrammar } from "../skills/hig/scripts/load-chrome-grammar.mjs";
import { LIST_STATUSES, listStatusChrome } from "../skills/hig/knowledge/chrome/list-status.mjs";

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

function copyFixture(src) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-chrome-"));
  fs.cpSync(src, dir, { recursive: true });
  return dir;
}

function kitOrFont(text) {
  return /SF Pro|San Francisco|-apple-system|shadcn|@radix-ui/i.test(text);
}

{
  const webSrc = path.join(__dirname, "fixtures", "chrome-antipatterns-web");
  const swiftSrc = path.join(__dirname, "fixtures", "chrome-antipatterns-swift");
  const webDir = copyFixture(webSrc);
  const swiftDir = copyFixture(swiftSrc);
  try {
    const web = applyChrome({ cwd: webDir, skillRoot, register: "product", write: true });
    const native = applyChrome({ cwd: swiftDir, skillRoot, register: "product", write: true });
    const webCtx = loadContext(webDir);
    const nativeCtx = loadContext(swiftDir);
    const webText = walkSource(webDir)
      .map((f) => f.text)
      .join("\n");
    const nativeText = walkSource(swiftDir)
      .map((f) => f.text)
      .join("\n");
    const origWeb = fs.readFileSync(path.join(webSrc, "index.html"), "utf8");
    const origSwift = fs.readFileSync(path.join(swiftSrc, "Sources", "App", "ViewMode.swift"), "utf8");
    const origUnchanged =
      />\s*List\s*</.test(origWeb) && /Text\(\s*"List"\s*\)/.test(origSwift);
    const mechanicalGone = (report) =>
      MECHANICAL_CHROME_IDS.every((id) => !report.after.fails.some((f) => f.id === id));
    const webFlow = fs.readFileSync(path.join(webDir, "split-flow.html"), "utf8");
    const swiftFlow = fs.readFileSync(path.join(swiftDir, "Sources", "App", "SplitFlow.swift"), "utf8");
    const webSections = [...webFlow.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/gi)].map((m) => m[0]);
    const emptyWeb = webSections.find((s) => /data-list-status=["']empty["']/.test(s) && /data-split/.test(s));
    const shortWeb = webFlow.match(/<form\b[^>]*data-create=["']short["'][^>]*>[\s\S]*?<\/form>/i);
    const longWeb = webFlow.match(/<form\b[^>]*data-create=["']long["'][^>]*>[\s\S]*?<\/form>/i);
    const shortHost = webSections.find((s) => shortWeb && s.includes(shortWeb[0]));
    const webShape =
      emptyWeb &&
      !/Select a/i.test(emptyWeb) &&
      !/>\s*Add\s*</.test(emptyWeb) &&
      /data-list-status=["']empty["']/.test(webFlow) &&
      /width:\s*20rem/.test(webFlow) &&
      /data-empty-detail/.test(webFlow) &&
      longWeb &&
      !webSections.some((s) => /data-split/.test(s) && s.includes(longWeb[0])) &&
      shortHost &&
      /<ul\b/i.test(shortHost) &&
      !/data-list-status=["']empty["']/.test(shortHost) &&
      !/>\s*Add\s*</.test(webFlow) &&
      !/Select a/i.test(webFlow);
    const swiftStructs = swiftFlow.split(/(?=struct )/);
    const longStruct = swiftStructs.find((block) => /\.createKind\(\.long\)/.test(block)) || "";
    const shortStruct = swiftStructs.find((block) => /\.createKind\(\.short\)/.test(block)) || "";
    const swiftShape =
      /\.listStatus\(\.empty\)/.test(swiftFlow) &&
      /Text\(\s*"No vendors yet"\s*\)/.test(swiftFlow) &&
      !/Text\(\s*"Select a/.test(swiftFlow) &&
      /\.frame\(minWidth:\s*220,\s*idealWidth:\s*320\)/.test(swiftFlow) &&
      /EmptyView\(\)/.test(swiftFlow) &&
      longStruct &&
      !/NavigationSplitView/.test(longStruct) &&
      /detail:\s*\{[\s\S]*\.createKind\(\.short\)/.test(shortStruct) &&
      /ListStatus\.loading/.test(swiftFlow) &&
      /ListStatus\.fault/.test(swiftFlow) &&
      /ListStatus\.empty/.test(swiftFlow) &&
      !/Button\(\s*"Add"\s*\)/.test(swiftFlow);
    const kindsDiffer =
      webCtx.stack.supported &&
      nativeCtx.stack.supported &&
      webCtx.stack.kind !== nativeCtx.stack.kind;
    results.push({
      case: "mechanical-apply-clears-dual-stack-p0",
      ok:
        web.before.pass === false &&
        native.before.pass === false &&
        web.after.pass === true &&
        native.after.pass === true &&
        web.applied.length > 0 &&
        native.applied.length > 0 &&
        mechanicalGone(web) &&
        mechanicalGone(native) &&
        webShape &&
        swiftShape &&
        kindsDiffer &&
        !kitOrFont(webText) &&
        !kitOrFont(nativeText) &&
        origUnchanged,
      webKind: webCtx.stack.kind,
      nativeKind: nativeCtx.stack.kind,
      webApplied: web.applied,
      nativeApplied: native.applied,
      origUnchanged,
      webShape,
      swiftShape,
    });
  } finally {
    fs.rmSync(webDir, { recursive: true, force: true });
    fs.rmSync(swiftDir, { recursive: true, force: true });
  }
}

{
  const src = path.join(__dirname, "fixtures", "chrome-antipatterns");
  const dir = copyFixture(src);
  try {
    const report = applyChrome({ cwd: dir, skillRoot, register: "product", write: true });
    const grammar = loadChromeGrammar(skillRoot);
    const p0Ids = grammar.rules
      .filter((r) => (r.severity || "P1") === "P0")
      .map((r) => r.id);
    const beforeP0 = new Set(
      report.before.fails.filter((f) => f.severity === "P0").map((f) => f.id),
    );
    const afterP0 = report.after.fails.filter((f) => f.severity === "P0").map((f) => f.id);
    const appliedIds = new Set(report.applied.map((a) => a.id));
    const orig = fs.readFileSync(path.join(src, "surfaces", "card-grid-home.tsx"), "utf8");
    const origUnchanged = orig.includes("card-grid");
    const hostText = walkSource(dir)
      .map((f) => f.text)
      .join("\n");
    results.push({
      case: "mechanical-apply-clears-remaining-p0",
      ok:
        report.before.pass === false &&
        report.after.pass === true &&
        afterP0.length === 0 &&
        p0Ids.every((id) => !beforeP0.has(id) || appliedIds.has(id)) &&
        origUnchanged &&
        !kitOrFont(hostText),
      beforeP0: [...beforeP0],
      afterP0,
      applied: [...appliedIds],
      origUnchanged,
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const src = path.join(__dirname, "fixtures", "chrome-antipatterns");
  const dir = copyFixture(src);
  try {
    const report = applyChrome({ cwd: dir, skillRoot, register: "product", write: true });
    const appliedIds = new Set(report.applied.map((a) => a.id));
    const orig = fs.readFileSync(path.join(src, "surfaces", "sidebar-fixed.tsx"), "utf8");
    const origUnchanged = !/aria-expanded=/.test(orig);
    const hostText = walkSource(dir)
      .map((f) => f.text)
      .join("\n");
    results.push({
      case: "mechanical-apply-clears-p1",
      ok:
        report.before.fails.some((f) => f.id === "chrome.list-browser.filter-density") &&
        report.before.fails.some((f) => f.id === "chrome.sidebar.collapsible") &&
        report.after.fails.length === 0 &&
        appliedIds.has("chrome.list-browser.filter-density") &&
        appliedIds.has("chrome.sidebar.collapsible") &&
        origUnchanged &&
        !kitOrFont(hostText),
      afterFails: report.after.fails,
      applied: [...appliedIds],
      origUnchanged,
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const src = path.join(__dirname, "fixtures", "chrome-pass");
  const dir = copyFixture(src);
  try {
    const report = applyChrome({ cwd: dir, skillRoot, register: "product", write: true });
    results.push({
      case: "mechanical-apply-noop-on-pass",
      ok:
        report.before.pass === true &&
        report.after.pass === true &&
        report.applied.length === 0,
      applied: report.applied,
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const SPLIT_LIST_IDS = [
  "chrome.split.empty-select",
  "chrome.split.list-width",
  "chrome.create.short-vs-long",
  "chrome.list-status.lifecycle",
];

{
  const hosts = [
    ["web-antipattern", path.join(__dirname, "fixtures", "chrome-antipatterns-web"), true],
    ["swift-antipattern", path.join(__dirname, "fixtures", "chrome-antipatterns-swift"), true],
    ["web-clean", path.join(__dirname, "fixtures", "chrome-pass-web"), false],
    ["swift-clean", path.join(__dirname, "fixtures", "chrome-pass-swift"), false],
  ];
  const reports = {};
  let ok = true;
  for (const [name, dir, shouldFail] of hosts) {
    const report = checkChrome({ cwd: dir, skillRoot, register: "product" });
    const found = new Set(report.fails.map((f) => f.id));
    const hit = SPLIT_LIST_IDS.filter((id) => found.has(id));
    const missing = SPLIT_LIST_IDS.filter((id) => !found.has(id));
    const hostOk = shouldFail ? missing.length === 0 : hit.length === 0 && report.pass === true;
    reports[name] = { hostOk, hit, missing, pass: report.pass };
    if (!hostOk) ok = false;
  }
  results.push({ case: "split-list-flow-dual-stack", ok, reports });
}

{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-no-split-"));
  const file = path.join(dir, "App.tsx");
  const source = "export default function App() {\n  return <p>Hello</p>;\n}\n";
  fs.writeFileSync(file, source);
  try {
    const chrome = applyChrome({ cwd: dir, skillRoot, register: "product", write: true });
    const after = fs.readFileSync(file, "utf8");
    const invented = /data-split|<form\b|NavigationSplitView/.test(after);
    results.push({
      case: "apply-does-not-invent-split-or-form",
      ok: after === source && chrome.applied.length === 0 && !invented,
      invented,
      applied: chrome.applied,
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const policies = {};
  let threw = false;
  try {
    for (const status of LIST_STATUSES) policies[status] = listStatusChrome(status);
  } catch {
    threw = true;
  }
  let unknownThrew = false;
  try {
    listStatusChrome("busy");
  } catch {
    unknownThrew = true;
  }
  const ok =
    !threw &&
    unknownThrew &&
    LIST_STATUSES.join("|") === "empty|loading|ready|fault" &&
    policies.empty.offerAdd === false &&
    policies.empty.deadDetail === "allow" &&
    policies.loading.offerAdd === false &&
    policies.loading.deadDetail === "forbid" &&
    policies.ready.offerAdd === true &&
    policies.ready.deadDetail === "allow" &&
    policies.fault.offerAdd === false &&
    policies.fault.deadDetail === "forbid";
  results.push({ case: "list-status-union-exhausted", ok, policies });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
