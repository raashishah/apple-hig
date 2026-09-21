/**
 * Live Apple HIG article catalog: extract, classify, parse, select, plan waves.
 * Wave 0 apply stays surfaces.yaml requiredIds until chrome P0 is clean.
 */

import fs from "node:fs";
import path from "node:path";
import { loadChromeGrammar } from "./load-chrome-grammar.mjs";
import { gateMatches, loadSurfaces } from "./load-surfaces.mjs";
import { loadDontHeuristics, matchHeuristic } from "./dont-heuristics.mjs";

export const CATALOG_SOURCE_URL =
  "https://developer.apple.com/tutorials/data/index/design--human-interface-guidelines";
export const APPLE_HIG_PREFIX = "https://developer.apple.com/design/human-interface-guidelines/";

const WATCH_SLUGS = new Set([
  "designing-for-watchos",
  "complications",
  "watch-faces",
  "digital-crown",
  "activity-rings",
]);
const TV_SLUGS = new Set(["designing-for-tvos", "top-shelf", "remotes"]);
const VISION_SLUGS = new Set([
  "designing-for-visionos",
  "immersive-experiences",
  "spatial-layout",
  "ornaments",
  "eyes",
]);
const SLUG_GATE = {
  "design-principles": "always",
  "designing-for-ios": "phone",
  "designing-for-ipados": "ipad",
  "designing-for-macos": "desktop",
  "designing-for-games": "games",
  "designing-for-iphone-duo": "duo,capability:duo",
  "apple-pencil-and-scribble": "ipad+capability:pencil",
  "game-controls": "games,capability:games",
  healthkit: "capability:healthkit",
  "apple-pay": "capability:applepay",
  "sign-in-with-apple": "capability:signinwithapple",
  siri: "capability:siri",
  "app-shortcuts": "capability:siri",
  "game-center": "capability:gamecenter",
  carplay: "capability:carplay",
  maps: "capability:mapkit",
  "apple-in-app-purchase": "capability:iap",
  wallet: "capability:wallet",
  "tap-to-pay-on-iphone": "capability:taptopay",
  nfc: "capability:nfc",
  "id-verifier": "capability:idverifier",
  carekit: "capability:carekit",
  researchkit: "capability:researchkit",
  icloud: "capability:icloud",
  shareplay: "capability:shareplay",
  airplay: "capability:airplay",
  homekit: "capability:homekit",
  "live-photos": "capability:photos",
  "photo-editing": "capability:photos",
  shazamkit: "capability:shazam",
  "generative-ai": "capability:genai",
  "machine-learning": "capability:coreml",
  "augmented-reality": "capability:arkit",
  "mac-catalyst": "capability:maccatalyst",
  "always-on": "capability:alwayson",
  "app-clips": "capability:appclips",
  "imessage-apps-and-stickers": "capability:imessage",
  voiceover: "capability:voiceover",
  widgets: "capability:widgets",
  "live-activities": "capability:liveactivities",
  controls: "capability:controlcenter",
  "action-button": "phone",
  "camera-control": "phone",
  "the-menu-bar": "desktop",
  "dock-menus": "desktop",
  "column-views": "desktop",
  "outline-views": "desktop",
  "path-controls": "desktop",
  "color-wells": "desktop",
  "combo-boxes": "desktop",
  "image-wells": "desktop",
  windows: "desktop",
  panels: "desktop",
};

export function slugFromPath(p) {
  if (!p) return "";
  const trimmed = String(p).replace(/\/+$/, "");
  const slash = trimmed.lastIndexOf("/");
  return slash >= 0 ? trimmed.slice(slash + 1) : trimmed;
}

export function extractArticles(index) {
  const root = index?.interfaceLanguages?.swift;
  const start = Array.isArray(root) ? root : root ? [root] : [];
  const articles = [];
  const seen = new Set();

  const walk = (node, group) => {
    if (!node || typeof node !== "object") return;
    const nextGroup =
      (node.type === "collection" || node.type === "module") && node.title
        ? node.title
        : group;
    if (node.type === "article" && node.path) {
      const slug = slugFromPath(node.path);
      if (slug && !seen.has(slug)) {
        seen.add(slug);
        articles.push({
          id: slug,
          title: node.title || slug,
          group: group || nextGroup || "Ungrouped",
          path: node.path,
        });
      }
    }
    const kids = node.children;
    if (Array.isArray(kids)) {
      for (const child of kids) walk(child, nextGroup);
    }
  };

  for (const node of start) walk(node, null);
  articles.sort((a, b) => a.id.localeCompare(b.id));
  return articles;
}

