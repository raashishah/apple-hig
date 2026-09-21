#!/usr/bin/env node
/**
 * Apply mechanical chrome recipes for solved dual-stack P0 IDs.
 * Does not inject a kit or rewrite the host typeface.
 * Usage: node apply-chrome.mjs [--cwd host] [--write]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkChrome, walkSource } from "./check-chrome.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSkillRoot = path.resolve(__dirname, "..");

export const MECHANICAL_CHROME_IDS = [
  "chrome.view-mode.icons",
  "chrome.bars.system-materials",
];

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
    /(<button\b[^>]*\brole=["']radio["'][^>]*>)(\s*)(List|Grid|Table|Gallery)(\s*)(<\/button>)/gi,
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

function applySystemMaterials(file) {
  let text = file.text;
  text = text.replace(
    /((?:^|,|\n)\s*(?:header|nav|\.tab-bar|\.toolbar|\.sidebar)[^{]*)\{([^}]*)\}/gi,
    (all, sel, body) => {
      const next = body.replace(/background(?:-color)?\s*:\s*#[0-9a-fA-F]{3,8}\s*;?/gi, "");
      return `${sel}{${next}}`;
    },
  );
  text = text.replace(
    /(<(header|nav)\b[^>]*style=\{\{)([^}]*)(\}\})/gi,
    (all, open, _tag, body, close) => {
      const next = body.replace(/background(?:Color)?\s*:\s*["']#[0-9a-fA-F]{3,8}["']\s*,?/gi, "");
      return `${open}${next}${close}`;
    },
  );
  text = text.replace(
    /(<(header|nav)\b[^>]*style=["'])([^"']*)(["'])/gi,
    (all, open, _tag, body, close) => {
      const next = body.replace(/background(?:-color)?\s*:\s*#[0-9a-fA-F]{3,8}\s*;?/gi, "");
      return `${open}${next}${close}`;
    },
  );
  text = text.replace(
    /^[^\n]*(UINavigationBar|UITabBar|UIToolbar)[^\n]*(barTintColor|backgroundColor)[^\n]*\n?/gm,
    "",
  );
  return text;
}

function applyMechanicalRecipe(id, file) {
  switch (id) {
    case "chrome.view-mode.icons":
      return applyViewModeIcons(file);
    case "chrome.bars.system-materials":
      return applySystemMaterials(file);
    default: {
      const _exhaustive = id;
      void _exhaustive;
      return file.text;
    }
  }
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
