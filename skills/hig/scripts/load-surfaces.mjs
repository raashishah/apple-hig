#!/usr/bin/env node
/**
 * Load swarm surface map (knowledge/surfaces.yaml).
 * Used by /hig orchestrator and eval/run-swarm.mjs.
 *
 * Optional surfaces use a flat `gate` (`always` | host family |
 * `capability:<token>`). Nested YAML `when:` objects are ignored.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseGate(raw) {
  if (raw == null) return null;
  const g = String(raw).trim();
  if (!g) return null;
  if (g === "always") return { type: "always", raw: g };
  if (g.startsWith("capability:")) {
    const token = g.slice("capability:".length).trim();
    return { type: "capability", token, raw: g };
  }
  return { type: "platform", platform: g, raw: g };
}

export function hostPlatformSet(preflight) {
  const set = new Set();
  const add = (value) => {
    if (value == null || value === "") return;
    const v = String(value).trim().toLowerCase();
    if (v === "multi") {
      set.add("phone");
      set.add("ipad");
      set.add("desktop");
      return;
    }
    if (v === "duo") {
      set.add("duo");
      set.add("phone");
      return;
    }
    if (
      v === "phone" ||
      v === "ipad" ||
      v === "desktop" ||
      v === "games" ||
      v === "watch" ||
      v === "tv" ||
      v === "vision"
    ) {
      set.add(v);
    }
  };
  add(preflight?.platform);
  const secondary = preflight?.platform_secondary;
  if (Array.isArray(secondary)) {
    for (const item of secondary) add(item);
  } else if (typeof secondary === "string") {
    add(secondary);
  }
  if (Array.isArray(preflight?.platforms)) {
    for (const item of preflight.platforms) add(item);
  }
  return set;
}

export function gateMatches(gateRaw, preflight) {
  if (gateRaw == null) return false;
  const raw = String(gateRaw).trim();
  if (!raw) return false;
  // Comma = OR. Plus = AND (e.g. ipad+capability:pencil).
  if (raw.includes(",")) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .some((part) => gateMatches(part, preflight));
  }
  if (raw.includes("+")) {
    return raw
      .split("+")
      .map((s) => s.trim())
      .filter(Boolean)
      .every((part) => gateMatches(part, preflight));
  }
  const gate = parseGate(raw);
  if (!gate) return false;
  switch (gate.type) {
    case "always":
      return true;
    case "capability": {
      const caps = preflight?.capabilities || [];
      return caps.includes(gate.token);
    }
    case "platform":
      return hostPlatformSet(preflight).has(gate.platform);
    default: {
      const _exhaustive = gate.type;
      void _exhaustive;
      return false;
    }
  }
}

function parseSurfacesYaml(text) {
  const surfaces = [];
  const requiredIds = [];
  let current = null;
  let section = null;
  let inAlso = false;
  let inCovers = false;
  let inCompose = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\t/g, "  ");
    if (!line.trim() || line.trim().startsWith("#")) continue;

    if (/^surfaces:\s*$/.test(line)) {
      section = "surfaces";
      current = null;
      inAlso = false;
      inCovers = false;
      inCompose = false;
      continue;
    }
    if (/^requiredIds:\s*$/.test(line)) {
      section = "required";
      current = null;
      continue;
    }

    if (section === "required") {
      const item = line.match(/^\s*-\s+([a-z0-9-]+)\s*$/);
      if (item) requiredIds.push(item[1]);
      continue;
    }

    if (section !== "surfaces") continue;

    const start = line.match(/^\s*-\s+id:\s*(.+)\s*$/);
    if (start) {
      current = {
        id: start[1].trim(),
        pack: null,
        appleUrl: null,
        also: [],
        covers: [],
        compose: [],
        gate: null,
        affordance: null,
      };
      surfaces.push(current);
      inAlso = false;
      inCovers = false;
      inCompose = false;
      continue;
    }
    if (!current) continue;

    // Nested when: objects are ignored (flat gate only).
    if (/^\s{4}when:/.test(line)) {
      inAlso = false;
      inCovers = false;
      inCompose = false;
      continue;
    }

    const pack = line.match(/^\s{4}pack:\s*(.+)\s*$/);
    if (pack) {
      current.pack = pack[1].trim();
      inAlso = false;
      inCovers = false;
      inCompose = false;
      continue;
    }
    const apple = line.match(/^\s{4}appleUrl:\s*(.+)\s*$/);
    if (apple) {
      current.appleUrl = apple[1].trim();
      inAlso = false;
      inCovers = false;
      inCompose = false;
      continue;
    }
    const gate = line.match(/^\s{4}gate:\s*(.+)\s*$/);
    if (gate) {
      current.gate = gate[1].trim();
      inAlso = false;
      inCovers = false;
      inCompose = false;
      continue;
    }
    const affordance = line.match(/^\s{4}affordance:\s*(.+)\s*$/);
    if (affordance) {
      current.affordance = affordance[1].trim();
      inAlso = false;
      inCovers = false;
      inCompose = false;
      continue;
    }
    if (/^\s{4}also:\s*$/.test(line)) {
      inAlso = true;
      inCovers = false;
      inCompose = false;
      continue;
    }
    if (/^\s{4}compose:\s*$/.test(line)) {
      inCompose = true;
      inAlso = false;
      inCovers = false;
      continue;
    }
    if (/^\s{4}covers:\s*\[(.*)\]\s*$/.test(line)) {
      const inner = line.match(/\[(.*)\]/)[1];
      current.covers = inner.split(",").map((s) => s.trim()).filter(Boolean);
      inAlso = false;
      inCovers = false;
      inCompose = false;
      continue;
    }
    if (/^\s{4}covers:\s*$/.test(line)) {
      inCovers = true;
      inAlso = false;
      inCompose = false;
      continue;
    }
    if (inAlso) {
      const item = line.match(/^\s{6}-\s+(\S+)\s*$/);
      if (item) current.also.push(item[1].trim());
    }
    if (inCompose) {
      const item = line.match(/^\s{6}-\s+(\S+)\s*$/);
      if (item) current.compose.push(item[1].trim());
    }
    if (inCovers) {
      const item = line.match(/^\s{6}-\s+(.+)\s*$/);
      if (item) current.covers.push(item[1].trim());
    }
  }

  return { surfaces, requiredIds };
}

export function requirePacksForSurfaces(skillRoot, surfaces) {
  for (const s of surfaces) {
    if (!s.pack || !s.appleUrl) {
      throw new Error(`surface ${s.id} needs pack + appleUrl`);
    }
    const packPath = path.join(skillRoot, "knowledge", "packs", s.pack);
    if (!fs.existsSync(packPath)) {
      throw new Error(`missing pack for ${s.id}: ${s.pack}`);
    }
    for (const extra of s.compose || []) {
      const extraPath = path.join(skillRoot, "knowledge", "packs", extra);
      if (!fs.existsSync(extraPath)) {
        throw new Error(`missing compose pack for ${s.id}: ${extra}`);
      }
    }
  }
}

export function selectSurfaces(loaded, preflight) {
  const required = new Set(loaded.requiredIds || []);
  const launched = [];
  const skipped = [];
  for (const s of loaded.surfaces) {
    const isRequired = required.has(s.id);
    if (isRequired) {
      launched.push({ ...s, launchReason: "required" });
      continue;
    }
    if (gateMatches(s.gate, preflight)) {
      launched.push({ ...s, launchReason: "gate" });
    } else {
      skipped.push({
        ...s,
        skipReason: s.gate ? "gate-mismatch" : "no-gate",
      });
    }
  }
  return { launched, skipped };
}

export function loadSurfaces(skillRoot, options = {}) {
  const packPolicy = options.packPolicy || "all";
  const file = path.join(skillRoot, "knowledge", "surfaces.yaml");
  const parsed = parseSurfacesYaml(fs.readFileSync(file, "utf8"));
  const byId = Object.fromEntries(parsed.surfaces.map((s) => [s.id, s]));
  const missing = parsed.requiredIds.filter((id) => !byId[id]);
  if (missing.length) {
    throw new Error(`surfaces.yaml missing required ids: ${missing.join(", ")}`);
  }
  const requiredSet = new Set(parsed.requiredIds);
  const allowedAffordance = new Set([
    "list",
    "form",
    "overlay",
    "chrome",
    "menu",
    "picker",
    "progress",
    "search",
    "notification",
    "loading",
    "feedback",
    "onboarding",
    "drag",
    "settings",
    "undo",
    "slider",
    "scroll",
    "popover",
    "collection",
    "pagecontrol",
    "label",
    "textview",
    "imageview",
    "chart",
    "disclosure",
    "box",
    "editmenu",
    "help",
    "webview",
    "activityview",
    "print",
    "fullscreen",
    "filebrowser",
    "focus",
    "account",
    "tabview",
    "multitask",
    "reviewprompt",
    "appwindow",
    "videoplayer",
    "haptic",
    "airplay",
    "gyro",
    "quickaction",
    "liveviewing",
    "snippet",
    "genai",
    "alwayson",
    "shareplay",
    "nearby",
    "activityring",
    "nfc",
    "ar",
    "taptopay",
    "idverifier",
    "iap",
    "map",
    "homekit",
    "workout",
    "livephoto",
    "icloud",
    "siri",
    "appshortcut",
    "healthkit",
    "carplay",
    "siwa",
    "applepay",
    "audioplayer",
    "gcaccess",
    "panel",
    "pathcontrol",
    "outline",
    "stickerpack",
    "actionbutton",
    "cameracontrol",
    "dockmenu",
    "gesture",
    "keyboard",
    "pointer",
    "pencil",
    "gamecontrol",
    "duolayout",
    "carekit",
    "researchkit",
    "walletpass",
    "appclipcode",
    "shazam",
    "photoedit",
  ]);
  for (const s of parsed.surfaces) {
    if (s.gate?.startsWith("capability:") && requiredSet.has(s.id)) {
      throw new Error(`capability-gated ${s.id} must not sit on requiredIds`);
    }
    if (s.affordance && !allowedAffordance.has(s.affordance)) {
      throw new Error(`surface ${s.id} has unknown affordance: ${s.affordance}`);
    }
  }
  const toCheck =
    packPolicy === "required"
      ? parsed.surfaces.filter((s) => requiredSet.has(s.id))
      : parsed.surfaces;
  requirePacksForSurfaces(skillRoot, toCheck);
  return { ...parsed, byId, count: parsed.surfaces.length };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const skillRoot = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  process.stdout.write(JSON.stringify(loadSurfaces(skillRoot), null, 2) + "\n");
}
