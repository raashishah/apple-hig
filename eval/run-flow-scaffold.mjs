#!/usr/bin/env node
/**
 * /hig flow scaffold: four patterns, no second copy, brand stops, stopLine unchanged.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkChrome } from "../skills/hig/scripts/check-chrome.mjs";
import { loadContext } from "../skills/hig/scripts/load-context.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const skillRoot = path.join(pluginRoot, "skills", "hig");
const flowCli = path.join(skillRoot, "scripts", "hig-flow.mjs");

const results = [];

function record(caseName, ok, detail = {}) {
  results.push({ case: caseName, ok, ...detail });
}

function runFlow(cwd) {
  return spawnSync(process.execPath, [flowCli, "--cwd", cwd], { encoding: "utf8" });
}

const GRAPH = `version: 1
entry: /items
screens:
  - id: items
    route: /items
    title: Items
    kind: action
    destination: home
    list:
      status: ready
  - id: home
    route: /
    title: Home
    kind: static
  - id: create
    route: /items/new
    title: New item
    kind: static
    create:
      kind: long
      route: /items/new
`;

{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-flow-"));
  fs.mkdirSync(path.join(dir, ".hig"));
  fs.writeFileSync(path.join(dir, ".hig", "screens.yaml"), GRAPH);
  try {
    const before = loadContext(dir);
    const first = runFlow(dir);
    const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
    const css = fs.readFileSync(path.join(dir, "flow.css"), "utf8");
    const patterns = ["list", "form", "overlay", "chrome"].filter((kind) =>
      html.includes(`data-hig-pattern="${kind}"`),
    );
    const forbidden = /--hig-|font-family|Apple Pay|Sign in with Apple|biometric|type=["']search["']|>Settings</i.test(
      `${html}\n${css}`,
    );
    const report = checkChrome({ cwd: dir, skillRoot, register: "product" });
    const flowFails = report.fails
      .map((fail) => fail.id)
      .filter((id) => id.startsWith("chrome.split.") || id.startsWith("chrome.create.") || id === "chrome.list-status.lifecycle");
    const second = runFlow(dir);
    const secondJson = JSON.parse(second.stdout);
    const afterHtml = fs.readFileSync(path.join(dir, "index.html"), "utf8");
    record(
      "scaffold-four-patterns-once",
      first.status === 0 &&
        before.stopLine &&
        patterns.length === 4 &&
        !forbidden &&
        flowFails.length === 0 &&
        secondJson.wrote === false &&
        afterHtml === html &&
        (html.match(/<header\b/g) || []).length === 1,
      { patterns, flowFails, stopLine: before.stopLine, second: secondJson },
    );

    const extra = `${GRAPH}  - id: archive\n    route: /archive\n    title: Archive\n    kind: static\n`;
    fs.writeFileSync(path.join(dir, ".hig", "screens.yaml"), extra);
    const third = JSON.parse(runFlow(dir).stdout);
    const grown = fs.readFileSync(path.join(dir, "index.html"), "utf8");
    record(
      "scaffold-adds-missing-screen-once",
      third.wrote === true &&
        grown.includes('data-screen="archive"') &&
        (grown.match(/<header\b/g) || []).length === 1,
      { third },
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const src = path.join(__dirname, "fixtures", "flow-brand");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-flow-brand-"));
  fs.cpSync(src, dir, { recursive: true });
  const before = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  try {
    const run = runFlow(dir);
    const json = JSON.parse(run.stdout);
    const after = fs.readFileSync(path.join(dir, "index.html"), "utf8");
    record("brand-scaffold-stops", json.ok === false && json.reason === "brand" && after === before, {
      json,
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const cwd = path.join(__dirname, "fixtures", "unsupported");
  const context = loadContext(cwd);
  const run = runFlow(cwd);
  const json = JSON.parse(run.stdout);
  record(
    "no-graph-keeps-stop-line",
    json.ok === false &&
      json.reason === "no-graph" &&
      json.stopLine === context.stopLine &&
      typeof context.stopLine === "string" &&
      run.stderr.includes(context.stopLine),
    { stopLine: context.stopLine, json },
  );
}

const failed = results.filter((row) => !row.ok);
process.stdout.write(`${JSON.stringify({ ok: failed.length === 0, results }, null, 2)}\n`);
process.exit(failed.length === 0 ? 0 : 1);