export function inferAppliesWhen(slug, surface) {
  if (surface?.gate) return surface.gate;
  if (SLUG_GATE[slug]) return SLUG_GATE[slug];
  if (WATCH_SLUGS.has(slug)) return "watch";
  if (TV_SLUGS.has(slug)) return "tv";
  if (VISION_SLUGS.has(slug)) return "vision";
  return "always";
}

export const CATALOG_FRAME_OR_FONT =
  /\b(SwiftUI|UIKit|React|Flutter|Vue|Angular|Svelte|SF Pro|San Francisco|-apple-system)\b/i;

export function designRule(title) {
  return {
    failWhen: `When this topic applies, the host UI does not follow Apple's ${title} design rule.`,
    passWhen: `When this topic applies, the host follows Apple's ${title} design rule on existing widgets without changing the typeface or injecting a kit.`,
  };
}

export function isTitleStub(topic) {
  if (!topic?.title || !topic?.failWhen) return false;
  return topic.failWhen === designRule(topic.title).failWhen;
}

export function parsePackDoDont(text) {
  const doBullets = [];
  const dontBullets = [];
  let mode = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (/^##\s+Don't\b/i.test(line)) {
      mode = "dont";
      continue;
    }
    if (/^##\s+Do\b/i.test(line)) {
      mode = "do";
      continue;
    }
    if (/^##\s+/.test(line)) {
      mode = null;
      continue;
    }
    const bullet = line.match(/^-\s+(.+)$/);
    if (!mode || !bullet) continue;
    const item = bullet[1].replace(/\s+/g, " ").trim();
    if (!item || item.startsWith("[ ]") || item.startsWith("[x]")) continue;
    if (CATALOG_FRAME_OR_FONT.test(item)) continue;
    if (/\b(web-css|brand-veto|fixture)\b/i.test(item)) continue;
    if (mode === "do") doBullets.push(item);
    else dontBullets.push(item);
  }
  return { do: doBullets, dont: dontBullets };
}

export function parsePackChromeGates(text) {
  const ids = [];
  let inGates = false;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (/^##\s+Chrome gates\b/i.test(line)) {
      inGates = true;
      continue;
    }
    if (/^##\s+/.test(line)) {
      inGates = false;
      continue;
    }
    if (!inGates) continue;
    const m = line.match(/`(chrome\.[a-z0-9.-]+)`/);
    if (m) ids.push(m[1]);
  }
  return [...new Set(ids)];
}

