#!/usr/bin/env node
/**
 * Hard preflight for /hig.
 * Prints full JSON to stdout. Agent must consume whole output.
 *
 * Fields include HIG_PREFLIGHT summary:
 *   context=pass|fail stack=pass|unsupported register=product|brand|unknown
 *   design=pass|missing|placeholder brand_snapshot=... mutation=open|blocked|unsupported
 *
 * Stack is whatever UI the host has (SwiftUI, UIKit, web/CSS, React, …).
 * mutation=unsupported only when there is no UI to HIG.
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
const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "DerivedData",
  "build",
  "dist",
  ".next",
  "Pods",
  "vendor",
  ".build",
  "coverage",
  ".worktrees",
  "xcuserdata",
  "Carthage",
  "Checkouts",
]);
const SKIP_DIR_SUFFIXES = [
  ".xcassets",
  ".xcstickers",
  ".scnassets",
  ".icon",
  ".bundle",
  ".framework",
  ".dSYM",
  ".xcdatamodeld",
  ".docc",
];
const SOURCE_EXTS = new Set([
  ".swift",
  ".m",
  ".h",
  ".mm",
  ".c",
  ".cpp",
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".vue",
  ".svelte",
  ".dart",
  ".qml",
  ".storyboard",
  ".xib",
]);
const SKIP_FILE_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".heic",
  ".pdf",
  ".svg",
  ".mp3",
  ".mp4",
  ".mov",
  ".ttf",
  ".otf",
  ".woff",
  ".woff2",
  ".ico",
]);

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

function skipDumpDir(name) {
  const lower = name.toLowerCase();
  if (SKIP_DIRS.has(name)) return true;
  return SKIP_DIR_SUFFIXES.some((suf) => lower.endsWith(suf));
}

function walkHints(cwd, maxFiles = 400) {
  const sources = [];
  const rest = [];
  function record(rel, ext) {
    const bucket = SOURCE_EXTS.has(ext) ? sources : rest;
    if (sources.length + rest.length >= maxFiles) return false;
    bucket.push(rel);
    return true;
  }
  function walk(dir, depth) {
    if (sources.length + rest.length >= maxFiles || depth > 6) return;
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    // Prefer source-looking names so Assets/Help dumps do not starve .swift.
    ents.sort((a, b) => {
      const as = SOURCE_EXTS.has(path.extname(a.name).toLowerCase()) ? 0 : 1;
      const bs = SOURCE_EXTS.has(path.extname(b.name).toLowerCase()) ? 0 : 1;
      if (as !== bs) return as - bs;
      const aSrc = /^(sources|source|src|app|classes)$/i.test(a.name) ? 0 : 1;
      const bSrc = /^(sources|source|src|app|classes)$/i.test(b.name) ? 0 : 1;
      if (aSrc !== bSrc) return aSrc - bSrc;
      return a.name.localeCompare(b.name);
    });
    for (const ent of ents) {
      if (sources.length + rest.length >= maxFiles) return;
      const name = ent.name;
      if (name.startsWith(".") && name !== ".swift") continue;
      const full = path.join(dir, name);
      if (ent.isDirectory()) {
        const lower = name.toLowerCase();
        if (skipDumpDir(name)) continue;
        if (lower.endsWith(".xcodeproj") || lower.endsWith(".xcworkspace")) {
          record(path.relative(cwd, full) + "/", "");
          continue;
        }
        walk(full, depth + 1);
        continue;
      }
      if (!ent.isFile()) continue;
      const ext = path.extname(name).toLowerCase();
      if (SKIP_FILE_EXTS.has(ext)) continue;
      record(path.relative(cwd, full), ext);
    }
  }
  walk(cwd, 0);
  return [...sources, ...rest].slice(0, maxFiles);
}

function readHead(file, n = 4000) {
  try {
    return fs.readFileSync(file, "utf8").slice(0, n);
  } catch {
    return "";
  }
}

function detectStack(cwd) {
  const files = walkHints(cwd);
  const lower = files.map((f) => f.toLowerCase());
  const has = (ext) => lower.some((f) => f.endsWith(ext));

  const swiftFiles = files.filter((f) => f.toLowerCase().endsWith(".swift"));
  const nibFiles = files.filter((f) => {
    const e = f.toLowerCase();
    return e.endsWith(".storyboard") || e.endsWith(".xib");
  });
  const isLaunchOrLeftoverNib = (rel) => {
    const base = path.basename(rel).toLowerCase();
    if (/launch/.test(base)) return true;
    // Leftover Interface Builder files do not make a SwiftUI app UIKit.
    return /\.xib$/i.test(rel);
  };
  const hasAppStoryboard = nibFiles.some((f) => !isLaunchOrLeftoverNib(f));
  const hasXcode =
    has(".xcodeproj") ||
    lower.some(
      (f) =>
        f.endsWith(".xcworkspace") ||
        f.endsWith(".xcodeproj/") ||
        f.includes(".xcodeproj/") ||
        f.includes(".xcworkspace/"),
    );
  const hasPackageSwift = lower.includes("package.swift");
  const hasObjc = has(".m") || has(".mm");

  let swiftui = false;
  let uikit = false;
  for (const rel of swiftFiles.slice(0, 40)) {
    const text = readHead(path.join(cwd, rel));
    if (/import\s+SwiftUI/.test(text) || /struct\s+\w+\s*:\s*View/.test(text)) {
      swiftui = true;
    }
    const representable =
      /UIViewRepresentable|UIViewControllerRepresentable/.test(text);
    if (
      !representable &&
      /:\s*UI(View|TableView|CollectionView|Navigation)Controller\b/.test(text)
    ) {
      uikit = true;
    }
  }
  if (!swiftui && hasAppStoryboard) uikit = true;

  const native =
    swiftFiles.length > 0 ||
    hasAppStoryboard ||
    hasXcode ||
    hasPackageSwift ||
    hasObjc;

  const pkgPath = path.join(cwd, "package.json");
  let pkg = null;
  if (fs.existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    } catch {
      pkg = null;
    }
  }
  const deps = {
    ...(pkg?.dependencies || {}),
    ...(pkg?.devDependencies || {}),
  };
  const hasReact = "react" in deps || "react-dom" in deps;
  const hasVite = "vite" in deps;
  const hasNext = "next" in deps;
  const electron = "electron" in deps;
  const hasVue = "vue" in deps;
  const hasSvelte = "svelte" in deps;
  const hasAngular = "@angular/core" in deps;

  const htmlFiles = files.filter((f) => /\.html?$/i.test(f));
  const cssFiles = files.filter((f) => /\.(css|scss)$/i.test(f));
  const hasHtml = htmlFiles.length > 0;
  const hasCss = cssFiles.length > 0;
  const incidentalWeb =
    htmlFiles.length + cssFiles.length > 0 &&
    htmlFiles.concat(cssFiles).every((f) =>
      /(^|\/)(help|docs?|documentation|webview|resources|legal|licenses?)\//i.test(
        f.replace(/\\/g, "/"),
      ),
    );
  const webFramework =
    hasReact || hasNext || hasVue || hasSvelte || hasAngular;
  const hasQml = has(".qml");
  const hasDart = has(".dart") || lower.includes("pubspec.yaml");
  const cmake = readHead(path.join(cwd, "CMakeLists.txt"));
  const hasQt = hasQml || /find_package\s*\(\s*Qt/i.test(cmake);

  let kind = "none";
  let family = "none";
  let reason = "no UI surface (docs/backend only)";

  if (hasDart) {
    kind = "flutter";
    family = "other-ui";
    reason = null;
  } else if (hasQt) {
    kind = "qt";
    family = "other-ui";
    reason = null;
  } else if (native && webFramework) {
    // Real dual stack (e.g. Swift + React). Incidental help HTML is not mixed.
    kind = "mixed";
    family = "mixed";
    reason = null;
  } else if (native) {
    family = "native-apple";
    if (swiftui && uikit) kind = "mixed-native";
    else if (swiftui) kind = "swiftui";
    else if (uikit) kind = "uikit";
    else kind = "swift";
    reason = null;
  } else if (hasReact || hasNext) {
    family = "web";
    kind = electron ? "react-electron" : hasNext ? "next" : hasVite ? "react-vite" : "react";
    reason = null;
  } else if (hasVue) {
    family = "web";
    kind = "vue";
    reason = null;
  } else if (hasSvelte) {
    family = "web";
    kind = "svelte";
    reason = null;
  } else if (hasAngular) {
    family = "web";
    kind = "angular";
    reason = null;
  } else if (electron) {
    family = "web";
    kind = "electron";
    reason = null;
  } else if (hasHtml || hasCss) {
    family = "web";
    kind = "web";
    reason = null;
  } else if (pkg && (has(".tsx") || has(".jsx") || has(".vue"))) {
    family = "web";
    kind = "web";
    reason = null;
  }

  const supported = family !== "none";
  return {
    supported,
    kind,
    family,
    reason: supported ? null : reason,
    hints: {
      swiftFiles: swiftFiles.length,
      html: hasHtml,
      css: hasCss,
      react: hasReact,
      xcode: hasXcode,
      incidentalWeb,
      webFramework,
    },
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
    "Assets.xcassets",
  ];
  const vars = {};
  const fontFamilies = new Set();
  for (const rel of candidates) {
    const p = path.join(cwd, rel);
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) continue;
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
    pathsChecked: candidates.filter((c) => {
      const p = path.join(cwd, c);
      return fs.existsSync(p) && fs.statSync(p).isFile();
    }),
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
  const swift = walkHints(cwd).filter((f) => f.endsWith(".swift")).slice(0, 20);
  for (const rel of swift) {
    const text = readHead(path.join(cwd, rel), 8000);
    for (const m of text.matchAll(/NavigationLink\s*\(\s*"([^"]+)"/g)) {
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
    stopLine = `HIG stop: unsupported stack (${stack.reason}). Need a UI surface (SwiftUI/UIKit, web/CSS, or similar).`;
  }

  const designStatus = !hasDesign
    ? "missing"
    : teachComplete
      ? "pass"
      : "placeholder";

  const reviewAdaptMutation = brandVeto
    ? "blocked"
    : mutation === "unsupported"
      ? "unsupported"
      : "open";

  const preflight = [
    `context=pass`,
    `stack=${stack.supported ? "pass" : "unsupported"}`,
    `kind=${stack.kind}`,
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
    reqGlobs: REQ_GLOBS,
  };
}

const cwdArg = process.argv[2];
const result = loadContext(cwdArg ? path.resolve(cwdArg) : process.cwd());
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
