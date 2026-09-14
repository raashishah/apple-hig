#!/usr/bin/env node
/**
 * Dry proof that swarm surfaces + optional React skill exist.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSurfaces } from "../skills/hig/scripts/load-surfaces.mjs";

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

const failed = results.filter((r) => !r.ok);
process.stdout.write(JSON.stringify({ results, passed: failed.length === 0 }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