export function parseDontCodeTokens(text) {
  const { dont } = parsePackDoDont(text);
  const tokens = [];
  for (const bullet of dont) {
    const re = /`([^`]+)`/g;
    let m;
    while ((m = re.exec(bullet))) {
      const tok = m[1].trim();
      if (tok.length < 6) continue;
      if (CATALOG_FRAME_OR_FONT.test(tok)) continue;
      tokens.push(tok);
    }
  }
  return [...new Set(tokens)];
}

export function applyDontToken(text, tok) {
  let next = text;
  if (/scaleX\(\s*-1\s*\)/.test(tok)) {
    next = next.replace(/transform\s*:\s*scaleX\(\s*-1\s*\)\s*;?/gi, "");
    next = next.replace(/scaleX\(\s*-1\s*\)/g, "none");
  }
  if (/UIDesignRequiresCompatibility/.test(tok)) {
    next = next.replace(/^[^\n]*UIDesignRequiresCompatibility[^\n]*\n?/gm, "");
  }
  if (/dir=["']auto["']/.test(tok)) {
    next = next.replace(/\sdir=["']auto["']/gi, ' dir="ltr"');
  }
  if (tok === "margin-left") {
    next = next.replace(/margin-left\s*:/gi, "margin-inline-start:");
  }
  if (tok === "margin-right") {
    next = next.replace(/margin-right\s*:/gi, "margin-inline-end:");
  }
  if (tok === "padding-left") {
    next = next.replace(/padding-left\s*:/gi, "padding-inline-start:");
  }
  if (tok === "padding-right") {
    next = next.replace(/padding-right\s*:/gi, "padding-inline-end:");
  }
  return next;
}

function uniqueJoin(parts) {
  const seen = new Set();
  const out = [];
  for (const part of parts) {
    const text = String(part || "").replace(/\s+/g, " ").trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out.join(" ");
}

export function deriveTopicRule(topic, { surfaces, grammar, packCache, heuristics, bySlug }) {
  const stub = designRule(topic.title);
  const index = bySlug || surfaceIndex(surfaces);
  const surface =
    index.get(topic.id) ||
    (topic.surfaceId ? surfaces?.byId?.[topic.surfaceId] : null);
  const chromeIds = [];
  const failParts = [];
  const passParts = [];

  if (surface?.pack && grammar) {
    const stem = String(surface.pack).replace(/\.md$/, "");
    const fromPack = grammar.byPack?.[stem] || [];
    for (const id of fromPack) {
      const rule = grammar.byId?.[id];
      if (!rule) continue;
      chromeIds.push(id);
      failParts.push(rule.failWhen);
      passParts.push(rule.passWhen);
    }
    for (const rule of grammar.rules || []) {
      if (slugFromPath(rule.appleUrl) !== topic.id) continue;
      if (chromeIds.includes(rule.id)) continue;
      chromeIds.push(rule.id);
      failParts.push(rule.failWhen);
      passParts.push(rule.passWhen);
    }
    const packText = packCache?.[surface.pack];
    if (packText) {
      const { do: doBullets, dont } = parsePackDoDont(packText);
      failParts.push(...dont);
      passParts.push(...doBullets);
      for (const id of parsePackChromeGates(packText)) {
        const rule = grammar.byId?.[id];
        if (!rule || chromeIds.includes(id)) continue;
        chromeIds.push(id);
        failParts.push(rule.failWhen);
        passParts.push(rule.passWhen);
      }
    }
  }

  const failWhen = failParts.length ? uniqueJoin(failParts) : stub.failWhen;
  let passWhen = passParts.length ? uniqueJoin(passParts) : stub.passWhen;
  if (!/typeface|injecting a kit/i.test(passWhen)) {
    passWhen = `${passWhen} Host typeface stays. Do not inject a kit.`;
  }
  const derived = { ...topic, failWhen, passWhen };
  if (surface?.id) derived.surfaceId = surface.id;
  if (surface?.pack) derived.pack = surface.pack;
  if (chromeIds.length) derived.chromeIds = [...new Set(chromeIds)];
  const packForTokens = surface?.pack ? packCache?.[surface.pack] : "";
  const dontTokens = packForTokens ? parseDontCodeTokens(packForTokens) : [];
  if (dontTokens.length) derived.dontTokens = dontTokens;
  if (packForTokens) {
    const { dont } = parsePackDoDont(packForTokens);
    const ids = [];
    let unmatched = 0;
    for (const bullet of dont) {
      const h = matchHeuristic(bullet, heuristics || []);
      if (h) ids.push(h.id);
      else unmatched += 1;
    }
    derived.dontCount = dont.length;
    if (ids.length) derived.dontHeuristicIds = [...new Set(ids)];
    derived.dontCoverageComplete = dont.length > 0 && unmatched === 0;
  }
  return derived;
}

export function surfaceIndex(surfaces) {
  const bySlug = new Map();
  const required = new Set(surfaces.requiredIds || []);
  for (const s of surfaces.surfaces || []) {
    const urls = [s.appleUrl, ...(s.also || [])].filter(Boolean);
    for (const url of urls) {
      const slug = slugFromPath(url);
      if (!slug) continue;
      const prev = bySlug.get(slug);
      if (!prev) {
        bySlug.set(slug, s);
        continue;
      }
      if (required.has(s.id) && !required.has(prev.id)) {
        bySlug.set(slug, s);
      }
    }
  }
  return bySlug;
}

export function buildCatalog({ index, surfaces, fetched }) {
  const articles = extractArticles(index);
  const bySurface = surfaceIndex(surfaces);
  const topics = articles.map((a) => {
    const surface = bySurface.get(a.id);
    const rule = designRule(a.title);
    const topic = {
      id: a.id,
      title: a.title,
      group: a.group,
      appleUrl: `${APPLE_HIG_PREFIX}${a.id}`,
      appliesWhen: inferAppliesWhen(a.id, surface),
      failWhen: rule.failWhen,
      passWhen: rule.passWhen,
    };
    if (surface?.id) topic.surfaceId = surface.id;
    if (surface?.pack) topic.pack = surface.pack;
    return topic;
  });
  return {
    version: 1,
    sourceUrl: CATALOG_SOURCE_URL,
    fetched,
    topics,
  };
}

function yamlScalar(value) {
  return JSON.stringify(String(value));
}

export function stringifyCatalog(doc) {
  const lines = [
    "version: 1",
    `# Snapshot of Apple HIG articles. Refresh with scripts/sync-hig-catalog.mjs.`,
    `# Not the round-1 apply catalog. Apply SSOT remains surfaces.yaml requiredIds.`,
    `sourceUrl: ${yamlScalar(doc.sourceUrl)}`,
    `fetched: ${yamlScalar(doc.fetched)}`,
    "topics:",
  ];
  for (const t of doc.topics) {
    lines.push(`  - id: ${t.id}`);
    lines.push(`    title: ${yamlScalar(t.title)}`);
    lines.push(`    group: ${yamlScalar(t.group)}`);
    lines.push(`    appleUrl: ${yamlScalar(t.appleUrl)}`);
    lines.push(`    appliesWhen: ${yamlScalar(t.appliesWhen)}`);
    lines.push(`    failWhen: ${yamlScalar(t.failWhen)}`);
    lines.push(`    passWhen: ${yamlScalar(t.passWhen)}`);
    if (t.surfaceId) lines.push(`    surfaceId: ${yamlScalar(t.surfaceId)}`);
    if (t.pack) lines.push(`    pack: ${yamlScalar(t.pack)}`);
  }
  return lines.join("\n") + "\n";
}

