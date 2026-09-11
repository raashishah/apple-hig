#!/usr/bin/env node
/**
 * Dry portability checks for /hig preflight.
 * Does not mutate designed apps.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const script = path.join(root, "skills/hig/scripts/load-context.mjs");

function run(fixtureRel) {
  const cwd = path.join(__dirname, fixtureRel);
  return runAbs(cwd);
}

function runAbs(cwd) {
  const r = spawnSync(process.execPath, [script, cwd], {
    encoding: "utf8",
    cwd: root,
  });
  if (r.status !== 0) {
    throw new Error(`preflight failed for ${cwd}: ${r.stderr || r.stdout}`);
  }
  return JSON.parse(r.stdout);
}

function withAssetFlood(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-asset-flood-"));
  const src = path.join(__dirname, "fixtures/xcode-asset-flood");
  fs.cpSync(src, dir, { recursive: true });
  const assets = path.join(dir, "Assets.xcassets");
  fs.mkdirSync(assets, { recursive: true });
  for (let i = 0; i < 450; i++) {
    const slot = path.join(assets, `img-${String(i).padStart(4, "0")}.imageset`);
    fs.mkdirSync(slot, { recursive: true });
    fs.writeFileSync(
      path.join(slot, "Contents.json"),
      '{"images":[],"info":{"version":1,"author":"xcode"}}\n',
    );
  }
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const results = [];

{
  const j = run("fixtures/sparse");
  const ok = j.stack?.supported === true && j.mutation === "open" && j.stack?.kind?.includes("react");
  results.push({ case: "sparse", ok, preflight: j.HIG_PREFLIGHT, kind: j.stack?.kind });
}

{
  const j = run("fixtures/unsupported");
  const ok =
    j.stack?.supported === false &&
    j.mutation === "unsupported" &&
    typeof j.stopLine === "string";
  results.push({
    case: "unsupported",
    ok,
    preflight: j.HIG_PREFLIGHT,
    stopLine: j.stopLine,
  });
}

{
  const j = run("fixtures/brand-veto");
  const ok =
    j.register === "brand" &&
    j.brandVeto === true &&
    j.reviewAdaptMutation === "blocked";
  results.push({ case: "brand-veto", ok, preflight: j.HIG_PREFLIGHT });
}

{
  const j = run("fixtures/swift-ui");
  const ok =
    j.stack?.supported === true &&
    j.mutation === "open" &&
    (j.stack?.kind === "swiftui" || j.stack?.family === "native-apple");
  results.push({ case: "swift-ui", ok, preflight: j.HIG_PREFLIGHT, kind: j.stack?.kind });
}

{
  const j = run("fixtures/web-css");
  const ok = j.stack?.supported === true && j.mutation === "open" && j.stack?.kind === "web";
  results.push({ case: "web-css", ok, preflight: j.HIG_PREFLIGHT, kind: j.stack?.kind });
}

{
  const j = withAssetFlood((dir) => runAbs(dir));
  const ok =
    j.stack?.supported === true &&
    j.stack?.kind === "swiftui" &&
    (j.stack?.hints?.swiftFiles ?? 0) >= 1;
  results.push({
    case: "xcode-asset-flood",
    ok,
    preflight: j.HIG_PREFLIGHT,
    kind: j.stack?.kind,
    swiftFiles: j.stack?.hints?.swiftFiles,
  });
}

{
  const j = run("fixtures/swiftui-help-html");
  const ok =
    j.stack?.kind === "swiftui" &&
    j.stack?.family === "native-apple" &&
    j.stack?.hints?.incidentalWeb === true;
  results.push({
    case: "swiftui-help-html",
    ok,
    preflight: j.HIG_PREFLIGHT,
    kind: j.stack?.kind,
    family: j.stack?.family,
  });
}

{
  const j = run("fixtures/swiftui-launch-nib");
  const ok = j.stack?.kind === "swiftui" && j.stack?.family === "native-apple";
  results.push({
    case: "swiftui-launch-nib",
    ok,
    preflight: j.HIG_PREFLIGHT,
    kind: j.stack?.kind,
  });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
