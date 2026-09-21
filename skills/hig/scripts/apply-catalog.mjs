#!/usr/bin/env node
/**
 * After chrome P0, account packed catalog topics whose chromeIds are clean
 * and pack Don't code spans that the host does not hit (or that we can strip).
 * Required-surface, search, writing, privacy, branding, icons, images, app-icons, inclusion, optional-widget, chrome-backed layout/materials/lists/forms/navigation, host-widget menus/pickers/progress/controls, system-chrome widgets/Live Activities/status bars/Control Center, RTL, and nested-modal sheets/alerts/modality prose Don'ts apply when every Don't has a scanner.
 * Packs with Don't bullets account through Don't scanners, not clean chromeIds. Token apply skips packs whose Don't coverage is complete.
 * Optional widget affordances skip when the host has no matching control.
 * Does not inject a kit or rewrite the host typeface.
 * Usage: node apply-catalog.mjs [--cwd host] [--write]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { applyChrome } from "./apply-chrome.mjs";
import { loadContext } from "./load-context.mjs";
import { loadSurfaces } from "./load-surfaces.mjs";
import {
  applyDontToken,
  loadCatalog,
  planGoalLoop,
  scanAffordances,
  stringifyCatalogStatus,
} from "./catalog-lib.mjs";
import { accountRequiredProseDont } from "./dont-heuristics.mjs";
import { walkSource } from "./check-chrome.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSkillRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = { cwd: process.cwd(), write: false, skillRoot: defaultSkillRoot };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cwd") out.cwd = path.resolve(argv[++i]);
    else if (a === "--skill") out.skillRoot = path.resolve(argv[++i]);
    else if (a === "--write") out.write = true;
  }
  return out;
}

function blobOf(files) {
  return files.map((f) => f.text).join("\n");
}

function accountChromeBacked(open, catalog, chrome) {
  const failIds = new Set(chrome.after.fails.map((f) => f.id));
  const mutatedIds = new Set(chrome.applied.map((a) => a.id));
  const topics = {};
  const accounted = [];
  for (const [id, row] of Object.entries(open.topics)) {
    let next = { ...row };
    if (row.state === "pending") {
      const topic = catalog.byId[id];
      const chromeIds = topic?.chromeIds || [];
      if ((topic?.dontCount || 0) > 0) {
        topics[id] = next;
        continue;
      }
      if (chromeIds.length && chromeIds.every((cid) => !failIds.has(cid))) {
        const mutated = chromeIds.some((cid) => mutatedIds.has(cid));
        next = {
          ...row,
          state: mutated ? "applied" : "already-compliant",
        };
        accounted.push({ id, state: next.state, chromeIds });
      }
    }
    topics[id] = next;
  }
  return { topics, accounted };
}

function pendingDontTokens(topics, catalog) {
  const tokens = [];
  const seen = new Set();
  for (const [id, row] of Object.entries(topics)) {
    if (row.state !== "pending") continue;
    const topic = catalog.byId[id];
    if (topic?.dontCoverageComplete) continue;
    for (const tok of topic?.dontTokens || []) {
      if (seen.has(tok)) continue;
      seen.add(tok);
      tokens.push(tok);
    }
  }
  return tokens;
}

function applyDontTokensToFiles(files, tokens) {
  const mutatedTokens = new Set();
  const appliedFiles = [];
  for (const file of files) {
    let text = file.text;
    for (const tok of tokens) {
      const next = applyDontToken(text, tok);
      if (next !== text) mutatedTokens.add(tok);
      text = next;
    }
    if (text === file.text) continue;
    file.text = text;
    appliedFiles.push(file.path);
  }
  return { mutatedTokens, appliedFiles };
}

function accountPackDont(topics, catalog, blob, mutatedTokens) {
  const accounted = [];
  const nextTopics = {};
  for (const [id, row] of Object.entries(topics)) {
    let next = { ...row };
    if (row.state === "pending") {
      const topic = catalog.byId[id];
      if (topic?.dontCoverageComplete) {
        nextTopics[id] = next;
        continue;
      }
      const tokens = topic?.dontTokens || [];
      if (tokens.length) {
        const hits = tokens.filter((tok) => blob.includes(tok));
        if (hits.length === 0) {
          const mutated = tokens.some((tok) => mutatedTokens.has(tok));
          next = {
            ...row,
            state: mutated ? "applied" : "already-compliant",
          };
          accounted.push({ id, state: next.state, tokens });
        }
      }
    }
    nextTopics[id] = next;
  }
  return { topics: nextTopics, accounted };
}

export function applyCatalog(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const skillRoot = path.resolve(options.skillRoot || defaultSkillRoot);
  const write = Boolean(options.write);
  const register = options.register;
  const chrome = applyChrome({ cwd, skillRoot, write, register });
  const chromePass = chrome.after.pass;
  const catalog = loadCatalog(skillRoot);
  const surfaces = loadSurfaces(skillRoot);
  const preflight = loadContext(cwd);
  const files = walkSource(cwd);
  const affordances = scanAffordances(files);
  const open = planGoalLoop({
    catalog,
    surfaces,
    preflight: { ...preflight, affordances },
    chromePass,
  });
  let plan = open;
  let accounted = [];
  if (chromePass) {
    const chromeNext = accountChromeBacked(open, catalog, chrome);
    accounted = chromeNext.accounted;
    let topics = chromeNext.topics;
    const tokens = pendingDontTokens(topics, catalog);
    const hitTokens = tokens.filter((tok) => blobOf(files).includes(tok));
    const dontApply = applyDontTokensToFiles(files, hitTokens);
    const afterBlob = blobOf(files);
    const packNext = accountPackDont(topics, catalog, afterBlob, dontApply.mutatedTokens);
    topics = packNext.topics;
    accounted = accounted.concat(packNext.accounted);
    const proseNext = accountRequiredProseDont({
      topics,
      catalog,
      surfaces,
      files,
    });
    topics = proseNext.topics;
    accounted = accounted.concat(proseNext.accounted);
    if (write) {
      for (const file of files) {
        const abs = path.join(cwd, file.path);
        const prev = fs.readFileSync(abs, "utf8");
        if (prev === file.text) continue;
        fs.writeFileSync(abs, file.text);
      }
    }
    plan = planGoalLoop({
      catalog,
      surfaces,
      preflight: { ...preflight, affordances: scanAffordances(files) },
      chromePass: true,
      status: { topics },
    });
  }
  const statusPath = path.join(cwd, ".hig", "catalog-status.yaml");
  if (write) {
    fs.mkdirSync(path.join(cwd, ".hig"), { recursive: true });
    fs.writeFileSync(statusPath, stringifyCatalogStatus(plan, { chromePass }));
  }
  return {
    cwd,
    write,
    chrome,
    plan,
    accounted,
    pass: chromePass,
    statusPath: path.relative(cwd, statusPath),
  };
}

function main() {
  const args = parseArgs(process.argv);
  const result = applyCatalog(args);
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(result.pass ? 0 : 1);
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
