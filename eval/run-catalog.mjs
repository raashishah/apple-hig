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
  CATALOG_FRAME_OR_FONT,
  CATALOG_SOURCE_URL,
  extractArticles,
  isTitleStub,
  loadCatalog,
  parseCatalogStatus,
  planGoalLoop,
  scanAffordances,
  selectCatalog,
} from "../skills/hig/scripts/catalog-lib.mjs";
import { runPlanCatalog } from "../skills/hig/scripts/plan-catalog.mjs";
import { applyCatalog } from "../skills/hig/scripts/apply-catalog.mjs";
import { walkSource } from "../skills/hig/scripts/check-chrome.mjs";
import { loadSurfaces } from "../skills/hig/scripts/load-surfaces.mjs";
import { fetchHigIndex } from "../skills/hig/scripts/sync-hig-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const skillRoot = path.join(pluginRoot, "skills", "hig");
const FRAME_OR_FONT = CATALOG_FRAME_OR_FONT;

function surfacesHavePatternAffordances(root) {
  const surfaces = loadSurfaces(root);
  return (
    surfaces.byId.navigation?.affordance === "chrome" &&
    surfaces.byId["lists-split"]?.affordance === "list" &&
    surfaces.byId.sheets?.affordance === "overlay" &&
    surfaces.byId.forms?.affordance === "form" &&
    !surfaces.byId.layout?.affordance &&
    surfaces.requiredIds.length === 12
  );
}

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
  const catalog = loadCatalog(skillRoot);
  const lists = catalog.byId["lists-and-tables"];
  const type = catalog.byId.typography;
  const layout = catalog.byId.layout;
  const stub = catalog.byId["tab-views"];
  const planned = planGoalLoop({
    catalog,
    surfaces: loadSurfaces(skillRoot),
    preflight: {
      platform: "unknown",
      capabilities: [],
      register: "product",
    },
    chromePass: true,
  });
  results.push({
    case: "derived-rules-from-pack-and-grammar",
    ok:
      Boolean(lists) &&
      Boolean(type) &&
      Boolean(layout) &&
      Boolean(stub) &&
      !isTitleStub(lists) &&
      !isTitleStub(type) &&
      !isTitleStub(layout) &&
      isTitleStub(stub) &&
      /Card grids posing as the master list/i.test(lists.failWhen) &&
      /Marketing hero type inside dense inventory lists/i.test(type.failWhen) &&
      (lists.chromeIds || []).includes("chrome.view-mode.icons") &&
      (layout.chromeIds || []).includes("chrome.layout.card-grid-home") &&
      !/SF Pro/i.test(type.failWhen + type.passWhen) &&
      planned.topics["lists-and-tables"]?.failWhen === lists.failWhen,
    listsStub: isTitleStub(lists),
    typeStub: isTitleStub(type),
    unpackagedStub: isTitleStub(stub),
    listChrome: lists?.chromeIds,
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

{
  const catalog = loadCatalog(skillRoot);
  const surfaces = loadSurfaces(skillRoot);
  const base = {
    platform: "unknown",
    capabilities: [],
    stack: { kind: "vue", family: "web" },
    register: "product",
  };
  const empty = planGoalLoop({
    catalog,
    surfaces,
    preflight: { ...base, affordances: [] },
    chromePass: true,
  });
  const listed = planGoalLoop({
    catalog,
    surfaces,
    preflight: { ...base, affordances: ["list"] },
    chromePass: true,
  });
  const wave0Empty = planGoalLoop({
    catalog,
    surfaces,
    preflight: { ...base, affordances: [] },
    chromePass: false,
  });
  results.push({
    case: "host-affordance-skips-missing-widgets",
    ok:
      empty.topics["lists-and-tables"]?.state === "skipped-no-affordance" &&
      empty.topics.sheets?.state === "skipped-no-affordance" &&
      empty.topics["entering-data"]?.state === "skipped-no-affordance" &&
      empty.topics["tab-bars"]?.state === "skipped-no-affordance" &&
      empty.topics.layout?.state === "pending" &&
      listed.topics["lists-and-tables"]?.state === "pending" &&
      listed.topics.sheets?.state === "skipped-no-affordance" &&
      wave0Empty.waveSurfaceIds.join(",") === surfaces.requiredIds.join(",") &&
      wave0Empty.phase === "chrome",
    emptyLists: empty.topics["lists-and-tables"]?.state,
    listedLists: listed.topics["lists-and-tables"]?.state,
    layout: empty.topics.layout?.state,
  });
}

{
  const webCss = scanAffordances(
    walkSource(path.join(pluginRoot, "eval", "fixtures", "web-css")),
  );
  const passList = scanAffordances(
    walkSource(path.join(pluginRoot, "eval", "fixtures", "chrome-pass")),
  );
  const cardGrid = scanAffordances(
    walkSource(path.join(pluginRoot, "eval", "fixtures", "chrome-antipatterns")),
  );
  results.push({
    case: "affordance-scan-is-widget-not-word",
    ok:
      webCss.includes("chrome") &&
      !webCss.includes("list") &&
      passList.includes("list") &&
      cardGrid.includes("list") &&
      surfacesHavePatternAffordances(skillRoot),
    webCss,
    passList,
    cardGrid,
  });
}

{
  let ok = false;
  let detail = {};
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-catalog-pass-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, dir, { recursive: true });
    const surfaces = loadSurfaces(skillRoot);
    const catalog = loadCatalog(skillRoot);
    const open = runPlanCatalog({
      cwd: dir,
      skillRoot,
      chromePass: true,
      write: false,
    });
    const report = applyCatalog({ cwd: dir, skillRoot, register: "product", write: true });
    const status = parseCatalogStatus(
      fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const chromeBackedPending = open.waveTopicIds.filter(
      (id) => (catalog.byId[id]?.chromeIds || []).length > 0,
    );
    const accountedIds = new Set(report.accounted.map((row) => row.id));
    const orig = fs.readFileSync(path.join(src, "CompactListBrowser.tsx"), "utf8");
    const hostText = walkSource(dir)
      .map((f) => f.text)
      .join("\n");
    const kitOrFont = /SF Pro|San Francisco|-apple-system|shadcn|@radix-ui/i.test(hostText);
    ok =
      surfaces.requiredIds.length === 12 &&
      open.coverage.remaining > 0 &&
      report.chrome.pass === true &&
      report.plan.phase === "catalog" &&
      report.plan.coverage.remaining < open.coverage.remaining &&
      chromeBackedPending.length > 0 &&
      chromeBackedPending.every((id) =>
        ["applied", "already-compliant"].includes(status.topics[id]?.state),
      ) &&
      chromeBackedPending.every((id) => accountedIds.has(id)) &&
      orig.includes("aria-label=\"List view\"") &&
      !kitOrFont;
    detail = {
      openRemaining: open.coverage.remaining,
      afterRemaining: report.plan.coverage.remaining,
      accounted: report.accounted.length,
      chromeBackedPending: chromeBackedPending.length,
      lists: status.topics["lists-and-tables"]?.state,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-accounts-chrome-backed", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-catalog-fail-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-antipatterns");
    fs.cpSync(src, dir, { recursive: true });
    const orig = fs.readFileSync(path.join(src, "surfaces", "card-grid-home.tsx"), "utf8");
    const report = applyCatalog({ cwd: dir, skillRoot, register: "product", write: true });
    const status = parseCatalogStatus(
      fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const appliedChrome = report.accounted.filter((row) => row.state === "applied");
    ok =
      report.chrome.before.pass === false &&
      report.chrome.after.pass === true &&
      report.plan.phase === "catalog" &&
      appliedChrome.length > 0 &&
      status.topics["lists-and-tables"]?.state === "applied" &&
      orig.includes("card-grid") &&
      !/SF Pro|-apple-system|shadcn/i.test(
        walkSource(dir)
          .map((f) => f.text)
          .join("\n"),
      );
    detail = {
      appliedChrome: appliedChrome.length,
      lists: status.topics["lists-and-tables"]?.state,
      remaining: report.plan.coverage.remaining,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-fixes-then-accounts", ok, ...detail });
}

{
  const catalog = loadCatalog(skillRoot);
  const buttons = catalog.byId.buttons;
  const fields = catalog.byId["text-fields"];
  const stub = catalog.byId["tab-views"];
  const rtl = catalog.byId["right-to-left"];
  results.push({
    case: "pack-chrome-gates-and-dont-tokens",
    ok:
      (buttons?.chromeIds || []).includes("chrome.view-mode.icons") &&
      (buttons?.chromeIds || []).includes("chrome.list-browser.filter-density") &&
      (fields?.chromeIds || []).includes("chrome.view-mode.icons") &&
      (rtl?.dontTokens || []).some((t) => t.includes("scaleX")) &&
      (rtl?.dontTokens || []).includes("margin-left") &&
      isTitleStub(stub) &&
      !/SF Pro|-apple-system/i.test(`${buttons?.failWhen || ""} ${rtl?.failWhen || ""}`),
    buttonChrome: buttons?.chromeIds,
    rtlTokens: rtl?.dontTokens,
    unpackagedStub: isTitleStub(stub),
  });
}

{
  let ok = false;
  let detail = {};
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-catalog-dont-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "rtl-mirror.css"),
      "html { transform: scaleX(-1); margin-left: 12px; }\n",
    );
    const origPass = fs.readFileSync(path.join(src, "CompactListBrowser.tsx"), "utf8");
    const report = applyCatalog({ cwd: dir, skillRoot, register: "product", write: true });
    const status = parseCatalogStatus(
      fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const css = fs.readFileSync(path.join(dir, "rtl-mirror.css"), "utf8");
    const hostText = walkSource(dir)
      .map((f) => f.text)
      .join("\n");
    ok =
      report.chrome.pass === true &&
      !/scaleX\(\s*-1\s*\)/.test(css) &&
      /margin-inline-start\s*:/.test(css) &&
      !/margin-left\s*:/.test(css) &&
      status.topics["right-to-left"]?.state === "applied" &&
      origPass.includes('aria-label="List view"') &&
      !/SF Pro|-apple-system|shadcn/i.test(hostText);
    detail = {
      rtlState: status.topics["right-to-left"]?.state,
      css,
      remaining: report.plan.coverage.remaining,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-pack-dont-tokens", ok, ...detail });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