export function parseCatalog(text) {
  const doc = { version: null, sourceUrl: null, fetched: null, topics: [] };
  let current = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/\t/g, "  ");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const version = line.match(/^version:\s*(\d+)\s*$/);
    if (version) {
      doc.version = Number(version[1]);
      continue;
    }
    const src = line.match(/^sourceUrl:\s*(.+)\s*$/);
    if (src) {
      doc.sourceUrl = unquote(src[1]);
      continue;
    }
    const fetched = line.match(/^fetched:\s*(.+)\s*$/);
    if (fetched) {
      doc.fetched = unquote(fetched[1]);
      continue;
    }
    if (/^topics:\s*$/.test(line)) continue;
    const start = line.match(/^\s*-\s+id:\s*(.+)\s*$/);
    if (start) {
      current = { id: unquote(start[1]) };
      doc.topics.push(current);
      continue;
    }
    if (!current) continue;
    const kv = line.match(/^\s{4}([A-Za-z]+):\s*(.*)$/);
    if (!kv) continue;
    current[kv[1]] = unquote(kv[2]);
  }
  return doc;
}

function unquote(raw) {
  const v = String(raw).trim();
  if (v.startsWith('"') && v.endsWith('"')) {
    return JSON.parse(v);
  }
  return v;
}

export function validateCatalog(doc) {
  if (doc.version !== 1) throw new Error(`unsupported catalog version: ${doc.version}`);
  if (!Array.isArray(doc.topics) || doc.topics.length === 0) {
    throw new Error("catalog has no topics");
  }
  const seen = new Set();
  for (const t of doc.topics) {
    if (!t.id || !t.appleUrl || !t.appliesWhen || !t.failWhen || !t.passWhen) {
      throw new Error(`incomplete catalog topic: ${JSON.stringify(t)}`);
    }
    if (seen.has(t.id)) throw new Error(`duplicate catalog id: ${t.id}`);
    seen.add(t.id);
  }
}

export function selectCatalog(doc, preflight) {
  const applicable = [];
  const skipped = [];
  for (const topic of doc.topics) {
    if (gateMatches(topic.appliesWhen, preflight)) {
      applicable.push(topic);
    } else {
      skipped.push({ ...topic, skipReason: "gate-mismatch" });
    }
  }
  return { applicable, skipped };
}

export function loadCatalog(skillRoot) {
  const catalogPath = path.join(skillRoot, "knowledge", "catalog.yaml");
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`missing catalog: ${catalogPath}`);
  }
  const doc = parseCatalog(fs.readFileSync(catalogPath, "utf8"));
  validateCatalog(doc);
  const surfaces = loadSurfaces(skillRoot);
  const grammar = loadChromeGrammar(skillRoot);
  const packDir = path.join(skillRoot, "knowledge", "packs");
  const packCache = {};
  for (const surface of surfaces.surfaces || []) {
    if (!surface.pack || packCache[surface.pack]) continue;
    const packPath = path.join(packDir, surface.pack);
    if (fs.existsSync(packPath)) {
      packCache[surface.pack] = fs.readFileSync(packPath, "utf8");
    }
  }
  const heuristics = loadDontHeuristics(skillRoot);
  const bySlug = surfaceIndex(surfaces);
  const topics = doc.topics.map((topic) =>
    deriveTopicRule(topic, { surfaces, grammar, packCache, heuristics, bySlug }),
  );
  const derived = { ...doc, topics };
  validateCatalog(derived);
  const byId = Object.fromEntries(topics.map((t) => [t.id, t]));
  return { ...derived, byId, catalogPath, count: topics.length };
}

const BRAND_NA = new Set(["tab-bars", "tab-views", "split-views", "status-bars"]);

