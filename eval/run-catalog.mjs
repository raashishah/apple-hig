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
    surfaces.byId.menus?.affordance === "menu" &&
    surfaces.byId.pickers?.affordance === "picker" &&
    surfaces.byId.progress?.affordance === "progress" &&
    surfaces.byId.search?.affordance === "search" &&
    surfaces.byId.notifications?.affordance === "notification" &&
    surfaces.byId.loading?.affordance === "loading" &&
    surfaces.byId.feedback?.affordance === "feedback" &&
    surfaces.byId.onboarding?.affordance === "onboarding" &&
    surfaces.byId["drag-and-drop"]?.affordance === "drag" &&
    !surfaces.byId.layout?.affordance &&
    !surfaces.byId.writing?.affordance &&
    !surfaces.byId.settings?.affordance &&
    !surfaces.byId.undo?.affordance &&
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
  const searched = planGoalLoop({
    catalog,
    surfaces,
    preflight: { ...base, affordances: ["search"] },
    chromePass: true,
  });
  const optionalSkip = [
    "menus",
    "pickers",
    "steppers",
    "progress-indicators",
    "managing-notifications",
    "loading",
    "feedback",
    "onboarding",
    "drag-and-drop",
  ];
  results.push({
    case: "host-affordance-skips-missing-widgets",
    ok:
      empty.topics["lists-and-tables"]?.state === "skipped-no-affordance" &&
      empty.topics.sheets?.state === "skipped-no-affordance" &&
      empty.topics["entering-data"]?.state === "skipped-no-affordance" &&
      empty.topics["tab-bars"]?.state === "skipped-no-affordance" &&
      optionalSkip.every((id) => empty.topics[id]?.state === "skipped-no-affordance") &&
      empty.topics.searching?.state === "skipped-no-affordance" &&
      empty.topics["search-fields"]?.state === "skipped-no-affordance" &&
      empty.topics.layout?.state === "pending" &&
      empty.topics.writing?.state === "pending" &&
      listed.topics["lists-and-tables"]?.state === "pending" &&
      listed.topics.sheets?.state === "skipped-no-affordance" &&
      listed.topics.menus?.state === "skipped-no-affordance" &&
      searched.topics.searching?.state === "pending" &&
      searched.topics["search-fields"]?.state === "pending" &&
      searched.topics.menus?.state === "skipped-no-affordance" &&
      searched.topics["lists-and-tables"]?.state === "skipped-no-affordance" &&
      wave0Empty.waveSurfaceIds.join(",") === surfaces.requiredIds.join(",") &&
      wave0Empty.phase === "chrome",
    emptyLists: empty.topics["lists-and-tables"]?.state,
    listedLists: listed.topics["lists-and-tables"]?.state,
    emptyMenus: empty.topics.menus?.state,
    searchedSearch: searched.topics.searching?.state,
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
  const navLink = scanAffordances([
    { path: "SystemNav.tsx", text: '<a href="/search">Search</a>' },
  ]);
  const nativeSelect = scanAffordances([
    { path: "Picker.tsx", text: "<select name=\"country\"><option>US</option></select>" },
  ]);
  const cssMenu = scanAffordances([
    { path: "motion-bounce.css", text: ".menu { animation: bounce 400ms; }\n" },
  ]);
  const progressOnly = scanAffordances([
    { path: "Load.tsx", text: '<progress value="0.4" max="1" />' },
  ]);
  const loadingOnly = scanAffordances([
    { path: "Skeleton.tsx", text: '<div data-skeleton aria-busy="true" />' },
  ]);
  results.push({
    case: "affordance-scan-is-widget-not-word",
    ok:
      webCss.includes("chrome") &&
      !webCss.includes("list") &&
      !webCss.includes("search") &&
      !webCss.includes("menu") &&
      passList.includes("list") &&
      passList.includes("search") &&
      passList.includes("form") &&
      passList.includes("chrome") &&
      !passList.includes("menu") &&
      !passList.includes("picker") &&
      !passList.includes("progress") &&
      !passList.includes("overlay") &&
      !passList.includes("notification") &&
      !passList.includes("loading") &&
      !passList.includes("feedback") &&
      !passList.includes("onboarding") &&
      !passList.includes("drag") &&
      cardGrid.includes("list") &&
      !navLink.includes("search") &&
      nativeSelect.includes("picker") &&
      !nativeSelect.includes("menu") &&
      !cssMenu.includes("menu") &&
      progressOnly.includes("progress") &&
      !progressOnly.includes("loading") &&
      loadingOnly.includes("loading") &&
      !loadingOnly.includes("progress") &&
      surfacesHavePatternAffordances(skillRoot),
    webCss,
    passList,
    cardGrid,
    navLink,
    nativeSelect,
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

{
  const catalog = loadCatalog(skillRoot);
  const required = ["typography", "color", "motion", "accessibility"];
  results.push({
    case: "required-prose-dont-heuristics-cover",
    ok:
      required.every((id) => catalog.byId[id]?.dontCoverageComplete === true) &&
      (catalog.byId.typography?.dontHeuristicIds || []).includes("hero-type-in-lists") &&
      (catalog.byId.color?.dontHeuristicIds || []).includes("rainbow-nav-accents") &&
      (catalog.byId.motion?.dontHeuristicIds || []).includes("bounce-on-appear") &&
      (catalog.byId.accessibility?.dontHeuristicIds || []).includes("placeholder-only-label") &&
      catalog.byId.writing?.dontCoverageComplete === false &&
      catalog.byId.menus?.dontCoverageComplete === false &&
      catalog.byId.searching?.dontCoverageComplete === true &&
      catalog.byId["search-fields"]?.dontCoverageComplete === true &&
      (catalog.byId.searching?.dontHeuristicIds || []).includes("hide-only-path-behind-search") &&
      loadSurfaces(skillRoot).requiredIds.length === 12,
    typeIds: catalog.byId.typography?.dontHeuristicIds,
    writingCovered: catalog.byId.writing?.dontCoverageComplete,
  });
}

{
  let ok = false;
  let detail = {};
  const skipDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-optional-skip-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-optional-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, skipDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(holdDir, "CommandMenu.tsx"),
      `export function CommandMenu() {
  return (
    <div role="menu">
      <button type="button" role="menuitem">Share</button>
    </div>
  );
}
`,
    );
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const skipReport = applyCatalog({
      cwd: skipDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const holdReport = applyCatalog({
      cwd: holdDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const skipStatus = parseCatalogStatus(
      fs.readFileSync(path.join(skipDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const holdStatus = parseCatalogStatus(
      fs.readFileSync(path.join(holdDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const optionalSkip = [
      "menus",
      "pickers",
      "steppers",
      "progress-indicators",
      "managing-notifications",
      "loading",
      "feedback",
      "onboarding",
      "drag-and-drop",
    ];
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(skipDir, name), "utf8") === origPass[name],
    );
    const skipText = walkSource(skipDir)
      .map((f) => f.text)
      .join("\n");
    const holdText = walkSource(holdDir)
      .map((f) => f.text)
      .join("\n");
    ok =
      loadSurfaces(skillRoot).requiredIds.length === 12 &&
      skipReport.chrome.pass === true &&
      holdReport.chrome.pass === true &&
      optionalSkip.every((id) => skipStatus.topics[id]?.state === "skipped-no-affordance") &&
      skipStatus.topics.searching?.state === "already-compliant" &&
      skipStatus.topics["search-fields"]?.state === "already-compliant" &&
      skipStatus.topics.writing?.state === "pending" &&
      skipStatus.topics.settings?.state === "pending" &&
      skipStatus.topics["undo-and-redo"]?.state === "pending" &&
      !skipReport.plan.waveTopicIds.includes("searching") &&
      skipReport.plan.waveTopicIds.includes("writing") &&
      !skipReport.plan.waveTopicIds.includes("menus") &&
      skipReport.plan.coverage.remaining > 0 &&
      holdStatus.topics.menus?.state === "pending" &&
      holdStatus.topics.pickers?.state === "skipped-no-affordance" &&
      holdStatus.topics.searching?.state === "already-compliant" &&
      destUnchanged &&
      !/SF Pro|-apple-system|shadcn/i.test(skipText) &&
      !/SF Pro|-apple-system|shadcn/i.test(holdText);
    detail = {
      skipRemaining: skipReport.plan.coverage.remaining,
      holdRemaining: holdReport.plan.coverage.remaining,
      skipMenus: skipStatus.topics.menus?.state,
      holdMenus: holdStatus.topics.menus?.state,
      searching: skipStatus.topics.searching?.state,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(skipDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-optional-widget-affordance", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-search-pass-"));
  const hideDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-search-hide-"));
  const spinDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-search-spin-"));
  const dumpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-search-dump-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, hideDir, { recursive: true });
    fs.cpSync(src, spinDir, { recursive: true });
    fs.cpSync(src, dumpDir, { recursive: true });
    fs.writeFileSync(
      path.join(hideDir, "CompactListBrowser.tsx"),
      `export function CompactListBrowser() {
  return (
    <div>
      <input type="search" aria-label="Search inventory" />
    </div>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(spinDir, "Typeahead.tsx"),
      `export function Typeahead() {
  return (
    <div aria-busy="true">
      <input type="search" aria-label="Find" onChange={() => setBusy(true)} />
      <span className="spinner"></span>
    </div>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(dumpDir, "CommandDump.tsx"),
      `export function CommandDump() {
  return <input type="search" aria-label="Search settings and commands" />;
}
`,
    );
    const origPass = fs.readFileSync(path.join(src, "CompactListBrowser.tsx"), "utf8");
    const passReport = applyCatalog({
      cwd: passDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const hideReport = applyCatalog({
      cwd: hideDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const spinReport = applyCatalog({
      cwd: spinDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const dumpReport = applyCatalog({
      cwd: dumpDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const passStatus = parseCatalogStatus(
      fs.readFileSync(path.join(passDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const hideStatus = parseCatalogStatus(
      fs.readFileSync(path.join(hideDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const spinStatus = parseCatalogStatus(
      fs.readFileSync(path.join(spinDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const dumpStatus = parseCatalogStatus(
      fs.readFileSync(path.join(dumpDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const hideList = fs.readFileSync(path.join(hideDir, "CompactListBrowser.tsx"), "utf8");
    const spin = fs.readFileSync(path.join(spinDir, "Typeahead.tsx"), "utf8");
    const dump = fs.readFileSync(path.join(dumpDir, "CommandDump.tsx"), "utf8");
    const origDump = `export function CommandDump() {
  return <input type="search" aria-label="Search settings and commands" />;
}
`;
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(hideDir),
      ...walkSource(spinDir),
      ...walkSource(dumpDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      hideChrome: hideReport.chrome.pass === true,
      spinChrome: spinReport.chrome.pass === true,
      dumpChrome: dumpReport.chrome.pass === true,
      passSearching: passStatus.topics.searching?.state === "already-compliant",
      passFields: passStatus.topics["search-fields"]?.state === "already-compliant",
      passUnchanged:
        fs.readFileSync(path.join(passDir, "CompactListBrowser.tsx"), "utf8") === origPass,
      hidePending: hideStatus.topics.searching?.state === "pending",
      hideNoList: !/<(ul|ol|table)\b/i.test(hideList),
      spinApplied: spinStatus.topics.searching?.state === "applied",
      spinNoBusy: !/aria-busy=["']true["']/.test(spin),
      spinNoSpinner: !/\bspinner\b/i.test(spin),
      spinHasSearch: /type=["']search["']/.test(spin),
      dumpPending: dumpStatus.topics.searching?.state === "pending",
      dumpUnchanged: dump === origDump,
      writing: passStatus.topics.writing?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passSearch: passStatus.topics.searching?.state,
      hideSearch: hideStatus.topics.searching?.state,
      spinSearch: spinStatus.topics.searching?.state,
      dumpSearch: dumpStatus.topics.searching?.state,
      spin,
      remaining: passReport.plan.coverage.remaining,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(hideDir, { recursive: true, force: true });
    fs.rmSync(spinDir, { recursive: true, force: true });
    fs.rmSync(dumpDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-search-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-catalog-prose-pass-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, dir, { recursive: true });
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const report = applyCatalog({ cwd: dir, skillRoot, register: "product", write: true });
    const status = parseCatalogStatus(
      fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const hostText = walkSource(dir)
      .map((f) => f.text)
      .join("\n");
    const required = ["typography", "color", "motion", "accessibility"];
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(dir, name), "utf8") === origPass[name],
    );
    ok =
      report.chrome.pass === true &&
      required.every((id) => status.topics[id]?.state === "already-compliant") &&
      status.topics.writing?.state === "pending" &&
      status.topics.menus?.state === "skipped-no-affordance" &&
      status.topics.searching?.state === "already-compliant" &&
      report.plan.coverage.remaining > 0 &&
      destUnchanged &&
      !/SF Pro|-apple-system|shadcn/i.test(hostText);
    detail = {
      remaining: report.plan.coverage.remaining,
      required: Object.fromEntries(required.map((id) => [id, status.topics[id]?.state])),
      writing: status.topics.writing?.state,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-required-prose-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-catalog-prose-fix-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "BareField.tsx"),
      'export function BareField() {\n  return <input placeholder="Email address" />;\n}\n',
    );
    fs.writeFileSync(
      path.join(dir, "LoudList.tsx"),
      `export function LoudList() {
  return (
    <div data-list-pane>
      <h1 style={{ fontSize: 120, textTransform: "uppercase" }}>INVENTORY HERO</h1>
      <ul><li>Item</li></ul>
    </div>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(dir, "motion-bounce.css"),
      ".menu { animation: bounce 400ms; transform: scale(1.2); }\n",
    );
    fs.writeFileSync(
      path.join(dir, "chrome-black.css"),
      "header { background: #000; color: #fff; }\n",
    );
    const report = applyCatalog({ cwd: dir, skillRoot, register: "product", write: true });
    const status = parseCatalogStatus(
      fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const field = fs.readFileSync(path.join(dir, "BareField.tsx"), "utf8");
    const list = fs.readFileSync(path.join(dir, "LoudList.tsx"), "utf8");
    const motion = fs.readFileSync(path.join(dir, "motion-bounce.css"), "utf8");
    const chromeCss = fs.readFileSync(path.join(dir, "chrome-black.css"), "utf8");
    const hostText = walkSource(dir)
      .map((f) => f.text)
      .join("\n");
    ok =
      report.chrome.pass === true &&
      status.topics.accessibility?.state === "applied" &&
      status.topics.typography?.state === "applied" &&
      status.topics.motion?.state === "applied" &&
      status.topics.color?.state === "applied" &&
      /aria-label="Email address"/.test(field) &&
      /placeholder="Email address"/.test(field) &&
      !/fontSize:\s*120/.test(list) &&
      !/textTransform:\s*"uppercase"/.test(list) &&
      /fontSize:\s*17/.test(list) &&
      /prefers-reduced-motion/.test(motion) &&
      !/\bbounce\b/i.test(motion) &&
      !/background:\s*#000/.test(chromeCss) &&
      !/#fff/i.test(chromeCss) &&
      status.topics.writing?.state === "pending" &&
      status.topics.menus?.state === "skipped-no-affordance" &&
      status.topics.searching?.state === "already-compliant" &&
      report.plan.coverage.remaining > 0 &&
      !/SF Pro|-apple-system|shadcn/i.test(hostText);
    detail = {
      remaining: report.plan.coverage.remaining,
      a11y: status.topics.accessibility?.state,
      type: status.topics.typography?.state,
      motion: status.topics.motion?.state,
      color: status.topics.color?.state,
      field,
      list,
      motionCss: motion,
      chromeCss,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-required-prose-fixes", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-catalog-prose-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "rainbow-nav.tsx"),
      `export function RainbowNav() {
  return (
    <nav>
      <a style={{ color: "rgb(225, 29, 72)" }}>One</a>
      <a style={{ color: "#22c55e" }}>Two</a>
      <a style={{ color: "rgb(59, 130, 246)" }}>Three</a>
      <a style={{ color: "#f59e0b" }}>Four</a>
    </nav>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(dir, "many-fonts.css"),
      `.a { font-family: Recoleta, serif; }
.b { font-family: Inter, sans-serif; }
.c { font-family: "Courier New", monospace; }
.d { font-family: Georgia, serif; }
.e { font-family: Papyrus, fantasy; }
`,
    );
    const origFonts = fs.readFileSync(path.join(dir, "many-fonts.css"), "utf8");
    const origRainbow = fs.readFileSync(path.join(dir, "rainbow-nav.tsx"), "utf8");
    const report = applyCatalog({ cwd: dir, skillRoot, register: "product", write: true });
    const status = parseCatalogStatus(
      fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const fonts = fs.readFileSync(path.join(dir, "many-fonts.css"), "utf8");
    const rainbow = fs.readFileSync(path.join(dir, "rainbow-nav.tsx"), "utf8");
    const hostText = walkSource(dir)
      .map((f) => f.text)
      .join("\n");
    ok =
      report.chrome.pass === true &&
      status.topics.color?.state === "pending" &&
      status.topics.typography?.state === "pending" &&
      status.topics.accessibility?.state === "already-compliant" &&
      status.topics.writing?.state === "pending" &&
      status.topics.menus?.state === "skipped-no-affordance" &&
      status.topics.searching?.state === "already-compliant" &&
      report.plan.coverage.remaining > 0 &&
      fonts === origFonts &&
      rainbow === origRainbow &&
      /Recoleta/.test(fonts) &&
      !/SF Pro|-apple-system|shadcn/i.test(hostText);
    detail = {
      color: status.topics.color?.state,
      type: status.topics.typography?.state,
      a11y: status.topics.accessibility?.state,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-prose-dont-holds-unfixable", ok, ...detail });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
