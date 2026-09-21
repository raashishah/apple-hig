/**
 * Live Apple HIG article catalog: extract, classify, parse, select.
 * Inventory only. Round-1 apply stays surfaces.yaml requiredIds.
 */

import fs from "node:fs";
import path from "node:path";
import { gateMatches } from "./load-surfaces.mjs";

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

export function designRule(title) {
  return {
    failWhen: `When this topic applies, the host UI does not follow Apple's ${title} design rule.`,
    passWhen: `When this topic applies, the host follows Apple's ${title} design rule on existing widgets without changing the typeface or injecting a kit.`,
  };
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
  const byId = Object.fromEntries(doc.topics.map((t) => [t.id, t]));
  return { ...doc, byId, catalogPath, count: doc.topics.length };
}