export function catalogStateIsTerminal(state) {
  switch (state) {
    case "applied":
    case "already-compliant":
    case "skipped-gate":
    case "skipped-no-pack":
    case "n/a-register":
    case "skipped-no-affordance":
      return true;
    case "pending":
      return false;
    default: {
      const _exhaustive = state;
      void _exhaustive;
      return false;
    }
  }
}

function countStates(topics) {
  const counts = {
    pending: 0,
    applied: 0,
    "already-compliant": 0,
    "skipped-gate": 0,
    "skipped-no-pack": 0,
    "n/a-register": 0,
    "skipped-no-affordance": 0,
  };
  for (const row of Object.values(topics)) {
    const key = row.state;
    if (counts[key] == null) counts[key] = 0;
    counts[key] += 1;
  }
  return counts;
}

function affordanceMissing(need, present) {
  switch (need) {
    case "list":
    case "form":
    case "overlay":
    case "chrome":
    case "menu":
    case "picker":
    case "progress":
    case "search":
    case "notification":
    case "loading":
    case "feedback":
    case "onboarding":
    case "drag":
    case "settings":
    case "undo":
    case "slider":
    case "scroll":
    case "popover":
    case "collection":
    case "pagecontrol":
    case "label":
    case "textview":
    case "imageview":
    case "chart":
    case "disclosure":
    case "box":
      return !present.includes(need);
    default: {
      const _exhaustive = need;
      void _exhaustive;
      return false;
    }
  }
}

