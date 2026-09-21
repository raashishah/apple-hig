#!/usr/bin/env node
/**
 * Dry proof that swarm surfaces + optional React skill exist.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSurfaces, selectSurfaces, requirePacksForSurfaces } from "../skills/hig/scripts/load-surfaces.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const skillRoot = path.join(pluginRoot, "skills", "hig");

const results = [];

{
  let ok = false;
  let detail = {};
  try {
    const surfaces = loadSurfaces(skillRoot);
    const required = surfaces.requiredIds;
    ok = required.length >= 12 && surfaces.count >= 12;
    detail = { count: surfaces.count, required };
  } catch (err) {
    detail = { error: String(err.message || err) };
  }
  results.push({ case: "surfaces-load", ok, ...detail });
}

{
  const skillText = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  const designText = fs.readFileSync(path.join(skillRoot, "references", "verbs", "design.md"), "utf8");
  const canon = fs.existsSync(path.join(skillRoot, "knowledge", "canon.md"));
  const reactSkill = fs.existsSync(path.join(pluginRoot, "skills", "hig-react", "SKILL.md"));
  const agents = ["surface-worker.md", "synthesizer.md", "apply-worker.md"].every((f) =>
    fs.existsSync(path.join(skillRoot, "references", "agents", f)),
  );
  const ok =
    canon &&
    reactSkill &&
    agents &&
    skillText.includes("swarm") &&
    skillText.includes("Chrome grammar") &&
    designText.includes("load-chrome-grammar") &&
    designText.includes("check-chrome.mjs") &&
    designText.includes("apply-chrome") &&
    skillText.includes("apply-chrome") &&
    designText.includes("apply-catalog") &&
    skillText.includes("apply-catalog") &&
    designText.includes("plan-catalog") &&
    designText.includes("parallel");
  results.push({
    case: "orchestrator-wired",
    ok,
    canon,
    reactSkill,
    agents,
    skillSwarm: skillText.includes("swarm"),
  });
}

{
  const reactText = fs.readFileSync(path.join(pluginRoot, "skills", "hig-react", "SKILL.md"), "utf8");
  const injectsKit = /shadcn|component library|inject/i.test(reactText) && /Do not add shadcn/.test(reactText);
  const ok = /not a component library/i.test(reactText) && injectsKit;
  results.push({ case: "react-skill-no-kit", ok });
}

{
  const yamlRoots = [
    path.join(skillRoot, "knowledge", "surfaces.yaml"),
    path.join(skillRoot, "knowledge", "registry.yaml"),
    path.join(skillRoot, "knowledge", "catalog.yaml"),
    path.join(skillRoot, "knowledge", "chrome", "grammar.yaml"),
  ];
  const packDir = path.join(skillRoot, "knowledge", "packs");
  const texts = yamlRoots.map((p) => fs.readFileSync(p, "utf8"));
  for (const name of fs.readdirSync(packDir)) {
    if (name.endsWith(".md")) texts.push(fs.readFileSync(path.join(packDir, name), "utf8"));
  }
  const blob = texts.join("\n");
  const forbiddenHits = [];
  for (const slug of ["data-entry", "app-intents", "touchscreen-gestures", "navigation-bars"]) {
    if (blob.includes(`/human-interface-guidelines/${slug}`)) forbiddenHits.push(slug);
  }
  if (/human-interface-guidelines\/navigation(?![\w-])/.test(blob)) forbiddenHits.push("navigation");

  let nav = null;
  try {
    nav = loadSurfaces(skillRoot).surfaces.find((s) => s.id === "navigation");
  } catch {
    nav = null;
  }
  const loaded = [nav?.appleUrl, ...(nav?.also || [])].filter(Boolean);
  const hasToolbars = loaded.some((u) => u.endsWith("/toolbars"));
  const hasNavBars = loaded.some((u) => u.includes("/navigation-bars"));
  const hasTabBars = loaded.some((u) => u.endsWith("/tab-bars"));
  const hasSidebars = loaded.some((u) => u.endsWith("/sidebars"));

  results.push({
    case: "live-url-hygiene",
    ok:
      forbiddenHits.length === 0 &&
      hasToolbars &&
      hasTabBars &&
      hasSidebars &&
      !hasNavBars &&
      Boolean(nav),
    forbiddenHits,
    loaded,
    hasToolbars,
    hasNavBars,
  });
}

{
  let ok = false;
  let detail = {};
  try {
    const surfaces = loadSurfaces(skillRoot);
    const required = surfaces.requiredIds;
    const gated = surfaces.surfaces.filter((s) => s.gate && s.gate !== "always");
    const stuffed = required.filter((id) => {
      const s = surfaces.byId[id];
      return s?.gate?.startsWith("capability:");
    });
    ok =
      required.length >= 12 &&
      stuffed.length === 0 &&
      gated.some((s) => s.id === "healthkit" && s.gate === "capability:healthkit") &&
      !required.includes("healthkit") &&
      !required.includes("game-center") &&
      !required.includes("mac-chrome");
    detail = {
      requiredCount: required.length,
      stuffed,
      gatedIds: gated.map((s) => s.id),
    };
  } catch (err) {
    detail = { error: String(err.message || err) };
  }
  results.push({ case: "gates-not-in-requiredIds", ok, ...detail });
}

{
  const surfaces = loadSurfaces(skillRoot);
  const webSkip = selectSurfaces(surfaces, {
    platform: "unknown",
    capabilities: [],
  });
  const hk = selectSurfaces(surfaces, {
    platform: "phone",
    capabilities: ["healthkit"],
  });
  const desktop = selectSurfaces(surfaces, {
    platform: "desktop",
    capabilities: [],
  });
  const multi = selectSurfaces(surfaces, {
    platform: "multi",
    platform_secondary: ["desktop"],
    capabilities: [],
  });
  const ok =
    !webSkip.launched.some((s) => s.id === "healthkit") &&
    hk.launched.some((s) => s.id === "healthkit") &&
    desktop.launched.some((s) => s.id === "mac-chrome") &&
    multi.launched.some((s) => s.id === "mac-chrome") &&
    !webSkip.launched.some((s) => s.id === "mac-chrome") &&
    !webSkip.launched.some((s) => s.id === "game-center");
  results.push({
    case: "select-surfaces-gates",
    ok,
    webLaunchedOptional: webSkip.launched
      .filter((s) => !surfaces.requiredIds.includes(s.id))
      .map((s) => s.id),
    healthkitOn: hk.launched.some((s) => s.id === "healthkit"),
  });
}

{
  let ok = false;
  let threw = false;
  let detail = {};
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-missing-pack-"));
  try {
    const tmpSkill = path.join(dir, "hig");
    fs.cpSync(skillRoot, tmpSkill, { recursive: true });
    fs.unlinkSync(path.join(tmpSkill, "knowledge", "packs", "tech-healthkit.md"));
    const loaded = loadSurfaces(tmpSkill, { packPolicy: "required" });
    const selected = selectSurfaces(loaded, {
      platform: "phone",
      capabilities: ["healthkit"],
    });
    const health = selected.launched.filter((s) => s.id === "healthkit");
    try {
      requirePacksForSurfaces(tmpSkill, health);
    } catch (err) {
      threw = /missing pack for healthkit/.test(String(err.message || err));
      detail = { error: String(err.message || err) };
    }
    ok = health.length === 1 && threw;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  results.push({ case: "missing-gated-pack-throws-if-selected", ok, threw, ...detail });
}

{
  const surfaces = loadSurfaces(skillRoot);
  const siri = selectSurfaces(surfaces, {
    platform: "phone",
    capabilities: ["siri"],
  });
  const siriIds = siri.launched
    .map((s) => s.id)
    .filter((id) => id === "siri-app-shortcuts" || id === "app-shortcuts");
  const phone = selectSurfaces(surfaces, { platform: "phone", capabilities: [] });
  const sheets = surfaces.byId.sheets;
  const ok =
    surfaces.requiredIds.length === 12 &&
    siriIds.length === 1 &&
    siriIds[0] === "siri-app-shortcuts" &&
    !surfaces.surfaces.some((s) => s.id === "app-shortcuts" || s.id === "action-sheets") &&
    phone.launched.some((s) => s.id === "sheets") &&
    !phone.launched.some((s) => s.id === "action-sheets") &&
    (sheets?.compose || []).includes("components-action-sheets.md") &&
    (surfaces.byId["siri-app-shortcuts"]?.compose || []).includes("system-app-shortcuts.md") &&
    surfaces.byId["control-center"]?.gate === "capability:controlcenter" &&
    surfaces.byId["inputs-pencil"]?.gate === "ipad+capability:pencil" &&
    !selectSurfaces(surfaces, {
      platform: "phone",
      capabilities: ["pencil"],
    }).launched.some((s) => s.id === "inputs-pencil") &&
    selectSurfaces(surfaces, {
      platform: "ipad",
      capabilities: ["pencil"],
    }).launched.some((s) => s.id === "inputs-pencil") &&
    !selectSurfaces(surfaces, {
      platform: "phone",
      capabilities: ["wallet"],
    }).launched.some((s) => s.id === "apple-pay") &&
    selectSurfaces(surfaces, {
      platform: "phone",
      capabilities: ["controlcenter"],
    }).launched.some((s) => s.id === "control-center") &&
    !phone.launched.some((s) => s.id === "control-center");
  results.push({
    case: "bugbot-surface-leases",
    ok,
    requiredCount: surfaces.requiredIds.length,
    siriIds,
  });
}

{
  const surfaces = loadSurfaces(skillRoot);
  const phone = selectSurfaces(surfaces, { platform: "phone", capabilities: [] });
  const byCap = selectSurfaces(surfaces, {
    platform: "phone",
    capabilities: ["duo"],
  });
  const byPlatform = selectSurfaces(surfaces, {
    platform: "duo",
    capabilities: [],
  });
  const ok =
    surfaces.requiredIds.length === 12 &&
    !surfaces.requiredIds.includes("gs-iphone-duo") &&
    surfaces.byId["gs-iphone-duo"]?.gate === "duo,capability:duo" &&
    !phone.launched.some((s) => s.id === "gs-iphone-duo") &&
    byCap.launched.some((s) => s.id === "gs-iphone-duo") &&
    byCap.launched.some((s) => s.id === "gs-ios") &&
    byPlatform.launched.some((s) => s.id === "gs-iphone-duo") &&
    byPlatform.launched.some((s) => s.id === "gs-ios");
  results.push({
    case: "iphone-duo-gate",
    ok,
    requiredCount: surfaces.requiredIds.length,
  });
}

{
  const surfaces = loadSurfaces(skillRoot);
  const ok =
    surfaces.requiredIds.length === 12 &&
    surfaces.byId.navigation?.affordance === "chrome" &&
    surfaces.byId["lists-split"]?.affordance === "list" &&
    surfaces.byId.sheets?.affordance === "overlay" &&
    surfaces.byId.forms?.affordance === "form" &&
    surfaces.byId.menus?.affordance === "menu" &&
    surfaces.byId.search?.affordance === "search" &&
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
    !surfaces.byId.layout?.affordance &&
    !surfaces.byId.typography?.affordance &&
    !surfaces.byId.writing?.affordance;
  results.push({
    case: "pattern-affordances-not-foundations",
    ok,
    requiredCount: surfaces.requiredIds.length,
    lists: surfaces.byId["lists-split"]?.affordance,
  });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
