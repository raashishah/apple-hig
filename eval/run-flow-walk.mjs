#!/usr/bin/env node
/**
 * Click-through proof. Drives check-chrome and /hig flow. Not a grammar-load alias.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkChrome } from "../skills/hig/scripts/check-chrome.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const skillRoot = path.join(pluginRoot, "skills", "hig");
const flowCli = path.join(skillRoot, "scripts", "hig-flow.mjs");

const FLOW_IDS = [
  "chrome.split.empty-select",
  "chrome.split.list-width",
  "chrome.create.short-vs-long",
  "chrome.list-status.lifecycle",
];

const results = [];

function record(caseName, ok, detail = {}) {
  results.push({ case: caseName, ok, ...detail });
}

function copyFixture(src) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-walk-"));
  fs.cpSync(src, dir, { recursive: true });
  return dir;
}

function runFlow(cwd) {
  return spawnSync(process.execPath, [flowCli, "--cwd", cwd], { encoding: "utf8" });
}

function flowFailIds(cwd) {
  const report = checkChrome({ cwd, skillRoot, register: "product" });
  return report.fails.map((fail) => fail.id).filter((id) => FLOW_IDS.includes(id));
}

function walkWeb(dir) {
  const steps = [];
  const problems = [];
  let file = "list.html";
  const seen = new Set();
  while (file && !seen.has(file) && steps.length < 8) {
    seen.add(file);
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    const step = text.match(/data-flow-step="([^"]+)"/)?.[1] ?? "";
    steps.push(step);
    if (/<a\b[^>]*data-primary[^>]*href=""/.test(text) || /<a\b[^>]*data-primary(?![^>]*href="[^"]+")[^>]*>/.test(text)) {
      problems.push(`${file}:primary-without-destination`);
    }
    if (step === "empty" && /Select (?:a|an)\b/.test(text)) problems.push("empty-select");
    if (step === "fault" && /<button\b[^>]*>\s*Add\s*<\/button>/i.test(text)) problems.push("fault-add");
    if (step === "long-create" && /data-split[\s\S]*data-create="long"/.test(text) && !/data-page="create"[\s\S]*data-create="long"/.test(text)) {
      problems.push("long-in-split");
    }
    const next = text.match(/data-flow-next href="([^"]*)"/);
    if (!next) break;
    if (!next[1]) {
      problems.push("next-without-destination");
      break;
    }
    if (next[1] === "list.html" && steps[0] === "list" && steps.length > 1) {
      steps.push("back");
      break;
    }
    file = next[1];
  }
  return { steps, problems };
}

function walkSwift(dir) {
  const texts = [];
  function walk(folder) {
    for (const ent of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith(".swift")) texts.push(fs.readFileSync(full, "utf8"));
    }
  }
  walk(dir);
  const text = texts.join("\n");
  const steps = [...text.matchAll(/flow-step:([a-z-]+)/g)].map((match) => match[1]);
  const problems = [];
  if (/Text\(\s*"Select (?:a|an) /.test(text)) problems.push("empty-select");
  if (/case\s+\.fault\s*:([\s\S]*?)(?=case\s+\.|$)/.test(text)) {
    const body = text.match(/case\s+\.fault\s*:([\s\S]*?)(?=case\s+\.|$)/)?.[1] ?? "";
    if (/Button\(\s*"Add"/.test(body)) problems.push("fault-add");
  }
  if (/NavigationSplitView[\s\S]*create-long/.test(text) && !/struct LongCreatePage/.test(text)) {
    problems.push("long-in-split");
  }
  return { steps, problems };
}

{
  const src = path.join(__dirname, "fixtures", "flow-walk-web");
  const dir = copyFixture(src);
  try {
    const first = JSON.parse(runFlow(dir).stdout);
    const second = JSON.parse(runFlow(dir).stdout);
    const walked = walkWeb(dir);
    const css = fs.readFileSync(path.join(dir, "styles.css"), "utf8");
    const fails = flowFailIds(dir);
    const expected = ["list", "empty", "short-create", "long-create", "fault", "back"];
    record(
      "web-walk-passes",
      first.ok === true &&
        second.wrote === false &&
        fails.length === 0 &&
        walked.problems.length === 0 &&
        expected.every((step, index) => walked.steps[index] === step) &&
        css.includes("min-width: 768px") &&
        css.includes("flex-direction: column"),
      { first, second, walked, fails },
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const src = path.join(__dirname, "fixtures", "flow-walk-web-bad");
  const dir = copyFixture(src);
  try {
    const flowed = JSON.parse(runFlow(dir).stdout);
    const walked = walkWeb(dir);
    const fails = flowFailIds(dir);
    const bad =
      fails.includes("chrome.split.empty-select") &&
      fails.includes("chrome.list-status.lifecycle") &&
      fails.includes("chrome.create.short-vs-long") &&
      walked.problems.includes("list.html:primary-without-destination");
    record("web-walk-fails-antipattern", flowed.ok === true && bad, { flowed, walked, fails });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const src = path.join(__dirname, "fixtures", "flow-walk-swift");
  const dir = copyFixture(src);
  try {
    const first = JSON.parse(runFlow(dir).stdout);
    const second = JSON.parse(runFlow(dir).stdout);
    const walked = walkSwift(dir);
    const fails = flowFailIds(dir);
    const expected = ["list", "empty", "short-create", "long-create", "fault", "back"];
    record(
      "swift-walk-passes",
      first.ok === true &&
        second.wrote === false &&
        fails.length === 0 &&
        walked.problems.length === 0 &&
        expected.every((step) => walked.steps.includes(step)),
      { first, second, walked, fails },
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const src = path.join(__dirname, "fixtures", "flow-walk-swift-bad");
  const dir = copyFixture(src);
  try {
    const flowed = JSON.parse(runFlow(dir).stdout);
    const walked = walkSwift(dir);
    const fails = flowFailIds(dir);
    record(
      "swift-walk-fails-antipattern",
      flowed.ok === true &&
        fails.includes("chrome.split.empty-select") &&
        fails.includes("chrome.list-status.lifecycle") &&
        fails.includes("chrome.create.short-vs-long") &&
        walked.problems.includes("empty-select") &&
        walked.problems.includes("fault-add"),
      { flowed, walked, fails },
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const failed = results.filter((row) => !row.ok);
process.stdout.write(`${JSON.stringify({ ok: failed.length === 0, results }, null, 2)}\n`);
process.exit(failed.length === 0 ? 0 : 1);
