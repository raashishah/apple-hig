#!/usr/bin/env node
/**
 * Dry portability checks for /hig preflight.
 * Does not mutate designed apps.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSurfaces, selectSurfaces } from "../skills/hig/scripts/load-surfaces.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const script = path.join(root, "skills/hig/scripts/load-context.mjs");

function run(fixtureRel) {
  const cwd = path.join(__dirname, fixtureRel);
  return runAbs(cwd);
}

function runAbs(cwd) {
  const r = spawnSync(process.execPath, [script, cwd], {
    encoding: "utf8",
    cwd: root,
  });
  if (r.status !== 0) {
    throw new Error(`preflight failed for ${cwd}: ${r.stderr || r.stdout}`);
  }
  return JSON.parse(r.stdout);
}

function withAssetFlood(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-asset-flood-"));
  const src = path.join(__dirname, "fixtures/xcode-asset-flood");
  fs.cpSync(src, dir, { recursive: true });
  const assets = path.join(dir, "Assets.xcassets");
  fs.mkdirSync(assets, { recursive: true });
  for (let i = 0; i < 450; i++) {
    const slot = path.join(assets, `img-${String(i).padStart(4, "0")}.imageset`);
    fs.mkdirSync(slot, { recursive: true });
    fs.writeFileSync(
      path.join(slot, "Contents.json"),
      '{"images":[],"info":{"version":1,"author":"xcode"}}\n',
    );
  }
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const results = [];

{
  const j = run("fixtures/sparse");
  const ok = j.stack?.supported === true && j.mutation === "open" && j.stack?.kind?.includes("react");
  results.push({ case: "sparse", ok, preflight: j.HIG_PREFLIGHT, kind: j.stack?.kind });
}

{
  const j = run("fixtures/unsupported");
  const ok =
    j.stack?.supported === false &&
    j.mutation === "unsupported" &&
    typeof j.stopLine === "string";
  results.push({
    case: "unsupported",
    ok,
    preflight: j.HIG_PREFLIGHT,
    stopLine: j.stopLine,
  });
}

{
  const j = run("fixtures/brand-veto");
  const ok =
    j.register === "brand" &&
    j.brandVeto === true &&
    j.reviewAdaptMutation === "blocked";
  results.push({ case: "brand-veto", ok, preflight: j.HIG_PREFLIGHT });
}

{
  const j = run("fixtures/swift-ui");
  const ok =
    j.stack?.supported === true &&
    j.mutation === "open" &&
    (j.stack?.kind === "swiftui" || j.stack?.family === "native-apple");
  results.push({ case: "swift-ui", ok, preflight: j.HIG_PREFLIGHT, kind: j.stack?.kind });
}

{
  const j = run("fixtures/web-css");
  const ok = j.stack?.supported === true && j.mutation === "open" && j.stack?.kind === "web";
  results.push({ case: "web-css", ok, preflight: j.HIG_PREFLIGHT, kind: j.stack?.kind });
}

{
  const j = withAssetFlood((dir) => runAbs(dir));
  const ok =
    j.stack?.supported === true &&
    j.stack?.kind === "swiftui" &&
    (j.stack?.hints?.swiftFiles ?? 0) >= 1;
  results.push({
    case: "xcode-asset-flood",
    ok,
    preflight: j.HIG_PREFLIGHT,
    kind: j.stack?.kind,
    swiftFiles: j.stack?.hints?.swiftFiles,
  });
}

{
  const j = run("fixtures/swiftui-help-html");
  const ok =
    j.stack?.kind === "swiftui" &&
    j.stack?.family === "native-apple" &&
    j.stack?.hints?.incidentalWeb === true;
  results.push({
    case: "swiftui-help-html",
    ok,
    preflight: j.HIG_PREFLIGHT,
    kind: j.stack?.kind,
    family: j.stack?.family,
  });
}

{
  const j = run("fixtures/swiftui-launch-nib");
  const ok = j.stack?.kind === "swiftui" && j.stack?.family === "native-apple";
  results.push({
    case: "swiftui-launch-nib",
    ok,
    preflight: j.HIG_PREFLIGHT,
    kind: j.stack?.kind,
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const web = run("fixtures/web-css");
  const selected = selectSurfaces(surfaces, web);
  const launchedIds = selected.launched.map((s) => s.id);
  const requiredOk = surfaces.requiredIds.every((id) => launchedIds.includes(id));
  const ok =
    web.stack?.kind === "web" &&
    !(web.capabilities || []).includes("healthkit") &&
    launchedIds.includes("healthkit") &&
    launchedIds.includes("sign-in-with-apple") &&
    launchedIds.includes("playing-audio") &&
    launchedIds.includes("panels") &&
    launchedIds.includes("path-controls") &&
    !launchedIds.includes("game-center") &&
    !launchedIds.includes("mac-chrome") &&
    requiredOk;
  results.push({
    case: "web-css-skips-tech-gates",
    ok,
    platform: web.platform,
    capabilities: web.capabilities,
    launchedOptional: launchedIds.filter((id) => !surfaces.requiredIds.includes(id)),
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const j = run("fixtures/tech-present");
  const selected = selectSurfaces(surfaces, j);
  const launchedIds = selected.launched.map((s) => s.id);
  const ok =
    (j.capabilities || []).includes("healthkit") &&
    launchedIds.includes("healthkit") &&
    surfaces.requiredIds.every((id) => launchedIds.includes(id));
  results.push({
    case: "tech-present-selects-healthkit",
    ok,
    platform: j.platform,
    capabilities: j.capabilities,
    launchedHealthkit: launchedIds.includes("healthkit"),
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const j = run("fixtures/tech-absent");
  const selected = selectSurfaces(surfaces, j);
  const launchedIds = selected.launched.map((s) => s.id);
  const ok =
    !(j.capabilities || []).includes("healthkit") &&
    launchedIds.includes("healthkit") &&
    launchedIds.includes("sign-in-with-apple") &&
    launchedIds.includes("playing-audio") &&
    launchedIds.includes("panels") &&
    launchedIds.includes("path-controls") &&
    !launchedIds.includes("game-center") &&
    surfaces.requiredIds.length === 12;
  results.push({
    case: "tech-absent-healthkit-always",
    ok,
    capabilities: j.capabilities,
  });
}

{
  const j = run("fixtures/ipad-only");
  const ok = j.platform === "ipad" && j.stack?.kind === "swiftui";
  results.push({ case: "ipad-only-plist-is-ipad", ok, platform: j.platform, kind: j.stack?.kind });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const j = run("fixtures/swiftui-mac");
  const selected = selectSurfaces(surfaces, j);
  const ok =
    j.platform === "desktop" &&
    (j.stack?.kind === "swiftui" || j.stack?.family === "native-apple") &&
    selected.launched.some((s) => s.id === "mac-chrome");
  results.push({
    case: "swiftui-macos-package-is-desktop",
    ok,
    platform: j.platform,
    kind: j.stack?.kind,
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const j = run("fixtures/multi-desktop");
  const selected = selectSurfaces(surfaces, j);
  const ok =
    j.platform === "multi" &&
    (j.platform_secondary || []).includes("desktop") &&
    selected.launched.some((s) => s.id === "mac-chrome");
  results.push({
    case: "multi-secondary-desktop-launches-mac-chrome",
    ok,
    platform: j.platform,
    platform_secondary: j.platform_secondary,
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const j = run("fixtures/siri-intents");
  const selected = selectSurfaces(surfaces, j);
  const launchedIds = selected.launched.map((s) => s.id);
  const siriIds = launchedIds.filter((id) => id === "siri-app-shortcuts" || id === "app-shortcuts");
  const ok =
    (j.capabilities || []).includes("siri") &&
    siriIds.length === 1 &&
    siriIds[0] === "siri-app-shortcuts" &&
    !launchedIds.includes("app-shortcuts") &&
    (surfaces.byId["siri-app-shortcuts"]?.compose || []).includes("system-app-shortcuts.md");
  results.push({
    case: "siri-intents-one-surface",
    ok,
    capabilities: j.capabilities,
    siriIds,
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const j = run("fixtures/swift-ui");
  const selected = selectSurfaces(surfaces, j);
  const launchedIds = selected.launched.map((s) => s.id);
  const sheets = surfaces.byId.sheets;
  const ok =
    launchedIds.includes("sheets") &&
    !launchedIds.includes("action-sheets") &&
    !surfaces.surfaces.some((s) => s.id === "action-sheets") &&
    (sheets?.compose || []).includes("components-action-sheets.md");
  results.push({
    case: "sheets-compose-no-action-sheets-lease",
    ok,
    launchedIds: launchedIds.filter((id) => id === "sheets" || id === "action-sheets"),
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const j = run("fixtures/passkit-wallet");
  const selected = selectSurfaces(surfaces, j);
  const launchedIds = selected.launched.map((s) => s.id);
  const ok =
    (j.capabilities || []).includes("wallet") &&
    !(j.capabilities || []).includes("applepay") &&
    launchedIds.includes("commerce") &&
    !launchedIds.includes("apple-pay");
  results.push({
    case: "passkit-wallet-not-applepay",
    ok,
    capabilities: j.capabilities,
    launchedApplePay: launchedIds.includes("apple-pay"),
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const j = run("fixtures/apple-pay");
  const selected = selectSurfaces(surfaces, j);
  const launchedIds = selected.launched.map((s) => s.id);
  const ok =
    (j.capabilities || []).includes("applepay") &&
    launchedIds.includes("apple-pay");
  results.push({
    case: "apple-pay-signals-select-apple-pay",
    ok,
    capabilities: j.capabilities,
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const widget = run("fixtures/control-widget");
  const phone = run("fixtures/swift-ui");
  const widgetIds = selectSurfaces(surfaces, widget).launched.map((s) => s.id);
  const phoneIds = selectSurfaces(surfaces, phone).launched.map((s) => s.id);
  const ok =
    (widget.capabilities || []).includes("controlcenter") &&
    widgetIds.includes("control-center") &&
    !(phone.capabilities || []).includes("controlcenter") &&
    !phoneIds.includes("control-center");
  results.push({
    case: "control-widget-selects-control-center",
    ok,
    widgetCaps: widget.capabilities,
    phoneCaps: phone.capabilities,
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const phone = run("fixtures/iphone-pencilkit");
  const pad = run("fixtures/ipad-pencilkit");
  const phoneIds = selectSurfaces(surfaces, phone).launched.map((s) => s.id);
  const padIds = selectSurfaces(surfaces, pad).launched.map((s) => s.id);
  const ok =
    phone.platform === "phone" &&
    (phone.capabilities || []).includes("pencil") &&
    !phoneIds.includes("inputs-pencil") &&
    pad.platform === "ipad" &&
    (pad.capabilities || []).includes("pencil") &&
    padIds.includes("inputs-pencil");
  results.push({
    case: "pencil-and-gate-ipad-only",
    ok,
    phonePlatform: phone.platform,
    padPlatform: pad.platform,
    phoneLaunchedPencil: phoneIds.includes("inputs-pencil"),
    padLaunchedPencil: padIds.includes("inputs-pencil"),
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const phone = run("fixtures/swift-ui");
  const phoneIds = selectSurfaces(surfaces, phone).launched.map((s) => s.id);
  const ok =
    phone.platform === "phone" &&
    !(phone.capabilities || []).includes("duo") &&
    !phoneIds.includes("gs-iphone-duo") &&
    phoneIds.includes("gs-ios") &&
    surfaces.requiredIds.length === 12;
  results.push({
    case: "phone-only-skips-iphone-duo",
    ok,
    platform: phone.platform,
    capabilities: phone.capabilities,
    launchedDuo: phoneIds.includes("gs-iphone-duo"),
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const design = run("fixtures/iphone-duo-design");
  const host = run("fixtures/iphone-duo-host");
  const platform = run("fixtures/iphone-duo-platform");
  const designIds = selectSurfaces(surfaces, design).launched.map((s) => s.id);
  const hostIds = selectSurfaces(surfaces, host).launched.map((s) => s.id);
  const platformIds = selectSurfaces(surfaces, platform).launched.map((s) => s.id);
  const ok =
    (design.capabilities || []).includes("duo") &&
    designIds.includes("gs-iphone-duo") &&
    designIds.includes("gs-ios") &&
    (host.capabilities || []).includes("duo") &&
    hostIds.includes("gs-iphone-duo") &&
    platform.platform === "duo" &&
    (platform.capabilities || []).includes("duo") &&
    platformIds.includes("gs-iphone-duo") &&
    platformIds.includes("gs-ios");
  results.push({
    case: "duo-design-or-host-selects-iphone-duo",
    ok,
    designCaps: design.capabilities,
    hostCaps: host.capabilities,
    platform: platform.platform,
    platformCaps: platform.capabilities,
  });
}

{
  const skillRoot = path.join(root, "skills", "hig");
  const surfaces = loadSurfaces(skillRoot);
  const regions = run("fixtures/iphone-duo-reserved-regions");
  const ids = selectSurfaces(surfaces, regions).launched.map((s) => s.id);
  const ok =
    (regions.capabilities || []).includes("duo") &&
    ids.includes("gs-iphone-duo") &&
    !run("fixtures/swift-ui").capabilities?.includes("duo");
  results.push({
    case: "reserved-regions-only-selects-iphone-duo",
    ok,
    capabilities: regions.capabilities,
    launchedDuo: ids.includes("gs-iphone-duo"),
  });
}

{
  const sparse = run("fixtures/sparse");
  const brand = run("fixtures/brand-veto");
  const blob = JSON.stringify(sparse);
  const ok =
    sparse.appleTypeDefault == null &&
    brand.appleTypeDefault == null &&
    !/type_default=/.test(sparse.HIG_PREFLIGHT) &&
    !/type_default=/.test(brand.HIG_PREFLIGHT) &&
    !/SF Pro/.test(blob) &&
    !/-apple-system/.test(blob);
  results.push({
    case: "host-fonts-stay",
    ok,
    preflight: sparse.HIG_PREFLIGHT,
  });
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
