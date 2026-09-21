#!/usr/bin/env node
/**
 * Catalog inventory + goal-loop eval: live Apple index, applicability, no frozen counts.
 * Does not mutate hosts. Does not replace surfaces.yaml requiredIds.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CATALOG_SOURCE_URL,
  extractArticles,
  loadCatalog,
  parseCatalogStatus,
  planGoalLoop,
  selectCatalog,
} from "../skills/hig/scripts/catalog-lib.mjs";
import { runPlanCatalog } from "../skills/hig/scripts/plan-catalog.mjs";
import { loadSurfaces } from "../skills/hig/scripts/load-surfaces.mjs";
import { fetchHigIndex } from "../skills/hig/scripts/sync-hig-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const skillRoot = path.join(pluginRoot, "skills", "hig");
const FRAME_OR_FONT =
  /\b(SwiftUI|UIKit|React|Flutter|Vue|Angular|Svelte|SF Pro|San Francisco|-apple-system)\b/i;

const results = [];

{
  let ok = false;
  let detail = {};
  try {
    const catalog = loadCatalog(skillRoot);
    const unique = new Set(catalog.topics.map((t) => t.id));
    ok =
      catalog.version === 1 &&
      catalog.count > 0 &&
      unique.size === catalog.count &&
      catalog.topics.every((t) => t.appleUrl && t.appliesWhen && t.failWhen && t.passWhen);
    detail = { topicCount: catalog.count, fetched: catalog.fetched };
  } catch (err) {
    detail = { error: String(err.message || err) };
  }
  results.push({ case: "catalog-load", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  try {
    const catalog = loadCatalog(skillRoot);
    const index = await fetchHigIndex(CATALOG_SOURCE_URL);
    const live = extractArticles(index).map((a) => a.id).sort();
    const shipped = catalog.topics.map((t) => t.id).sort();
    const missingLive = live.filter((id) => !shipped.includes(id));
    const extraShipped = shipped.filter((id) => !live.includes(id));
    ok = missingLive.length === 0 && extraShipped.length === 0;
    detail = {
      liveCount: live.length,
      shippedCount: shipped.length,
      missingLive,
      extraShipped,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  }
  results.push({ case: "live-index-diff", ok, ...detail });
}

{
  const catalog = loadCatalog(skillRoot);
  const vue = selectCatalog(catalog, {
    platform: "phone",
    capabilities: [],
    stack: { kind: "vue", family: "web" },
  });
  const ids = vue.applicable.map((t) => t.id);
  results.push({
    case: "lists-apply-on-vue-host",
    ok: ids.includes("lists-and-tables") && ids.includes("layout"),
    hasLists: ids.includes("lists-and-tables"),
  });
}

{
  const catalog = loadCatalog(skillRoot);
  const web = selectCatalog(catalog, { platform: "unknown", capabilities: [] });
  const ids = new Set(web.applicable.map((t) => t.id));
  const skipped = new Set(web.skipped.map((t) => t.id));
  results.push({
    case: "web-skips-watch-tv-vision",
    ok:
      skipped.has("complications") &&
      skipped.has("designing-for-watchos") &&
      skipped.has("designing-for-tvos") &&
      skipped.has("designing-for-visionos") &&
      ids.has("lists-and-tables") &&
      !ids.has("complications"),
    complications: ids.has("complications") ? "applicable" : "skipped",
  });
}

{
  const catalog = loadCatalog(skillRoot);
  const hits = catalog.topics.filter((t) =>
    FRAME_OR_FONT.test(`${t.failWhen} ${t.passWhen}`),
  );
  results.push({
    case: "rules-are-design-not-framework",
    ok: hits.length === 0,
    hits: hits.map((t) => t.id),
  });
}

{
  const surfaces = loadSurfaces(skillRoot);
  const catalog = loadCatalog(skillRoot);
  const skillText = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  const watchIds = ["designing-for-watchos", "designing-for-tvos", "designing-for-visionos"];
  results.push({
    case: "apply-ssot-still-requiredIds",
    ok:
      surfaces.requiredIds.length === 12 &&
      !surfaces.requiredIds.includes("gs-iphone-duo") &&
      watchIds.every((id) => Boolean(catalog.byId[id])) &&
      skillText.includes("`requiredIds` (12) from `knowledge/surfaces.yaml`"),
    requiredCount: surfaces.requiredIds.length,
    hasWatchRows: watchIds.every((id) => Boolean(catalog.byId[id])),
  });
}

{
  const catalog = loadCatalog(skillRoot);
  const surfaces = loadSurfaces(skillRoot);
  const preflight = {
    platform: "unknown",
    capabilities: [],
    stack: { kind: "vue", family: "web" },
    register: "product",
  };
  const wave0 = planGoalLoop({ catalog, surfaces, preflight, chromePass: false });
  const after = planGoalLoop({ catalog, surfaces, preflight, chromePass: true });
  const extraPacked = after.waveSurfaceIds.filter((id) => !surfaces.requiredIds.includes(id));
  results.push({
    case: "goal-loop-wave0-then-catalog",
    ok:
      wave0.phase === "chrome" &&
      wave0.done === false &&
      wave0.waveSurfaceIds.join(",") === surfaces.requiredIds.join(",") &&
      wave0.coverage.remaining > 0 &&
      after.phase === "catalog" &&
      after.done === false &&
      extraPacked.length > 0 &&
      after.coverage.remaining > surfaces.requiredIds.length &&
      after.topics["lists-and-tables"]?.state === "pending" &&
      after.topics["complications"]?.state === "skipped-gate",
    wave0Phase: wave0.phase,
    catalogPhase: after.phase,
    extraPacked: extraPacked.length,
    remaining: after.coverage.remaining,
  });
}

{
  const catalog = loadCatalog(skillRoot);
  const surfaces = loadSurfaces(skillRoot);
  const preflight = {
    platform: "unknown",
    capabilities: [],
    stack: { kind: "vue", family: "web" },
    register: "product",
  };
  const open = planGoalLoop({ catalog, surfaces, preflight, chromePass: true });
  const status = { topics: {} };
  for (const [id, row] of Object.entries(open.topics)) {
    status.topics[id] = {
      ...row,
      state: row.state === "pending" ? "applied" : row.state,
    };
  }
  const accounted = planGoalLoop({
    catalog,
    surfaces,
    preflight,
    chromePass: true,
    status,
  });
  const beforeChrome = planGoalLoop({
    catalog,
    surfaces,
    preflight,
    chromePass: false,
    status,
  });
  const persist = planGoalLoop({
    catalog,
    surfaces,
    preflight,
    chromePass: true,
    status: {
      topics: {
        "lists-and-tables": { state: "applied", surfaceId: "lists-split" },
      },
    },
  });
  results.push({
    case: "goal-loop-done-when-accounted",
    ok:
      open.done === false &&
      accounted.done === true &&
      accounted.phase === "catalog" &&
      accounted.coverage.remaining === 0 &&
      accounted.waveTopicIds.length === 0 &&
      beforeChrome.done === false &&
      persist.topics["lists-and-tables"]?.state === "applied" &&
      !persist.waveTopicIds.includes("lists-and-tables"),
    remainingOpen: open.coverage.remaining,
    remainingAccounted: accounted.coverage.remaining,
  });
}

{
  const catalog = loadCatalog(skillRoot);
  const surfaces = loadSurfaces(skillRoot);
  const preflight = { platform: "phone", capabilities: [], register: "brand" };
  const plan = planGoalLoop({ catalog, surfaces, preflight, chromePass: true });
  const brandIds = ["tab-bars", "tab-views", "split-views", "status-bars"];
  results.push({
    case: "brand-skips-app-shell-catalog",
    ok:
      brandIds.every((id) => plan.topics[id]?.state === "n/a-register") &&
      brandIds.every((id) => !plan.waveTopicIds.includes(id)),
    states: Object.fromEntries(brandIds.map((id) => [id, plan.topics[id]?.state])),
  });
}

{
  const skillText = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  const designText = fs.readFileSync(
    path.join(skillRoot, "references", "verbs", "design.md"),
    "utf8",
  );
  results.push({
    case: "contract-does-not-stop-at-twelve",
    ok:
      skillText.includes("A 12-surface lease is not catalog done") &&
      skillText.includes("`remaining` is 0") &&
      skillText.includes("catalog waves continue until accounted") &&
      designText.includes("Do not print catalog done after only 12 surfaces") &&
      designText.includes("HIG_CATALOG:"),
    hasCatalogDoneShape: designText.includes("HIG_CATALOG:"),
  });
}

{
  let ok = false;
  let detail = {};
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-plan-catalog-"));
  try {
    const fixture = path.join(pluginRoot, "eval", "fixtures", "web-css");
    fs.cpSync(fixture, dir, { recursive: true });
    const planned = runPlanCatalog({
      cwd: dir,
      skillRoot,
      chromePass: false,
      write: true,
    });
    const statusPath = path.join(dir, ".hig", "catalog-status.yaml");
    const parsed = parseCatalogStatus(fs.readFileSync(statusPath, "utf8"));
    ok =
      planned.phase === "chrome" &&
      planned.done === false &&
      planned.waveSurfaceIds.join(",") === loadSurfaces(skillRoot).requiredIds.join(",") &&
      parsed.phase === "chrome" &&
      parsed.chromePass === false &&
      parsed.done === false &&
      parsed.remaining === planned.coverage.remaining &&
      parsed.topics.complications?.state === "skipped-gate" &&
      parsed.loaded === loadCatalog(skillRoot).count;
    detail = {
      phase: planned.phase,
      remaining: parsed.remaining,
      loaded: parsed.loaded,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "plan-catalog-writes-status", ok, ...detail });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
