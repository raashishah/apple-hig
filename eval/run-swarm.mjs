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
  const ok =
    !webSkip.launched.some((s) => s.id === "healthkit") &&
    hk.launched.some((s) => s.id === "healthkit") &&
    desktop.launched.some((s) => s.id === "mac-chrome") &&
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
    fs.unlinkSync(path.join(tmpSkill, "knowledge", "packs", "healthkit.md"));
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

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