export function scanAffordances(files) {
  const list = files || [];
  const blob = list.map((f) => String(f.text || "")).join("\n");
  const paths = list.map((f) => String(f.path || "")).join("\n");
  const found = [];
  if (
    /<(ul|ol|table)\b/i.test(blob) ||
    /role=["']list["']/i.test(blob) ||
    /data-list-pane/.test(blob) ||
    /\bList\s*[\({]/.test(blob) ||
    /\bLazy(Column|VGrid|HGrid)\b/.test(blob) ||
    /\b(ListView|RecyclerView)\b/.test(blob) ||
    /card-grid|dashboard-cards/.test(blob) ||
    /data-home[\s\S]{0,500}\bcard\b/i.test(blob)
  ) {
    found.push("list");
  }
  if (
    /<form\b/i.test(blob) ||
    /data-form-page/.test(blob) ||
    /<input\b/i.test(blob) ||
    /\b(TextField|SecureField|TextEditor)\s*\(/.test(blob)
  ) {
    found.push("form");
  }
  if (
    /<(dialog)\b/i.test(blob) ||
    /role=["'](dialog|alertdialog)["']/i.test(blob) ||
    /\.sheet\s*\(/.test(blob) ||
    /\bconfirmationDialog\s*\(/.test(blob) ||
    /\bUIAlertController\b/.test(blob)
  ) {
    found.push("overlay");
  }
  if (
    /<(nav|header)\b/i.test(blob) ||
    /data-nav|data-sidebar/.test(blob) ||
    /\b(NavigationSplitView|NavigationStack|NavigationView|TabView)\b/.test(blob) ||
    /\b(UINavigationBar|UITabBar|UIToolbar)\b/.test(blob)
  ) {
    found.push("chrome");
  }
  if (
    /role=["']menu["']/i.test(blob) ||
    /role=["']menuitem/i.test(blob) ||
    /<menu\b/i.test(blob) ||
    /\bMenu\s*\(/.test(blob) ||
    /\bcontextMenu\s*\(/.test(blob) ||
    /aria-haspopup=["']menu["']/i.test(blob) ||
    /\b(UIMenu|NSMenu|UIContextMenuInteraction)\b/.test(blob)
  ) {
    found.push("menu");
  }
  if (
    /<select\b/i.test(blob) ||
    /type=["'](date|time|datetime-local|month|week|color)["']/i.test(blob) ||
    /\b(Picker|DatePicker|Stepper)\s*\(/.test(blob) ||
    /\b(UIPickerView|UIDatePicker|UIStepper|NSDatePicker|NSStepper)\b/.test(blob) ||
    /data-ios-wheel|data-stepper|data-picker-screen|wheel-picker/.test(blob)
  ) {
    found.push("picker");
  }
  if (
    /<progress\b/i.test(blob) ||
    /role=["']progressbar["']/i.test(blob) ||
    /\bProgressView\s*\(/.test(blob) ||
    /\b(UIProgressView|UIActivityIndicatorView|NSProgressIndicator)\b/.test(blob)
  ) {
    found.push("progress");
  }
  if (
    /type=["']search["']/i.test(blob) ||
    /role=["']search["']/i.test(blob) ||
    /\.searchable\b/.test(blob) ||
    /\b(UISearchBar|UISearchController|NSSearchField)\b/.test(blob)
  ) {
    found.push("search");
  }
  if (
    /Notification\.requestPermission/.test(blob) ||
    /Notification\.permission/.test(blob) ||
    /new\s+Notification\s*\(/.test(blob) ||
    /\bUNUserNotificationCenter\b/.test(blob) ||
    /\bUNNotificationRequest\b/.test(blob)
  ) {
    found.push("notification");
  }
  if (
    /aria-busy=/.test(blob) ||
    /redacted\s*\(/.test(blob) ||
    /\.refreshable\b/.test(blob) ||
    /\bUIRefreshControl\b/.test(blob) ||
    /data-skeleton/.test(blob) ||
    /\bskeleton\b/i.test(blob)
  ) {
    found.push("loading");
  }
  if (
    /role=["']status["']/i.test(blob) ||
    /data-toast/.test(blob) ||
    /\.sensoryFeedback\b/.test(blob) ||
    /\bUINotificationFeedbackGenerator\b/.test(blob) ||
    /\bconfetti\b/i.test(blob)
  ) {
    found.push("feedback");
  }
  if (
    /data-onboarding/.test(blob) ||
    /\bOnboarding(View|Screen|Flow)?\b/.test(blob) ||
    /\b(coach-?mark|feature-?tour|first-?run)\b/i.test(blob) ||
    /\bisOnboarding\b/.test(blob)
  ) {
    found.push("onboarding");
  }
  if (
    /\bdraggable\b/i.test(blob) ||
    /\bdropDestination\b/.test(blob) ||
    /\bon(Drop|Drag)\s*\(/.test(blob) ||
    /\b(UIDragInteraction|UIDropInteraction|NSDragging)/.test(blob) ||
    /aria-grabbed/.test(blob) ||
    /data-drop/.test(blob)
  ) {
    found.push("drag");
  }
  if (
    /data-settings/.test(blob) ||
    /\bSettingsLink\b/.test(blob) ||
    /\bSettings\s*[{(]/.test(blob) ||
    /(?:href|to)=["'][^"']*\/(settings|preferences)\b/i.test(blob) ||
    /<(h1|h2)[^>]*>\s*(Settings|Preferences)\s*</i.test(blob) ||
    /(^|\n|\/)(settings|preferences)([./]|$)/im.test(paths) ||
    /Settings(View|Screen|Page|Form)?\.(tsx|jsx|swift|vue|html)\b/i.test(paths)
  ) {
    found.push("settings");
  }
  if (
    /\b(UndoManager|undoManager|NSUndoManager)\b/.test(blob) ||
    /\bregisterUndo\b/.test(blob) ||
    /\bcanUndo\b/.test(blob) ||
    /data-undo/.test(blob) ||
    /aria-label=["']Undo\b/i.test(blob) ||
    />\s*(Undo|Redo)\s*</.test(blob) ||
    /(^|\n|\/)undo([./]|$)/im.test(paths)
  ) {
    found.push("undo");
  }
  if (
    /type=["']range["']/i.test(blob) ||
    /role=["']slider["']/i.test(blob) ||
    /\bSlider\s*\(/.test(blob) ||
    /\b(UISlider|NSSlider)\b/.test(blob) ||
    /data-(volume-)?slider/.test(blob)
  ) {
    found.push("slider");
  }
  if (hasScrollWidget(blob)) {
    found.push("scroll");
  }
  if (
    /<[A-Za-z][\w]*\b[^>]*\spopover(?:\s|=|\/|>)/i.test(blob) ||
    /popover=["']/i.test(blob) ||
    /popovertarget=/i.test(blob) ||
    /data-popover/.test(blob) ||
    /\.popover\s*\(/.test(blob) ||
    /\b(UIPopoverPresentationController|NSPopover)\b/.test(blob)
  ) {
    found.push("popover");
  }
  if (
    /data-collection/.test(blob) ||
    /\b(UICollectionView|NSCollectionView)\b/.test(blob) ||
    /\bLazy(VGrid|HGrid)\b/.test(blob) ||
    /\bCollectionView\s*[\({]/.test(blob)
  ) {
    found.push("collection");
  }
  if (
    /data-page-control/.test(blob) ||
    /data-carousel-dots/.test(blob) ||
    /\bUIPageControl\b/.test(blob) ||
    /\bPageControl\s*[\({]/.test(blob) ||
    /PageTabViewStyle/.test(blob) ||
    /\.tabViewStyle\(\s*\.page/.test(blob)
  ) {
    found.push("pagecontrol");
  }
  if (
    /\bdata-label\b/.test(blob) ||
    /\bUILabel\b/.test(blob) ||
    /\bLabel\s*\(/.test(blob)
  ) {
    found.push("label");
  }
  if (
    /\bdata-text-view\b/.test(blob) ||
    /\bUITextView\b/.test(blob) ||
    /\bNSTextView\b/.test(blob) ||
    /\bTextEditor\s*\(/.test(blob) ||
    /<textarea\b/i.test(blob)
  ) {
    found.push("textview");
  }
  if (
    /\bdata-image-view\b/.test(blob) ||
    /\bUIImageView\b/.test(blob) ||
    /\bNSImageView\b/.test(blob) ||
    /\bAsyncImage\s*\(/.test(blob)
  ) {
    found.push("imageview");
  }
  if (
    /\bdata-chart\b/.test(blob) ||
    /\bChart\s*\(/.test(blob) ||
    /\b(BarMark|LineMark|PointMark|AreaMark|RectMark|RuleMark)\b/.test(blob)
  ) {
    found.push("chart");
  }
  if (
    /\bdata-disclosure\b/.test(blob) ||
    /<details\b/i.test(blob) ||
    /\bDisclosureGroup\s*\(/.test(blob) ||
    /BezelStyle\.(disclosure|pushDisclosure)/.test(blob)
  ) {
    found.push("disclosure");
  }
  if (
    /\bdata-box\b/.test(blob) ||
    /\bNSBox\b/.test(blob) ||
    /\bGroupBox\s*[\({]/.test(blob)
  ) {
    found.push("box");
  }
  return found;
}

function isDocumentScrollSelector(sel) {
  const parts = String(sel || "")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split(",")
    .map((p) => p.trim().split(/\s+/).pop() || "")
    .filter(Boolean);
  if (!parts.length) return false;
  return parts.every((p) => /^(html|body|:root|#root|#__next|#app)$/i.test(p));
}

function overflowAxisFromHint(hint) {
  const h = String(hint || "");
  if (
    /overflow-x(?:-auto|-scroll)\b/i.test(h) ||
    /overflow-x\s*:\s*(auto|scroll)/i.test(h) ||
    /overflowX\s*:\s*["'](auto|scroll)["']/i.test(h)
  ) {
    return "x";
  }
  if (
    /overflow-y(?:-auto|-scroll)\b/i.test(h) ||
    /overflow-y\s*:\s*(auto|scroll)/i.test(h) ||
    /overflowY\s*:\s*["'](auto|scroll)["']/i.test(h)
  ) {
    return "y";
  }
  if (
    /\boverflow-(?:auto|scroll)\b/i.test(h) ||
    /(?:^|[^-])overflow\s*:\s*(auto|scroll)/i.test(h) ||
    /overflow\s*:\s*["'](auto|scroll)["']/i.test(h)
  ) {
    return "both";
  }
  return null;
}

function hasScrollWidget(blob) {
  const text = String(blob || "");
  if (/\bScrollView\s*[\({]/.test(text)) return true;
  if (/\b(UIScrollView|NSScrollView)\b/.test(text)) return true;
  if (/data-scroll-view|data-nested-same-axis-scroll/.test(text)) return true;
  const tagRe = /<([A-Za-z][\w]*)\b([^>]*)>/g;
  let m;
  while ((m = tagRe.exec(text))) {
    const tag = m[1];
    const attrs = m[2] || "";
    if (/^(html|body)$/i.test(tag)) continue;
    const style = /style=["']([^"']*)["']/i.exec(attrs);
    const cls = /class(Name)?=["']([^"']*)["']/i.exec(attrs);
    const hint = `${style ? style[1] : ""} ${cls ? cls[2] : ""} ${attrs}`;
    if (
      !/(?:overflow(?:-(?:x|y))?)\s*:\s*(auto|scroll)/i.test(hint) &&
      !/\boverflow-(?:x-|y-)?(?:auto|scroll)\b/.test(hint) &&
      !/overflow(?:X|Y)?\s*:\s*["'](auto|scroll)["']/i.test(hint)
    ) {
      continue;
    }
    if (overflowAxisFromHint(hint)) return true;
  }
  const cssRe = /([^{]+)\{([^}]*)\}/g;
  while ((m = cssRe.exec(text))) {
    const sel = m[1];
    const body = m[2];
    if (!/overflow(?:-(?:x|y))?\s*:\s*(auto|scroll)/i.test(body)) continue;
    if (isDocumentScrollSelector(sel)) continue;
    return true;
  }
  return false;
}

function inferTopicState(topic, applicableIds, preflight, prevState, surface) {
  if (catalogStateIsTerminal(prevState)) return prevState;
  if (!applicableIds.has(topic.id)) return "skipped-gate";
  if (preflight?.register === "brand" && BRAND_NA.has(topic.id)) return "n/a-register";
  if (!topic.pack && !topic.surfaceId) return "skipped-no-pack";
  if (Array.isArray(preflight?.affordances)) {
    const need = surface?.affordance;
    if (need && affordanceMissing(need, preflight.affordances)) {
      return "skipped-no-affordance";
    }
  }
  return "pending";
}

export function planGoalLoop({ catalog, surfaces, preflight, chromePass, status }) {
  const { applicable } = selectCatalog(catalog, preflight);
  const applicableIds = new Set(applicable.map((t) => t.id));
  const requiredIds = [...(surfaces.requiredIds || [])];
  const topics = {};
  const bySurface = surfaces?.byId || {};
  for (const topic of catalog.topics) {
    const prev = status?.topics?.[topic.id];
    const surface = topic.surfaceId ? bySurface[topic.surfaceId] : null;
    const state = inferTopicState(topic, applicableIds, preflight, prev?.state, surface);
    const row = {
      state,
      surfaceId: topic.surfaceId || null,
      pack: topic.pack || null,
    };
    if (state === "pending") {
      row.failWhen = topic.failWhen;
      row.passWhen = topic.passWhen;
      if (topic.chromeIds?.length) row.chromeIds = topic.chromeIds;
    }
    topics[topic.id] = row;
  }

  const pendingTopics = catalog.topics.filter((t) => topics[t.id].state === "pending");
  let phase;
  let waveSurfaceIds;
  let waveTopicIds;
  if (!chromePass) {
    phase = "chrome";
    waveSurfaceIds = requiredIds;
    waveTopicIds = pendingTopics
      .filter((t) => t.surfaceId && requiredIds.includes(t.surfaceId))
      .map((t) => t.id);
  } else {
    phase = "catalog";
    waveTopicIds = pendingTopics.map((t) => t.id);
    const seen = new Set();
    waveSurfaceIds = [];
    for (const t of pendingTopics) {
      const sid = t.surfaceId || t.id;
      if (seen.has(sid)) continue;
      seen.add(sid);
      waveSurfaceIds.push(sid);
    }
  }

  const counts = countStates(topics);
  const remaining = counts.pending;
  return {
    phase,
    waveSurfaceIds,
    waveTopicIds,
    topics,
    done: Boolean(chromePass) && remaining === 0,
    coverage: {
      loaded: catalog.topics.length,
      applicable: applicable.length,
      ...counts,
      remaining,
    },
  };
}

export function stringifyCatalogStatus(plan, extras = {}) {
  const chromePass = Boolean(extras.chromePass) || plan.phase === "catalog" || plan.done;
  const lines = [
    "version: 1",
    `phase: ${plan.phase}`,
    `chromePass: ${chromePass ? "true" : "false"}`,
    `done: ${plan.done ? "true" : "false"}`,
    `loaded: ${plan.coverage.loaded}`,
    `applicable: ${plan.coverage.applicable}`,
    `remaining: ${plan.coverage.remaining}`,
    "topics:",
  ];
  for (const [id, row] of Object.entries(plan.topics)) {
    lines.push(`  ${id}:`);
    lines.push(`    state: ${row.state}`);
    if (row.surfaceId) lines.push(`    surfaceId: ${row.surfaceId}`);
    if (row.pack) lines.push(`    pack: ${row.pack}`);
  }
  return lines.join("\n") + "\n";
}

export function parseCatalogStatus(text) {
  const topics = {};
  let current = null;
  const doc = { version: null, topics };
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/\t/g, "  ");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const top = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (top && !line.startsWith(" ")) {
      const key = top[1];
      const val = top[2].trim();
      if (key === "topics") continue;
      if (key === "version") doc.version = Number(val);
      else if (val === "true" || val === "false") doc[key] = val === "true";
      else if (/^\d+$/.test(val)) doc[key] = Number(val);
      else doc[key] = val;
      continue;
    }
    const start = line.match(/^\s{2}([A-Za-z0-9-]+):\s*$/);
    if (start) {
      current = start[1];
      topics[current] = { state: "pending", surfaceId: null, pack: null };
      continue;
    }
    if (!current) continue;
    const kv = line.match(/^\s{4}([A-Za-z]+):\s*(.+)$/);
    if (!kv) continue;
    const key = kv[1];
    const val = kv[2].trim();
    if (key === "state" || key === "surfaceId" || key === "pack") topics[current][key] = val;
  }
  return doc;
}
