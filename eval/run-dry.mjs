#!/usr/bin/env node
/**
 * Dry portability checks for /hig preflight.
 * Does not mutate designed apps.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const script = path.join(root, "skills/hig/scripts/load-context.mjs");

function run(fixtureRel) {
  const cwd = path.join(__dirname, fixtureRel);
  const r = spawnSync(process.execPath, [script, cwd], {
    encoding: "utf8",
    cwd: root,
  });
  if (r.status !== 0) {
    throw new Error(`preflight failed for ${fixtureRel}: ${r.stderr || r.stdout}`);
  }
  return JSON.parse(r.stdout);
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

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
