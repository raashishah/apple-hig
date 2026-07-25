#!/usr/bin/env node
/**
 * Hard preflight for /hig.
 * Prints full JSON to stdout. Agent must consume whole output.
 *
 * Fields include HIG_PREFLIGHT summary:
 *   context=pass|fail stack=pass|unsupported register=product|brand|unknown
 *   design=pass|missing|placeholder brand_snapshot=... mutation=open|blocked|unsupported
 */

import fs from "node:fs";
import path from "node:path";

const DESIGN_NAMES = ["DESIGN.md", "Design.md", "design.md"];
const AGENTS_NAMES = ["AGENTS.md", "Agents.md", "agents.md"];
const FALLBACK_DIRS = [".agents/context", "docs"];
const REQ_GLOBS = [
  "README.md",
  "docs/**/*.md",
  "projects/**/*.md",
  "AGENTS.md",
  "DESIGN.md",
];

function firstExisting(dir, names) {
  for (const name of names) {
    const p = path.join(dir, name);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}

function resolveContextDir(cwd = process.cwd()) {
  const envDir = process.env.HIG_CONTEXT_DIR?.trim();
  if (envDir) {
    return path.isAbsolute(envDir) ? envDir : path.resolve(cwd, envDir);
  }
  if (firstExisting(cwd, [...DESIGN_NAMES, ...AGENTS_NAMES])) return cwd;
  for (const rel of FALLBACK_DIRS) {
    const candidate = path.resolve(cwd, rel);
    if (firstExisting(candidate, [...DESIGN_NAMES, ...AGENTS_NAMES])) {
      return candidate;
    }
  }
  return cwd;
}

function isPlaceholderDesign(text) {
  if (!text || text.trim().length < 200) return true;
  if (/\[TODO\]/i.test(text)) return true;
  if (/replace this/i.test(text) && text.trim().length < 400) return true;
  return false;
}

function detectStack(cwd) {
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) {
    // Climb one level for monorepo app folders that still have package.json here
    return { supported: false, reason: "no package.json", kind: "none" };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {
    return { supported: false, reason: "invalid package.json", kind: "none" };
  }
  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };
  const hasReact = "react" in deps || "react-dom" in deps;
  const hasVite = "vite" in deps;
  const hasNext = "next" in deps;
  const electron = "electron" in deps;
  if (hasReact || hasNext) {
    return {
      supported: true,
      kind: electron ? "react-electron" : hasNext ? "next" : hasVite ? "react-vite" : "react",
      reason: null,
    };
  }
  return {
    supported: false,
    reason: "no React/Next UI dependency",
    kind: "other",
  };
}

function readRegister(designText, cwd) {
  const fromDesign = designText?.match(/register:\s*(product|brand)/i);
  if (fromDesign) return fromDesign[1].toLowerCase();

  const cues = [];
  const names = [cwd, path.basename(cwd)].join(" ").toLowerCase();
  cues.push(names);
  for (const f of ["README.md", "package.json", "vercel.json"]) {
    const p = path.join(cwd, f);
    if (fs.existsSync(p)) {
      try {
        cues.push(fs.readFileSync(p, "utf8").slice(0, 4000).toLowerCase());
      } catch {
        /* ignore */
      }
    }
  }
  const blob = cues.join("\n");
  const brandHints =
    /\b(landing|portfolio|marketing|personal site|brand site|brochure)\b/.test(
      blob,
    );
  const productHints =
    /\b(scoreboard|dashboard|app shell|electron|admin|saas|product tool)\b/.test(
      blob,
    ) ||
    /admissions-app|admissionsdemo/.test(blob) ||
    fs.existsSync(path.join(cwd, "src", "pages")) ||
    fs.existsSync(path.join(cwd, "src", "App.tsx"));

  if (brandHints && !productHints) return "brand";
  if (productHints) return "product";
  if (brandHints) return "brand";
  return "unknown";
}

function brandMutationLocked(designText) {
  if (!designText) return false;
  return /brand_mutation_veto:\s*spacing_and_touch_targets_locked/i.test(
    designText,
  );
}

function snapshotBrandCss(cwd) {
  const candidates = [
    "src/styles.css",
    "src/index.css",
    "src/app.css",
    "styles.css",
    "app/globals.css",
  ];
  const vars = {};
  const fontFamilies = new Set();
  for (const rel of candidates) {
    const p = path.join(cwd, rel);
    if (!fs.existsSync(p)) continue;
    let text;
    try {
      text = fs.readFileSync(p, "utf8");
    } catch {
      continue;
    }
    for (const m of text.matchAll(/--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g)) {
      const key = m[1];
      const val = m[2].trim();
      if (
        /^(bg|fg|rule|muted|accent|background|foreground|color|brand)/i.test(
          key,
        ) ||
        /#[0-9a-fA-F]{3,8}/.test(val)
      ) {
        if (!(key in vars)) vars[key] = val;
      }
    }
    for (const m of text.matchAll(/font-family:\s*([^;}+]+)/g)) {
      fontFamilies.add(m[1].trim().slice(0, 120));
    }
  }
  return {
    cssVars: vars,
    fontFamilies: [...fontFamilies].slice(0, 12),
    pathsChecked: candidates.filter((c) => fs.existsSync(path.join(cwd, c))),
  };
}

