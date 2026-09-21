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
    surfaces.byId.settings?.affordance === "settings" &&
    surfaces.byId.undo?.affordance === "undo" &&
    !surfaces.byId.layout?.affordance &&
    !surfaces.byId.writing?.affordance &&
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
    "settings",
    "undo-and-redo",
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
  const formOnly = scanAffordances(
    walkSource(path.join(pluginRoot, "eval", "fixtures", "chrome-pass")).filter((f) =>
      /CohesiveForm/.test(f.path),
    ),
  );
  const settingsPage = scanAffordances([
    { path: "Settings.tsx", text: '<main data-settings><h1>Settings</h1></main>' },
  ]);
  const undoBar = scanAffordances([
    { path: "UndoBar.tsx", text: '<button type="button" aria-label="Undo Delete">Undo</button>' },
  ]);
  const dumpLabel = scanAffordances([
    {
      path: "CommandDump.tsx",
      text: '<input type="search" aria-label="Search settings and commands" />',
    },
  ]);
  const cancelOnly = scanAffordances([
    { path: "Form.tsx", text: '<button type="button">Cancel</button>' },
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
      !passList.includes("settings") &&
      !passList.includes("undo") &&
      cardGrid.includes("list") &&
      !navLink.includes("search") &&
      nativeSelect.includes("picker") &&
      !nativeSelect.includes("menu") &&
      !cssMenu.includes("menu") &&
      progressOnly.includes("progress") &&
      !progressOnly.includes("loading") &&
      loadingOnly.includes("loading") &&
      !loadingOnly.includes("progress") &&
      formOnly.includes("form") &&
      !formOnly.includes("settings") &&
      !formOnly.includes("undo") &&
      settingsPage.includes("settings") &&
      undoBar.includes("undo") &&
      !dumpLabel.includes("settings") &&
      !cancelOnly.includes("undo") &&
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
      catalog.byId.writing?.dontCoverageComplete === true &&
      (catalog.byId.writing?.dontHeuristicIds || []).includes("sarcastic-error-hides-fix") &&
      (catalog.byId.writing?.dontHeuristicIds || []).includes("title-case-long-help") &&
      (catalog.byId.writing?.dontHeuristicIds || []).includes("rewrite-system-alerts") &&
      catalog.byId.privacy?.dontCoverageComplete === true &&
      (catalog.byId.privacy?.dontHeuristicIds || []).includes("dark-pattern-allow-only") &&
      (catalog.byId.privacy?.dontHeuristicIds || []).includes("preemptive-permission-on-marketing") &&
      (catalog.byId.privacy?.dontHeuristicIds || []).includes("rewrite-or-automate-system-ui") &&
      catalog.byId.branding?.dontCoverageComplete === true &&
      (catalog.byId.branding?.dontHeuristicIds || []).includes("opaque-brand-bar-fills") &&
      (catalog.byId.branding?.dontHeuristicIds || []).includes("watermarks-on-content") &&
      (catalog.byId.branding?.dontHeuristicIds || []).includes("brand-outlined-sf-rewrite") &&
      catalog.byId.icons?.dontCoverageComplete === true &&
      (catalog.byId.icons?.dontHeuristicIds || []).includes("decorative-icon-duplicates-label") &&
      (catalog.byId.icons?.dontHeuristicIds || []).includes("outlined-doodles-in-toolbar") &&
      (catalog.byId.icons?.dontHeuristicIds || []).includes("sf-symbol-name-tables") &&
      catalog.byId.images?.dontCoverageComplete === true &&
      (catalog.byId.images?.dontHeuristicIds || []).includes("screenshot-empty-state") &&
      catalog.byId["app-icons"]?.dontCoverageComplete === true &&
      (catalog.byId["app-icons"]?.dontHeuristicIds || []).includes("app-icon-alpha-mask-tricks") &&
      catalog.byId.inclusion?.dontCoverageComplete === true &&
      (catalog.byId.inclusion?.dontHeuristicIds || []).includes("ability-body-jokes-empty") &&
      catalog.byId["design-principles"]?.dontCoverageComplete === false &&
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
    fs.writeFileSync(
      path.join(holdDir, "Settings.tsx"),
      `export function SettingsScreen() {
  return (
    <main data-settings>
      <h1>Settings</h1>
    </main>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(holdDir, "UndoBar.tsx"),
      `export function UndoBar() {
  return (
    <button type="button" aria-label="Undo Delete">
      Undo
    </button>
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
      "settings",
      "undo-and-redo",
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
      skipStatus.topics.writing?.state === "already-compliant" &&
      skipStatus.topics.privacy?.state === "already-compliant" &&
      skipStatus.topics.branding?.state === "already-compliant" &&
      skipStatus.topics.icons?.state === "already-compliant" &&
      skipStatus.topics.images?.state === "already-compliant" &&
      skipStatus.topics["app-icons"]?.state === "already-compliant" &&
      skipStatus.topics.inclusion?.state === "already-compliant" &&
      skipStatus.topics.settings?.state === "skipped-no-affordance" &&
      skipStatus.topics["undo-and-redo"]?.state === "skipped-no-affordance" &&
      !skipReport.plan.waveTopicIds.includes("searching") &&
      !skipReport.plan.waveTopicIds.includes("writing") &&
      !skipReport.plan.waveTopicIds.includes("branding") &&
      !skipReport.plan.waveTopicIds.includes("inclusion") &&
      skipReport.plan.waveTopicIds.includes("design-principles") &&
      !skipReport.plan.waveTopicIds.includes("menus") &&
      skipReport.plan.coverage.remaining > 0 &&
      holdStatus.topics.menus?.state === "pending" &&
      holdStatus.topics.settings?.state === "pending" &&
      holdStatus.topics["undo-and-redo"]?.state === "pending" &&
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
      skipSettings: skipStatus.topics.settings?.state,
      holdSettings: holdStatus.topics.settings?.state,
      skipUndo: skipStatus.topics["undo-and-redo"]?.state,
      holdUndo: holdStatus.topics["undo-and-redo"]?.state,
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
      writing: passStatus.topics.writing?.state === "already-compliant",
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
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-writing-pass-"));
  const cuteDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-writing-cute-"));
  const titleDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-writing-title-"));
  const alertDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-writing-alert-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, cuteDir, { recursive: true });
    fs.cpSync(src, titleDir, { recursive: true });
    fs.cpSync(src, alertDir, { recursive: true });
    const origCute = `export function OopsError() {
  return <p role="alert">Oops! Nice try, champ.</p>;
}
`;
    const origAlert = `export function FakeSignIn() {
  return (
    <div role="dialog">
      <p>Sign in with Apple to unlock exclusive magic.</p>
      <button type="button">Continue</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(cuteDir, "OopsError.tsx"), origCute);
    fs.writeFileSync(
      path.join(titleDir, "HelpCopy.tsx"),
      `export function HelpCopy() {
  return <p data-help>Please Check Your Email Address And Try Again Later</p>;
}
`,
    );
    fs.writeFileSync(path.join(alertDir, "FakeSignIn.tsx"), origAlert);
    const passReport = applyCatalog({
      cwd: passDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const cuteReport = applyCatalog({
      cwd: cuteDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const titleReport = applyCatalog({
      cwd: titleDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const alertReport = applyCatalog({
      cwd: alertDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const passStatus = parseCatalogStatus(
      fs.readFileSync(path.join(passDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const cuteStatus = parseCatalogStatus(
      fs.readFileSync(path.join(cuteDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const titleStatus = parseCatalogStatus(
      fs.readFileSync(path.join(titleDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const alertStatus = parseCatalogStatus(
      fs.readFileSync(path.join(alertDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const cute = fs.readFileSync(path.join(cuteDir, "OopsError.tsx"), "utf8");
    const help = fs.readFileSync(path.join(titleDir, "HelpCopy.tsx"), "utf8");
    const alert = fs.readFileSync(path.join(alertDir, "FakeSignIn.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(cuteDir),
      ...walkSource(titleDir),
      ...walkSource(alertDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      cuteChrome: cuteReport.chrome.pass === true,
      titleChrome: titleReport.chrome.pass === true,
      alertChrome: alertReport.chrome.pass === true,
      passWriting: passStatus.topics.writing?.state === "already-compliant",
      passPrivacy: passStatus.topics.privacy?.state === "already-compliant",
      remaining: passReport.plan.coverage.remaining > 0,
      cutePending: cuteStatus.topics.writing?.state === "pending",
      cuteUnchanged: cute === origCute,
      titleApplied: titleStatus.topics.writing?.state === "applied",
      titleSentence: /Please check your email address and try again later/.test(help),
      titleNoTitleCase: !/Please Check Your Email Address And Try Again Later/.test(help),
      alertPending: alertStatus.topics.writing?.state === "pending",
      alertUnchanged: alert === origAlert,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passWriting: passStatus.topics.writing?.state,
      cuteWriting: cuteStatus.topics.writing?.state,
      titleWriting: titleStatus.topics.writing?.state,
      alertWriting: alertStatus.topics.writing?.state,
      help,
      remaining: passReport.plan.coverage.remaining,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(cuteDir, { recursive: true, force: true });
    fs.rmSync(titleDir, { recursive: true, force: true });
    fs.rmSync(alertDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-writing-donts", ok, ...detail });
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
      status.topics.writing?.state === "already-compliant" &&
      status.topics.privacy?.state === "already-compliant" &&
      status.topics.branding?.state === "already-compliant" &&
      status.topics.icons?.state === "already-compliant" &&
      status.topics.images?.state === "already-compliant" &&
      status.topics["app-icons"]?.state === "already-compliant" &&
      status.topics.inclusion?.state === "already-compliant" &&
      status.topics["design-principles"]?.state === "pending" &&
      status.topics.menus?.state === "skipped-no-affordance" &&
      status.topics.searching?.state === "already-compliant" &&
      report.plan.coverage.remaining > 0 &&
      destUnchanged &&
      !/SF Pro|-apple-system|shadcn/i.test(hostText);
    detail = {
      remaining: report.plan.coverage.remaining,
      required: Object.fromEntries(required.map((id) => [id, status.topics[id]?.state])),
      writing: status.topics.writing?.state,
      inclusion: status.topics.inclusion?.state,
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
      status.topics.writing?.state === "already-compliant" &&
      status.topics.privacy?.state === "already-compliant" &&
      status.topics.branding?.state === "already-compliant" &&
      status.topics.icons?.state === "already-compliant" &&
      status.topics.images?.state === "already-compliant" &&
      status.topics["app-icons"]?.state === "already-compliant" &&
      status.topics.inclusion?.state === "already-compliant" &&
      status.topics["design-principles"]?.state === "pending" &&
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
      status.topics.writing?.state === "already-compliant" &&
      status.topics.privacy?.state === "already-compliant" &&
      status.topics.branding?.state === "already-compliant" &&
      status.topics.icons?.state === "already-compliant" &&
      status.topics.images?.state === "already-compliant" &&
      status.topics["app-icons"]?.state === "already-compliant" &&
      status.topics.inclusion?.state === "already-compliant" &&
      status.topics["design-principles"]?.state === "pending" &&
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

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-privacy-pass-"));
  const allowDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-privacy-allow-"));
  const hideDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-privacy-hide-"));
  const marketDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-privacy-market-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, allowDir, { recursive: true });
    fs.cpSync(src, hideDir, { recursive: true });
    fs.cpSync(src, marketDir, { recursive: true });
    const origAllow = `export function AllowOnly() {
  return (
    <div role="dialog">
      <p>Allow camera access?</p>
      <button type="button">Allow</button>
    </div>
  );
}
`;
    const origMarket = `export function Landing() {
  navigator.mediaDevices.getUserMedia({ video: true });
  return (
    <main data-marketing>
      <h1>Welcome</h1>
    </main>
  );
}
`;
    fs.writeFileSync(path.join(allowDir, "AllowOnly.tsx"), origAllow);
    fs.writeFileSync(
      path.join(hideDir, "HiddenDeny.tsx"),
      `export function HiddenDeny() {
  return (
    <div role="dialog">
      <p>Allow camera access?</p>
      <button type="button">Allow</button>
      <button type="button" className="sr-only" aria-hidden="true">
        Don't Allow
      </button>
    </div>
  );
}
`,
    );
    fs.writeFileSync(path.join(marketDir, "Landing.tsx"), origMarket);
    const passReport = applyCatalog({
      cwd: passDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const allowReport = applyCatalog({
      cwd: allowDir,
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
    const marketReport = applyCatalog({
      cwd: marketDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const passStatus = parseCatalogStatus(
      fs.readFileSync(path.join(passDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const allowStatus = parseCatalogStatus(
      fs.readFileSync(path.join(allowDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const hideStatus = parseCatalogStatus(
      fs.readFileSync(path.join(hideDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const marketStatus = parseCatalogStatus(
      fs.readFileSync(path.join(marketDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const allow = fs.readFileSync(path.join(allowDir, "AllowOnly.tsx"), "utf8");
    const hidden = fs.readFileSync(path.join(hideDir, "HiddenDeny.tsx"), "utf8");
    const market = fs.readFileSync(path.join(marketDir, "Landing.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(allowDir),
      ...walkSource(hideDir),
      ...walkSource(marketDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      allowChrome: allowReport.chrome.pass === true,
      hideChrome: hideReport.chrome.pass === true,
      marketChrome: marketReport.chrome.pass === true,
      passPrivacy: passStatus.topics.privacy?.state === "already-compliant",
      passBranding: passStatus.topics.branding?.state === "already-compliant",
      passInclusion: passStatus.topics.inclusion?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      allowPending: allowStatus.topics.privacy?.state === "pending",
      allowUnchanged: allow === origAllow,
      hideApplied: hideStatus.topics.privacy?.state === "applied",
      hideNoSr: !/\bsr-only\b/.test(hidden),
      hideNoAria: !/aria-hidden=["']true["']/.test(hidden),
      hideHasDeny: /Don't Allow/.test(hidden),
      marketPending: marketStatus.topics.privacy?.state === "pending",
      marketUnchanged: market === origMarket,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passPrivacy: passStatus.topics.privacy?.state,
      allowPrivacy: allowStatus.topics.privacy?.state,
      hidePrivacy: hideStatus.topics.privacy?.state,
      marketPrivacy: marketStatus.topics.privacy?.state,
      hidden,
      remaining: passReport.plan.coverage.remaining,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(allowDir, { recursive: true, force: true });
    fs.rmSync(hideDir, { recursive: true, force: true });
    fs.rmSync(marketDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-privacy-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-branding-pass-"));
  const markDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-branding-mark-"));
  const mixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-branding-mix-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, markDir, { recursive: true });
    fs.cpSync(src, mixDir, { recursive: true });
    const origMix = `export function MixedBar() {
  return (
    <header data-nav role="toolbar">
      <Image systemName="plus" />
      <svg fill="none" stroke="currentColor" width="16" height="16" />
    </header>
  );
}
`;
    fs.writeFileSync(
      path.join(markDir, "WatermarkedList.tsx"),
      `export function WatermarkedList() {
  return (
    <div data-list-pane>
      <img data-watermark alt="" src="/logo.svg" />
      <ul>
        <li>Item</li>
      </ul>
    </div>
  );
}
`,
    );
    fs.writeFileSync(path.join(mixDir, "MixedBar.tsx"), origMix);
    const passReport = applyCatalog({
      cwd: passDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const markReport = applyCatalog({
      cwd: markDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const mixReport = applyCatalog({
      cwd: mixDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const passStatus = parseCatalogStatus(
      fs.readFileSync(path.join(passDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const markStatus = parseCatalogStatus(
      fs.readFileSync(path.join(markDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const mixStatus = parseCatalogStatus(
      fs.readFileSync(path.join(mixDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const marked = fs.readFileSync(path.join(markDir, "WatermarkedList.tsx"), "utf8");
    const mixed = fs.readFileSync(path.join(mixDir, "MixedBar.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(markDir),
      ...walkSource(mixDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      markChrome: markReport.chrome.pass === true,
      mixChrome: mixReport.chrome.pass === true,
      passBranding: passStatus.topics.branding?.state === "already-compliant",
      passInclusion: passStatus.topics.inclusion?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      markApplied: markStatus.topics.branding?.state === "applied",
      markNoWatermark: !/data-watermark/.test(marked),
      mixPending: mixStatus.topics.branding?.state === "pending",
      mixUnchanged: mixed === origMix,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passBranding: passStatus.topics.branding?.state,
      markBranding: markStatus.topics.branding?.state,
      mixBranding: mixStatus.topics.branding?.state,
      marked,
      remaining: passReport.plan.coverage.remaining,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(markDir, { recursive: true, force: true });
    fs.rmSync(mixDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-branding-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-foundation-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-foundation-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-foundation-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "DecoHeading.tsx"),
      `export function DecoHeading() {
  return (
    <div data-list-pane>
      <h1><svg width="16" height="16" aria-hidden="true" /> Inbox</h1>
      <div data-empty className="empty-state">
        <img src="/iphone-screenshot.png" alt="screenshot of the app" />
        <p>No items yet</p>
      </div>
      <ul>
        <li>Item</li>
      </ul>
    </div>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "AppMark.tsx"),
      `export function AppMark() {
  return (
    <div
      data-app-icon
      className="app-icon"
      style={{ webkitMaskImage: "url(#mask)", borderRadius: "22%" }}
    />
  );
}
`,
    );
    const origMix = `export function MixedBar() {
  return (
    <header data-nav role="toolbar">
      <Image systemName="plus" />
      <svg fill="none" stroke="currentColor" width="16" height="16" />
    </header>
  );
}
`;
    const origJoke = `export function EmptyJoke() {
  return (
    <div data-empty className="empty-state">
      <p>This list is lame until you add items.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "MixedBar.tsx"), origMix);
    fs.writeFileSync(path.join(holdDir, "EmptyJoke.tsx"), origJoke);
    const passReport = applyCatalog({
      cwd: passDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const fixReport = applyCatalog({
      cwd: fixDir,
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
    const passStatus = parseCatalogStatus(
      fs.readFileSync(path.join(passDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const fixStatus = parseCatalogStatus(
      fs.readFileSync(path.join(fixDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const holdStatus = parseCatalogStatus(
      fs.readFileSync(path.join(holdDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const heading = fs.readFileSync(path.join(fixDir, "DecoHeading.tsx"), "utf8");
    const mark = fs.readFileSync(path.join(fixDir, "AppMark.tsx"), "utf8");
    const mixed = fs.readFileSync(path.join(holdDir, "MixedBar.tsx"), "utf8");
    const joke = fs.readFileSync(path.join(holdDir, "EmptyJoke.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passIcons: passStatus.topics.icons?.state === "already-compliant",
      passImages: passStatus.topics.images?.state === "already-compliant",
      passAppIcons: passStatus.topics["app-icons"]?.state === "already-compliant",
      passInclusion: passStatus.topics.inclusion?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      waveNotInclusion: !passReport.plan.waveTopicIds.includes("inclusion"),
      fixIcons: fixStatus.topics.icons?.state === "applied",
      fixImages: fixStatus.topics.images?.state === "applied",
      fixAppIcons: fixStatus.topics["app-icons"]?.state === "applied",
      fixInclusion: fixStatus.topics.inclusion?.state === "already-compliant",
      headingNoSvg: !/<svg\b/.test(heading),
      headingKeepsInbox: /Inbox/.test(heading),
      shotNoImg: !/<img\b/.test(heading),
      shotKeepsEmpty: /No items yet/.test(heading),
      markNoMask: !/webkitMaskImage|mask-image|borderRadius:\s*"22%"/.test(mark),
      holdIcons: holdStatus.topics.icons?.state === "pending",
      holdInclusion: holdStatus.topics.inclusion?.state === "pending",
      holdImages: holdStatus.topics.images?.state === "already-compliant",
      mixUnchanged: mixed === origMix,
      jokeUnchanged: joke === origJoke,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passIcons: passStatus.topics.icons?.state,
      passImages: passStatus.topics.images?.state,
      passAppIcons: passStatus.topics["app-icons"]?.state,
      passInclusion: passStatus.topics.inclusion?.state,
      passPrinciples: passStatus.topics["design-principles"]?.state,
      fixIcons: fixStatus.topics.icons?.state,
      fixImages: fixStatus.topics.images?.state,
      fixAppIcons: fixStatus.topics["app-icons"]?.state,
      holdIcons: holdStatus.topics.icons?.state,
      holdInclusion: holdStatus.topics.inclusion?.state,
      remaining: passReport.plan.coverage.remaining,
      heading,
      mark,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-foundation-dont-subset", ok, ...detail });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
