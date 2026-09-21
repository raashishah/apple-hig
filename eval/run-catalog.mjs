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
    surfaces.byId.sliders?.affordance === "slider" &&
    surfaces.byId["scroll-views"]?.affordance === "scroll" &&
    surfaces.byId.popovers?.affordance === "popover" &&
    surfaces.byId.collections?.affordance === "collection" &&
    surfaces.byId["page-controls"]?.affordance === "pagecontrol" &&
    surfaces.byId.labels?.affordance === "label" &&
    surfaces.byId["text-views"]?.affordance === "textview" &&
    surfaces.byId["image-views"]?.affordance === "imageview" &&
    surfaces.byId.charts?.affordance === "chart" &&
    surfaces.byId["disclosure-controls"]?.affordance === "disclosure" &&
    surfaces.byId.boxes?.affordance === "box" &&
    surfaces.byId["edit-menus"]?.affordance === "editmenu" &&
    surfaces.byId["offering-help"]?.affordance === "help" &&
    surfaces.byId["web-views"]?.affordance === "webview" &&
    surfaces.byId["activity-views"]?.affordance === "activityview" &&
    surfaces.byId.printing?.affordance === "print" &&
    surfaces.byId["going-full-screen"]?.affordance === "fullscreen" &&
    surfaces.byId["file-management"]?.affordance === "filebrowser" &&
    surfaces.byId["focus-and-selection"]?.affordance === "focus" &&
    surfaces.byId["managing-accounts"]?.affordance === "account" &&
    surfaces.byId["tab-views"]?.affordance === "tabview" &&
    surfaces.byId.multitasking?.affordance === "multitask" &&
    surfaces.byId["ratings-and-reviews"]?.affordance === "reviewprompt" &&
    surfaces.byId.windows?.affordance === "appwindow" &&
    surfaces.byId["playing-video"]?.affordance === "videoplayer" &&
    surfaces.byId["playing-haptics"]?.affordance === "haptic" &&
    surfaces.byId.airplay?.affordance === "airplay" &&
    surfaces.byId["gyro-and-accelerometer"]?.affordance === "gyro" &&
    surfaces.byId["home-screen-quick-actions"]?.affordance === "quickaction" &&
    surfaces.byId["live-viewing-apps"]?.affordance === "liveviewing" &&
    surfaces.byId.snippets?.affordance === "snippet" &&
    surfaces.byId["generative-ai"]?.affordance === "genai" &&
    surfaces.byId["always-on"]?.affordance === "alwayson" &&
    surfaces.byId.shareplay?.affordance === "shareplay" &&
    surfaces.byId["nearby-interactions"]?.affordance === "nearby" &&
    surfaces.byId["activity-rings"]?.affordance === "activityring" &&
    surfaces.byId.nfc?.affordance === "nfc" &&
    surfaces.byId["augmented-reality"]?.affordance === "ar" &&
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
  const stub = catalog.byId["the-menu-bar"];
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
    "sliders",
    "scroll-views",
    "popovers",
    "collections",
    "page-controls",
    "labels",
    "text-views",
    "image-views",
    "charts",
    "charting-data",
    "disclosure-controls",
    "boxes",
    "edit-menus",
    "offering-help",
    "web-views",
    "activity-views",
    "printing",
    "going-full-screen",
    "file-management",
    "focus-and-selection",
    "managing-accounts",
    "tab-views",
    "multitasking",
    "ratings-and-reviews",
    "windows",
    "playing-video",
    "playing-haptics",
    "airplay",
    "gyro-and-accelerometer",
    "home-screen-quick-actions",
    "live-viewing-apps",
    "snippets",
    "generative-ai",
    "always-on",
    "shareplay",
    "nearby-interactions",
    "activity-rings",
    "nfc",
    "augmented-reality",
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
  const rangeOnly = scanAffordances([
    { path: "Bright.tsx", text: '<input type="range" min="0" max="100" />' },
  ]);
  const bodyOverflow = scanAffordances([
    { path: "page.css", text: "html, body { overflow-y: auto; }\n" },
  ]);
  const paneOverflow = scanAffordances([
    { path: "Pane.tsx", text: '<div className="overflow-y-auto">More</div>' },
  ]);
  const dialogOnly = scanAffordances([
    { path: "Sheet.tsx", text: "<dialog open>Share</dialog>" },
  ]);
  const popoverOnly = scanAffordances([
    { path: "Tip.tsx", text: '<div popover="auto">Share</div>' },
  ]);
  const collectionOnly = scanAffordances([
    { path: "Gallery.tsx", text: '<div data-collection><img alt="" /></div>' },
  ]);
  const listOnly = scanAffordances([
    { path: "Rows.tsx", text: "<ul><li>Item A</li></ul>" },
  ]);
  const pageControlOnly = scanAffordances([
    { path: "Pager.tsx", text: '<div data-page-control><button type="button" /></div>' },
  ]);
  const numberedPages = scanAffordances([
    { path: "Pages.tsx", text: '<nav><a href="?p=1">1</a><a href="?p=2">2</a></nav>' },
  ]);
  const ariaOnly = scanAffordances([
    { path: "Icon.tsx", text: '<button type="button" aria-label="Save" />' },
  ]);
  const staticLabel = scanAffordances([
    { path: "Caption.tsx", text: "<p data-label>Inbox</p>" },
  ]);
  const textareaOnly = scanAffordances([
    { path: "Notes.tsx", text: "<textarea name=\"bio\"></textarea>" },
  ]);
  const inputOnly = scanAffordances([
    { path: "Field.tsx", text: '<input name="displayName" />' },
  ]);
  const imgOnly = scanAffordances([
    { path: "Hero.tsx", text: '<img alt="Hero" src="/hero.jpg" />' },
  ]);
  const imageViewOnly = scanAffordances([
    { path: "Photo.tsx", text: '<div data-image-view><img alt="" src="/photo.jpg" /></div>' },
  ]);
  const chartOnly = scanAffordances([
    { path: "Plot.tsx", text: '<div data-chart><span>Steps</span></div>' },
  ]);
  const tableOnly = scanAffordances([
    { path: "Nums.tsx", text: "<table><tr><td>12</td></tr></table>" },
  ]);
  const svgOnly = scanAffordances([
    { path: "Icon.tsx", text: '<svg width="16" height="16" aria-hidden="true" />' },
  ]);
  const disclosureOnly = scanAffordances([
    {
      path: "More.tsx",
      text: "<details><summary>Advanced</summary><p>More</p></details>",
    },
  ]);
  const expandedOnly = scanAffordances([
    {
      path: "Bar.tsx",
      text: '<button type="button" aria-expanded="false">More</button>',
    },
  ]);
  const boxOnly = scanAffordances([
    { path: "Group.tsx", text: "<div data-box><p>Related</p></div>" },
  ]);
  const cardOnly = scanAffordances([
    { path: "Card.tsx", text: '<div class="card"><p>Item</p></div>' },
  ]);
  const fieldsetOnly = scanAffordances([
    {
      path: "Set.tsx",
      text: "<fieldset><legend>Name</legend><input /></fieldset>",
    },
  ]);
  const editMenuOnly = scanAffordances([
    {
      path: "Edit.tsx",
      text: '<div data-edit-menu><button type="button">Look Up</button></div>',
    },
  ]);
  const commandMenuOnly = scanAffordances([
    {
      path: "Command.tsx",
      text: '<div role="menu"><button type="button" role="menuitem">Share</button></div>',
    },
  ]);
  const helpOnly = scanAffordances([
    {
      path: "Tip.tsx",
      text: "<div data-help>Swipe the canvas to add a stop.</div>",
    },
  ]);
  const titledButton = scanAffordances([
    {
      path: "Save.tsx",
      text: '<button type="button" title="Save">Save</button>',
    },
  ]);
  const onboardingOnly = scanAffordances([
    {
      path: "FirstRun.tsx",
      text: "<div data-onboarding><p>Welcome</p></div>",
    },
  ]);
  const iframeOnly = scanAffordances([
    {
      path: "Embed.tsx",
      text: '<iframe src="https://example.com" title="Article"></iframe>',
    },
  ]);
  const pageOnly = scanAffordances([
    {
      path: "index.html",
      text: "<html><body><p>Hello</p></body></html>",
    },
  ]);
  const activityOnly = scanAffordances([
    {
      path: "Share.tsx",
      text: '<div data-activity-view><button type="button">Print</button></div>',
    },
  ]);
  const shareWordOnly = scanAffordances([
    {
      path: "Nav.tsx",
      text: '<a href="/share">Share</a>',
    },
  ]);
  const printOnly = scanAffordances([
    {
      path: "Print.tsx",
      text: '<button type="button" data-print>Print</button>',
    },
  ]);
  const fullscreenOnly = scanAffordances([
    {
      path: "Stage.tsx",
      text: '<div data-fullscreen><button type="button">Enter Full Screen</button></div>',
    },
  ]);
  const vhOnly = scanAffordances([
    {
      path: "Hero.tsx",
      text: '<div style={{ height: "100vh" }}>Hero</div>',
    },
  ]);
  const videoOnly = scanAffordances([
    {
      path: "Clip.tsx",
      text: '<video src="clip.mp4" controls></video>',
    },
  ]);
  const fileBrowserOnly = scanAffordances([
    {
      path: "Docs.tsx",
      text: '<div data-file-browser><button type="button">Open</button></div>',
    },
  ]);
  const fileInputOnly = scanAffordances([
    {
      path: "Upload.tsx",
      text: '<input type="file" />',
    },
  ]);
  const focusOnly = scanAffordances([
    {
      path: "Stage.tsx",
      text: '<div data-focus-system><button type="button">Item</button></div>',
    },
  ]);
  const cssFocusOnly = scanAffordances([
    {
      path: "focus.css",
      text: "button:focus { outline: 2px solid blue; }",
    },
  ]);
  const tabindexOnly = scanAffordances([
    {
      path: "Tab.tsx",
      text: '<button type="button" tabindex="0">Go</button>',
    },
  ]);
  const autofocusOnly = scanAffordances([
    {
      path: "Auto.tsx",
      text: '<input autofocus />',
    },
  ]);
  const accountOnly = scanAffordances([
    {
      path: "Gate.tsx",
      text: '<div data-account><button type="button">Sign In</button></div>',
    },
  ]);
  const passwordOnly = scanAffordances([
    {
      path: "Secret.tsx",
      text: '<input type="password" />',
    },
  ]);
  const siwaOnly = scanAffordances([
    {
      path: "Apple.tsx",
      text: '<button type="button">Sign in with Apple</button>',
    },
  ]);
  const tabViewOnly = scanAffordances([
    {
      path: "Panes.tsx",
      text: '<div data-tab-view><div role="tablist"><button type="button" role="tab">One</button></div><div role="tabpanel">Pane</div></div>',
    },
  ]);
  const tabBarOnly = scanAffordances([
    {
      path: "Tabs.tsx",
      text: '<nav data-nav><a href="/home">Home</a><a href="/search">Search</a></nav>',
    },
  ]);
  const tablistOnly = scanAffordances([
    {
      path: "Seg.tsx",
      text: '<div role="tablist"><button type="button" role="tab">A</button></div>',
    },
  ]);
  const multitaskOnly = scanAffordances([
    {
      path: "Session.tsx",
      text: '<div data-multitask><video src="clip.mp4"></video></div>',
    },
  ]);
  const reviewPromptOnly = scanAffordances([
    {
      path: "Rate.tsx",
      text: '<div data-rating-prompt><button type="button">Rate</button></div>',
    },
  ]);
  const starOnly = scanAffordances([
    {
      path: "Stars.tsx",
      text: "<span>★★★☆☆</span>",
    },
  ]);
  const appWindowOnly = scanAffordances([
    {
      path: "Stage.tsx",
      text: '<div data-window><button type="button">Title</button></div>',
    },
  ]);
  const uiWindowOnly = scanAffordances([
    {
      path: "AppDelegate.swift",
      text: "var window: UIWindow?",
    },
  ]);
  const liveViewingOnly = scanAffordances([
    {
      path: "Live.tsx",
      text: '<div data-live-viewing><button type="button">Watch</button></div>',
    },
  ]);
  const snippetOnly = scanAffordances([
    {
      path: "Result.tsx",
      text: '<div data-snippet><button type="button">Done</button></div>',
    },
  ]);
  const appShortcutOnly = scanAffordances([
    {
      path: "Shortcut.swift",
      text: "struct OpenApp: AppShortcut {}",
    },
  ]);
  const genaiOnly = scanAffordances([
    {
      path: "Draft.tsx",
      text: '<div data-generative><button type="button">Draft</button></div>',
    },
  ]);
  const aiCopyOnly = scanAffordances([
    {
      path: "Marketing.tsx",
      text: "<p>Our AI writes drafts for you.</p>",
    },
  ]);
  const alwaysOnOnly = scanAffordances([
    {
      path: "Glance.tsx",
      text: '<div data-always-on><button type="button">Glance</button></div>',
    },
  ]);
  const dimCssOnly = scanAffordances([
    {
      path: "Dim.css",
      text: ".hero { opacity: 0.4; }",
    },
  ]);
  const shareplayOnly = scanAffordances([
    {
      path: "Watch.tsx",
      text: '<div data-shareplay><button type="button">Join</button></div>',
    },
  ]);
  const nearbyOnly = scanAffordances([
    {
      path: "Pair.tsx",
      text: '<div data-nearby><button type="button">Transfer</button></div>',
    },
  ]);
  const nearbyWordOnly = scanAffordances([
    {
      path: "Friends.tsx",
      text: "<p>Find nearby friends.</p>",
    },
  ]);
  const activityRingsOnly = scanAffordances([
    {
      path: "Move.tsx",
      text: '<div data-activity-rings><button type="button">Move</button></div>',
    },
  ]);
  const cssCircleOnly = scanAffordances([
    {
      path: "Circle.css",
      text: ".ring { border-radius: 50%; }",
    },
  ]);
  const nfcOnly = scanAffordances([
    {
      path: "Scan.tsx",
      text: '<div data-nfc><button type="button">Scan</button></div>',
    },
  ]);
  const nfcWordOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Hold near the NFC tag.</p>",
    },
  ]);
  const tapToPayOnly = scanAffordances([
    {
      path: "Pay.tsx",
      text: '<div data-tap-to-pay><button type="button">Pay</button></div>',
    },
  ]);
  const walletOnly = scanAffordances([
    {
      path: "Wallet.tsx",
      text: '<button type="button">Add to Apple Wallet</button>',
    },
  ]);
  const arOnly = scanAffordances([
    {
      path: "View.tsx",
      text: '<div data-ar><button type="button">View</button></div>',
    },
  ]);
  const relArOnly = scanAffordances([
    {
      path: "Product.tsx",
      text: '<a rel="ar" href="chair.usdz">View</a>',
    },
  ]);
  const arWordOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Preview this in augmented reality.</p>",
    },
  ]);
  const css3dOnly = scanAffordances([
    {
      path: "Spin.css",
      text: ".hero { transform: rotateX(20deg); }",
    },
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
      !passList.includes("slider") &&
      !passList.includes("scroll") &&
      !passList.includes("popover") &&
      !passList.includes("collection") &&
      !passList.includes("pagecontrol") &&
      !passList.includes("label") &&
      !passList.includes("textview") &&
      !passList.includes("imageview") &&
      !passList.includes("chart") &&
      !passList.includes("disclosure") &&
      !passList.includes("box") &&
      !passList.includes("editmenu") &&
      !passList.includes("help") &&
      !passList.includes("webview") &&
      !passList.includes("activityview") &&
      !passList.includes("print") &&
      !passList.includes("fullscreen") &&
      !passList.includes("filebrowser") &&
      !passList.includes("focus") &&
      !passList.includes("account") &&
      !passList.includes("tabview") &&
      !passList.includes("multitask") &&
      !passList.includes("reviewprompt") &&
      !passList.includes("appwindow") &&
      cardGrid.includes("list") &&
      !cardGrid.includes("collection") &&
      !navLink.includes("search") &&
      nativeSelect.includes("picker") &&
      !nativeSelect.includes("menu") &&
      !nativeSelect.includes("slider") &&
      !cssMenu.includes("menu") &&
      progressOnly.includes("progress") &&
      !progressOnly.includes("loading") &&
      !progressOnly.includes("pagecontrol") &&
      loadingOnly.includes("loading") &&
      !loadingOnly.includes("progress") &&
      formOnly.includes("form") &&
      !formOnly.includes("settings") &&
      !formOnly.includes("undo") &&
      !formOnly.includes("slider") &&
      !formOnly.includes("label") &&
      !formOnly.includes("textview") &&
      !formOnly.includes("imageview") &&
      !formOnly.includes("chart") &&
      !formOnly.includes("disclosure") &&
      !formOnly.includes("box") &&
      !formOnly.includes("editmenu") &&
      !formOnly.includes("help") &&
      !formOnly.includes("webview") &&
      !formOnly.includes("activityview") &&
      !formOnly.includes("print") &&
      !formOnly.includes("fullscreen") &&
      !formOnly.includes("filebrowser") &&
      !formOnly.includes("focus") &&
      !formOnly.includes("account") &&
      !formOnly.includes("tabview") &&
      !formOnly.includes("multitask") &&
      !formOnly.includes("reviewprompt") &&
      !formOnly.includes("appwindow") &&
      settingsPage.includes("settings") &&
      undoBar.includes("undo") &&
      !dumpLabel.includes("settings") &&
      !cancelOnly.includes("undo") &&
      rangeOnly.includes("slider") &&
      !rangeOnly.includes("picker") &&
      !bodyOverflow.includes("scroll") &&
      paneOverflow.includes("scroll") &&
      dialogOnly.includes("overlay") &&
      !dialogOnly.includes("popover") &&
      popoverOnly.includes("popover") &&
      !popoverOnly.includes("overlay") &&
      collectionOnly.includes("collection") &&
      !collectionOnly.includes("list") &&
      listOnly.includes("list") &&
      !listOnly.includes("collection") &&
      pageControlOnly.includes("pagecontrol") &&
      !pageControlOnly.includes("progress") &&
      !numberedPages.includes("pagecontrol") &&
      !ariaOnly.includes("label") &&
      staticLabel.includes("label") &&
      !staticLabel.includes("textview") &&
      textareaOnly.includes("textview") &&
      !textareaOnly.includes("label") &&
      !textareaOnly.includes("form") &&
      inputOnly.includes("form") &&
      !inputOnly.includes("textview") &&
      !imgOnly.includes("imageview") &&
      imageViewOnly.includes("imageview") &&
      chartOnly.includes("chart") &&
      !chartOnly.includes("list") &&
      tableOnly.includes("list") &&
      !tableOnly.includes("chart") &&
      !svgOnly.includes("chart") &&
      disclosureOnly.includes("disclosure") &&
      !expandedOnly.includes("disclosure") &&
      boxOnly.includes("box") &&
      !cardOnly.includes("box") &&
      !fieldsetOnly.includes("box") &&
      !listOnly.includes("box") &&
      editMenuOnly.includes("editmenu") &&
      !editMenuOnly.includes("menu") &&
      commandMenuOnly.includes("menu") &&
      !commandMenuOnly.includes("editmenu") &&
      helpOnly.includes("help") &&
      !helpOnly.includes("onboarding") &&
      !titledButton.includes("help") &&
      onboardingOnly.includes("onboarding") &&
      !onboardingOnly.includes("help") &&
      iframeOnly.includes("webview") &&
      !pageOnly.includes("webview") &&
      !helpOnly.includes("webview") &&
      activityOnly.includes("activityview") &&
      !activityOnly.includes("print") &&
      !activityOnly.includes("fullscreen") &&
      !shareWordOnly.includes("activityview") &&
      !pageOnly.includes("activityview") &&
      printOnly.includes("print") &&
      !printOnly.includes("activityview") &&
      !printOnly.includes("fullscreen") &&
      fullscreenOnly.includes("fullscreen") &&
      !fullscreenOnly.includes("print") &&
      !vhOnly.includes("fullscreen") &&
      !videoOnly.includes("fullscreen") &&
      !pageOnly.includes("fullscreen") &&
      fileBrowserOnly.includes("filebrowser") &&
      !fileBrowserOnly.includes("list") &&
      !fileInputOnly.includes("filebrowser") &&
      !pageOnly.includes("filebrowser") &&
      focusOnly.includes("focus") &&
      !cssFocusOnly.includes("focus") &&
      !tabindexOnly.includes("focus") &&
      !autofocusOnly.includes("focus") &&
      !formOnly.includes("focus") &&
      !pageOnly.includes("focus") &&
      accountOnly.includes("account") &&
      !passwordOnly.includes("account") &&
      !siwaOnly.includes("account") &&
      !formOnly.includes("account") &&
      !settingsPage.includes("account") &&
      !onboardingOnly.includes("account") &&
      !pageOnly.includes("account") &&
      tabViewOnly.includes("tabview") &&
      !tabBarOnly.includes("tabview") &&
      !tablistOnly.includes("tabview") &&
      !formOnly.includes("tabview") &&
      !pageOnly.includes("tabview") &&
      multitaskOnly.includes("multitask") &&
      !videoOnly.includes("multitask") &&
      !formOnly.includes("multitask") &&
      !pageOnly.includes("multitask") &&
      reviewPromptOnly.includes("reviewprompt") &&
      !starOnly.includes("reviewprompt") &&
      !onboardingOnly.includes("reviewprompt") &&
      !formOnly.includes("reviewprompt") &&
      !pageOnly.includes("reviewprompt") &&
      appWindowOnly.includes("appwindow") &&
      !uiWindowOnly.includes("appwindow") &&
      !pageOnly.includes("appwindow") &&
      !formOnly.includes("appwindow") &&
      !videoOnly.includes("appwindow") &&
      liveViewingOnly.includes("liveviewing") &&
      !liveViewingOnly.includes("videoplayer") &&
      !videoOnly.includes("liveviewing") &&
      !shareWordOnly.includes("liveviewing") &&
      !formOnly.includes("liveviewing") &&
      !passList.includes("liveviewing") &&
      !pageOnly.includes("liveviewing") &&
      snippetOnly.includes("snippet") &&
      !snippetOnly.includes("notification") &&
      !cardOnly.includes("snippet") &&
      !appShortcutOnly.includes("snippet") &&
      !formOnly.includes("snippet") &&
      !passList.includes("snippet") &&
      !pageOnly.includes("snippet") &&
      genaiOnly.includes("genai") &&
      !textareaOnly.includes("genai") &&
      !aiCopyOnly.includes("genai") &&
      !formOnly.includes("genai") &&
      !passList.includes("genai") &&
      !pageOnly.includes("genai") &&
      alwaysOnOnly.includes("alwayson") &&
      !dimCssOnly.includes("alwayson") &&
      !formOnly.includes("alwayson") &&
      !passList.includes("alwayson") &&
      !pageOnly.includes("alwayson") &&
      shareplayOnly.includes("shareplay") &&
      !shareWordOnly.includes("shareplay") &&
      !activityOnly.includes("shareplay") &&
      !formOnly.includes("shareplay") &&
      !passList.includes("shareplay") &&
      !pageOnly.includes("shareplay") &&
      nearbyOnly.includes("nearby") &&
      !nearbyWordOnly.includes("nearby") &&
      !shareWordOnly.includes("nearby") &&
      !activityOnly.includes("nearby") &&
      !formOnly.includes("nearby") &&
      !passList.includes("nearby") &&
      !pageOnly.includes("nearby") &&
      activityRingsOnly.includes("activityring") &&
      !cssCircleOnly.includes("activityring") &&
      !progressOnly.includes("activityring") &&
      !formOnly.includes("activityring") &&
      !passList.includes("activityring") &&
      !pageOnly.includes("activityring") &&
      nfcOnly.includes("nfc") &&
      !nfcWordOnly.includes("nfc") &&
      !nearbyOnly.includes("nfc") &&
      !shareWordOnly.includes("nfc") &&
      !tapToPayOnly.includes("nfc") &&
      !walletOnly.includes("nfc") &&
      !formOnly.includes("nfc") &&
      !passList.includes("nfc") &&
      !pageOnly.includes("nfc") &&
      arOnly.includes("ar") &&
      relArOnly.includes("ar") &&
      !arWordOnly.includes("ar") &&
      !imgOnly.includes("ar") &&
      !css3dOnly.includes("ar") &&
      !nfcOnly.includes("ar") &&
      !nearbyOnly.includes("ar") &&
      !formOnly.includes("ar") &&
      !passList.includes("ar") &&
      !pageOnly.includes("ar") &&
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
      ["applied", "already-compliant"].includes(status.topics["lists-and-tables"]?.state) &&
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
  const stub = catalog.byId["the-menu-bar"];
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
      catalog.byId.settings?.dontCoverageComplete === true &&
      catalog.byId["undo-and-redo"]?.dontCoverageComplete === true &&
      catalog.byId.loading?.dontCoverageComplete === true &&
      catalog.byId.feedback?.dontCoverageComplete === true &&
      catalog.byId.onboarding?.dontCoverageComplete === true &&
      catalog.byId["drag-and-drop"]?.dontCoverageComplete === true &&
      catalog.byId["managing-notifications"]?.dontCoverageComplete === true &&
      catalog.byId.launching?.dontCoverageComplete === true &&
      catalog.byId.layout?.dontCoverageComplete === true &&
      catalog.byId.materials?.dontCoverageComplete === true &&
      catalog.byId["lists-and-tables"]?.dontCoverageComplete === true &&
      catalog.byId["entering-data"]?.dontCoverageComplete === true &&
      catalog.byId.sidebars?.dontCoverageComplete === true &&
      (catalog.byId.layout?.dontHeuristicIds || []).includes("dashboard-card-grid-home") &&
      (catalog.byId["entering-data"]?.dontHeuristicIds || []).includes("equal-weight-submits") &&
      catalog.byId["design-principles"]?.dontCoverageComplete === false &&
      catalog.byId.menus?.dontCoverageComplete === true &&
      catalog.byId.pickers?.dontCoverageComplete === true &&
      catalog.byId.steppers?.dontCoverageComplete === true &&
      catalog.byId["progress-indicators"]?.dontCoverageComplete === true &&
      catalog.byId.buttons?.dontCoverageComplete === true &&
      catalog.byId.toggles?.dontCoverageComplete === true &&
      catalog.byId["text-fields"]?.dontCoverageComplete === true &&
      catalog.byId["segmented-controls"]?.dontCoverageComplete === true &&
      catalog.byId.widgets?.dontCoverageComplete === true &&
      catalog.byId["live-activities"]?.dontCoverageComplete === true &&
      catalog.byId["status-bars"]?.dontCoverageComplete === true &&
      catalog.byId.controls?.dontCoverageComplete === true &&
      (catalog.byId.menus?.dontHeuristicIds || []).includes("hide-unavailable-menu-items") &&
      (catalog.byId.pickers?.dontHeuristicIds || []).includes("overweight-wheel-short-list") &&
      (catalog.byId["progress-indicators"]?.dontHeuristicIds || []).includes(
        "morph-circular-bar",
      ) &&
      (catalog.byId.buttons?.dontHeuristicIds || []).includes("ok-instead-of-verb") &&
      (catalog.byId.widgets?.dontHeuristicIds || []).includes("fake-in-app-widget") &&
      (catalog.byId.controls?.dontHeuristicIds || []).includes(
        "settings-row-as-control-center",
      ) &&
      catalog.byId["right-to-left"]?.dontCoverageComplete === true &&
      (catalog.byId["right-to-left"]?.dontHeuristicIds || []).includes(
        "scalex-whole-window",
      ) &&
      (catalog.byId["right-to-left"]?.dontHeuristicIds || []).includes(
        "back-chevron-always-left",
      ) &&
      (catalog.byId["right-to-left"]?.dontHeuristicIds || []).includes(
        "dir-auto-on-locale-root",
      ) &&
      catalog.byId.sheets?.dontCoverageComplete === true &&
      catalog.byId.alerts?.dontCoverageComplete === true &&
      catalog.byId["action-sheets"]?.dontCoverageComplete === true &&
      catalog.byId.modality?.dontCoverageComplete === true &&
      (catalog.byId.sheets?.dontHeuristicIds || []).includes("nested-modal-stacks") &&
      catalog.byId["dark-mode"]?.dontCoverageComplete === true &&
      catalog.byId["sf-symbols"]?.dontCoverageComplete === true &&
      catalog.byId["context-menus"]?.dontCoverageComplete === true &&
      catalog.byId["pull-down-buttons"]?.dontCoverageComplete === true &&
      catalog.byId["pop-up-buttons"]?.dontCoverageComplete === true &&
      catalog.byId.notifications?.dontCoverageComplete === true &&
      catalog.byId["dark-mode"]?.pack === "foundations-color.md" &&
      catalog.byId["sf-symbols"]?.pack === "foundations-icons.md" &&
      catalog.byId["context-menus"]?.pack === "components-menus.md" &&
      catalog.byId.notifications?.pack === "patterns-notifications.md" &&
      catalog.byId.sliders?.dontCoverageComplete === true &&
      catalog.byId["scroll-views"]?.dontCoverageComplete === true &&
      catalog.byId.popovers?.dontCoverageComplete === true &&
      (catalog.byId.sliders?.dontHeuristicIds || []).includes("slider-as-volume") &&
      (catalog.byId["scroll-views"]?.dontHeuristicIds || []).includes(
        "nested-same-axis-scroll",
      ) &&
      (catalog.byId.popovers?.dontHeuristicIds || []).includes("cascade-popover") &&
      (catalog.byId.popovers?.dontHeuristicIds || []).includes("popover-as-warning") &&
      (catalog.byId.popovers?.dontHeuristicIds || []).includes("popover-on-compact") &&
      catalog.byId.sliders?.pack === "components-sliders.md" &&
      catalog.byId["scroll-views"]?.pack === "components-scroll-views.md" &&
      catalog.byId.popovers?.pack === "components-popovers.md" &&
      catalog.byId.collections?.dontCoverageComplete === true &&
      (catalog.byId.collections?.dontHeuristicIds || []).includes(
        "custom-collection-layout",
      ) &&
      (catalog.byId.collections?.dontHeuristicIds || []).includes(
        "text-collection-as-table",
      ) &&
      (catalog.byId.collections?.dontHeuristicIds || []).includes(
        "overlapping-collection-items",
      ) &&
      catalog.byId.collections?.pack === "components-collections.md" &&
      catalog.byId["page-controls"]?.dontCoverageComplete === true &&
      (catalog.byId["page-controls"]?.dontHeuristicIds || []).includes(
        "page-control-as-hierarchy",
      ) &&
      (catalog.byId["page-controls"]?.dontHeuristicIds || []).includes(
        "too-many-page-dots",
      ) &&
      (catalog.byId["page-controls"]?.dontHeuristicIds || []).includes(
        "too-many-page-indicator-images",
      ) &&
      (catalog.byId["page-controls"]?.dontHeuristicIds || []).includes(
        "colored-page-indicators",
      ) &&
      catalog.byId["page-controls"]?.pack === "components-page-controls.md" &&
      catalog.byId.labels?.dontCoverageComplete === true &&
      (catalog.byId.labels?.dontHeuristicIds || []).includes("editable-label") &&
      (catalog.byId.labels?.dontHeuristicIds || []).includes("long-label-as-text-view") &&
      (catalog.byId.labels?.dontHeuristicIds || []).includes(
        "unselectable-useful-label",
      ) &&
      catalog.byId.labels?.pack === "components-labels.md" &&
      catalog.byId["text-views"]?.dontCoverageComplete === true &&
      (catalog.byId["text-views"]?.dontHeuristicIds || []).includes(
        "short-text-as-field",
      ) &&
      (catalog.byId["text-views"]?.dontHeuristicIds || []).includes(
        "unselectable-useful-text-view",
      ) &&
      catalog.byId["text-views"]?.pack === "components-text-views.md" &&
      catalog.byId["image-views"]?.dontCoverageComplete === true &&
      (catalog.byId["image-views"]?.dontHeuristicIds || []).includes(
        "image-view-as-button",
      ) &&
      (catalog.byId["image-views"]?.dontHeuristicIds || []).includes(
        "image-view-as-icon",
      ) &&
      (catalog.byId["image-views"]?.dontHeuristicIds || []).includes(
        "text-overlay-on-image-view",
      ) &&
      catalog.byId["image-views"]?.pack === "components-image-views.md" &&
      catalog.byId.charts?.dontCoverageComplete === true &&
      catalog.byId["charting-data"]?.dontCoverageComplete === true &&
      (catalog.byId.charts?.dontHeuristicIds || []).includes(
        "color-only-chart-series",
      ) &&
      (catalog.byId.charts?.dontHeuristicIds || []).includes(
        "chart-critical-behind-interaction",
      ) &&
      (catalog.byId.charts?.dontHeuristicIds || []).includes("chart-as-table") &&
      (catalog.byId.charts?.dontHeuristicIds || []).includes("overcrowded-chart") &&
      catalog.byId.charts?.pack === "components-charts.md" &&
      catalog.byId["charting-data"]?.pack === "components-charts.md" &&
      catalog.byId["disclosure-controls"]?.dontCoverageComplete === true &&
      (catalog.byId["disclosure-controls"]?.dontHeuristicIds || []).includes(
        "extra-disclosure-button",
      ) &&
      (catalog.byId["disclosure-controls"]?.dontHeuristicIds || []).includes(
        "unlabeled-disclosure-triangle",
      ) &&
      (catalog.byId["disclosure-controls"]?.dontHeuristicIds || []).includes(
        "advanced-details-unhidden",
      ) &&
      catalog.byId["disclosure-controls"]?.pack ===
        "components-disclosure-controls.md" &&
      catalog.byId.boxes?.dontCoverageComplete === true &&
      (catalog.byId.boxes?.dontHeuristicIds || []).includes("nested-boxes") &&
      (catalog.byId.boxes?.dontHeuristicIds || []).includes("oversized-box") &&
      catalog.byId.boxes?.pack === "components-boxes.md" &&
      catalog.byId["edit-menus"]?.dontCoverageComplete === true &&
      (catalog.byId["edit-menus"]?.dontHeuristicIds || []).includes(
        "custom-edit-menu",
      ) &&
      (catalog.byId["edit-menus"]?.dontHeuristicIds || []).includes(
        "inapplicable-edit-commands",
      ) &&
      (catalog.byId["edit-menus"]?.dontHeuristicIds || []).includes(
        "redundant-edit-controls",
      ) &&
      catalog.byId["edit-menus"]?.pack === "components-edit-menus.md" &&
      catalog.byId["offering-help"]?.dontCoverageComplete === true &&
      (catalog.byId["offering-help"]?.dontHeuristicIds || []).includes(
        "wrong-platform-help",
      ) &&
      (catalog.byId["offering-help"]?.dontHeuristicIds || []).includes(
        "standard-component-help",
      ) &&
      (catalog.byId["offering-help"]?.dontHeuristicIds || []).includes(
        "promotional-tip",
      ) &&
      catalog.byId["offering-help"]?.pack === "components-offering-help.md" &&
      catalog.byId["web-views"]?.dontCoverageComplete === true &&
      (catalog.byId["web-views"]?.dontHeuristicIds || []).includes(
        "missing-web-view-back-forward",
      ) &&
      (catalog.byId["web-views"]?.dontHeuristicIds || []).includes(
        "safari-replica-web-view",
      ) &&
      catalog.byId["web-views"]?.pack === "components-web-views.md" &&
      catalog.byId["activity-views"]?.dontCoverageComplete === true &&
      (catalog.byId["activity-views"]?.dontHeuristicIds || []).includes(
        "duplicate-activity-actions",
      ) &&
      (catalog.byId["activity-views"]?.dontHeuristicIds || []).includes(
        "alternative-activity-reveal",
      ) &&
      catalog.byId["activity-views"]?.pack === "components-activity-views.md" &&
      catalog.byId.printing?.dontCoverageComplete === true &&
      (catalog.byId.printing?.dontHeuristicIds || []).includes(
        "print-when-nothing-printable",
      ) &&
      (catalog.byId.printing?.dontHeuristicIds || []).includes(
        "duplicate-page-orientation",
      ) &&
      catalog.byId.printing?.pack === "components-printing.md" &&
      catalog.byId["going-full-screen"]?.dontCoverageComplete === true &&
      (catalog.byId["going-full-screen"]?.dontHeuristicIds || []).includes(
        "programmatic-fullscreen-resize",
      ) &&
      (catalog.byId["going-full-screen"]?.dontHeuristicIds || []).includes(
        "auto-exit-fullscreen",
      ) &&
      (catalog.byId["going-full-screen"]?.dontHeuristicIds || []).includes(
        "custom-window-mode-menu",
      ) &&
      catalog.byId["going-full-screen"]?.pack === "components-going-full-screen.md" &&
      catalog.byId["file-management"]?.dontCoverageComplete === true &&
      (catalog.byId["file-management"]?.dontHeuristicIds || []).includes(
        "custom-file-toolbar",
      ) &&
      (catalog.byId["file-management"]?.dontHeuristicIds || []).includes(
        "extensions-shown-by-default",
      ) &&
      (catalog.byId["file-management"]?.dontHeuristicIds || []).includes(
        "explicit-save-required",
      ) &&
      catalog.byId["file-management"]?.pack === "patterns-file-management.md" &&
      catalog.byId["focus-and-selection"]?.dontCoverageComplete === true &&
      (catalog.byId["focus-and-selection"]?.dontHeuristicIds || []).includes(
        "steal-focus",
      ) &&
      (catalog.byId["focus-and-selection"]?.dontHeuristicIds || []).includes(
        "custom-focus-effect",
      ) &&
      catalog.byId["focus-and-selection"]?.pack === "inputs-focus-and-selection.md" &&
      catalog.byId["managing-accounts"]?.dontCoverageComplete === true &&
      (catalog.byId["managing-accounts"]?.dontHeuristicIds || []).includes(
        "force-account-before-use",
      ) &&
      (catalog.byId["managing-accounts"]?.dontHeuristicIds || []).includes(
        "buried-account-deletion",
      ) &&
      (catalog.byId["managing-accounts"]?.dontHeuristicIds || []).includes(
        "passcode-for-account-auth",
      ) &&
      catalog.byId["managing-accounts"]?.pack === "patterns-managing-accounts.md" &&
      catalog.byId["tab-views"]?.dontCoverageComplete === true &&
      (catalog.byId["tab-views"]?.dontHeuristicIds || []).includes(
        "popup-tabs-switch",
      ) &&
      (catalog.byId["tab-views"]?.dontHeuristicIds || []).includes(
        "more-than-six-tabs",
      ) &&
      (catalog.byId["tab-views"]?.dontHeuristicIds || []).includes(
        "cross-pane-controls",
      ) &&
      catalog.byId["tab-views"]?.pack === "components-tab-views.md" &&
      catalog.byId.multitasking?.dontCoverageComplete === true &&
      (catalog.byId.multitasking?.dontHeuristicIds || []).includes(
        "continue-when-switched-away",
      ) &&
      (catalog.byId.multitasking?.dontHeuristicIds || []).includes(
        "notify-routine-task",
      ) &&
      (catalog.byId.multitasking?.dontHeuristicIds || []).includes(
        "ignore-primary-audio-interrupt",
      ) &&
      catalog.byId.multitasking?.pack === "patterns-multitasking.md" &&
      catalog.byId["ratings-and-reviews"]?.dontCoverageComplete === true &&
      (catalog.byId["ratings-and-reviews"]?.dontHeuristicIds || []).includes(
        "rating-on-first-launch",
      ) &&
      (catalog.byId["ratings-and-reviews"]?.dontHeuristicIds || []).includes(
        "rating-interrupts-task",
      ) &&
      (catalog.byId["ratings-and-reviews"]?.dontHeuristicIds || []).includes(
        "pester-rating-requests",
      ) &&
      catalog.byId["ratings-and-reviews"]?.pack === "patterns-ratings-and-reviews.md" &&
      catalog.byId.windows?.dontCoverageComplete === true &&
      (catalog.byId.windows?.dontHeuristicIds || []).includes(
        "open-window-as-default",
      ) &&
      (catalog.byId.windows?.dontHeuristicIds || []).includes(
        "custom-window-frame",
      ) &&
      (catalog.byId.windows?.dontHeuristicIds || []).includes(
        "call-window-scene",
      ) &&
      (catalog.byId.windows?.dontHeuristicIds || []).includes(
        "critical-window-bottom-bar",
      ) &&
      catalog.byId.windows?.pack === "components-windows.md" &&
      catalog.byId["playing-video"]?.dontCoverageComplete === true &&
      (catalog.byId["playing-video"]?.dontHeuristicIds || []).includes(
        "custom-video-player",
      ) &&
      (catalog.byId["playing-video"]?.dontHeuristicIds || []).includes(
        "letterbox-video-padding",
      ) &&
      (catalog.byId["playing-video"]?.dontHeuristicIds || []).includes(
        "ask-resume-playback",
      ) &&
      (catalog.byId["playing-video"]?.dontHeuristicIds || []).includes(
        "video-loading-splash",
      ) &&
      catalog.byId["playing-video"]?.pack === "patterns-playing-video.md" &&
      catalog.byId["playing-haptics"]?.dontCoverageComplete === true &&
      (catalog.byId["playing-haptics"]?.dontHeuristicIds || []).includes(
        "haptic-wrong-meaning",
      ) &&
      (catalog.byId["playing-haptics"]?.dontHeuristicIds || []).includes(
        "overused-haptics",
      ) &&
      (catalog.byId["playing-haptics"]?.dontHeuristicIds || []).includes(
        "haptic-not-optional",
      ) &&
      catalog.byId["playing-haptics"]?.pack === "patterns-playing-haptics.md" &&
      catalog.byId.airplay?.dontCoverageComplete === true &&
      (catalog.byId.airplay?.dontHeuristicIds || []).includes(
        "stop-airplay-on-background",
      ) &&
      (catalog.byId.airplay?.dontHeuristicIds || []).includes(
        "interrupt-other-playback",
      ) &&
      (catalog.byId.airplay?.dontHeuristicIds || []).includes(
        "auto-mirror-airplay",
      ) &&
      (catalog.byId.airplay?.dontHeuristicIds || []).includes(
        "stream-background-loop",
      ) &&
      catalog.byId.airplay?.pack === "tech-airplay.md" &&
      catalog.byId["gyro-and-accelerometer"]?.dontCoverageComplete === true &&
      (catalog.byId["gyro-and-accelerometer"]?.dontHeuristicIds || []).includes(
        "motion-without-benefit",
      ) &&
      (catalog.byId["gyro-and-accelerometer"]?.dontHeuristicIds || []).includes(
        "motion-direct-ui",
      ) &&
      catalog.byId["gyro-and-accelerometer"]?.pack ===
        "inputs-gyro-and-accelerometer.md" &&
      catalog.byId["home-screen-quick-actions"]?.dontCoverageComplete === true &&
      (catalog.byId["home-screen-quick-actions"]?.dontHeuristicIds || []).includes(
        "quick-action-app-name",
      ) &&
      (catalog.byId["home-screen-quick-actions"]?.dontHeuristicIds || []).includes(
        "quick-action-emoji",
      ) &&
      catalog.byId["home-screen-quick-actions"]?.pack ===
        "patterns-home-screen-quick-actions.md" &&
      catalog.byId["live-viewing-apps"]?.dontCoverageComplete === true &&
      (catalog.byId["live-viewing-apps"]?.dontHeuristicIds || []).includes(
        "live-unmarked-vod",
      ) &&
      (catalog.byId["live-viewing-apps"]?.dontHeuristicIds || []).includes(
        "live-audio-after-leave",
      ) &&
      catalog.byId["live-viewing-apps"]?.pack ===
        "patterns-live-viewing-apps.md" &&
      catalog.byId.snippets?.dontCoverageComplete === true &&
      (catalog.byId.snippets?.dontHeuristicIds || []).includes(
        "snippet-dialogue-text",
      ) &&
      (catalog.byId.snippets?.dontHeuristicIds || []).includes(
        "snippet-too-tall",
      ) &&
      catalog.byId.snippets?.pack === "system-snippets.md" &&
      catalog.byId["generative-ai"]?.dontCoverageComplete === true &&
      (catalog.byId["generative-ai"]?.dontHeuristicIds || []).includes(
        "ai-as-human",
      ) &&
      (catalog.byId["generative-ai"]?.dontHeuristicIds || []).includes(
        "genai-no-revert",
      ) &&
      catalog.byId["generative-ai"]?.pack === "tech-generative-ai.md" &&
      catalog.byId["generative-ai"]?.appliesWhen === "always" &&
      catalog.byId["always-on"]?.dontCoverageComplete === true &&
      (catalog.byId["always-on"]?.dontHeuristicIds || []).includes(
        "always-on-sensitive",
      ) &&
      (catalog.byId["always-on"]?.dontHeuristicIds || []).includes(
        "always-on-stop-motion",
      ) &&
      catalog.byId["always-on"]?.pack === "tech-always-on.md" &&
      catalog.byId["always-on"]?.appliesWhen === "always" &&
      catalog.byId.shareplay?.dontCoverageComplete === true &&
      (catalog.byId.shareplay?.dontHeuristicIds || []).includes(
        "shareplay-adjective",
      ) &&
      (catalog.byId.shareplay?.dontHeuristicIds || []).includes(
        "shareplay-inflected",
      ) &&
      catalog.byId.shareplay?.pack === "tech-shareplay.md" &&
      catalog.byId.shareplay?.appliesWhen === "always" &&
      catalog.byId["nearby-interactions"]?.dontCoverageComplete === true &&
      (catalog.byId["nearby-interactions"]?.dontHeuristicIds || []).includes(
        "nearby-only-way",
      ) &&
      (catalog.byId["nearby-interactions"]?.dontHeuristicIds || []).includes(
        "nearby-portrait-instruction",
      ) &&
      catalog.byId["nearby-interactions"]?.pack ===
        "inputs-nearby-interactions.md" &&
      catalog.byId["nearby-interactions"]?.appliesWhen === "always" &&
      catalog.byId["activity-rings"]?.dontCoverageComplete === true &&
      (catalog.byId["activity-rings"]?.dontHeuristicIds || []).includes(
        "activity-rings-other-data",
      ) &&
      (catalog.byId["activity-rings"]?.dontHeuristicIds || []).includes(
        "activity-rings-multi-person",
      ) &&
      (catalog.byId["activity-rings"]?.dontHeuristicIds || []).includes(
        "activity-rings-recolor",
      ) &&
      (catalog.byId["activity-rings"]?.dontHeuristicIds || []).includes(
        "activity-rings-decoration",
      ) &&
      catalog.byId["activity-rings"]?.pack === "patterns-activity-rings.md" &&
      catalog.byId["activity-rings"]?.appliesWhen === "always" &&
      catalog.byId.nfc?.dontCoverageComplete === true &&
      (catalog.byId.nfc?.dontHeuristicIds || []).includes("nfc-contact") &&
      (catalog.byId.nfc?.dontHeuristicIds || []).includes("nfc-jargon") &&
      catalog.byId.nfc?.pack === "tech-nfc.md" &&
      catalog.byId.nfc?.appliesWhen === "always" &&
      catalog.byId["augmented-reality"]?.dontCoverageComplete === true &&
      (catalog.byId["augmented-reality"]?.dontHeuristicIds || []).includes(
        "ar-jargon",
      ) &&
      (catalog.byId["augmented-reality"]?.dontHeuristicIds || []).includes(
        "ar-glyph-misused",
      ) &&
      catalog.byId["augmented-reality"]?.pack === "tech-augmented-reality.md" &&
      catalog.byId["augmented-reality"]?.appliesWhen === "always" &&
      isTitleStub(catalog.byId["the-menu-bar"]) &&
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
      "sliders",
      "scroll-views",
      "popovers",
      "collections",
      "page-controls",
      "labels",
      "text-views",
      "image-views",
      "charts",
      "charting-data",
      "disclosure-controls",
      "boxes",
      "edit-menus",
      "offering-help",
      "web-views",
      "activity-views",
      "printing",
      "going-full-screen",
      "file-management",
      "focus-and-selection",
      "managing-accounts",
      "tab-views",
      "multitasking",
      "ratings-and-reviews",
      "windows",
      "playing-video",
      "playing-haptics",
      "airplay",
      "gyro-and-accelerometer",
      "home-screen-quick-actions",
      "live-viewing-apps",
      "snippets",
      "generative-ai",
      "always-on",
      "shareplay",
      "nearby-interactions",
      "activity-rings",
      "nfc",
      "augmented-reality",
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
      holdStatus.topics.menus?.state === "already-compliant" &&
      holdStatus.topics.settings?.state === "already-compliant" &&
      holdStatus.topics["undo-and-redo"]?.state === "already-compliant" &&
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

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-optional-dont-pass-"));
  const themeDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-optional-dont-theme-"));
  const partyDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-optional-dont-party-"));
  const splashDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-optional-dont-splash-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-optional-dont-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, themeDir, { recursive: true });
    fs.cpSync(src, partyDir, { recursive: true });
    fs.cpSync(src, splashDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(themeDir, "Settings.tsx"),
      `export function SettingsScreen() {
  return (
    <main data-settings>
      <h1>Settings</h1>
      <UITableView barTintColor="#111111" />
    </main>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(partyDir, "SavedToast.tsx"),
      `export function SavedToast() {
  function handleSave() {}
  return (
    <div>
      <button type="button" onClick={handleSave}>Save</button>
      <span className="confetti"></span>
    </div>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(splashDir, "Splash.tsx"),
      `export function Splash() {
  return (
    <main data-launch>
      <video autoPlay src="/intro.mp4" />
    </main>
  );
}
`,
    );
    const origHold = `export function ConfirmDelete() {
  function handleDelete() {
    window.confirm("Are you sure you want to delete?");
  }
  return (
    <div>
      <button type="button" aria-label="Undo Delete">Undo</button>
      <button type="button" onClick={handleDelete}>Delete</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "ConfirmDelete.tsx"), origHold);
    const passReport = applyCatalog({
      cwd: passDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const themeReport = applyCatalog({
      cwd: themeDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const partyReport = applyCatalog({
      cwd: partyDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const splashReport = applyCatalog({
      cwd: splashDir,
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
    const themeStatus = parseCatalogStatus(
      fs.readFileSync(path.join(themeDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const partyStatus = parseCatalogStatus(
      fs.readFileSync(path.join(partyDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const splashStatus = parseCatalogStatus(
      fs.readFileSync(path.join(splashDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const holdStatus = parseCatalogStatus(
      fs.readFileSync(path.join(holdDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const themed = fs.readFileSync(path.join(themeDir, "Settings.tsx"), "utf8");
    const party = fs.readFileSync(path.join(partyDir, "SavedToast.tsx"), "utf8");
    const splash = fs.readFileSync(path.join(splashDir, "Splash.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "ConfirmDelete.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(themeDir),
      ...walkSource(partyDir),
      ...walkSource(splashDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      themeChrome: themeReport.chrome.pass === true,
      partyChrome: partyReport.chrome.pass === true,
      splashChrome: splashReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passSettings: passStatus.topics.settings?.state === "skipped-no-affordance",
      passUndo: passStatus.topics["undo-and-redo"]?.state === "skipped-no-affordance",
      passLoading: passStatus.topics.loading?.state === "skipped-no-affordance",
      passLaunching: passStatus.topics.launching?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      themeApplied: themeStatus.topics.settings?.state === "applied",
      themeNoHex: !/#111111/.test(themed),
      partyApplied: partyStatus.topics.feedback?.state === "applied",
      partyNoConfetti: !/\bconfetti\b/.test(party),
      splashApplied: splashStatus.topics.launching?.state === "applied",
      splashNoAuto: !/autoPlay/i.test(splash),
      splashKeepsVideo: /<video\b/.test(splash),
      holdUndo: holdStatus.topics["undo-and-redo"]?.state === "pending",
      holdUnchanged: held === origHold,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passSettings: passStatus.topics.settings?.state,
      passLaunching: passStatus.topics.launching?.state,
      themeSettings: themeStatus.topics.settings?.state,
      partyFeedback: partyStatus.topics.feedback?.state,
      splashLaunching: splashStatus.topics.launching?.state,
      holdUndo: holdStatus.topics["undo-and-redo"]?.state,
      remaining: passReport.plan.coverage.remaining,
      themed,
      party,
      splash,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(themeDir, { recursive: true, force: true });
    fs.rmSync(partyDir, { recursive: true, force: true });
    fs.rmSync(splashDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-optional-widget-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-chrome-dont-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-chrome-dont-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-chrome-dont-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "WideList.tsx"),
      `export function WideList() {
  return (
    <div data-list-pane style={{ minWidth: "24rem" }}>
      <ul><li>Item</li></ul>
    </div>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "DualSubmit.tsx"),
      `export function DualSubmit() {
  return (
    <form data-form-page>
      <button type="submit">Save</button>
      <button type="submit">Submit</button>
    </form>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "ListCta.tsx"),
      `export function ListCta() {
  return (
    <div>
      <div data-list-pane>
        <header role="toolbar">
          <button type="button">Add</button>
        </header>
        <ul><li>Row</li></ul>
      </div>
      <div data-detail>
        <h1>Detail</h1>
      </div>
    </div>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Landing.tsx"),
      `export function LandingPage() {
  return (
    <main data-marketing>
      <h1>Welcome</h1>
      <nav data-tab-bar role="tablist">
        <a href="/home">Home</a>
      </nav>
    </main>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "StackedGlass.tsx"),
      `export function StackedChrome() {
  return (
    <header data-nav data-stacked-translucent style={{ backdropFilter: "blur(20px)" }}>
      <nav style={{ backdropFilter: "blur(12px)" }}>Nav</nav>
    </header>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Compat.ts"),
      `export const flags = { UIDesignRequiresCompatibility: true };
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "BottomTabs.tsx"),
      `export function PhoneTabs() {
  return (
    <nav data-tab-bar style={{ position: "relative", bottom: 0 }}>
      <a href="/a">A</a>
    </nav>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "MasterCards.tsx"),
      `export function MasterCards() {
  return (
    <div data-list-pane>
      <div className="card-grid">
        <article className="card">One</article>
        <article className="card">Two</article>
        <article className="card">Three</article>
      </div>
    </div>
  );
}
`,
    );
    const origHold = `export function SoloListCta() {
  return (
    <div data-list-pane>
      <header role="toolbar">
        <button type="button">Add</button>
      </header>
      <ul><li>Row</li></ul>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "SoloListCta.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const wide = fs.readFileSync(path.join(fixDir, "WideList.tsx"), "utf8");
    const dual = fs.readFileSync(path.join(fixDir, "DualSubmit.tsx"), "utf8");
    const cta = fs.readFileSync(path.join(fixDir, "ListCta.tsx"), "utf8");
    const landing = fs.readFileSync(path.join(fixDir, "Landing.tsx"), "utf8");
    const stacked = fs.readFileSync(path.join(fixDir, "StackedGlass.tsx"), "utf8");
    const compat = fs.readFileSync(path.join(fixDir, "Compat.ts"), "utf8");
    const bottom = fs.readFileSync(path.join(fixDir, "BottomTabs.tsx"), "utf8");
    const master = fs.readFileSync(path.join(fixDir, "MasterCards.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "SoloListCta.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passLayout: passStatus.topics.layout?.state === "already-compliant",
      passMaterials: passStatus.topics.materials?.state === "already-compliant",
      passLists: passStatus.topics["lists-and-tables"]?.state === "already-compliant",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passSidebars: passStatus.topics.sidebars?.state === "already-compliant",
      passButtons: passStatus.topics.buttons?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixLayout: fixStatus.topics.layout?.state === "applied",
      fixMaterials: fixStatus.topics.materials?.state === "applied",
      fixLists: fixStatus.topics["lists-and-tables"]?.state === "applied",
      fixForms: fixStatus.topics["entering-data"]?.state === "applied",
      fixTabs: fixStatus.topics["tab-bars"]?.state === "applied",
      wideNoMin: !/minWidth/.test(wide),
      dualOneSubmit: (dual.match(/type=["']submit["']/g) || []).length === 1,
      dualKeepsSave: /type=["']submit["']>Save/.test(dual),
      ctaMoved: /data-detail[\s\S]*Add/.test(cta) && !/<header[\s\S]*Add[\s\S]*<\/header>/.test(cta),
      landingNoTabs: !/data-tab-bar|tablist/.test(landing),
      stackedClean: !/data-stacked-translucent|backdropFilter/.test(stacked),
      compatGone: !/UIDesignRequiresCompatibility/.test(compat),
      bottomSticky: /position:\s*["']sticky["']/.test(bottom) && !/position:\s*["']relative["']/.test(bottom),
      masterList: /<ul>/.test(master) && !/card-grid/.test(master),
      holdUnchanged: held === origHold,
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passLayout: passStatus.topics.layout?.state,
      passPrinciples: passStatus.topics["design-principles"]?.state,
      fixLayout: fixStatus.topics.layout?.state,
      fixForms: fixStatus.topics["entering-data"]?.state,
      remaining: passReport.plan.coverage.remaining,
      wide,
      dual,
      cta,
      landing,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-chrome-backed-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-host-widget-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-host-widget-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-host-widget-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HiddenMenu.tsx"),
      `export function HiddenMenu() {
  return (
    <div role="menu">
      <button type="button" role="menuitem">Share</button>
      <button type="button" role="menuitem" hidden>Paste</button>
    </div>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "CountryWheel.tsx"),
      `export function CountryWheel() {
  return (
    <div data-ios-wheel>
      <div>United States</div>
      <div>Canada</div>
      <div>Mexico</div>
    </div>
  );
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Morph.tsx"),
      `export function Morph() {
  return <progress data-morph-progress value={20} max={100} />;
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Jump.tsx"),
      `export function Jump() {
  return <progress data-jump-ninety value="90" max="100" />;
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Pull.tsx"),
      `export function Pull() {
  return <button type="button">pull down to refresh</button>;
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "OkSave.tsx"),
      `export function OkSave() {
  function handleSave() {}
  return <button type="submit">OK</button>;
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "ToggleNav.tsx"),
      `export function ToggleNav() {
  return <button type="submit" role="switch" aria-checked={false}>Wifi</button>;
}
`,
    );
    const origHold = `export function NestedMenu() {
  return (
    <div role="menu">
      <div role="menu">
        <div role="menu">
          <button type="button" role="menuitem">Deep</button>
        </div>
      </div>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "NestedMenu.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const hidden = fs.readFileSync(path.join(fixDir, "HiddenMenu.tsx"), "utf8");
    const wheel = fs.readFileSync(path.join(fixDir, "CountryWheel.tsx"), "utf8");
    const morph = fs.readFileSync(path.join(fixDir, "Morph.tsx"), "utf8");
    const jump = fs.readFileSync(path.join(fixDir, "Jump.tsx"), "utf8");
    const pull = fs.readFileSync(path.join(fixDir, "Pull.tsx"), "utf8");
    const okSave = fs.readFileSync(path.join(fixDir, "OkSave.tsx"), "utf8");
    const toggle = fs.readFileSync(path.join(fixDir, "ToggleNav.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "NestedMenu.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passMenus: passStatus.topics.menus?.state === "skipped-no-affordance",
      passPickers: passStatus.topics.pickers?.state === "skipped-no-affordance",
      passProgress: passStatus.topics["progress-indicators"]?.state === "skipped-no-affordance",
      passButtons: passStatus.topics.buttons?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixMenus: fixStatus.topics.menus?.state === "applied",
      fixPickers: fixStatus.topics.pickers?.state === "applied",
      fixSteppers: fixStatus.topics.steppers?.state === "applied",
      fixProgress: fixStatus.topics["progress-indicators"]?.state === "applied",
      fixButtons: fixStatus.topics.buttons?.state === "applied",
      hiddenDimmed: /aria-disabled=\{true\}/.test(hidden) && !/\bhidden\b/.test(hidden),
      wheelSelect: /<select>/.test(wheel) && !/data-ios-wheel/.test(wheel),
      morphClean: !/data-morph-progress/.test(morph),
      jumpZero: /value="0"/.test(jump) && !/value="90"/.test(jump),
      pullRefresh: />Refresh</.test(pull) && !/pull down to refresh/i.test(pull),
      okSave: />Save</.test(okSave) && !/>OK</.test(okSave),
      toggleButton: /type=["']button["']/.test(toggle) && !/type=["']submit["']/.test(toggle),
      holdUnchanged: held === origHold,
      holdMenus: holdStatus.topics.menus?.state === "pending",
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passMenus: passStatus.topics.menus?.state,
      passButtons: passStatus.topics.buttons?.state,
      passPrinciples: passStatus.topics["design-principles"]?.state,
      fixMenus: fixStatus.topics.menus?.state,
      fixPickers: fixStatus.topics.pickers?.state,
      fixProgress: fixStatus.topics["progress-indicators"]?.state,
      fixButtons: fixStatus.topics.buttons?.state,
      holdMenus: holdStatus.topics.menus?.state,
      remaining: passReport.plan.coverage.remaining,
      hidden,
      wheel,
      pull,
      okSave,
      toggle,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-host-widget-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sys-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sys-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sys-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sys-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, cleanDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    const writeCaps = (dir) => {
      fs.writeFileSync(
        path.join(dir, "DESIGN.md"),
        "platform_primary: phone\nregister: product\nThis product is a phone inventory app with glanceable native system chrome for widgets, Live Activities, status bars, and Control Center.\n",
      );
      fs.writeFileSync(
        path.join(dir, "WidgetCap.swift"),
        `import WidgetKit
import SwiftUI
struct StatusWidget: Widget {
  var body: some WidgetConfiguration { EmptyView() }
}
`,
      );
      fs.writeFileSync(
        path.join(dir, "ActivityCap.swift"),
        `import ActivityKit
struct GameAttrs: ActivityAttributes {}
`,
      );
      fs.writeFileSync(
        path.join(dir, "ControlCap.swift"),
        `import SwiftUI
import WidgetKit
struct Torch: ControlWidget {
  var body: some ControlWidgetConfiguration {
    StaticControlConfiguration(kind: "torch") {
      ControlWidgetButton(action: OpenApp()) {
        Label("Torch", systemImage: "flashlight.on.fill")
        Label("Torch Off", systemImage: "flashlight.off.fill")
      }
    }
  }
}
`,
      );
    };
    writeCaps(cleanDir);
    writeCaps(fixDir);
    writeCaps(holdDir);
    fs.writeFileSync(
      path.join(fixDir, "FakeWidget.tsx"),
      `export function Fake() { return <div data-fake-widget>Home</div>; }\n`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Stretch.tsx"),
      `export function Stretch() { return <div data-widget-stretch />; }\n`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Island.tsx"),
      `export function Island() { return <div data-dynamic-island-pointer>Look</div>; }\n`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Ad.tsx"),
      `export function Ad() { return <div data-live-activity-ad>Sale</div>; }\n`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Hidden.swift"),
      `var prefersStatusBarHidden: Bool { true }\n`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Clock.tsx"),
      `export function Clock() { return <div data-fake-status-bar>9:41</div>; }\n`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Fill.tsx"),
      `export function Fill() { return <header data-status-bar-fill style={{ background: "#111111" }}>x</header>; }\n`,
    );
    fs.writeFileSync(
      path.join(fixDir, "FakeCC.tsx"),
      `export function FakeCC() { return <div data-control-center data-settings>CC</div>; }\n`,
    );
    const origHold = `import WidgetKit
import SwiftUI
struct IconWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "icon", provider: Provider()) { _ in
      Image("AppIcon")
    }
  }
}
`;
    fs.writeFileSync(path.join(holdDir, "IconWidget.swift"), origHold);
    const origToggle = `import SwiftUI
import WidgetKit
struct OneTorch: ControlWidget {
  var body: some ControlWidgetConfiguration {
    StaticControlConfiguration(kind: "torch") {
      ControlWidgetToggle("Torch", isOn: .constant(true), action: ToggleTorch()) {
        Label("Torch", systemImage: "flashlight.on.fill")
      }
    }
  }
}
`;
    fs.writeFileSync(path.join(holdDir, "OneSymbol.swift"), origToggle);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const passReport = applyCatalog({
      cwd: passDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const cleanReport = applyCatalog({
      cwd: cleanDir,
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
    const cleanStatus = parseCatalogStatus(
      fs.readFileSync(path.join(cleanDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const fixStatus = parseCatalogStatus(
      fs.readFileSync(path.join(fixDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const holdStatus = parseCatalogStatus(
      fs.readFileSync(path.join(holdDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const fake = fs.readFileSync(path.join(fixDir, "FakeWidget.tsx"), "utf8");
    const stretch = fs.readFileSync(path.join(fixDir, "Stretch.tsx"), "utf8");
    const island = fs.readFileSync(path.join(fixDir, "Island.tsx"), "utf8");
    const ad = fs.readFileSync(path.join(fixDir, "Ad.tsx"), "utf8");
    const hidden = fs.readFileSync(path.join(fixDir, "Hidden.swift"), "utf8");
    const clock = fs.readFileSync(path.join(fixDir, "Clock.tsx"), "utf8");
    const fill = fs.readFileSync(path.join(fixDir, "Fill.tsx"), "utf8");
    const fakeCc = fs.readFileSync(path.join(fixDir, "FakeCC.tsx"), "utf8");
    const heldIcon = fs.readFileSync(path.join(holdDir, "IconWidget.swift"), "utf8");
    const heldToggle = fs.readFileSync(path.join(holdDir, "OneSymbol.swift"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(cleanDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      cleanChrome: cleanReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passWidgets: passStatus.topics.widgets?.state === "skipped-gate",
      passLive: passStatus.topics["live-activities"]?.state === "skipped-gate",
      passStatus: passStatus.topics["status-bars"]?.state === "skipped-gate",
      passControls: passStatus.topics.controls?.state === "skipped-gate",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      cleanWidgets: cleanStatus.topics.widgets?.state === "already-compliant",
      cleanLive: cleanStatus.topics["live-activities"]?.state === "already-compliant",
      cleanStatus: cleanStatus.topics["status-bars"]?.state === "already-compliant",
      cleanControls: cleanStatus.topics.controls?.state === "already-compliant",
      cleanRemaining: cleanReport.plan.coverage.remaining > 0,
      fixWidgets: fixStatus.topics.widgets?.state === "applied",
      fixLive: fixStatus.topics["live-activities"]?.state === "applied",
      fixStatus: fixStatus.topics["status-bars"]?.state === "applied",
      fixControls: fixStatus.topics.controls?.state === "applied",
      fakeGone: !/data-fake-widget/.test(fake),
      stretchGone: !/data-widget-stretch/.test(stretch),
      islandGone: !/data-dynamic-island-pointer/.test(island),
      adGone: !/data-live-activity-ad/.test(ad),
      hiddenFalse: /prefersStatusBarHidden[\s\S]*\{\s*false\s*\}/.test(hidden),
      clockGone: !/data-fake-status-bar/.test(clock),
      fillGone: !/data-status-bar-fill|#111111/.test(fill),
      ccGone: !/data-control-center/.test(fakeCc) && /data-settings/.test(fakeCc),
      holdUnchanged: heldIcon === origHold && heldToggle === origToggle,
      holdWidgets: holdStatus.topics.widgets?.state === "pending",
      holdControls: holdStatus.topics.controls?.state === "pending",
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passWidgets: passStatus.topics.widgets?.state,
      cleanWidgets: cleanStatus.topics.widgets?.state,
      fixWidgets: fixStatus.topics.widgets?.state,
      fixLive: fixStatus.topics["live-activities"]?.state,
      fixStatus: fixStatus.topics["status-bars"]?.state,
      fixControls: fixStatus.topics.controls?.state,
      holdWidgets: holdStatus.topics.widgets?.state,
      holdControls: holdStatus.topics.controls?.state,
      remaining: passReport.plan.coverage.remaining,
      fake,
      hidden,
      fakeCc,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(cleanDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-system-chrome-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-rtl-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-rtl-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-rtl-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "rtl-mirror.css"),
      "html { transform: scaleX(-1); margin-left: 12px; padding-right: 8px; }\n",
    );
    fs.writeFileSync(
      path.join(fixDir, "root.html"),
      `<html dir="auto" lang="en"><body>App</body></html>\n`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Back.tsx"),
      `export function Back() {
  return <button type="button" aria-label="Back" className="chevron-left">Prev</button>;
}
`,
    );
    fs.writeFileSync(
      path.join(fixDir, "Back.swift"),
      `struct BackButton: View {
  var body: some View {
    Button("Back") { Image(systemName: "chevron.left") }
  }
}
`,
    );
    const origHold = `export function Back() {
  return <button type="button" aria-label="Back">←</button>;
}
`;
    fs.writeFileSync(path.join(holdDir, "Back.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const css = fs.readFileSync(path.join(fixDir, "rtl-mirror.css"), "utf8");
    const root = fs.readFileSync(path.join(fixDir, "root.html"), "utf8");
    const back = fs.readFileSync(path.join(fixDir, "Back.tsx"), "utf8");
    const backSwift = fs.readFileSync(path.join(fixDir, "Back.swift"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "Back.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passRtl: passStatus.topics["right-to-left"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixRtl: fixStatus.topics["right-to-left"]?.state === "applied",
      scaleGone: !/scaleX\(\s*-1\s*\)/.test(css),
      marginLogical: /margin-inline-start\s*:/.test(css) && !/margin-left\s*:/.test(css),
      paddingLogical: /padding-inline-end\s*:/.test(css) && !/padding-right\s*:/.test(css),
      dirLtr: /dir="ltr"/.test(root) && !/dir=["']auto["']/.test(root),
      chevronStart: /chevron-start/.test(back) && !/chevron-left/.test(back),
      chevronBackward: /chevron\.backward/.test(backSwift) && !/chevron\.left/.test(backSwift),
      holdUnchanged: held === origHold,
      holdRtl: holdStatus.topics["right-to-left"]?.state === "pending",
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passRtl: passStatus.topics["right-to-left"]?.state,
      fixRtl: fixStatus.topics["right-to-left"]?.state,
      holdRtl: holdStatus.topics["right-to-left"]?.state,
      remaining: passReport.plan.coverage.remaining,
      css,
      root,
      back,
      backSwift,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-rtl-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nested-modal-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nested-modal-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nested-modal-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "NestedSheet.tsx"),
      `export function NestedSheet() {
  return <dialog data-nested-modal>Share</dialog>;
}
`,
    );
    const origHold = `export function NestedSheet() {
  return (
    <dialog open>
      Share
      <dialog open>Confirm</dialog>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "NestedSheet.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const nested = fs.readFileSync(path.join(fixDir, "NestedSheet.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "NestedSheet.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passSheets: passStatus.topics.sheets?.state === "skipped-no-affordance",
      passAlerts: passStatus.topics.alerts?.state === "skipped-no-affordance",
      passAction: passStatus.topics["action-sheets"]?.state === "skipped-no-affordance",
      passModality: passStatus.topics.modality?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixSheets: fixStatus.topics.sheets?.state === "applied",
      fixAlerts: fixStatus.topics.alerts?.state === "applied",
      fixAction: fixStatus.topics["action-sheets"]?.state === "applied",
      fixModality: fixStatus.topics.modality?.state === "applied",
      markerGone: !/data-nested-modal/.test(nested) && /<dialog/.test(nested),
      holdUnchanged: held === origHold,
      holdSheets: holdStatus.topics.sheets?.state === "pending",
      holdAlerts: holdStatus.topics.alerts?.state === "pending",
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passSheets: passStatus.topics.sheets?.state,
      fixSheets: fixStatus.topics.sheets?.state,
      holdSheets: holdStatus.topics.sheets?.state,
      remaining: passReport.plan.coverage.remaining,
      nested,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-nested-modal-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-composed-also-pass-"));
  const menuDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-composed-also-menu-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, menuDir, { recursive: true });
    fs.writeFileSync(
      path.join(menuDir, "AppMenu.tsx"),
      `export function AppMenu() {
  return (
    <div role="menu">
      <button type="button" role="menuitem">Share</button>
      <button type="button" role="menuitem">Copy</button>
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
    const passReport = applyCatalog({
      cwd: passDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const menuReport = applyCatalog({
      cwd: menuDir,
      skillRoot,
      register: "product",
      write: true,
    });
    const passStatus = parseCatalogStatus(
      fs.readFileSync(path.join(passDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const menuStatus = parseCatalogStatus(
      fs.readFileSync(path.join(menuDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const hostText = [...walkSource(passDir), ...walkSource(menuDir)]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      menuChrome: menuReport.chrome.pass === true,
      passDark: passStatus.topics["dark-mode"]?.state === "already-compliant",
      passSymbols: passStatus.topics["sf-symbols"]?.state === "already-compliant",
      passContext: passStatus.topics["context-menus"]?.state === "skipped-no-affordance",
      passPull: passStatus.topics["pull-down-buttons"]?.state === "skipped-no-affordance",
      passPopup: passStatus.topics["pop-up-buttons"]?.state === "skipped-no-affordance",
      passNotify: passStatus.topics.notifications?.state === "skipped-no-affordance",
      passTabViews: passStatus.topics["tab-views"]?.state === "skipped-no-affordance",
      passMultitask: passStatus.topics.multitasking?.state === "skipped-no-affordance",
      passRatings: passStatus.topics["ratings-and-reviews"]?.state === "skipped-no-affordance",
      passWindows: passStatus.topics.windows?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      menuContext: menuStatus.topics["context-menus"]?.state === "already-compliant",
      menuPull: menuStatus.topics["pull-down-buttons"]?.state === "already-compliant",
      menuPopup: menuStatus.topics["pop-up-buttons"]?.state === "already-compliant",
      menuMenus: menuStatus.topics.menus?.state === "already-compliant",
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passDark: passStatus.topics["dark-mode"]?.state,
      passContext: passStatus.topics["context-menus"]?.state,
      menuContext: menuStatus.topics["context-menus"]?.state,
      remaining: passReport.plan.coverage.remaining,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(menuDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-composed-also-urls", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-slider-scroll-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-slider-scroll-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-slider-scroll-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <>
      <input type="range" data-volume-slider min="0" max="100" />
      <div data-nested-same-axis-scroll style={{ overflow: "auto" }}>
        List
      </div>
      <div popover="auto" data-nested-popover data-popover-warning data-popover-compact>
        Share
      </div>
    </>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <>
      <input type="range" aria-label="Volume" min="0" max="100" />
      <div className="overflow-y-auto">
        <div className="overflow-y-auto">Inner</div>
      </div>
      <div popover="auto">
        Share
        <div popover="auto">Confirm</div>
      </div>
    </>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passSliders: passStatus.topics.sliders?.state === "skipped-no-affordance",
      passScroll: passStatus.topics["scroll-views"]?.state === "skipped-no-affordance",
      passPopovers: passStatus.topics.popovers?.state === "skipped-no-affordance",
      passSheets: passStatus.topics.sheets?.state === "skipped-no-affordance",
      passPickers: passStatus.topics.pickers?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixSliders: fixStatus.topics.sliders?.state === "applied",
      fixScroll: fixStatus.topics["scroll-views"]?.state === "applied",
      fixPopovers: fixStatus.topics.popovers?.state === "applied",
      volumeMarkerGone: !/data-volume-slider/.test(fixed) && /type="range"/.test(fixed),
      scrollMarkerGone:
        !/data-nested-same-axis-scroll/.test(fixed) && /overflow:\s*["']auto["']/.test(fixed),
      popoverMarkersGone:
        !/data-nested-popover/.test(fixed) &&
        !/data-popover-warning/.test(fixed) &&
        !/data-popover-compact/.test(fixed) &&
        /popover="auto"/.test(fixed),
      holdUnchanged: held === origHold,
      holdSliders: holdStatus.topics.sliders?.state === "pending",
      holdScroll: holdStatus.topics["scroll-views"]?.state === "pending",
      holdPopovers: holdStatus.topics.popovers?.state === "pending",
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passSliders: passStatus.topics.sliders?.state,
      passScroll: passStatus.topics["scroll-views"]?.state,
      passPopovers: passStatus.topics.popovers?.state,
      fixSliders: fixStatus.topics.sliders?.state,
      fixScroll: fixStatus.topics["scroll-views"]?.state,
      fixPopovers: fixStatus.topics.popovers?.state,
      holdSliders: holdStatus.topics.sliders?.state,
      holdScroll: holdStatus.topics["scroll-views"]?.state,
      holdPopovers: holdStatus.topics.popovers?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-slider-scroll-popover-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-collections-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-collections-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-collections-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div
      data-collection
      data-custom-collection-layout
      data-text-collection
      data-overlapping-collection
    >
      <img alt="" />
      Cover
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-collection>
      <span>Alpha</span>
      <span>Beta</span>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passCollections: passStatus.topics.collections?.state === "skipped-no-affordance",
      passLists: passStatus.topics["lists-and-tables"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixCollections: fixStatus.topics.collections?.state === "applied",
      fixLists: fixStatus.topics["lists-and-tables"]?.state === "already-compliant",
      collectionKept: /data-collection/.test(fixed) && /<img\b/.test(fixed),
      markersGone:
        !/data-custom-collection-layout/.test(fixed) &&
        !/data-text-collection/.test(fixed) &&
        !/data-overlapping-collection/.test(fixed),
      notFlattenedToList: !/<ul\b/i.test(fixed) && !/<table\b/i.test(fixed),
      holdUnchanged: held === origHold,
      holdCollections: holdStatus.topics.collections?.state === "pending",
      holdLists: holdStatus.topics["lists-and-tables"]?.state === "already-compliant",
      holdNotList: !/<ul\b/i.test(held) && !/<table\b/i.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passCollections: passStatus.topics.collections?.state,
      passLists: passStatus.topics["lists-and-tables"]?.state,
      fixCollections: fixStatus.topics.collections?.state,
      holdCollections: holdStatus.topics.collections?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-collections-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-page-controls-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-page-controls-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-page-controls-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div
      data-page-control
      data-hierarchical-page-control
      data-too-many-page-dots
      data-many-page-indicator-images
      data-colored-page-indicators
    >
      <button type="button" />
      <button type="button" />
      <button type="button" />
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return <div data-page-control numberOfPages={12} />;
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passPageControls: passStatus.topics["page-controls"]?.state === "skipped-no-affordance",
      passProgress: passStatus.topics["progress-indicators"]?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixPageControls: fixStatus.topics["page-controls"]?.state === "applied",
      pageControlKept: /data-page-control/.test(fixed),
      markersGone:
        !/data-hierarchical-page-control/.test(fixed) &&
        !/data-too-many-page-dots/.test(fixed) &&
        !/data-many-page-indicator-images/.test(fixed) &&
        !/data-colored-page-indicators/.test(fixed),
      notProgress: !/<progress\b/i.test(fixed),
      notNumbered: !/>\s*1\s*</.test(fixed),
      holdUnchanged: held === origHold,
      holdPageControls: holdStatus.topics["page-controls"]?.state === "pending",
      holdNotGrid: !/data-collection/.test(held) && !/<ul\b/i.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passPageControls: passStatus.topics["page-controls"]?.state,
      passProgress: passStatus.topics["progress-indicators"]?.state,
      fixPageControls: fixStatus.topics["page-controls"]?.state,
      holdPageControls: holdStatus.topics["page-controls"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-page-controls-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-labels-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-labels-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-labels-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <p
      data-label
      data-editable-label
      data-long-label
      data-unselectable-label
    >
      Inbox
    </p>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <p data-label contenteditable="true">
      Name
    </p>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const formKept = /<label>/.test(
      fs.readFileSync(path.join(passDir, "CohesiveForm.tsx"), "utf8"),
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passLabels: passStatus.topics.labels?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      formKept,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixLabels: fixStatus.topics.labels?.state === "applied",
      labelKept: /data-label/.test(fixed),
      markersGone:
        !/data-editable-label/.test(fixed) &&
        !/data-long-label/.test(fixed) &&
        !/data-unselectable-label/.test(fixed),
      notTextField: !/<input\b/i.test(fixed) && !/<textarea\b/i.test(fixed),
      holdUnchanged: held === origHold,
      holdLabels: holdStatus.topics.labels?.state === "pending",
      holdNotField: !/<input\b/i.test(held) && !/<textarea\b/i.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passLabels: passStatus.topics.labels?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixLabels: fixStatus.topics.labels?.state,
      holdLabels: holdStatus.topics.labels?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-labels-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-text-views-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-text-views-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-text-views-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <textarea
      data-text-view
      data-short-text-view
      data-unselectable-text-view
    >
      Notes
    </textarea>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <textarea rows="1">Name</textarea>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const inputKept = /<input\b/.test(
      fs.readFileSync(path.join(passDir, "CohesiveForm.tsx"), "utf8"),
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passTextViews: passStatus.topics["text-views"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passLabels: passStatus.topics.labels?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      inputKept,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixTextViews: fixStatus.topics["text-views"]?.state === "applied",
      textViewKept: /<textarea\b/.test(fixed) && /data-text-view/.test(fixed),
      markersGone:
        !/data-short-text-view/.test(fixed) &&
        !/data-unselectable-text-view/.test(fixed),
      notField: !/<input\b/i.test(fixed) && !/<label\b/i.test(fixed),
      holdUnchanged: held === origHold,
      holdTextViews: holdStatus.topics["text-views"]?.state === "pending",
      holdNotField: !/<input\b/i.test(held) && !/<label\b/i.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passTextViews: passStatus.topics["text-views"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixTextViews: fixStatus.topics["text-views"]?.state,
      holdTextViews: holdStatus.topics["text-views"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-text-views-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-image-views-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-image-views-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-image-views-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div
      data-image-view
      data-interactive-image-view
      data-icon-image-view
      data-text-on-image-view
    >
      <img alt="" src="/photo.jpg" />
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-image-view onClick={() => {}}>
      <img alt="" src="/photo.jpg" />
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passImageViews: passStatus.topics["image-views"]?.state === "skipped-no-affordance",
      passImages: passStatus.topics.images?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixImageViews: fixStatus.topics["image-views"]?.state === "applied",
      imageViewKept: /data-image-view/.test(fixed) && /<img\b/.test(fixed),
      markersGone:
        !/data-interactive-image-view/.test(fixed) &&
        !/data-icon-image-view/.test(fixed) &&
        !/data-text-on-image-view/.test(fixed),
      notButton: !/<button\b/i.test(fixed),
      holdUnchanged: held === origHold,
      holdImageViews: holdStatus.topics["image-views"]?.state === "pending",
      holdNotButton: !/<button\b/i.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passImageViews: passStatus.topics["image-views"]?.state,
      passImages: passStatus.topics.images?.state,
      fixImageViews: fixStatus.topics["image-views"]?.state,
      holdImageViews: holdStatus.topics["image-views"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-image-views-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-charts-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-charts-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-charts-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div
      data-chart
      data-color-only-chart
      data-chart-hover-only
      data-chart-as-table
      data-overcrowded-chart
    >
      <span>Steps</span>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-chart onMouseEnter={() => {}}>
      <span>Steps</span>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const svgKept = /<svg\b/.test(
      fs.readFileSync(path.join(passDir, "CompactListBrowser.tsx"), "utf8"),
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passCharts: passStatus.topics.charts?.state === "skipped-no-affordance",
      passCharting: passStatus.topics["charting-data"]?.state === "skipped-no-affordance",
      passLists: passStatus.topics["lists-and-tables"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      svgKept,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixCharts: fixStatus.topics.charts?.state === "applied",
      fixCharting: fixStatus.topics["charting-data"]?.state === "applied",
      chartKept: /data-chart/.test(fixed),
      markersGone:
        !/data-color-only-chart/.test(fixed) &&
        !/data-chart-hover-only/.test(fixed) &&
        !/data-chart-as-table/.test(fixed) &&
        !/data-overcrowded-chart/.test(fixed),
      notTable: !/<table\b/i.test(fixed),
      holdUnchanged: held === origHold,
      holdCharts: holdStatus.topics.charts?.state === "pending",
      holdCharting: holdStatus.topics["charting-data"]?.state === "pending",
      holdNotTable: !/<table\b/i.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passCharts: passStatus.topics.charts?.state,
      passCharting: passStatus.topics["charting-data"]?.state,
      fixCharts: fixStatus.topics.charts?.state,
      holdCharts: holdStatus.topics.charts?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-charts-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-disclosure-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-disclosure-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-disclosure-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <details
      data-disclosure
      data-many-disclosure-buttons
      data-unlabeled-disclosure
      data-advanced-unhidden
    >
      <summary>Advanced Options</summary>
      <p>More</p>
    </details>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <details>
      <p>Advanced</p>
    </details>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passDisclosure:
        passStatus.topics["disclosure-controls"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixDisclosure: fixStatus.topics["disclosure-controls"]?.state === "applied",
      disclosureKept: /<details\b/.test(fixed) && /data-disclosure/.test(fixed),
      markersGone:
        !/data-many-disclosure-buttons/.test(fixed) &&
        !/data-unlabeled-disclosure/.test(fixed) &&
        !/data-advanced-unhidden/.test(fixed),
      summaryKept: /<summary>Advanced Options<\/summary>/.test(fixed),
      holdUnchanged: held === origHold,
      holdDisclosure: holdStatus.topics["disclosure-controls"]?.state === "pending",
      holdNotLabeled: !/<summary\b/i.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passDisclosure: passStatus.topics["disclosure-controls"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixDisclosure: fixStatus.topics["disclosure-controls"]?.state,
      holdDisclosure: holdStatus.topics["disclosure-controls"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-disclosure-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-boxes-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-boxes-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-boxes-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div
      data-box
      data-nested-boxes
      data-oversized-box
    >
      <p>Related</p>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-box>
      <div data-box>
        <p>Inner group</p>
      </div>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passBoxes: passStatus.topics.boxes?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixBoxes: fixStatus.topics.boxes?.state === "applied",
      boxKept: /data-box/.test(fixed),
      markersGone:
        !/data-nested-boxes/.test(fixed) && !/data-oversized-box/.test(fixed),
      notCard: !/class=["']card["']/.test(fixed),
      holdUnchanged: held === origHold,
      holdBoxes: holdStatus.topics.boxes?.state === "pending",
      holdStillNested: /data-box[\s\S]*data-box/.test(held),
      holdNotFlattened: (held.match(/\bdata-box\b/g) || []).length >= 2,
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passBoxes: passStatus.topics.boxes?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixBoxes: fixStatus.topics.boxes?.state,
      holdBoxes: holdStatus.topics.boxes?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-boxes-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-edit-menus-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-edit-menus-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-edit-menus-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div
      data-edit-menu
      data-custom-edit-menu
      data-edit-no-selection
      data-redundant-edit-controls
    >
      <button type="button">Look Up</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-edit-menu>
      <button type="button">Cut</button>
      <button type="button">Copy</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passEditMenus: passStatus.topics["edit-menus"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixEditMenus: fixStatus.topics["edit-menus"]?.state === "applied",
      editMenuKept: /data-edit-menu/.test(fixed),
      markersGone:
        !/data-custom-edit-menu/.test(fixed) &&
        !/data-edit-no-selection/.test(fixed) &&
        !/data-redundant-edit-controls/.test(fixed),
      lookUpKept: />Look Up</.test(fixed),
      holdUnchanged: held === origHold,
      holdEditMenus: holdStatus.topics["edit-menus"]?.state === "pending",
      holdStillCut: />Cut</.test(held) && />Copy</.test(held),
      holdNotInvented: !/aria-disabled/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passEditMenus: passStatus.topics["edit-menus"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixEditMenus: fixStatus.topics["edit-menus"]?.state,
      holdEditMenus: holdStatus.topics["edit-menus"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-edit-menus-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-offering-help-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-offering-help-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-offering-help-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div
      data-help
      data-wrong-platform-help
      data-standard-component-help
      data-promotional-tip
    >
      Swipe the canvas to add a stop.
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-help>Click the button on iPhone</div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passHelp: passStatus.topics["offering-help"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixHelp: fixStatus.topics["offering-help"]?.state === "applied",
      helpKept: /data-help/.test(fixed),
      markersGone:
        !/data-wrong-platform-help/.test(fixed) &&
        !/data-standard-component-help/.test(fixed) &&
        !/data-promotional-tip/.test(fixed),
      taskCopyKept: /Swipe the canvas to add a stop/.test(fixed),
      holdUnchanged: held === origHold,
      holdHelp: holdStatus.topics["offering-help"]?.state === "pending",
      holdStillClick: /Click the button on iPhone/.test(held),
      holdNotInvented: !/tap the button/.test(held) && !/on iPad/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passHelp: passStatus.topics["offering-help"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixHelp: fixStatus.topics["offering-help"]?.state,
      holdHelp: holdStatus.topics["offering-help"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-offering-help-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-web-views-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-web-views-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-web-views-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <iframe
      data-web-view
      data-no-web-back-forward
      data-safari-replica
      src="https://example.com"
      title="Article"
    />
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <iframe
      data-web-view
      data-web-view-multipage
      src="https://example.com"
      title="Article"
    />
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passWebViews: passStatus.topics["web-views"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixWebViews: fixStatus.topics["web-views"]?.state === "applied",
      webViewKept: /data-web-view/.test(fixed) && /<iframe/.test(fixed),
      markersGone:
        !/data-no-web-back-forward/.test(fixed) && !/data-safari-replica/.test(fixed),
      holdUnchanged: held === origHold,
      holdWebViews: holdStatus.topics["web-views"]?.state === "pending",
      holdStillIframe: /<iframe/.test(held) && /data-web-view-multipage/.test(held),
      holdNotInvented: !/\bBack\b/.test(held) && !/\bForward\b/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passWebViews: passStatus.topics["web-views"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixWebViews: fixStatus.topics["web-views"]?.state,
      holdWebViews: holdStatus.topics["web-views"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-web-views-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-activity-views-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-activity-views-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-activity-views-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div
      data-activity-view
      data-duplicate-activity-action
      data-alt-activity-reveal
    >
      <button type="button">Share</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-activity-view>
      <button type="button">Print</button>
      <button type="button">Print</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passActivity: passStatus.topics["activity-views"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixActivity: fixStatus.topics["activity-views"]?.state === "applied",
      activityKept: /data-activity-view/.test(fixed),
      markersGone:
        !/data-duplicate-activity-action/.test(fixed) &&
        !/data-alt-activity-reveal/.test(fixed),
      shareKept: />Share</.test(fixed),
      holdUnchanged: held === origHold,
      holdActivity: holdStatus.topics["activity-views"]?.state === "pending",
      holdStillPrint: (held.match(/>Print</g) || []).length >= 2,
      holdNotInvented: !/Print Transaction/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passActivity: passStatus.topics["activity-views"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixActivity: fixStatus.topics["activity-views"]?.state,
      holdActivity: holdStatus.topics["activity-views"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-activity-views-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-printing-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-printing-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-printing-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <button type="button" data-print data-print-nothing data-duplicate-page-orientation>Print</button>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <button type="button" data-print data-nothing-printable>Print</button>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passPrinting: passStatus.topics.printing?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixPrinting: fixStatus.topics.printing?.state === "applied",
      printKept: /data-print/.test(fixed) && />\s*Print\s*</.test(fixed),
      markersGone:
        !/data-print-nothing/.test(fixed) &&
        !/data-duplicate-page-orientation/.test(fixed),
      holdUnchanged: held === origHold,
      holdPrinting: holdStatus.topics.printing?.state === "pending",
      holdStillPrint: />\s*Print\s*</.test(held) && /data-nothing-printable/.test(held),
      holdNotInvented: !/disabled/.test(held) && !/aria-disabled/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passPrinting: passStatus.topics.printing?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixPrinting: fixStatus.topics.printing?.state,
      holdPrinting: holdStatus.topics.printing?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-printing-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-fullscreen-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-fullscreen-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-fullscreen-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div
      data-fullscreen
      data-programmatic-resize
      data-auto-exit-fullscreen
      data-custom-window-mode-menu
    >
      <button type="button">Enter Full Screen</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-fullscreen>
      <button type="button" onClick={() => { requestFullscreen(); resizeTo(1920, 1080); }}>Enter Full Screen</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passFullscreen: passStatus.topics["going-full-screen"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixFullscreen: fixStatus.topics["going-full-screen"]?.state === "applied",
      fullscreenKept:
        /data-fullscreen/.test(fixed) && />\s*Enter Full Screen\s*</.test(fixed),
      markersGone:
        !/data-programmatic-resize/.test(fixed) &&
        !/data-auto-exit-fullscreen/.test(fixed) &&
        !/data-custom-window-mode-menu/.test(fixed),
      holdUnchanged: held === origHold,
      holdFullscreen: holdStatus.topics["going-full-screen"]?.state === "pending",
      holdStillResize: /data-fullscreen/.test(held) && /\bresizeTo\s*\(/.test(held),
      holdNotInvented: !/disabled/.test(held) && !/aria-disabled/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passFullscreen: passStatus.topics["going-full-screen"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixFullscreen: fixStatus.topics["going-full-screen"]?.state,
      holdFullscreen: holdStatus.topics["going-full-screen"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-going-full-screen-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-files-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-files-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-files-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div
      data-file-browser
      data-custom-file-toolbar
      data-show-extensions-by-default
      data-explicit-save-required
    >
      <button type="button">Open</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-file-browser data-no-autosave>
      <button type="button">Save</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passFilesTopic: passStatus.topics["file-management"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixFiles: fixStatus.topics["file-management"]?.state === "applied",
      browserKept:
        /data-file-browser/.test(fixed) && />\s*Open\s*</.test(fixed),
      markersGone:
        !/data-custom-file-toolbar/.test(fixed) &&
        !/data-show-extensions-by-default/.test(fixed) &&
        !/data-explicit-save-required/.test(fixed),
      holdUnchanged: held === origHold,
      holdFiles: holdStatus.topics["file-management"]?.state === "pending",
      holdStillSave: />\s*Save\s*</.test(held) && /data-no-autosave/.test(held),
      holdNotInvented: !/autosave/i.test(held.replace("data-no-autosave", "")),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passFilesTopic: passStatus.topics["file-management"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixFiles: fixStatus.topics["file-management"]?.state,
      holdFiles: holdStatus.topics["file-management"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-file-management-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-focus-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-focus-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-focus-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-focus-system data-steal-focus data-custom-focus-effect>
      <button type="button">Item</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-focus-system>
      <button type="button" ref={(el) => el && el.focus()}>Item</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passFocus: passStatus.topics["focus-and-selection"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixFocus: fixStatus.topics["focus-and-selection"]?.state === "applied",
      systemKept:
        /data-focus-system/.test(fixed) && />\s*Item\s*</.test(fixed),
      markersGone:
        !/data-steal-focus/.test(fixed) &&
        !/data-custom-focus-effect/.test(fixed),
      holdUnchanged: held === origHold,
      holdFocus: holdStatus.topics["focus-and-selection"]?.state === "pending",
      holdStillFocus: /data-focus-system/.test(held) && /\.focus\s*\(/.test(held),
      holdNotInvented: !/blur\(/.test(held) && !/autoFocus/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passFocus: passStatus.topics["focus-and-selection"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixFocus: fixStatus.topics["focus-and-selection"]?.state,
      holdFocus: holdStatus.topics["focus-and-selection"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-focus-and-selection-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-account-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-account-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-account-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-account data-force-account data-buried-deletion data-passcode-auth>
      <button type="button">Sign In</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-account data-no-guest>
      <button type="button">Sign In</button>
      <p>Enter your passcode</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passAccount: passStatus.topics["managing-accounts"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixAccount: fixStatus.topics["managing-accounts"]?.state === "applied",
      systemKept:
        /data-account/.test(fixed) && />\s*Sign In\s*</.test(fixed),
      markersGone:
        !/data-force-account/.test(fixed) &&
        !/data-buried-deletion/.test(fixed) &&
        !/data-passcode-auth/.test(fixed),
      holdUnchanged: held === origHold,
      holdAccount: holdStatus.topics["managing-accounts"]?.state === "pending",
      holdStillWall:
        /data-account/.test(held) &&
        /data-no-guest/.test(held) &&
        /passcode/i.test(held) &&
        />\s*Sign In\s*</.test(held),
      holdNotInvented:
        !/Skip/.test(held) &&
        !/without an account/i.test(held) &&
        !/Delete Account/.test(held) &&
        !/Face ID/.test(held) &&
        !/Touch ID/.test(held) &&
        !/guest/i.test(held.replace("data-no-guest", "")),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passAccount: passStatus.topics["managing-accounts"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixAccount: fixStatus.topics["managing-accounts"]?.state,
      holdAccount: holdStatus.topics["managing-accounts"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-managing-accounts-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tabview-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tabview-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tabview-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-tab-view data-popup-tabs data-too-many-tabs data-cross-pane>
      <div role="tablist">
        <button type="button" role="tab">One</button>
        <button type="button" role="tab">Two</button>
      </div>
      <div role="tabpanel">Pane</div>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-tab-view>
      <div role="tablist">
        <button type="button" role="tab">One</button>
        <button type="button" role="tab">Two</button>
        <button type="button" role="tab">Three</button>
        <button type="button" role="tab">Four</button>
        <button type="button" role="tab">Five</button>
        <button type="button" role="tab">Six</button>
        <button type="button" role="tab">Seven</button>
      </div>
      <div role="tabpanel">Pane</div>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passTabs: passStatus.topics["tab-views"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixTabs: fixStatus.topics["tab-views"]?.state === "applied",
      systemKept:
        /data-tab-view/.test(fixed) &&
        />\s*One\s*</.test(fixed) &&
        />\s*Pane\s*</.test(fixed),
      markersGone:
        !/data-popup-tabs/.test(fixed) &&
        !/data-too-many-tabs/.test(fixed) &&
        !/data-cross-pane/.test(fixed),
      holdUnchanged: held === origHold,
      holdTabs: holdStatus.topics["tab-views"]?.state === "pending",
      holdStillSeven:
        /data-tab-view/.test(held) &&
        (held.match(/role=["']tab["']/g) || []).length === 7,
      holdNotInvented: !/<select\b/i.test(held) && !/popup/i.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passTabs: passStatus.topics["tab-views"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixTabs: fixStatus.topics["tab-views"]?.state,
      holdTabs: holdStatus.topics["tab-views"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-tab-views-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-multitask-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-multitask-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-multitask-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-multitask data-no-pause-on-background data-notify-routine data-ignore-audio-interrupt>
      <video src="clip.mp4"></video>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-multitask>
      <video src="clip.mp4" data-keep-playing></video>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passMultitask: passStatus.topics.multitasking?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixMultitask: fixStatus.topics.multitasking?.state === "applied",
      systemKept:
        /data-multitask/.test(fixed) && /<video\b/.test(fixed) && /clip\.mp4/.test(fixed),
      markersGone:
        !/data-no-pause-on-background/.test(fixed) &&
        !/data-notify-routine/.test(fixed) &&
        !/data-ignore-audio-interrupt/.test(fixed),
      holdUnchanged: held === origHold,
      holdMultitask: holdStatus.topics.multitasking?.state === "pending",
      holdStillPlaying:
        /data-multitask/.test(held) &&
        /<video\b/.test(held) &&
        /data-keep-playing/.test(held),
      holdNotInvented:
        !/visibilitychange/i.test(held) &&
        !/document\.hidden/.test(held) &&
        !/\.pause\s*\(/.test(held) &&
        !/notification/i.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passMultitask: passStatus.topics.multitasking?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixMultitask: fixStatus.topics.multitasking?.state,
      holdMultitask: holdStatus.topics.multitasking?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-multitasking-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ratings-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ratings-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ratings-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-rating-prompt data-rating-first-launch data-rating-interrupt data-rating-pester>
      <button type="button">Rate</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-rating-prompt>
      <button type="button" onClick={() => requestReview()}>Rate</button>
      <button type="button" onClick={() => requestReview()}>Again</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passRatings: passStatus.topics["ratings-and-reviews"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixRatings: fixStatus.topics["ratings-and-reviews"]?.state === "applied",
      systemKept:
        /data-rating-prompt/.test(fixed) && />\s*Rate\s*</.test(fixed),
      markersGone:
        !/data-rating-first-launch/.test(fixed) &&
        !/data-rating-interrupt/.test(fixed) &&
        !/data-rating-pester/.test(fixed),
      holdUnchanged: held === origHold,
      holdRatings: holdStatus.topics["ratings-and-reviews"]?.state === "pending",
      holdStillPester:
        /data-rating-prompt/.test(held) &&
        (held.match(/\brequestReview\s*\(/g) || []).length === 2,
      holdNotInvented:
        !/SKStoreReviewController/.test(held) &&
        !/setTimeout/.test(held) &&
        !/at least a week/i.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passRatings: passStatus.topics["ratings-and-reviews"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixRatings: fixStatus.topics["ratings-and-reviews"]?.state,
      holdRatings: holdStatus.topics["ratings-and-reviews"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-ratings-and-reviews-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-windows-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-windows-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-windows-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-window data-open-window-default data-custom-window-frame data-call-scene data-critical-bottom-bar>
      <button type="button">Title</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-window>
      <footer>
        <button type="button">Save</button>
      </footer>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passWindows: passStatus.topics.windows?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixWindows: fixStatus.topics.windows?.state === "applied",
      systemKept:
        /data-window/.test(fixed) && />\s*Title\s*</.test(fixed),
      markersGone:
        !/data-open-window-default/.test(fixed) &&
        !/data-custom-window-frame/.test(fixed) &&
        !/data-call-scene/.test(fixed) &&
        !/data-critical-bottom-bar/.test(fixed),
      holdUnchanged: held === origHold,
      holdWindows: holdStatus.topics.windows?.state === "pending",
      holdStillSave:
        /data-window/.test(held) &&
        /<footer\b/.test(held) &&
        />\s*Save\s*</.test(held),
      holdNotInvented:
        !/inspector/i.test(held) &&
        !/title bar/i.test(held) &&
        !/NSWindow/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passWindows: passStatus.topics.windows?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixWindows: fixStatus.topics.windows?.state,
      holdWindows: holdStatus.topics.windows?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-windows-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-playing-video-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-playing-video-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-playing-video-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-video-player data-custom-video-player data-letterbox-padding data-resume-prompt data-video-loading-screen>
      <button type="button">Watch</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-video-player>
      <button type="button">Resume playback?</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passVideo: passStatus.topics["playing-video"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixVideo: fixStatus.topics["playing-video"]?.state === "applied",
      systemKept:
        /data-video-player/.test(fixed) && />\s*Watch\s*</.test(fixed),
      markersGone:
        !/data-custom-video-player/.test(fixed) &&
        !/data-letterbox-padding/.test(fixed) &&
        !/data-resume-prompt/.test(fixed) &&
        !/data-video-loading-screen/.test(fixed),
      holdUnchanged: held === origHold,
      holdVideo: holdStatus.topics["playing-video"]?.state === "pending",
      holdStillResume:
        /data-video-player/.test(held) &&
        />\s*Resume playback\?\s*</.test(held),
      holdNotInvented:
        !/AVPlayerViewController/.test(held) &&
        !/autoplay/i.test(held) &&
        !/object-fit/.test(held) &&
        !/keydown/.test(held) &&
        !/\bSpace\b/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passVideo: passStatus.topics["playing-video"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixVideo: fixStatus.topics["playing-video"]?.state,
      holdVideo: holdStatus.topics["playing-video"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-playing-video-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-playing-haptics-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-playing-haptics-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-playing-haptics-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-haptic data-haptic-wrong-meaning data-haptic-overuse data-haptic-required>
      <button type="button">Tap</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-haptic>
      <button type="button" onClick={() => navigator.vibrate(10)}>Tap</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passHaptic: passStatus.topics["playing-haptics"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixHaptic: fixStatus.topics["playing-haptics"]?.state === "applied",
      systemKept:
        /data-haptic/.test(fixed) && />\s*Tap\s*</.test(fixed),
      markersGone:
        !/data-haptic-wrong-meaning/.test(fixed) &&
        !/data-haptic-overuse/.test(fixed) &&
        !/data-haptic-required/.test(fixed),
      holdUnchanged: held === origHold,
      holdHaptic: holdStatus.topics["playing-haptics"]?.state === "pending",
      holdStillVibrate:
        /data-haptic/.test(held) &&
        /navigator\.vibrate\s*\(\s*10\s*\)/.test(held) &&
        />\s*Tap\s*</.test(held),
      holdNotInvented:
        !/CHHapticEngine/.test(held) &&
        !/mute/i.test(held) &&
        !/Haptics off/i.test(held) &&
        !/UIFeedbackGenerator/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passHaptic: passStatus.topics["playing-haptics"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixHaptic: fixStatus.topics["playing-haptics"]?.state,
      holdHaptic: holdStatus.topics["playing-haptics"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-playing-haptics-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-airplay-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-airplay-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-airplay-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-airplay data-airplay-stop-on-background data-interrupt-airplay data-auto-mirror data-airplay-background-loop>
      <button type="button">Stream</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-airplay>
      <video autoPlay />
      <button type="button">Stream</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passAirplay: passStatus.topics.airplay?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixAirplay: fixStatus.topics.airplay?.state === "applied",
      systemKept:
        /data-airplay/.test(fixed) && />\s*Stream\s*</.test(fixed),
      markersGone:
        !/data-airplay-stop-on-background/.test(fixed) &&
        !/data-interrupt-airplay/.test(fixed) &&
        !/data-auto-mirror/.test(fixed) &&
        !/data-airplay-background-loop/.test(fixed),
      holdUnchanged: held === origHold,
      holdAirplay: holdStatus.topics.airplay?.state === "pending",
      holdStillAutoplay:
        /data-airplay/.test(held) &&
        /<video\b[^>]*\bautoPlay\b/i.test(held) &&
        />\s*Stream\s*</.test(held),
      holdNotInvented:
        !/ambient/i.test(held) &&
        !/AVRoutePickerView/.test(held) &&
        !/AirPlayButton/.test(held) &&
        !/keep-playing/i.test(held) &&
        !/usesExternalPlayback/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passAirplay: passStatus.topics.airplay?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixAirplay: fixStatus.topics.airplay?.state,
      holdAirplay: holdStatus.topics.airplay?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-airplay-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-gyro-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-gyro-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-gyro-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-gyro data-motion-no-benefit data-motion-direct-ui>
      <button type="button">Move</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-gyro>
      <button type="button" onClick={() => window.addEventListener("devicemotion", () => {})}>Move</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passGyro: passStatus.topics["gyro-and-accelerometer"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixGyro: fixStatus.topics["gyro-and-accelerometer"]?.state === "applied",
      systemKept:
        /data-gyro/.test(fixed) && />\s*Move\s*</.test(fixed),
      markersGone:
        !/data-motion-no-benefit/.test(fixed) &&
        !/data-motion-direct-ui/.test(fixed),
      holdUnchanged: held === origHold,
      holdGyro: holdStatus.topics["gyro-and-accelerometer"]?.state === "pending",
      holdStillMotion:
        /data-gyro/.test(held) &&
        /addEventListener\s*\(\s*["']devicemotion["']/.test(held) &&
        />\s*Move\s*</.test(held),
      holdNotInvented:
        !/CMMotionManager/.test(held) &&
        !/CoreMotion/.test(held) &&
        !/gameplay/i.test(held) &&
        !/startDeviceMotionUpdates/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passGyro: passStatus.topics["gyro-and-accelerometer"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixGyro: fixStatus.topics["gyro-and-accelerometer"]?.state,
      holdGyro: holdStatus.topics["gyro-and-accelerometer"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-gyro-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-quick-actions-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-quick-actions-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-quick-actions-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-quick-action data-quick-action-app-name data-quick-action-emoji>
      <button type="button">Inbox</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-quick-action>
      <button type="button">Inbox \u{1F4E5}</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passQuick:
        passStatus.topics["home-screen-quick-actions"]?.state ===
        "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixQuick:
        fixStatus.topics["home-screen-quick-actions"]?.state === "applied",
      systemKept:
        /data-quick-action/.test(fixed) && />\s*Inbox\s*</.test(fixed),
      markersGone:
        !/data-quick-action-app-name/.test(fixed) &&
        !/data-quick-action-emoji/.test(fixed),
      holdUnchanged: held === origHold,
      holdQuick:
        holdStatus.topics["home-screen-quick-actions"]?.state === "pending",
      holdStillEmoji:
        /data-quick-action/.test(held) &&
        /Inbox/.test(held) &&
        /\p{Extended_Pictographic}/u.test(held),
      holdNotInvented:
        !/UIApplicationShortcutIcon/.test(held) &&
        !/SF Symbol/i.test(held) &&
        !/symbolName/.test(held) &&
        !/square\.and\.pencil/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passQuick: passStatus.topics["home-screen-quick-actions"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixQuick: fixStatus.topics["home-screen-quick-actions"]?.state,
      holdQuick: holdStatus.topics["home-screen-quick-actions"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-quick-actions-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-live-viewing-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-live-viewing-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-live-viewing-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-live-viewing data-live-unmarked data-live-audio-after-leave>
      <button type="button">Watch</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-live-viewing>
      <button type="button">Watch</button>
      <span>On demand</span>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passLive:
        passStatus.topics["live-viewing-apps"]?.state ===
        "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixLive:
        fixStatus.topics["live-viewing-apps"]?.state === "applied",
      systemKept:
        /data-live-viewing/.test(fixed) && />\s*Watch\s*</.test(fixed),
      markersGone:
        !/data-live-unmarked/.test(fixed) &&
        !/data-live-audio-after-leave/.test(fixed),
      holdUnchanged: held === origHold,
      holdLive:
        holdStatus.topics["live-viewing-apps"]?.state === "pending",
      holdStillVod:
        /data-live-viewing/.test(held) &&
        /Watch/.test(held) &&
        /On demand/.test(held),
      holdNotInvented:
        !/data-live-badge/.test(held) &&
        !/>\s*Live\s*</.test(held) &&
        !/Watch Now/.test(held) &&
        !/EPG/i.test(held) &&
        !/electronic program/i.test(held) &&
        !/visibilitychange/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passLive: passStatus.topics["live-viewing-apps"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixLive: fixStatus.topics["live-viewing-apps"]?.state,
      holdLive: holdStatus.topics["live-viewing-apps"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-live-viewing-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-snippets-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-snippets-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-snippets-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-snippet data-snippet-dialogue data-snippet-too-tall>
      <button type="button">Done</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-snippet style={{ height: 480 }}>
      <button type="button">Done</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passSnippet:
        passStatus.topics.snippets?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixSnippet: fixStatus.topics.snippets?.state === "applied",
      systemKept:
        /data-snippet/.test(fixed) && />\s*Done\s*</.test(fixed),
      markersGone:
        !/data-snippet-dialogue/.test(fixed) &&
        !/data-snippet-too-tall/.test(fixed),
      holdUnchanged: held === origHold,
      holdSnippet: holdStatus.topics.snippets?.state === "pending",
      holdStillTall:
        /data-snippet/.test(held) &&
        /Done/.test(held) &&
        /height:\s*480/.test(held),
      holdNotInvented:
        !/SnippetIntent/.test(held) &&
        !/maxHeight/.test(held) &&
        !/max-height/.test(held) &&
        !/400/.test(held) &&
        !/AppShortcut/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passSnippet: passStatus.topics.snippets?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixSnippet: fixStatus.topics.snippets?.state,
      holdSnippet: holdStatus.topics.snippets?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-snippets-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-genai-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-genai-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-genai-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-generative data-ai-as-human data-genai-no-revert>
      <button type="button">Draft</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-generative>
      As a human editor I rewrote this paragraph.
      <button type="button">Draft</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passGenai:
        passStatus.topics["generative-ai"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixGenai: fixStatus.topics["generative-ai"]?.state === "applied",
      systemKept:
        /data-generative/.test(fixed) && />\s*Draft\s*</.test(fixed),
      markersGone:
        !/data-ai-as-human/.test(fixed) &&
        !/data-genai-no-revert/.test(fixed),
      holdUnchanged: held === origHold,
      holdGenai: holdStatus.topics["generative-ai"]?.state === "pending",
      holdStillHuman:
        /data-generative/.test(held) &&
        /As a human editor/.test(held) &&
        /Draft/.test(held),
      holdNotInvented:
        !/AI-generated/.test(held) &&
        !/generated by AI/i.test(held) &&
        !/LanguageModelSession/.test(held) &&
        !/Undo/.test(held) &&
        !/Retry/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passGenai: passStatus.topics["generative-ai"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixGenai: fixStatus.topics["generative-ai"]?.state,
      holdGenai: holdStatus.topics["generative-ai"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-generative-ai-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-always-on-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-always-on-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-always-on-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-always-on data-always-on-sensitive data-always-on-stop-motion>
      <button type="button">Glance</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-always-on>
      Account balance $12,400
      <button type="button">Glance</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passAlwaysOn:
        passStatus.topics["always-on"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixAlwaysOn: fixStatus.topics["always-on"]?.state === "applied",
      systemKept:
        /data-always-on/.test(fixed) && />\s*Glance\s*</.test(fixed),
      markersGone:
        !/data-always-on-sensitive/.test(fixed) &&
        !/data-always-on-stop-motion/.test(fixed),
      holdUnchanged: held === origHold,
      holdAlwaysOn: holdStatus.topics["always-on"]?.state === "pending",
      holdStillSensitive:
        /data-always-on/.test(held) &&
        /Account balance/.test(held) &&
        /Glance/.test(held),
      holdNotInvented:
        !/redacted/.test(held) &&
        !/privacySensitive/.test(held) &&
        !/isLuminanceReduced/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passAlwaysOn: passStatus.topics["always-on"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixAlwaysOn: fixStatus.topics["always-on"]?.state,
      holdAlwaysOn: holdStatus.topics["always-on"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-always-on-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shareplay-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shareplay-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shareplay-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-shareplay data-shareplay-adjective data-shareplay-inflected>
      <button type="button">Join</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-shareplay>
      Join Spatial SharePlay
      <button type="button">Join</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passShareplay:
        passStatus.topics.shareplay?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixShareplay: fixStatus.topics.shareplay?.state === "applied",
      systemKept:
        /data-shareplay/.test(fixed) && />\s*Join\s*</.test(fixed),
      markersGone:
        !/data-shareplay-adjective/.test(fixed) &&
        !/data-shareplay-inflected/.test(fixed),
      holdUnchanged: held === origHold,
      holdShareplay: holdStatus.topics.shareplay?.state === "pending",
      holdStillAdjective:
        /data-shareplay/.test(held) &&
        /Spatial SharePlay/.test(held) &&
        /Join/.test(held),
      holdNotInvented:
        !/GroupActivity/.test(held) &&
        !/GroupSession/.test(held) &&
        !/ActivitySharingView/.test(held) &&
        !/FaceTime/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passShareplay: passStatus.topics.shareplay?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixShareplay: fixStatus.topics.shareplay?.state,
      holdShareplay: holdStatus.topics.shareplay?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-shareplay-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nearby-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nearby-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nearby-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-nearby data-nearby-only data-nearby-portrait>
      <button type="button">Transfer</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-nearby>
      Bring devices close — the only way to transfer a song
      <button type="button">Transfer</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passNearby:
        passStatus.topics["nearby-interactions"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixNearby: fixStatus.topics["nearby-interactions"]?.state === "applied",
      systemKept:
        /data-nearby/.test(fixed) && />\s*Transfer\s*</.test(fixed),
      markersGone:
        !/data-nearby-only/.test(fixed) &&
        !/data-nearby-portrait/.test(fixed),
      holdUnchanged: held === origHold,
      holdNearby: holdStatus.topics["nearby-interactions"]?.state === "pending",
      holdStillOnlyWay:
        /data-nearby/.test(held) &&
        /the only way to transfer/.test(held) &&
        /Transfer/.test(held),
      holdNotInvented:
        !/NISession/.test(held) &&
        !/NINearbyObject/.test(held) &&
        !/NINearbyPeerConfiguration/.test(held) &&
        !/NearbyInteraction/.test(held) &&
        !/NIDiscoveryToken/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passNearby: passStatus.topics["nearby-interactions"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixNearby: fixStatus.topics["nearby-interactions"]?.state,
      holdNearby: holdStatus.topics["nearby-interactions"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-nearby-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-rings-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-rings-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-rings-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-activity-rings data-activity-rings-other data-activity-rings-multi data-activity-rings-recolor data-activity-rings-decor>
      <button type="button">Move</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-activity-rings>
      Showing sales, other types of data
      <button type="button">Move</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passRings:
        passStatus.topics["activity-rings"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixRings: fixStatus.topics["activity-rings"]?.state === "applied",
      systemKept:
        /data-activity-rings/.test(fixed) && />\s*Move\s*</.test(fixed),
      markersGone:
        !/data-activity-rings-other/.test(fixed) &&
        !/data-activity-rings-multi/.test(fixed) &&
        !/data-activity-rings-recolor/.test(fixed) &&
        !/data-activity-rings-decor/.test(fixed),
      holdUnchanged: held === origHold,
      holdRings: holdStatus.topics["activity-rings"]?.state === "pending",
      holdStillOther:
        /data-activity-rings/.test(held) &&
        /other types of data/.test(held) &&
        /Move/.test(held),
      holdNotInvented:
        !/HKActivityRingView/.test(held) &&
        !/WKInterfaceActivityRing/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passRings: passStatus.topics["activity-rings"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixRings: fixStatus.topics["activity-rings"]?.state,
      holdRings: holdStatus.topics["activity-rings"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-activity-rings-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nfc-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nfc-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nfc-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-nfc data-nfc-contact data-nfc-jargon>
      <button type="button">Scan</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-nfc>
      Tap your phone to the NFC tag
      <button type="button">Scan</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passNfc: passStatus.topics.nfc?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixNfc: fixStatus.topics.nfc?.state === "applied",
      systemKept: /data-nfc/.test(fixed) && />\s*Scan\s*</.test(fixed),
      markersGone: !/data-nfc-contact/.test(fixed) && !/data-nfc-jargon/.test(fixed),
      holdUnchanged: held === origHold,
      holdNfc: holdStatus.topics.nfc?.state === "pending",
      holdStillContact:
        /data-nfc/.test(held) &&
        /Tap your phone to the NFC tag/.test(held) &&
        /Scan/.test(held),
      holdNotInvented:
        !/NFCNDEFReaderSession/.test(held) &&
        !/NFCTagReaderSession/.test(held) &&
        !/NFCReaderSession/.test(held) &&
        !/CoreNFC/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passNfc: passStatus.topics.nfc?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixNfc: fixStatus.topics.nfc?.state,
      holdNfc: holdStatus.topics.nfc?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-nfc-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ar-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ar-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ar-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-ar data-ar-jargon data-ar-altered data-ar-non-arkit>
      <button type="button">View</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-ar>
      Unable to find a plane. Adjust tracking.
      <button type="button">View</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
    ]
      .map((f) => f.text)
      .join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      passAr:
        passStatus.topics["augmented-reality"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixAr: fixStatus.topics["augmented-reality"]?.state === "applied",
      systemKept: /data-ar/.test(fixed) && />\s*View\s*</.test(fixed),
      markersGone:
        !/data-ar-jargon/.test(fixed) &&
        !/data-ar-altered/.test(fixed) &&
        !/data-ar-non-arkit/.test(fixed),
      holdUnchanged: held === origHold,
      holdAr: holdStatus.topics["augmented-reality"]?.state === "pending",
      holdStillJargon:
        /data-ar/.test(held) &&
        /Adjust tracking/.test(held) &&
        /View/.test(held),
      holdNotInvented:
        !/ARView/.test(held) &&
        !/ARSCNView/.test(held) &&
        !/ARQuickLookPreviewing/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passAr: passStatus.topics["augmented-reality"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixAr: fixStatus.topics["augmented-reality"]?.state,
      holdAr: holdStatus.topics["augmented-reality"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-ar-donts", ok, ...detail });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
