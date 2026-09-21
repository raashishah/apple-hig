#!/usr/bin/env node
/**
 * Apply mechanical chrome recipes for solved P0 IDs.
 * Does not inject a kit or rewrite the host typeface.
 * Usage: node apply-chrome.mjs [--cwd host] [--write]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkChrome, walkSource } from "./check-chrome.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSkillRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = { cwd: process.cwd(), write: false, skillRoot: defaultSkillRoot };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cwd") out.cwd = path.resolve(argv[++i]);
    else if (a === "--skill") out.skillRoot = path.resolve(argv[++i]);
    else if (a === "--write") out.write = true;
  }
  return out;
}

function applyViewModeIcons(file) {
  let text = file.text;
  text = text.replace(
    /(<button\b[^>]*>)(\s*)(List|Grid|Table|Gallery)(\s*)(<\/button>)/gi,
    (all, open, pre, word, post, close) => {
      const labeled = /\baria-label=/i.test(open)
        ? open
        : `${open.slice(0, -1)} aria-label="${word} view">`;
      return `${labeled}${pre}<svg width="16" height="16" aria-hidden="true"></svg>${post}${close}`;
    },
  );
  text = text.replace(
    /Text\(\s*"List"\s*\)/g,
    'Label("List view", systemImage: "list.bullet").labelStyle(.iconOnly)',
  );
  text = text.replace(
    /Text\(\s*"Grid"\s*\)/g,
    'Label("Grid view", systemImage: "square.grid.2x2").labelStyle(.iconOnly)',
  );
  return text;
}

function applyToolbarBudget(file) {
  let text = file.text;
  for (let i = 0; i < 6; i++) {
    const next = text.replace(
      /(<div\b[^>]*\bdata-chrome-band=["'][^"']*["'][^>]*>)([\s\S]*?)(<\/div>)(\s*)(<div\b[^>]*\bdata-chrome-band=["'][^"']*["'][^>]*>)([\s\S]*?)(<\/div>)/,
      (_, open1, body1, _c1, _ws, _open2, body2) => `${open1}${body1}${body2}</div>`,
    );
    if (next === text) break;
    text = next;
  }
  return text;
}

function applyFormColumn(file) {
  let text = file.text;
  if (!/data-form-page|data-form-body|<form\b/i.test(text)) return text;
  const max = text.match(/data-form-body[^>]*maxWidth:\s*["']([^"']+)["']/);
  text = text.replace(
    /(<(header)\b[^>]*style=\{\{)([^}]*width:\s*["']100%["'][^}]*)(\}\})/gi,
    (all, open, _tag, body, close) => {
      let next = body.replace(/width:\s*["']100%["']\s*,?/g, "");
      if (max && !/maxWidth/.test(next)) next = `maxWidth: "${max[1]}", ${next}`;
      return `${open}${next}${close}`;
    },
  );
  text = text.replace(
    /(<(header)\b[^>]*style=["'])([^"']*width:\s*100%[^"']*)(["'])/gi,
    (all, open, _tag, body, close) => {
      let next = body.replace(/width:\s*100%\s*;?/gi, "");
      if (max && !/max-width/i.test(next)) next = `max-width: ${max[1]}; ${next}`;
      return `${open}${next}${close}`;
    },
  );
  return text;
}

function applySystemMaterials(file) {
  let text = file.text;
  text = text.replace(
    /((?:^|,|\n)\s*(?:header|nav|\.tab-bar|\.toolbar|\.sidebar)[^{]*)\{([^}]*)\}/gi,
    (all, sel, body) => {
      const next = body.replace(/background(?:-color)?\s*:\s*#[0-9a-fA-F]{3,8}\s*;?/gi, "");
      return next === body ? all : `${sel}{${next}}`;
    },
  );
  text = text.replace(
    /(<(header|nav)\b[^>]*style=\{\{)([^}]*)(\}\})/gi,
    (all, open, _tag, body, close) => {
      const next = body.replace(/background(?:Color)?\s*:\s*["']#[0-9a-fA-F]{3,8}["']\s*,?/gi, "");
      return next === body ? all : `${open}${next}${close}`;
    },
  );
  text = text.replace(
    /(<(header|nav)\b[^>]*style=["'])([^"']*)(["'])/gi,
    (all, open, _tag, body, close) => {
      const next = body.replace(/background(?:-color)?\s*:\s*#[0-9a-fA-F]{3,8}\s*;?/gi, "");
      return next === body ? all : `${open}${next}${close}`;
    },
  );
  text = text.replace(
    /^[^\n]*(UINavigationBar|UITabBar|UIToolbar)[^\n]*(barTintColor|backgroundColor)[^\n]*\n?/gm,
    "",
  );
  return text;
}

function applyFashionGlass(file) {
  let text = file.text;
  text = text.replace(/\s*data-fashion-glass(?:="[^"]*")?/g, "");
  text = text.replace(
    /(<(header|nav)\b[^>]*style=\{\{)([^}]*)(\}\})/gi,
    (all, open, _tag, body, close) => {
      const next = body
        .replace(/backdropFilter\s*:\s*["'][^"']*["']\s*,?/g, "")
        .replace(/backdrop-filter\s*:\s*["'][^"']*["']\s*,?/g, "");
      return next === body ? all : `${open}${next}${close}`;
    },
  );
  text = text.replace(
    /((?:^|,|\n)\s*(?:header|nav|\.card|main|\.content)[^{]*)\{([^}]*)\}/gi,
    (all, sel, body) => {
      const next = body.replace(/backdrop-filter\s*:[^;}]+;?/gi, "");
      return next === body ? all : `${sel}{${next}}`;
    },
  );
  return text;
}

function applyCardGridHome(file) {
  let text = file.text;
  if (!/data-home|function Home\b|export function Dashboard\b|data-dashboard/.test(text)) {
    return text;
  }
  text = text.replace(
    /<(div|section)\b([^>]*\bclass(?:Name)?=["'][^"']*(?:card-grid|dashboard-cards)[^"']*["'][^>]*)>\s*([\s\S]*?)<\/\1>/i,
    (all, _tag, _attrs, inner) => {
      const items = [...inner.matchAll(/<(article|div|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) =>
        m[2].trim(),
      );
      if (!items.length) return all;
      return `<ul>\n${items.map((t) => `        <li>${t}</li>`).join("\n")}\n      </ul>`;
    },
  );
  return text;
}

function applyNestedCards(file) {
  let text = file.text;
  text = text.replace(/\s*data-nested-cards(?:="[^"]*")?/g, "");
  text = text.replace(/\s+className=["']card["']/g, "");
  text = text.replace(/\s+class=["']card["']/g, "");
  return text;
}

function applyFilterDensity(file) {
  let text = file.text;
  if (!/data-chrome-band|data-list-pane|toolbar|filter/i.test(text)) return text;
  text = text.replace(
    /<label>\s*<input\b[^>]*type=["']checkbox["'][^>]*\/?>\s*([^<]+?)\s*<\/label>/gi,
    (_, phrase) => {
      const name = phrase.trim();
      return `<button type="button" aria-label="${name}" aria-pressed={false}><svg width="16" height="16" aria-hidden="true"></svg></button>`;
    },
  );
  return text;
}

function applySidebarCollapsible(file) {
  let text = file.text;
  if (!/<aside\b|data-sidebar|NavigationSplitView/.test(text)) return text;
  if (
    /aria-expanded=/.test(text) ||
    /data-collapsed/.test(text) ||
    /aria-label=["'][^"']*collapse sidebar/i.test(text) ||
    /sidebarToggle/.test(text)
  ) {
    return text;
  }
  text = text.replace(
    /(<aside\b[^>]*>)(\s*)/i,
    `$1$2<button type="button" aria-expanded={true} aria-label="Collapse sidebar"></button>$2`,
  );
  return text;
}

const RECIPES = {
  "chrome.view-mode.icons": applyViewModeIcons,
  "chrome.list-browser.toolbar-budget": applyToolbarBudget,
  "chrome.list-browser.filter-density": applyFilterDensity,
  "chrome.form.column-cohesion": applyFormColumn,
  "chrome.sidebar.collapsible": applySidebarCollapsible,
  "chrome.bars.system-materials": applySystemMaterials,
  "chrome.materials.fashion-glass": applyFashionGlass,
  "chrome.layout.card-grid-home": applyCardGridHome,
  "chrome.ive.nested-cards": applyNestedCards,
};

export const MECHANICAL_CHROME_IDS = Object.keys(RECIPES);

function applyMechanicalRecipe(id, file) {
  const fn = RECIPES[id];
  if (!fn) {
    const _exhaustive = id;
    void _exhaustive;
    return file.text;
  }
  return fn(file);
}

export function applyChrome(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const skillRoot = path.resolve(options.skillRoot || defaultSkillRoot);
  const write = Boolean(options.write);
  const register = options.register;
  const before = checkChrome({ cwd, skillRoot, register });
  const wanted = new Set(
    before.fails.map((f) => f.id).filter((id) => MECHANICAL_CHROME_IDS.includes(id)),
  );
  const files = walkSource(cwd);
  const applied = [];
  for (const id of MECHANICAL_CHROME_IDS) {
    if (!wanted.has(id)) continue;
    for (const file of files) {
      const next = applyMechanicalRecipe(id, file);
      if (next === file.text) continue;
      file.text = next;
      applied.push({ id, file: file.path });
    }
  }
  if (write) {
    for (const file of files) {
      const abs = path.join(cwd, file.path);
      const prev = fs.readFileSync(abs, "utf8");
      if (prev === file.text) continue;
      fs.writeFileSync(abs, file.text);
    }
  }
  const after = write
    ? checkChrome({ cwd, skillRoot, register })
    : checkChrome({
        cwd,
        skillRoot,
        register,
        files: files.map((f) => ({ path: f.path, text: f.text })),
      });
  return {
    cwd,
    write,
    applied,
    before,
    after,
    pass: after.pass,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const result = applyChrome({ ...args, write: args.write });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(result.after.pass ? 0 : 1);
}

const isCli =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isCli) {
  try {
    main();
  } catch (err) {
    process.stderr.write(String(err?.stack || err) + "\n");
    process.exit(1);
  }
}
