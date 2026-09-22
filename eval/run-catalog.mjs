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
    surfaces.byId["tap-to-pay-on-iphone"]?.affordance === "taptopay" &&
    surfaces.byId["id-verifier"]?.affordance === "idverifier" &&
    surfaces.byId["apple-in-app-purchase"]?.affordance === "iap" &&
    surfaces.byId.maps?.affordance === "map" &&
    surfaces.byId.homekit?.affordance === "homekit" &&
    surfaces.byId.workouts?.affordance === "workout" &&
    surfaces.byId["live-photos"]?.affordance === "livephoto" &&
    surfaces.byId.icloud?.affordance === "icloud" &&
    surfaces.byId.siri?.affordance === "siri" &&
    surfaces.byId["siri-app-shortcuts"]?.affordance === "appshortcut" &&
    surfaces.byId.healthkit?.affordance === "healthkit" &&
    surfaces.byId.carplay?.affordance === "carplay" &&
    surfaces.byId["sign-in-with-apple"]?.affordance === "siwa" &&
    surfaces.byId["apple-pay"]?.affordance === "applepay" &&
    surfaces.byId["apple-pay"]?.gate === "capability:applepay" &&
    surfaces.byId["playing-audio"]?.affordance === "audioplayer" &&
    surfaces.byId["playing-audio"]?.gate === "always" &&
    surfaces.byId["game-center"]?.affordance === "gcaccess" &&
    surfaces.byId["game-center"]?.gate === "capability:gamecenter" &&
    surfaces.byId.panels?.affordance === "panel" &&
    surfaces.byId.panels?.gate === "always" &&
    surfaces.byId["path-controls"]?.affordance === "pathcontrol" &&
    surfaces.byId["path-controls"]?.gate === "always" &&
    surfaces.byId["outline-views"]?.affordance === "outline" &&
    surfaces.byId["outline-views"]?.gate === "always" &&
    surfaces.byId["imessage-apps-and-stickers"]?.affordance === "stickerpack" &&
    surfaces.byId["imessage-apps-and-stickers"]?.gate === "always" &&
    surfaces.byId["action-button"]?.affordance === "actionbutton" &&
    surfaces.byId["action-button"]?.gate === "always" &&
    surfaces.byId["camera-control"]?.affordance === "cameracontrol" &&
    surfaces.byId["camera-control"]?.gate === "always" &&
    surfaces.byId["dock-menus"]?.affordance === "dockmenu" &&
    surfaces.byId["dock-menus"]?.gate === "always" &&
    surfaces.byId["inputs-gestures"]?.affordance === "gesture" &&
    surfaces.byId["inputs-gestures"]?.gate === "phone,ipad" &&
    surfaces.byId["inputs-keyboards"]?.affordance === "keyboard" &&
    surfaces.byId["inputs-keyboards"]?.gate === "phone,ipad,desktop" &&
    surfaces.byId["inputs-pointing"]?.affordance === "pointer" &&
    surfaces.byId["inputs-pointing"]?.gate === "ipad,desktop" &&
    surfaces.byId["inputs-pencil"]?.affordance === "pencil" &&
    surfaces.byId["inputs-pencil"]?.gate === "ipad+capability:pencil" &&
    surfaces.byId["inputs-game-controls"]?.affordance === "gamecontrol" &&
    surfaces.byId["inputs-game-controls"]?.gate === "games,capability:games" &&
    surfaces.byId["gs-iphone-duo"]?.affordance === "duolayout" &&
    surfaces.byId["gs-iphone-duo"]?.gate === "duo,capability:duo" &&
    surfaces.byId.carekit?.affordance === "carekit" &&
    surfaces.byId.carekit?.gate === "capability:carekit" &&
    surfaces.byId.researchkit?.affordance === "researchkit" &&
    surfaces.byId.researchkit?.gate === "capability:researchkit" &&
    surfaces.byId.wallet?.affordance === "walletpass" &&
    surfaces.byId.wallet?.gate === "capability:wallet" &&
    surfaces.byId["app-clips"]?.affordance === "appclipcode" &&
    surfaces.byId["app-clips"]?.gate === "capability:appclips" &&
    surfaces.byId.shazamkit?.affordance === "shazam" &&
    surfaces.byId.shazamkit?.gate === "capability:shazam" &&
    surfaces.surfaces.findIndex((s) => s.id === "shazamkit") <
      surfaces.surfaces.findIndex((s) => s.id === "media-intelligence") &&
    surfaces.byId["photo-editing"]?.affordance === "photoedit" &&
    surfaces.byId["photo-editing"]?.gate === "capability:photos" &&
    surfaces.surfaces.findIndex((s) => s.id === "photo-editing") <
      surfaces.surfaces.findIndex((s) => s.id === "media-intelligence") &&
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
    "tap-to-pay-on-iphone",
    "id-verifier",
    "apple-in-app-purchase",
    "maps",
    "homekit",
    "workouts",
    "live-photos",
    "icloud",
    "siri",
    "app-shortcuts",
    "healthkit",
    "carplay",
    "sign-in-with-apple",
    "playing-audio",
    "panels",
    "path-controls",
    "outline-views",
    "imessage-apps-and-stickers",
    "action-button",
    "camera-control",
    "dock-menus",
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
  const idVerifierOnly = scanAffordances([
    {
      path: "Verify.tsx",
      text: '<div data-id-verifier><button type="button">Verify Age</button></div>',
    },
  ]);
  const verifyAgeWordOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Verify Age at the door.</p>",
    },
  ]);
  const iapOnly = scanAffordances([
    {
      path: "Store.tsx",
      text: '<div data-in-app-purchase><button type="button">Buy</button></div>',
    },
  ]);
  const buyWordOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Buy premium content.</p>",
    },
  ]);
  const mapOnly = scanAffordances([
    {
      path: "Map.tsx",
      text: '<div data-map><button type="button">Open in Maps</button></div>',
    },
  ]);
  const mapWordOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Find us on the map.</p>",
    },
  ]);
  const iframeMapOnly = scanAffordances([
    {
      path: "Embed.tsx",
      text: '<iframe src="https://maps.google.com/" title="Map"></iframe>',
    },
  ]);
  const carplayOnly = scanAffordances([
    {
      path: "Car.tsx",
      text: '<div data-carplay><button type="button">CarPlay</button></div>',
    },
  ]);
  const siwaWidgetOnly = scanAffordances([
    {
      path: "Auth.tsx",
      text: '<div data-siwa><button type="button">Sign in with Apple</button></div>',
    },
  ]);
  const siwaPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: '<button type="button">Sign in with Apple</button>',
    },
  ]);
  const siaMarkerOnly = scanAffordances([
    {
      path: "Auth.tsx",
      text: '<div data-sia-password data-sia-email data-sia-logo><button type="button">Sign in with Apple</button></div>',
    },
  ]);
  const applePayOnly = scanAffordances([
    {
      path: "Pay.tsx",
      text: '<div data-apple-pay><button type="button">Pay with Apple Pay</button></div>',
    },
  ]);
  const applePayButtonOnly = scanAffordances([
    {
      path: "Pay.swift",
      text: "let button = PKPaymentButton()",
    },
  ]);
  const applePayPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Pay with Apple Pay at checkout.</p>",
    },
  ]);
  const passKitOnly = scanAffordances([
    {
      path: "Wallet.swift",
      text: "import PassKit\nlet library = PKPassLibrary()",
    },
  ]);
  const apMarkerOnly = scanAffordances([
    {
      path: "Pay.tsx",
      text: '<div data-ap-mark-button data-ap-plural data-ap-logo-word><button type="button">Pay with Apple Pay</button></div>',
    },
  ]);
  const audioPlayerOnly = scanAffordances([
    {
      path: "Listen.tsx",
      text: '<div data-playing-audio><button type="button">Play</button></div>',
    },
  ]);
  const audioSessionOnly = scanAffordances([
    {
      path: "Session.swift",
      text: "let session = AVAudioSession.sharedInstance()",
    },
  ]);
  const audioPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Thanks for playing audio with us.</p>",
    },
  ]);
  const volumeSliderOnly = scanAffordances([
    {
      path: "Volume.tsx",
      text: '<input type="range" aria-label="Volume" />',
    },
  ]);
  const auMarkerOnly = scanAffordances([
    {
      path: "Listen.tsx",
      text: '<div data-au-output-volume data-au-repurpose data-au-headphones><button type="button">Play</button></div>',
    },
  ]);
  const gcWidgetOnly = scanAffordances([
    {
      path: "Play.tsx",
      text: '<div data-game-center><button type="button">Game Center</button></div>',
    },
  ]);
  const gcAccessPointOnly = scanAffordances([
    {
      path: "Access.swift",
      text: "let point = GKAccessPoint.shared",
    },
  ]);
  const gcPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Play on Game Center with friends.</p>",
    },
  ]);
  const gameKitOnly = scanAffordances([
    {
      path: "Game.swift",
      text: "import GameKit\nlet player = GKLocalPlayer.local",
    },
  ]);
  const gcMarkerOnly = scanAffordances([
    {
      path: "Play.tsx",
      text: '<div data-gc-gameplay data-gc-artwork data-gc-terms><button type="button">Menu</button></div>',
    },
  ]);
  const panelOnly = scanAffordances([
    {
      path: "Inspector.tsx",
      text: '<div data-panel><button type="button">Inspector</button></div>',
    },
  ]);
  const nsPanelOnly = scanAffordances([
    {
      path: "Inspector.swift",
      text: "let panel = NSPanel()",
    },
  ]);
  const hudOnly = scanAffordances([
    {
      path: "Hud.tsx",
      text: '<div data-hud><button type="button">Adjust</button></div>',
    },
  ]);
  const openPanelOnly = scanAffordances([
    {
      path: "Open.swift",
      text: "let chooser = NSOpenPanel()",
    },
  ]);
  const panelPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Open the panels to compare options.</p>",
    },
  ]);
  const pnMarkerOnly = scanAffordances([
    {
      path: "Inspector.tsx",
      text: '<div data-pn-window-menu data-pn-minimize data-pn-hud-obscure><button type="button">Inspector</button></div>',
    },
  ]);
  const pathOnly = scanAffordances([
    {
      path: "Trail.tsx",
      text: '<nav data-path-control><button type="button">Documents</button></nav>',
    },
  ]);
  const nsPathOnly = scanAffordances([
    {
      path: "Trail.swift",
      text: "let path = NSPathControl()",
    },
  ]);
  const pathPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Show the path to the file.</p>",
    },
  ]);
  const pathStatusOnly = scanAffordances([
    {
      path: "Clock.tsx",
      text: '<div data-status-bar>9:41</div>',
    },
  ]);
  const pcMarkerOnly = scanAffordances([
    {
      path: "Trail.tsx",
      text: '<nav data-pc-toolbar><button type="button">Documents</button></nav>',
    },
  ]);
  const outlineOnly = scanAffordances([
    {
      path: "Tree.tsx",
      text: '<div data-outline><button type="button">Folder</button></div>',
    },
  ]);
  const nsOutlineOnly = scanAffordances([
    {
      path: "Tree.swift",
      text: "let outline = NSOutlineView()",
    },
  ]);
  const outlinePhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Open the outline for the notes.</p>",
    },
  ]);
  const ovMarkerOnly = scanAffordances([
    {
      path: "Tree.tsx",
      text: '<div data-ov-colon data-ov-headings><button type="button">Folder</button></div>',
    },
  ]);
  const stickerOnly = scanAffordances([
    {
      path: "Pack.tsx",
      text: '<div data-sticker-pack><button type="button">Smile</button></div>',
    },
  ]);
  const msStickerOnly = scanAffordances([
    {
      path: "Pack.swift",
      text: "let sticker = MSSticker()",
    },
  ]);
  const stickerPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Send a sticker pack in the chat.</p>",
    },
  ]);
  const msStickerSizeOnly = scanAffordances([
    {
      path: "Pack.swift",
      text: "let size = MSStickerSize.small",
    },
  ]);
  const stMarkerOnly = scanAffordances([
    {
      path: "Pack.tsx",
      text: '<div data-st-mixed-sizes><button type="button">Smile</button></div>',
    },
  ]);
  const actionButtonOnly = scanAffordances([
    {
      path: "Action.tsx",
      text: '<div data-action-button><button type="button">Start</button></div>',
    },
  ]);
  const actionPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Press the Action button to start.</p>",
    },
  ]);
  const abMarkerOnly = scanAffordances([
    {
      path: "Action.tsx",
      text: '<div data-ab-long-label data-ab-settings-repeat><button type="button">Start</button></div>',
    },
  ]);
  const abLabelOnly = scanAffordances([
    {
      path: "Action.tsx",
      text: '<div data-ab-label="Start the egg timer now"><button type="button">Start</button></div>',
    },
  ]);
  const appShortcutsProviderOnly = scanAffordances([
    {
      path: "Shortcuts.swift",
      text: "struct Shortcuts: AppShortcutsProvider {}",
    },
  ]);
  const quickActionOnly = scanAffordances([
    {
      path: "Quick.tsx",
      text: '<div data-quick-action><button type="button">Start</button></div>',
    },
  ]);
  const cameraControlOnly = scanAffordances([
    {
      path: "Camera.tsx",
      text: '<div data-camera-control><button type="button">Zoom</button></div>',
    },
  ]);
  const avCaptureControlOnly = scanAffordances([
    {
      path: "Camera.swift",
      text: "let control = AVCaptureControl()",
    },
  ]);
  const cameraPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Use the Camera Control to zoom.</p>",
    },
  ]);
  const ccMarkerOnly = scanAffordances([
    {
      path: "Camera.tsx",
      text: '<div data-cc-duplicate><button type="button">Zoom</button></div>',
    },
  ]);
  const captureSessionOnly = scanAffordances([
    {
      path: "Camera.swift",
      text: "let session = AVCaptureSession()",
    },
  ]);
  const dockOnly = scanAffordances([
    {
      path: "Dock.tsx",
      text: '<div data-dock-menu><button type="button">Expedite Dispatch</button></div>',
    },
  ]);
  const appDockOnly = scanAffordances([
    {
      path: "Dock.swift",
      text: "func applicationDockMenu(_ sender: NSApplication) {}",
    },
  ]);
  const dockPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Open the Dock menu.</p>",
    },
  ]);
  const dkMarkerOnly = scanAffordances([
    {
      path: "Dock.tsx",
      text: '<div data-dk-elsewhere><button type="button">Expedite Dispatch</button></div>',
    },
  ]);
  const gestureOnly = scanAffordances([
    {
      path: "Gesture.tsx",
      text: "<div data-gesture></div>",
    },
  ]);
  const onTapGestureOnly = scanAffordances([
    {
      path: "Gesture.swift",
      text: "content.onTapGesture { }",
    },
  ]);
  const uiTapOnly = scanAffordances([
    {
      path: "Gesture.swift",
      text: "let tap = UITapGestureRecognizer()",
    },
  ]);
  const uiSwipeOnly = scanAffordances([
    {
      path: "Gesture.swift",
      text: "let swipe = UISwipeGestureRecognizer()",
    },
  ]);
  const uiPanOnly = scanAffordances([
    {
      path: "Gesture.swift",
      text: "let pan = UIPanGestureRecognizer()",
    },
  ]);
  const dragGestureOnly = scanAffordances([
    {
      path: "Gesture.swift",
      text: "let drag = DragGesture()",
    },
  ]);
  const gesturePhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Use a tap or swipe.</p>",
    },
  ]);
  const gsMarkerOnly = scanAffordances([
    {
      path: "Gesture.tsx",
      text: '<div data-gs-unique data-gs-edge data-gs-only></div>',
    },
  ]);
  const magnifyOnly = scanAffordances([
    {
      path: "Gesture.swift",
      text: "let zoom = MagnifyGesture()",
    },
  ]);
  const uiGestureBaseOnly = scanAffordances([
    {
      path: "Gesture.swift",
      text: "let base = UIGestureRecognizer()",
    },
  ]);
  const keyboardOnly = scanAffordances([
    {
      path: "Keys.tsx",
      text: "<div data-keyboard></div>",
    },
  ]);
  const shortcutOnly = scanAffordances([
    {
      path: "Keys.swift",
      text: 'Button("Save").keyboardShortcut("s")',
    },
  ]);
  const keyCommandOnly = scanAffordances([
    {
      path: "Keys.swift",
      text: 'UIKeyCommand(input: "s", modifierFlags: .command)',
    },
  ]);
  const keyEquivalentOnly = scanAffordances([
    {
      path: "Keys.swift",
      text: 'item.keyEquivalent = "s"',
    },
  ]);
  const keyboardPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Use the keyboard.</p>",
    },
  ]);
  const kbMarkerOnly = scanAffordances([
    {
      path: "Keys.tsx",
      text: "<div data-kb-repurpose data-kb-modifier data-kb-help data-kb-dup-keys></div>",
    },
  ]);
  const swiftTextFieldOnly = scanAffordances([
    {
      path: "Field.swift",
      text: 'TextField("Name")',
    },
  ]);
  const pointerOnly = scanAffordances([
    {
      path: "Pointer.tsx",
      text: "<div data-pointer></div>",
    },
  ]);
  const uiPointerOnly = scanAffordances([
    {
      path: "Pointer.swift",
      text: "let style = UIPointerStyle.hidden()",
    },
  ]);
  const nsCursorOnly = scanAffordances([
    {
      path: "Pointer.swift",
      text: "NSCursor.arrow.set()",
    },
  ]);
  const cursorUrlOnly = scanAffordances([
    {
      path: "Pointer.css",
      text: ".mark { cursor: url(pen.png) 0 0, auto; }",
    },
  ]);
  const cssPointerOnly = scanAffordances([
    {
      path: "Link.css",
      text: "a { cursor: pointer; }",
    },
  ]);
  const pointerPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Use the pointer.</p>",
    },
  ]);
  const ptMarkerOnly = scanAffordances([
    {
      path: "Pointer.tsx",
      text: "<div data-pt-instruct data-pt-decorative></div>",
    },
  ]);
  const hoverOnly = scanAffordances([
    {
      path: "Row.css",
      text: ".row:hover { color: red; }",
    },
  ]);
  const pencilOnly = scanAffordances([
    {
      path: "Ink.tsx",
      text: "<div data-pencil></div>",
    },
  ]);
  const canvasOnly = scanAffordances([
    {
      path: "Ink.swift",
      text: "let canvas = PKCanvasView()",
    },
  ]);
  const toolPickerOnly = scanAffordances([
    {
      path: "Ink.swift",
      text: "let tools = PKToolPicker()",
    },
  ]);
  const scribbleOnly = scanAffordances([
    {
      path: "Ink.swift",
      text: "let scribble = UIScribbleInteraction(delegate: self)",
    },
  ]);
  const importPencilOnly = scanAffordances([
    {
      path: "Ink.swift",
      text: "import PencilKit",
    },
  ]);
  const pencilPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Use Apple Pencil.</p>",
    },
  ]);
  const peMarkerOnly = scanAffordances([
    {
      path: "Ink.tsx",
      text: "<div data-pe-hover data-pe-double-tap data-pe-distract></div>",
    },
  ]);
  const gameControlOnly = scanAffordances([
    {
      path: "Hud.tsx",
      text: "<div data-game-controls></div>",
    },
  ]);
  const spriteKitOnly = scanAffordances([
    {
      path: "Game.swift",
      text: "import SpriteKit",
    },
  ]);
  const gameCenterWidgetOnly = scanAffordances([
    {
      path: "Menu.tsx",
      text: "<div data-game-center></div>",
    },
  ]);
  const gmMarkerOnly = scanAffordances([
    {
      path: "Hud.tsx",
      text: "<div data-gm-letter></div>",
    },
  ]);
  const gamePhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Use a game controller.</p>",
    },
  ]);
  const duoOnly = scanAffordances([
    {
      path: "Fold.tsx",
      text: "<div data-duo></div>",
    },
  ]);
  const arrangementOnly = scanAffordances([
    {
      path: "Fold.swift",
      text: "ArrangementView { Text(\"Outer\") }",
    },
  ]);
  const reservedOnly = scanAffordances([
    {
      path: "Fold.swift",
      text: "GeometryProxy.reservedRegions",
    },
  ]);
  const idMarkerOnly = scanAffordances([
    {
      path: "Fold.tsx",
      text: "<div data-id-reinvent data-id-fixed data-id-fold></div>",
    },
  ]);
  const duoPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Designed for iPhone Duo.</p>",
    },
  ]);
  const carePlanOnly = scanAffordances([
    {
      path: "Care.tsx",
      text: "<div data-carekit></div>",
    },
  ]);
  const importCareOnly = scanAffordances([
    {
      path: "Care.swift",
      text: "import CareKit",
    },
  ]);
  const importResearchOnly = scanAffordances([
    {
      path: "Study.swift",
      text: "import ResearchKit",
    },
  ]);
  const ckMarkerOnly = scanAffordances([
    {
      path: "Care.tsx",
      text: "<div data-ck-ad></div>",
    },
  ]);
  const carePhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Built with CareKit.</p>",
    },
  ]);
  const studyOnly = scanAffordances([
    {
      path: "Study.tsx",
      text: "<div data-researchkit></div>",
    },
  ]);
  const rkMarkerOnly = scanAffordances([
    {
      path: "Study.tsx",
      text: "<div data-rk-critical></div>",
    },
  ]);
  const studyPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Built with ResearchKit.</p>",
    },
  ]);
  const passWidgetOnly = scanAffordances([
    {
      path: "Pass.tsx",
      text: "<div data-wallet></div>",
    },
  ]);
  const wlMarkerOnly = scanAffordances([
    {
      path: "Pass.tsx",
      text: "<div data-wl-marketing></div>",
    },
  ]);
  const wlDeclineMarkerOnly = scanAffordances([
    {
      path: "Pass.tsx",
      text: "<div data-wl-decline></div>",
    },
  ]);
  const wlShadowMarkerOnly = scanAffordances([
    {
      path: "Pass.tsx",
      text: "<div data-wl-shadow></div>",
    },
  ]);
  const shazamWidgetOnly = scanAffordances([
    {
      path: "Listen.tsx",
      text: "<div data-shazam></div>",
    },
  ]);
  const shazamSessionOnly = scanAffordances([
    {
      path: "Listen.swift",
      text: "let session = SHSession()",
    },
  ]);
  const shazamImportOnly = scanAffordances([
    {
      path: "Listen.swift",
      text: "import ShazamKit",
    },
  ]);
  const szMarkerOnly = scanAffordances([
    {
      path: "Listen.tsx",
      text: "<div data-sz-mic></div>",
    },
  ]);
  const photoEditOnly = scanAffordances([
    {
      path: "Edit.tsx",
      text: "<div data-photo-edit></div>",
    },
  ]);
  const photoControllerOnly = scanAffordances([
    {
      path: "Edit.swift",
      text: "class Editor: PHContentEditingController {}",
    },
  ]);
  const photosImportOnly = scanAffordances([
    {
      path: "Edit.swift",
      text: "import PhotosUI",
    },
  ]);
  const pxMarkerOnly = scanAffordances([
    {
      path: "Edit.tsx",
      text: "<div data-px-cancel></div>",
    },
  ]);
  const shazamPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>They don't expect the microphone to stay on.</p>",
    },
  ]);
  const shazamPermissionOnly = scanAffordances([
    {
      path: "Listen.swift",
      text: "AVAudioSession.sharedInstance().requestRecordPermission { _ in }",
    },
  ]);
  const walletPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Add this boarding pass to Wallet.</p>",
    },
  ]);
  const appClipCodeOnly = scanAffordances([
    {
      path: "Clip.tsx",
      text: "<div data-app-clip-code></div>",
    },
  ]);
  const appClipWordOnly = scanAffordances([
    {
      path: "Clip.tsx",
      text: "<div data-app-clip></div>",
    },
  ]);
  const acMarkerOnly = scanAffordances([
    {
      path: "Clip.tsx",
      text: "<div data-ac-modified></div>",
    },
  ]);
  const acOverlayMarkerOnly = scanAffordances([
    {
      path: "Clip.tsx",
      text: "<div data-ac-overlay></div>",
    },
  ]);
  const acMotionMarkerOnly = scanAffordances([
    {
      path: "Clip.tsx",
      text: "<div data-ac-motion></div>",
    },
  ]);
  const acRotateMarkerOnly = scanAffordances([
    {
      path: "Clip.tsx",
      text: "<div data-ac-rotate></div>",
    },
  ]);
  const acAspectMarkerOnly = scanAffordances([
    {
      path: "Clip.tsx",
      text: "<div data-ac-aspect></div>",
    },
  ]);
  const acSymbolMarkerOnly = scanAffordances([
    {
      path: "Clip.tsx",
      text: "<div data-ac-symbol></div>",
    },
  ]);
  const appClipEntitlementOnly = scanAffordances([
    {
      path: "App.entitlements",
      text: "com.apple.developer.associated-appclip-app-identifiers",
    },
  ]);
  const appClipPhraseOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Launch the App Clip.</p>",
    },
  ]);
  const appClipAdOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>Don't display ads in your App Clip.</p>",
    },
  ]);
  const healthKitWidgetOnly = scanAffordances([
    {
      path: "Health.tsx",
      text: "<div data-healthkit></div>",
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
  const healthkitOnly = scanAffordances([
    {
      path: "Health.tsx",
      text: '<div data-healthkit><button type="button">Works with Apple Health</button></div>',
    },
  ]);
  const healthkitWordOnly = scanAffordances([
    {
      path: "Copy.tsx",
      text: "<p>This app uses HealthKit to store your workouts.</p>",
    },
  ]);
  const homekitChromeOnly = scanAffordances([
    {
      path: "Home.tsx",
      text: '<div data-homekit><button type="button">Accessory settings</button></div>',
    },
  ]);
  const workoutChromeOnly = scanAffordances([
    {
      path: "Run.tsx",
      text: '<div data-workout><button type="button">Start</button></div>',
    },
  ]);
  const badgeCountOnly = scanAffordances([
    {
      path: "Badge.swift",
      text: "applicationIconBadgeNumber = temperature",
    },
  ]);
  const ntBadgeMarkerOnly = scanAffordances([
    {
      path: "Badge.tsx",
      text: "<div data-nt-badge></div>",
    },
  ]);
  const ntLabelMarkerOnly = scanAffordances([
    {
      path: "Badge.tsx",
      text: "<div data-nt-label></div>",
    },
  ]);
  const ntOpenMarkerOnly = scanAffordances([
    {
      path: "Badge.tsx",
      text: "<div data-nt-open></div>",
    },
  ]);
  const ntContentMarkerOnly = scanAffordances([
    {
      path: "Badge.tsx",
      text: "<div data-nt-content></div>",
    },
  ]);
  const hltMarkerOnly = scanAffordances([
    {
      path: "Mark.tsx",
      text: '<div data-hlt-replica data-hlt-sharing data-hlt-term><button type="button">Health</button></div>',
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
      !badgeCountOnly.includes("notification") &&
      !ntBadgeMarkerOnly.includes("notification") &&
      !ntLabelMarkerOnly.includes("notification") &&
      !ntOpenMarkerOnly.includes("notification") &&
      !ntContentMarkerOnly.includes("notification") &&
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
      !idVerifierOnly.includes("nfc") &&
      !iapOnly.includes("nfc") &&
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
      tapToPayOnly.includes("taptopay") &&
      !nfcOnly.includes("taptopay") &&
      !idVerifierOnly.includes("taptopay") &&
      !iapOnly.includes("taptopay") &&
      !walletOnly.includes("taptopay") &&
      !arOnly.includes("taptopay") &&
      !formOnly.includes("taptopay") &&
      !passList.includes("taptopay") &&
      !pageOnly.includes("taptopay") &&
      idVerifierOnly.includes("idverifier") &&
      !verifyAgeWordOnly.includes("idverifier") &&
      !nfcOnly.includes("idverifier") &&
      !tapToPayOnly.includes("idverifier") &&
      !iapOnly.includes("idverifier") &&
      !walletOnly.includes("idverifier") &&
      !formOnly.includes("idverifier") &&
      !passList.includes("idverifier") &&
      !pageOnly.includes("idverifier") &&
      iapOnly.includes("iap") &&
      !buyWordOnly.includes("iap") &&
      !nfcOnly.includes("iap") &&
      !tapToPayOnly.includes("iap") &&
      !idVerifierOnly.includes("iap") &&
      !walletOnly.includes("iap") &&
      !formOnly.includes("iap") &&
      !passList.includes("iap") &&
      !pageOnly.includes("iap") &&
      mapOnly.includes("map") &&
      !mapWordOnly.includes("map") &&
      !iframeMapOnly.includes("map") &&
      !carplayOnly.includes("map") &&
      !iapOnly.includes("map") &&
      !formOnly.includes("map") &&
      !passList.includes("map") &&
      !pageOnly.includes("map") &&
      healthkitOnly.includes("healthkit") &&
      !healthkitOnly.includes("homekit") &&
      !healthkitOnly.includes("workout") &&
      !healthkitOnly.includes("activityring") &&
      !healthkitWordOnly.includes("healthkit") &&
      !homekitChromeOnly.includes("healthkit") &&
      homekitChromeOnly.includes("homekit") &&
      !workoutChromeOnly.includes("healthkit") &&
      workoutChromeOnly.includes("workout") &&
      !activityRingsOnly.includes("healthkit") &&
      !hltMarkerOnly.includes("healthkit") &&
      !formOnly.includes("healthkit") &&
      !passList.includes("healthkit") &&
      !pageOnly.includes("healthkit") &&
      carplayOnly.includes("carplay") &&
      !carplayOnly.includes("map") &&
      !mapOnly.includes("carplay") &&
      !formOnly.includes("carplay") &&
      !passList.includes("carplay") &&
      !pageOnly.includes("carplay") &&
      siwaWidgetOnly.includes("siwa") &&
      !siwaWidgetOnly.includes("account") &&
      !siwaOnly.includes("siwa") &&
      !accountOnly.includes("siwa") &&
      !passwordOnly.includes("siwa") &&
      !siwaPhraseOnly.includes("siwa") &&
      !siaMarkerOnly.includes("siwa") &&
      !carplayOnly.includes("siwa") &&
      !formOnly.includes("siwa") &&
      !passList.includes("siwa") &&
      !pageOnly.includes("siwa") &&
      applePayOnly.includes("applepay") &&
      applePayButtonOnly.includes("applepay") &&
      !applePayOnly.includes("siwa") &&
      !applePayOnly.includes("taptopay") &&
      !applePayOnly.includes("iap") &&
      !applePayPhraseOnly.includes("applepay") &&
      !passKitOnly.includes("applepay") &&
      !apMarkerOnly.includes("applepay") &&
      !tapToPayOnly.includes("applepay") &&
      !iapOnly.includes("applepay") &&
      !siwaOnly.includes("applepay") &&
      !formOnly.includes("applepay") &&
      !passList.includes("applepay") &&
      !pageOnly.includes("applepay") &&
      audioPlayerOnly.includes("audioplayer") &&
      !audioPlayerOnly.includes("slider") &&
      !audioPlayerOnly.includes("videoplayer") &&
      audioSessionOnly.includes("audioplayer") &&
      !audioPhraseOnly.includes("audioplayer") &&
      volumeSliderOnly.includes("slider") &&
      !volumeSliderOnly.includes("audioplayer") &&
      !auMarkerOnly.includes("audioplayer") &&
      !videoOnly.includes("audioplayer") &&
      !formOnly.includes("audioplayer") &&
      !passList.includes("audioplayer") &&
      !pageOnly.includes("audioplayer") &&
      gcWidgetOnly.includes("gcaccess") &&
      !gcWidgetOnly.includes("account") &&
      gcAccessPointOnly.includes("gcaccess") &&
      !gcPhraseOnly.includes("gcaccess") &&
      !gameKitOnly.includes("gcaccess") &&
      !gcMarkerOnly.includes("gcaccess") &&
      !audioPlayerOnly.includes("gcaccess") &&
      !formOnly.includes("gcaccess") &&
      !passList.includes("gcaccess") &&
      !pageOnly.includes("gcaccess") &&
      panelOnly.includes("panel") &&
      !panelOnly.includes("appwindow") &&
      nsPanelOnly.includes("panel") &&
      hudOnly.includes("panel") &&
      !openPanelOnly.includes("panel") &&
      !panelPhraseOnly.includes("panel") &&
      !pnMarkerOnly.includes("panel") &&
      !appWindowOnly.includes("panel") &&
      !dialogOnly.includes("panel") &&
      !formOnly.includes("panel") &&
      !passList.includes("panel") &&
      !pageOnly.includes("panel") &&
      pathOnly.includes("pathcontrol") &&
      !pathOnly.includes("filebrowser") &&
      !pathOnly.includes("panel") &&
      nsPathOnly.includes("pathcontrol") &&
      !pathPhraseOnly.includes("pathcontrol") &&
      !pathStatusOnly.includes("pathcontrol") &&
      !pcMarkerOnly.includes("pathcontrol") &&
      !fileBrowserOnly.includes("pathcontrol") &&
      !formOnly.includes("pathcontrol") &&
      !passList.includes("pathcontrol") &&
      !pageOnly.includes("pathcontrol") &&
      outlineOnly.includes("outline") &&
      !outlineOnly.includes("list") &&
      !outlineOnly.includes("disclosure") &&
      nsOutlineOnly.includes("outline") &&
      !outlinePhraseOnly.includes("outline") &&
      !ovMarkerOnly.includes("outline") &&
      !listOnly.includes("outline") &&
      !disclosureOnly.includes("outline") &&
      !formOnly.includes("outline") &&
      !passList.includes("outline") &&
      !pageOnly.includes("outline") &&
      stickerOnly.includes("stickerpack") &&
      !stickerOnly.includes("imageview") &&
      !stickerOnly.includes("list") &&
      msStickerOnly.includes("stickerpack") &&
      !stickerPhraseOnly.includes("stickerpack") &&
      !msStickerSizeOnly.includes("stickerpack") &&
      !stMarkerOnly.includes("stickerpack") &&
      !imageViewOnly.includes("stickerpack") &&
      !imgOnly.includes("stickerpack") &&
      !listOnly.includes("stickerpack") &&
      !formOnly.includes("stickerpack") &&
      !passList.includes("stickerpack") &&
      !pageOnly.includes("stickerpack") &&
      actionButtonOnly.includes("actionbutton") &&
      !actionButtonOnly.includes("appshortcut") &&
      !actionButtonOnly.includes("quickaction") &&
      !actionPhraseOnly.includes("actionbutton") &&
      !abMarkerOnly.includes("actionbutton") &&
      !abLabelOnly.includes("actionbutton") &&
      !appShortcutOnly.includes("actionbutton") &&
      !appShortcutsProviderOnly.includes("actionbutton") &&
      !quickActionOnly.includes("actionbutton") &&
      !stickerOnly.includes("actionbutton") &&
      !formOnly.includes("actionbutton") &&
      !passList.includes("actionbutton") &&
      !pageOnly.includes("actionbutton") &&
      cameraControlOnly.includes("cameracontrol") &&
      !cameraControlOnly.includes("slider") &&
      avCaptureControlOnly.includes("cameracontrol") &&
      !cameraPhraseOnly.includes("cameracontrol") &&
      !ccMarkerOnly.includes("cameracontrol") &&
      !captureSessionOnly.includes("cameracontrol") &&
      !rangeOnly.includes("cameracontrol") &&
      !actionButtonOnly.includes("cameracontrol") &&
      !formOnly.includes("cameracontrol") &&
      !passList.includes("cameracontrol") &&
      !pageOnly.includes("cameracontrol") &&
      dockOnly.includes("dockmenu") &&
      !dockOnly.includes("menu") &&
      !dockOnly.includes("quickaction") &&
      appDockOnly.includes("dockmenu") &&
      !appDockOnly.includes("quickaction") &&
      !dockPhraseOnly.includes("dockmenu") &&
      !dkMarkerOnly.includes("dockmenu") &&
      !commandMenuOnly.includes("dockmenu") &&
      !editMenuOnly.includes("dockmenu") &&
      !quickActionOnly.includes("dockmenu") &&
      !formOnly.includes("dockmenu") &&
      !passList.includes("dockmenu") &&
      !pageOnly.includes("dockmenu") &&
      gestureOnly.includes("gesture") &&
      !gestureOnly.includes("button") &&
      onTapGestureOnly.includes("gesture") &&
      uiTapOnly.includes("gesture") &&
      uiSwipeOnly.includes("gesture") &&
      uiPanOnly.includes("gesture") &&
      dragGestureOnly.includes("gesture") &&
      !gesturePhraseOnly.includes("gesture") &&
      !gsMarkerOnly.includes("gesture") &&
      !magnifyOnly.includes("gesture") &&
      !uiGestureBaseOnly.includes("gesture") &&
      !formOnly.includes("gesture") &&
      !passList.includes("gesture") &&
      !pageOnly.includes("gesture") &&
      !dockOnly.includes("gesture") &&
      keyboardOnly.includes("keyboard") &&
      !keyboardOnly.includes("form") &&
      shortcutOnly.includes("keyboard") &&
      keyCommandOnly.includes("keyboard") &&
      keyEquivalentOnly.includes("keyboard") &&
      !keyboardPhraseOnly.includes("keyboard") &&
      !kbMarkerOnly.includes("keyboard") &&
      !inputOnly.includes("keyboard") &&
      !swiftTextFieldOnly.includes("keyboard") &&
      !formOnly.includes("keyboard") &&
      !passList.includes("keyboard") &&
      !pageOnly.includes("keyboard") &&
      !gestureOnly.includes("keyboard") &&
      pointerOnly.includes("pointer") &&
      !pointerOnly.includes("keyboard") &&
      uiPointerOnly.includes("pointer") &&
      nsCursorOnly.includes("pointer") &&
      cursorUrlOnly.includes("pointer") &&
      !cssPointerOnly.includes("pointer") &&
      !pointerPhraseOnly.includes("pointer") &&
      !ptMarkerOnly.includes("pointer") &&
      !hoverOnly.includes("pointer") &&
      !keyboardOnly.includes("pointer") &&
      !formOnly.includes("pointer") &&
      !passList.includes("pointer") &&
      !pageOnly.includes("pointer") &&
      pencilOnly.includes("pencil") &&
      !pencilOnly.includes("pointer") &&
      canvasOnly.includes("pencil") &&
      toolPickerOnly.includes("pencil") &&
      scribbleOnly.includes("pencil") &&
      !importPencilOnly.includes("pencil") &&
      !pencilPhraseOnly.includes("pencil") &&
      !peMarkerOnly.includes("pencil") &&
      !pointerOnly.includes("pencil") &&
      !formOnly.includes("pencil") &&
      !passList.includes("pencil") &&
      !pageOnly.includes("pencil") &&
      gameControlOnly.includes("gamecontrol") &&
      !gameControlOnly.includes("gcaccess") &&
      !gameControlOnly.includes("pencil") &&
      !spriteKitOnly.includes("gamecontrol") &&
      !gameCenterWidgetOnly.includes("gamecontrol") &&
      !gameKitOnly.includes("gamecontrol") &&
      !gcMarkerOnly.includes("gamecontrol") &&
      !gmMarkerOnly.includes("gamecontrol") &&
      !gamePhraseOnly.includes("gamecontrol") &&
      !pencilOnly.includes("gamecontrol") &&
      !formOnly.includes("gamecontrol") &&
      !passList.includes("gamecontrol") &&
      !pageOnly.includes("gamecontrol") &&
      duoOnly.includes("duolayout") &&
      !duoOnly.includes("gamecontrol") &&
      !arrangementOnly.includes("duolayout") &&
      !reservedOnly.includes("duolayout") &&
      !idMarkerOnly.includes("duolayout") &&
      !duoPhraseOnly.includes("duolayout") &&
      !gameControlOnly.includes("duolayout") &&
      !formOnly.includes("duolayout") &&
      !passList.includes("duolayout") &&
      !pageOnly.includes("duolayout") &&
      carePlanOnly.includes("carekit") &&
      !carePlanOnly.includes("healthkit") &&
      !importCareOnly.includes("carekit") &&
      !importResearchOnly.includes("carekit") &&
      !ckMarkerOnly.includes("carekit") &&
      !carePhraseOnly.includes("carekit") &&
      !healthKitWidgetOnly.includes("carekit") &&
      !duoOnly.includes("carekit") &&
      !formOnly.includes("carekit") &&
      !passList.includes("carekit") &&
      !pageOnly.includes("carekit") &&
      studyOnly.includes("researchkit") &&
      !studyOnly.includes("carekit") &&
      !importResearchOnly.includes("researchkit") &&
      !importCareOnly.includes("researchkit") &&
      !rkMarkerOnly.includes("researchkit") &&
      !studyPhraseOnly.includes("researchkit") &&
      !carePlanOnly.includes("researchkit") &&
      !healthKitWidgetOnly.includes("researchkit") &&
      !formOnly.includes("researchkit") &&
      !passList.includes("researchkit") &&
      !pageOnly.includes("researchkit") &&
      passWidgetOnly.includes("walletpass") &&
      !passWidgetOnly.includes("applepay") &&
      !passKitOnly.includes("walletpass") &&
      !applePayOnly.includes("walletpass") &&
      !applePayButtonOnly.includes("walletpass") &&
      !wlMarkerOnly.includes("walletpass") &&
      !wlDeclineMarkerOnly.includes("walletpass") &&
      !wlShadowMarkerOnly.includes("walletpass") &&
      shazamWidgetOnly.includes("shazam") &&
      shazamSessionOnly.includes("shazam") &&
      !shazamImportOnly.includes("shazam") &&
      !szMarkerOnly.includes("shazam") &&
      !shazamPhraseOnly.includes("shazam") &&
      !shazamPermissionOnly.includes("shazam") &&
      photoEditOnly.includes("photoedit") &&
      photoControllerOnly.includes("photoedit") &&
      !photosImportOnly.includes("photoedit") &&
      !pxMarkerOnly.includes("photoedit") &&
      !imgOnly.includes("photoedit") &&
      !imageViewOnly.includes("photoedit") &&
      !shazamWidgetOnly.includes("photoedit") &&
      !passWidgetOnly.includes("shazam") &&
      !walletOnly.includes("walletpass") &&
      !walletPhraseOnly.includes("walletpass") &&
      !apMarkerOnly.includes("walletpass") &&
      !formOnly.includes("walletpass") &&
      !passList.includes("walletpass") &&
      !pageOnly.includes("walletpass") &&
      appClipCodeOnly.includes("appclipcode") &&
      !appClipCodeOnly.includes("walletpass") &&
      !appClipWordOnly.includes("appclipcode") &&
      !acMarkerOnly.includes("appclipcode") &&
      !acOverlayMarkerOnly.includes("appclipcode") &&
      !acMotionMarkerOnly.includes("appclipcode") &&
      !acRotateMarkerOnly.includes("appclipcode") &&
      !acAspectMarkerOnly.includes("appclipcode") &&
      !acSymbolMarkerOnly.includes("appclipcode") &&
      !appClipEntitlementOnly.includes("appclipcode") &&
      !appClipPhraseOnly.includes("appclipcode") &&
      !appClipAdOnly.includes("appclipcode") &&
      !passWidgetOnly.includes("appclipcode") &&
      !formOnly.includes("appclipcode") &&
      !passList.includes("appclipcode") &&
      !pageOnly.includes("appclipcode") &&
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
      (catalog.byId.privacy?.dontHeuristicIds || []).includes("pv-att") &&
      (catalog.byId.privacy?.dontHeuristicIds || []).includes("pv-leave") &&
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
      (catalog.byId["lists-and-tables"]?.dontHeuristicIds || []).includes("ix-both") &&
      (catalog.byId["split-views"]?.dontHeuristicIds || []).includes("ix-both") &&
      catalog.byId["entering-data"]?.dontCoverageComplete === true &&
      catalog.byId.sidebars?.dontCoverageComplete === true &&
      (catalog.byId["tab-bars"]?.dontHeuristicIds || []).includes("tb-off") &&
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
      (catalog.byId.buttons?.dontHeuristicIds || []).includes("destructive-as-primary") &&
      (catalog.byId.buttons?.dontHeuristicIds || []).includes("tg-radios") &&
      (catalog.byId.toggles?.dontHeuristicIds || []).includes("tg-radios") &&
      (catalog.byId["segmented-controls"]?.dontHeuristicIds || []).includes("sg-mix") &&
      (catalog.byId["segmented-controls"]?.dontHeuristicIds || []).includes("sg-count") &&
      catalog.byId["segmented-controls"]?.dontCoverageComplete === true &&
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
      (catalog.byId.sheets?.dontHeuristicIds || []).includes("sh-trio") &&
      (catalog.byId.sheets?.dontHeuristicIds || []).includes("sh-done") &&
      (catalog.byId.alerts?.dontHeuristicIds || []).includes("al-error") &&
      (catalog.byId.alerts?.dontHeuristicIds || []).includes("al-cancel") &&
      (catalog.byId.alerts?.dontHeuristicIds || []).includes("al-yes-no") &&
      (catalog.byId.alerts?.dontHeuristicIds || []).includes("al-caution") &&
      catalog.byId["dark-mode"]?.dontCoverageComplete === true &&
      catalog.byId["sf-symbols"]?.dontCoverageComplete === true &&
      catalog.byId["context-menus"]?.dontCoverageComplete === true &&
      catalog.byId["pull-down-buttons"]?.dontCoverageComplete === true &&
      catalog.byId["pop-up-buttons"]?.dontCoverageComplete === true &&
      catalog.byId.notifications?.dontCoverageComplete === true &&
      (catalog.byId.notifications?.dontHeuristicIds || []).includes("nt-badge") &&
      (catalog.byId.notifications?.dontHeuristicIds || []).includes("nt-label") &&
      (catalog.byId.notifications?.dontHeuristicIds || []).includes("nt-open") &&
      (catalog.byId.notifications?.dontHeuristicIds || []).includes("nt-content") &&
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
      catalog.byId["tap-to-pay-on-iphone"]?.dontCoverageComplete === true &&
      (catalog.byId["tap-to-pay-on-iphone"]?.dontHeuristicIds || []).includes(
        "ttp-apple-logo",
      ) &&
      (catalog.byId["tap-to-pay-on-iphone"]?.dontHeuristicIds || []).includes(
        "ttp-nonpayment-label",
      ) &&
      catalog.byId["tap-to-pay-on-iphone"]?.pack === "tech-tap-to-pay.md" &&
      catalog.byId["tap-to-pay-on-iphone"]?.appliesWhen === "always" &&
      catalog.byId["id-verifier"]?.dontCoverageComplete === true &&
      (catalog.byId["id-verifier"]?.dontHeuristicIds || []).includes(
        "idv-apple-logo",
      ) &&
      (catalog.byId["id-verifier"]?.dontHeuristicIds || []).includes(
        "idv-comm-symbol",
      ) &&
      catalog.byId["id-verifier"]?.pack === "tech-id-verifier.md" &&
      catalog.byId["id-verifier"]?.appliesWhen === "always" &&
      catalog.byId["apple-in-app-purchase"]?.dontCoverageComplete === true &&
      (catalog.byId["apple-in-app-purchase"]?.dontHeuristicIds || []).includes(
        "iap-confirm-sheet",
      ) &&
      (catalog.byId["apple-in-app-purchase"]?.dontHeuristicIds || []).includes(
        "iap-refund-buried",
      ) &&
      (catalog.byId["apple-in-app-purchase"]?.dontHeuristicIds || []).includes(
        "iap-refund-policy",
      ) &&
      catalog.byId["apple-in-app-purchase"]?.pack === "tech-in-app-purchase.md" &&
      catalog.byId["apple-in-app-purchase"]?.appliesWhen === "always" &&
      catalog.byId.maps?.dontCoverageComplete === true &&
      (catalog.byId.maps?.dontHeuristicIds || []).includes("map-cover-legal") &&
      (catalog.byId.maps?.dontHeuristicIds || []).includes("map-replica-apple") &&
      catalog.byId.maps?.pack === "tech-maps.md" &&
      catalog.byId.maps?.appliesWhen === "always" &&
      catalog.byId.homekit?.dontCoverageComplete === true &&
      (catalog.byId.homekit?.dontHeuristicIds || []).includes("hk-company-name") &&
      (catalog.byId.homekit?.dontHeuristicIds || []).includes("hk-overwrite-db") &&
      (catalog.byId.homekit?.dontHeuristicIds || []).includes("hk-dup-settings") &&
      (catalog.byId.homekit?.dontHeuristicIds || []).includes("hk-cover-camera") &&
      catalog.byId.homekit?.pack === "tech-homekit.md" &&
      catalog.byId.homekit?.appliesWhen === "always" &&
      catalog.byId.icloud?.dontCoverageComplete === true &&
      (catalog.byId.icloud?.dontHeuristicIds || []).includes("ic-ask-docs") &&
      (catalog.byId.icloud?.dontHeuristicIds || []).includes("ic-unavailable-alert") &&
      (catalog.byId.icloud?.dontHeuristicIds || []).includes("ic-app-resources") &&
      catalog.byId.icloud?.pack === "tech-icloud.md" &&
      catalog.byId.icloud?.appliesWhen === "always" &&
      catalog.byId.siri?.dontCoverageComplete === true &&
      (catalog.byId.siri?.dontHeuristicIds || []).includes("si-advertise") &&
      (catalog.byId.siri?.dontHeuristicIds || []).includes("si-impersonate") &&
      (catalog.byId.siri?.dontHeuristicIds || []).includes("si-pronoun") &&
      catalog.byId.siri?.pack === "tech-siri.md" &&
      catalog.byId.siri?.appliesWhen === "always" &&
      catalog.byId["app-shortcuts"]?.dontCoverageComplete === true &&
      (catalog.byId["app-shortcuts"]?.dontHeuristicIds || []).includes("as-reskin") &&
      (catalog.byId["app-shortcuts"]?.dontHeuristicIds || []).includes("as-lowercase") &&
      (catalog.byId["app-shortcuts"]?.dontHeuristicIds || []).includes("as-title-item") &&
      catalog.byId["app-shortcuts"]?.pack === "tech-siri-app-shortcuts.md" &&
      catalog.byId["app-shortcuts"]?.appliesWhen === "always" &&
      catalog.byId.healthkit?.dontCoverageComplete === true &&
      (catalog.byId.healthkit?.dontHeuristicIds || []).includes("hlt-replica") &&
      (catalog.byId.healthkit?.dontHeuristicIds || []).includes("hlt-sharing") &&
      (catalog.byId.healthkit?.dontHeuristicIds || []).includes("hlt-term") &&
      catalog.byId.healthkit?.pack === "tech-healthkit.md" &&
      catalog.byId.healthkit?.appliesWhen === "always" &&
      catalog.byId.carplay?.dontCoverageComplete === true &&
      (catalog.byId.carplay?.dontHeuristicIds || []).includes("cp-iphone-lock") &&
      (catalog.byId.carplay?.dontHeuristicIds || []).includes("cp-iphone-error") &&
      (catalog.byId.carplay?.dontHeuristicIds || []).includes("cp-iphone-interact") &&
      catalog.byId.carplay?.pack === "tech-carplay.md" &&
      catalog.byId.carplay?.appliesWhen === "always" &&
      catalog.byId["sign-in-with-apple"]?.dontCoverageComplete === true &&
      (catalog.byId["sign-in-with-apple"]?.dontHeuristicIds || []).includes("sia-password") &&
      (catalog.byId["sign-in-with-apple"]?.dontHeuristicIds || []).includes("sia-email") &&
      (catalog.byId["sign-in-with-apple"]?.dontHeuristicIds || []).includes("sia-logo") &&
      catalog.byId["sign-in-with-apple"]?.pack === "tech-sign-in-with-apple.md" &&
      catalog.byId["sign-in-with-apple"]?.appliesWhen === "always" &&
      catalog.byId["apple-pay"]?.dontCoverageComplete === true &&
      (catalog.byId["apple-pay"]?.dontHeuristicIds || []).includes("ap-mark-button") &&
      (catalog.byId["apple-pay"]?.dontHeuristicIds || []).includes("ap-plural") &&
      (catalog.byId["apple-pay"]?.dontHeuristicIds || []).includes("ap-logo-word") &&
      catalog.byId["apple-pay"]?.pack === "tech-apple-pay.md" &&
      catalog.byId["apple-pay"]?.appliesWhen === "capability:applepay" &&
      catalog.byId["playing-audio"]?.dontCoverageComplete === true &&
      (catalog.byId["playing-audio"]?.dontHeuristicIds || []).includes("au-output-volume") &&
      (catalog.byId["playing-audio"]?.dontHeuristicIds || []).includes("au-repurpose") &&
      (catalog.byId["playing-audio"]?.dontHeuristicIds || []).includes("au-headphones") &&
      catalog.byId["playing-audio"]?.pack === "patterns-playing-audio.md" &&
      catalog.byId["playing-audio"]?.appliesWhen === "always" &&
      catalog.byId["game-center"]?.dontCoverageComplete === true &&
      (catalog.byId["game-center"]?.dontHeuristicIds || []).includes("gc-gameplay") &&
      (catalog.byId["game-center"]?.dontHeuristicIds || []).includes("gc-artwork") &&
      (catalog.byId["game-center"]?.dontHeuristicIds || []).includes("gc-terms") &&
      catalog.byId["game-center"]?.pack === "tech-cluster-game-center.md" &&
      catalog.byId["game-center"]?.appliesWhen === "capability:gamecenter" &&
      catalog.byId.panels?.dontCoverageComplete === true &&
      (catalog.byId.panels?.dontHeuristicIds || []).includes("pn-window-menu") &&
      (catalog.byId.panels?.dontHeuristicIds || []).includes("pn-minimize") &&
      (catalog.byId.panels?.dontHeuristicIds || []).includes("pn-hud-obscure") &&
      catalog.byId.panels?.pack === "components-panels.md" &&
      catalog.byId.panels?.appliesWhen === "always" &&
      catalog.byId["path-controls"]?.dontCoverageComplete === true &&
      (catalog.byId["path-controls"]?.dontHeuristicIds || []).includes("pc-toolbar") &&
      catalog.byId["path-controls"]?.pack === "components-path-controls.md" &&
      catalog.byId["path-controls"]?.appliesWhen === "always" &&
      catalog.byId["outline-views"]?.dontCoverageComplete === true &&
      (catalog.byId["outline-views"]?.dontHeuristicIds || []).includes("ov-colon") &&
      (catalog.byId["outline-views"]?.dontHeuristicIds || []).includes("ov-headings") &&
      catalog.byId["outline-views"]?.pack === "components-outline-views.md" &&
      catalog.byId["outline-views"]?.appliesWhen === "always" &&
      catalog.byId["imessage-apps-and-stickers"]?.dontCoverageComplete === true &&
      (catalog.byId["imessage-apps-and-stickers"]?.dontHeuristicIds || []).includes(
        "st-mixed-sizes",
      ) &&
      catalog.byId["imessage-apps-and-stickers"]?.pack ===
        "tech-imessage-apps-and-stickers.md" &&
      catalog.byId["imessage-apps-and-stickers"]?.appliesWhen === "always" &&
      catalog.byId["action-button"]?.dontCoverageComplete === true &&
      (catalog.byId["action-button"]?.dontHeuristicIds || []).includes("ab-long-label") &&
      (catalog.byId["action-button"]?.dontHeuristicIds || []).includes("ab-settings-repeat") &&
      catalog.byId["action-button"]?.pack === "inputs-action-button.md" &&
      catalog.byId["action-button"]?.appliesWhen === "always" &&
      catalog.byId["camera-control"]?.dontCoverageComplete === true &&
      (catalog.byId["camera-control"]?.dontHeuristicIds || []).includes("cc-duplicate") &&
      catalog.byId["camera-control"]?.pack === "inputs-camera-control.md" &&
      catalog.byId["camera-control"]?.appliesWhen === "always" &&
      catalog.byId["dock-menus"]?.dontCoverageComplete === true &&
      (catalog.byId["dock-menus"]?.dontHeuristicIds || []).includes("dk-elsewhere") &&
      catalog.byId["dock-menus"]?.pack === "components-dock-menus.md" &&
      catalog.byId["dock-menus"]?.appliesWhen === "always" &&
      catalog.byId.gestures?.dontCoverageComplete === true &&
      (catalog.byId.gestures?.dontHeuristicIds || []).includes("gs-unique-tap") &&
      (catalog.byId.gestures?.dontHeuristicIds || []).includes("gs-edge-swipe") &&
      (catalog.byId.gestures?.dontHeuristicIds || []).includes("gs-gesture-only") &&
      catalog.byId.gestures?.pack === "inputs-gestures.md" &&
      catalog.byId.gestures?.appliesWhen === "phone,ipad" &&
      catalog.byId.keyboards?.dontCoverageComplete === true &&
      (catalog.byId.keyboards?.dontHeuristicIds || []).includes("kb-repurpose") &&
      (catalog.byId.keyboards?.dontHeuristicIds || []).includes("kb-modifier") &&
      (catalog.byId.keyboards?.dontHeuristicIds || []).includes("kb-help") &&
      (catalog.byId.keyboards?.dontHeuristicIds || []).includes("kb-dup-keys") &&
      catalog.byId.keyboards?.pack === "inputs-keyboards.md" &&
      catalog.byId.keyboards?.appliesWhen === "phone,ipad,desktop" &&
      catalog.byId["virtual-keyboards"]?.dontCoverageComplete === true &&
      catalog.byId["virtual-keyboards"]?.pack === "inputs-keyboards.md" &&
      catalog.byId["virtual-keyboards"]?.appliesWhen === "phone,ipad,desktop" &&
      catalog.byId["pointing-devices"]?.dontCoverageComplete === true &&
      (catalog.byId["pointing-devices"]?.dontHeuristicIds || []).includes("pt-instruct") &&
      (catalog.byId["pointing-devices"]?.dontHeuristicIds || []).includes("pt-decorative") &&
      catalog.byId["pointing-devices"]?.pack === "inputs-pointing-devices.md" &&
      catalog.byId["pointing-devices"]?.appliesWhen === "ipad,desktop" &&
      catalog.byId["apple-pencil-and-scribble"]?.dontCoverageComplete === true &&
      (catalog.byId["apple-pencil-and-scribble"]?.dontHeuristicIds || []).includes("pe-hover") &&
      (catalog.byId["apple-pencil-and-scribble"]?.dontHeuristicIds || []).includes(
        "pe-double-tap",
      ) &&
      (catalog.byId["apple-pencil-and-scribble"]?.dontHeuristicIds || []).includes(
        "pe-distract",
      ) &&
      catalog.byId["apple-pencil-and-scribble"]?.pack === "inputs-apple-pencil.md" &&
      catalog.byId["apple-pencil-and-scribble"]?.appliesWhen === "ipad+capability:pencil" &&
      catalog.byId["game-controls"]?.dontCoverageComplete === true &&
      (catalog.byId["game-controls"]?.dontHeuristicIds || []).includes("gm-letter") &&
      catalog.byId["game-controls"]?.pack === "inputs-game-controls.md" &&
      catalog.byId["game-controls"]?.appliesWhen === "games,capability:games" &&
      catalog.byId["designing-for-iphone-duo"]?.dontCoverageComplete === true &&
      (catalog.byId["designing-for-iphone-duo"]?.dontHeuristicIds || []).includes("id-reinvent") &&
      (catalog.byId["designing-for-iphone-duo"]?.dontHeuristicIds || []).includes("id-fixed") &&
      (catalog.byId["designing-for-iphone-duo"]?.dontHeuristicIds || []).includes("id-fold") &&
      catalog.byId["designing-for-iphone-duo"]?.pack === "designing-for-iphone-duo.md" &&
      catalog.byId["designing-for-iphone-duo"]?.appliesWhen === "duo,capability:duo" &&
      catalog.byId.carekit?.dontCoverageComplete === true &&
      (catalog.byId.carekit?.dontHeuristicIds || []).includes("ck-ad") &&
      catalog.byId.carekit?.pack === "tech-carekit.md" &&
      catalog.byId.carekit?.surfaceId === "carekit" &&
      catalog.byId.carekit?.appliesWhen === "capability:carekit" &&
      catalog.byId.researchkit?.dontCoverageComplete === true &&
      (catalog.byId.researchkit?.dontHeuristicIds || []).includes("rk-critical") &&
      catalog.byId.researchkit?.pack === "tech-researchkit.md" &&
      catalog.byId.researchkit?.surfaceId === "researchkit" &&
      catalog.byId.researchkit?.appliesWhen === "capability:researchkit" &&
      catalog.byId.wallet?.dontCoverageComplete === true &&
      (catalog.byId.wallet?.dontHeuristicIds || []).includes("wl-marketing") &&
      (catalog.byId.wallet?.dontHeuristicIds || []).includes("wl-decline") &&
      (catalog.byId.wallet?.dontHeuristicIds || []).includes("wl-shadow") &&
      catalog.byId.wallet?.pack === "tech-wallet.md" &&
      catalog.byId.wallet?.surfaceId === "wallet" &&
      catalog.byId.wallet?.appliesWhen === "capability:wallet" &&
      catalog.byId["app-clips"]?.dontCoverageComplete === true &&
      (catalog.byId["app-clips"]?.dontHeuristicIds || []).includes("ac-modified") &&
      (catalog.byId["app-clips"]?.dontHeuristicIds || []).includes("ac-overlay") &&
      (catalog.byId["app-clips"]?.dontHeuristicIds || []).includes("ac-motion") &&
      (catalog.byId["app-clips"]?.dontHeuristicIds || []).includes("ac-rotate") &&
      (catalog.byId["app-clips"]?.dontHeuristicIds || []).includes("ac-aspect") &&
      (catalog.byId["app-clips"]?.dontHeuristicIds || []).includes("ac-symbol") &&
      catalog.byId["app-clips"]?.pack === "tech-app-clips.md" &&
      catalog.byId["app-clips"]?.surfaceId === "app-clips" &&
      catalog.byId["app-clips"]?.appliesWhen === "capability:appclips" &&
      catalog.byId.shazamkit?.dontCoverageComplete === true &&
      (catalog.byId.shazamkit?.dontHeuristicIds || []).includes("sz-mic") &&
      catalog.byId.shazamkit?.pack === "tech-shazamkit.md" &&
      catalog.byId.shazamkit?.surfaceId === "shazamkit" &&
      catalog.byId.shazamkit?.appliesWhen === "capability:shazam" &&
      catalog.byId["photo-editing"]?.dontCoverageComplete === true &&
      (catalog.byId["photo-editing"]?.dontHeuristicIds || []).includes("px-cancel") &&
      catalog.byId["photo-editing"]?.pack === "tech-photo-editing.md" &&
      catalog.byId["photo-editing"]?.surfaceId === "photo-editing" &&
      catalog.byId["photo-editing"]?.appliesWhen === "capability:photos" &&
      catalog.byId["mac-catalyst"]?.pack === "tech-cluster-platform.md" &&
      catalog.byId["apple-pay"]?.appliesWhen === "capability:applepay" &&
      catalog.byId.workouts?.dontCoverageComplete === true &&
      (catalog.byId.workouts?.dontHeuristicIds || []).includes("wk-distract") &&
      (catalog.byId.workouts?.dontHeuristicIds || []).includes("wk-brief-session") &&
      catalog.byId.workouts?.pack === "patterns-workouts.md" &&
      catalog.byId.workouts?.appliesWhen === "always" &&
      catalog.byId["live-photos"]?.dontCoverageComplete === true &&
      (catalog.byId["live-photos"]?.dontHeuristicIds || []).includes("lp-disassemble") &&
      (catalog.byId["live-photos"]?.dontHeuristicIds || []).includes(
        "lp-playback-button",
      ) &&
      (catalog.byId["live-photos"]?.dontHeuristicIds || []).includes(
        "lp-unsupported-replica",
      ) &&
      catalog.byId["live-photos"]?.pack === "tech-live-photos.md" &&
      catalog.byId["live-photos"]?.appliesWhen === "always" &&
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
      "tap-to-pay-on-iphone",
      "id-verifier",
      "apple-in-app-purchase",
      "maps",
      "homekit",
      "workouts",
      "live-photos",
      "icloud",
      "siri",
      "app-shortcuts",
      "healthkit",
      "carplay",
      "sign-in-with-apple",
      "playing-audio",
      "panels",
      "path-controls",
      "outline-views",
      "imessage-apps-and-stickers",
      "action-button",
      "camera-control",
      "dock-menus",
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

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ttp-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ttp-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ttp-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-tap-to-pay data-ttp-apple-logo data-ttp-nonpayment>
      <button type="button">Pay</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-tap-to-pay>
      Look Up
      <button type="button">Tap to Pay on iPhone</button>
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
      passTtp:
        passStatus.topics["tap-to-pay-on-iphone"]?.state ===
        "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixTtp: fixStatus.topics["tap-to-pay-on-iphone"]?.state === "applied",
      systemKept: /data-tap-to-pay/.test(fixed) && />\s*Pay\s*</.test(fixed),
      markersGone:
        !/data-ttp-apple-logo/.test(fixed) && !/data-ttp-nonpayment/.test(fixed),
      holdUnchanged: held === origHold,
      holdTtp: holdStatus.topics["tap-to-pay-on-iphone"]?.state === "pending",
      holdStillLabel:
        /data-tap-to-pay/.test(held) &&
        /Look Up/.test(held) &&
        /Tap to Pay on iPhone/.test(held),
      holdNotInvented:
        !/ProximityReader/.test(held) &&
        !/PaymentCardReader/.test(held) &&
        !/PaymentCardReaderSession/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passTtp: passStatus.topics["tap-to-pay-on-iphone"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixTtp: fixStatus.topics["tap-to-pay-on-iphone"]?.state,
      holdTtp: holdStatus.topics["tap-to-pay-on-iphone"]?.state,
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
  results.push({ case: "catalog-apply-ttp-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-idv-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-idv-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-idv-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-id-verifier data-idv-apple-logo data-idv-comm-symbol>
      <button type="button">Verify Age</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-id-verifier>
      NFC
      <button type="button">Verify Age</button>
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
      passIdv:
        passStatus.topics["id-verifier"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixIdv: fixStatus.topics["id-verifier"]?.state === "applied",
      systemKept: /data-id-verifier/.test(fixed) && />\s*Verify Age\s*</.test(fixed),
      markersGone:
        !/data-idv-apple-logo/.test(fixed) && !/data-idv-comm-symbol/.test(fixed),
      holdUnchanged: held === origHold,
      holdIdv: holdStatus.topics["id-verifier"]?.state === "pending",
      holdStillSymbol:
        /data-id-verifier/.test(held) &&
        /\bNFC\b/.test(held) &&
        /Verify Age/.test(held),
      holdNotInvented:
        !/MobileDriversLicenseDisplayRequest/.test(held) &&
        !/MobileDriversLicenseDataRequest/.test(held) &&
        !/MobileDriversLicenseRawDataRequest/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passIdv: passStatus.topics["id-verifier"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixIdv: fixStatus.topics["id-verifier"]?.state,
      holdIdv: holdStatus.topics["id-verifier"]?.state,
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
  results.push({ case: "catalog-apply-idv-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-iap-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-iap-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-iap-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-in-app-purchase data-iap-confirm-sheet data-iap-refund-buried data-iap-refund-policy>
      <button type="button">Buy</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-in-app-purchase>
      You'll receive the refund they request.
      <button type="button">Buy</button>
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
      passIap:
        passStatus.topics["apple-in-app-purchase"]?.state ===
        "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixIap: fixStatus.topics["apple-in-app-purchase"]?.state === "applied",
      systemKept: /data-in-app-purchase/.test(fixed) && />\s*Buy\s*</.test(fixed),
      markersGone:
        !/data-iap-confirm-sheet/.test(fixed) &&
        !/data-iap-refund-buried/.test(fixed) &&
        !/data-iap-refund-policy/.test(fixed),
      holdUnchanged: held === origHold,
      holdIap: holdStatus.topics["apple-in-app-purchase"]?.state === "pending",
      holdStillPolicy:
        /data-in-app-purchase/.test(held) &&
        /You'll receive the refund they request/.test(held) &&
        /Buy/.test(held),
      holdNotInvented:
        !/StoreKit/.test(held) &&
        !/SKPaymentQueue/.test(held) &&
        !/Product\.purchase/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passIap: passStatus.topics["apple-in-app-purchase"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixIap: fixStatus.topics["apple-in-app-purchase"]?.state,
      holdIap: holdStatus.topics["apple-in-app-purchase"]?.state,
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
  results.push({ case: "catalog-apply-iap-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-maps-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-maps-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-maps-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-map data-mapkit-cover-logo data-mapkit-replica>
      <button type="button">Open in Maps</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-map>
      The legal link stays covered all the time.
      <button type="button">Open in Maps</button>
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
      passMaps: passStatus.topics.maps?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixMaps: fixStatus.topics.maps?.state === "applied",
      systemKept: /\bdata-map\b/.test(fixed) && />\s*Open in Maps\s*</.test(fixed),
      markersGone:
        !/data-mapkit-cover-logo/.test(fixed) && !/data-mapkit-replica/.test(fixed),
      holdUnchanged: held === origHold,
      holdMaps: holdStatus.topics.maps?.state === "pending",
      holdStillCover:
        /\bdata-map\b/.test(held) &&
        /The legal link stays covered all the time/.test(held) &&
        /Open in Maps/.test(held),
      holdNotInvented:
        !/MKMapView/.test(held) && !/\bMapKit\b/.test(held) && !/mapkit\.Map/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passMaps: passStatus.topics.maps?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixMaps: fixStatus.topics.maps?.state,
      holdMaps: holdStatus.topics.maps?.state,
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
  results.push({ case: "catalog-apply-maps-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-homekit-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-homekit-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-homekit-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-homekit data-hk-company-name data-hk-overwrite-db data-hk-dup-settings data-hk-cover-camera>
      <button type="button">Accessory settings</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-homekit>
      Acme Corp is suggested as a Siri service name.
      <button type="button">Accessory settings</button>
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
      passHomekit: passStatus.topics.homekit?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixHomekit: fixStatus.topics.homekit?.state === "applied",
      systemKept:
        /\bdata-homekit\b/.test(fixed) && />\s*Accessory settings\s*</.test(fixed),
      markersGone:
        !/data-hk-company-name/.test(fixed) &&
        !/data-hk-overwrite-db/.test(fixed) &&
        !/data-hk-dup-settings/.test(fixed) &&
        !/data-hk-cover-camera/.test(fixed),
      holdUnchanged: held === origHold,
      holdHomekit: holdStatus.topics.homekit?.state === "pending",
      holdStillName:
        /\bdata-homekit\b/.test(held) &&
        /Acme Corp is suggested as a Siri service name/.test(held) &&
        /Accessory settings/.test(held),
      holdNotInvented:
        !/HMHomeManager/.test(held) &&
        !/\bHMAccessory\b/.test(held) &&
        !/\bHMHome\b/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passHomekit: passStatus.topics.homekit?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixHomekit: fixStatus.topics.homekit?.state,
      holdHomekit: holdStatus.topics.homekit?.state,
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
  results.push({ case: "catalog-apply-homekit-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-workouts-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-workouts-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-workouts-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-workout data-wk-distract data-wk-brief-session>
      <button type="button">Pause</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-workout>
      The list of workouts stays on screen during an active session.
      <button type="button">Pause</button>
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
      passWorkouts: passStatus.topics.workouts?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixWorkouts: fixStatus.topics.workouts?.state === "applied",
      systemKept: /\bdata-workout\b/.test(fixed) && />\s*Pause\s*</.test(fixed),
      markersGone:
        !/data-wk-distract/.test(fixed) && !/data-wk-brief-session/.test(fixed),
      holdUnchanged: held === origHold,
      holdWorkouts: holdStatus.topics.workouts?.state === "pending",
      holdStillList:
        /\bdata-workout\b/.test(held) &&
        /The list of workouts stays on screen during an active session/.test(held) &&
        /Pause/.test(held),
      holdNotInvented:
        !/HKWorkoutSession/.test(held) &&
        !/\bHKWorkout\b/.test(held) &&
        !/WorkoutKit/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passWorkouts: passStatus.topics.workouts?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixWorkouts: fixStatus.topics.workouts?.state,
      holdWorkouts: holdStatus.topics.workouts?.state,
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
  results.push({ case: "catalog-apply-workouts-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-live-photos-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-live-photos-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-live-photos-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-live-photo data-lp-disassemble data-lp-playback-button data-lp-unsupported-replica>
      <button type="button">Share photo</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-live-photo>
      A video playback button sits on the Live Photo.
      <button type="button">Share photo</button>
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
      passLivePhotos: passStatus.topics["live-photos"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixLivePhotos: fixStatus.topics["live-photos"]?.state === "applied",
      systemKept: /\bdata-live-photo\b/.test(fixed) && />\s*Share photo\s*</.test(fixed),
      markersGone:
        !/data-lp-disassemble/.test(fixed) &&
        !/data-lp-playback-button/.test(fixed) &&
        !/data-lp-unsupported-replica/.test(fixed),
      holdUnchanged: held === origHold,
      holdLivePhotos: holdStatus.topics["live-photos"]?.state === "pending",
      holdStillButton:
        /\bdata-live-photo\b/.test(held) &&
        /A video playback button sits on the Live Photo/.test(held) &&
        /Share photo/.test(held),
      holdNotInvented:
        !/PHLivePhotoView/.test(held) && !/\bPHLivePhoto\b/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passLivePhotos: passStatus.topics["live-photos"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixLivePhotos: fixStatus.topics["live-photos"]?.state,
      holdLivePhotos: holdStatus.topics["live-photos"]?.state,
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
  results.push({ case: "catalog-apply-live-photos-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-icloud-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-icloud-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-icloud-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-icloud data-ic-ask-docs data-ic-unavailable-alert data-ic-app-resources>
      <button type="button">Documents</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-icloud>
      The app asks which documents to keep in iCloud.
      <button type="button">Documents</button>
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
      passIcloud: passStatus.topics.icloud?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixIcloud: fixStatus.topics.icloud?.state === "applied",
      systemKept: /\bdata-icloud\b/.test(fixed) && />\s*Documents\s*</.test(fixed),
      markersGone:
        !/data-ic-ask-docs/.test(fixed) &&
        !/data-ic-unavailable-alert/.test(fixed) &&
        !/data-ic-app-resources/.test(fixed),
      holdUnchanged: held === origHold,
      holdIcloud: holdStatus.topics.icloud?.state === "pending",
      holdStillAsk:
        /\bdata-icloud\b/.test(held) &&
        /The app asks which documents to keep in iCloud/.test(held) &&
        /Documents/.test(held),
      holdNotInvented:
        !/CKContainer/.test(held) && !/NSUbiquitousKeyValueStore/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passIcloud: passStatus.topics.icloud?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixIcloud: fixStatus.topics.icloud?.state,
      holdIcloud: holdStatus.topics.icloud?.state,
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
  results.push({ case: "catalog-apply-icloud-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-siri-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-siri-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-siri-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-siri data-si-advertise data-si-impersonate data-si-pronoun>
      <button type="button">Ask Siri</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-siri>
      Siri said she can help.
      <button type="button">Ask Siri</button>
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
      passSiri: passStatus.topics.siri?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixSiri: fixStatus.topics.siri?.state === "applied",
      systemKept: /\bdata-siri\b/.test(fixed) && />\s*Ask Siri\s*</.test(fixed),
      markersGone:
        !/data-si-advertise/.test(fixed) &&
        !/data-si-impersonate/.test(fixed) &&
        !/data-si-pronoun/.test(fixed),
      holdUnchanged: held === origHold,
      holdSiri: holdStatus.topics.siri?.state === "pending",
      holdStillPronoun:
        /\bdata-siri\b/.test(held) &&
        /Siri said she can help/.test(held) &&
        /Ask Siri/.test(held),
      holdNotInvented: !/INInteraction/.test(held) && !/SiriKit/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passSiri: passStatus.topics.siri?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixSiri: fixStatus.topics.siri?.state,
      holdSiri: holdStatus.topics.siri?.state,
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
  results.push({ case: "catalog-apply-siri-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-app-shortcuts-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-app-shortcuts-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-app-shortcuts-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-app-shortcuts data-as-reskin data-as-lowercase data-as-title-item>
      <button type="button">Open Shortcuts</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-app-shortcuts>
      The app offers app shortcuts you can place on the Action button.
      <button type="button">Open Shortcuts</button>
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
      passAppShortcuts:
        passStatus.topics["app-shortcuts"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixAppShortcuts: fixStatus.topics["app-shortcuts"]?.state === "applied",
      systemKept:
        /\bdata-app-shortcuts\b/.test(fixed) && />\s*Open Shortcuts\s*</.test(fixed),
      markersGone:
        !/data-as-reskin/.test(fixed) &&
        !/data-as-lowercase/.test(fixed) &&
        !/data-as-title-item/.test(fixed),
      holdUnchanged: held === origHold,
      holdAppShortcuts: holdStatus.topics["app-shortcuts"]?.state === "pending",
      holdStillLowercase:
        /\bdata-app-shortcuts\b/.test(held) &&
        /The app offers app shortcuts you can place on the Action button/.test(held) &&
        /Open Shortcuts/.test(held),
      holdNotInvented:
        !/AppShortcutsProvider/.test(held) && !/SiriTipUIView/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passAppShortcuts: passStatus.topics["app-shortcuts"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixAppShortcuts: fixStatus.topics["app-shortcuts"]?.state,
      holdAppShortcuts: holdStatus.topics["app-shortcuts"]?.state,
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
  results.push({ case: "catalog-apply-app-shortcuts-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-healthkit-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-healthkit-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-healthkit-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-healthkit data-hlt-replica data-hlt-sharing data-hlt-term>
      <button type="button">Works with Apple Health</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-healthkit>
      This app uses HealthKit to store your workouts.
      <button type="button">Works with Apple Health</button>
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
      passHealthkit: passStatus.topics.healthkit?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixHealthkit: fixStatus.topics.healthkit?.state === "applied",
      systemKept:
        /\bdata-healthkit\b/.test(fixed) && />\s*Works with Apple Health\s*</.test(fixed),
      markersGone:
        !/data-hlt-replica/.test(fixed) &&
        !/data-hlt-sharing/.test(fixed) &&
        !/data-hlt-term/.test(fixed),
      holdUnchanged: held === origHold,
      holdHealthkit: holdStatus.topics.healthkit?.state === "pending",
      holdStillTerm:
        /\bdata-healthkit\b/.test(held) &&
        /This app uses HealthKit to store your workouts/.test(held) &&
        /Works with Apple Health/.test(held),
      holdNotInvented:
        !/HKHealthStore/.test(held) && !/HKQuantityTypeIdentifier/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passHealthkit: passStatus.topics.healthkit?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixHealthkit: fixStatus.topics.healthkit?.state,
      holdHealthkit: holdStatus.topics.healthkit?.state,
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
  results.push({ case: "catalog-apply-healthkit-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-carplay-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-carplay-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-carplay-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-carplay data-cp-iphone-lock data-cp-iphone-error data-cp-iphone-interact>
      <button type="button">Open in CarPlay</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-carplay>
      Unlock iPhone to continue in CarPlay.
      <button type="button">Open in CarPlay</button>
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
      passCarplay: passStatus.topics.carplay?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixCarplay: fixStatus.topics.carplay?.state === "applied",
      systemKept:
        /\bdata-carplay\b/.test(fixed) && />\s*Open in CarPlay\s*</.test(fixed),
      markersGone:
        !/data-cp-iphone-lock/.test(fixed) &&
        !/data-cp-iphone-error/.test(fixed) &&
        !/data-cp-iphone-interact/.test(fixed),
      holdUnchanged: held === origHold,
      holdCarplay: holdStatus.topics.carplay?.state === "pending",
      holdStillLock:
        /\bdata-carplay\b/.test(held) &&
        /Unlock iPhone to continue in CarPlay/.test(held) &&
        /Open in CarPlay/.test(held),
      holdNotInvented:
        !/CPInterfaceController/.test(held) &&
        !/CPTemplateApplicationScene/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passCarplay: passStatus.topics.carplay?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixCarplay: fixStatus.topics.carplay?.state,
      holdCarplay: holdStatus.topics.carplay?.state,
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
  results.push({ case: "catalog-apply-carplay-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-siwa-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-siwa-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-siwa-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-siwa data-sia-password data-sia-email data-sia-logo>
      <button type="button">Sign in with Apple</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-siwa>
      Create a password to finish Sign in with Apple.
      <button type="button">Sign in with Apple</button>
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
      passSiwa: passStatus.topics["sign-in-with-apple"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixSiwa: fixStatus.topics["sign-in-with-apple"]?.state === "applied",
      systemKept:
        /\bdata-siwa\b/.test(fixed) && />\s*Sign in with Apple\s*</.test(fixed),
      markersGone:
        !/data-sia-password/.test(fixed) &&
        !/data-sia-email/.test(fixed) &&
        !/data-sia-logo/.test(fixed),
      holdUnchanged: held === origHold,
      holdSiwa: holdStatus.topics["sign-in-with-apple"]?.state === "pending",
      holdStillPassword:
        /\bdata-siwa\b/.test(held) &&
        /Create a password to finish Sign in with Apple/.test(held) &&
        /Sign in with Apple/.test(held),
      holdNotInvented:
        !/SignInWithAppleButton/.test(held) &&
        !/ASAuthorizationAppleIDButton/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passSiwa: passStatus.topics["sign-in-with-apple"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixSiwa: fixStatus.topics["sign-in-with-apple"]?.state,
      holdSiwa: holdStatus.topics["sign-in-with-apple"]?.state,
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
  results.push({ case: "catalog-apply-siwa-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-applepay-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-applepay-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-applepay-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-apple-pay data-ap-mark-button data-ap-plural data-ap-logo-word>
      <button type="button">Pay with Apple Pay</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-apple-pay>
      Pay with Apple Pays to check out.
      <button type="button">Pay with Apple Pay</button>
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
      passApplePay: passStatus.topics["apple-pay"]?.state === "skipped-gate",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixApplePay: fixStatus.topics["apple-pay"]?.state === "applied",
      systemKept:
        /\bdata-apple-pay\b/.test(fixed) && />\s*Pay with Apple Pay\s*</.test(fixed),
      markersGone:
        !/data-ap-mark-button/.test(fixed) &&
        !/data-ap-plural/.test(fixed) &&
        !/data-ap-logo-word/.test(fixed),
      holdUnchanged: held === origHold,
      holdApplePay: holdStatus.topics["apple-pay"]?.state === "pending",
      holdStillPlural:
        /\bdata-apple-pay\b/.test(held) &&
        /Pay with Apple Pays to check out/.test(held) &&
        /Pay with Apple Pay/.test(held),
      holdNotInvented:
        !/PKPaymentButton/.test(held) && !/PayWithApplePayButton/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passApplePay: passStatus.topics["apple-pay"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixApplePay: fixStatus.topics["apple-pay"]?.state,
      holdApplePay: holdStatus.topics["apple-pay"]?.state,
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
  results.push({ case: "catalog-apply-applepay-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-audio-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-audio-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-audio-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-playing-audio data-au-output-volume data-au-repurpose data-au-headphones>
      <button type="button">Play</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-playing-audio>
      This app sets the system output volume.
      <button type="button">Play</button>
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
      passAudio: passStatus.topics["playing-audio"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixAudio: fixStatus.topics["playing-audio"]?.state === "applied",
      systemKept: /\bdata-playing-audio\b/.test(fixed) && />\s*Play\s*</.test(fixed),
      markersGone:
        !/data-au-output-volume/.test(fixed) &&
        !/data-au-repurpose/.test(fixed) &&
        !/data-au-headphones/.test(fixed),
      holdUnchanged: held === origHold,
      holdAudio: holdStatus.topics["playing-audio"]?.state === "pending",
      holdStillVolume:
        /\bdata-playing-audio\b/.test(held) &&
        /This app sets the system output volume/.test(held) &&
        /Play/.test(held),
      holdNotInvented:
        !/AVAudioSession/.test(held) && !/MPNowPlayingInfoCenter/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passAudio: passStatus.topics["playing-audio"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixAudio: fixStatus.topics["playing-audio"]?.state,
      holdAudio: holdStatus.topics["playing-audio"]?.state,
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
  results.push({ case: "catalog-apply-playing-audio-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-gc-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-gc-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-gc-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-game-center data-gc-gameplay data-gc-artwork data-gc-terms>
      <button type="button">Menu</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-game-center>
      Show the access point during active gameplay.
      <button type="button">Menu</button>
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
      passGameCenter: passStatus.topics["game-center"]?.state === "skipped-gate",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixGameCenter: fixStatus.topics["game-center"]?.state === "applied",
      systemKept: /\bdata-game-center\b/.test(fixed) && />\s*Menu\s*</.test(fixed),
      markersGone:
        !/data-gc-gameplay/.test(fixed) &&
        !/data-gc-artwork/.test(fixed) &&
        !/data-gc-terms/.test(fixed),
      holdUnchanged: held === origHold,
      holdGameCenter: holdStatus.topics["game-center"]?.state === "pending",
      holdStillGameplay:
        /\bdata-game-center\b/.test(held) &&
        /Show the access point during active gameplay/.test(held) &&
        /Menu/.test(held),
      holdNotInvented: !/GKAccessPoint/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passGameCenter: passStatus.topics["game-center"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixGameCenter: fixStatus.topics["game-center"]?.state,
      holdGameCenter: holdStatus.topics["game-center"]?.state,
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
  results.push({ case: "catalog-apply-gamecenter-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-panels-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-panels-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-panels-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-panel data-pn-window-menu data-pn-minimize data-pn-hud-obscure>
      <button type="button">Inspector</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-panel>
      This panel is listed in the Window menu documents list.
      <button type="button">Inspector</button>
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
      passPanels: passStatus.topics.panels?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixPanels: fixStatus.topics.panels?.state === "applied",
      systemKept: /\bdata-panel\b/.test(fixed) && />\s*Inspector\s*</.test(fixed),
      markersGone:
        !/data-pn-window-menu/.test(fixed) &&
        !/data-pn-minimize/.test(fixed) &&
        !/data-pn-hud-obscure/.test(fixed),
      holdUnchanged: held === origHold,
      holdPanels: holdStatus.topics.panels?.state === "pending",
      holdStillListed:
        /\bdata-panel\b/.test(held) &&
        /Window menu documents list/.test(held) &&
        /Inspector/.test(held),
      holdNotInvented: !/NSPanel/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passPanels: passStatus.topics.panels?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixPanels: fixStatus.topics.panels?.state,
      holdPanels: holdStatus.topics.panels?.state,
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
  results.push({ case: "catalog-apply-panels-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-path-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-path-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-path-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <nav data-path-control data-pc-toolbar>
      <button type="button">Documents</button>
    </nav>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <nav data-path-control>
      This path control is placed in a toolbar or status bar.
      <button type="button">Documents</button>
    </nav>
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
      passPath: passStatus.topics["path-controls"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixPath: fixStatus.topics["path-controls"]?.state === "applied",
      systemKept: /\bdata-path-control\b/.test(fixed) && />\s*Documents\s*</.test(fixed),
      markersGone: !/data-pc-toolbar/.test(fixed),
      holdUnchanged: held === origHold,
      holdPath: holdStatus.topics["path-controls"]?.state === "pending",
      holdStillPlaced:
        /\bdata-path-control\b/.test(held) &&
        /placed in a toolbar or status bar/.test(held) &&
        /Documents/.test(held),
      holdNotInvented: !/NSPathControl/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passPath: passStatus.topics["path-controls"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixPath: fixStatus.topics["path-controls"]?.state,
      holdPath: holdStatus.topics["path-controls"]?.state,
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
  results.push({ case: "catalog-apply-path-controls-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-outline-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-outline-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-outline-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-outline data-ov-colon data-ov-headings>
      <button type="button">Folder</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-outline>
      The column heading uses a trailing colon.
      <button type="button">Folder</button>
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
      passOutline: passStatus.topics["outline-views"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixOutline: fixStatus.topics["outline-views"]?.state === "applied",
      systemKept: /\bdata-outline\b/.test(fixed) && />\s*Folder\s*</.test(fixed),
      markersGone: !/data-ov-colon/.test(fixed) && !/data-ov-headings/.test(fixed),
      holdUnchanged: held === origHold,
      holdOutline: holdStatus.topics["outline-views"]?.state === "pending",
      holdStillColon:
        /\bdata-outline\b/.test(held) &&
        /trailing colon/.test(held) &&
        /Folder/.test(held),
      holdNotInvented: !/NSOutlineView/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passOutline: passStatus.topics["outline-views"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixOutline: fixStatus.topics["outline-views"]?.state,
      holdOutline: holdStatus.topics["outline-views"]?.state,
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
  results.push({ case: "catalog-apply-outline-views-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sticker-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sticker-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sticker-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-sticker-pack data-st-mixed-sizes>
      <button type="button">Smile</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-sticker-pack>
      Don't mix sizes within a single sticker pack.
      <button type="button">Smile</button>
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
      passStickers:
        passStatus.topics["imessage-apps-and-stickers"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixStickers: fixStatus.topics["imessage-apps-and-stickers"]?.state === "applied",
      systemKept: /\bdata-sticker-pack\b/.test(fixed) && />\s*Smile\s*</.test(fixed),
      markersGone: !/data-st-mixed-sizes/.test(fixed),
      holdUnchanged: held === origHold,
      holdStickers: holdStatus.topics["imessage-apps-and-stickers"]?.state === "pending",
      holdStillMixed:
        /\bdata-sticker-pack\b/.test(held) &&
        /mix sizes within a single sticker pack/.test(held) &&
        /Smile/.test(held),
      holdNotInvented: !/MSSticker/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passStickers: passStatus.topics["imessage-apps-and-stickers"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixStickers: fixStatus.topics["imessage-apps-and-stickers"]?.state,
      holdStickers: holdStatus.topics["imessage-apps-and-stickers"]?.state,
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
  results.push({ case: "catalog-apply-imessage-stickers-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-action-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-action-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-action-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-action-button data-ab-long-label data-ab-settings-repeat>
      <button type="button">Start</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-action-button data-ab-label="Start the egg timer now">
      <button type="button">Start</button>
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
      passAction: passStatus.topics["action-button"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixAction: fixStatus.topics["action-button"]?.state === "applied",
      systemKept: /\bdata-action-button\b/.test(fixed) && />\s*Start\s*</.test(fixed),
      markersGone: !/data-ab-long-label/.test(fixed) && !/data-ab-settings-repeat/.test(fixed),
      holdUnchanged: held === origHold,
      holdAction: holdStatus.topics["action-button"]?.state === "pending",
      holdStillLong:
        /\bdata-action-button\b/.test(held) &&
        /Start the egg timer now/.test(held) &&
        /Start/.test(held),
      holdNotInvented: !/AppShortcutsProvider/.test(held) && !/UIApplicationShortcutItem/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passAction: passStatus.topics["action-button"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixAction: fixStatus.topics["action-button"]?.state,
      holdAction: holdStatus.topics["action-button"]?.state,
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
  results.push({ case: "catalog-apply-action-button-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-camera-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-camera-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-camera-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-camera-control data-cc-duplicate>
      <button type="button">Zoom</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-camera-control>
      Avoid duplicating controls in the UI and the overlay.
      <button type="button">Zoom</button>
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
      passCamera: passStatus.topics["camera-control"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixCamera: fixStatus.topics["camera-control"]?.state === "applied",
      systemKept: /\bdata-camera-control\b/.test(fixed) && />\s*Zoom\s*</.test(fixed),
      markersGone: !/data-cc-duplicate/.test(fixed),
      holdUnchanged: held === origHold,
      holdCamera: holdStatus.topics["camera-control"]?.state === "pending",
      holdStillDuplicate:
        /\bdata-camera-control\b/.test(held) &&
        /duplicating controls/.test(held) &&
        /Zoom/.test(held),
      holdNotInvented: !/AVCaptureControl/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passCamera: passStatus.topics["camera-control"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixCamera: fixStatus.topics["camera-control"]?.state,
      holdCamera: holdStatus.topics["camera-control"]?.state,
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
  results.push({ case: "catalog-apply-camera-control-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-dock-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-dock-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-dock-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div>
      <div data-dock-menu data-dk-elsewhere>
        <button type="button">Expedite Dispatch</button>
      </div>
      <button type="button">Expedite Dispatch</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-dock-menu>
      <button type="button">Expedite Dispatch</button>
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
      passDock: passStatus.topics["dock-menus"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixDock: fixStatus.topics["dock-menus"]?.state === "applied",
      systemKept: /\bdata-dock-menu\b/.test(fixed) && />\s*Expedite Dispatch\s*</.test(fixed),
      markersGone: !/data-dk-elsewhere/.test(fixed),
      holdUnchanged: held === origHold,
      holdDock: holdStatus.topics["dock-menus"]?.state === "pending",
      holdStillOnly:
        /\bdata-dock-menu\b/.test(held) &&
        /Expedite Dispatch/.test(held),
      holdNotInvented: !/applicationDockMenu/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passDock: passStatus.topics["dock-menus"]?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixDock: fixStatus.topics["dock-menus"]?.state,
      holdDock: holdStatus.topics["dock-menus"]?.state,
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
  results.push({ case: "catalog-apply-dock-menus-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-gesture-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-gesture-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-gesture-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-gesture-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, cleanDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    const writePhone = (dir) => {
      fs.writeFileSync(
        path.join(dir, "DESIGN.md"),
        "platform_primary: phone\nregister: product\nThis product is a phone app.\n",
      );
    };
    writePhone(cleanDir);
    writePhone(fixDir);
    writePhone(holdDir);
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-gesture data-gs-unique data-gs-edge data-gs-only>
      <button type="button">Save</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-gesture>
      <p>tap-to-delete with no button.</p>
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
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
      passGestures: passStatus.topics.gestures?.state === "skipped-gate",
      cleanGestures: cleanStatus.topics.gestures?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixGestures: fixStatus.topics.gestures?.state === "applied",
      systemKept: /\bdata-gesture\b/.test(fixed) && />\s*Save\s*</.test(fixed),
      markersGone: !/data-gs-unique|data-gs-edge|data-gs-only/.test(fixed),
      holdUnchanged: held === origHold,
      holdGestures: holdStatus.topics.gestures?.state === "pending",
      holdStillPhrase: /\bdata-gesture\b/.test(held) && /tap-to-delete with no button/.test(held),
      holdNotInvented: !/UITapGestureRecognizer|onTapGesture/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passGestures: passStatus.topics.gestures?.state,
      cleanGestures: cleanStatus.topics.gestures?.state,
      passForms: passStatus.topics["entering-data"]?.state,
      fixGestures: fixStatus.topics.gestures?.state,
      holdGestures: holdStatus.topics.gestures?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
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
  results.push({ case: "catalog-apply-gestures-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-keyboard-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-keyboard-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-keyboard-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-keyboard-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, cleanDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    const writePhone = (dir) => {
      fs.writeFileSync(
        path.join(dir, "DESIGN.md"),
        "platform_primary: phone\nregister: product\nThis product is a phone app.\n",
      );
    };
    writePhone(cleanDir);
    writePhone(fixDir);
    writePhone(holdDir);
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-keyboard data-kb-repurpose data-kb-modifier data-kb-help data-kb-dup-keys>
      <button type="button">Archive</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-keyboard>
      <p>Command-Z or Command-Q for an unrelated action.</p>
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
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
      passKeyboards: passStatus.topics.keyboards?.state === "skipped-gate",
      passVirtual: passStatus.topics["virtual-keyboards"]?.state === "skipped-gate",
      cleanKeyboards: cleanStatus.topics.keyboards?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixKeyboards: fixStatus.topics.keyboards?.state === "applied",
      fixVirtual: fixStatus.topics["virtual-keyboards"]?.state === "applied",
      systemKept: /\bdata-keyboard\b/.test(fixed) && />\s*Archive\s*</.test(fixed),
      markersGone: !/data-kb-repurpose|data-kb-modifier|data-kb-help|data-kb-dup-keys/.test(fixed),
      holdUnchanged: held === origHold,
      holdKeyboards: holdStatus.topics.keyboards?.state === "pending",
      holdStillPhrase:
        /\bdata-keyboard\b/.test(held) && /Command-Z or Command-Q/.test(held),
      holdNotInvented: !/keyboardShortcut|UIKeyCommand|keyEquivalent/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passKeyboards: passStatus.topics.keyboards?.state,
      cleanKeyboards: cleanStatus.topics.keyboards?.state,
      fixKeyboards: fixStatus.topics.keyboards?.state,
      holdKeyboards: holdStatus.topics.keyboards?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
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
  results.push({ case: "catalog-apply-keyboards-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pointer-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pointer-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pointer-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pointer-hold-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, cleanDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    const writeDesktop = (dir) => {
      fs.writeFileSync(
        path.join(dir, "DESIGN.md"),
        "platform_primary: desktop\nregister: product\nThis product is a Mac app.\n",
      );
    };
    writeDesktop(cleanDir);
    writeDesktop(fixDir);
    writeDesktop(holdDir);
    fs.writeFileSync(
      path.join(fixDir, "HostWidgets.tsx"),
      `export function HostWidgets() {
  return (
    <div data-pointer data-pt-instruct data-pt-decorative>
      <button type="button">Select</button>
    </div>
  );
}
`,
    );
    const origHold = `export function HostWidgets() {
  return (
    <div data-pointer>
      <p>instructional text with a pointer.</p>
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
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
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
      passPointing: passStatus.topics["pointing-devices"]?.state === "skipped-gate",
      cleanPointing: cleanStatus.topics["pointing-devices"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixPointing: fixStatus.topics["pointing-devices"]?.state === "applied",
      systemKept: /\bdata-pointer\b/.test(fixed) && />\s*Select\s*</.test(fixed),
      markersGone: !/data-pt-instruct|data-pt-decorative/.test(fixed),
      holdUnchanged: held === origHold,
      holdPointing: holdStatus.topics["pointing-devices"]?.state === "pending",
      holdStillPhrase:
        /\bdata-pointer\b/.test(held) && /instructional text with a pointer/.test(held),
      holdNotInvented: !/UIPointerStyle|NSCursor/.test(held),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passPointing: passStatus.topics["pointing-devices"]?.state,
      cleanPointing: cleanStatus.topics["pointing-devices"]?.state,
      fixPointing: fixStatus.topics["pointing-devices"]?.state,
      holdPointing: holdStatus.topics["pointing-devices"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
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
  results.push({ case: "catalog-apply-pointing-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pencil-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pencil-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pencil-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pencil-hold-"));
  const phoneDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pencil-phone-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    fs.cpSync(src, passDir, { recursive: true });
    fs.cpSync(src, cleanDir, { recursive: true });
    fs.cpSync(src, fixDir, { recursive: true });
    fs.cpSync(src, holdDir, { recursive: true });
    fs.cpSync(src, phoneDir, { recursive: true });
    const writeIpad = (dir) => {
      fs.writeFileSync(
        path.join(dir, "DESIGN.md"),
        "platform_primary: ipad\nregister: product\nThis product is an iPad app.\n",
      );
      fs.writeFileSync(path.join(dir, "Canvas.swift"), "import PencilKit\n");
    };
    writeIpad(cleanDir);
    writeIpad(fixDir);
    writeIpad(holdDir);
    fs.writeFileSync(
      path.join(phoneDir, "DESIGN.md"),
      "platform_primary: phone\nregister: product\nThis product is an iPhone app.\n",
    );
    fs.writeFileSync(path.join(phoneDir, "Canvas.swift"), "import PencilKit\n");
    const marked = `export function HostWidgets() {
  return (
    <div data-pencil data-pe-hover data-pe-double-tap data-pe-distract>
      <button type="button">Ink</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(phoneDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div data-pencil>
      <p>hover that initiates an action.</p>
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
    const phoneReport = applyCatalog({
      cwd: phoneDir,
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
    const phoneStatus = parseCatalogStatus(
      fs.readFileSync(path.join(phoneDir, ".hig", "catalog-status.yaml"), "utf8"),
    );
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const phoneWidgets = fs.readFileSync(path.join(phoneDir, "HostWidgets.tsx"), "utf8");
    const hostText = [
      ...walkSource(passDir),
      ...walkSource(cleanDir),
      ...walkSource(fixDir),
      ...walkSource(holdDir),
      ...walkSource(phoneDir),
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
      phoneChrome: phoneReport.chrome.pass === true,
      passPencil: passStatus.topics["apple-pencil-and-scribble"]?.state === "skipped-gate",
      cleanPencil: cleanStatus.topics["apple-pencil-and-scribble"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixPencil: fixStatus.topics["apple-pencil-and-scribble"]?.state === "applied",
      systemKept: /\bdata-pencil\b/.test(fixed) && />\s*Ink\s*</.test(fixed),
      markersGone: !/data-pe-hover|data-pe-double-tap|data-pe-distract/.test(fixed),
      importKept: fs.readFileSync(path.join(fixDir, "Canvas.swift"), "utf8").includes("import PencilKit"),
      holdUnchanged: held === origHold,
      holdPencil: holdStatus.topics["apple-pencil-and-scribble"]?.state === "pending",
      holdStillPhrase:
        /\bdata-pencil\b/.test(held) && /hover that initiates an action/.test(held),
      holdNotInvented: !/PKCanvasView|PKToolPicker|UIScribbleInteraction/.test(held),
      phonePencil: phoneStatus.topics["apple-pencil-and-scribble"]?.state === "skipped-gate",
      phoneMarkersRemain: /data-pe-hover|data-pe-double-tap|data-pe-distract/.test(phoneWidgets),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passPencil: passStatus.topics["apple-pencil-and-scribble"]?.state,
      cleanPencil: cleanStatus.topics["apple-pencil-and-scribble"]?.state,
      fixPencil: fixStatus.topics["apple-pencil-and-scribble"]?.state,
      holdPencil: holdStatus.topics["apple-pencil-and-scribble"]?.state,
      phonePencil: phoneStatus.topics["apple-pencil-and-scribble"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    fs.rmSync(passDir, { recursive: true, force: true });
    fs.rmSync(cleanDir, { recursive: true, force: true });
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(holdDir, { recursive: true, force: true });
    fs.rmSync(phoneDir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-pencil-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-game-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-game-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-game-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-game-hold-"));
  const letterDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-game-letter-"));
  const phoneDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-game-phone-"));
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of [passDir, cleanDir, fixDir, holdDir, letterDir, phoneDir]) {
      fs.cpSync(src, dir, { recursive: true });
    }
    const writeGames = (dir) => {
      fs.writeFileSync(
        path.join(dir, "DESIGN.md"),
        "platform_primary: games\nregister: product\nThis product is a game.\n",
      );
    };
    writeGames(cleanDir);
    writeGames(fixDir);
    writeGames(holdDir);
    writeGames(letterDir);
    fs.writeFileSync(
      path.join(phoneDir, "DESIGN.md"),
      "platform_primary: phone\nregister: product\nThis product is an iPhone app.\n",
    );
    const marked = `export function HostWidgets() {
  return (
    <div data-game-controls data-gm-letter>
      <button type="button">Fire</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(phoneDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div data-game-controls>
      <p>abstract shapes or A, X, or R1 as artwork.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origLetter = `export function HostWidgets() {
  return (
    <div data-game-controls>
      <button type="button">A</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(letterDir, "HostWidgets.tsx"), origLetter);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) =>
      applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const cleanReport = run(cleanDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const letterReport = run(letterDir);
    const phoneReport = run(phoneDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const cleanStatus = readStatus(cleanDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const letterStatus = readStatus(letterDir);
    const phoneStatus = readStatus(phoneDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const lettered = fs.readFileSync(path.join(letterDir, "HostWidgets.tsx"), "utf8");
    const phoneWidgets = fs.readFileSync(path.join(phoneDir, "HostWidgets.tsx"), "utf8");
    const hostText = [passDir, cleanDir, fixDir, holdDir, letterDir, phoneDir]
      .flatMap((dir) => walkSource(dir))
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
      letterChrome: letterReport.chrome.pass === true,
      phoneChrome: phoneReport.chrome.pass === true,
      passGame: passStatus.topics["game-controls"]?.state === "skipped-gate",
      cleanGame: cleanStatus.topics["game-controls"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixGame: fixStatus.topics["game-controls"]?.state === "applied",
      systemKept: /\bdata-game-controls\b/.test(fixed) && />\s*Fire\s*</.test(fixed),
      markersGone: !/data-gm-letter/.test(fixed),
      holdUnchanged: held === origHold,
      holdGame: holdStatus.topics["game-controls"]?.state === "pending",
      holdStillPhrase:
        /\bdata-game-controls\b/.test(held) && /A, X, or R1/.test(held),
      holdNotInvented: !/GCController|GCVirtualController/.test(held),
      letterUnchanged: lettered === origLetter,
      letterGame: letterStatus.topics["game-controls"]?.state === "pending",
      letterStillA: />\s*A\s*</.test(lettered),
      phoneGame: phoneStatus.topics["game-controls"]?.state === "skipped-gate",
      phoneMarkersRemain: /data-gm-letter/.test(phoneWidgets),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passGame: passStatus.topics["game-controls"]?.state,
      cleanGame: cleanStatus.topics["game-controls"]?.state,
      fixGame: fixStatus.topics["game-controls"]?.state,
      holdGame: holdStatus.topics["game-controls"]?.state,
      letterGame: letterStatus.topics["game-controls"]?.state,
      phoneGame: phoneStatus.topics["game-controls"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of [passDir, cleanDir, fixDir, holdDir, letterDir, phoneDir]) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  results.push({ case: "catalog-apply-game-controls-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-duo-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-duo-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-duo-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-duo-hold-"));
  const boundsDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-duo-bounds-"));
  const arrangementDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-duo-arrangement-"));
  const phoneDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-duo-phone-"));
  const dirs = [passDir, cleanDir, fixDir, holdDir, boundsDir, arrangementDir, phoneDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const writeDuo = (dir) => {
      fs.writeFileSync(
        path.join(dir, "DESIGN.md"),
        "platform_primary: duo\nregister: product\nThis product is an iPhone Duo app.\n",
      );
    };
    writeDuo(cleanDir);
    writeDuo(fixDir);
    writeDuo(holdDir);
    writeDuo(boundsDir);
    fs.writeFileSync(
      path.join(arrangementDir, "DESIGN.md"),
      "platform_primary: phone\nregister: product\nThis product is an iPhone app.\n",
    );
    fs.writeFileSync(
      path.join(arrangementDir, "Fold.swift"),
      "struct Outer: View {\n  var body: some View { ArrangementView { Text(\"Outer\") } }\n}\n",
    );
    fs.writeFileSync(
      path.join(phoneDir, "DESIGN.md"),
      "platform_primary: phone\nregister: product\nThis product is an iPhone app.\n",
    );
    const marked = `export function HostWidgets() {
  return (
    <div data-duo data-id-reinvent data-id-fixed data-id-fold>
      <button type="button">Fold</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(phoneDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div data-duo>
      <p>fixed widths and display-specific dependencies.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origBounds = `export function HostWidgets() {
  return (
    <div data-duo>
      <p>{UIScreen.main.bounds.width}</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(boundsDir, "HostWidgets.tsx"), origBounds);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const cleanReport = run(cleanDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const boundsReport = run(boundsDir);
    const arrangementReport = run(arrangementDir);
    const phoneReport = run(phoneDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const cleanStatus = readStatus(cleanDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const boundsStatus = readStatus(boundsDir);
    const arrangementStatus = readStatus(arrangementDir);
    const phoneStatus = readStatus(phoneDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const bounded = fs.readFileSync(path.join(boundsDir, "HostWidgets.tsx"), "utf8");
    const arranged = fs.readFileSync(path.join(arrangementDir, "Fold.swift"), "utf8");
    const phoneWidgets = fs.readFileSync(path.join(phoneDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      cleanChrome: cleanReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      boundsChrome: boundsReport.chrome.pass === true,
      arrangementChrome: arrangementReport.chrome.pass === true,
      phoneChrome: phoneReport.chrome.pass === true,
      passDuo: passStatus.topics["designing-for-iphone-duo"]?.state === "skipped-gate",
      cleanDuo: cleanStatus.topics["designing-for-iphone-duo"]?.state === "skipped-no-affordance",
      arrangementDuo:
        arrangementStatus.topics["designing-for-iphone-duo"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixDuo: fixStatus.topics["designing-for-iphone-duo"]?.state === "applied",
      systemKept: /\bdata-duo\b/.test(fixed) && />\s*Fold\s*</.test(fixed),
      markersGone: !/data-id-reinvent|data-id-fixed|data-id-fold/.test(fixed),
      holdUnchanged: held === origHold,
      holdDuo: holdStatus.topics["designing-for-iphone-duo"]?.state === "pending",
      holdStillPhrase: /\bdata-duo\b/.test(held) && /fixed widths/.test(held),
      holdNotInvented: !/ArrangementView|UIArrangementViewController/.test(held),
      boundsUnchanged: bounded === origBounds,
      boundsDuo: boundsStatus.topics["designing-for-iphone-duo"]?.state === "pending",
      boundsKept: /UIScreen\.main\.bounds/.test(bounded),
      arrangementKept: /ArrangementView/.test(arranged),
      phoneDuo: phoneStatus.topics["designing-for-iphone-duo"]?.state === "skipped-gate",
      phoneMarkersRemain: /data-id-reinvent|data-id-fixed|data-id-fold/.test(phoneWidgets),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passDuo: passStatus.topics["designing-for-iphone-duo"]?.state,
      cleanDuo: cleanStatus.topics["designing-for-iphone-duo"]?.state,
      arrangementDuo: arrangementStatus.topics["designing-for-iphone-duo"]?.state,
      fixDuo: fixStatus.topics["designing-for-iphone-duo"]?.state,
      holdDuo: holdStatus.topics["designing-for-iphone-duo"]?.state,
      boundsDuo: boundsStatus.topics["designing-for-iphone-duo"]?.state,
      phoneDuo: phoneStatus.topics["designing-for-iphone-duo"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-iphone-duo-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-care-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-care-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-care-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-care-hold-"));
  const adDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-care-ad-"));
  const researchDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-care-research-"));
  const dirs = [passDir, cleanDir, fixDir, holdDir, adDir, researchDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const writeCareImport = (dir) => {
      fs.writeFileSync(path.join(dir, "Care.swift"), "import CareKit\n");
    };
    writeCareImport(cleanDir);
    writeCareImport(fixDir);
    writeCareImport(holdDir);
    writeCareImport(adDir);
    fs.writeFileSync(path.join(researchDir, "Study.swift"), "import ResearchKit\n");
    const marked = `export function HostWidgets() {
  return (
    <div data-carekit data-ck-ad>
      <button type="button">Plan</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(researchDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div data-carekit>
      <p>People don't want to see advertising.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origAd = `export function HostWidgets() {
  return (
    <div data-carekit>
      <p>Sponsored</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(adDir, "HostWidgets.tsx"), origAd);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const cleanReport = run(cleanDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const adReport = run(adDir);
    const researchReport = run(researchDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const cleanStatus = readStatus(cleanDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const adStatus = readStatus(adDir);
    const researchStatus = readStatus(researchDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const advertised = fs.readFileSync(path.join(adDir, "HostWidgets.tsx"), "utf8");
    const researched = fs.readFileSync(path.join(researchDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      cleanChrome: cleanReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      adChrome: adReport.chrome.pass === true,
      researchChrome: researchReport.chrome.pass === true,
      passCare: passStatus.topics.carekit?.state === "skipped-gate",
      cleanCare: cleanStatus.topics.carekit?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      passResearch: passStatus.topics.researchkit?.dontCoverageComplete !== true,
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixCare: fixStatus.topics.carekit?.state === "applied",
      systemKept: /\bdata-carekit\b/.test(fixed) && />\s*Plan\s*</.test(fixed),
      markersGone: !/data-ck-ad/.test(fixed),
      importKept: fs.readFileSync(path.join(fixDir, "Care.swift"), "utf8").includes("import CareKit"),
      holdUnchanged: held === origHold,
      holdCare: holdStatus.topics.carekit?.state === "pending",
      holdStillAd: /\bdata-carekit\b/.test(held) && /don't want to see advertising/.test(held),
      holdNotInvented: !/OCKCarePlanStore|HKHealthStore/.test(held),
      adUnchanged: advertised === origAd,
      adCare: adStatus.topics.carekit?.state === "pending",
      adKept: /Sponsored/.test(advertised),
      researchCare: researchStatus.topics.carekit?.state === "skipped-gate",
      researchMarkersRemain: /data-ck-ad/.test(researched),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passCare: passStatus.topics.carekit?.state,
      cleanCare: cleanStatus.topics.carekit?.state,
      fixCare: fixStatus.topics.carekit?.state,
      holdCare: holdStatus.topics.carekit?.state,
      adCare: adStatus.topics.carekit?.state,
      researchCare: researchStatus.topics.carekit?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-carekit-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-rk-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-rk-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-rk-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-rk-hold-"));
  const signalDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-rk-signal-"));
  const careDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-rk-care-"));
  const dirs = [passDir, cleanDir, fixDir, holdDir, signalDir, careDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const writeStudyImport = (dir) => {
      fs.writeFileSync(path.join(dir, "Study.swift"), "import ResearchKit\n");
    };
    writeStudyImport(cleanDir);
    writeStudyImport(fixDir);
    writeStudyImport(holdDir);
    writeStudyImport(signalDir);
    fs.writeFileSync(path.join(careDir, "Care.swift"), "import CareKit\n");
    const marked = `export function HostWidgets() {
  return (
    <div data-researchkit data-rk-critical>
      <button type="button">Study</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(careDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div data-researchkit>
      <p>Don't request access to data that isn't critical to your study.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origSignal = `export function HostWidgets() {
  return (
    <div data-researchkit>
      <p>Request access to calendar data. Not critical to the study.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(signalDir, "HostWidgets.tsx"), origSignal);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const cleanReport = run(cleanDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const signalReport = run(signalDir);
    const careReport = run(careDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const cleanStatus = readStatus(cleanDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const signalStatus = readStatus(signalDir);
    const careStatus = readStatus(careDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const signaled = fs.readFileSync(path.join(signalDir, "HostWidgets.tsx"), "utf8");
    const cared = fs.readFileSync(path.join(careDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      cleanChrome: cleanReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      signalChrome: signalReport.chrome.pass === true,
      careChrome: careReport.chrome.pass === true,
      passStudy: passStatus.topics.researchkit?.state === "skipped-gate",
      cleanStudy: cleanStatus.topics.researchkit?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      passCare: passStatus.topics.carekit?.dontCoverageComplete !== true,
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixStudy: fixStatus.topics.researchkit?.state === "applied",
      systemKept: /\bdata-researchkit\b/.test(fixed) && />\s*Study\s*</.test(fixed),
      markersGone: !/data-rk-critical/.test(fixed),
      importKept: fs.readFileSync(path.join(fixDir, "Study.swift"), "utf8").includes("import ResearchKit"),
      holdUnchanged: held === origHold,
      holdStudy: holdStatus.topics.researchkit?.state === "pending",
      holdStillPhrase:
        /\bdata-researchkit\b/.test(held) &&
        /isn't critical to your study/.test(held),
      holdNotInvented: !/ORKConsent|HKHealthStore|permission sheet/.test(held),
      signalUnchanged: signaled === origSignal,
      signalStudy: signalStatus.topics.researchkit?.state === "pending",
      signalKept: /Not critical to the study/.test(signaled),
      careStudy: careStatus.topics.researchkit?.state === "skipped-gate",
      careMarkersRemain: /data-rk-critical/.test(cared),
      careCare: careStatus.topics.carekit?.state === "skipped-no-affordance",
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passStudy: passStatus.topics.researchkit?.state,
      cleanStudy: cleanStatus.topics.researchkit?.state,
      fixStudy: fixStatus.topics.researchkit?.state,
      holdStudy: holdStatus.topics.researchkit?.state,
      signalStudy: signalStatus.topics.researchkit?.state,
      careStudy: careStatus.topics.researchkit?.state,
      careCare: careStatus.topics.carekit?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-researchkit-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wl-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wl-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wl-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wl-hold-"));
  const saleDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wl-sale-"));
  const payDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wl-pay-"));
  const dirs = [passDir, cleanDir, fixDir, holdDir, saleDir, payDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const writePassKit = (dir) => {
      fs.writeFileSync(path.join(dir, "Pass.swift"), "import PassKit\nlet library = PKPassLibrary()\n");
    };
    writePassKit(cleanDir);
    writePassKit(fixDir);
    writePassKit(holdDir);
    writePassKit(saleDir);
    fs.writeFileSync(path.join(payDir, "Pay.swift"), "let button = PKPaymentButton()\n");
    const marked = `export function HostWidgets() {
  return (
    <div data-wallet data-wl-marketing>
      <button type="button">Pass</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(payDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div data-wallet>
      <p>Never use a change message for marketing.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origSale = `export function HostWidgets() {
  return (
    <div data-wallet>
      <p>changeMessage Weekend sale</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(saleDir, "HostWidgets.tsx"), origSale);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const cleanReport = run(cleanDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const saleReport = run(saleDir);
    const payReport = run(payDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const cleanStatus = readStatus(cleanDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const saleStatus = readStatus(saleDir);
    const payStatus = readStatus(payDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const sold = fs.readFileSync(path.join(saleDir, "HostWidgets.tsx"), "utf8");
    const paid = fs.readFileSync(path.join(payDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      cleanChrome: cleanReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      saleChrome: saleReport.chrome.pass === true,
      payChrome: payReport.chrome.pass === true,
      passWallet: passStatus.topics.wallet?.state === "skipped-gate",
      cleanWallet: cleanStatus.topics.wallet?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      passPay: passStatus.topics["apple-pay"]?.state === "skipped-gate",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixWallet: fixStatus.topics.wallet?.state === "applied",
      systemKept: /\bdata-wallet\b/.test(fixed) && />\s*Pass\s*</.test(fixed),
      markersGone: !/data-wl-marketing/.test(fixed),
      importKept: fs.readFileSync(path.join(fixDir, "Pass.swift"), "utf8").includes("import PassKit"),
      holdUnchanged: held === origHold,
      holdWallet: holdStatus.topics.wallet?.state === "pending",
      holdStillPhrase: /\bdata-wallet\b/.test(held) && /change message for marketing/.test(held),
      holdNotInvented: !/PKAddPassesViewController|Add to Apple Wallet/.test(held),
      saleUnchanged: sold === origSale,
      saleWallet: saleStatus.topics.wallet?.state === "pending",
      saleKept: /Weekend sale/.test(sold),
      payWallet: payStatus.topics.wallet?.state === "skipped-gate",
      payMarkersRemain: /data-wl-marketing/.test(paid),
      payButtonKept: fs.readFileSync(path.join(payDir, "Pay.swift"), "utf8").includes("PKPaymentButton"),
      payPayLaunched:
        payStatus.topics["apple-pay"]?.state !== "skipped-gate" &&
        payStatus.topics["apple-pay"]?.state !== "skipped-no-affordance",
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passWallet: passStatus.topics.wallet?.state,
      cleanWallet: cleanStatus.topics.wallet?.state,
      fixWallet: fixStatus.topics.wallet?.state,
      holdWallet: holdStatus.topics.wallet?.state,
      saleWallet: saleStatus.topics.wallet?.state,
      payWallet: payStatus.topics.wallet?.state,
      payPay: payStatus.topics["apple-pay"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-wallet-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ac-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ac-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ac-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ac-hold-"));
  const shadowDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ac-shadow-"));
  const adsDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ac-ads-"));
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ac-bare-"));
  const dirs = [passDir, cleanDir, fixDir, holdDir, shadowDir, adsDir, bareDir];
  const entitlement = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
  <key>com.apple.developer.associated-appclip-app-identifiers</key>
  <array><string>$(AppIdentifierPrefix)com.example.clip</string></array>
</dict></plist>
`;
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    for (const dir of [cleanDir, fixDir, holdDir, shadowDir, adsDir]) {
      fs.writeFileSync(path.join(dir, "App.entitlements"), entitlement);
    }
    const marked = `export function HostWidgets() {
  return (
    <div data-app-clip-code data-ac-modified>
      <button type="button">Code</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(bareDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div data-app-clip-code>
      <p>Don't create your own App Clip Code design.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origShadow = `export function HostWidgets() {
  return (
    <div data-app-clip-code style={{ filter: "drop-shadow(0 0 8px #000)" }}>
      <button type="button">Code</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(shadowDir, "HostWidgets.tsx"), origShadow);
    const origAds = `export function HostWidgets() {
  return (
    <div data-app-clip-code>
      <p>Don't display ads in your App Clip.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(adsDir, "HostWidgets.tsx"), origAds);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const cleanReport = run(cleanDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const shadowReport = run(shadowDir);
    const adsReport = run(adsDir);
    const bareReport = run(bareDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const cleanStatus = readStatus(cleanDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const shadowStatus = readStatus(shadowDir);
    const adsStatus = readStatus(adsDir);
    const bareStatus = readStatus(bareDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const shadowed = fs.readFileSync(path.join(shadowDir, "HostWidgets.tsx"), "utf8");
    const ads = fs.readFileSync(path.join(adsDir, "HostWidgets.tsx"), "utf8");
    const bared = fs.readFileSync(path.join(bareDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      cleanChrome: cleanReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      shadowChrome: shadowReport.chrome.pass === true,
      adsChrome: adsReport.chrome.pass === true,
      bareChrome: bareReport.chrome.pass === true,
      passClip: passStatus.topics["app-clips"]?.state === "skipped-gate",
      cleanClip: cleanStatus.topics["app-clips"]?.state === "skipped-no-affordance",
      passForms: passStatus.topics["entering-data"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixClip: fixStatus.topics["app-clips"]?.state === "applied",
      systemKept: /\bdata-app-clip-code\b/.test(fixed) && />\s*Code\s*</.test(fixed),
      markersGone: !/data-ac-modified/.test(fixed),
      entitlementKept: fs
        .readFileSync(path.join(fixDir, "App.entitlements"), "utf8")
        .includes("com.apple.developer.associated-appclip-app-identifiers"),
      holdUnchanged: held === origHold,
      holdClip: holdStatus.topics["app-clips"]?.state === "pending",
      holdStillPhrase: /\bdata-app-clip-code\b/.test(held) && /create your own App Clip Code/.test(held),
      holdNotInvented: !/<img|AppClipCodeGenerator/.test(held),
      shadowUnchanged: shadowed === origShadow,
      shadowClip: shadowStatus.topics["app-clips"]?.state === "pending",
      shadowKept: /drop-shadow/.test(shadowed),
      adsUnchanged: ads === origAds,
      adsClip: adsStatus.topics["app-clips"]?.state === "already-compliant",
      adsKept: /Don't display ads/.test(ads),
      bareClip: bareStatus.topics["app-clips"]?.state === "skipped-gate",
      bareMarkersRemain: /data-ac-modified/.test(bared),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passClip: passStatus.topics["app-clips"]?.state,
      cleanClip: cleanStatus.topics["app-clips"]?.state,
      fixClip: fixStatus.topics["app-clips"]?.state,
      holdClip: holdStatus.topics["app-clips"]?.state,
      shadowClip: shadowStatus.topics["app-clips"]?.state,
      adsClip: adsStatus.topics["app-clips"]?.state,
      bareClip: bareStatus.topics["app-clips"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-app-clips-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acp-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acp-fix-"));
  const logoDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acp-logo-"));
  const motionDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acp-motion-"));
  const rotateDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acp-rotate-"));
  const adsDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acp-ads-"));
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acp-bare-"));
  const dirs = [passDir, fixDir, logoDir, motionDir, rotateDir, adsDir, bareDir];
  const entitlement = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
  <key>com.apple.developer.associated-appclip-app-identifiers</key>
  <array><string>$(AppIdentifierPrefix)com.example.clip</string></array>
</dict></plist>
`;
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    for (const dir of [fixDir, logoDir, motionDir, rotateDir, adsDir]) {
      fs.writeFileSync(path.join(dir, "App.entitlements"), entitlement);
    }
    const marked = `export function HostWidgets() {
  return (
    <div data-app-clip-code data-ac-overlay data-ac-motion data-ac-rotate>
      <button type="button">Code</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(bareDir, "HostWidgets.tsx"), marked);
    const origLogo = `export function HostWidgets() {
  return (
    <div data-app-clip-code>
      <img alt="Logo" src="/logo.png" />
    </div>
  );
}
`;
    fs.writeFileSync(path.join(logoDir, "HostWidgets.tsx"), origLogo);
    const origMotion = `export function HostWidgets() {
  return (
    <div data-app-clip-code style={{ animation: "pulse 1s infinite" }}>
      <button type="button">Code</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(motionDir, "HostWidgets.tsx"), origMotion);
    const origRotate = `export function HostWidgets() {
  return (
    <div data-app-clip-code style={{ transform: "rotate(12deg)" }}>
      <button type="button">Code</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(rotateDir, "HostWidgets.tsx"), origRotate);
    const origAds = `export function HostWidgets() {
  return (
    <div data-app-clip-code>
      <p>Don't display ads in your App Clip.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(adsDir, "HostWidgets.tsx"), origAds);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const logoReport = run(logoDir);
    const motionReport = run(motionDir);
    const rotateReport = run(rotateDir);
    const adsReport = run(adsDir);
    const bareReport = run(bareDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const logoStatus = readStatus(logoDir);
    const motionStatus = readStatus(motionDir);
    const rotateStatus = readStatus(rotateDir);
    const adsStatus = readStatus(adsDir);
    const bareStatus = readStatus(bareDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const logo = fs.readFileSync(path.join(logoDir, "HostWidgets.tsx"), "utf8");
    const motion = fs.readFileSync(path.join(motionDir, "HostWidgets.tsx"), "utf8");
    const rotated = fs.readFileSync(path.join(rotateDir, "HostWidgets.tsx"), "utf8");
    const ads = fs.readFileSync(path.join(adsDir, "HostWidgets.tsx"), "utf8");
    const bared = fs.readFileSync(path.join(bareDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      logoChrome: logoReport.chrome.pass === true,
      motionChrome: motionReport.chrome.pass === true,
      rotateChrome: rotateReport.chrome.pass === true,
      adsChrome: adsReport.chrome.pass === true,
      bareChrome: bareReport.chrome.pass === true,
      passClip: passStatus.topics["app-clips"]?.state === "skipped-gate",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixClip: fixStatus.topics["app-clips"]?.state === "applied",
      systemKept: /\bdata-app-clip-code\b/.test(fixed) && />\s*Code\s*</.test(fixed),
      markersGone:
        !/data-ac-overlay/.test(fixed) &&
        !/data-ac-motion/.test(fixed) &&
        !/data-ac-rotate/.test(fixed),
      entitlementKept: fs
        .readFileSync(path.join(fixDir, "App.entitlements"), "utf8")
        .includes("com.apple.developer.associated-appclip-app-identifiers"),
      logoUnchanged: logo === origLogo,
      logoClip: logoStatus.topics["app-clips"]?.state === "pending",
      logoKept: /<img\b/.test(logo) && /\bdata-app-clip-code\b/.test(logo),
      logoNotInvented: !/AppClipCodeGenerator/.test(logo),
      motionUnchanged: motion === origMotion,
      motionClip: motionStatus.topics["app-clips"]?.state === "pending",
      motionKept: /animation\s*:/.test(motion),
      rotateUnchanged: rotated === origRotate,
      rotateClip: rotateStatus.topics["app-clips"]?.state === "pending",
      rotateKept: /rotate\s*\(/.test(rotated),
      adsUnchanged: ads === origAds,
      adsClip: adsStatus.topics["app-clips"]?.state === "already-compliant",
      adsKept: /Don't display ads/.test(ads),
      bareClip: bareStatus.topics["app-clips"]?.state === "skipped-gate",
      bareMarkersRemain:
        /data-ac-overlay/.test(bared) &&
        /data-ac-motion/.test(bared) &&
        /data-ac-rotate/.test(bared),
      holdPrinciples: logoStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: logoReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passClip: passStatus.topics["app-clips"]?.state,
      fixClip: fixStatus.topics["app-clips"]?.state,
      logoClip: logoStatus.topics["app-clips"]?.state,
      motionClip: motionStatus.topics["app-clips"]?.state,
      rotateClip: rotateStatus.topics["app-clips"]?.state,
      adsClip: adsStatus.topics["app-clips"]?.state,
      bareClip: bareStatus.topics["app-clips"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-app-clip-overlay-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aca-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aca-fix-"));
  const fillDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aca-fill-"));
  const scaleDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aca-scale-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aca-hold-"));
  const adsDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aca-ads-"));
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aca-bare-"));
  const dirs = [passDir, fixDir, fillDir, scaleDir, holdDir, adsDir, bareDir];
  const entitlement = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
  <key>com.apple.developer.associated-appclip-app-identifiers</key>
  <array><string>$(AppIdentifierPrefix)com.example.clip</string></array>
</dict></plist>
`;
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    for (const dir of [fixDir, fillDir, scaleDir, holdDir, adsDir]) {
      fs.writeFileSync(path.join(dir, "App.entitlements"), entitlement);
    }
    const marked = `export function HostWidgets() {
  return (
    <div data-app-clip-code data-ac-aspect>
      <button type="button">Code</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(bareDir, "HostWidgets.tsx"), marked);
    const origFill = `export function HostWidgets() {
  return (
    <div data-app-clip-code style="object-fit: fill">
      <button type="button">Code</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fillDir, "HostWidgets.tsx"), origFill);
    const origScale = `export function HostWidgets() {
  return (
    <div data-app-clip-code style="transform: scale(2, 1)">
      <button type="button">Code</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(scaleDir, "HostWidgets.tsx"), origScale);
    const origHold = `export function HostWidgets() {
  return (
    <div data-app-clip-code>
      <p>Don't change the generated code's aspect ratio.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origAds = `export function HostWidgets() {
  return (
    <div data-app-clip-code>
      <p>Don't display ads in your App Clip.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(adsDir, "HostWidgets.tsx"), origAds);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const fillReport = run(fillDir);
    const scaleReport = run(scaleDir);
    const holdReport = run(holdDir);
    const adsReport = run(adsDir);
    const bareReport = run(bareDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const fillStatus = readStatus(fillDir);
    const scaleStatus = readStatus(scaleDir);
    const holdStatus = readStatus(holdDir);
    const adsStatus = readStatus(adsDir);
    const bareStatus = readStatus(bareDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const filled = fs.readFileSync(path.join(fillDir, "HostWidgets.tsx"), "utf8");
    const scaled = fs.readFileSync(path.join(scaleDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const ads = fs.readFileSync(path.join(adsDir, "HostWidgets.tsx"), "utf8");
    const bared = fs.readFileSync(path.join(bareDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      fillChrome: fillReport.chrome.pass === true,
      scaleChrome: scaleReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      adsChrome: adsReport.chrome.pass === true,
      bareChrome: bareReport.chrome.pass === true,
      passClip: passStatus.topics["app-clips"]?.state === "skipped-gate",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixClip: fixStatus.topics["app-clips"]?.state === "applied",
      systemKept: /\bdata-app-clip-code\b/.test(fixed) && />\s*Code\s*</.test(fixed),
      markersGone: !/data-ac-aspect/.test(fixed),
      entitlementKept: fs
        .readFileSync(path.join(fixDir, "App.entitlements"), "utf8")
        .includes("com.apple.developer.associated-appclip-app-identifiers"),
      fillUnchanged: filled === origFill,
      fillClip: fillStatus.topics["app-clips"]?.state === "pending",
      fillKept: /object-fit:\s*fill/.test(filled),
      scaleUnchanged: scaled === origScale,
      scaleClip: scaleStatus.topics["app-clips"]?.state === "pending",
      scaleKept: /scale\(\s*2\s*,\s*1\s*\)/.test(scaled),
      holdUnchanged: held === origHold,
      holdClip: holdStatus.topics["app-clips"]?.state === "pending",
      holdStillPhrase: /aspect ratio/.test(held) && /\bdata-app-clip-code\b/.test(held),
      holdNotInvented: !/AppClipCodeGenerator/.test(held),
      adsUnchanged: ads === origAds,
      adsClip: adsStatus.topics["app-clips"]?.state === "already-compliant",
      adsKept: /Don't display ads/.test(ads),
      bareClip: bareStatus.topics["app-clips"]?.state === "skipped-gate",
      bareMarkersRemain: /data-ac-aspect/.test(bared),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passClip: passStatus.topics["app-clips"]?.state,
      fixClip: fixStatus.topics["app-clips"]?.state,
      fillClip: fillStatus.topics["app-clips"]?.state,
      scaleClip: scaleStatus.topics["app-clips"]?.state,
      holdClip: holdStatus.topics["app-clips"]?.state,
      adsClip: adsStatus.topics["app-clips"]?.state,
      bareClip: bareStatus.topics["app-clips"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-app-clip-aspect-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acs-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acs-fix-"));
  const glyphDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acs-glyph-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acs-hold-"));
  const adsDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acs-ads-"));
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-acs-bare-"));
  const dirs = [passDir, fixDir, glyphDir, holdDir, adsDir, bareDir];
  const entitlement = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
  <key>com.apple.developer.associated-appclip-app-identifiers</key>
  <array><string>$(AppIdentifierPrefix)com.example.clip</string></array>
</dict></plist>
`;
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    for (const dir of [fixDir, glyphDir, holdDir, adsDir]) {
      fs.writeFileSync(path.join(dir, "App.entitlements"), entitlement);
    }
    const marked = `export function HostWidgets() {
  return (
    <div data-app-clip-code data-ac-symbol>
      <button type="button">Code</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(bareDir, "HostWidgets.tsx"), marked);
    const origGlyph = `export function HostWidgets() {
  return (
    <div data-app-clip-code>
      <span>™</span>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(glyphDir, "HostWidgets.tsx"), origGlyph);
    const origHold = `export function HostWidgets() {
  return (
    <div data-app-clip-code>
      <p>Don't add a symbol to App Clip Codes.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origAds = `export function HostWidgets() {
  return (
    <div data-app-clip-code>
      <p>Don't display ads in your App Clip.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(adsDir, "HostWidgets.tsx"), origAds);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const glyphReport = run(glyphDir);
    const holdReport = run(holdDir);
    const adsReport = run(adsDir);
    const bareReport = run(bareDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const glyphStatus = readStatus(glyphDir);
    const holdStatus = readStatus(holdDir);
    const adsStatus = readStatus(adsDir);
    const bareStatus = readStatus(bareDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const glyph = fs.readFileSync(path.join(glyphDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const ads = fs.readFileSync(path.join(adsDir, "HostWidgets.tsx"), "utf8");
    const bared = fs.readFileSync(path.join(bareDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      glyphChrome: glyphReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      adsChrome: adsReport.chrome.pass === true,
      bareChrome: bareReport.chrome.pass === true,
      passClip: passStatus.topics["app-clips"]?.state === "skipped-gate",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixClip: fixStatus.topics["app-clips"]?.state === "applied",
      systemKept: /\bdata-app-clip-code\b/.test(fixed) && />\s*Code\s*</.test(fixed),
      markersGone: !/data-ac-symbol/.test(fixed),
      entitlementKept: fs
        .readFileSync(path.join(fixDir, "App.entitlements"), "utf8")
        .includes("com.apple.developer.associated-appclip-app-identifiers"),
      glyphUnchanged: glyph === origGlyph,
      glyphClip: glyphStatus.topics["app-clips"]?.state === "pending",
      glyphKept: /™/.test(glyph) && /\bdata-app-clip-code\b/.test(glyph),
      glyphNotInvented: !/AppClipCodeGenerator/.test(glyph),
      holdUnchanged: held === origHold,
      holdClip: holdStatus.topics["app-clips"]?.state === "pending",
      holdStillPhrase: /add a symbol to App Clip Codes/.test(held),
      adsUnchanged: ads === origAds,
      adsClip: adsStatus.topics["app-clips"]?.state === "already-compliant",
      adsKept: /Don't display ads/.test(ads),
      bareClip: bareStatus.topics["app-clips"]?.state === "skipped-gate",
      bareMarkersRemain: /data-ac-symbol/.test(bared),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passClip: passStatus.topics["app-clips"]?.state,
      fixClip: fixStatus.topics["app-clips"]?.state,
      glyphClip: glyphStatus.topics["app-clips"]?.state,
      holdClip: holdStatus.topics["app-clips"]?.state,
      adsClip: adsStatus.topics["app-clips"]?.state,
      bareClip: bareStatus.topics["app-clips"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-app-clip-symbol-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wld-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wld-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wld-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wld-hold-"));
  const againDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wld-again-"));
  const onceDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wld-once-"));
  const payDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wld-pay-"));
  const dirs = [passDir, cleanDir, fixDir, holdDir, againDir, onceDir, payDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const writePassKit = (dir) => {
      fs.writeFileSync(path.join(dir, "Pass.swift"), "import PassKit\nlet library = PKPassLibrary()\n");
    };
    writePassKit(cleanDir);
    writePassKit(fixDir);
    writePassKit(holdDir);
    writePassKit(againDir);
    writePassKit(onceDir);
    fs.writeFileSync(path.join(payDir, "Pay.swift"), "let button = PKPaymentButton()\n");
    const marked = `export function HostWidgets() {
  return (
    <div data-wallet data-wl-decline>
      <button type="button">Pass</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(payDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div data-wallet>
      <p>If people decline your suggestion, don't ask them again.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origAgain = `export function HostWidgets() {
  return (
    <div data-wallet>
      {declined ? <button type="button">Add again</button> : null}
    </div>
  );
}
`;
    fs.writeFileSync(path.join(againDir, "HostWidgets.tsx"), origAgain);
    const origOnce = `export function HostWidgets() {
  return (
    <div data-wallet>
      <button type="button">Add to Wallet</button>
      <p>Don't ask them again for camera access.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(onceDir, "HostWidgets.tsx"), origOnce);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const cleanReport = run(cleanDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const againReport = run(againDir);
    const onceReport = run(onceDir);
    const payReport = run(payDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const cleanStatus = readStatus(cleanDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const againStatus = readStatus(againDir);
    const onceStatus = readStatus(onceDir);
    const payStatus = readStatus(payDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const again = fs.readFileSync(path.join(againDir, "HostWidgets.tsx"), "utf8");
    const once = fs.readFileSync(path.join(onceDir, "HostWidgets.tsx"), "utf8");
    const paid = fs.readFileSync(path.join(payDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      cleanChrome: cleanReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      againChrome: againReport.chrome.pass === true,
      onceChrome: onceReport.chrome.pass === true,
      payChrome: payReport.chrome.pass === true,
      passWallet: passStatus.topics.wallet?.state === "skipped-gate",
      cleanWallet: cleanStatus.topics.wallet?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixWallet: fixStatus.topics.wallet?.state === "applied",
      systemKept: /\bdata-wallet\b/.test(fixed) && />\s*Pass\s*</.test(fixed),
      markersGone: !/data-wl-decline/.test(fixed),
      importKept: fs.readFileSync(path.join(fixDir, "Pass.swift"), "utf8").includes("import PassKit"),
      holdUnchanged: held === origHold,
      holdWallet: holdStatus.topics.wallet?.state === "pending",
      holdStillPhrase: /don't ask them again/.test(held) && /\bdata-wallet\b/.test(held),
      holdNotInvented: !/PKAddPassesViewController/.test(held),
      againUnchanged: again === origAgain,
      againWallet: againStatus.topics.wallet?.state === "pending",
      againKept: /Add again/.test(again) && /declined/.test(again),
      onceUnchanged: once === origOnce,
      onceWallet: onceStatus.topics.wallet?.state === "already-compliant",
      onceKept: /Add to Wallet/.test(once) && /camera access/.test(once),
      payWallet: payStatus.topics.wallet?.state === "skipped-gate",
      payMarkersRemain: /data-wl-decline/.test(paid),
      payButtonKept: fs.readFileSync(path.join(payDir, "Pay.swift"), "utf8").includes("PKPaymentButton"),
      payPayLaunched:
        payStatus.topics["apple-pay"]?.state !== "skipped-gate" &&
        payStatus.topics["apple-pay"]?.state !== "skipped-no-affordance",
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passWallet: passStatus.topics.wallet?.state,
      cleanWallet: cleanStatus.topics.wallet?.state,
      fixWallet: fixStatus.topics.wallet?.state,
      holdWallet: holdStatus.topics.wallet?.state,
      againWallet: againStatus.topics.wallet?.state,
      onceWallet: onceStatus.topics.wallet?.state,
      payWallet: payStatus.topics.wallet?.state,
      payPay: payStatus.topics["apple-pay"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-wallet-decline-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sz-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sz-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sz-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sz-hold-"));
  const listenDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sz-listen-"));
  const stopDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sz-stop-"));
  const optDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sz-opt-"));
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sz-bare-"));
  const dirs = [passDir, cleanDir, fixDir, holdDir, listenDir, stopDir, optDir, bareDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const writeImport = (dir) => {
      fs.writeFileSync(path.join(dir, "Listen.swift"), "import ShazamKit\n");
    };
    writeImport(cleanDir);
    writeImport(fixDir);
    writeImport(holdDir);
    writeImport(listenDir);
    writeImport(stopDir);
    writeImport(optDir);
    fs.writeFileSync(path.join(bareDir, "Model.swift"), "import CoreML\n");
    const marked = `export function HostWidgets() {
  return (
    <div data-shazam data-sz-mic>
      <button type="button">Match</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(bareDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div data-shazam>
      <p>They don't expect the microphone to stay on.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origListen = `export function HostWidgets() {
  return (
    <div data-shazam>
      session.match(signature)
      audioEngine.start()
    </div>
  );
}
`;
    fs.writeFileSync(path.join(listenDir, "HostWidgets.tsx"), origListen);
    const origStop = `export function HostWidgets() {
  return (
    <div data-shazam>
      session.match(signature)
      audioEngine.start()
      audioEngine.stop()
    </div>
  );
}
`;
    fs.writeFileSync(path.join(stopDir, "HostWidgets.tsx"), origStop);
    const origOpt = `export function HostWidgets() {
  return (
    <div data-shazam>
      session.match(signature)
      audioEngine.start()
      audioEngine.stop()
      <p>Let people opt in to storing recognized songs.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(optDir, "HostWidgets.tsx"), origOpt);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const cleanReport = run(cleanDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const listenReport = run(listenDir);
    const stopReport = run(stopDir);
    const optReport = run(optDir);
    const bareReport = run(bareDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const cleanStatus = readStatus(cleanDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const listenStatus = readStatus(listenDir);
    const stopStatus = readStatus(stopDir);
    const optStatus = readStatus(optDir);
    const bareStatus = readStatus(bareDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const listened = fs.readFileSync(path.join(listenDir, "HostWidgets.tsx"), "utf8");
    const stopped = fs.readFileSync(path.join(stopDir, "HostWidgets.tsx"), "utf8");
    const opted = fs.readFileSync(path.join(optDir, "HostWidgets.tsx"), "utf8");
    const bared = fs.readFileSync(path.join(bareDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      cleanChrome: cleanReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      listenChrome: listenReport.chrome.pass === true,
      stopChrome: stopReport.chrome.pass === true,
      optChrome: optReport.chrome.pass === true,
      bareChrome: bareReport.chrome.pass === true,
      passShazam: passStatus.topics.shazamkit?.state === "skipped-gate",
      cleanShazam: cleanStatus.topics.shazamkit?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixShazam: fixStatus.topics.shazamkit?.state === "applied",
      systemKept: /\bdata-shazam\b/.test(fixed) && />\s*Match\s*</.test(fixed),
      markersGone: !/data-sz-mic/.test(fixed),
      importKept: fs.readFileSync(path.join(fixDir, "Listen.swift"), "utf8").includes("import ShazamKit"),
      holdUnchanged: held === origHold,
      holdShazam: holdStatus.topics.shazamkit?.state === "pending",
      holdStillPhrase: /microphone to stay on/.test(held) && /\bdata-shazam\b/.test(held),
      holdNotInvented: !/audioEngine\.stop|requestRecordPermission/.test(held),
      listenUnchanged: listened === origListen,
      listenShazam: listenStatus.topics.shazamkit?.state === "pending",
      listenKept: /audioEngine\.start\(\)/.test(listened) && !/audioEngine\.stop\(\)/.test(listened),
      stopUnchanged: stopped === origStop,
      stopShazam: stopStatus.topics.shazamkit?.state === "already-compliant",
      stopKept: /audioEngine\.stop\(\)/.test(stopped),
      optUnchanged: opted === origOpt,
      optShazam: optStatus.topics.shazamkit?.state === "already-compliant",
      optKept: /opt in to storing recognized songs/.test(opted),
      bareShazam: bareStatus.topics.shazamkit?.state === "skipped-gate",
      bareMarkersRemain: /data-sz-mic/.test(bared),
      coremlKept: fs.readFileSync(path.join(bareDir, "Model.swift"), "utf8").includes("import CoreML"),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passShazam: passStatus.topics.shazamkit?.state,
      cleanShazam: cleanStatus.topics.shazamkit?.state,
      fixShazam: fixStatus.topics.shazamkit?.state,
      holdShazam: holdStatus.topics.shazamkit?.state,
      listenShazam: listenStatus.topics.shazamkit?.state,
      stopShazam: stopStatus.topics.shazamkit?.state,
      optShazam: optStatus.topics.shazamkit?.state,
      bareShazam: bareStatus.topics.shazamkit?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-shazam-mic-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-px-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-px-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-px-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-px-hold-"));
  const badDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-px-bad-"));
  const noneDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-px-none-"));
  const confirmDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-px-confirm-"));
  const toolbarDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-px-toolbar-"));
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-px-bare-"));
  const dirs = [passDir, cleanDir, fixDir, holdDir, badDir, noneDir, confirmDir, toolbarDir, bareDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const writeImport = (dir) => {
      fs.writeFileSync(path.join(dir, "Edit.swift"), "import PhotosUI\n");
    };
    writeImport(cleanDir);
    writeImport(fixDir);
    writeImport(holdDir);
    writeImport(badDir);
    writeImport(noneDir);
    writeImport(confirmDir);
    writeImport(toolbarDir);
    fs.writeFileSync(path.join(bareDir, "Listen.swift"), "import ShazamKit\n");
    const marked = `export function HostWidgets() {
  return (
    <div data-photo-edit data-px-cancel>
      <button type="button">Edit</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(bareDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div data-photo-edit>
      <p>Don't immediately discard their changes.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origBad = `export function HostWidgets() {
  return (
    <div data-photo-edit>
      {hasEdits ? <button onClick={discard}>Cancel</button> : null}
    </div>
  );
}
`;
    fs.writeFileSync(path.join(badDir, "HostWidgets.tsx"), origBad);
    const origNone = `export function HostWidgets() {
  return (
    <div data-photo-edit>
      <button onClick={discard}>Cancel</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(noneDir, "HostWidgets.tsx"), origNone);
    const origConfirm = `export function HostWidgets() {
  return (
    <div data-photo-edit>
      {hasEdits ? <p>Confirm cancel. Edits will be lost.</p> : null}
    </div>
  );
}
`;
    fs.writeFileSync(path.join(confirmDir, "HostWidgets.tsx"), origConfirm);
    const origToolbar = `export function HostWidgets() {
  return (
    <div data-photo-edit>
      <p>Don't provide a custom top toolbar.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(toolbarDir, "HostWidgets.tsx"), origToolbar);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const cleanReport = run(cleanDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const badReport = run(badDir);
    const noneReport = run(noneDir);
    const confirmReport = run(confirmDir);
    const toolbarReport = run(toolbarDir);
    const bareReport = run(bareDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const cleanStatus = readStatus(cleanDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const badStatus = readStatus(badDir);
    const noneStatus = readStatus(noneDir);
    const confirmStatus = readStatus(confirmDir);
    const toolbarStatus = readStatus(toolbarDir);
    const bareStatus = readStatus(bareDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const bad = fs.readFileSync(path.join(badDir, "HostWidgets.tsx"), "utf8");
    const none = fs.readFileSync(path.join(noneDir, "HostWidgets.tsx"), "utf8");
    const confirmed = fs.readFileSync(path.join(confirmDir, "HostWidgets.tsx"), "utf8");
    const tooled = fs.readFileSync(path.join(toolbarDir, "HostWidgets.tsx"), "utf8");
    const bared = fs.readFileSync(path.join(bareDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      cleanChrome: cleanReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      badChrome: badReport.chrome.pass === true,
      noneChrome: noneReport.chrome.pass === true,
      confirmChrome: confirmReport.chrome.pass === true,
      toolbarChrome: toolbarReport.chrome.pass === true,
      bareChrome: bareReport.chrome.pass === true,
      passPhoto: passStatus.topics["photo-editing"]?.state === "skipped-gate",
      cleanPhoto: cleanStatus.topics["photo-editing"]?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixPhoto: fixStatus.topics["photo-editing"]?.state === "applied",
      systemKept: /\bdata-photo-edit\b/.test(fixed) && />\s*Edit\s*</.test(fixed),
      markersGone: !/data-px-cancel/.test(fixed),
      importKept: fs.readFileSync(path.join(fixDir, "Edit.swift"), "utf8").includes("import PhotosUI"),
      holdUnchanged: held === origHold,
      holdPhoto: holdStatus.topics["photo-editing"]?.state === "pending",
      holdStillPhrase: /immediately discard their changes/.test(held) && /\bdata-photo-edit\b/.test(held),
      holdNotInvented: !/PHContentEditingController|<dialog\b/i.test(held),
      badUnchanged: bad === origBad,
      badPhoto: badStatus.topics["photo-editing"]?.state === "pending",
      badKept: /hasEdits/.test(bad) && /discard/.test(bad) && />\s*Cancel\s*</.test(bad),
      noneUnchanged: none === origNone,
      nonePhoto: noneStatus.topics["photo-editing"]?.state === "already-compliant",
      confirmUnchanged: confirmed === origConfirm,
      confirmPhoto: confirmStatus.topics["photo-editing"]?.state === "already-compliant",
      confirmKept: /Edits will be lost/.test(confirmed),
      toolbarUnchanged: tooled === origToolbar,
      toolbarPhoto: toolbarStatus.topics["photo-editing"]?.state === "already-compliant",
      toolbarKept: /custom top toolbar/.test(tooled),
      barePhoto: bareStatus.topics["photo-editing"]?.state === "skipped-gate",
      bareMarkersRemain: /data-px-cancel/.test(bared),
      shazamKept: fs.readFileSync(path.join(bareDir, "Listen.swift"), "utf8").includes("import ShazamKit"),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passPhoto: passStatus.topics["photo-editing"]?.state,
      cleanPhoto: cleanStatus.topics["photo-editing"]?.state,
      fixPhoto: fixStatus.topics["photo-editing"]?.state,
      holdPhoto: holdStatus.topics["photo-editing"]?.state,
      badPhoto: badStatus.topics["photo-editing"]?.state,
      nonePhoto: noneStatus.topics["photo-editing"]?.state,
      confirmPhoto: confirmStatus.topics["photo-editing"]?.state,
      toolbarPhoto: toolbarStatus.topics["photo-editing"]?.state,
      barePhoto: bareStatus.topics["photo-editing"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-photo-cancel-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wls-pass-"));
  const cleanDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wls-clean-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wls-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wls-hold-"));
  const logoDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wls-logo-"));
  const pageDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wls-page-"));
  const padDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wls-pad-"));
  const stripDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wls-strip-"));
  const payDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-wls-pay-"));
  const dirs = [passDir, cleanDir, fixDir, holdDir, logoDir, pageDir, padDir, stripDir, payDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const writePassKit = (dir) => {
      fs.writeFileSync(path.join(dir, "Pass.swift"), "import PassKit\nlet library = PKPassLibrary()\n");
    };
    writePassKit(cleanDir);
    writePassKit(fixDir);
    writePassKit(holdDir);
    writePassKit(logoDir);
    writePassKit(pageDir);
    writePassKit(padDir);
    writePassKit(stripDir);
    fs.writeFileSync(path.join(payDir, "Pay.swift"), "let button = PKPaymentButton()\n");
    const marked = `export function HostWidgets() {
  return (
    <div data-wallet data-wl-shadow>
      <button type="button">Pass</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    fs.writeFileSync(path.join(payDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div data-wallet>
      <p>Avoid inner drop shadows on logo artwork.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origLogo = `export function HostWidgets() {
  return (
    <div data-wallet>
      <img alt="logo" style="box-shadow: inset 0 2px 4px #000" src="logo.png" />
    </div>
  );
}
`;
    fs.writeFileSync(path.join(logoDir, "HostWidgets.tsx"), origLogo);
    const origPage = `export function HostWidgets() {
  return (
    <div data-wallet style="box-shadow: inset 0 1px 2px #000">
      <img alt="logo" src="logo.png" />
    </div>
  );
}
`;
    fs.writeFileSync(path.join(pageDir, "HostWidgets.tsx"), origPage);
    const origPad = `export function HostWidgets() {
  return (
    <div data-wallet>
      <img alt="logo" style="padding: 8px" src="logo.png" />
    </div>
  );
}
`;
    fs.writeFileSync(path.join(padDir, "HostWidgets.tsx"), origPad);
    const origStrip = `export function HostWidgets() {
  return (
    <div data-wallet>
      <p>Avoid embedding text in the strip image.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(stripDir, "HostWidgets.tsx"), origStrip);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const cleanReport = run(cleanDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const logoReport = run(logoDir);
    const pageReport = run(pageDir);
    const padReport = run(padDir);
    const stripReport = run(stripDir);
    const payReport = run(payDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const cleanStatus = readStatus(cleanDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const logoStatus = readStatus(logoDir);
    const pageStatus = readStatus(pageDir);
    const padStatus = readStatus(padDir);
    const stripStatus = readStatus(stripDir);
    const payStatus = readStatus(payDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const logo = fs.readFileSync(path.join(logoDir, "HostWidgets.tsx"), "utf8");
    const page = fs.readFileSync(path.join(pageDir, "HostWidgets.tsx"), "utf8");
    const pad = fs.readFileSync(path.join(padDir, "HostWidgets.tsx"), "utf8");
    const strip = fs.readFileSync(path.join(stripDir, "HostWidgets.tsx"), "utf8");
    const paid = fs.readFileSync(path.join(payDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      cleanChrome: cleanReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      logoChrome: logoReport.chrome.pass === true,
      pageChrome: pageReport.chrome.pass === true,
      padChrome: padReport.chrome.pass === true,
      stripChrome: stripReport.chrome.pass === true,
      payChrome: payReport.chrome.pass === true,
      passWallet: passStatus.topics.wallet?.state === "skipped-gate",
      cleanWallet: cleanStatus.topics.wallet?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixWallet: fixStatus.topics.wallet?.state === "applied",
      systemKept: /\bdata-wallet\b/.test(fixed) && />\s*Pass\s*</.test(fixed),
      markersGone: !/data-wl-shadow/.test(fixed),
      importKept: fs.readFileSync(path.join(fixDir, "Pass.swift"), "utf8").includes("import PassKit"),
      holdUnchanged: held === origHold,
      holdWallet: holdStatus.topics.wallet?.state === "pending",
      holdStillPhrase: /inner drop shadows on logo artwork/.test(held) && /\bdata-wallet\b/.test(held),
      holdNotInvented: !/<img\b/.test(held),
      logoUnchanged: logo === origLogo,
      logoWallet: logoStatus.topics.wallet?.state === "pending",
      logoKept: /box-shadow: inset/.test(logo) && /alt="logo"/.test(logo),
      pageUnchanged: page === origPage,
      pageWallet: pageStatus.topics.wallet?.state === "already-compliant",
      pageKept: /box-shadow: inset/.test(page) && /alt="logo"/.test(page),
      padUnchanged: pad === origPad,
      padWallet: padStatus.topics.wallet?.state === "already-compliant",
      padKept: /padding: 8px/.test(pad),
      stripUnchanged: strip === origStrip,
      stripWallet: stripStatus.topics.wallet?.state === "already-compliant",
      stripKept: /strip image/.test(strip),
      payWallet: payStatus.topics.wallet?.state === "skipped-gate",
      payMarkersRemain: /data-wl-shadow/.test(paid),
      payButtonKept: fs.readFileSync(path.join(payDir, "Pay.swift"), "utf8").includes("PKPaymentButton"),
      payPayLaunched:
        payStatus.topics["apple-pay"]?.state !== "skipped-gate" &&
        payStatus.topics["apple-pay"]?.state !== "skipped-no-affordance",
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passWallet: passStatus.topics.wallet?.state,
      cleanWallet: cleanStatus.topics.wallet?.state,
      fixWallet: fixStatus.topics.wallet?.state,
      holdWallet: holdStatus.topics.wallet?.state,
      logoWallet: logoStatus.topics.wallet?.state,
      pageWallet: pageStatus.topics.wallet?.state,
      padWallet: padStatus.topics.wallet?.state,
      stripWallet: stripStatus.topics.wallet?.state,
      payWallet: payStatus.topics.wallet?.state,
      payPay: payStatus.topics["apple-pay"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-wallet-logo-shadow-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntb-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntb-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntb-hold-"));
  const weatherDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntb-weather-"));
  const unreadDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntb-unread-"));
  const labelDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntb-label-"));
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntb-bare-"));
  const dirs = [passDir, fixDir, holdDir, weatherDir, unreadDir, labelDir, bareDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  return (
    <div data-nt-badge>
      <button type="button">Notify</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  return (
    <div>
      <p>Don't use a badge to convey numeric information that isn't related to notifications.</p>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origWeather = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  applicationIconBadgeNumber = temperature
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(weatherDir, "HostWidgets.tsx"), origWeather);
    const origUnread = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  applicationIconBadgeNumber = unread
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(unreadDir, "HostWidgets.tsx"), origUnread);
    const origLabel = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  return (
    <p>Don't include your app name in the button label.</p>
  );
}
`;
    fs.writeFileSync(path.join(labelDir, "HostWidgets.tsx"), origLabel);
    const origBare = `export function HostWidgets() {
  applicationIconBadgeNumber = temperature
  return <div data-nt-badge></div>;
}
`;
    fs.writeFileSync(path.join(bareDir, "HostWidgets.tsx"), origBare);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const weatherReport = run(weatherDir);
    const unreadReport = run(unreadDir);
    const labelReport = run(labelDir);
    const bareReport = run(bareDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const weatherStatus = readStatus(weatherDir);
    const unreadStatus = readStatus(unreadDir);
    const labelStatus = readStatus(labelDir);
    const bareStatus = readStatus(bareDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const weather = fs.readFileSync(path.join(weatherDir, "HostWidgets.tsx"), "utf8");
    const unread = fs.readFileSync(path.join(unreadDir, "HostWidgets.tsx"), "utf8");
    const labeled = fs.readFileSync(path.join(labelDir, "HostWidgets.tsx"), "utf8");
    const bared = fs.readFileSync(path.join(bareDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      weatherChrome: weatherReport.chrome.pass === true,
      unreadChrome: unreadReport.chrome.pass === true,
      labelChrome: labelReport.chrome.pass === true,
      bareChrome: bareReport.chrome.pass === true,
      passNotes: passStatus.topics.notifications?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixNotes: fixStatus.topics.notifications?.state === "applied",
      systemKept: /\bUNUserNotificationCenter\b/.test(fixed) && />\s*Notify\s*</.test(fixed),
      markersGone: !/data-nt-badge/.test(fixed),
      holdUnchanged: held === origHold,
      holdNotes: holdStatus.topics.notifications?.state === "pending",
      holdStillPhrase: /numeric information that isn't related to notifications/.test(held),
      holdNotInvented: !/setBadgeCount|applicationIconBadgeNumber/.test(held),
      weatherUnchanged: weather === origWeather,
      weatherNotes: weatherStatus.topics.notifications?.state === "pending",
      weatherKept: /applicationIconBadgeNumber = temperature/.test(weather),
      unreadUnchanged: unread === origUnread,
      unreadNotes: unreadStatus.topics.notifications?.state === "already-compliant",
      unreadKept: /applicationIconBadgeNumber = unread/.test(unread),
      labelUnchanged: labeled === origLabel,
      labelNotes: labelStatus.topics.notifications?.state === "pending",
      labelKept: /app name in the button label/.test(labeled),
      bareNotes: bareStatus.topics.notifications?.state === "skipped-no-affordance",
      bareMarkersRemain: /data-nt-badge/.test(bared),
      bareCountKept: /applicationIconBadgeNumber = temperature/.test(bared),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passNotes: passStatus.topics.notifications?.state,
      fixNotes: fixStatus.topics.notifications?.state,
      holdNotes: holdStatus.topics.notifications?.state,
      weatherNotes: weatherStatus.topics.notifications?.state,
      unreadNotes: unreadStatus.topics.notifications?.state,
      labelNotes: labelStatus.topics.notifications?.state,
      bareNotes: bareStatus.topics.notifications?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-notification-badge-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntl-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntl-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntl-hold-"));
  const namedDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntl-named-"));
  const snoozeDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntl-snooze-"));
  const unnamedDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntl-unnamed-"));
  const shortDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntl-short-"));
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntl-bare-"));
  const dirs = [passDir, fixDir, holdDir, namedDir, snoozeDir, unnamedDir, shortDir, bareDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  return (
    <div data-nt-label>
      <button type="button">Notify</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  return (
    <p>Don't include your app name in the button label.</p>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origNamed = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  const info = 'CFBundleDisplayName = "Acme"'
  UNNotificationAction(title: "Open Acme")
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(namedDir, "HostWidgets.tsx"), origNamed);
    const origSnooze = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  const info = 'CFBundleDisplayName = "Acme"'
  UNNotificationAction(title: "Snooze")
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(snoozeDir, "HostWidgets.tsx"), origSnooze);
    const origUnnamed = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  UNNotificationAction(title: "Open Acme")
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(unnamedDir, "HostWidgets.tsx"), origUnnamed);
    const origShort = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  const info = 'CFBundleDisplayName = "OK"'
  UNNotificationAction(title: "OK")
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(shortDir, "HostWidgets.tsx"), origShort);
    const origBare = `export function HostWidgets() {
  return <div data-nt-label></div>;
}
`;
    fs.writeFileSync(path.join(bareDir, "HostWidgets.tsx"), origBare);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const namedReport = run(namedDir);
    const snoozeReport = run(snoozeDir);
    const unnamedReport = run(unnamedDir);
    const shortReport = run(shortDir);
    const bareReport = run(bareDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const namedStatus = readStatus(namedDir);
    const snoozeStatus = readStatus(snoozeDir);
    const unnamedStatus = readStatus(unnamedDir);
    const shortStatus = readStatus(shortDir);
    const bareStatus = readStatus(bareDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const named = fs.readFileSync(path.join(namedDir, "HostWidgets.tsx"), "utf8");
    const snooze = fs.readFileSync(path.join(snoozeDir, "HostWidgets.tsx"), "utf8");
    const unnamed = fs.readFileSync(path.join(unnamedDir, "HostWidgets.tsx"), "utf8");
    const shortened = fs.readFileSync(path.join(shortDir, "HostWidgets.tsx"), "utf8");
    const bared = fs.readFileSync(path.join(bareDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      namedChrome: namedReport.chrome.pass === true,
      snoozeChrome: snoozeReport.chrome.pass === true,
      unnamedChrome: unnamedReport.chrome.pass === true,
      shortChrome: shortReport.chrome.pass === true,
      bareChrome: bareReport.chrome.pass === true,
      passNotes: passStatus.topics.notifications?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixNotes: fixStatus.topics.notifications?.state === "applied",
      systemKept: /\bUNUserNotificationCenter\b/.test(fixed) && />\s*Notify\s*</.test(fixed),
      markersGone: !/data-nt-label/.test(fixed),
      holdUnchanged: held === origHold,
      holdNotes: holdStatus.topics.notifications?.state === "pending",
      holdStillPhrase: /include your app name in the button label/.test(held),
      holdNotInvented: !/UNNotificationAction/.test(held),
      namedUnchanged: named === origNamed,
      namedNotes: namedStatus.topics.notifications?.state === "pending",
      namedKept: /title: "Open Acme"/.test(named) && /CFBundleDisplayName = "Acme"/.test(named),
      snoozeUnchanged: snooze === origSnooze,
      snoozeNotes: snoozeStatus.topics.notifications?.state === "already-compliant",
      snoozeKept: /title: "Snooze"/.test(snooze),
      unnamedUnchanged: unnamed === origUnnamed,
      unnamedNotes: unnamedStatus.topics.notifications?.state === "already-compliant",
      unnamedKept: /title: "Open Acme"/.test(unnamed),
      shortUnchanged: shortened === origShort,
      shortNotes: shortStatus.topics.notifications?.state === "already-compliant",
      shortKept: /CFBundleDisplayName = "OK"/.test(shortened),
      bareNotes: bareStatus.topics.notifications?.state === "skipped-no-affordance",
      bareMarkersRemain: /data-nt-label/.test(bared),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passNotes: passStatus.topics.notifications?.state,
      fixNotes: fixStatus.topics.notifications?.state,
      holdNotes: holdStatus.topics.notifications?.state,
      namedNotes: namedStatus.topics.notifications?.state,
      snoozeNotes: snoozeStatus.topics.notifications?.state,
      unnamedNotes: unnamedStatus.topics.notifications?.state,
      shortNotes: shortStatus.topics.notifications?.state,
      bareNotes: bareStatus.topics.notifications?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-notification-label-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nto-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nto-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nto-hold-"));
  const openDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nto-open-"));
  const snoozeDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nto-snooze-"));
  const acmeDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nto-acme-"));
  const namedDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nto-named-"));
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-nto-bare-"));
  const dirs = [passDir, fixDir, holdDir, openDir, snoozeDir, acmeDir, namedDir, bareDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  return (
    <div data-nt-open>
      <button type="button">Notify</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  return (
    <p>Avoid providing an action that merely opens your app.</p>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origOpen = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  UNNotificationAction(title: "Open")
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(openDir, "HostWidgets.tsx"), origOpen);
    const origSnooze = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  UNNotificationAction(title: "Snooze")
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(snoozeDir, "HostWidgets.tsx"), origSnooze);
    const origAcme = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  UNNotificationAction(title: "Open Acme")
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(acmeDir, "HostWidgets.tsx"), origAcme);
    const origNamed = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  const info = 'CFBundleDisplayName = "Acme"'
  UNNotificationAction(title: "Open Acme")
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(namedDir, "HostWidgets.tsx"), origNamed);
    const origBare = `export function HostWidgets() {
  return <div data-nt-open></div>;
}
`;
    fs.writeFileSync(path.join(bareDir, "HostWidgets.tsx"), origBare);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const openReport = run(openDir);
    const snoozeReport = run(snoozeDir);
    const acmeReport = run(acmeDir);
    const namedReport = run(namedDir);
    const bareReport = run(bareDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const openStatus = readStatus(openDir);
    const snoozeStatus = readStatus(snoozeDir);
    const acmeStatus = readStatus(acmeDir);
    const namedStatus = readStatus(namedDir);
    const bareStatus = readStatus(bareDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const opened = fs.readFileSync(path.join(openDir, "HostWidgets.tsx"), "utf8");
    const snooze = fs.readFileSync(path.join(snoozeDir, "HostWidgets.tsx"), "utf8");
    const acme = fs.readFileSync(path.join(acmeDir, "HostWidgets.tsx"), "utf8");
    const named = fs.readFileSync(path.join(namedDir, "HostWidgets.tsx"), "utf8");
    const bared = fs.readFileSync(path.join(bareDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      openChrome: openReport.chrome.pass === true,
      snoozeChrome: snoozeReport.chrome.pass === true,
      acmeChrome: acmeReport.chrome.pass === true,
      namedChrome: namedReport.chrome.pass === true,
      bareChrome: bareReport.chrome.pass === true,
      passNotes: passStatus.topics.notifications?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixNotes: fixStatus.topics.notifications?.state === "applied",
      systemKept: /\bUNUserNotificationCenter\b/.test(fixed) && />\s*Notify\s*</.test(fixed),
      markersGone: !/data-nt-open/.test(fixed),
      holdUnchanged: held === origHold,
      holdNotes: holdStatus.topics.notifications?.state === "pending",
      holdStillPhrase: /action that merely opens your app/.test(held),
      holdNotInvented: !/UNNotificationAction/.test(held),
      openUnchanged: opened === origOpen,
      openNotes: openStatus.topics.notifications?.state === "pending",
      openKept: /title: "Open"/.test(opened),
      snoozeUnchanged: snooze === origSnooze,
      snoozeNotes: snoozeStatus.topics.notifications?.state === "already-compliant",
      snoozeKept: /title: "Snooze"/.test(snooze),
      acmeUnchanged: acme === origAcme,
      acmeNotes: acmeStatus.topics.notifications?.state === "already-compliant",
      acmeKept: /title: "Open Acme"/.test(acme),
      namedUnchanged: named === origNamed,
      namedNotes: namedStatus.topics.notifications?.state === "pending",
      namedKept: /title: "Open Acme"/.test(named) && /CFBundleDisplayName = "Acme"/.test(named),
      bareNotes: bareStatus.topics.notifications?.state === "skipped-no-affordance",
      bareMarkersRemain: /data-nt-open/.test(bared),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passNotes: passStatus.topics.notifications?.state,
      fixNotes: fixStatus.topics.notifications?.state,
      holdNotes: holdStatus.topics.notifications?.state,
      openNotes: openStatus.topics.notifications?.state,
      snoozeNotes: snoozeStatus.topics.notifications?.state,
      acmeNotes: acmeStatus.topics.notifications?.state,
      namedNotes: namedStatus.topics.notifications?.state,
      bareNotes: bareStatus.topics.notifications?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-notification-open-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntc-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntc-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntc-hold-"));
  const namedDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntc-named-"));
  const freshDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntc-fresh-"));
  const unnamedDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntc-unnamed-"));
  const actionDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntc-action-"));
  const iconDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntc-icon-"));
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ntc-bare-"));
  const dirs = [passDir, fixDir, holdDir, namedDir, freshDir, unnamedDir, actionDir, iconDir, bareDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  return (
    <div data-nt-content>
      <button type="button">Notify</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  return (
    <p>Avoid including your app name or icon.</p>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origNamed = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  const info = 'CFBundleDisplayName = "Acme"'
  content.title = "Acme shipped"
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(namedDir, "HostWidgets.tsx"), origNamed);
    const origFresh = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  const info = 'CFBundleDisplayName = "Acme"'
  content.title = "New message"
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(freshDir, "HostWidgets.tsx"), origFresh);
    const origUnnamed = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  content.title = "Acme shipped"
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(unnamedDir, "HostWidgets.tsx"), origUnnamed);
    const origAction = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  const info = 'CFBundleDisplayName = "Acme"'
  UNNotificationAction(title: "Open Acme")
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(actionDir, "HostWidgets.tsx"), origAction);
    const origIcon = `export function HostWidgets() {
  UNUserNotificationCenter.current()
  const info = 'CFBundleDisplayName = "Acme"'
  content.title = "New message"
  UNNotificationAttachment(url: "AppIcon.png")
  return <button type="button">Notify</button>;
}
`;
    fs.writeFileSync(path.join(iconDir, "HostWidgets.tsx"), origIcon);
    const origBare = `export function HostWidgets() {
  return <div data-nt-content></div>;
}
`;
    fs.writeFileSync(path.join(bareDir, "HostWidgets.tsx"), origBare);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const namedReport = run(namedDir);
    const freshReport = run(freshDir);
    const unnamedReport = run(unnamedDir);
    const actionReport = run(actionDir);
    const iconReport = run(iconDir);
    const bareReport = run(bareDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const namedStatus = readStatus(namedDir);
    const freshStatus = readStatus(freshDir);
    const unnamedStatus = readStatus(unnamedDir);
    const actionStatus = readStatus(actionDir);
    const iconStatus = readStatus(iconDir);
    const bareStatus = readStatus(bareDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const named = fs.readFileSync(path.join(namedDir, "HostWidgets.tsx"), "utf8");
    const fresh = fs.readFileSync(path.join(freshDir, "HostWidgets.tsx"), "utf8");
    const unnamed = fs.readFileSync(path.join(unnamedDir, "HostWidgets.tsx"), "utf8");
    const action = fs.readFileSync(path.join(actionDir, "HostWidgets.tsx"), "utf8");
    const icon = fs.readFileSync(path.join(iconDir, "HostWidgets.tsx"), "utf8");
    const bared = fs.readFileSync(path.join(bareDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      namedChrome: namedReport.chrome.pass === true,
      freshChrome: freshReport.chrome.pass === true,
      unnamedChrome: unnamedReport.chrome.pass === true,
      actionChrome: actionReport.chrome.pass === true,
      iconChrome: iconReport.chrome.pass === true,
      bareChrome: bareReport.chrome.pass === true,
      passNotes: passStatus.topics.notifications?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixNotes: fixStatus.topics.notifications?.state === "applied",
      systemKept: /\bUNUserNotificationCenter\b/.test(fixed) && />\s*Notify\s*</.test(fixed),
      markersGone: !/data-nt-content/.test(fixed),
      holdUnchanged: held === origHold,
      holdNotes: holdStatus.topics.notifications?.state === "pending",
      holdStillPhrase: /app name or icon/.test(held),
      holdNotInvented: !/content\.title/.test(held),
      namedUnchanged: named === origNamed,
      namedNotes: namedStatus.topics.notifications?.state === "pending",
      namedKept: /content\.title = "Acme shipped"/.test(named),
      freshUnchanged: fresh === origFresh,
      freshNotes: freshStatus.topics.notifications?.state === "already-compliant",
      freshKept: /content\.title = "New message"/.test(fresh),
      unnamedUnchanged: unnamed === origUnnamed,
      unnamedNotes: unnamedStatus.topics.notifications?.state === "already-compliant",
      unnamedKept: /content\.title = "Acme shipped"/.test(unnamed),
      actionUnchanged: action === origAction,
      actionNotes: actionStatus.topics.notifications?.state === "pending",
      actionKept: /title: "Open Acme"/.test(action),
      iconUnchanged: icon === origIcon,
      iconNotes: iconStatus.topics.notifications?.state === "already-compliant",
      iconKept: /AppIcon\.png/.test(icon) && /New message/.test(icon),
      bareNotes: bareStatus.topics.notifications?.state === "skipped-no-affordance",
      bareMarkersRemain: /data-nt-content/.test(bared),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passNotes: passStatus.topics.notifications?.state,
      fixNotes: fixStatus.topics.notifications?.state,
      holdNotes: holdStatus.topics.notifications?.state,
      namedNotes: namedStatus.topics.notifications?.state,
      freshNotes: freshStatus.topics.notifications?.state,
      unnamedNotes: unnamedStatus.topics.notifications?.state,
      actionNotes: actionStatus.topics.notifications?.state,
      iconNotes: iconStatus.topics.notifications?.state,
      bareNotes: bareStatus.topics.notifications?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-notification-content-name-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pva-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pva-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pva-hold-"));
  const allowDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pva-allow-"));
  const coinsDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pva-coins-"));
  const nextDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pva-next-"));
  const cameraDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pva-camera-"));
  const wordsDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pva-words-"));
  const dirs = [passDir, fixDir, holdDir, allowDir, coinsDir, nextDir, cameraDir, wordsDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <div data-pv-att>
      <button type="button">Next</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  requestTrackingAuthorization()
  return (
    <p>Never precede the system-provided alert with a custom screen that could confuse or mislead people.</p>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origAllow = `export function HostWidgets() {
  requestTrackingAuthorization()
  return <button type="button">Allow</button>;
}
`;
    fs.writeFileSync(path.join(allowDir, "HostWidgets.tsx"), origAllow);
    const origCoins = `export function HostWidgets() {
  requestTrackingAuthorization()
  return <p>Earn coins if you share this.</p>;
}
`;
    fs.writeFileSync(path.join(coinsDir, "HostWidgets.tsx"), origCoins);
    const origNext = `export function HostWidgets() {
  requestTrackingAuthorization()
  return <button type="button">Continue</button>;
}
`;
    fs.writeFileSync(path.join(nextDir, "HostWidgets.tsx"), origNext);
    const origCamera = `export function HostWidgets() {
  navigator.mediaDevices.getUserMedia({ video: true })
  return <button type="button">Allow</button>;
}
`;
    fs.writeFileSync(path.join(cameraDir, "HostWidgets.tsx"), origCamera);
    const origWords = `export function HostWidgets() {
  return (
    <p>Never precede the system-provided alert with a custom screen that could confuse or mislead people.</p>
  );
}
`;
    fs.writeFileSync(path.join(wordsDir, "HostWidgets.tsx"), origWords);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const allowReport = run(allowDir);
    const coinsReport = run(coinsDir);
    const nextReport = run(nextDir);
    const cameraReport = run(cameraDir);
    const wordsReport = run(wordsDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const allowStatus = readStatus(allowDir);
    const coinsStatus = readStatus(coinsDir);
    const nextStatus = readStatus(nextDir);
    const cameraStatus = readStatus(cameraDir);
    const wordsStatus = readStatus(wordsDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const allowed = fs.readFileSync(path.join(allowDir, "HostWidgets.tsx"), "utf8");
    const coins = fs.readFileSync(path.join(coinsDir, "HostWidgets.tsx"), "utf8");
    const next = fs.readFileSync(path.join(nextDir, "HostWidgets.tsx"), "utf8");
    const camera = fs.readFileSync(path.join(cameraDir, "HostWidgets.tsx"), "utf8");
    const words = fs.readFileSync(path.join(wordsDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      allowChrome: allowReport.chrome.pass === true,
      coinsChrome: coinsReport.chrome.pass === true,
      nextChrome: nextReport.chrome.pass === true,
      cameraChrome: cameraReport.chrome.pass === true,
      wordsChrome: wordsReport.chrome.pass === true,
      passPrivacy: passStatus.topics.privacy?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixPrivacy: fixStatus.topics.privacy?.state === "applied",
      systemKept: />\s*Next\s*</.test(fixed),
      markersGone: !/data-pv-att/.test(fixed),
      holdUnchanged: held === origHold,
      holdPrivacy: holdStatus.topics.privacy?.state === "pending",
      holdStillPhrase: /custom screen that could confuse or mislead/.test(held),
      holdNotInvented: !/<button\b/.test(held),
      allowUnchanged: allowed === origAllow,
      allowPrivacy: allowStatus.topics.privacy?.state === "pending",
      allowKept: />\s*Allow\s*</.test(allowed) && /requestTrackingAuthorization/.test(allowed),
      coinsUnchanged: coins === origCoins,
      coinsPrivacy: coinsStatus.topics.privacy?.state === "pending",
      coinsKept: /Earn coins/.test(coins),
      nextUnchanged: next === origNext,
      nextPrivacy: nextStatus.topics.privacy?.state === "already-compliant",
      nextKept: />\s*Continue\s*</.test(next),
      cameraUnchanged: camera === origCamera,
      cameraPrivacy: cameraStatus.topics.privacy?.state === "already-compliant",
      cameraKept: /getUserMedia/.test(camera) && />\s*Allow\s*</.test(camera),
      wordsUnchanged: words === origWords,
      wordsPrivacy: wordsStatus.topics.privacy?.state === "already-compliant",
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passPrivacy: passStatus.topics.privacy?.state,
      fixPrivacy: fixStatus.topics.privacy?.state,
      holdPrivacy: holdStatus.topics.privacy?.state,
      allowPrivacy: allowStatus.topics.privacy?.state,
      coinsPrivacy: coinsStatus.topics.privacy?.state,
      nextPrivacy: nextStatus.topics.privacy?.state,
      cameraPrivacy: cameraStatus.topics.privacy?.state,
      wordsPrivacy: wordsStatus.topics.privacy?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-tracking-prealert-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pvl-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pvl-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pvl-hold-"));
  const cancelDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pvl-cancel-"));
  const consentDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pvl-consent-"));
  const nextDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pvl-next-"));
  const cameraDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pvl-camera-"));
  const wordsDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pvl-words-"));
  const allowDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-pvl-allow-"));
  const dirs = [passDir, fixDir, holdDir, cancelDir, consentDir, nextDir, cameraDir, wordsDir, allowDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <div data-pv-leave>
      <button type="button">Close</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  requestTrackingAuthorization()
  return (
    <p>Don't include additional actions in your custom screen or window.</p>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origCancel = `export function HostWidgets() {
  requestTrackingAuthorization()
  return <button type="button">Cancel</button>;
}
`;
    fs.writeFileSync(path.join(cancelDir, "HostWidgets.tsx"), origCancel);
    const origConsent = `export function HostWidgets() {
  requestTrackingAuthorization()
  return (
    <div>
      <p>This step records legal consent.</p>
      <button type="button">Cancel</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(consentDir, "HostWidgets.tsx"), origConsent);
    const origNext = `export function HostWidgets() {
  requestTrackingAuthorization()
  return <button type="button">Continue</button>;
}
`;
    fs.writeFileSync(path.join(nextDir, "HostWidgets.tsx"), origNext);
    const origCamera = `export function HostWidgets() {
  navigator.mediaDevices.getUserMedia({ video: true })
  return <button type="button">Cancel</button>;
}
`;
    fs.writeFileSync(path.join(cameraDir, "HostWidgets.tsx"), origCamera);
    const origWords = `export function HostWidgets() {
  return (
    <p>Don't include additional actions in your custom screen or window.</p>
  );
}
`;
    fs.writeFileSync(path.join(wordsDir, "HostWidgets.tsx"), origWords);
    const origAllow = `export function HostWidgets() {
  requestTrackingAuthorization()
  return <button type="button">Allow</button>;
}
`;
    fs.writeFileSync(path.join(allowDir, "HostWidgets.tsx"), origAllow);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const cancelReport = run(cancelDir);
    const consentReport = run(consentDir);
    const nextReport = run(nextDir);
    const cameraReport = run(cameraDir);
    const wordsReport = run(wordsDir);
    const allowReport = run(allowDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const cancelStatus = readStatus(cancelDir);
    const consentStatus = readStatus(consentDir);
    const nextStatus = readStatus(nextDir);
    const cameraStatus = readStatus(cameraDir);
    const wordsStatus = readStatus(wordsDir);
    const allowStatus = readStatus(allowDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const canceled = fs.readFileSync(path.join(cancelDir, "HostWidgets.tsx"), "utf8");
    const consent = fs.readFileSync(path.join(consentDir, "HostWidgets.tsx"), "utf8");
    const next = fs.readFileSync(path.join(nextDir, "HostWidgets.tsx"), "utf8");
    const camera = fs.readFileSync(path.join(cameraDir, "HostWidgets.tsx"), "utf8");
    const words = fs.readFileSync(path.join(wordsDir, "HostWidgets.tsx"), "utf8");
    const allowed = fs.readFileSync(path.join(allowDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      cancelChrome: cancelReport.chrome.pass === true,
      consentChrome: consentReport.chrome.pass === true,
      nextChrome: nextReport.chrome.pass === true,
      cameraChrome: cameraReport.chrome.pass === true,
      wordsChrome: wordsReport.chrome.pass === true,
      allowChrome: allowReport.chrome.pass === true,
      passPrivacy: passStatus.topics.privacy?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixPrivacy: fixStatus.topics.privacy?.state === "applied",
      systemKept: />\s*Close\s*</.test(fixed),
      markersGone: !/data-pv-leave/.test(fixed),
      holdUnchanged: held === origHold,
      holdPrivacy: holdStatus.topics.privacy?.state === "pending",
      holdStillPhrase: /additional actions in your custom screen/.test(held),
      holdNotInvented: !/<button\b/.test(held),
      cancelUnchanged: canceled === origCancel,
      cancelPrivacy: cancelStatus.topics.privacy?.state === "pending",
      cancelKept: />\s*Cancel\s*</.test(canceled) && /requestTrackingAuthorization/.test(canceled),
      consentUnchanged: consent === origConsent,
      consentPrivacy: consentStatus.topics.privacy?.state === "already-compliant",
      consentKept: /legal consent/.test(consent) && />\s*Cancel\s*</.test(consent),
      nextUnchanged: next === origNext,
      nextPrivacy: nextStatus.topics.privacy?.state === "already-compliant",
      nextKept: />\s*Continue\s*</.test(next),
      cameraUnchanged: camera === origCamera,
      cameraPrivacy: cameraStatus.topics.privacy?.state === "already-compliant",
      cameraKept: /getUserMedia/.test(camera) && />\s*Cancel\s*</.test(camera),
      wordsUnchanged: words === origWords,
      wordsPrivacy: wordsStatus.topics.privacy?.state === "already-compliant",
      allowUnchanged: allowed === origAllow,
      allowPrivacy: allowStatus.topics.privacy?.state === "pending",
      allowKept: />\s*Allow\s*</.test(allowed),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passPrivacy: passStatus.topics.privacy?.state,
      fixPrivacy: fixStatus.topics.privacy?.state,
      holdPrivacy: holdStatus.topics.privacy?.state,
      cancelPrivacy: cancelStatus.topics.privacy?.state,
      consentPrivacy: consentStatus.topics.privacy?.state,
      nextPrivacy: nextStatus.topics.privacy?.state,
      cameraPrivacy: cameraStatus.topics.privacy?.state,
      wordsPrivacy: wordsStatus.topics.privacy?.state,
      allowPrivacy: allowStatus.topics.privacy?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-tracking-leave-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-btd-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-btd-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-btd-hold-"));
  const primaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-btd-primary-"));
  const submitDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-btd-submit-"));
  const plainDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-btd-plain-"));
  const roleDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-btd-role-"));
  const saveDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-btd-save-"));
  const prominentDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-btd-prominent-"));
  const dirs = [passDir, fixDir, holdDir, primaryDir, submitDir, plainDir, roleDir, saveDir, prominentDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <div data-bt-primary>
      <button type="button">Save</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return <p>Don't assign the primary role to a button that performs a destructive action.</p>;
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origPrimary = `export function HostWidgets() {
  return <button class="primary">Delete</button>;
}
`;
    fs.writeFileSync(path.join(primaryDir, "HostWidgets.tsx"), origPrimary);
    const origSubmit = `export function HostWidgets() {
  return <button type="submit">Delete</button>;
}
`;
    fs.writeFileSync(path.join(submitDir, "HostWidgets.tsx"), origSubmit);
    const origPlain = `export function HostWidgets() {
  return <button type="button">Delete</button>;
}
`;
    fs.writeFileSync(path.join(plainDir, "HostWidgets.tsx"), origPlain);
    const origRole = `export function HostWidgets() {
  return Button("Delete", role: .destructive);
}
`;
    fs.writeFileSync(path.join(roleDir, "HostWidgets.tsx"), origRole);
    const origSave = `export function HostWidgets() {
  return Button("Save").buttonStyle(.borderedProminent);
}
`;
    fs.writeFileSync(path.join(saveDir, "HostWidgets.tsx"), origSave);
    const origProminent = `export function HostWidgets() {
  return Button("Delete").buttonStyle(.borderedProminent);
}
`;
    fs.writeFileSync(path.join(prominentDir, "HostWidgets.tsx"), origProminent);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const primaryReport = run(primaryDir);
    const submitReport = run(submitDir);
    const plainReport = run(plainDir);
    const roleReport = run(roleDir);
    const saveReport = run(saveDir);
    const prominentReport = run(prominentDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const primaryStatus = readStatus(primaryDir);
    const submitStatus = readStatus(submitDir);
    const plainStatus = readStatus(plainDir);
    const roleStatus = readStatus(roleDir);
    const saveStatus = readStatus(saveDir);
    const prominentStatus = readStatus(prominentDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const primary = fs.readFileSync(path.join(primaryDir, "HostWidgets.tsx"), "utf8");
    const submitted = fs.readFileSync(path.join(submitDir, "HostWidgets.tsx"), "utf8");
    const plain = fs.readFileSync(path.join(plainDir, "HostWidgets.tsx"), "utf8");
    const role = fs.readFileSync(path.join(roleDir, "HostWidgets.tsx"), "utf8");
    const saved = fs.readFileSync(path.join(saveDir, "HostWidgets.tsx"), "utf8");
    const prominent = fs.readFileSync(path.join(prominentDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      primaryChrome: primaryReport.chrome.pass === true,
      submitChrome: submitReport.chrome.pass === true,
      plainChrome: plainReport.chrome.pass === true,
      roleChrome: roleReport.chrome.pass === true,
      saveChrome: saveReport.chrome.pass === true,
      prominentChrome: prominentReport.chrome.pass === true,
      passButtons: passStatus.topics.buttons?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixButtons: fixStatus.topics.buttons?.state === "applied",
      systemKept: />\s*Save\s*</.test(fixed),
      markersGone: !/data-bt-primary/.test(fixed),
      holdUnchanged: held === origHold,
      holdButtons: holdStatus.topics.buttons?.state === "pending",
      holdStillPhrase: /primary role to a button that performs a destructive action/.test(held),
      holdNotInvented: !/class=["']primary["']/.test(held),
      primaryUnchanged: primary === origPrimary,
      primaryButtons: primaryStatus.topics.buttons?.state === "pending",
      primaryKept: /class="primary"/.test(primary) && />\s*Delete\s*</.test(primary),
      submitUnchanged: submitted === origSubmit,
      submitButtons: submitStatus.topics.buttons?.state === "pending",
      submitKept: /type="submit"/.test(submitted) && />\s*Delete\s*</.test(submitted),
      plainUnchanged: plain === origPlain,
      plainButtons: plainStatus.topics.buttons?.state === "already-compliant",
      plainKept: />\s*Delete\s*</.test(plain),
      roleUnchanged: role === origRole,
      roleButtons: roleStatus.topics.buttons?.state === "already-compliant",
      roleKept: /role: \.destructive/.test(role),
      saveUnchanged: saved === origSave,
      saveButtons: saveStatus.topics.buttons?.state === "already-compliant",
      saveKept: /Button\("Save"\)/.test(saved) && /borderedProminent/.test(saved),
      prominentUnchanged: prominent === origProminent,
      prominentButtons: prominentStatus.topics.buttons?.state === "pending",
      prominentKept: /Button\("Delete"\)/.test(prominent) && /borderedProminent/.test(prominent),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passButtons: passStatus.topics.buttons?.state,
      fixButtons: fixStatus.topics.buttons?.state,
      holdButtons: holdStatus.topics.buttons?.state,
      primaryButtons: primaryStatus.topics.buttons?.state,
      submitButtons: submitStatus.topics.buttons?.state,
      plainButtons: plainStatus.topics.buttons?.state,
      roleButtons: roleStatus.topics.buttons?.state,
      saveButtons: saveStatus.topics.buttons?.state,
      prominentButtons: prominentStatus.topics.buttons?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-primary-destructive-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ale-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ale-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ale-hold-"));
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ale-bare-"));
  const numberedDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ale-num-"));
  const specificDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ale-spec-"));
  const toastDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ale-toast-"));
  const swiftDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ale-swift-"));
  const uikitDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ale-uikit-"));
  const dirs = [passDir, fixDir, holdDir, bareDir, numberedDir, specificDir, toastDir, swiftDir, uikitDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <dialog data-al-error>
      <h2>Couldn't save the draft.</h2>
      <button type="button">Retry</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <dialog>
      <h2>Couldn't save the draft.</h2>
      <p>Avoid writing a title that doesn't convey useful information.</p>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origBare = `export function HostWidgets() {
  return (
    <dialog>
      <h2>Error</h2>
      <button type="button">Retry</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(bareDir, "HostWidgets.tsx"), origBare);
    const origNumbered = `export function HostWidgets() {
  return (
    <dialog>
      <h2>Error 329347 occurred</h2>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(numberedDir, "HostWidgets.tsx"), origNumbered);
    const origSpecific = `export function HostWidgets() {
  return (
    <dialog>
      <h2>Couldn't save the draft.</h2>
      <button type="button">Retry</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(specificDir, "HostWidgets.tsx"), origSpecific);
    const origToast = `export function HostWidgets() {
  return <div role="status">Error</div>;
}
`;
    fs.writeFileSync(path.join(toastDir, "HostWidgets.tsx"), origToast);
    const origSwift = `export function HostWidgets() {
  return Text("Note").alert("Error")
}
`;
    fs.writeFileSync(path.join(swiftDir, "HostWidgets.tsx"), origSwift);
    const origUikit = `export function HostWidgets() {
  return UIAlertController(title: "Error", message: "Try again", preferredStyle: .alert)
}
`;
    fs.writeFileSync(path.join(uikitDir, "HostWidgets.tsx"), origUikit);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const bareReport = run(bareDir);
    const numberedReport = run(numberedDir);
    const specificReport = run(specificDir);
    const toastReport = run(toastDir);
    const swiftReport = run(swiftDir);
    const uikitReport = run(uikitDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const bareStatus = readStatus(bareDir);
    const numberedStatus = readStatus(numberedDir);
    const specificStatus = readStatus(specificDir);
    const toastStatus = readStatus(toastDir);
    const swiftStatus = readStatus(swiftDir);
    const uikitStatus = readStatus(uikitDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const bare = fs.readFileSync(path.join(bareDir, "HostWidgets.tsx"), "utf8");
    const numbered = fs.readFileSync(path.join(numberedDir, "HostWidgets.tsx"), "utf8");
    const specific = fs.readFileSync(path.join(specificDir, "HostWidgets.tsx"), "utf8");
    const toast = fs.readFileSync(path.join(toastDir, "HostWidgets.tsx"), "utf8");
    const swift = fs.readFileSync(path.join(swiftDir, "HostWidgets.tsx"), "utf8");
    const uikit = fs.readFileSync(path.join(uikitDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      bareChrome: bareReport.chrome.pass === true,
      numberedChrome: numberedReport.chrome.pass === true,
      specificChrome: specificReport.chrome.pass === true,
      toastChrome: toastReport.chrome.pass === true,
      swiftChrome: swiftReport.chrome.pass === true,
      uikitChrome: uikitReport.chrome.pass === true,
      passAlerts: passStatus.topics.alerts?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixAlerts: fixStatus.topics.alerts?.state === "applied",
      systemKept: /Couldn't save the draft/.test(fixed) && />\s*Retry\s*</.test(fixed),
      markersGone: !/data-al-error/.test(fixed),
      holdUnchanged: held === origHold,
      holdAlerts: holdStatus.topics.alerts?.state === "pending",
      holdStillPhrase: /doesn't convey useful information/.test(held),
      holdNotInvented: /Couldn't save the draft/.test(held),
      bareUnchanged: bare === origBare,
      bareAlerts: bareStatus.topics.alerts?.state === "pending",
      bareKept: /<h2>Error<\/h2>/.test(bare),
      numberedUnchanged: numbered === origNumbered,
      numberedAlerts: numberedStatus.topics.alerts?.state === "pending",
      numberedKept: /Error 329347 occurred/.test(numbered),
      specificUnchanged: specific === origSpecific,
      specificAlerts: specificStatus.topics.alerts?.state === "already-compliant",
      specificKept: /Couldn't save the draft/.test(specific),
      toastUnchanged: toast === origToast,
      toastAlerts: toastStatus.topics.alerts?.state === "skipped-no-affordance",
      toastKept: /role="status">Error/.test(toast),
      swiftUnchanged: swift === origSwift,
      swiftAlerts: swiftStatus.topics.alerts?.state === "skipped-no-affordance",
      swiftKept: /\.alert\("Error"\)/.test(swift),
      uikitUnchanged: uikit === origUikit,
      uikitAlerts: uikitStatus.topics.alerts?.state === "pending",
      uikitKept: /title: "Error"/.test(uikit),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passAlerts: passStatus.topics.alerts?.state,
      fixAlerts: fixStatus.topics.alerts?.state,
      holdAlerts: holdStatus.topics.alerts?.state,
      bareAlerts: bareStatus.topics.alerts?.state,
      numberedAlerts: numberedStatus.topics.alerts?.state,
      specificAlerts: specificStatus.topics.alerts?.state,
      toastAlerts: toastStatus.topics.alerts?.state,
      swiftAlerts: swiftStatus.topics.alerts?.state,
      uikitAlerts: uikitStatus.topics.alerts?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-alert-error-title-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alc-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alc-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alc-hold-"));
  const primaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alc-primary-"));
  const submitDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alc-submit-"));
  const plainDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alc-plain-"));
  const doneDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alc-done-"));
  const formDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alc-form-"));
  const uikitDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alc-uikit-"));
  const roleDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alc-role-"));
  const dirs = [passDir, fixDir, holdDir, primaryDir, submitDir, plainDir, doneDir, formDir, uikitDir, roleDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <dialog data-al-cancel>
      <h2>Discard the draft?</h2>
      <button type="button">Cancel</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <dialog>
      <p>Don't make a Cancel button the default button.</p>
      <button type="button">Cancel</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origPrimary = `export function HostWidgets() {
  return (
    <dialog>
      <h2>Discard the draft?</h2>
      <button class="primary">Cancel</button>
      <button type="button">Keep</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(primaryDir, "HostWidgets.tsx"), origPrimary);
    const origSubmit = `export function HostWidgets() {
  return (
    <dialog>
      <button type="submit">Cancel</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(submitDir, "HostWidgets.tsx"), origSubmit);
    const origPlain = `export function HostWidgets() {
  return (
    <dialog>
      <button type="button">Cancel</button>
      <button type="button">Keep</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(plainDir, "HostWidgets.tsx"), origPlain);
    const origDone = `export function HostWidgets() {
  return (
    <dialog>
      <button class="primary">Done</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(doneDir, "HostWidgets.tsx"), origDone);
    const origForm = `export function HostWidgets() {
  return <button class="primary">Cancel</button>;
}
`;
    fs.writeFileSync(path.join(formDir, "HostWidgets.tsx"), origForm);
    const origUikit = `export function HostWidgets() {
  let alert = UIAlertController(title: "Discard?", message: nil, preferredStyle: .alert)
  alert.addAction(UIAlertAction(title: "Cancel", style: .default))
  return alert
}
`;
    fs.writeFileSync(path.join(uikitDir, "HostWidgets.tsx"), origUikit);
    const origRole = `export function HostWidgets() {
  let alert = UIAlertController(title: "Discard?", message: nil, preferredStyle: .alert)
  alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
  return alert
}
`;
    fs.writeFileSync(path.join(roleDir, "HostWidgets.tsx"), origRole);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const primaryReport = run(primaryDir);
    const submitReport = run(submitDir);
    const plainReport = run(plainDir);
    const doneReport = run(doneDir);
    const formReport = run(formDir);
    const uikitReport = run(uikitDir);
    const roleReport = run(roleDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const primaryStatus = readStatus(primaryDir);
    const submitStatus = readStatus(submitDir);
    const plainStatus = readStatus(plainDir);
    const doneStatus = readStatus(doneDir);
    const formStatus = readStatus(formDir);
    const uikitStatus = readStatus(uikitDir);
    const roleStatus = readStatus(roleDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const primary = fs.readFileSync(path.join(primaryDir, "HostWidgets.tsx"), "utf8");
    const submitted = fs.readFileSync(path.join(submitDir, "HostWidgets.tsx"), "utf8");
    const plain = fs.readFileSync(path.join(plainDir, "HostWidgets.tsx"), "utf8");
    const done = fs.readFileSync(path.join(doneDir, "HostWidgets.tsx"), "utf8");
    const form = fs.readFileSync(path.join(formDir, "HostWidgets.tsx"), "utf8");
    const uikit = fs.readFileSync(path.join(uikitDir, "HostWidgets.tsx"), "utf8");
    const role = fs.readFileSync(path.join(roleDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      primaryChrome: primaryReport.chrome.pass === true,
      submitChrome: submitReport.chrome.pass === true,
      plainChrome: plainReport.chrome.pass === true,
      doneChrome: doneReport.chrome.pass === true,
      formChrome: formReport.chrome.pass === true,
      uikitChrome: uikitReport.chrome.pass === true,
      roleChrome: roleReport.chrome.pass === true,
      passAlerts: passStatus.topics.alerts?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixAlerts: fixStatus.topics.alerts?.state === "applied",
      systemKept: />\s*Cancel\s*</.test(fixed),
      markersGone: !/data-al-cancel/.test(fixed),
      errorMarkerUntouched: !/data-al-error/.test(fixed),
      holdUnchanged: held === origHold,
      holdAlerts: holdStatus.topics.alerts?.state === "pending",
      holdStillPhrase: /Cancel button the default button/.test(held),
      holdNotInvented: !/>\s*Done\s*</.test(held),
      primaryUnchanged: primary === origPrimary,
      primaryAlerts: primaryStatus.topics.alerts?.state === "pending",
      primaryKept: /class="primary">Cancel/.test(primary),
      submitUnchanged: submitted === origSubmit,
      submitAlerts: submitStatus.topics.alerts?.state === "pending",
      submitKept: /type="submit">Cancel/.test(submitted),
      plainUnchanged: plain === origPlain,
      plainAlerts: plainStatus.topics.alerts?.state === "already-compliant",
      plainKept: /type="button">Cancel/.test(plain),
      doneUnchanged: done === origDone,
      doneAlerts: doneStatus.topics.alerts?.state === "already-compliant",
      doneKept: /class="primary">Done/.test(done),
      formUnchanged: form === origForm,
      formAlerts: formStatus.topics.alerts?.state === "skipped-no-affordance",
      formKept: /class="primary">Cancel/.test(form),
      uikitUnchanged: uikit === origUikit,
      uikitAlerts: uikitStatus.topics.alerts?.state === "pending",
      uikitKept: /style: \.default/.test(uikit),
      roleUnchanged: role === origRole,
      roleAlerts: roleStatus.topics.alerts?.state === "already-compliant",
      roleKept: /style: \.cancel/.test(role),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passAlerts: passStatus.topics.alerts?.state,
      fixAlerts: fixStatus.topics.alerts?.state,
      holdAlerts: holdStatus.topics.alerts?.state,
      primaryAlerts: primaryStatus.topics.alerts?.state,
      submitAlerts: submitStatus.topics.alerts?.state,
      plainAlerts: plainStatus.topics.alerts?.state,
      doneAlerts: doneStatus.topics.alerts?.state,
      formAlerts: formStatus.topics.alerts?.state,
      uikitAlerts: uikitStatus.topics.alerts?.state,
      roleAlerts: roleStatus.topics.alerts?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-alert-cancel-default-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aly-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aly-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aly-hold-"));
  const yesDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aly-yes-"));
  const noDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aly-no-"));
  const verbDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aly-verb-"));
  const phraseDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aly-phrase-"));
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aly-out-"));
  const uikitDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-aly-uikit-"));
  const dirs = [passDir, fixDir, holdDir, yesDir, noDir, verbDir, phraseDir, outsideDir, uikitDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <dialog data-al-yes>
      <h2>Discard the draft?</h2>
      <button type="button">Keep</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <dialog>
      <p>Prefer verbs, avoiding Yes and No.</p>
      <button type="button">Keep</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origYes = `export function HostWidgets() {
  return (
    <dialog>
      <h2>Discard the draft?</h2>
      <button type="button">Yes</button>
      <button type="button">Keep</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(yesDir, "HostWidgets.tsx"), origYes);
    const origNo = `export function HostWidgets() {
  return (
    <dialog>
      <button type="button">No</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(noDir, "HostWidgets.tsx"), origNo);
    const origVerb = `export function HostWidgets() {
  return (
    <dialog>
      <button type="button">Delete</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(verbDir, "HostWidgets.tsx"), origVerb);
    const origPhrase = `export function HostWidgets() {
  return (
    <dialog>
      <button type="button">No thanks</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(phraseDir, "HostWidgets.tsx"), origPhrase);
    const origOutside = `export function HostWidgets() {
  return <button type="button">Yes</button>;
}
`;
    fs.writeFileSync(path.join(outsideDir, "HostWidgets.tsx"), origOutside);
    const origUikit = `export function HostWidgets() {
  let alert = UIAlertController(title: "Discard?", message: nil, preferredStyle: .alert)
  alert.addAction(UIAlertAction(title: "Yes", style: .default))
  return alert
}
`;
    fs.writeFileSync(path.join(uikitDir, "HostWidgets.tsx"), origUikit);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const yesReport = run(yesDir);
    const noReport = run(noDir);
    const verbReport = run(verbDir);
    const phraseReport = run(phraseDir);
    const outsideReport = run(outsideDir);
    const uikitReport = run(uikitDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const yesStatus = readStatus(yesDir);
    const noStatus = readStatus(noDir);
    const verbStatus = readStatus(verbDir);
    const phraseStatus = readStatus(phraseDir);
    const outsideStatus = readStatus(outsideDir);
    const uikitStatus = readStatus(uikitDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const yes = fs.readFileSync(path.join(yesDir, "HostWidgets.tsx"), "utf8");
    const no = fs.readFileSync(path.join(noDir, "HostWidgets.tsx"), "utf8");
    const verb = fs.readFileSync(path.join(verbDir, "HostWidgets.tsx"), "utf8");
    const phrase = fs.readFileSync(path.join(phraseDir, "HostWidgets.tsx"), "utf8");
    const outside = fs.readFileSync(path.join(outsideDir, "HostWidgets.tsx"), "utf8");
    const uikit = fs.readFileSync(path.join(uikitDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      yesChrome: yesReport.chrome.pass === true,
      noChrome: noReport.chrome.pass === true,
      verbChrome: verbReport.chrome.pass === true,
      phraseChrome: phraseReport.chrome.pass === true,
      outsideChrome: outsideReport.chrome.pass === true,
      uikitChrome: uikitReport.chrome.pass === true,
      passAlerts: passStatus.topics.alerts?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixAlerts: fixStatus.topics.alerts?.state === "applied",
      systemKept: />\s*Keep\s*</.test(fixed),
      markersGone: !/data-al-yes\b/.test(fixed),
      holdUnchanged: held === origHold,
      holdAlerts: holdStatus.topics.alerts?.state === "pending",
      holdStillPhrase: /avoiding Yes and No/.test(held),
      holdNotInvented: !/<button\b[^>]*>\s*Yes\s*<\/button>/i.test(held),
      yesUnchanged: yes === origYes,
      yesAlerts: yesStatus.topics.alerts?.state === "pending",
      yesKept: />\s*Yes\s*</.test(yes) && />\s*Keep\s*</.test(yes),
      noUnchanged: no === origNo,
      noAlerts: noStatus.topics.alerts?.state === "pending",
      noKept: />\s*No\s*</.test(no),
      verbUnchanged: verb === origVerb,
      verbAlerts: verbStatus.topics.alerts?.state === "already-compliant",
      verbKept: />\s*Delete\s*</.test(verb),
      phraseUnchanged: phrase === origPhrase,
      phraseAlerts: phraseStatus.topics.alerts?.state === "already-compliant",
      phraseKept: />\s*No thanks\s*</.test(phrase),
      outsideUnchanged: outside === origOutside,
      outsideAlerts: outsideStatus.topics.alerts?.state === "skipped-no-affordance",
      outsideKept: />\s*Yes\s*</.test(outside),
      uikitUnchanged: uikit === origUikit,
      uikitAlerts: uikitStatus.topics.alerts?.state === "pending",
      uikitKept: /title: "Yes"/.test(uikit),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passAlerts: passStatus.topics.alerts?.state,
      fixAlerts: fixStatus.topics.alerts?.state,
      holdAlerts: holdStatus.topics.alerts?.state,
      yesAlerts: yesStatus.topics.alerts?.state,
      noAlerts: noStatus.topics.alerts?.state,
      verbAlerts: verbStatus.topics.alerts?.state,
      phraseAlerts: phraseStatus.topics.alerts?.state,
      outsideAlerts: outsideStatus.topics.alerts?.state,
      uikitAlerts: uikitStatus.topics.alerts?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-alert-yes-no-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alcau-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alcau-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alcau-hold-"));
  const saveDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alcau-save-"));
  const trashDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alcau-trash-"));
  const otherDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alcau-other-"));
  const plainDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alcau-plain-"));
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alcau-out-"));
  const uikitDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-alcau-uikit-"));
  const dirs = [passDir, fixDir, holdDir, saveDir, trashDir, otherDir, plainDir, outsideDir, uikitDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <dialog data-al-caution>
      <h2>Replace the file?</h2>
      <button type="button">Keep</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <dialog>
      <p>Don't use the symbol for tasks whose only purpose is to overwrite or remove data, such as a save or empty trash.</p>
      <button type="button">Keep</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origSave = `export function HostWidgets() {
  return (
    <dialog>
      <p>exclamationmark.triangle</p>
      <button type="button">Save</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(saveDir, "HostWidgets.tsx"), origSave);
    const origTrash = `export function HostWidgets() {
  return (
    <dialog>
      <p>exclamationmark.triangle</p>
      <button type="button">Empty Trash</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(trashDir, "HostWidgets.tsx"), origTrash);
    const origOther = `export function HostWidgets() {
  return (
    <dialog>
      <p>exclamationmark.triangle</p>
      <button type="button">Delete</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(otherDir, "HostWidgets.tsx"), origOther);
    const origPlain = `export function HostWidgets() {
  return (
    <dialog>
      <button type="button">Save</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(plainDir, "HostWidgets.tsx"), origPlain);
    const origOutside = `export function HostWidgets() {
  return (
    <p>
      exclamationmark.triangle
      <button type="button">Save</button>
    </p>
  );
}
`;
    fs.writeFileSync(path.join(outsideDir, "HostWidgets.tsx"), origOutside);
    const origUikit = `export function HostWidgets() {
  let alert = UIAlertController(title: "Replace the file?", message: nil, preferredStyle: .alert)
  let symbol = "exclamationmark.triangle"
  alert.addAction(UIAlertAction(title: "Save", style: .default))
  return alert
}
`;
    fs.writeFileSync(path.join(uikitDir, "HostWidgets.tsx"), origUikit);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const saveReport = run(saveDir);
    const trashReport = run(trashDir);
    const otherReport = run(otherDir);
    const plainReport = run(plainDir);
    const outsideReport = run(outsideDir);
    const uikitReport = run(uikitDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const saveStatus = readStatus(saveDir);
    const trashStatus = readStatus(trashDir);
    const otherStatus = readStatus(otherDir);
    const plainStatus = readStatus(plainDir);
    const outsideStatus = readStatus(outsideDir);
    const uikitStatus = readStatus(uikitDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const save = fs.readFileSync(path.join(saveDir, "HostWidgets.tsx"), "utf8");
    const trash = fs.readFileSync(path.join(trashDir, "HostWidgets.tsx"), "utf8");
    const other = fs.readFileSync(path.join(otherDir, "HostWidgets.tsx"), "utf8");
    const plain = fs.readFileSync(path.join(plainDir, "HostWidgets.tsx"), "utf8");
    const outside = fs.readFileSync(path.join(outsideDir, "HostWidgets.tsx"), "utf8");
    const uikit = fs.readFileSync(path.join(uikitDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      saveChrome: saveReport.chrome.pass === true,
      trashChrome: trashReport.chrome.pass === true,
      otherChrome: otherReport.chrome.pass === true,
      plainChrome: plainReport.chrome.pass === true,
      outsideChrome: outsideReport.chrome.pass === true,
      uikitChrome: uikitReport.chrome.pass === true,
      passAlerts: passStatus.topics.alerts?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixAlerts: fixStatus.topics.alerts?.state === "applied",
      systemKept: />\s*Keep\s*</.test(fixed),
      markersGone: !/data-al-caution\b/.test(fixed),
      holdUnchanged: held === origHold,
      holdAlerts: holdStatus.topics.alerts?.state === "pending",
      holdStillPhrase: /overwrite or remove data/.test(held),
      holdNotInvented: !/exclamationmark\.triangle/.test(held) && !/>\s*Save\s*</.test(held),
      saveUnchanged: save === origSave,
      saveAlerts: saveStatus.topics.alerts?.state === "pending",
      saveKept: /exclamationmark\.triangle/.test(save) && />\s*Save\s*</.test(save),
      trashUnchanged: trash === origTrash,
      trashAlerts: trashStatus.topics.alerts?.state === "pending",
      trashKept: />\s*Empty Trash\s*</.test(trash),
      otherUnchanged: other === origOther,
      otherAlerts: otherStatus.topics.alerts?.state === "already-compliant",
      otherKept: />\s*Delete\s*</.test(other) && /exclamationmark\.triangle/.test(other),
      plainUnchanged: plain === origPlain,
      plainAlerts: plainStatus.topics.alerts?.state === "already-compliant",
      plainKept: />\s*Save\s*</.test(plain),
      outsideUnchanged: outside === origOutside,
      outsideAlerts: outsideStatus.topics.alerts?.state === "skipped-no-affordance",
      outsideKept: />\s*Save\s*</.test(outside),
      uikitUnchanged: uikit === origUikit,
      uikitAlerts: uikitStatus.topics.alerts?.state === "pending",
      uikitKept: /title: "Save"/.test(uikit) && /exclamationmark\.triangle/.test(uikit),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passAlerts: passStatus.topics.alerts?.state,
      fixAlerts: fixStatus.topics.alerts?.state,
      holdAlerts: holdStatus.topics.alerts?.state,
      saveAlerts: saveStatus.topics.alerts?.state,
      trashAlerts: trashStatus.topics.alerts?.state,
      otherAlerts: otherStatus.topics.alerts?.state,
      plainAlerts: plainStatus.topics.alerts?.state,
      outsideAlerts: outsideStatus.topics.alerts?.state,
      uikitAlerts: uikitStatus.topics.alerts?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-alert-caution-save-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sht-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sht-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sht-hold-"));
  const trioDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sht-trio-"));
  const pairDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sht-pair-"));
  const backDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sht-back-"));
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sht-out-"));
  const swiftDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sht-swift-"));
  const alertDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sht-alert-"));
  const dirs = [passDir, fixDir, holdDir, trioDir, pairDir, backDir, outsideDir, swiftDir, alertDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <dialog data-sh-trio>
      <h2>Save the draft?</h2>
      <button type="button">Keep</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <dialog>
      <p>Avoid showing all three buttons — Cancel, Done, and Back — together.</p>
      <button type="button">Keep</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origTrio = `export function HostWidgets() {
  return (
    <dialog>
      <h2>Save the draft?</h2>
      <button type="button">Cancel</button>
      <button type="button">Done</button>
      <button type="button">Back</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(trioDir, "HostWidgets.tsx"), origTrio);
    const origPair = `export function HostWidgets() {
  return (
    <dialog>
      <button type="button">Done</button>
      <button type="button">Cancel</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(pairDir, "HostWidgets.tsx"), origPair);
    const origBack = `export function HostWidgets() {
  return (
    <dialog>
      <button type="button">Done</button>
      <button type="button">Back</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(backDir, "HostWidgets.tsx"), origBack);
    const origOutside = `export function HostWidgets() {
  return (
    <p>
      <button type="button">Cancel</button>
      <button type="button">Done</button>
      <button type="button">Back</button>
    </p>
  );
}
`;
    fs.writeFileSync(path.join(outsideDir, "HostWidgets.tsx"), origOutside);
    const origSwift = `export function HostWidgets() {
  .sheet(isPresented: $show) {
    Button("Cancel") {}
    Button("Done") {}
    Button("Back") {}
  }
}
`;
    fs.writeFileSync(path.join(swiftDir, "HostWidgets.tsx"), origSwift);
    const origAlert = `export function HostWidgets() {
  let alert = UIAlertController(title: "Step", message: nil, preferredStyle: .alert)
  alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
  alert.addAction(UIAlertAction(title: "Done", style: .default))
  alert.addAction(UIAlertAction(title: "Back", style: .default))
  return alert
}
`;
    fs.writeFileSync(path.join(alertDir, "HostWidgets.tsx"), origAlert);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const trioReport = run(trioDir);
    const pairReport = run(pairDir);
    const backReport = run(backDir);
    const outsideReport = run(outsideDir);
    const swiftReport = run(swiftDir);
    const alertReport = run(alertDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const trioStatus = readStatus(trioDir);
    const pairStatus = readStatus(pairDir);
    const backStatus = readStatus(backDir);
    const outsideStatus = readStatus(outsideDir);
    const swiftStatus = readStatus(swiftDir);
    const alertStatus = readStatus(alertDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const trio = fs.readFileSync(path.join(trioDir, "HostWidgets.tsx"), "utf8");
    const pair = fs.readFileSync(path.join(pairDir, "HostWidgets.tsx"), "utf8");
    const back = fs.readFileSync(path.join(backDir, "HostWidgets.tsx"), "utf8");
    const outside = fs.readFileSync(path.join(outsideDir, "HostWidgets.tsx"), "utf8");
    const swift = fs.readFileSync(path.join(swiftDir, "HostWidgets.tsx"), "utf8");
    const alert = fs.readFileSync(path.join(alertDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      trioChrome: trioReport.chrome.pass === true,
      pairChrome: pairReport.chrome.pass === true,
      backChrome: backReport.chrome.pass === true,
      outsideChrome: outsideReport.chrome.pass === true,
      swiftChrome: swiftReport.chrome.pass === true,
      alertChrome: alertReport.chrome.pass === true,
      passSheets: passStatus.topics.sheets?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixSheets: fixStatus.topics.sheets?.state === "applied",
      systemKept: />\s*Keep\s*</.test(fixed),
      markersGone: !/data-sh-trio\b/.test(fixed),
      holdUnchanged: held === origHold,
      holdSheets: holdStatus.topics.sheets?.state === "pending",
      holdStillPhrase: /all three buttons/.test(held),
      holdNotInvented: !/<button\b[^>]*>\s*Back\s*<\/button>/i.test(held),
      trioUnchanged: trio === origTrio,
      trioSheets: trioStatus.topics.sheets?.state === "pending",
      trioKept:
        />\s*Cancel\s*</.test(trio) && />\s*Done\s*</.test(trio) && />\s*Back\s*</.test(trio),
      pairUnchanged: pair === origPair,
      pairSheets: pairStatus.topics.sheets?.state === "already-compliant",
      pairKept: />\s*Done\s*</.test(pair) && />\s*Cancel\s*</.test(pair),
      backUnchanged: back === origBack,
      backSheets: backStatus.topics.sheets?.state === "already-compliant",
      backKept: />\s*Done\s*</.test(back) && />\s*Back\s*</.test(back),
      outsideUnchanged: outside === origOutside,
      outsideSheets: outsideStatus.topics.sheets?.state === "skipped-no-affordance",
      outsideKept: />\s*Back\s*</.test(outside),
      swiftUnchanged: swift === origSwift,
      swiftSheets: swiftStatus.topics.sheets?.state === "pending",
      swiftKept: /Button\("Back"\)/.test(swift),
      alertUnchanged: alert === origAlert,
      alertSheets: alertStatus.topics.sheets?.state === "already-compliant",
      alertKept: /title: "Back"/.test(alert),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passSheets: passStatus.topics.sheets?.state,
      fixSheets: fixStatus.topics.sheets?.state,
      holdSheets: holdStatus.topics.sheets?.state,
      trioSheets: trioStatus.topics.sheets?.state,
      pairSheets: pairStatus.topics.sheets?.state,
      backSheets: backStatus.topics.sheets?.state,
      outsideSheets: outsideStatus.topics.sheets?.state,
      swiftSheets: swiftStatus.topics.sheets?.state,
      alertSheets: alertStatus.topics.sheets?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-sheet-trio-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shd-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shd-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shd-hold-"));
  const doneDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shd-done-"));
  const cancelDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shd-cancel-"));
  const closeDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shd-close-"));
  const backDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shd-back-"));
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shd-out-"));
  const swiftDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shd-swift-"));
  const alertDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-shd-alert-"));
  const dirs = [passDir, fixDir, holdDir, doneDir, cancelDir, closeDir, backDir, outsideDir, swiftDir, alertDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <dialog data-sh-done>
      <h2>Save the draft?</h2>
      <button type="button">Keep</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <dialog>
      <p>Relying solely on the Done button implies that completing the task is the only way to exit the sheet.</p>
      <button type="button">Keep</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origDone = `export function HostWidgets() {
  return (
    <dialog>
      <h2>Save the draft?</h2>
      <button type="button">Done</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(doneDir, "HostWidgets.tsx"), origDone);
    const origCancel = `export function HostWidgets() {
  return (
    <dialog>
      <button type="button">Done</button>
      <button type="button">Cancel</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(cancelDir, "HostWidgets.tsx"), origCancel);
    const origClose = `export function HostWidgets() {
  return (
    <dialog>
      <button type="button">Done</button>
      <button type="button">Close</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(closeDir, "HostWidgets.tsx"), origClose);
    const origBack = `export function HostWidgets() {
  return (
    <dialog>
      <button type="button">Done</button>
      <button type="button">Back</button>
    </dialog>
  );
}
`;
    fs.writeFileSync(path.join(backDir, "HostWidgets.tsx"), origBack);
    const origOutside = `export function HostWidgets() {
  return <button type="button">Done</button>;
}
`;
    fs.writeFileSync(path.join(outsideDir, "HostWidgets.tsx"), origOutside);
    const origSwift = `export function HostWidgets() {
  .sheet(isPresented: $show) {
    Button("Done") {}
  }
}
`;
    fs.writeFileSync(path.join(swiftDir, "HostWidgets.tsx"), origSwift);
    const origAlert = `export function HostWidgets() {
  let alert = UIAlertController(title: "Saved", message: nil, preferredStyle: .alert)
  alert.addAction(UIAlertAction(title: "Done", style: .default))
  return alert
}
`;
    fs.writeFileSync(path.join(alertDir, "HostWidgets.tsx"), origAlert);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const doneReport = run(doneDir);
    const cancelReport = run(cancelDir);
    const closeReport = run(closeDir);
    const backReport = run(backDir);
    const outsideReport = run(outsideDir);
    const swiftReport = run(swiftDir);
    const alertReport = run(alertDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const doneStatus = readStatus(doneDir);
    const cancelStatus = readStatus(cancelDir);
    const closeStatus = readStatus(closeDir);
    const backStatus = readStatus(backDir);
    const outsideStatus = readStatus(outsideDir);
    const swiftStatus = readStatus(swiftDir);
    const alertStatus = readStatus(alertDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const done = fs.readFileSync(path.join(doneDir, "HostWidgets.tsx"), "utf8");
    const cancel = fs.readFileSync(path.join(cancelDir, "HostWidgets.tsx"), "utf8");
    const close = fs.readFileSync(path.join(closeDir, "HostWidgets.tsx"), "utf8");
    const back = fs.readFileSync(path.join(backDir, "HostWidgets.tsx"), "utf8");
    const outside = fs.readFileSync(path.join(outsideDir, "HostWidgets.tsx"), "utf8");
    const swift = fs.readFileSync(path.join(swiftDir, "HostWidgets.tsx"), "utf8");
    const alert = fs.readFileSync(path.join(alertDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      doneChrome: doneReport.chrome.pass === true,
      cancelChrome: cancelReport.chrome.pass === true,
      closeChrome: closeReport.chrome.pass === true,
      backChrome: backReport.chrome.pass === true,
      outsideChrome: outsideReport.chrome.pass === true,
      swiftChrome: swiftReport.chrome.pass === true,
      alertChrome: alertReport.chrome.pass === true,
      passSheets: passStatus.topics.sheets?.state === "skipped-no-affordance",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixSheets: fixStatus.topics.sheets?.state === "applied",
      systemKept: />\s*Keep\s*</.test(fixed),
      markersGone: !/data-sh-done\b/.test(fixed),
      trioMarkerUntouched: !/data-sh-trio\b/.test(fixed),
      holdUnchanged: held === origHold,
      holdSheets: holdStatus.topics.sheets?.state === "pending",
      holdStillPhrase: /Relying solely on the Done button/.test(held),
      holdNotInvented: !/<button\b[^>]*>\s*Cancel\s*<\/button>/i.test(held),
      doneUnchanged: done === origDone,
      doneSheets: doneStatus.topics.sheets?.state === "already-compliant",
      doneKept: />\s*Done\s*</.test(done),
      cancelUnchanged: cancel === origCancel,
      cancelSheets: cancelStatus.topics.sheets?.state === "already-compliant",
      cancelKept: />\s*Cancel\s*</.test(cancel),
      closeUnchanged: close === origClose,
      closeSheets: closeStatus.topics.sheets?.state === "already-compliant",
      closeKept: />\s*Close\s*</.test(close),
      backUnchanged: back === origBack,
      backSheets: backStatus.topics.sheets?.state === "already-compliant",
      backKept: />\s*Back\s*</.test(back),
      outsideUnchanged: outside === origOutside,
      outsideSheets: outsideStatus.topics.sheets?.state === "skipped-no-affordance",
      outsideKept: />\s*Done\s*</.test(outside),
      swiftUnchanged: swift === origSwift,
      swiftSheets: swiftStatus.topics.sheets?.state === "pending",
      swiftKept: /Button\("Done"\)/.test(swift),
      alertUnchanged: alert === origAlert,
      alertSheets: alertStatus.topics.sheets?.state === "already-compliant",
      alertKept: /title: "Done"/.test(alert),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passSheets: passStatus.topics.sheets?.state,
      fixSheets: fixStatus.topics.sheets?.state,
      holdSheets: holdStatus.topics.sheets?.state,
      doneSheets: doneStatus.topics.sheets?.state,
      cancelSheets: cancelStatus.topics.sheets?.state,
      closeSheets: closeStatus.topics.sheets?.state,
      backSheets: backStatus.topics.sheets?.state,
      outsideSheets: outsideStatus.topics.sheets?.state,
      swiftSheets: swiftStatus.topics.sheets?.state,
      alertSheets: alertStatus.topics.sheets?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-sheet-done-only-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tbo-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tbo-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tbo-hold-"));
  const offDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tbo-off-"));
  const hideDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tbo-hide-"));
  const plainDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tbo-plain-"));
  const viewDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tbo-view-"));
  const swiftDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tbo-swift-"));
  const dirs = [passDir, fixDir, holdDir, offDir, hideDir, plainDir, viewDir, swiftDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <nav data-tab-bar role="tablist" data-tb-off>
      <button type="button" role="tab">Home</button>
    </nav>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <nav data-tab-bar role="tablist">
      <p>Don't disable or hide tab bar buttons, even when their content is unavailable.</p>
      <button type="button" role="tab">Home</button>
    </nav>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origOff = `export function HostWidgets() {
  return (
    <nav data-tab-bar role="tablist">
      <button type="button" role="tab" disabled>Home</button>
      <button type="button" role="tab">Search</button>
    </nav>
  );
}
`;
    fs.writeFileSync(path.join(offDir, "HostWidgets.tsx"), origOff);
    const origHide = `export function HostWidgets() {
  return (
    <nav data-tab-bar role="tablist">
      <button type="button" role="tab" hidden>Home</button>
    </nav>
  );
}
`;
    fs.writeFileSync(path.join(hideDir, "HostWidgets.tsx"), origHide);
    const origPlain = `export function HostWidgets() {
  return <button type="button" disabled>Save</button>;
}
`;
    fs.writeFileSync(path.join(plainDir, "HostWidgets.tsx"), origPlain);
    const origView = `export function HostWidgets() {
  return (
    <div>
      <div role="tablist">
        <button type="button" role="tab" disabled>One</button>
      </div>
      <div role="tabpanel">Pane</div>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(viewDir, "HostWidgets.tsx"), origView);
    const origSwift = `export function HostWidgets() {
  TabView {
    Text("Home").tabItem { Text("Home") }.disabled(true)
  }
}
`;
    fs.writeFileSync(path.join(swiftDir, "HostWidgets.tsx"), origSwift);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const offReport = run(offDir);
    const hideReport = run(hideDir);
    const plainReport = run(plainDir);
    const viewReport = run(viewDir);
    const swiftReport = run(swiftDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const offStatus = readStatus(offDir);
    const hideStatus = readStatus(hideDir);
    const plainStatus = readStatus(plainDir);
    const viewStatus = readStatus(viewDir);
    const swiftStatus = readStatus(swiftDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const off = fs.readFileSync(path.join(offDir, "HostWidgets.tsx"), "utf8");
    const hide = fs.readFileSync(path.join(hideDir, "HostWidgets.tsx"), "utf8");
    const plain = fs.readFileSync(path.join(plainDir, "HostWidgets.tsx"), "utf8");
    const view = fs.readFileSync(path.join(viewDir, "HostWidgets.tsx"), "utf8");
    const swift = fs.readFileSync(path.join(swiftDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      offChrome: offReport.chrome.pass === true,
      hideChrome: hideReport.chrome.pass === true,
      plainChrome: plainReport.chrome.pass === true,
      viewChrome: viewReport.chrome.pass === true,
      swiftChrome: swiftReport.chrome.pass === true,
      passTabs: passStatus.topics["tab-bars"]?.state === "already-compliant",
      passSidebars: passStatus.topics.sidebars?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixTabs: fixStatus.topics["tab-bars"]?.state === "applied",
      systemKept: />\s*Home\s*</.test(fixed),
      markersGone: !/data-tb-off\b/.test(fixed),
      holdUnchanged: held === origHold,
      holdTabs: holdStatus.topics["tab-bars"]?.state === "pending",
      holdStillPhrase: /disable or hide tab bar buttons/.test(held),
      holdNotEnabled: !/\sdisabled(?=[\s=/>])/.test(held),
      offUnchanged: off === origOff,
      offTabs: offStatus.topics["tab-bars"]?.state === "pending",
      offKept: /role="tab" disabled>Home/.test(off),
      hideUnchanged: hide === origHide,
      hideTabs: hideStatus.topics["tab-bars"]?.state === "pending",
      hideKept: /role="tab" hidden>Home/.test(hide),
      plainUnchanged: plain === origPlain,
      plainTabs: plainStatus.topics["tab-bars"]?.state === "already-compliant",
      plainKept: /disabled>Save/.test(plain),
      viewUnchanged: view === origView,
      viewTabs: viewStatus.topics["tab-bars"]?.state === "already-compliant",
      viewKept: /role="tab" disabled>One/.test(view),
      swiftUnchanged: swift === origSwift,
      swiftTabs: swiftStatus.topics["tab-bars"]?.state === "pending",
      swiftKept: /\.disabled\(true\)/.test(swift),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passTabs: passStatus.topics["tab-bars"]?.state,
      fixTabs: fixStatus.topics["tab-bars"]?.state,
      holdTabs: holdStatus.topics["tab-bars"]?.state,
      offTabs: offStatus.topics["tab-bars"]?.state,
      hideTabs: hideStatus.topics["tab-bars"]?.state,
      plainTabs: plainStatus.topics["tab-bars"]?.state,
      viewTabs: viewStatus.topics["tab-bars"]?.state,
      swiftTabs: swiftStatus.topics["tab-bars"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-tab-disabled-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tgr-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tgr-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tgr-hold-"));
  const sixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tgr-six-"));
  const fiveDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tgr-five-"));
  const viewDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tgr-view-"));
  const swiftDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tgr-swift-"));
  const sentenceDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-tgr-sentence-"));
  const dirs = [passDir, fixDir, holdDir, sixDir, fiveDir, viewDir, swiftDir, sentenceDir];
  const radios = (name, count) =>
    Array.from({ length: count }, () => `      <input type="radio" name="${name}" />`).join("\n");
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <div data-tg-radios>
      <input type="radio" name="only" />
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div>
      <p>Avoid listing too many radio buttons in a set.</p>
      <input type="radio" name="only" />
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origSix = `export function HostWidgets() {
  return (
    <fieldset>
${radios("size", 6)}
    </fieldset>
  );
}
`;
    fs.writeFileSync(path.join(sixDir, "HostWidgets.tsx"), origSix);
    const origFive = `export function HostWidgets() {
  return (
    <fieldset>
${radios("size", 5)}
    </fieldset>
  );
}
`;
    fs.writeFileSync(path.join(fiveDir, "HostWidgets.tsx"), origFive);
    const origView = `export function HostWidgets() {
  return (
    <div role="radiogroup" aria-label="View">
      <button type="button" role="radio">One</button>
      <button type="button" role="radio">Two</button>
      <button type="button" role="radio">Three</button>
      <button type="button" role="radio">Four</button>
      <button type="button" role="radio">Five</button>
      <button type="button" role="radio">Six</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(viewDir, "HostWidgets.tsx"), origView);
    const origSwift = `export function HostWidgets() {
  Picker("Size", selection: $size) {
    Text("A").tag(0)
    Text("B").tag(1)
    Text("C").tag(2)
    Text("D").tag(3)
    Text("E").tag(4)
    Text("F").tag(5)
  }
  .pickerStyle(.radioGroup)
}
`;
    fs.writeFileSync(path.join(swiftDir, "HostWidgets.tsx"), origSwift);
    const origSentence = `export function HostWidgets() {
  return <p>Avoid listing too many radio buttons in a set.</p>;
}
`;
    fs.writeFileSync(path.join(sentenceDir, "HostWidgets.tsx"), origSentence);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const sixReport = run(sixDir);
    const fiveReport = run(fiveDir);
    const viewReport = run(viewDir);
    const swiftReport = run(swiftDir);
    const sentenceReport = run(sentenceDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const sixStatus = readStatus(sixDir);
    const fiveStatus = readStatus(fiveDir);
    const viewStatus = readStatus(viewDir);
    const swiftStatus = readStatus(swiftDir);
    const sentenceStatus = readStatus(sentenceDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const six = fs.readFileSync(path.join(sixDir, "HostWidgets.tsx"), "utf8");
    const five = fs.readFileSync(path.join(fiveDir, "HostWidgets.tsx"), "utf8");
    const view = fs.readFileSync(path.join(viewDir, "HostWidgets.tsx"), "utf8");
    const swift = fs.readFileSync(path.join(swiftDir, "HostWidgets.tsx"), "utf8");
    const sentence = fs.readFileSync(path.join(sentenceDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      sixChrome: sixReport.chrome.pass === true,
      fiveChrome: fiveReport.chrome.pass === true,
      viewChrome: viewReport.chrome.pass === true,
      swiftChrome: swiftReport.chrome.pass === true,
      sentenceChrome: sentenceReport.chrome.pass === true,
      passButtons: passStatus.topics.buttons?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixButtons: fixStatus.topics.buttons?.state === "applied",
      radioKept: /type="radio"/.test(fixed),
      markersGone: !/data-tg-radios\b/.test(fixed),
      notPopup: !/<select\b/.test(fixed),
      holdUnchanged: held === origHold,
      holdButtons: holdStatus.topics.buttons?.state === "pending",
      holdStillPhrase: /Avoid listing too many radio buttons in a set/.test(held),
      holdRadioKept: /type="radio"/.test(held),
      sixUnchanged: six === origSix,
      sixButtons: sixStatus.topics.buttons?.state === "pending",
      sixKept: (six.match(/type="radio"/g) || []).length === 6,
      fiveUnchanged: five === origFive,
      fiveButtons: fiveStatus.topics.buttons?.state === "already-compliant",
      fiveKept: (five.match(/type="radio"/g) || []).length === 5,
      viewUnchanged: view === origView,
      viewButtons: viewStatus.topics.buttons?.state === "already-compliant",
      viewKept: (view.match(/role="radio"/g) || []).length === 6 && !/type="radio"/.test(view),
      swiftUnchanged: swift === origSwift,
      swiftButtons: swiftStatus.topics.buttons?.state === "pending",
      swiftKept: (swift.match(/\.tag\(/g) || []).length === 6 && /\.radioGroup/.test(swift),
      sentenceUnchanged: sentence === origSentence,
      sentenceButtons: sentenceStatus.topics.buttons?.state === "already-compliant",
      sentenceKept: /Avoid listing too many radio buttons in a set/.test(sentence) &&
        !/type="radio"/.test(sentence),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passButtons: passStatus.topics.buttons?.state,
      fixButtons: fixStatus.topics.buttons?.state,
      holdButtons: holdStatus.topics.buttons?.state,
      sixButtons: sixStatus.topics.buttons?.state,
      fiveButtons: fiveStatus.topics.buttons?.state,
      viewButtons: viewStatus.topics.buttons?.state,
      swiftButtons: swiftStatus.topics.buttons?.state,
      sentenceButtons: sentenceStatus.topics.buttons?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-too-many-radios-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgm-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgm-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgm-hold-"));
  const mixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgm-mix-"));
  const textDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgm-text-"));
  const bothDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgm-both-"));
  const sentenceDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgm-sentence-"));
  const swiftDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgm-swift-"));
  const swiftTextDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgm-swift-text-"));
  const dirs = [passDir, fixDir, holdDir, mixDir, textDir, bothDir, sentenceDir, swiftDir, swiftTextDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <div role="radiogroup" data-sg-mix aria-label="View">
      <button type="button" role="radio" aria-label="List view"><svg /></button>
      <button type="button" role="radio" aria-label="Grid view"><svg /></button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div role="radiogroup" aria-label="View">
      <p>Prefer using either text or images — not a mix of both — in a single segmented control.</p>
      <button type="button" role="radio" aria-label="List view"><svg /></button>
      <button type="button" role="radio" aria-label="Grid view"><svg /></button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origMix = `export function HostWidgets() {
  return (
    <div role="radiogroup" aria-label="Span">
      <button type="button" role="radio">Day</button>
      <button type="button" role="radio" aria-label="Week"><svg /></button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(mixDir, "HostWidgets.tsx"), origMix);
    const origText = `export function HostWidgets() {
  return (
    <div role="radiogroup" aria-label="Span">
      <button type="button" role="radio">Day</button>
      <button type="button" role="radio">Week</button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(textDir, "HostWidgets.tsx"), origText);
    const origBoth = `export function HostWidgets() {
  return (
    <div role="radiogroup" aria-label="Span">
      <button type="button" role="radio">Day <svg /></button>
      <button type="button" role="radio">Week <svg /></button>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(bothDir, "HostWidgets.tsx"), origBoth);
    const origSentence = `export function HostWidgets() {
  return <p>Prefer using either text or images — not a mix of both — in a single segmented control.</p>;
}
`;
    fs.writeFileSync(path.join(sentenceDir, "HostWidgets.tsx"), origSentence);
    const origSwift = `export function HostWidgets() {
  Picker("Span", selection: $mode) {
    Text("Day").tag(0)
    Image("week").tag(1)
  }
  .pickerStyle(.segmented)
}
`;
    fs.writeFileSync(path.join(swiftDir, "HostWidgets.tsx"), origSwift);
    const origSwiftText = `export function HostWidgets() {
  Picker("Span", selection: $mode) {
    Text("Day").tag(0)
    Text("Week").tag(1)
  }
  .pickerStyle(.segmented)
}
`;
    fs.writeFileSync(path.join(swiftTextDir, "HostWidgets.tsx"), origSwiftText);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const mixReport = run(mixDir);
    const textReport = run(textDir);
    const bothReport = run(bothDir);
    const sentenceReport = run(sentenceDir);
    const swiftReport = run(swiftDir);
    const swiftTextReport = run(swiftTextDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const mixStatus = readStatus(mixDir);
    const textStatus = readStatus(textDir);
    const bothStatus = readStatus(bothDir);
    const sentenceStatus = readStatus(sentenceDir);
    const swiftStatus = readStatus(swiftDir);
    const swiftTextStatus = readStatus(swiftTextDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const mix = fs.readFileSync(path.join(mixDir, "HostWidgets.tsx"), "utf8");
    const text = fs.readFileSync(path.join(textDir, "HostWidgets.tsx"), "utf8");
    const both = fs.readFileSync(path.join(bothDir, "HostWidgets.tsx"), "utf8");
    const sentence = fs.readFileSync(path.join(sentenceDir, "HostWidgets.tsx"), "utf8");
    const swift = fs.readFileSync(path.join(swiftDir, "HostWidgets.tsx"), "utf8");
    const swiftText = fs.readFileSync(path.join(swiftTextDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      mixChrome: mixReport.chrome.pass === true,
      textChrome: textReport.chrome.pass === true,
      bothChrome: bothReport.chrome.pass === true,
      sentenceChrome: sentenceReport.chrome.pass === true,
      swiftChrome: swiftReport.chrome.pass === true,
      swiftTextChrome: swiftTextReport.chrome.pass === true,
      passButtons: passStatus.topics.buttons?.state === "already-compliant",
      passSegments: passStatus.topics["segmented-controls"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixButtons: fixStatus.topics.buttons?.state === "applied",
      systemKept: /aria-label="List view"/.test(fixed),
      markersGone: !/data-sg-mix\b/.test(fixed),
      holdUnchanged: held === origHold,
      holdButtons: holdStatus.topics.buttons?.state === "pending",
      holdStillPhrase: /not a mix of both/.test(held),
      mixUnchanged: mix === origMix,
      mixButtons: mixStatus.topics.buttons?.state === "pending",
      mixKept: />Day</.test(mix) && /<svg \/>/.test(mix),
      textUnchanged: text === origText,
      textButtons: textStatus.topics.buttons?.state === "already-compliant",
      bothUnchanged: both === origBoth,
      bothButtons: bothStatus.topics.buttons?.state === "already-compliant",
      sentenceUnchanged: sentence === origSentence,
      sentenceButtons: sentenceStatus.topics.buttons?.state === "already-compliant",
      swiftUnchanged: swift === origSwift,
      swiftButtons: swiftStatus.topics.buttons?.state === "pending",
      swiftKept: /Image\("week"\)/.test(swift),
      swiftTextUnchanged: swiftText === origSwiftText,
      swiftTextButtons: swiftTextStatus.topics.buttons?.state === "already-compliant",
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passButtons: passStatus.topics.buttons?.state,
      passSegments: passStatus.topics["segmented-controls"]?.state,
      fixButtons: fixStatus.topics.buttons?.state,
      holdButtons: holdStatus.topics.buttons?.state,
      mixButtons: mixStatus.topics.buttons?.state,
      textButtons: textStatus.topics.buttons?.state,
      bothButtons: bothStatus.topics.buttons?.state,
      sentenceButtons: sentenceStatus.topics.buttons?.state,
      swiftButtons: swiftStatus.topics.buttons?.state,
      swiftTextButtons: swiftTextStatus.topics.buttons?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-segment-mix-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ixb-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ixb-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ixb-hold-"));
  const pairDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ixb-pair-"));
  const indexDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ixb-index-"));
  const discDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ixb-disc-"));
  const sentenceDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ixb-sentence-"));
  const kitDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-ixb-kit-"));
  const dirs = [passDir, fixDir, holdDir, pairDir, indexDir, discDir, sentenceDir, kitDir];
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <ul data-ix-both>
      <li>Inbox</li>
    </ul>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <ul>
      <li>Inbox</li>
      <p>Avoid adding an index to a table that displays controls — like disclosure indicators — in the trailing ends of its rows.</p>
    </ul>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const origPair = `export function HostWidgets() {
  return (
    <ul data-section-index>
      <li data-disclosure-indicator>Inbox</li>
    </ul>
  );
}
`;
    fs.writeFileSync(path.join(pairDir, "HostWidgets.tsx"), origPair);
    const origIndex = `export function HostWidgets() {
  return (
    <ul data-section-index>
      <li>Inbox</li>
    </ul>
  );
}
`;
    fs.writeFileSync(path.join(indexDir, "HostWidgets.tsx"), origIndex);
    const origDisc = `export function HostWidgets() {
  return (
    <ul>
      <li data-disclosure-indicator>Inbox</li>
    </ul>
  );
}
`;
    fs.writeFileSync(path.join(discDir, "HostWidgets.tsx"), origDisc);
    const origSentence = `export function HostWidgets() {
  return <p>Avoid adding an index to a table that displays controls — like disclosure indicators — in the trailing ends of its rows.</p>;
}
`;
    fs.writeFileSync(path.join(sentenceDir, "HostWidgets.tsx"), origSentence);
    const origKit = `export function HostWidgets() {
  sectionIndexTitles = ["A", "B"]
  cell.accessoryType = .disclosureIndicator
}
`;
    fs.writeFileSync(path.join(kitDir, "HostWidgets.tsx"), origKit);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const pairReport = run(pairDir);
    const indexReport = run(indexDir);
    const discReport = run(discDir);
    const sentenceReport = run(sentenceDir);
    const kitReport = run(kitDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const pairStatus = readStatus(pairDir);
    const indexStatus = readStatus(indexDir);
    const discStatus = readStatus(discDir);
    const sentenceStatus = readStatus(sentenceDir);
    const kitStatus = readStatus(kitDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const pair = fs.readFileSync(path.join(pairDir, "HostWidgets.tsx"), "utf8");
    const index = fs.readFileSync(path.join(indexDir, "HostWidgets.tsx"), "utf8");
    const disc = fs.readFileSync(path.join(discDir, "HostWidgets.tsx"), "utf8");
    const sentence = fs.readFileSync(path.join(sentenceDir, "HostWidgets.tsx"), "utf8");
    const kit = fs.readFileSync(path.join(kitDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      pairChrome: pairReport.chrome.pass === true,
      indexChrome: indexReport.chrome.pass === true,
      discChrome: discReport.chrome.pass === true,
      sentenceChrome: sentenceReport.chrome.pass === true,
      kitChrome: kitReport.chrome.pass === true,
      passLists: passStatus.topics["lists-and-tables"]?.state === "already-compliant",
      passSplit: passStatus.topics["split-views"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixLists: fixStatus.topics["lists-and-tables"]?.state === "applied",
      rowKept: />\s*Inbox\s*</.test(fixed),
      markersGone: !/data-ix-both(?![\w-])/.test(fixed),
      holdUnchanged: held === origHold,
      holdLists: holdStatus.topics["lists-and-tables"]?.state === "pending",
      holdStillPhrase: /adding an index to a table that displays controls/.test(held),
      pairUnchanged: pair === origPair,
      pairLists: pairStatus.topics["lists-and-tables"]?.state === "pending",
      pairKept: /data-section-index/.test(pair) && /data-disclosure-indicator/.test(pair),
      indexUnchanged: index === origIndex,
      indexLists: indexStatus.topics["lists-and-tables"]?.state === "already-compliant",
      discUnchanged: disc === origDisc,
      discLists: discStatus.topics["lists-and-tables"]?.state === "already-compliant",
      sentenceUnchanged: sentence === origSentence,
      sentenceLists: sentenceStatus.topics["lists-and-tables"]?.state === "already-compliant",
      kitUnchanged: kit === origKit,
      kitLists: kitStatus.topics["lists-and-tables"]?.state === "pending",
      kitKept: /sectionIndexTitles/.test(kit) && /disclosureIndicator/.test(kit),
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passLists: passStatus.topics["lists-and-tables"]?.state,
      passSplit: passStatus.topics["split-views"]?.state,
      fixLists: fixStatus.topics["lists-and-tables"]?.state,
      holdLists: holdStatus.topics["lists-and-tables"]?.state,
      pairLists: pairStatus.topics["lists-and-tables"]?.state,
      indexLists: indexStatus.topics["lists-and-tables"]?.state,
      discLists: discStatus.topics["lists-and-tables"]?.state,
      sentenceLists: sentenceStatus.topics["lists-and-tables"]?.state,
      kitLists: kitStatus.topics["lists-and-tables"]?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-index-beside-disclosure-donts", ok, ...detail });
}

{
  let ok = false;
  let detail = {};
  const passDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgc-pass-"));
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgc-fix-"));
  const holdDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgc-hold-"));
  const eightDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgc-eight-"));
  const sevenDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgc-seven-"));
  const sentenceDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgc-sentence-"));
  const swiftDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgc-swift-"));
  const swiftSevenDir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-apply-sgc-swift-seven-"));
  const dirs = [passDir, fixDir, holdDir, eightDir, sevenDir, sentenceDir, swiftDir, swiftSevenDir];
  const buttons = (labels) =>
    labels.map((label) => `      <button type="button" role="radio">${label}</button>`).join("\n");
  const tags = (labels) =>
    labels.map((label, i) => `    Text("${label}").tag(${i})`).join("\n");
  try {
    const src = path.join(pluginRoot, "eval", "fixtures", "chrome-pass");
    for (const dir of dirs) fs.cpSync(src, dir, { recursive: true });
    const marked = `export function HostWidgets() {
  return (
    <div role="radiogroup" data-sg-count aria-label="Span">
${buttons(["A", "B"])}
    </div>
  );
}
`;
    fs.writeFileSync(path.join(fixDir, "HostWidgets.tsx"), marked);
    const origHold = `export function HostWidgets() {
  return (
    <div role="radiogroup" aria-label="Span">
      <p>Aim for no more than about five to seven segments in a wide interface.</p>
${buttons(["A", "B"])}
    </div>
  );
}
`;
    fs.writeFileSync(path.join(holdDir, "HostWidgets.tsx"), origHold);
    const eightLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const sevenLabels = eightLabels.slice(0, 7);
    const origEight = `export function HostWidgets() {
  return (
    <div role="radiogroup" aria-label="Span">
${buttons(eightLabels)}
    </div>
  );
}
`;
    fs.writeFileSync(path.join(eightDir, "HostWidgets.tsx"), origEight);
    const origSeven = `export function HostWidgets() {
  return (
    <div role="radiogroup" aria-label="Span">
${buttons(sevenLabels)}
    </div>
  );
}
`;
    fs.writeFileSync(path.join(sevenDir, "HostWidgets.tsx"), origSeven);
    const origSentence = `export function HostWidgets() {
  return <p>Aim for no more than about five to seven segments in a wide interface.</p>;
}
`;
    fs.writeFileSync(path.join(sentenceDir, "HostWidgets.tsx"), origSentence);
    const origSwift = `export function HostWidgets() {
  Picker("Span", selection: $mode) {
${tags(eightLabels)}
  }
  .pickerStyle(.segmented)
}
`;
    fs.writeFileSync(path.join(swiftDir, "HostWidgets.tsx"), origSwift);
    const origSwiftSeven = `export function HostWidgets() {
  Picker("Span", selection: $mode) {
${tags(sevenLabels)}
  }
  .pickerStyle(.segmented)
}
`;
    fs.writeFileSync(path.join(swiftSevenDir, "HostWidgets.tsx"), origSwiftSeven);
    const passFiles = [
      "CohesiveForm.tsx",
      "CompactListBrowser.tsx",
      "SystemNav.tsx",
      "CollapsibleSidebar.tsx",
    ];
    const origPass = Object.fromEntries(
      passFiles.map((name) => [name, fs.readFileSync(path.join(src, name), "utf8")]),
    );
    const run = (cwd) => applyCatalog({ cwd, skillRoot, register: "product", write: true });
    const passReport = run(passDir);
    const fixReport = run(fixDir);
    const holdReport = run(holdDir);
    const eightReport = run(eightDir);
    const sevenReport = run(sevenDir);
    const sentenceReport = run(sentenceDir);
    const swiftReport = run(swiftDir);
    const swiftSevenReport = run(swiftSevenDir);
    const readStatus = (dir) =>
      parseCatalogStatus(fs.readFileSync(path.join(dir, ".hig", "catalog-status.yaml"), "utf8"));
    const passStatus = readStatus(passDir);
    const fixStatus = readStatus(fixDir);
    const holdStatus = readStatus(holdDir);
    const eightStatus = readStatus(eightDir);
    const sevenStatus = readStatus(sevenDir);
    const sentenceStatus = readStatus(sentenceDir);
    const swiftStatus = readStatus(swiftDir);
    const swiftSevenStatus = readStatus(swiftSevenDir);
    const fixed = fs.readFileSync(path.join(fixDir, "HostWidgets.tsx"), "utf8");
    const held = fs.readFileSync(path.join(holdDir, "HostWidgets.tsx"), "utf8");
    const eight = fs.readFileSync(path.join(eightDir, "HostWidgets.tsx"), "utf8");
    const seven = fs.readFileSync(path.join(sevenDir, "HostWidgets.tsx"), "utf8");
    const sentence = fs.readFileSync(path.join(sentenceDir, "HostWidgets.tsx"), "utf8");
    const swift = fs.readFileSync(path.join(swiftDir, "HostWidgets.tsx"), "utf8");
    const swiftSeven = fs.readFileSync(path.join(swiftSevenDir, "HostWidgets.tsx"), "utf8");
    const hostText = dirs.flatMap((dir) => walkSource(dir)).map((f) => f.text).join("\n");
    const destUnchanged = passFiles.every(
      (name) => fs.readFileSync(path.join(passDir, name), "utf8") === origPass[name],
    );
    const checks = {
      requiredIds: loadSurfaces(skillRoot).requiredIds.length === 12,
      passChrome: passReport.chrome.pass === true,
      fixChrome: fixReport.chrome.pass === true,
      holdChrome: holdReport.chrome.pass === true,
      eightChrome: eightReport.chrome.pass === true,
      sevenChrome: sevenReport.chrome.pass === true,
      sentenceChrome: sentenceReport.chrome.pass === true,
      swiftChrome: swiftReport.chrome.pass === true,
      swiftSevenChrome: swiftSevenReport.chrome.pass === true,
      passButtons: passStatus.topics.buttons?.state === "already-compliant",
      passSegments: passStatus.topics["segmented-controls"]?.state === "already-compliant",
      passPrinciples: passStatus.topics["design-principles"]?.state === "pending",
      remaining: passReport.plan.coverage.remaining > 0,
      destUnchanged,
      wavePrinciples: passReport.plan.waveTopicIds.includes("design-principles"),
      fixButtons: fixStatus.topics.buttons?.state === "applied",
      segmentKept: />\s*A\s*</.test(fixed) && />\s*B\s*</.test(fixed),
      markersGone: !/data-sg-count(?![\w-])/.test(fixed),
      holdUnchanged: held === origHold,
      holdButtons: holdStatus.topics.buttons?.state === "pending",
      holdStillPhrase: /no more than about five to seven segments/.test(held),
      eightUnchanged: eight === origEight,
      eightButtons: eightStatus.topics.buttons?.state === "pending",
      eightKept: />\s*A\s*</.test(eight) && />\s*H\s*</.test(eight),
      sevenUnchanged: seven === origSeven,
      sevenButtons: sevenStatus.topics.buttons?.state === "already-compliant",
      sentenceUnchanged: sentence === origSentence,
      sentenceButtons: sentenceStatus.topics.buttons?.state === "already-compliant",
      swiftUnchanged: swift === origSwift,
      swiftButtons: swiftStatus.topics.buttons?.state === "pending",
      swiftKept: /Text\("H"\)/.test(swift),
      swiftSevenUnchanged: swiftSeven === origSwiftSeven,
      swiftSevenButtons: swiftSevenStatus.topics.buttons?.state === "already-compliant",
      holdPrinciples: holdStatus.topics["design-principles"]?.state === "pending",
      holdRemaining: holdReport.plan.coverage.remaining > 0,
      noKit: !/SF Pro|-apple-system|shadcn/i.test(hostText),
    };
    ok = Object.values(checks).every(Boolean);
    detail = {
      passButtons: passStatus.topics.buttons?.state,
      passSegments: passStatus.topics["segmented-controls"]?.state,
      fixButtons: fixStatus.topics.buttons?.state,
      holdButtons: holdStatus.topics.buttons?.state,
      eightButtons: eightStatus.topics.buttons?.state,
      sevenButtons: sevenStatus.topics.buttons?.state,
      sentenceButtons: sentenceStatus.topics.buttons?.state,
      swiftButtons: swiftStatus.topics.buttons?.state,
      swiftSevenButtons: swiftSevenStatus.topics.buttons?.state,
      remaining: passReport.plan.coverage.remaining,
      fixed,
      checks,
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  } finally {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "catalog-apply-segment-count-donts", ok, ...detail });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