function findRequirementPaths(cwd) {
  const found = [];
  const tryFiles = [
    "README.md",
    "AGENTS.md",
    "DESIGN.md",
    "docs/Admission Scoreboard PRD.md",
  ];
  for (const rel of tryFiles) {
    const p = path.join(cwd, rel);
    if (fs.existsSync(p)) found.push(path.relative(cwd, p));
  }
  // Parent monorepo docs
  const parentDocs = path.join(cwd, "..", "docs");
  if (fs.existsSync(parentDocs)) {
    found.push(path.relative(cwd, parentDocs));
  }
  const parentAgents = path.join(cwd, "..", "AGENTS.md");
  if (fs.existsSync(parentAgents)) {
    found.push(path.relative(cwd, parentAgents));
  }
  return found;
}

function listRoutesHint(cwd) {
  const appTsx = ["src/App.tsx", "src/main.tsx", "app/page.tsx"].map((r) =>
    path.join(cwd, r),
  );
  const routes = [];
  for (const p of appTsx) {
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    for (const m of text.matchAll(/path=["'`]([^"'`]+)["'`]/g)) {
      routes.push(m[1]);
    }
  }
  return [...new Set(routes)];
}

function loadContext(cwd = process.cwd()) {
  const contextDir = resolveContextDir(cwd);
  const designPath = firstExisting(contextDir, DESIGN_NAMES);
  const agentsPath = firstExisting(contextDir, AGENTS_NAMES);
  const design = designPath ? fs.readFileSync(designPath, "utf8") : null;
  const agents = agentsPath ? fs.readFileSync(agentsPath, "utf8") : null;
  const hasDesign = Boolean(design);
  const teachComplete = hasDesign && !isPlaceholderDesign(design);
  const stack = detectStack(cwd);
  const register = readRegister(design, cwd);
  const brandSnapshot = snapshotBrandCss(cwd);
  const brandVeto = brandMutationLocked(design) || register === "brand";

  const higDir = path.join(cwd, ".hig");
  const progressPath = path.join(higDir, "progress.yaml");
  const screensPath = path.join(higDir, "screens.yaml");
  const appDesignPath = path.join(higDir, "app-design.md");
  const hasProgress = fs.existsSync(progressPath);
  const hasScreens = fs.existsSync(screensPath);
  const hasAppDesign = fs.existsSync(appDesignPath);

  let mutation = "open";
  let stopLine = null;
  if (!stack.supported) {
    mutation = "unsupported";
    stopLine = `HIG stop: unsupported stack (${stack.reason}). Need React/Next web UI.`;
  }

  const designStatus = !hasDesign
    ? "missing"
    : teachComplete
      ? "pass"
      : "placeholder";

  // Default /hig may write design then implement; missing design does not block mutation for design verb.
  // review/adapt on brand register: blocked for spacing/touch (enforced in verb files + this flag).
  const reviewAdaptMutation = brandVeto ? "blocked" : mutation === "unsupported" ? "unsupported" : "open";

  const preflight = [
    `context=pass`,
    `stack=${stack.supported ? "pass" : "unsupported"}`,
    `register=${register}`,
    `design=${designStatus}`,
    `brand_veto=${brandVeto ? "on" : "off"}`,
    `mutation=${mutation}`,
    `review_adapt_mutation=${reviewAdaptMutation}`,
  ].join(" ");

  return {
    cwd,
    contextDir,
    hasDesign,
    design,
    designPath: designPath ? path.relative(cwd, designPath) : null,
    hasAgents: Boolean(agents),
    agents,
    agentsPath: agentsPath ? path.relative(cwd, agentsPath) : null,
    teachComplete,
    placeholderDesign: hasDesign && !teachComplete,
    designStatus,
    stack,
    register,
    brandSnapshot,
    brandVeto,
    brandMutationLocked: brandMutationLocked(design),
    requirementPaths: findRequirementPaths(cwd),
    routesHint: listRoutesHint(cwd),
    hasProgress,
    progressPath: hasProgress ? path.relative(cwd, progressPath) : null,
    hasScreens,
    screensPath: hasScreens ? path.relative(cwd, screensPath) : null,
    hasAppDesign,
    appDesignPath: hasAppDesign ? path.relative(cwd, appDesignPath) : null,
    higDir: fs.existsSync(higDir) ? path.relative(cwd, higDir) : null,
    mutation,
    reviewAdaptMutation,
    stopLine,
    HIG_PREFLIGHT: preflight,
    // Legacy alias for older verb docs
    reqGlobs: REQ_GLOBS,
  };
}

const cwdArg = process.argv[2];
const result = loadContext(cwdArg ? path.resolve(cwdArg) : process.cwd());
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
