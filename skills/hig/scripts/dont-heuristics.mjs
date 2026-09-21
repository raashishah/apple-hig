/**
 * Mechanical Don't scanners for catalog surfaces with complete Don't coverage.
 * Do not rewrite host fonts. Do not inject a kit. Do not invent missing widgets.
 */

import fs from "node:fs";
import path from "node:path";
import { DETECTORS } from "../knowledge/chrome/detectors.mjs";
import { applyChromeRecipe } from "./apply-chrome.mjs";

const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong",
  "inherit",
  "initial",
  "unset",
  "revert",
  "caption",
  "icon",
  "menu",
  "message-box",
  "small-caption",
  "status-bar",
]);

function hit(file, evidence) {
  return { file, evidence: String(evidence).replace(/\s+/g, " ").trim().slice(0, 180) };
}

function unquote(raw) {
  const v = String(raw).trim();
  if (v.startsWith('"') && v.endsWith('"')) return JSON.parse(v);
  return v;
}

export function normalizePhrase(s) {
  return String(s || "")
    .replace(/`([^`]+)`/g, "$1")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseDontHeuristics(text) {
  const heuristics = [];
  let current = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const start = raw.match(/^\s*-\s+id:\s*(\S+)\s*$/);
    if (start) {
      current = { id: start[1], match: "", chromeIds: [] };
      heuristics.push(current);
      continue;
    }
    if (!current) continue;
    const match = raw.match(/^\s+match:\s*(.+)\s*$/);
    if (match) {
      current.match = unquote(match[1]);
      continue;
    }
    const chrome = raw.match(/^\s+-\s+(chrome\.[a-z0-9.-]+)\s*$/);
    if (chrome) current.chromeIds.push(chrome[1]);
  }
  return heuristics;
}

export function loadDontHeuristics(skillRoot) {
  const file = path.join(skillRoot, "knowledge", "chrome", "dont-heuristics.yaml");
  if (!fs.existsSync(file)) return [];
  return parseDontHeuristics(fs.readFileSync(file, "utf8"));
}

export function matchHeuristic(bullet, heuristics) {
  const n = normalizePhrase(bullet);
  if (!n) return null;
  let best = null;
  let bestLen = 0;
  for (const h of heuristics || []) {
    const m = normalizePhrase(h.match);
    if (!m) continue;
    if (n === m || n.includes(m)) {
      if (m.length >= bestLen) {
        best = h;
        bestLen = m.length;
      }
    }
  }
  return best;
}

function blocksWithAttr(text, attr) {
  const out = [];
  const openRe = new RegExp(`<([A-Za-z][\\w]*)\\b[^>]*\\b${attr}\\b[^>]*>`, "g");
  let m;
  while ((m = openRe.exec(text))) {
    const tag = m[1];
    let i = m.index + m[0].length;
    let depth = 1;
    const reopen = new RegExp(`<${tag}\\b`, "gi");
    const close = new RegExp(`</${tag}\\s*>`, "gi");
    while (depth > 0 && i < text.length) {
      reopen.lastIndex = i;
      close.lastIndex = i;
      const nOpen = reopen.exec(text);
      const nClose = close.exec(text);
      if (!nClose) {
        i = Math.min(text.length, m.index + 4000);
        break;
      }
      if (nOpen && nOpen.index < nClose.index) {
        depth += 1;
        i = nOpen.index + nOpen[0].length;
      } else {
        depth -= 1;
        i = nClose.index + nClose[0].length;
      }
    }
    out.push({ start: m.index, end: i, text: text.slice(m.index, i) });
  }
  return out;
}

function chromeRegions(text) {
  const tagged = text.match(/<(header|nav)\b[^>]*>[\s\S]*?<\/\1>/gi) || [];
  const css =
    text.match(/(header|nav|\.tab-bar|\.toolbar|\.sidebar)\s*[^{]{0,80}\{[^}]*\}/gi) || [];
  const attrs = [
    ...blocksWithAttr(text, "data-nav").map((b) => b.text),
    ...blocksWithAttr(text, "data-sidebar").map((b) => b.text),
  ];
  return [...tagged, ...css, ...attrs];
}

function isHeroType(text) {
  return (
    /font-size\s*:\s*(?:3[2-9]|[4-9]\d|\d{3})px/i.test(text) ||
    /font-size\s*:\s*(?:1\.75|1\.[8-9]|[2-9](?:\.\d+)?)rem/i.test(text) ||
    /fontSize\s*:\s*["']?(?:3[2-9]|[4-9]\d|\d{3})/.test(text) ||
    /text-(4xl|5xl|6xl|7xl|8xl|9xl)/.test(text) ||
    /\bhero[- ]?type\b|\bclass(?:Name)?=["'][^"']*\bhero\b/.test(text)
  );
}

function scanHeroType(files) {
  const out = [];
  for (const f of files) {
    const panes = blocksWithAttr(f.text, "data-list-pane");
    const regions = panes.length ? panes.map((p) => p.text) : [];
    if (!regions.length && /data-list-pane/.test(f.text) && isHeroType(f.text)) {
      out.push(hit(f.path, "hero type near a list pane"));
      continue;
    }
    for (const region of regions) {
      if (isHeroType(region)) out.push(hit(f.path, "hero type inside a list pane"));
    }
  }
  return out;
}

function applyHeroType(text) {
  const panes = blocksWithAttr(text, "data-list-pane");
  if (!panes.length) return text;
  let next = text;
  for (const pane of [...panes].reverse()) {
    let region = pane.text
      .replace(/font-size\s*:\s*(?:3[2-9]|[4-9]\d|\d{3})px/gi, "font-size: 17px")
      .replace(/font-size\s*:\s*(?:1\.75|1\.[8-9]|[2-9](?:\.\d+)?)rem/gi, "font-size: 1.0625rem")
      .replace(/fontSize\s*:\s*["']?(?:3[2-9]|[4-9]\d|\d{3})["']?/g, "fontSize: 17")
      .replace(/\btext-(4xl|5xl|6xl|7xl|8xl|9xl)\b/g, "text-base")
      .replace(/\shero-type\b/g, "")
      .replace(/(\bclass(?:Name)?=["'][^"']*)\bhero\b/g, "$1");
    next = next.slice(0, pane.start) + region + next.slice(pane.end);
  }
  return next;
}

function scanAllCaps(files) {
  const out = [];
  for (const f of files) {
    if (
      /text-transform\s*:\s*uppercase/i.test(f.text) ||
      /textTransform\s*:\s*["']uppercase["']/.test(f.text) ||
      /\bclass(?:Name)?=["'][^"']*\buppercase\b/.test(f.text)
    ) {
      out.push(hit(f.path, "uppercase transform on labels"));
    }
  }
  return out;
}

function applyAllCaps(text) {
  return text
    .replace(/text-transform\s*:\s*uppercase\s*;?/gi, "")
    .replace(/textTransform\s*:\s*["']uppercase["']\s*,?/g, "")
    .replace(/(\bclass(?:Name)?=["'][^"']*)\buppercase\b\s*/g, "$1");
}

function collectFamilies(text) {
  const found = new Set();
  const re = /font(?:-family|Family)\s*[:=]\s*([^;}]+)/gi;
  let m;
  while ((m = re.exec(text))) {
    for (const part of m[1].split(",")) {
      const name = part.trim().replace(/^["']|["']$/g, "").trim().toLowerCase();
      if (!name || GENERIC_FAMILIES.has(name) || name.startsWith("var(")) continue;
      found.add(name);
    }
  }
  return found;
}

function scanFontFamilies(files) {
  const names = new Set();
  for (const f of files) {
    for (const name of collectFamilies(f.text)) names.add(name);
  }
  if (names.size >= 5) {
    return [hit("", `${names.size} font families`)];
  }
  return [];
}

function rgbToHueBucket(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (s < 0.25 || l < 0.08 || l > 0.95) return null;
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return Math.floor(hue / 30);
}

function hexToHueBucket(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length < 6) return null;
  return rgbToHueBucket(
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  );
}

function scanRainbow(files) {
  const out = [];
  for (const f of files) {
    for (const region of chromeRegions(f.text)) {
      const buckets = new Set();
      for (const m of region.matchAll(/#([0-9a-f]{3,8})\b/gi)) {
        const bucket = hexToHueBucket(m[1]);
        if (bucket != null) buckets.add(bucket);
      }
      for (const m of region.matchAll(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)) {
        const bucket = rgbToHueBucket(Number(m[1]), Number(m[2]), Number(m[3]));
        if (bucket != null) buckets.add(bucket);
      }
      if (buckets.size >= 4) out.push(hit(f.path, "four or more saturated hues in nav"));
    }
  }
  return out;
}

function isMutedColorValue(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return s < 0.25 && l > 0.35 && l < 0.78;
}

function isMutedDecl(s) {
  if (/opacity\s*:\s*0\.[0-4]/.test(s) || /text-gray-(400|500|300)/.test(s)) return true;
  for (const m of s.matchAll(/color\s*[:=]\s*["']?#([0-9a-f]{3,8})\b/gi)) {
    let h = m[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length < 6) continue;
    if (isMutedColorValue(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16))) {
      return true;
    }
  }
  for (const m of s.matchAll(/color\s*[:=]\s*["']?rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)) {
    if (isMutedColorValue(Number(m[1]), Number(m[2]), Number(m[3]))) return true;
  }
  return false;
}

function scanMutedLabels(files) {
  const out = [];
  for (const f of files) {
    const html = [...f.text.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/gi)].map(
      (m) => `${m[1]} ${m[2]}`,
    );
    const css = [...f.text.matchAll(/\blabel\b[^{]{0,40}\{([^}]*)\}/gi)].map((m) => m[1]);
    const parts = [...html, ...css];
    if (!parts.length) continue;
    if (parts.every((p) => isMutedDecl(p))) {
      out.push(hit(f.path, "every label uses muted color"));
    }
  }
  return out;
}

function applyMutedLabels(text) {
  return text.replace(/<label\b([^>]*)>([\s\S]*?)<\/label>/gi, (all, attrs, inner) => {
    if (!isMutedDecl(`${attrs} ${inner}`)) return all;
    const nextAttrs = attrs
      .replace(/color\s*[:=]\s*["']?#[0-9a-fA-F]{3,8}["']?\s*;?/gi, "")
      .replace(/color\s*[:=]\s*["']?rgb\([^)]*\)["']?\s*,?/gi, "")
      .replace(/opacity\s*:\s*0\.[0-4]\s*;?/g, "")
      .replace(/\btext-gray-(300|400|500)\b/g, "");
    const nextInner = inner
      .replace(/color\s*[:=]\s*["']?#[0-9a-fA-F]{3,8}["']?\s*;?/gi, "")
      .replace(/opacity\s*:\s*0\.[0-4]\s*;?/g, "");
    return `<label${nextAttrs}>${nextInner}</label>`;
  });
}

function scanGlass(files) {
  return DETECTORS["chrome.materials.fashion-glass"](files);
}

function applyGlass(text) {
  let next = text.replace(/\s*data-fashion-glass(?:="[^"]*")?/g, "");
  next = next.replace(
    /(<(header|nav)\b[^>]*style=\{\{)([^}]*)(\}\})/gi,
    (all, open, _tag, body, close) => {
      const stripped = body
        .replace(/backdropFilter\s*:\s*["'][^"']*["']\s*,?/g, "")
        .replace(/backdrop-filter\s*:\s*["'][^"']*["']\s*,?/g, "");
      return stripped === body ? all : `${open}${stripped}${close}`;
    },
  );
  next = next.replace(
    /((?:^|,|\n)\s*(?:header|nav|\.card|main|\.content)[^{]*)\{([^}]*)\}/gi,
    (all, sel, body) => {
      const stripped = body.replace(/backdrop-filter\s*:[^;}]+;?/gi, "");
      return stripped === body ? all : `${sel}{${stripped}}`;
    },
  );
  return next;
}

function scanBlackWhiteChrome(files) {
  const out = [];
  for (const f of files) {
    for (const region of chromeRegions(f.text)) {
      if (
        /(background(?:-color|Color)?|color)\s*[:=]\s*["']?(?:#(?:000(?:000)?|fff(?:fff)?)|black|white)\b/i.test(
          region,
        )
      ) {
        out.push(hit(f.path, "hard-coded black/white on chrome"));
      }
    }
  }
  return out;
}

function applyBlackWhiteChrome(text) {
  let next = text.replace(
    /((?:^|,|\n)\s*(?:header|nav|\.tab-bar|\.toolbar|\.sidebar)[^{]*)\{([^}]*)\}/gi,
    (all, sel, body) => {
      const stripped = body
        .replace(/(?:background(?:-color)?|color)\s*:\s*(?:#(?:000(?:000)?|fff(?:fff)?)|black|white)\s*;?/gi, "");
      return stripped === body ? all : `${sel}{${stripped}}`;
    },
  );
  next = next.replace(
    /(<(header|nav)\b[^>]*style=\{\{)([^}]*)(\}\})/gi,
    (all, open, _tag, body, close) => {
      const stripped = body.replace(
        /(?:background(?:Color)?|color)\s*:\s*["'](?:#(?:000(?:000)?|fff(?:fff)?)|black|white)["']\s*,?/gi,
        "",
      );
      return stripped === body ? all : `${open}${stripped}${close}`;
    },
  );
  next = next.replace(
    /((?:^|,|\n)\s*(?:header|nav|\.tab-bar|\.toolbar|\.sidebar)[^{]*)\{\s*\}/gi,
    "",
  );
  return next;
}

function colorOnlyRule(text) {
  return (
    /\.error[^{]{0,60}\{[^}]*\bcolor\s*:[^}]*\}/i.test(text) &&
    !/\.error[^{]{0,60}\{[^}]*(border|outline|background|box-shadow|content)\s*:/i.test(text)
  ) || (
    /\[(?:aria-selected|aria-current)\][^{]{0,40}\{[^}]*\bcolor\s*:[^}]*\}/i.test(text) &&
    !/\[(?:aria-selected|aria-current)\][^{]{0,40}\{[^}]*(border|font-weight|background|text-decoration)\s*:/i.test(
      text,
    )
  );
}

function scanColorOnly(files) {
  const out = [];
  for (const f of files) {
    if (colorOnlyRule(f.text)) out.push(hit(f.path, "error/selected conveyed by color only"));
  }
  return out;
}

function applyColorOnly(text) {
  let next = text.replace(
    /(\.error[^{]{0,60}\{)([^}]*)(\})/gi,
    (all, open, body, close) => {
      if (/border\s*:/.test(body)) return all;
      return `${open}${body} border: 1px solid currentColor;${close}`;
    },
  );
  next = next.replace(
    /(\[(?:aria-selected|aria-current)\][^{]{0,40}\{)([^}]*)(\})/gi,
    (all, open, body, close) => {
      if (/font-weight\s*:/.test(body)) return all;
      return `${open}${body} font-weight: 600;${close}`;
    },
  );
  return next;
}

function scanBounce(files) {
  const out = [];
  for (const f of files) {
    if (/\bbounce\b/i.test(f.text) || /cubic-bezier\(\s*0\s*,\s*[12]\.\d+/i.test(f.text)) {
      out.push(hit(f.path, "bounce easing on appear"));
    }
  }
  return out;
}

function applyBounce(text) {
  return text
    .replace(/\banimation(?:-name)?\s*:\s*bounce\b[^;]*/gi, "animation: none")
    .replace(/cubic-bezier\(\s*0\s*,\s*[12]\.\d+[^)]*\)/gi, "ease-out")
    .replace(/\bbounce\s+\d/gi, "ease-out ");
}

function scanLockedOut(files) {
  const out = [];
  for (const f of files) {
    if (
      /\{[^}]*(?:animation(?:-name)?\s*:)[^}]*pointer-events\s*:\s*none[^}]*\}/i.test(f.text) ||
      /\{[^}]*pointer-events\s*:\s*none[^}]*(?:animation(?:-name)?\s*:)[^}]*\}/i.test(f.text)
    ) {
      out.push(hit(f.path, "pointer-events none during animation"));
    }
  }
  return out;
}

function applyLockedOut(text) {
  return text.replace(/\{[^}]*\}/g, (block) => {
    if (!/animation(?:-name)?\s*:/i.test(block) || !/pointer-events\s*:\s*none/i.test(block)) {
      return block;
    }
    return block.replace(/pointer-events\s*:\s*none\s*;?/gi, "");
  });
}

function isLargeScale(text) {
  for (const m of text.matchAll(/scale(?:3d)?\(\s*(-?[\d.]+)/gi)) {
    const n = Math.abs(Number(m[1]));
    if (Number.isFinite(n) && (n >= 1.08 || (n > 0 && n <= 0.92))) return true;
  }
  return false;
}

function hasParallaxZoom(text) {
  return (
    isLargeScale(text) ||
    /translate3d\s*\(/i.test(text) ||
    /\bparallax\b/i.test(text) ||
    /zoom\s*:\s*(?:1\.\d*[1-9]|[2-9])/i.test(text)
  );
}

function scanReduceMotion(files) {
  const blob = files.map((f) => f.text).join("\n");
  if (!hasParallaxZoom(blob)) return [];
  if (/prefers-reduced-motion/i.test(blob)) return [];
  return [hit(files[0]?.path || "", "parallax/zoom without Reduce Motion")];
}

const REDUCE_CSS = `@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none; transition: none; transform: none; }
}
`;

function applyReduceMotion(text, file) {
  if (/prefers-reduced-motion/i.test(text)) return text;
  if (/\.css$/i.test(file.path) && hasParallaxZoom(text)) {
    return `${text.trimEnd()}\n${REDUCE_CSS}`;
  }
  return text;
}

function labelCovers(text, index, attrs) {
  if (/\baria-label=|\baria-labelledby=/i.test(attrs)) return true;
  const before = text.slice(Math.max(0, index - 500), index);
  if (/<label\b[^>]*>((?!<\/label>).)*$/is.test(before)) return true;
  const idm = attrs.match(/\bid=["']([^"']+)["']/i);
  if (idm && new RegExp(`<label\\b[^>]*\\bfor=["']${idm[1]}["']`, "i").test(text)) return true;
  return false;
}

function scanPlaceholder(files) {
  const out = [];
  const re = /<(input|textarea)\b([^>]*?\bplaceholder=["']([^"']+)["'][^>]*?)(\s*\/?)>/gi;
  for (const f of files) {
    let m;
    const copy = f.text;
    while ((m = re.exec(copy))) {
      if (labelCovers(copy, m.index, m[2])) continue;
      out.push(hit(f.path, `placeholder-only ${m[3]}`));
    }
  }
  return out;
}

function applyPlaceholder(text) {
  const re = /<(input|textarea)\b([^>]*?\bplaceholder=["']([^"']+)["'][^>]*?)(\s*\/?)>/gi;
  return text.replace(re, (all, tag, attrs, hint, self, offset, src) => {
    if (labelCovers(src, offset, attrs)) return all;
    return `<${tag}${attrs} aria-label="${hint}"${self}>`;
  });
}

function scanTinyCritical(files) {
  const out = [];
  const re =
    /font-size\s*:\s*(?:[0-9]|10)px[\s\S]{0,80}(?:\$|price|total|error|amount)|(?:\$|price|total|error|amount)[\s\S]{0,80}font-size\s*:\s*(?:[0-9]|10)px/i;
  for (const f of files) {
    if (re.test(f.text) || /text-\[(?:[0-9]|10)px\][\s\S]{0,80}(?:\$|price|total)/i.test(f.text)) {
      out.push(hit(f.path, "tiny type on critical data"));
    }
  }
  return out;
}

function applyTinyCritical(text) {
  return text
    .replace(/font-size\s*:\s*(?:[0-9]|10)px/gi, "font-size: 13px")
    .replace(/text-\[(?:[0-9]|10)px\]/g, "text-[13px]");
}

function fileHasSearchWidget(text) {
  return (
    /type=["']search["']/i.test(text) ||
    /role=["']search["']/i.test(text) ||
    /\.searchable\b/.test(text) ||
    /\b(UISearchBar|UISearchController|NSSearchField)\b/.test(text)
  );
}

function fileHasCollection(text) {
  return (
    /<(ul|ol|table)\b/i.test(text) ||
    /role=["']list["']/i.test(text) ||
    /data-list-pane/.test(text) ||
    /\bList\s*[\({]/.test(text) ||
    /card-grid|dashboard-cards/.test(text)
  );
}

function scanHideOnlySearch(files) {
  const blob = files.map((f) => f.text).join("\n");
  if (!fileHasSearchWidget(blob)) return [];
  const out = [];
  if (!fileHasCollection(blob)) {
    const f = files.find((x) => fileHasSearchWidget(x.text)) || files[0];
    out.push(hit(f.path, "search is the only path to content"));
  }
  for (const f of files) {
    if (
      /\{\s*(query|searchQuery|q)\s*(&&|\?)/.test(f.text) &&
      /<(ul|ol|table)\b/i.test(f.text)
    ) {
      out.push(hit(f.path, "collection gated on search query"));
    }
    if (/<(ul|ol|table)\b[^>]*hidden=\{\s*!/.test(f.text)) {
      out.push(hit(f.path, "list hidden unless query"));
    }
  }
  return out;
}

function scanSearchSpinner(files) {
  const out = [];
  for (const f of files) {
    if (!fileHasSearchWidget(f.text)) continue;
    const types = /on(Change|Input)\s*=/.test(f.text);
    const busy =
      /aria-busy=["']true["']/.test(f.text) ||
      /\bspinner\b/i.test(f.text) ||
      /setLoading\s*\(\s*true/.test(f.text);
    const debounced = /\bdebounce\b|\bsetTimeout\b/.test(f.text);
    if (types && busy && !debounced) {
      out.push(hit(f.path, "spinner on search keystroke"));
    }
  }
  return out;
}

function applySearchSpinner(text) {
  if (!fileHasSearchWidget(text)) return text;
  if (!/on(Change|Input)\s*=/.test(text)) return text;
  if (/\bdebounce\b|\bsetTimeout\b/.test(text)) return text;
  return text
    .replace(/\s*aria-busy=["']true["']/gi, "")
    .replace(/\s*<span[^>]*\bspinner\b[^>]*>(?:\s*<\/span>)?/gi, "")
    .replace(/\s*<progress\b[^>]*\/?>(?:\s*<\/progress>)?/gi, "");
}

function scanSearchDump(files) {
  const out = [];
  for (const f of files) {
    if (!fileHasSearchWidget(f.text)) continue;
    if (
      /(?:placeholder|aria-label)=["'][^"']*\b(settings|commands|command palette)\b/i.test(
        f.text,
      ) ||
      /\b(cmdk|Command\.Dialog|data-command-palette)\b/.test(f.text)
    ) {
      out.push(hit(f.path, "search used as settings or command dump"));
    }
  }
  return out;
}

const CUTE_ERROR =
  /\b(oops(?:ie)?|whoops(?:ie)?|uh-oh|uh oh|yikes|d'oh|my bad|nice try|silly|champ|butterfingers|try harder|not this time|well that didn't)\b/i;
const ERROR_NEXT_STEP =
  /\b(try again|enter a? ?valid|check your|retry|go back|use a different|contact|add a|choose a|re-?enter|fix the|correct the)\b/i;
const HELP_ATTR =
  /data-help|data-hint|aria-description|class(?:Name)?=["'][^"']*\b(?:help|hint|description|empty-state)\b/;
const SYSTEM_JOB =
  /sign\s*in\s*with\s*apple|apple\s*pay|would like to access your|allow .{0,80}to (access|use) your (camera|mic(?:rophone)?|location|photos)/i;
const SYSTEM_EXTRA =
  /\b(unlock|magic|exclusive|delight|sprinkle|continue to enjoy|don't miss|we need you to)\b/i;

function innerText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function errorRegions(text) {
  const out = [];
  const tagRe =
    /<(p|div|span|small)\b([^>]*(?:role=["']alert["']|aria-live|data-error|class(?:Name)?=["'][^"']*\berror\b)[^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = tagRe.exec(text))) out.push(innerText(m[3]));
  const assignRe =
    /\b(?:error(?:Message|Text)?|errMsg|setError)\s*(?:=|\()\s*["']([^"']+)["']/g;
  while ((m = assignRe.exec(text))) out.push(m[1]);
  return out;
}

function scanSarcasticError(files) {
  const out = [];
  for (const f of files) {
    for (const copy of errorRegions(f.text)) {
      if (CUTE_ERROR.test(copy) && !ERROR_NEXT_STEP.test(copy)) {
        out.push(hit(f.path, "sarcastic error without a next step"));
      }
    }
  }
  return out;
}

function isTitleCaseLong(s) {
  const words = String(s || "")
    .replace(/[^\w\s'-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 6) return false;
  const skip = new Set(["a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "at"]);
  let content = 0;
  let titled = 0;
  for (const w of words) {
    if (skip.has(w.toLowerCase())) continue;
    content += 1;
    if (/^[A-Z][a-z]/.test(w) || /^[A-Z]{2,}$/.test(w)) titled += 1;
  }
  return content >= 4 && titled >= Math.ceil(content * 0.7);
}

function toSentenceCase(s) {
  return String(s).replace(/[A-Za-z][A-Za-z']*/g, (word, offset, whole) => {
    if (/^[A-Z]{2,4}$/.test(word)) return word;
    const lead = whole.slice(0, offset);
    if (offset === 0 || /[.!?]\s*$/.test(lead)) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
  });
}

function helpSpans(text) {
  const spans = [];
  const tagRe = /<(p|small|span|div|em)\b([^>]*)>([^<]{8,})<\/\1>/gi;
  let m;
  while ((m = tagRe.exec(text))) {
    if (!HELP_ATTR.test(m[2])) continue;
    const inner = m[3];
    const start = m.index + m[0].indexOf(inner);
    spans.push({ start, end: start + inner.length, text: inner });
  }
  const propRe =
    /\b(?:helpText|description|emptyMessage|hintText)\s*[:=]\s*(["'])([^"']{8,})\1/g;
  while ((m = propRe.exec(text))) {
    const inner = m[2];
    const start = m.index + m[0].lastIndexOf(inner);
    spans.push({ start, end: start + inner.length, text: inner });
  }
  const ariaRe = /aria-description=["']([^"']{8,})["']/g;
  while ((m = ariaRe.exec(text))) {
    const inner = m[1];
    const start = m.index + m[0].indexOf(inner);
    spans.push({ start, end: start + inner.length, text: inner });
  }
  return spans;
}

function scanTitleCaseHelp(files) {
  const out = [];
  for (const f of files) {
    for (const span of helpSpans(f.text)) {
      if (isTitleCaseLong(span.text)) {
        out.push(hit(f.path, "title case on long help"));
      }
    }
  }
  return out;
}

function applyTitleCaseHelp(text) {
  const spans = helpSpans(text).filter((s) => isTitleCaseLong(s.text));
  if (!spans.length) return text;
  let next = text;
  for (const span of [...spans].sort((a, b) => b.start - a.start)) {
    next = next.slice(0, span.start) + toSentenceCase(span.text) + next.slice(span.end);
  }
  return next;
}

function dialogRegions(text) {
  const out = [];
  const tagRe = /<(dialog)\b([^>]*)>([\s\S]*?)<\/dialog>/gi;
  let m;
  while ((m = tagRe.exec(text))) out.push(m[0]);
  const roleRe =
    /<([A-Za-z][\w]*)\b([^>]*role=["'](?:dialog|alertdialog)["'][^>]*)>([\s\S]*?)<\/\1>/gi;
  while ((m = roleRe.exec(text))) out.push(m[0]);
  return out;
}

function scanRewriteSystemAlerts(files) {
  const out = [];
  for (const f of files) {
    if (
      /<(button|a|span)\b[^>]*>\s*((?:Continue|Log in|Unlock|Join) with (?:your )?Apple(?: ID)?|Pay With Apple Pay Now!?)\s*</i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "rewritten Sign in/Pay control label"));
    }
    for (const region of dialogRegions(f.text)) {
      const copy = innerText(region);
      if (!SYSTEM_JOB.test(copy)) continue;
      const leftover = copy
        .replace(/sign\s*in\s*with\s*apple/gi, "")
        .replace(/apple\s*pay/gi, "")
        .replace(/\b(cancel|continue|ok|allow|don'?t allow|pay)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
      if (leftover.length > 24 || SYSTEM_EXTRA.test(copy)) {
        out.push(hit(f.path, "rewritten system Sign in/Pay/permission alert"));
      }
    }
  }
  return out;
}

function isHiddenMarkup(html) {
  return (
    /\bhidden\b/i.test(html) ||
    /aria-hidden=["']true["']/i.test(html) ||
    /\bsr-only\b/.test(html) ||
    /display\s*:\s*none/i.test(html) ||
    /opacity\s*:\s*0(?:\.0+)?(?:\s|;|"|')/i.test(html) ||
    /visibility\s*:\s*hidden/i.test(html) ||
    /font-size\s*:\s*(?:[0-9]|10)px/i.test(html)
  );
}

function permissionRegions(text) {
  const extra = [];
  const re = /<([A-Za-z][\w]*)\b([^>]*data-permission[^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) extra.push(m[0]);
  return [...dialogRegions(text), ...extra];
}

function controlTags(region) {
  return [
    ...(region.match(/<button\b[\s\S]*?<\/button>/gi) || []),
    ...(region.match(/<a\b[\s\S]*?<\/a>/gi) || []),
  ];
}

function scanDarkPatternAllow(files) {
  const out = [];
  for (const f of files) {
    for (const region of permissionRegions(f.text)) {
      const controls = controlTags(region);
      const allow = controls.filter((c) => />\s*Allow\s*</i.test(c));
      if (!allow.length) continue;
      const deny = controls.filter((c) =>
        />\s*(Don't Allow|Don't allow|Deny|Not now)\s*</i.test(c),
      );
      const readableDeny = deny.filter((c) => !isHiddenMarkup(c));
      if (!readableDeny.length) {
        out.push(hit(f.path, "Allow is the only readable permission control"));
      }
    }
  }
  return out;
}

function applyDarkPatternAllow(text) {
  return text.replace(
    /<(button|a)\b([^>]*)>(\s*(?:Don't Allow|Don't allow|Deny|Not now)\s*)<\/\1>/gi,
    (all, tag, attrs, label) => {
      if (!isHiddenMarkup(all)) return all;
      const nextAttrs = attrs
        .replace(/\s*hidden(?:=["'][^"']*["'])?/gi, "")
        .replace(/\s*aria-hidden=["']true["']/gi, "")
        .replace(/(\bclass(?:Name)?=["'][^"']*)\bsr-only\b\s*/g, "$1")
        .replace(/display\s*:\s*none\s*;?/gi, "")
        .replace(/opacity\s*:\s*0(?:\.0+)?\s*;?/gi, "")
        .replace(/visibility\s*:\s*hidden\s*;?/gi, "")
        .replace(/font-size\s*:\s*(?:[0-9]|10)px\s*;?/gi, "");
      return `<${tag}${nextAttrs}>${label}</${tag}>`;
    },
  );
}

function isMarketingFile(file) {
  return (
    /data-marketing|data-register=["']brand["']/i.test(file.text) ||
    /(^|\/)(Landing|Marketing|Hero)(Page|View|Screen)?\.(tsx|jsx|html|vue|swift)$/i.test(
      file.path,
    )
  );
}

function hasDevicePrompt(text) {
  return (
    /getUserMedia\s*\(/i.test(text) ||
    /geolocation\.getCurrentPosition/i.test(text) ||
    /would like to access your (camera|mic(?:rophone)?|location)/i.test(text) ||
    /allow .{0,40}(camera|mic(?:rophone)?|location)/i.test(text)
  );
}

function scanPreemptiveMarketing(files) {
  const out = [];
  for (const f of files) {
    if (!isMarketingFile(f)) continue;
    if (hasDevicePrompt(f.text)) {
      out.push(hit(f.path, "camera/mic/location prompt on a marketing screen"));
    }
  }
  return out;
}

function scanRewriteOrAutomate(files) {
  const out = scanRewriteSystemAlerts(files);
  for (const f of files) {
    if (
      /querySelector[\s\S]{0,120}Allow[\s\S]{0,40}\.click\s*\(/i.test(f.text) ||
      /\.click\s*\([\s\S]{0,40}Allow/i.test(f.text)
    ) {
      out.push(hit(f.path, "scripted Allow click"));
    }
    if (
      /(useEffect|componentDidMount|DOMContentLoaded|onMounted)\s*\([\s\S]{0,500}(requestPermission|getUserMedia|geolocation\.getCurrentPosition)/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "auto permission without a gesture"));
    }
  }
  return out;
}

function scanOpaqueBrandBars(files) {
  return DETECTORS["chrome.bars.system-materials"](files);
}

function applyOpaqueBrandBars(text) {
  let next = text.replace(
    /((?:^|,|\n)\s*(?:header|nav|\.tab-bar|\.toolbar|\.sidebar)[^{]*)\{([^}]*)\}/gi,
    (all, sel, body) => {
      const stripped = body.replace(/background(?:-color)?\s*:\s*#[0-9a-fA-F]{3,8}\s*;?/gi, "");
      return stripped === body ? all : `${sel}{${stripped}}`;
    },
  );
  next = next.replace(
    /(<(header|nav)\b[^>]*style=\{\{)([^}]*)(\}\})/gi,
    (all, open, _tag, body, close) => {
      const stripped = body.replace(
        /background(?:Color)?\s*:\s*["']#[0-9a-fA-F]{3,8}["']\s*,?/gi,
        "",
      );
      return stripped === body ? all : `${open}${stripped}${close}`;
    },
  );
  next = next.replace(
    /(<(header|nav)\b[^>]*style=["'])([^"']*)(["'])/gi,
    (all, open, _tag, body, close) => {
      const stripped = body.replace(/background(?:-color)?\s*:\s*#[0-9a-fA-F]{3,8}\s*;?/gi, "");
      return stripped === body ? all : `${open}${stripped}${close}`;
    },
  );
  next = next.replace(
    /^[^\n]*(UINavigationBar|UITabBar|UIToolbar)[^\n]*(barTintColor|backgroundColor)[^\n]*\n?/gm,
    "",
  );
  next = next.replace(
    /((?:^|,|\n)\s*(?:header|nav|\.tab-bar|\.toolbar|\.sidebar)[^{]*)\{\s*\}/gi,
    "",
  );
  return next;
}

function scanWatermarks(files) {
  const out = [];
  for (const f of files) {
    if (
      /data-watermark/.test(f.text) ||
      /class(?:Name)?=["'][^"']*\bwatermark\b/.test(f.text)
    ) {
      out.push(hit(f.path, "watermark on content"));
    }
  }
  return out;
}

function applyWatermarks(text) {
  let next = text.replace(
    /<([A-Za-z][\w]*)\b([^>]*(?:data-watermark|class(?:Name)?=["'][^"']*\bwatermark\b)[^>]*)>([\s\S]*?)<\/\1>\s*/gi,
    "",
  );
  next = next.replace(
    /<([A-Za-z][\w]*)\b([^>]*(?:data-watermark|class(?:Name)?=["'][^"']*\bwatermark\b)[^>]*)\s*\/>\s*/gi,
    "",
  );
  return next;
}

function toolbarRegions(text) {
  const out = [];
  const re =
    /<([A-Za-z][\w]*)\b([^>]*(?:role=["']toolbar["']|data-nav|data-toolbar)[^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) out.push(m[0]);
  for (const block of text.match(/<(header|nav)\b[\s\S]*?<\/\1>/gi) || []) {
    if (!out.includes(block)) out.push(block);
  }
  return out;
}

function scanBrandOutlinedSymbols(files) {
  const out = [];
  for (const f of files) {
    if (
      /replace(?:ing)? SF Symbols|outlined (?:icon )?set for brand|sfSymbolsToBrand/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "SF Symbols rewritten into a brand outline set"));
    }
    for (const region of toolbarRegions(f.text)) {
      const system = /\b(systemName|Image\(systemName|UIImage\(systemName:)/.test(region);
      const outlined =
        /fill=["']none["'][^>]*(stroke|strokeWidth)|from ["']lucide-react["']|@heroicons|data-brand-icon/.test(
          region,
        );
      if (system && outlined) {
        out.push(hit(f.path, "custom outlined doodles next to system symbols"));
      }
    }
  }
  return out;
}

function scanSfSymbolTables(files) {
  const out = [];
  for (const f of files) {
    if (/Contents\.json$/i.test(f.path)) continue;
    if (/sfSymbols?\s*[:=]\s*\{|SYMBOL_NAMES|sfSymbolCatalog|sf-symbol-table/i.test(f.text)) {
      out.push(hit(f.path, "SF Symbol name table in host tokens"));
      continue;
    }
    const names = [...f.text.matchAll(/systemName:\s*["']([^"']+)["']/g)];
    if (names.length >= 8) {
      out.push(hit(f.path, `${names.length} systemName tokens`));
    }
  }
  return out;
}

function headingCopyRegions(text) {
  const out = [];
  const re = /<(h1|h2|h3|p|small)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) {
    out.push({ tag: m[1], attrs: m[2], inner: m[3], all: m[0] });
  }
  return out;
}

function hasDecoIcon(inner) {
  const hiddenImg = /<img\b[^>]*(?:aria-hidden=["']true["']|alt=["']["'])[^>]*\/?>/i.test(
    inner,
  );
  const hiddenSvgPair = /<svg\b[^>]*aria-hidden=["']true["'][^>]*>[\s\S]*?<\/svg>/i.test(
    inner,
  );
  const hiddenSvgSelf = /<svg\b[^>]*aria-hidden=["']true["'][^>]*\/>/i.test(inner);
  return hiddenImg || hiddenSvgPair || hiddenSvgSelf;
}

function scanDecorativeDuplicate(files) {
  const out = [];
  for (const f of files) {
    for (const block of headingCopyRegions(f.text)) {
      const copy = innerText(block.inner);
      if (hasDecoIcon(block.inner) && copy.length >= 2) {
        out.push(hit(f.path, "decorative icon duplicates heading/help text"));
      }
    }
  }
  return out;
}

function applyDecorativeDuplicate(text) {
  return text.replace(
    /<(h1|h2|h3|p|small)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (all, tag, attrs, inner) => {
      const copy = innerText(inner);
      if (!hasDecoIcon(inner) || copy.length < 2) return all;
      const cleaned = inner
        .replace(/<svg\b[\s\S]*?<\/svg>/gi, "")
        .replace(/<svg\b[^>]*\/>/gi, "")
        .replace(/<img\b[^>]*\/?>/gi, "");
      return `<${tag}${attrs}>${cleaned}</${tag}>`;
    },
  );
}

function emptyStateRegions(text) {
  const out = [];
  const re =
    /<([A-Za-z][\w]*)\b([^>]*(?:data-empty|class(?:Name)?=["'][^"']*\bempty-state\b)[^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}

function scanScreenshotEmpty(files) {
  const out = [];
  for (const f of files) {
    for (const region of emptyStateRegions(f.text)) {
      if (
        /<img\b[^>]*(screenshot|screen-shot|mockup|capture|bezel)/i.test(region) ||
        /<img\b[^>]*alt=["'][^"']*screenshot/i.test(region)
      ) {
        out.push(hit(f.path, "screenshot dump as empty-state illustration"));
      }
    }
  }
  return out;
}

function applyScreenshotEmpty(text) {
  let next = text;
  for (const region of emptyStateRegions(text)) {
    if (
      !/<img\b[^>]*(screenshot|screen-shot|mockup|capture|bezel)/i.test(region) &&
      !/<img\b[^>]*alt=["'][^"']*screenshot/i.test(region)
    ) {
      continue;
    }
    const stripped = region
      .replace(/<img\b[^>]*(screenshot|screen-shot|mockup|capture|bezel)[^>]*\/?>/gi, "")
      .replace(/<img\b[^>]*alt=["'][^"']*screenshot[^"']*["'][^>]*\/?>/gi, "");
    next = next.replace(region, stripped);
  }
  return next;
}

function scanBitmapSf(files) {
  const out = [];
  for (const f of files) {
    if (
      /<(img)\b[^>]*src=["'][^"']*(sf-?symbol|systemname)[^"']*\.(png|jpe?g|webp)/i.test(
        f.text,
      ) ||
      /Image\(["'][^"']*(sf-?symbol|systemname)[^"']*\.(png|jpe?g|webp)["']\)/i.test(f.text)
    ) {
      out.push(hit(f.path, "SF Symbol exported as a bitmap"));
    }
  }
  return out;
}

function scanScaleTables(files) {
  const out = [];
  for (const f of files) {
    if (/Contents\.json$/i.test(f.path)) continue;
    if (
      /@1x/.test(f.text) &&
      /@2x/.test(f.text) &&
      /@3x/.test(f.text) &&
      /scaleFactors?\s*[:=]|APPLE_SCALES|@1x["']?\s*:/.test(f.text)
    ) {
      out.push(hit(f.path, "Apple scale-factor table copied into host source"));
    }
  }
  return out;
}

function scanIconComposerLaw(files) {
  const out = [];
  for (const f of files) {
    if (
      /\.iconcomposer\b/i.test(f.path) ||
      /icon composer template|variant recipes as .{0,40}HIG law|IconComposerTemplate/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "Icon Composer template copied as HIG law"));
    }
  }
  return out;
}

function isAppIconFile(file) {
  return (
    /AppIcon|apple-touch-icon|favicon/i.test(file.path) ||
    /data-app-icon|rel=["']apple-touch-icon["']/i.test(file.text)
  );
}

function scanBusyAppIcon(files) {
  const out = [];
  for (const f of files) {
    if (!isAppIconFile(f)) continue;
    if (
      /(headshot|portrait|selfie|photo-of|people\.jpg|person\.png)/i.test(f.text) ||
      /linear-gradient\([^)]*(,|#)[^)]*(,|#)[^)]*(,|#)[^)]*\)/.test(f.text)
    ) {
      out.push(hit(f.path, "photo or busy gradient used as app icon"));
    }
  }
  return out;
}

function scanAppIconAlpha(files) {
  const out = [];
  for (const f of files) {
    if (
      /data-app-icon[\s\S]{0,240}(mask-image|-webkit-mask|webkitMaskImage)/i.test(f.text) ||
      /class(?:Name)?=["'][^"']*app-icon[^"']*["'][\s\S]{0,160}(mask-image|border-radius:\s*22%)/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "alpha/mask trick on the app icon"));
    }
  }
  return out;
}

function stripAppIconMaskDecls(body) {
  return body
    .replace(/webkitMaskImage\s*:\s*["'][^"']*["']\s*,?/g, "")
    .replace(/maskImage\s*:\s*["'][^"']*["']\s*,?/g, "")
    .replace(/borderRadius\s*:\s*["']22%["']\s*,?/g, "")
    .replace(/mask-image\s*:[^;]+;?/gi, "")
    .replace(/-webkit-mask(?:-image)?\s*:[^;]+;?/gi, "")
    .replace(/border-radius\s*:\s*22%\s*;?/gi, "");
}

function applyAppIconAlpha(text) {
  let next = text.replace(
    /(<[^>]*(?:data-app-icon|class(?:Name)?=["'][^"']*app-icon)[^>]*style=\{\{)([^}]*)(\}\})/gi,
    (all, open, body, close) => {
      const stripped = stripAppIconMaskDecls(body);
      return stripped === body ? all : `${open}${stripped}${close}`;
    },
  );
  next = next.replace(
    /(<[^>]*(?:data-app-icon|class(?:Name)?=["'][^"']*app-icon)[^>]*style=["'])([^"']*)(["'])/gi,
    (all, open, body, close) => {
      const stripped = stripAppIconMaskDecls(body);
      return stripped === body ? all : `${open}${stripped}${close}`;
    },
  );
  next = next.replace(
    /((?:^|,|\n)\s*\.app-icon[^{]*)\{([^}]*)\}/gi,
    (all, sel, body) => {
      const stripped = stripAppIconMaskDecls(body);
      return stripped === body ? all : `${sel}{${stripped}}`;
    },
  );
  return next;
}

function scanDiversityStock(files) {
  const out = [];
  for (const f of files) {
    if (
      /diversity[- ]stock|tokeniz(?:e|ing) diversity|stock photo.{0,40}diverse team/i.test(
        f.text,
      ) ||
      /alt=["'][^"']*(diverse team|multicultural group|people of all)[^"']*["']/i.test(f.text)
    ) {
      out.push(hit(f.path, "tokenizing diversity stock"));
    }
  }
  return out;
}

function scanAbilityJokes(files) {
  const out = [];
  const joke = /\b(lame|cripple|spaz|wheelchair joke|fat joke|blind joke)\b/i;
  for (const f of files) {
    for (const region of emptyStateRegions(f.text)) {
      if (joke.test(innerText(region))) {
        out.push(hit(f.path, "ability or body joke in empty state"));
      }
    }
  }
  return out;
}

function scanLockedSkin(files) {
  const blob = files.map((f) => f.text).join("\n");
  const avatar = /data-avatar|UserAvatar|profile-photo|emoji-avatar/;
  const tone = /skin-tone|skinTone|fitzpatrick|skin_tone/;
  const changer =
    /skinTonePicker|data-skin-tone-picker|aria-label=["'][^"']*skin tone/i;
  const out = [];
  for (const f of files) {
    if (avatar.test(f.text) && tone.test(f.text) && !changer.test(blob)) {
      out.push(hit(f.path, "locked skin-tone default on a user depiction"));
    }
  }
  return out;
}

function fileHasSettings(file) {
  return (
    /data-settings/.test(file.text) ||
    /\bSettingsLink\b/.test(file.text) ||
    /<(h1|h2)[^>]*>\s*(Settings|Preferences)\s*</i.test(file.text) ||
    /Settings(View|Screen|Page|Form)?\.(tsx|jsx|swift|vue|html)\b/i.test(file.path)
  );
}

function fileHasUndo(text) {
  return (
    /\b(UndoManager|undoManager|NSUndoManager)\b/.test(text) ||
    /\bregisterUndo\b/.test(text) ||
    /data-undo/.test(text) ||
    /aria-label=["']Undo\b/i.test(text) ||
    />\s*(Undo|Redo)\s*</.test(text)
  );
}

function fileHasOnboarding(text) {
  return (
    /data-onboarding/.test(text) ||
    /\bOnboarding(View|Screen|Flow)?\b/.test(text) ||
    /\b(coach-?mark|feature-?tour|first-?run)\b/i.test(text) ||
    /\bisOnboarding\b/.test(text)
  );
}

function isLaunchFile(file) {
  return (
    /Launch(Screen|View|Storyboard)?|Splash/i.test(file.path) ||
    /data-launch|data-splash/.test(file.text) ||
    /\bUILaunchStoryboard\b/.test(file.text)
  );
}

function scanSettingsFirstRun(files) {
  const out = [];
  const blob = files.map((f) => f.text).join("\n");
  if (!files.some(fileHasSettings)) return out;
  if (
    /(isOnboarding|data-onboarding|first-?run)[\s\S]{0,400}(settingsComplete|mustOpenSettings|requiredSettings|\/settings)/i.test(
      blob,
    ) ||
    /(settingsComplete|hasCompletedSettings|requireSettings)\s*(\?|&&)/.test(blob)
  ) {
    const f = files.find(fileHasSettings) || files[0];
    out.push(hit(f.path, "Settings required to finish first-run"));
  }
  return out;
}

function scanNestedPrefs(files) {
  const out = [];
  for (const f of files) {
    if (!fileHasSettings(f)) continue;
    const grouped = /<(fieldset|section)\b/i.test(f.text) || /\bSection\s*[\({]/.test(f.text);
    const marks = [
      ...(f.text.match(/[›→]/g) || []),
      ...(f.text.match(/data-chevron/g) || []),
      ...(f.text.match(/chevron\.right|ChevronRight/g) || []),
      ...(f.text.match(/>\{\s*["']>["']\s*\}/g) || []),
    ];
    if (!grouped && marks.length >= 3) {
      out.push(hit(f.path, "settings prefs nested under chevrons with no grouping"));
    }
  }
  return out;
}

function scanRethemeSettings(files) {
  const out = [];
  for (const f of files) {
    if (!fileHasSettings(f)) continue;
    if (
      /(background(?:-color|Color)?|barTintColor)\s*[:=]\s*["']?#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/i.test(
        f.text,
      ) ||
      /data-fashion-glass/.test(f.text)
    ) {
      out.push(hit(f.path, "re-themed Settings chrome"));
    }
  }
  return out;
}

function scanConfirmEveryDelete(files) {
  const blob = files.map((f) => f.text).join("\n");
  if (!fileHasUndo(blob)) return [];
  const out = [];
  for (const f of files) {
    if (
      /window\.confirm\s*\(|confirmationDialog|Are you sure you want to delete|role=["']alertdialog["'][\s\S]{0,240}delete/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "delete confirmation while Undo exists"));
    }
  }
  return out;
}

function scanSilentNavLoss(files) {
  const blob = files.map((f) => f.text).join("\n");
  if (fileHasUndo(blob)) return [];
  const out = [];
  for (const f of files) {
    const dirty = /\b(isDirty|unsaved|hasUnsavedChanges)\b/.test(f.text);
    const leaves = /\b(navigate|router\.(push|replace)|location\.href)\s*\(/.test(f.text);
    const guarded = /beforeunload|useBlocker|data-draft|saveDraft/.test(f.text);
    if (dirty && leaves && !guarded) {
      out.push(hit(f.path, "navigate away from dirty form with no undo or draft"));
    }
  }
  return out;
}

function scanSpinnerNoWayOut(files) {
  const out = [];
  for (const f of files) {
    const loading =
      /aria-busy=/.test(f.text) ||
      /\b(spinner|skeleton|ProgressView|UIActivityIndicatorView)\b/i.test(f.text);
    const looping = /animation:[^;]*infinite|indeterminate/i.test(f.text);
    const escape = /\b(Cancel|Stop|Dismiss|Try again)\b/.test(f.text);
    if (loading && looping && !escape) {
      out.push(hit(f.path, "indeterminate spinner with no way out"));
    }
  }
  return out;
}

function scanFakePercent(files) {
  const out = [];
  for (const f of files) {
    if (
      /fakePercent|fake[- ]progress|percent\s*\+=|Math\.min\(\s*99/i.test(f.text)
    ) {
      out.push(hit(f.path, "fake percent on a progress bar"));
    }
  }
  return out;
}

function scanLoadingModalHidesNav(files) {
  const blob = files.map((f) => f.text).join("\n");
  if (!/<(nav|header)\b/i.test(blob) && !/data-nav/.test(blob)) return [];
  const out = [];
  for (const f of files) {
    for (const region of dialogRegions(f.text)) {
      if (
        /aria-busy|spinner|ProgressView|data-skeleton/i.test(region) &&
        /data-loading-modal|position:\s*fixed|inset:\s*0/i.test(region)
      ) {
        out.push(hit(f.path, "loading modal hides nav"));
      }
    }
  }
  return out;
}

function scanModalSuccess(files) {
  const out = [];
  for (const f of files) {
    for (const region of dialogRegions(f.text)) {
      if (/\b(Success|Saved!|Successfully saved)\b/i.test(innerText(region))) {
        out.push(hit(f.path, "modal Success after save"));
      }
    }
  }
  return out;
}

function scanErrorToast(files) {
  const out = [];
  for (const f of files) {
    if (
      /(data-toast|role=["']status["'])[\s\S]{0,240}\berror\b/i.test(f.text) &&
      /setTimeout|toastDuration|autoHide|disappear/i.test(f.text)
    ) {
      out.push(hit(f.path, "error toast that disappears"));
    }
  }
  return out;
}

function scanConfettiCrud(files) {
  const out = [];
  for (const f of files) {
    if (
      /\bconfetti\b/i.test(f.text) &&
      /\b(onSave|handleSave|createItem|updateItem|onSubmit|CRUD)\b/.test(f.text)
    ) {
      out.push(hit(f.path, "confetti on ordinary CRUD"));
    }
  }
  return out;
}

function applyConfettiCrud(text) {
  return text
    .replace(/<([A-Za-z][\w]*)\b[^>]*\bconfetti\b[^>]*\/>\s*/gi, "")
    .replace(/<([A-Za-z][\w]*)\b[^>]*\bconfetti\b[^>]*>[\s\S]*?<\/\1>\s*/gi, "")
    .replace(/\bconfetti\s*\([^)]*\)\s*;?/g, "");
}

function applyRethemeSettings(text) {
  let next = applyOpaqueBrandBars(text);
  next = next.replace(/\s*barTintColor=["']#[0-9a-fA-F]{3,8}["']/g, "");
  next = next.replace(/\s*data-fashion-glass(?:="[^"]*")?/g, "");
  return next;
}

function scanAccountWall(files) {
  const out = [];
  for (const f of files) {
    if (!fileHasOnboarding(f.text)) continue;
    const wall = /\b(Sign in|Log in|Create account|Create an account)\b/i.test(f.text);
    const skip = /\b(Skip|Continue as guest|Not now)\b/i.test(f.text);
    if (wall && !skip) {
      out.push(hit(f.path, "account required before any value"));
    }
  }
  return out;
}

function scanEveryPermissionPageOne(files) {
  const out = [];
  const kinds = [
    /camera|getUserMedia/i,
    /mic(?:rophone)?/i,
    /geolocation|location/i,
    /Notification\.requestPermission|notifications/i,
    /tracking|ATTrackingManager/i,
  ];
  for (const f of files) {
    if (!fileHasOnboarding(f.text)) continue;
    const hits = kinds.filter((re) => re.test(f.text)).length;
    if (hits >= 3) {
      out.push(hit(f.path, "every permission asked on page one"));
    }
  }
  return out;
}

function scanHelpInterstitials(files) {
  const out = [];
  for (const f of files) {
    if (!fileHasOnboarding(f.text)) continue;
    const steps = [
      ...(f.text.match(/data-onboarding-step/g) || []),
      ...(f.text.match(/\bhelp-card\b/g) || []),
      ...(f.text.match(/\binterstitial\b/g) || []),
    ];
    if (steps.length >= 6) {
      out.push(hit(f.path, "Help duplicated as six interstitial cards"));
    }
  }
  return out;
}

function scanNotificationWall(files) {
  const out = [];
  for (const f of files) {
    if (
      /(useEffect|componentDidMount|DOMContentLoaded|onMounted)\s*\([\s\S]{0,400}Notification\.requestPermission/i.test(
        f.text,
      ) ||
      /data-onboarding[\s\S]{0,400}Enable notifications/i.test(f.text)
    ) {
      out.push(hit(f.path, "first-launch Enable notifications wall"));
    }
  }
  return out;
}

function scanMarketingTimeSensitive(files) {
  const out = [];
  for (const f of files) {
    if (
      /(time[- ]sensitive|interruptionLevel.{0,40}timeSensitive|UNNotificationInterruptionLevel\.timeSensitive)/i.test(
        f.text,
      ) &&
      /\b(sale|offer|discount|promo|marketing|don't miss)\b/i.test(f.text)
    ) {
      out.push(hit(f.path, "marketing marked time-sensitive"));
    }
  }
  return out;
}

function scanCustomLockScreen(files) {
  const out = [];
  for (const f of files) {
    if (
      /data-lock-screen|LockScreen(View|UI)|custom lock[- ]screen/i.test(f.text)
    ) {
      out.push(hit(f.path, "custom lock-screen notification UI"));
    }
  }
  return out;
}

function scanHiddenDrag(files) {
  const out = [];
  for (const f of files) {
    const drag = /\bdraggable\b|\bonDrag\s*\(|data-drop/.test(f.text);
    if (!drag) continue;
    const hidden = /draggable[\s\S]{0,120}(hidden|sr-only|opacity:\s*0)/i.test(f.text);
    const alt = /\b(Move|Cut|Copy)\b/.test(f.text) || /aria-keyshortcuts|onKeyDown/.test(f.text);
    if (hidden && !alt) {
      out.push(hit(f.path, "hidden drag with no alternative"));
    }
  }
  return out;
}

function scanDropNavigates(files) {
  const out = [];
  for (const f of files) {
    if (
      /onDrop\s*\([\s\S]{0,400}(navigate\s*\(|router\.(push|replace)|location\.href)/i.test(
        f.text,
      ) &&
      !/preview|drag-preview|lift/i.test(f.text)
    ) {
      out.push(hit(f.path, "drop navigates away without a preview"));
    }
  }
  return out;
}

function scanFightSplitDrops(files) {
  const out = [];
  for (const f of files) {
    if (
      /UIDropProposal[\s\S]{0,80}forbidden|preventDefault\s*\([\s\S]{0,120}(splitView|multi-?window|UISplitView)/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "fighting system split-view drops"));
    }
  }
  return out;
}

function scanAnimatedSplash(files) {
  const out = [];
  for (const f of files) {
    if (!isLaunchFile(f)) continue;
    if (/animation:|keyframes|setTimeout\s*\([\s\S]{0,80}splash/i.test(f.text)) {
      out.push(hit(f.path, "animated splash after launch"));
    }
  }
  return out;
}

function scanLaunchMedia(files) {
  const out = [];
  for (const f of files) {
    if (!isLaunchFile(f)) continue;
    if (/<(video|audio)\b[^>]*(autoPlay|autoplay)/i.test(f.text)) {
      out.push(hit(f.path, "video or sound on launch"));
    }
  }
  return out;
}

function applyLaunchMedia(text, file) {
  if (!isLaunchFile(file)) return text;
  return text.replace(/<(video|audio)\b([^>]*)>/gi, (all, tag, attrs) => {
    if (!/autoPlay|autoplay/i.test(attrs)) return all;
    const next = attrs
      .replace(/\s*autoPlay(=\{[^}]*\})?/g, "")
      .replace(/\s*autoplay(="[^"]*")?/gi, "");
    return `<${tag}${next}>`;
  });
}

function scanLaunchBrandBars(files) {
  const out = [];
  for (const f of files) {
    if (/UIDesignRequiresCompatibility/.test(f.text)) {
      out.push(hit(f.path, "UIDesignRequiresCompatibility launch design"));
      continue;
    }
    if (!isLaunchFile(f)) continue;
    if (
      /(background(?:-color|Color)?)\s*[:=]\s*["']?#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "opaque brand bar as launch chrome"));
    }
  }
  return out;
}

const CTA_LABEL = "Add|New|Create|Save|Submit|Done";

function scanDashboardCardGrid(files) {
  return DETECTORS["chrome.layout.card-grid-home"](files);
}

function scanListPaneMinWidth(files) {
  const out = [];
  for (const f of files) {
    if (!/data-list-pane|list-browser|ListPane/.test(f.text)) continue;
    const pane = f.text.match(
      /<(div|aside|section|nav)\b[^>]*(data-list-pane|list-browser|ListPane)[^>]*>/i,
    );
    if (pane && /minWidth|min-width/.test(pane[0])) {
      out.push(hit(f.path, "list pane min-width"));
      continue;
    }
    if (
      /(data-list-pane|list-browser|\.list-pane)[^{]{0,80}\{\s*[^}]*(min-width|minWidth)/.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "list pane min-width"));
    }
  }
  return out;
}

function applyListPaneMinWidth(text) {
  let next = text.replace(
    /(<(div|aside|section|nav)\b[^>]*(?:data-list-pane|list-browser|ListPane)[^>]*)(>)/gi,
    (all, open, _tag, close) => {
      const stripped = open
        .replace(/minWidth\s*:\s*["'][^"']*["']\s*,?/g, "")
        .replace(/min-width\s*:\s*[^;"'\s}]+;?/gi, "");
      return `${stripped}${close}`;
    },
  );
  next = next.replace(
    /((?:data-list-pane|list-browser|\.list-pane)[^{]{0,80}\{\s*)([^}]*)(\})/g,
    (all, open, body, close) => {
      const stripped = body.replace(/min-width\s*:[^;]+;?/gi, "");
      return stripped === body ? all : `${open}${stripped}${close}`;
    },
  );
  return next;
}

function isBottomChrome(text) {
  return /data-tab-bar|data-bottom-nav|\.tab-bar\b|UITabBar/.test(text);
}

function scanRelativeBottomNav(files) {
  const out = [];
  for (const f of files) {
    if (!isBottomChrome(f.text)) continue;
    const scoped = f.text.match(
      /<(nav|footer|div|header)\b[^>]*(data-tab-bar|data-bottom-nav|tab-bar)[^>]*>/i,
    );
    if (scoped && /position:\s*["']?relative["']?/.test(scoped[0])) {
      out.push(hit(f.path, "relative bottom nav"));
      continue;
    }
    if (
      /(data-tab-bar|data-bottom-nav|\.tab-bar)[^{]{0,80}\{\s*[^}]*position:\s*relative/.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "relative bottom nav"));
    }
  }
  return out;
}

function applyRelativeBottomNav(text) {
  if (!isBottomChrome(text)) return text;
  let next = text.replace(
    /(<(nav|footer|div|header)\b[^>]*(?:data-tab-bar|data-bottom-nav|tab-bar)[^>]*)(>)/gi,
    (all, open, _tag, close) => {
      const sticky = open
        .replace(/position:\s*["']relative["']/g, 'position: "sticky"')
        .replace(/position:\s*relative/g, "position: sticky");
      return `${sticky}${close}`;
    },
  );
  next = next.replace(
    /((?:data-tab-bar|data-bottom-nav|\.tab-bar)[^{]{0,80}\{\s*)([^}]*)(\})/g,
    (all, open, body, close) => {
      const sticky = body.replace(/position\s*:\s*relative/gi, "position: sticky");
      return sticky === body ? all : `${open}${sticky}${close}`;
    },
  );
  return next;
}

function scanCompatibilityLook(files) {
  const out = [];
  for (const f of files) {
    if (/UIDesignRequiresCompatibility/.test(f.text)) {
      out.push(hit(f.path, "UIDesignRequiresCompatibility"));
    }
  }
  return out;
}

function applyCompatibilityLook(text) {
  return text.replace(/^[^\n]*UIDesignRequiresCompatibility[^\n]*\n?/gm, "");
}

function scanStackedTranslucent(files) {
  const out = [];
  for (const f of files) {
    if (/data-stacked-translucent/.test(f.text)) {
      out.push(hit(f.path, "stacked translucent layers"));
      continue;
    }
    const blurs =
      f.text.match(/backdrop-filter|backdropFilter|UIBlurEffect|ultraThinMaterial/g) || [];
    if (
      blurs.length >= 2 &&
      /<(header|nav)\b/.test(f.text) &&
      !/\b(overlay|sheet|dialog|alert|modal|picker|popover)\b/i.test(f.text)
    ) {
      out.push(hit(f.path, "stacked translucent layers"));
    }
  }
  return out;
}

function applyStackedTranslucent(file) {
  const stripped = file.text.replace(/\s*data-stacked-translucent(?:="[^"]*")?/g, "");
  return applyChromeRecipe("chrome.materials.fashion-glass", { ...file, text: stripped });
}

function scanCardGridMasterList(files) {
  const out = [];
  for (const f of files) {
    if (!/data-list-pane|list-browser|ListPane/.test(f.text)) continue;
    if (/card-grid|dashboard-cards/.test(f.text)) {
      out.push(hit(f.path, "card grid as master list"));
      continue;
    }
    const cards = f.text.match(/class(Name)?=["'][^"']*\bcard\b/g) || [];
    if (cards.length >= 3) {
      out.push(hit(f.path, "card grid as master list"));
    }
  }
  return out;
}

function applyCardGridMasterList(text) {
  if (!/data-list-pane|list-browser|ListPane/.test(text)) return text;
  let next = text.replace(
    /<(div|section)\b([^>]*\bclass(?:Name)?=["'][^"']*(?:card-grid|dashboard-cards)[^"']*["'][^>]*)>\s*([\s\S]*?)<\/\1>/i,
    (all, _tag, _attrs, inner) => {
      const items = [...inner.matchAll(/<(article|div|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(
        (m) => m[2].trim(),
      );
      if (!items.length) return all;
      return `<ul>\n${items.map((t) => `        <li>${t}</li>`).join("\n")}\n      </ul>`;
    },
  );
  next = next.replace(/\s+className=["']card["']/g, "");
  next = next.replace(/\s+class=["']card["']/g, "");
  return next;
}

function scanCtaOnlyListToolbar(files) {
  const blob = files.map((f) => f.text).join("\n");
  if (!/data-detail(?:-pane)?\b/.test(blob)) return [];
  const ctaRe = new RegExp(`<button\\b[^>]*>\\s*(?:${CTA_LABEL})\\s*</button>`, "i");
  const detailCta = new RegExp(
    `data-detail[\\s\\S]{0,1200}<button\\b[^>]*>\\s*(?:${CTA_LABEL})`,
    "i",
  );
  const out = [];
  for (const f of files) {
    if (!/data-list-pane/.test(f.text)) continue;
    const toolbar = f.text.match(
      /<header\b[^>]*(?:role=["']toolbar["']|toolbar)[^>]*>[\s\S]*?<\/header>/i,
    );
    if (!toolbar) continue;
    if (!ctaRe.test(toolbar[0]) && !/<button\b[^>]*type=["']submit["']/.test(toolbar[0])) {
      continue;
    }
    if (detailCta.test(blob)) continue;
    out.push(hit(f.path, "primary CTA only in list toolbar"));
  }
  return out;
}

function applyCtaOnlyListToolbar(text) {
  if (!/data-list-pane/.test(text) || !/data-detail(?:-pane)?\b/.test(text)) return text;
  const ctaRe = new RegExp(`<button\\b[^>]*>\\s*(?:${CTA_LABEL})\\s*</button>\\s*`, "i");
  const toolbarRe =
    /(<header\b[^>]*(?:role=["']toolbar["']|toolbar)[^>]*>)([\s\S]*?)(<\/header>)/i;
  const tm = text.match(toolbarRe);
  if (!tm) return text;
  const btn = tm[2].match(ctaRe);
  if (!btn) return text;
  let next = text.replace(
    toolbarRe,
    (_, open, body, close) => `${open}${body.replace(ctaRe, "")}${close}`,
  );
  next = next.replace(
    /(<([A-Za-z][\w]*)\b[^>]*data-detail(?:-pane)?\b[^>]*>)(\s*)/,
    `$1$3${btn[0]}$3`,
  );
  return next;
}

function countSubmitButtons(text) {
  return [...text.matchAll(/<button\b([^>]*)>/gi)].filter((m) => {
    const attrs = m[1];
    if (/\btype=["']button["']/i.test(attrs) || /\btype=["']reset["']/i.test(attrs)) {
      return false;
    }
    return /\btype=["']submit["']/i.test(attrs) || !/\btype=/.test(attrs);
  }).length;
}

function scanEqualWeightSubmits(files) {
  const out = [];
  for (const f of files) {
    if (!/data-form-page|<form\b/.test(f.text)) continue;
    if (countSubmitButtons(f.text) >= 2) {
      out.push(hit(f.path, "multiple equal-weight submits"));
    }
  }
  return out;
}

function applyEqualWeightSubmits(text) {
  if (!/data-form-page|<form\b/.test(text)) return text;
  let seen = false;
  return text.replace(/<button\b([^>]*)>/gi, (all, attrs) => {
    if (/\btype=["']button["']/i.test(attrs) || /\btype=["']reset["']/i.test(attrs)) {
      return all;
    }
    const isSubmit = /\btype=["']submit["']/i.test(attrs) || !/\btype=/.test(attrs);
    if (!isSubmit) return all;
    if (!seen) {
      seen = true;
      return all;
    }
    if (/\btype=["']submit["']/i.test(attrs)) {
      return all.replace(/\btype=["']submit["']/i, 'type="button"');
    }
    return `<button type="button"${attrs}>`;
  });
}

function hasTabShell(text) {
  return /data-tab-bar|role=["']tablist["']|UITabBar|\bTabView\s*\(/.test(text);
}

function scanMarketingTabShell(files) {
  const out = [];
  for (const f of files) {
    if (!isMarketingFile(f)) continue;
    if (hasTabShell(f.text)) {
      out.push(hit(f.path, "marketing landing tab shell"));
    }
  }
  return out;
}

function applyMarketingTabShell(text, file) {
  if (!isMarketingFile(file) || !hasTabShell(text)) return text;
  let next = text.replace(
    /<(nav|div|footer)\b[^>]*(?:data-tab-bar|role=["']tablist["'])[^>]*>[\s\S]*?<\/\1>\s*/gi,
    "",
  );
  next = next.replace(/\s*data-tab-bar(?:="[^"]*")?/g, "");
  next = next.replace(/\s*role=["']tablist["']/g, "");
  return next;
}

function isMenuFile(text) {
  return /role=["']menu["']|role=["']menuitem|<menu\b/i.test(text);
}

function openingTags(text) {
  const out = [];
  const re = /<([A-Za-z][\w]*)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(text))) out.push({ tag: m[1], attrs: m[2] });
  return out;
}

function scanHiddenMenuItems(files) {
  const out = [];
  for (const f of files) {
    if (!isMenuFile(f.text)) continue;
    const hidden = openingTags(f.text).some(
      (t) =>
        /role=["']menuitem["']/i.test(t.attrs) &&
        (/\bhidden\b/i.test(t.attrs) ||
          /display:\s*["']?none/.test(t.attrs) ||
          /data-hidden-item/.test(t.attrs)),
    );
    if (hidden) out.push(hit(f.path, "hidden unavailable menu item"));
  }
  return out;
}

function applyHiddenMenuItems(text) {
  if (!isMenuFile(text)) return text;
  return text.replace(
    /(<([A-Za-z][\w]*)\b)([^>]*role=["']menuitem["'][^>]*)(\s*\/?>)/gi,
    (all, start, _tag, attrs, end) => {
      if (!/\bhidden\b/i.test(attrs) && !/display:\s*["']?none/.test(attrs) && !/data-hidden-item/.test(attrs)) {
        return all;
      }
      let next = attrs
        .replace(/\s*\bhidden\b/gi, "")
        .replace(/\s*data-hidden-item(?:="[^"]*")?/g, "")
        .replace(/display:\s*["']none["']\s*,?/g, "");
      if (!/aria-disabled=/.test(next)) next += " aria-disabled={true}";
      return `${start}${next}${end}`;
    },
  );
}

function maxMenuNest(text) {
  const stack = [];
  let max = 0;
  const re = /<\/?([A-Za-z][\w]*)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(text))) {
    const attrs = m[2];
    const close = m[0].startsWith("</");
    const self = /\/\s*$/.test(attrs);
    if (close) {
      if (stack.length) stack.pop();
      continue;
    }
    const isMenu = /role=["']menu["']/i.test(attrs);
    const menuDepth = stack.filter(Boolean).length + (isMenu ? 1 : 0);
    if (isMenu && menuDepth > max) max = menuDepth;
    if (!self) stack.push(isMenu);
  }
  return max;
}

function scanNestedSubmenus(files) {
  const out = [];
  for (const f of files) {
    if (!isMenuFile(f.text)) continue;
    if (maxMenuNest(f.text) >= 3) {
      out.push(hit(f.path, "submenu nested deeper than one level"));
    }
  }
  return out;
}

function scanMixMenuIcons(files) {
  const out = [];
  for (const f of files) {
    if (!isMenuFile(f.text)) continue;
    const items = [
      ...f.text.matchAll(
        /<([A-Za-z][\w]*)\b[^>]*role=["']menuitem["'][^>]*>[\s\S]*?<\/\1>/gi,
      ),
    ];
    if (items.length < 2) continue;
    let withIcon = 0;
    let without = 0;
    for (const item of items) {
      if (/<svg\b|<img\b|systemImage/.test(item[0])) withIcon += 1;
      else without += 1;
    }
    if (withIcon && without) {
      out.push(hit(f.path, "menu group mixes icons and no-icons"));
    }
  }
  return out;
}

function scanPickerScreen(files) {
  const out = [];
  for (const f of files) {
    const marker =
      /data-picker-screen/.test(f.text) || /Picker(Screen|Page)\.(tsx|jsx|swift|vue|html)\b/i.test(f.path);
    if (!marker) continue;
    const hasPicker = /<select\b|\bPicker\s*\(|<input\b[^>]*type=["']date["']/.test(f.text);
    const otherWork = /<textarea\b|<table\b|data-list-pane|<ul\b/.test(f.text);
    if (hasPicker && !otherWork) {
      out.push(hit(f.path, "screen whose only job is a picker"));
    }
  }
  return out;
}

function scanStepperNoValue(files) {
  const out = [];
  for (const f of files) {
    if (!/data-stepper|\bUIStepper\b|\bStepper\s*\(/.test(f.text)) continue;
    if (/<input\b|<output\b|aria-valuenow|data-stepper-value/.test(f.text)) continue;
    out.push(hit(f.path, "stepper with no neighbouring value"));
  }
  return out;
}

function scanOverweightWheel(files) {
  const out = [];
  for (const f of files) {
    if (/\.swift$/i.test(f.path)) continue;
    if (!/data-ios-wheel|wheel-picker|className=["'][^"']*wheel/.test(f.text)) continue;
    out.push(hit(f.path, "overweight wheel for a short list"));
  }
  return out;
}

function applyOverweightWheel(text, file) {
  if (/\.swift$/i.test(file.path)) return text;
  const blocks = [
    ...blocksWithAttr(text, "data-ios-wheel"),
    ...blocksWithAttr(text, "wheel-picker"),
  ];
  if (!blocks.length) return text;
  const seen = new Set();
  let next = text;
  for (const b of [...blocks].sort((a, c) => c.start - a.start)) {
    const key = `${b.start}:${b.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const inner = b.text.replace(/^<[^>]+>/, "").replace(/<\/[A-Za-z][\w]*>\s*$/, "");
    const opts = [...inner.matchAll(/<(div|li|option)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
      .map((m) => m[2].replace(/<[^>]+>/g, "").trim())
      .filter(Boolean);
    if (!opts.length) continue;
    const select = `<select>\n${opts.map((o) => `  <option>${o}</option>`).join("\n")}\n</select>`;
    next = next.slice(0, b.start) + select + next.slice(b.end);
  }
  return next;
}

function scanMorphProgress(files) {
  const out = [];
  for (const f of files) {
    if (/data-morph-progress/.test(f.text)) {
      out.push(hit(f.path, "circular indicator morphs into a bar"));
      continue;
    }
    if (
      /role=["']progressbar["']|<progress\b/.test(f.text) &&
      /spinner|circular|activity-indicator/i.test(f.text) &&
      /morph|swapIndicator|circularToBar/i.test(f.text)
    ) {
      out.push(hit(f.path, "circular indicator morphs into a bar"));
    }
  }
  return out;
}

function applyMorphProgress(text) {
  return text.replace(/\s*data-morph-progress(?:="[^"]*")?/g, "");
}

function scanJumpNinety(files) {
  const out = [];
  for (const f of files) {
    if (/data-jump-ninety/.test(f.text)) {
      out.push(hit(f.path, "progress jumps to 90% then stalls"));
      continue;
    }
    if (
      /<(progress)[^>]*(value=["']90["']|value=\{0\.9\}|value=\{90\})/i.test(f.text) &&
      /stall|fake|loading/i.test(f.text)
    ) {
      out.push(hit(f.path, "progress jumps to 90% then stalls"));
    }
  }
  return out;
}

function applyJumpNinety(text) {
  let next = text.replace(/\s*data-jump-ninety(?:="[^"]*")?/g, "");
  next = next.replace(/(<(progress)\b[^>]*\bvalue=["'])90(["'])/gi, "$10$3");
  next = next.replace(/(<(progress)\b[^>]*\bvalue=\{)0\.9(\})/gi, "$10$3");
  next = next.replace(/(<(progress)\b[^>]*\bvalue=\{)90(\})/gi, "$10$3");
  return next;
}

function scanPullDownRefreshTitle(files) {
  const out = [];
  for (const f of files) {
    if (/pull down to refresh/i.test(f.text)) {
      out.push(hit(f.path, "pull down to refresh title"));
    }
  }
  return out;
}

function applyPullDownRefreshTitle(text) {
  return text
    .replace(/>\s*pull down to refresh\s*</gi, ">Refresh<")
    .replace(/aria-label=["']pull down to refresh["']/gi, 'aria-label="Refresh"')
    .replace(/pull down to refresh/gi, "");
}

function scanOkInsteadOfVerb(files) {
  const out = [];
  for (const f of files) {
    if (/>\s*OK\s*</.test(f.text) || /aria-label=["']OK["']/i.test(f.text)) {
      out.push(hit(f.path, "OK instead of a verb"));
    }
  }
  return out;
}

function applyOkInsteadOfVerb(text) {
  if (!/>\s*OK\s*</.test(text) && !/aria-label=["']OK["']/i.test(text)) return text;
  if (!/handleSave|onSubmit|type=["']submit["']/.test(text)) return text;
  return text.replace(/>\s*OK\s*</g, ">Save<").replace(/aria-label=["']OK["']/gi, 'aria-label="Save"');
}

function scanToggleNavigates(files) {
  const out = [];
  for (const f of files) {
    if (!/role=["']switch["']|type=["']checkbox["']|\bToggle\s*\(/.test(f.text)) continue;
    const tagged = openingTags(f.text).some((t) => {
      if (!/role=["']switch["']/i.test(t.attrs)) return false;
      return (
        /type=["']submit["']/i.test(t.attrs) ||
        /href=/i.test(t.attrs) ||
        /data-toggle-nav/.test(t.attrs) ||
        t.tag.toLowerCase() === "a"
      );
    });
    if (
      tagged ||
      /data-toggle-nav/.test(f.text) ||
      /Toggle[\s\S]{0,240}(href=|router\.push|location\.href|navigate\()/i.test(f.text)
    ) {
      out.push(hit(f.path, "toggle used to navigate or submit"));
    }
  }
  return out;
}

function applyToggleNavigates(text) {
  let next = text.replace(/<([A-Za-z][\w]*)\b([^>]*)>/gi, (all, tag, attrs) => {
    if (!/role=["']switch["']/i.test(attrs)) return all;
    if (!/type=["']submit["']/i.test(attrs)) return all;
    return `<${tag}${attrs.replace(/type=["']submit["']/i, 'type="button"')}>`;
  });
  next = next.replace(/\s*data-toggle-nav(?:="[^"]*")?/g, "");
  return next;
}

function stripAttrBlocks(text, attr) {
  let next = text;
  for (const b of [...blocksWithAttr(text, attr)].sort((a, c) => c.start - a.start)) {
    next = next.slice(0, b.start) + next.slice(b.end);
  }
  next = next.replace(new RegExp(`\\s*${attr}(?:="[^"]*")?`, "g"), "");
  return next;
}

function scanFakeInAppWidget(files) {
  const out = [];
  for (const f of files) {
    if (/\bstruct\s+\w+\s*:\s*Widget\b/.test(f.text) && /import\s+WidgetKit/.test(f.text)) {
      continue;
    }
    if (
      /data-fake-widget/.test(f.text) ||
      /class(?:Name)?=["'][^"']*\bfake-widget\b/.test(f.text) ||
      /fake Home Screen widget/i.test(f.text)
    ) {
      out.push(hit(f.path, "fake Home Screen widget in-app"));
    }
  }
  return out;
}

function applyFakeInAppWidget(text, file) {
  if (/\bstruct\s+\w+\s*:\s*Widget\b/.test(text) && /import\s+WidgetKit/.test(text)) {
    return text;
  }
  let next = stripAttrBlocks(text, "data-fake-widget");
  next = next.replace(
    /<([A-Za-z][\w]*)\b([^>]*\bclass(?:Name)?=["'][^"']*\bfake-widget\b[^>]*)>([\s\S]*?)<\/\1>\s*/gi,
    "",
  );
  return next;
}

function scanStretchSmallWidget(files) {
  const out = [];
  for (const f of files) {
    if (/data-widget-stretch/.test(f.text) || /stretch a small widget/i.test(f.text)) {
      out.push(hit(f.path, "small widget stretched to large"));
    }
  }
  return out;
}

function applyStretchSmallWidget(text) {
  return text.replace(/\s*data-widget-stretch(?:="[^"]*")?/g, "");
}

function scanAppIconAsWidget(files) {
  const out = [];
  for (const f of files) {
    const widget = /\bstruct\s+\w+\s*:\s*Widget\b/.test(f.text) || /data-widget-app-icon/.test(f.text);
    if (!widget) continue;
    if (/Image\(["']AppIcon["']\)|data-widget-app-icon/.test(f.text)) {
      out.push(hit(f.path, "app icon used as the widget"));
    }
  }
  return out;
}

function scanPointAtIsland(files) {
  const out = [];
  for (const f of files) {
    if (
      /data-dynamic-island-pointer/.test(f.text) ||
      /look up at the Dynamic Island/i.test(f.text)
    ) {
      out.push(hit(f.path, "in-app pointer at Dynamic Island"));
    }
  }
  return out;
}

function applyPointAtIsland(text) {
  return stripAttrBlocks(text, "data-dynamic-island-pointer").replace(
    /\s*look up at the Dynamic Island\.?/gi,
    "",
  );
}

function isLiveActivityFile(file) {
  return (
    /import\s+ActivityKit/.test(file.text) ||
    /\bActivityAttributes\b/.test(file.text) ||
    /data-live-activity/.test(file.text)
  );
}

function scanLiveActivityAppIcon(files) {
  const out = [];
  for (const f of files) {
    if (!isLiveActivityFile(f)) continue;
    if (/Image\(["']AppIcon["']\)|data-live-activity-icon/.test(f.text)) {
      out.push(hit(f.path, "full app icon on a Live Activity"));
    }
  }
  return out;
}

function applyLiveActivityAppIcon(text, file) {
  if (!isLiveActivityFile(file)) return text;
  let next = stripAttrBlocks(text, "data-live-activity-icon");
  next = next.replace(/\s*Image\(["']AppIcon["']\)/g, "");
  return next;
}

function scanLiveActivityAds(files) {
  const out = [];
  for (const f of files) {
    if (!isLiveActivityFile(f) && !/data-live-activity-ad/.test(f.text)) continue;
    if (
      /data-live-activity-ad/.test(f.text) ||
      (isLiveActivityFile(f) && /\b(sponsored|advertisement|buy now)\b/i.test(f.text))
    ) {
      out.push(hit(f.path, "ads in a Live Activity"));
    }
  }
  return out;
}

function applyLiveActivityAds(text) {
  return stripAttrBlocks(text, "data-live-activity-ad");
}

function scanStatusBarHidden(files) {
  const out = [];
  for (const f of files) {
    if (/data-status-bar-hidden/.test(f.text)) {
      out.push(hit(f.path, "status bar permanently hidden"));
      continue;
    }
    if (
      /prefersStatusBarHidden[\s\S]{0,80}\{\s*true\s*\}/.test(f.text) &&
      !/\b(isVideo|isFullscreen|AVPlayer|immersive)\b/.test(f.text)
    ) {
      out.push(hit(f.path, "status bar permanently hidden"));
    }
  }
  return out;
}

function applyStatusBarHidden(text) {
  let next = text.replace(/\s*data-status-bar-hidden(?:="[^"]*")?/g, "");
  next = next.replace(
    /(prefersStatusBarHidden[\s\S]{0,80}\{\s*)true(\s*\})/,
    "$1false$2",
  );
  return next;
}

function scanFakeStatusClock(files) {
  const out = [];
  for (const f of files) {
    if (
      /data-fake-status-bar/.test(f.text) ||
      /class(?:Name)?=["'][^"']*\bfake-status-clock\b/.test(f.text)
    ) {
      out.push(hit(f.path, "fake clock covering the status bar"));
    }
  }
  return out;
}

function applyFakeStatusClock(text) {
  let next = stripAttrBlocks(text, "data-fake-status-bar");
  next = next.replace(
    /<([A-Za-z][\w]*)\b([^>]*\bclass(?:Name)?=["'][^"']*\bfake-status-clock\b[^>]*)>([\s\S]*?)<\/\1>\s*/gi,
    "",
  );
  return next;
}

function scanOpaqueStatusStrip(files) {
  const out = [];
  for (const f of files) {
    if (/data-status-bar-fill/.test(f.text)) {
      out.push(hit(f.path, "opaque strip on the status bar"));
    }
  }
  return out;
}

function applyOpaqueStatusStrip(text) {
  return text.replace(
    /<(header|div|nav|section)\b([^>]*data-status-bar-fill[^>]*)>/gi,
    (all, tag, attrs) => {
      const next = attrs
        .replace(/\s*data-status-bar-fill(?:="[^"]*")?/g, "")
        .replace(/background(?:Color)?\s*:\s*["']?#[0-9a-fA-F]{3,8}["']?\s*,?/gi, "")
        .replace(/background(?:-color)?\s*:\s*#[0-9a-fA-F]{3,8}\s*;?/gi, "");
      return `<${tag}${next}>`;
    },
  );
}

function scanSettingsAsControlCenter(files) {
  const out = [];
  for (const f of files) {
    if (/\bControlWidget(?:Toggle|Button)?\b/.test(f.text)) continue;
    if (/data-control-center/.test(f.text) || /Control Center settings row/i.test(f.text)) {
      out.push(hit(f.path, "settings row styled as Control Center"));
    }
  }
  return out;
}

function applySettingsAsControlCenter(text) {
  if (/\bControlWidget(?:Toggle|Button)?\b/.test(text)) return text;
  return text.replace(/\s*data-control-center(?:="[^"]*")?/g, "");
}

function scanControlToggleOneSymbol(files) {
  const out = [];
  for (const f of files) {
    if (!/\bControlWidgetToggle\b/.test(f.text)) continue;
    const images = [...f.text.matchAll(/systemImage:\s*["']([^"']+)["']/g)].map((m) => m[1]);
    if (images.length === 1) {
      out.push(hit(f.path, "Control Center toggle has one symbol"));
    }
  }
  return out;
}

function scanLockedControlUnredacted(files) {
  const out = [];
  for (const f of files) {
    if (!/\bControlWidget/.test(f.text) && !/data-control-locked/.test(f.text)) continue;
    const locked = /isLocked|data-control-locked/.test(f.text);
    const redacted = /privacySensitive|\.redacted\(|data-redact/.test(f.text);
    if (locked && !redacted) {
      out.push(hit(f.path, "locked control shows personal title/value"));
    }
  }
  return out;
}

const WINDOW_SEL = /\b(html|body|:root|#root|#__next|#app)\b/i;

function cssRules(text) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) {
    out.push({ sel: m[1], body: m[2] });
  }
  return out;
}

function scanScaleXWholeWindow(files) {
  const out = [];
  for (const f of files) {
    let found = false;
    for (const r of cssRules(f.text)) {
      if (WINDOW_SEL.test(r.sel) && /scaleX\(\s*-1\s*\)/i.test(r.body)) {
        found = true;
        break;
      }
    }
    if (
      /<(html|body)\b[^>]*(style=["'][^"']*scaleX\(\s*-1|\bdata-rtl-mirror\b)/i.test(f.text) ||
      /document\.(documentElement|body)\.style\.transform[\s\S]{0,80}scaleX\(\s*-1/i.test(
        f.text,
      )
    ) {
      found = true;
    }
    if (found) out.push(hit(f.path, "scaleX(-1) on the whole window"));
  }
  return out;
}

function applyScaleXWholeWindow(text) {
  let next = text.replace(/([^{}]+)\{([^{}]*)\}/g, (all, sel, body) => {
    if (!WINDOW_SEL.test(sel) || !/scaleX\(\s*-1\s*\)/i.test(body)) return all;
    const cleaned = body
      .replace(/transform\s*:\s*scaleX\(\s*-1\s*\)\s*;?/gi, "")
      .replace(/scaleX\(\s*-1\s*\)/gi, "none");
    return `${sel}{${cleaned}}`;
  });
  next = next.replace(
    /(<html\b[^>]*|<(body)\b[^>]*)\sstyle=(["'])([^"']*)\3/gi,
    (all, open, _body, q, style) => {
      if (!/scaleX\(\s*-1\s*\)/i.test(style)) return all;
      const cleaned = style
        .replace(/transform\s*:\s*scaleX\(\s*-1\s*\)\s*;?/gi, "")
        .replace(/scaleX\(\s*-1\s*\)/gi, "none");
      if (!cleaned.trim()) return `${open}`;
      return `${open} style=${q}${cleaned}${q}`;
    },
  );
  next = next.replace(/\s*data-rtl-mirror(?:="[^"]*")?/g, "");
  next = next.replace(
    /(document\.(documentElement|body)\.style\.transform\s*=\s*["'])scaleX\(\s*-1\s*\)(["'])/gi,
    "$1none$3",
  );
  return next;
}

function scanPhysicalMarginPadding(files) {
  const out = [];
  for (const f of files) {
    if (
      /margin-left\s*:/i.test(f.text) ||
      /padding-right\s*:/i.test(f.text) ||
      /marginLeft\s*:/.test(f.text) ||
      /paddingRight\s*:/.test(f.text)
    ) {
      out.push(hit(f.path, "hard-coded margin-left / padding-right"));
    }
  }
  return out;
}

function applyPhysicalMarginPadding(text) {
  return text
    .replace(/margin-left\s*:/gi, "margin-inline-start:")
    .replace(/padding-right\s*:/gi, "padding-inline-end:")
    .replace(/marginLeft\s*:/g, "marginInlineStart:")
    .replace(/paddingRight\s*:/g, "paddingInlineEnd:");
}

function isBackChrome(text) {
  return (
    /aria-label=["']Back["']/i.test(text) ||
    /\bdata-nav-back\b/.test(text) ||
    /class(?:Name)?=["'][^"']*\b(nav-back|back-button|back-chevron)\b/.test(text) ||
    /\b(BackButton|navigationBarBackIndicator)\b/.test(text) ||
    (/["']Back["']/.test(text) && /chevron\.left|chevron-left|←|&larr;|&#8592;/.test(text))
  );
}

function hasLeftBackChevron(text) {
  return /chevron-left|chevron\.left|←|&larr;|&#8592;|\\u2190/.test(text);
}

function scanBackChevronAlwaysLeft(files) {
  const out = [];
  for (const f of files) {
    if (isBackChrome(f.text) && hasLeftBackChevron(f.text)) {
      out.push(hit(f.path, "back chevron always points left"));
    }
  }
  return out;
}

function applyBackChevronAlwaysLeft(text) {
  if (!isBackChrome(text)) return text;
  return text
    .replace(/chevron-left/g, "chevron-start")
    .replace(/chevron\.left/g, "chevron.backward");
}

function isLocaleRoot(tag, attrs) {
  const t = String(tag).toLowerCase();
  if (t === "html" || t === "body") return true;
  if (/\bid=["'](root|__next|app|locale-root)["']/i.test(attrs)) return true;
  if (/\bdata-locale-root\b/i.test(attrs)) return true;
  return false;
}

function hasDirAuto(attrs) {
  return /\bdir\s*=\s*(["']auto["']|\{\s*["']auto["']\s*\})/i.test(attrs);
}

function scanDirAutoOnLocaleRoot(files) {
  const out = [];
  for (const f of files) {
    const tagged = openingTags(f.text).some(
      (t) => isLocaleRoot(t.tag, t.attrs) && hasDirAuto(t.attrs),
    );
    const script =
      /document\.(documentElement|body)\.dir\s*=\s*["']auto["']/i.test(f.text) ||
      /document\.(documentElement|body)\.setAttribute\(\s*["']dir["']\s*,\s*["']auto["']/i.test(
        f.text,
      );
    if (tagged || script) out.push(hit(f.path, 'dir="auto" on html or locale root'));
  }
  return out;
}

function applyDirAutoOnLocaleRoot(text) {
  let next = text.replace(/<([A-Za-z][\w]*)\b([^>]*)>/g, (all, tag, attrs) => {
    if (!isLocaleRoot(tag, attrs) || !hasDirAuto(attrs)) return all;
    const nextAttrs = attrs
      .replace(/\bdir\s*=\s*["']auto["']/i, 'dir="ltr"')
      .replace(/\bdir\s*=\s*\{\s*["']auto["']\s*\}/i, 'dir="ltr"');
    return `<${tag}${nextAttrs}>`;
  });
  next = next.replace(
    /(document\.(documentElement|body)\.dir\s*=\s*["'])auto(["'])/gi,
    "$1ltr$3",
  );
  next = next.replace(
    /(document\.(documentElement|body)\.setAttribute\(\s*["']dir["']\s*,\s*["'])auto(["'])/gi,
    "$1ltr$3",
  );
  return next;
}

function hasNestedDialogTags(text) {
  let depth = 0;
  const re = /<(\/)?dialog\b[^>]*>/gi;
  let m;
  while ((m = re.exec(text))) {
    const selfClose = /\/\s*>$/.test(m[0]);
    if (m[1]) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    depth += 1;
    if (depth >= 2) return true;
    if (selfClose) depth -= 1;
  }
  return false;
}

function overlayOpenBlocks(text) {
  const out = [];
  const openRe = /<([A-Za-z][\w]*)\b[^>]*\brole=["'](?:dialog|alertdialog)["'][^>]*>/gi;
  let m;
  while ((m = openRe.exec(text))) {
    const tag = m[1];
    let i = m.index + m[0].length;
    let depth = 1;
    const reopen = new RegExp(`<${tag}\\b`, "gi");
    const close = new RegExp(`</${tag}\\s*>`, "gi");
    while (depth > 0 && i < text.length) {
      reopen.lastIndex = i;
      close.lastIndex = i;
      const nOpen = reopen.exec(text);
      const nClose = close.exec(text);
      if (!nClose) {
        i = Math.min(text.length, m.index + 4000);
        break;
      }
      if (nOpen && nOpen.index < nClose.index) {
        depth += 1;
        i = nOpen.index + nOpen[0].length;
      } else {
        depth -= 1;
        i = nClose.index + nClose[0].length;
      }
    }
    out.push(text.slice(m.index, i));
  }
  return out;
}

function scanNestedModalStacks(files) {
  const out = [];
  for (const f of files) {
    if (/data-nested-modal/.test(f.text)) {
      out.push(hit(f.path, "nested modal stacks"));
      continue;
    }
    if (hasNestedDialogTags(f.text)) {
      out.push(hit(f.path, "nested modal stacks"));
      continue;
    }
    const nestedRole = overlayOpenBlocks(f.text).some((block) => {
      const inner = block.replace(/^<[^>]+>/, "");
      return /\brole=["'](?:dialog|alertdialog)["']/i.test(inner);
    });
    if (nestedRole) {
      out.push(hit(f.path, "nested modal stacks"));
      continue;
    }
    if (
      /\.sheet\s*\([\s\S]{0,1200}?\{[\s\S]{0,1200}?(\.sheet\s*\(|\.alert\s*\(|\.confirmationDialog\s*\(|\.fullScreenCover\s*\()/.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "nested modal stacks"));
    }
  }
  return out;
}

function applyNestedModalStacks(text) {
  return text.replace(/\s*data-nested-modal(?:="[^"]*")?/g, "");
}

function overflowAxisFromHint(hint) {
  const h = String(hint || "");
  if (
    /overflow-x(?:-auto|-scroll)\b/i.test(h) ||
    /overflow-x\s*:\s*(auto|scroll)/i.test(h) ||
    /overflowX\s*:\s*["'](auto|scroll)["']/i.test(h)
  ) {
    return "x";
  }
  if (
    /overflow-y(?:-auto|-scroll)\b/i.test(h) ||
    /overflow-y\s*:\s*(auto|scroll)/i.test(h) ||
    /overflowY\s*:\s*["'](auto|scroll)["']/i.test(h)
  ) {
    return "y";
  }
  if (
    /\boverflow-(?:auto|scroll)\b/i.test(h) ||
    /(?:^|[^-])overflow\s*:\s*(auto|scroll)/i.test(h) ||
    /overflow\s*:\s*["'](auto|scroll)["']/i.test(h)
  ) {
    return "both";
  }
  return null;
}

function axesOverlap(a, b) {
  if (!a || !b) return false;
  if (a === "both" || b === "both") return true;
  return a === b;
}

function tagOverflowAxis(open) {
  const style = /style=["']([^"']*)["']/i.exec(open);
  const cls = /class(Name)?=["']([^"']*)["']/i.exec(open);
  return overflowAxisFromHint(`${style ? style[1] : ""} ${cls ? cls[2] : ""} ${open}`);
}

function innerAfterOpen(text, tag, start) {
  let i = start;
  let depth = 1;
  const reopen = new RegExp(`<${tag}\\b`, "gi");
  const close = new RegExp(`</${tag}\\s*>`, "gi");
  while (depth > 0 && i < text.length) {
    reopen.lastIndex = i;
    close.lastIndex = i;
    const nOpen = reopen.exec(text);
    const nClose = close.exec(text);
    if (!nClose) return text.slice(start, Math.min(text.length, start + 4000));
    if (nOpen && nOpen.index < nClose.index) {
      depth += 1;
      i = nOpen.index + nOpen[0].length;
    } else {
      depth -= 1;
      i = nClose.index + nClose[0].length;
    }
  }
  return text.slice(start, i);
}

function hasNestedSameAxisOverflow(text) {
  const re = /<([A-Za-z][\w]*)\b[^>]*>/g;
  let m;
  while ((m = re.exec(text))) {
    const tag = m[1];
    if (/^(html|body)$/i.test(tag)) continue;
    const axis = tagOverflowAxis(m[0]);
    if (!axis) continue;
    const inner = innerAfterOpen(text, tag, m.index + m[0].length);
    const innerRe = /<([A-Za-z][\w]*)\b[^>]*>/g;
    let im;
    while ((im = innerRe.exec(inner))) {
      if (/^(html|body)$/i.test(im[1])) continue;
      const iaxis = tagOverflowAxis(im[0]);
      if (axesOverlap(axis, iaxis)) return true;
    }
  }
  return false;
}

function nestedScrollViewSameAxis(text) {
  const re =
    /ScrollView((?:\(\s*\.(horizontal|vertical)\s*\))?)\s*\{[\s\S]{0,2500}?ScrollView((?:\(\s*\.(horizontal|vertical)\s*\))?)\s*\{/;
  const m = re.exec(text);
  if (!m) return false;
  const a = /horizontal/.test(m[1] || "") ? "x" : "y";
  const b = /horizontal/.test(m[3] || "") ? "x" : "y";
  return a === b;
}

function scanSliderAsVolume(files) {
  const out = [];
  for (const f of files) {
    if (/\b(MPVolumeView|VolumeView)\b/.test(f.text)) continue;
    if (/data-volume-slider/.test(f.text)) {
      out.push(hit(f.path, "slider to adjust audio volume"));
      continue;
    }
    const opens = f.text.match(/<input\b[^>]*>/gi) || [];
    if (opens.some((t) => /type=["']range["']/i.test(t) && /volume/i.test(t))) {
      out.push(hit(f.path, "slider to adjust audio volume"));
      continue;
    }
    if (
      /<(input|div)[^>]*(role=["']slider["']|type=["']range["'])[^>]*volume/i.test(f.text) ||
      /<(input|div)[^>]*volume[^>]*(role=["']slider["']|type=["']range["'])/i.test(f.text)
    ) {
      out.push(hit(f.path, "slider to adjust audio volume"));
      continue;
    }
    if (/Slider\s*\([\s\S]{0,200}?volume/i.test(f.text)) {
      out.push(hit(f.path, "slider to adjust audio volume"));
      continue;
    }
    if (/\b(UISlider|NSSlider)\b/.test(f.text) && /volume/i.test(f.text)) {
      out.push(hit(f.path, "slider to adjust audio volume"));
    }
  }
  return out;
}

function applySliderAsVolume(text) {
  return text.replace(/\s*data-volume-slider(?:="[^"]*")?/g, "");
}

function scanNestedSameAxisScroll(files) {
  const out = [];
  for (const f of files) {
    if (/data-nested-same-axis-scroll/.test(f.text)) {
      out.push(hit(f.path, "nested same-axis scroll"));
      continue;
    }
    if (nestedScrollViewSameAxis(f.text) || hasNestedSameAxisOverflow(f.text)) {
      out.push(hit(f.path, "nested same-axis scroll"));
    }
  }
  return out;
}

function applyNestedSameAxisScroll(text) {
  return text.replace(/\s*data-nested-same-axis-scroll(?:="[^"]*")?/g, "");
}

function hasNestedPopoverTags(text) {
  return blocksWithAttr(text, "popover").some((b) => {
    const inner = b.text.replace(/^<[^>]+>/, "");
    return /<[A-Za-z][\w]*\b[^>]*\spopover(?:\s|=|\/|>)/i.test(inner);
  });
}

function scanCascadePopover(files) {
  const out = [];
  for (const f of files) {
    if (/data-nested-popover/.test(f.text)) {
      out.push(hit(f.path, "cascade popovers"));
      continue;
    }
    if (hasNestedPopoverTags(f.text)) {
      out.push(hit(f.path, "cascade popovers"));
      continue;
    }
    if (/\.popover\s*\([\s\S]{0,1500}?\.popover\s*\(/.test(f.text)) {
      out.push(hit(f.path, "cascade popovers"));
    }
  }
  return out;
}

function applyCascadePopover(text) {
  return text.replace(/\s*data-nested-popover(?:="[^"]*")?/g, "");
}

function scanPopoverAsWarning(files) {
  const out = [];
  for (const f of files) {
    if (/data-popover-warning/.test(f.text)) {
      out.push(hit(f.path, "popover as warning"));
      continue;
    }
    const blocks = [
      ...blocksWithAttr(f.text, "popover"),
      ...blocksWithAttr(f.text, "data-popover"),
    ];
    if (
      blocks.some((b) =>
        /role=["']alertdialog["']|<h[1-6][^>]*>\s*warning\b/i.test(b.text),
      )
    ) {
      out.push(hit(f.path, "popover as warning"));
    }
  }
  return out;
}

function applyPopoverAsWarning(text) {
  return text.replace(/\s*data-popover-warning(?:="[^"]*")?/g, "");
}

function scanPopoverOnCompact(files) {
  const out = [];
  for (const f of files) {
    if (/data-popover-compact/.test(f.text)) {
      out.push(hit(f.path, "popover on compact"));
      continue;
    }
    if (/\.presentationCompactAdaptation\(\s*\.popover\s*\)/.test(f.text)) {
      out.push(hit(f.path, "popover on compact"));
    }
  }
  return out;
}

function applyPopoverOnCompact(text) {
  return text
    .replace(/\s*data-popover-compact(?:="[^"]*")?/g, "")
    .replace(/\s*\.presentationCompactAdaptation\(\s*\.popover\s*\)/g, "");
}

function hasCollectionWidget(text) {
  return (
    /data-collection/.test(text) ||
    /\b(UICollectionView|NSCollectionView)\b/.test(text) ||
    /\bLazy(VGrid|HGrid)\b/.test(text) ||
    /\bCollectionView\s*[\({]/.test(text)
  );
}

function scanCustomCollectionLayout(files) {
  const out = [];
  for (const f of files) {
    if (!hasCollectionWidget(f.text) && !/data-custom-collection-layout/.test(f.text)) {
      continue;
    }
    if (/data-custom-collection-layout/.test(f.text)) {
      out.push(hit(f.path, "custom collection layout"));
      continue;
    }
    if (/\b(masonry|isotope|mosaic-layout|pinterest-grid)\b/i.test(f.text)) {
      out.push(hit(f.path, "custom collection layout"));
    }
  }
  return out;
}

function applyCustomCollectionLayout(text) {
  return text.replace(/\s*data-custom-collection-layout(?:="[^"]*")?/g, "");
}

function collectionBlocks(text) {
  const blocks = [...blocksWithAttr(text, "data-collection")];
  if (blocks.length) return blocks;
  if (hasCollectionWidget(text)) return [{ text, start: 0, end: text.length }];
  return [];
}

function scanTextCollectionAsTable(files) {
  const out = [];
  for (const f of files) {
    if (/data-text-collection/.test(f.text)) {
      out.push(hit(f.path, "collection of text"));
      continue;
    }
    const blocks = collectionBlocks(f.text);
    for (const b of blocks) {
      if (/<(img|picture|video|svg)\b/i.test(b.text)) continue;
      const items = b.text.match(/<(li|span|div|p|label)\b/gi) || [];
      if (items.length >= 2) {
        out.push(hit(f.path, "collection of text"));
        break;
      }
    }
  }
  return out;
}

function applyTextCollectionAsTable(text) {
  return text.replace(/\s*data-text-collection(?:="[^"]*")?/g, "");
}

function scanOverlappingCollectionItems(files) {
  const out = [];
  for (const f of files) {
    if (/data-overlapping-collection/.test(f.text)) {
      out.push(hit(f.path, "collection items overlap"));
      continue;
    }
    if (!hasCollectionWidget(f.text)) continue;
    if (
      /margin(?:-left|-right|-inline(?:-start|-end)?)\s*:\s*-/.test(f.text) ||
      /margin(?:Left|Right|Inline)\s*:\s*["']?-/.test(f.text) ||
      /translate(?:X|3d)?\(\s*-/.test(f.text)
    ) {
      out.push(hit(f.path, "collection items overlap"));
    }
  }
  return out;
}

function applyOverlappingCollectionItems(text) {
  return text.replace(/\s*data-overlapping-collection(?:="[^"]*")?/g, "");
}

function hasPageControlWidget(text) {
  return (
    /data-page-control/.test(text) ||
    /data-carousel-dots/.test(text) ||
    /\bUIPageControl\b/.test(text) ||
    /\bPageControl\s*[\({]/.test(text) ||
    /PageTabViewStyle/.test(text) ||
    /\.tabViewStyle\(\s*\.page/.test(text)
  );
}

function pageControlNumberOfPages(text) {
  const nums = [...String(text).matchAll(/numberOfPages\s*[:=]\s*\{?\s*(\d+)/g)].map((m) =>
    Number(m[1]),
  );
  return nums.length ? Math.max(...nums) : 0;
}

function countPageControlDots(text) {
  let max = pageControlNumberOfPages(text);
  for (const b of blocksWithAttr(text, "data-page-control")) {
    const buttons = b.text.match(/<button\b/gi) || [];
    const dots = b.text.match(/data-page-dot/g) || [];
    max = Math.max(max, buttons.length, dots.length);
  }
  return max;
}

function scanPageControlAsHierarchy(files) {
  const out = [];
  for (const f of files) {
    if (/data-hierarchical-page-control/.test(f.text)) {
      out.push(hit(f.path, "hierarchical page control"));
    }
  }
  return out;
}

function applyPageControlAsHierarchy(text) {
  return text.replace(/\s*data-hierarchical-page-control(?:="[^"]*")?/g, "");
}

function scanTooManyPageDots(files) {
  const out = [];
  for (const f of files) {
    if (/data-too-many-page-dots/.test(f.text)) {
      out.push(hit(f.path, "too many page-control dots"));
      continue;
    }
    if (!hasPageControlWidget(f.text) && pageControlNumberOfPages(f.text) < 11) continue;
    if (countPageControlDots(f.text) >= 11) {
      out.push(hit(f.path, "too many page-control dots"));
    }
  }
  return out;
}

function applyTooManyPageDots(text) {
  return text.replace(/\s*data-too-many-page-dots(?:="[^"]*")?/g, "");
}

function scanTooManyPageIndicatorImages(files) {
  const out = [];
  for (const f of files) {
    if (/data-many-page-indicator-images/.test(f.text)) {
      out.push(hit(f.path, "too many page-control indicator images"));
      continue;
    }
    if (!hasPageControlWidget(f.text)) continue;
    const images = f.text.match(/<(img|Image)\b/gi) || [];
    const symbols = f.text.match(/systemName:\s*["'][^"']+["']/g) || [];
    if (images.length + symbols.length > 2) {
      out.push(hit(f.path, "too many page-control indicator images"));
    }
  }
  return out;
}

function applyTooManyPageIndicatorImages(text) {
  return text.replace(/\s*data-many-page-indicator-images(?:="[^"]*")?/g, "");
}

function scanColoredPageIndicators(files) {
  const out = [];
  for (const f of files) {
    if (/data-colored-page-indicators/.test(f.text)) {
      out.push(hit(f.path, "colored page-control indicators"));
      continue;
    }
    if (!hasPageControlWidget(f.text)) continue;
    if (
      /pageIndicatorTintColor/.test(f.text) ||
      /currentPageIndicatorTintColor/.test(f.text) ||
      /--page-indicator-color/.test(f.text)
    ) {
      out.push(hit(f.path, "colored page-control indicators"));
    }
  }
  return out;
}

function applyColoredPageIndicators(text) {
  return text.replace(/\s*data-colored-page-indicators(?:="[^"]*")?/g, "");
}

function hasStaticLabelWidget(text) {
  return (
    /\bdata-label\b/.test(text) ||
    /\bUILabel\b/.test(text) ||
    /\bLabel\s*\(/.test(text)
  );
}

function scanEditableLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-editable-label/.test(f.text)) {
      out.push(hit(f.path, "editable label"));
      continue;
    }
    if (!hasStaticLabelWidget(f.text)) continue;
    if (
      /contenteditable\s*=\s*["']true["']/i.test(f.text) ||
      /isEditable\s*=\s*true/.test(f.text)
    ) {
      out.push(hit(f.path, "editable label"));
    }
  }
  return out;
}

function applyEditableLabel(text) {
  return text.replace(/\s*data-editable-label(?:="[^"]*")?/g, "");
}

function scanLongLabelAsTextView(files) {
  const out = [];
  for (const f of files) {
    if (/data-long-label/.test(f.text)) {
      out.push(hit(f.path, "large amount of text in a label"));
    }
  }
  return out;
}

function applyLongLabelAsTextView(text) {
  return text.replace(/\s*data-long-label(?:="[^"]*")?/g, "");
}

function scanUnselectableUsefulLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-unselectable-label/.test(f.text)) {
      out.push(hit(f.path, "useful label text people can't copy"));
      continue;
    }
    if (!hasStaticLabelWidget(f.text)) continue;
    if (
      /(user-select\s*:\s*none|userSelect\s*:\s*["']none["'])/.test(f.text) &&
      /\b(error|location|IP|address)\b/i.test(f.text)
    ) {
      out.push(hit(f.path, "useful label text people can't copy"));
    }
  }
  return out;
}

function applyUnselectableUsefulLabel(text) {
  return text.replace(/\s*data-unselectable-label(?:="[^"]*")?/g, "");
}

function hasTextViewWidget(text) {
  return (
    /\bdata-text-view\b/.test(text) ||
    /\bUITextView\b/.test(text) ||
    /\bNSTextView\b/.test(text) ||
    /\bTextEditor\s*\(/.test(text) ||
    /<textarea\b/i.test(text)
  );
}

function scanShortTextAsField(files) {
  const out = [];
  for (const f of files) {
    if (/data-short-text-view/.test(f.text)) {
      out.push(hit(f.path, "text view for a small amount of text"));
      continue;
    }
    if (!hasTextViewWidget(f.text)) continue;
    if (
      /<textarea\b[^>]*(rows\s*=\s*["']?1["']?|rows\s*=\s*\{\s*1\s*\})/i.test(
        f.text,
      ) ||
      /(maximumNumberOfLines|numberOfLines)\s*=\s*1/.test(f.text)
    ) {
      out.push(hit(f.path, "text view for a small amount of text"));
    }
  }
  return out;
}

function applyShortTextAsField(text) {
  return text.replace(/\s*data-short-text-view(?:="[^"]*")?/g, "");
}

function scanUnselectableUsefulTextView(files) {
  const out = [];
  for (const f of files) {
    if (/data-unselectable-text-view/.test(f.text)) {
      out.push(hit(f.path, "useful text-view text people can't copy"));
      continue;
    }
    if (!hasTextViewWidget(f.text)) continue;
    if (
      /(user-select\s*:\s*none|userSelect\s*:\s*["']none["'])/.test(f.text) &&
      /\b(error|serial|IP|address)\b/i.test(f.text)
    ) {
      out.push(hit(f.path, "useful text-view text people can't copy"));
    }
  }
  return out;
}

function applyUnselectableUsefulTextView(text) {
  return text.replace(/\s*data-unselectable-text-view(?:="[^"]*")?/g, "");
}

function hasImageViewWidget(text) {
  return (
    /\bdata-image-view\b/.test(text) ||
    /\bUIImageView\b/.test(text) ||
    /\bNSImageView\b/.test(text) ||
    /\bAsyncImage\s*\(/.test(text)
  );
}

function scanImageViewAsButton(files) {
  const out = [];
  for (const f of files) {
    if (/data-interactive-image-view/.test(f.text)) {
      out.push(hit(f.path, "button behaviors on an image view"));
      continue;
    }
    if (!hasImageViewWidget(f.text)) continue;
    if (
      /\bon(Click|TapGesture)\b/.test(f.text) ||
      /role=["']button["']/i.test(f.text)
    ) {
      out.push(hit(f.path, "button behaviors on an image view"));
    }
  }
  return out;
}

function applyImageViewAsButton(text) {
  return text.replace(/\s*data-interactive-image-view(?:="[^"]*")?/g, "");
}

function scanImageViewAsIcon(files) {
  const out = [];
  for (const f of files) {
    if (/data-icon-image-view/.test(f.text)) {
      out.push(hit(f.path, "image view for an interface icon"));
    }
  }
  return out;
}

function applyImageViewAsIcon(text) {
  return text.replace(/\s*data-icon-image-view(?:="[^"]*")?/g, "");
}

function scanTextOverlayOnImageView(files) {
  const out = [];
  for (const f of files) {
    if (/data-text-on-image-view/.test(f.text)) {
      out.push(hit(f.path, "overlaying text on an image view"));
    }
  }
  return out;
}

function applyTextOverlayOnImageView(text) {
  return text.replace(/\s*data-text-on-image-view(?:="[^"]*")?/g, "");
}

function hasChartWidget(text) {
  return (
    /\bdata-chart\b/.test(text) ||
    /\bChart\s*\(/.test(text) ||
    /\b(BarMark|LineMark|PointMark|AreaMark|RectMark|RuleMark)\b/.test(text)
  );
}

function scanColorOnlyChartSeries(files) {
  const out = [];
  for (const f of files) {
    if (/data-color-only-chart/.test(f.text)) {
      out.push(hit(f.path, "relying solely on color to distinguish chart data"));
    }
  }
  return out;
}

function applyColorOnlyChartSeries(text) {
  return text.replace(/\s*data-color-only-chart(?:="[^"]*")?/g, "");
}

function scanChartCriticalBehindInteraction(files) {
  const out = [];
  for (const f of files) {
    if (/data-chart-hover-only/.test(f.text)) {
      out.push(hit(f.path, "hide critical chart information behind interaction"));
      continue;
    }
    if (!hasChartWidget(f.text)) continue;
    if (/\bon(MouseEnter|PointerEnter|Hover)\b/.test(f.text)) {
      out.push(hit(f.path, "hide critical chart information behind interaction"));
    }
  }
  return out;
}

function applyChartCriticalBehindInteraction(text) {
  return text.replace(/\s*data-chart-hover-only(?:="[^"]*")?/g, "");
}

function scanChartAsTable(files) {
  const out = [];
  for (const f of files) {
    if (/data-chart-as-table/.test(f.text)) {
      out.push(hit(f.path, "chart of data that should be a table or list"));
    }
  }
  return out;
}

function applyChartAsTable(text) {
  return text.replace(/\s*data-chart-as-table(?:="[^"]*")?/g, "");
}

function scanOvercrowdedChart(files) {
  const out = [];
  for (const f of files) {
    if (/data-overcrowded-chart/.test(f.text)) {
      out.push(hit(f.path, "chart packed with too much data"));
    }
  }
  return out;
}

function applyOvercrowdedChart(text) {
  return text.replace(/\s*data-overcrowded-chart(?:="[^"]*")?/g, "");
}

function hasDisclosureWidget(text) {
  return (
    /\bdata-disclosure\b/.test(text) ||
    /<details\b/i.test(text) ||
    /\bDisclosureGroup\s*\(/.test(text) ||
    /BezelStyle\.(disclosure|pushDisclosure)/.test(text)
  );
}

function scanExtraDisclosureButton(files) {
  const out = [];
  for (const f of files) {
    if (/data-many-disclosure-buttons/.test(f.text)) {
      out.push(hit(f.path, "more than one disclosure button in a view"));
      continue;
    }
    if (!hasDisclosureWidget(f.text)) continue;
    const buttons = f.text.match(/data-disclosure-button|pushDisclosure/g) || [];
    if (buttons.length >= 2) {
      out.push(hit(f.path, "more than one disclosure button in a view"));
    }
  }
  return out;
}

function applyExtraDisclosureButton(text) {
  return text.replace(/\s*data-many-disclosure-buttons(?:="[^"]*")?/g, "");
}

function scanUnlabeledDisclosureTriangle(files) {
  const out = [];
  for (const f of files) {
    if (/data-unlabeled-disclosure/.test(f.text)) {
      out.push(hit(f.path, "disclosure triangle without a descriptive label"));
      continue;
    }
    if (!hasDisclosureWidget(f.text)) continue;
    if (/<details\b/i.test(f.text) && !/<summary\b[^>]*>\s*\S/i.test(f.text)) {
      out.push(hit(f.path, "disclosure triangle without a descriptive label"));
    }
  }
  return out;
}

function applyUnlabeledDisclosureTriangle(text) {
  return text.replace(/\s*data-unlabeled-disclosure(?:="[^"]*")?/g, "");
}

function scanAdvancedDetailsUnhidden(files) {
  const out = [];
  for (const f of files) {
    if (/data-advanced-unhidden/.test(f.text)) {
      out.push(hit(f.path, "advanced details shown without hiding them"));
    }
  }
  return out;
}

function applyAdvancedDetailsUnhidden(text) {
  return text.replace(/\s*data-advanced-unhidden(?:="[^"]*")?/g, "");
}

function hasBoxWidget(text) {
  return (
    /\bdata-box\b/.test(text) ||
    /\bNSBox\b/.test(text) ||
    /\bGroupBox\s*[\({]/.test(text)
  );
}

function scanNestedBoxes(files) {
  const out = [];
  for (const f of files) {
    if (/data-nested-boxes/.test(f.text)) {
      out.push(hit(f.path, "nested boxes to define subgroups"));
      continue;
    }
    if (!hasBoxWidget(f.text)) continue;
    const blocks = blocksWithAttr(f.text, "data-box");
    for (const block of blocks) {
      const inner = block.text.replace(/^<[^>]+>/, "");
      if (
        /\bdata-box\b/.test(inner) ||
        /\bNSBox\b/.test(inner) ||
        /\bGroupBox\s*[\({]/.test(inner)
      ) {
        out.push(hit(f.path, "nested boxes to define subgroups"));
        break;
      }
    }
  }
  return out;
}

function applyNestedBoxes(text) {
  return text.replace(/\s*data-nested-boxes(?:="[^"]*")?/g, "");
}

function scanOversizedBox(files) {
  const out = [];
  for (const f of files) {
    if (/data-oversized-box/.test(f.text)) {
      out.push(hit(f.path, "a box whose size approaches its containing view"));
    }
  }
  return out;
}

function applyOversizedBox(text) {
  return text.replace(/\s*data-oversized-box(?:="[^"]*")?/g, "");
}

function hasEditMenuWidget(text) {
  return (
    /\bdata-edit-menu\b/.test(text) ||
    /\bUIMenuController\b/.test(text) ||
    /\bUIEditMenuInteraction\b/.test(text) ||
    /\.editMenu\s*\(/.test(text)
  );
}

function scanCustomEditMenu(files) {
  const out = [];
  for (const f of files) {
    if (/data-custom-edit-menu/.test(f.text)) {
      out.push(hit(f.path, "custom menu that presents the same commands"));
    }
  }
  return out;
}

function applyCustomEditMenu(text) {
  return text.replace(/\s*data-custom-edit-menu(?:="[^"]*")?/g, "");
}

function scanInapplicableEditCommands(files) {
  const out = [];
  for (const f of files) {
    if (/data-edit-no-selection/.test(f.text)) {
      out.push(hit(f.path, "Cut or Copy shown when nothing is selected"));
      continue;
    }
    if (!hasEditMenuWidget(f.text)) continue;
    const hasCutCopy = /\b(Cut|Copy)\b/.test(f.text);
    const hasSelection =
      /\bdata-selection\b/.test(f.text) || /aria-selected=["']true["']/i.test(f.text);
    if (hasCutCopy && !hasSelection) {
      out.push(hit(f.path, "Cut or Copy shown when nothing is selected"));
    }
  }
  return out;
}

function applyInapplicableEditCommands(text) {
  return text.replace(/\s*data-edit-no-selection(?:="[^"]*")?/g, "");
}

function scanRedundantEditControls(files) {
  const out = [];
  for (const f of files) {
    if (/data-redundant-edit-controls/.test(f.text)) {
      out.push(hit(f.path, "other controls that perform the same functions"));
    }
  }
  return out;
}

function applyRedundantEditControls(text) {
  return text.replace(/\s*data-redundant-edit-controls(?:="[^"]*")?/g, "");
}

function hasHelpWidget(text) {
  return (
    /\bdata-help\b/.test(text) ||
    /\bdata-tip\b/.test(text) ||
    /\bdata-tooltip\b/.test(text) ||
    /role=["']tooltip["']/i.test(text) ||
    /\bTipView\s*\(/.test(text) ||
    /\bpopoverTip\s*\(/.test(text) ||
    /\.help\s*\(/.test(text)
  );
}

function scanWrongPlatformHelp(files) {
  const out = [];
  for (const f of files) {
    if (/data-wrong-platform-help/.test(f.text)) {
      out.push(hit(f.path, "help copy that tells people to click on iPhone"));
      continue;
    }
    if (!hasHelpWidget(f.text)) continue;
    if (
      /click[\s\S]{0,80}(iphone|ios\b)/i.test(f.text) ||
      /tap[\s\S]{0,80}(\bmac\b|macos)/i.test(f.text)
    ) {
      out.push(hit(f.path, "help copy that tells people to click on iPhone"));
    }
  }
  return out;
}

function applyWrongPlatformHelp(text) {
  return text.replace(/\s*data-wrong-platform-help(?:="[^"]*")?/g, "");
}

function scanStandardComponentHelp(files) {
  const out = [];
  for (const f of files) {
    if (/data-standard-component-help/.test(f.text)) {
      out.push(hit(f.path, "help content that explains how standard components work"));
    }
  }
  return out;
}

function applyStandardComponentHelp(text) {
  return text.replace(/\s*data-standard-component-help(?:="[^"]*")?/g, "");
}

function scanPromotionalTip(files) {
  const out = [];
  for (const f of files) {
    if (/data-promotional-tip/.test(f.text)) {
      out.push(hit(f.path, "promotional content in a tip"));
      continue;
    }
    if (!hasHelpWidget(f.text)) continue;
    if (/\b(upgrade now|subscribe now|buy now|limited offer)\b/i.test(f.text)) {
      out.push(hit(f.path, "promotional content in a tip"));
    }
  }
  return out;
}

function applyPromotionalTip(text) {
  return text.replace(/\s*data-promotional-tip(?:="[^"]*")?/g, "");
}

function hasWebView(text) {
  return (
    /\bdata-web-view\b/.test(text) ||
    /<iframe\b/i.test(text) ||
    /\bWKWebView\b/.test(text) ||
    /\bWebView\s*\(/.test(text)
  );
}

function hasWebViewBackForward(text) {
  return (
    /\b(goBack|goForward|canGoBack|canGoForward|allowsBackForwardNavigationGestures)\b/.test(
      text,
    ) ||
    (/\bBack\b/.test(text) && /\bForward\b/.test(text))
  );
}

function scanMissingWebViewBackForward(files) {
  const out = [];
  for (const f of files) {
    if (/data-no-web-back-forward/.test(f.text)) {
      out.push(hit(f.path, "multi-page web view without forward and back"));
      continue;
    }
    if (!hasWebView(f.text)) continue;
    if (
      /\bdata-web-view-multipage\b/.test(f.text) &&
      !hasWebViewBackForward(f.text)
    ) {
      out.push(hit(f.path, "multi-page web view without forward and back"));
    }
  }
  return out;
}

function applyMissingWebViewBackForward(text) {
  return text.replace(/\s*data-no-web-back-forward(?:="[^"]*")?/g, "");
}

function scanSafariReplicaWebView(files) {
  const out = [];
  for (const f of files) {
    if (/data-safari-replica/.test(f.text)) {
      out.push(hit(f.path, "a web view that replicates Safari"));
    }
  }
  return out;
}

function applySafariReplicaWebView(text) {
  return text.replace(/\s*data-safari-replica(?:="[^"]*")?/g, "");
}

function hasActivityView(text) {
  return (
    /\bdata-activity-view\b/.test(text) ||
    /\bdata-share-sheet\b/.test(text) ||
    /\bUIActivityViewController\b/.test(text) ||
    /\bShareLink\s*\(/.test(text) ||
    /\.shareSheet\s*\(/.test(text)
  );
}

function scanDuplicateActivityActions(files) {
  const out = [];
  for (const f of files) {
    if (/data-duplicate-activity-action/.test(f.text)) {
      out.push(hit(f.path, "duplicate versions of common actions"));
      continue;
    }
    if (!hasActivityView(f.text)) continue;
    const prints = (f.text.match(/>Print</g) || []).length;
    const copies = (f.text.match(/>Copy</g) || []).length;
    if (prints >= 2 || copies >= 2) {
      out.push(hit(f.path, "duplicate versions of common actions"));
    }
  }
  return out;
}

function applyDuplicateActivityActions(text) {
  return text.replace(/\s*data-duplicate-activity-action(?:="[^"]*")?/g, "");
}

function scanAlternativeActivityReveal(files) {
  const out = [];
  for (const f of files) {
    if (/data-alt-activity-reveal/.test(f.text)) {
      out.push(hit(f.path, "alternative control that presents the activity view"));
    }
  }
  return out;
}

function applyAlternativeActivityReveal(text) {
  return text.replace(/\s*data-alt-activity-reveal(?:="[^"]*")?/g, "");
}

function hasPrintAction(text) {
  return (
    /\bdata-print\b/.test(text) ||
    /\bwindow\.print\s*\(/.test(text) ||
    /\bUIPrintInteractionController\b/.test(text) ||
    /\bNSPrintOperation\b/.test(text)
  );
}

function scanPrintWhenNothingPrintable(files) {
  const out = [];
  for (const f of files) {
    if (/data-print-nothing/.test(f.text)) {
      out.push(hit(f.path, "Print action shown when nothing is printable"));
      continue;
    }
    if (!hasPrintAction(f.text)) continue;
    if (
      /\bdata-nothing-printable\b/.test(f.text) &&
      !/\b(disabled|aria-disabled=["']true["'])/.test(f.text)
    ) {
      out.push(hit(f.path, "Print action shown when nothing is printable"));
    }
  }
  return out;
}

function applyPrintWhenNothingPrintable(text) {
  return text.replace(/\s*data-print-nothing(?:="[^"]*")?/g, "");
}

function scanDuplicatePageOrientation(files) {
  const out = [];
  for (const f of files) {
    if (/data-duplicate-page-orientation/.test(f.text)) {
      out.push(hit(f.path, "duplicate system page-orientation options"));
    }
  }
  return out;
}

function applyDuplicatePageOrientation(text) {
  return text.replace(/\s*data-duplicate-page-orientation(?:="[^"]*")?/g, "");
}

function hasFullscreen(text) {
  return (
    /\bdata-fullscreen\b/.test(text) ||
    /\brequestFullscreen\s*\(/.test(text) ||
    /\bwebkitRequestFullscreen\s*\(/.test(text) ||
    /\btoggleFullScreen\s*\(/.test(text) ||
    /\bfullScreenCover\s*\(/.test(text)
  );
}

function scanProgrammaticFullscreenResize(files) {
  const out = [];
  for (const f of files) {
    if (/data-programmatic-resize/.test(f.text)) {
      out.push(hit(f.path, "window programmatically resized for full-screen"));
      continue;
    }
    if (!hasFullscreen(f.text)) continue;
    if (/\bresizeTo\s*\(/.test(f.text)) {
      out.push(hit(f.path, "window programmatically resized for full-screen"));
    }
  }
  return out;
}

function applyProgrammaticFullscreenResize(text) {
  return text.replace(/\s*data-programmatic-resize(?:="[^"]*")?/g, "");
}

function scanAutoExitFullscreen(files) {
  const out = [];
  for (const f of files) {
    if (/data-auto-exit-fullscreen/.test(f.text)) {
      out.push(hit(f.path, "full-screen mode that ends automatically"));
    }
  }
  return out;
}

function applyAutoExitFullscreen(text) {
  return text.replace(/\s*data-auto-exit-fullscreen(?:="[^"]*")?/g, "");
}

function scanCustomWindowModeMenu(files) {
  const out = [];
  for (const f of files) {
    if (/data-custom-window-mode-menu/.test(f.text)) {
      out.push(hit(f.path, "custom menu of window modes"));
    }
  }
  return out;
}

function applyCustomWindowModeMenu(text) {
  return text.replace(/\s*data-custom-window-mode-menu(?:="[^"]*")?/g, "");
}

function hasFileBrowser(text) {
  return (
    /\bdata-file-browser\b/.test(text) ||
    /\bdata-document-browser\b/.test(text) ||
    /\bUIDocumentBrowserViewController\b/.test(text) ||
    /\bUIDocumentPickerViewController\b/.test(text) ||
    /\bDocumentGroup\s*\(/.test(text) ||
    /\bNSOpenPanel\b/.test(text) ||
    /\bNSSavePanel\b/.test(text)
  );
}

function scanCustomFileToolbar(files) {
  const out = [];
  for (const f of files) {
    if (/data-custom-file-toolbar/.test(f.text)) {
      out.push(hit(f.path, "custom top toolbar on a file-browser modal"));
    }
  }
  return out;
}

function applyCustomFileToolbar(text) {
  return text.replace(/\s*data-custom-file-toolbar(?:="[^"]*")?/g, "");
}

function scanExtensionsShownByDefault(files) {
  const out = [];
  for (const f of files) {
    if (/data-show-extensions-by-default/.test(f.text)) {
      out.push(hit(f.path, "file extensions shown by default"));
    }
  }
  return out;
}

function applyExtensionsShownByDefault(text) {
  return text.replace(/\s*data-show-extensions-by-default(?:="[^"]*")?/g, "");
}

function scanExplicitSaveRequired(files) {
  const out = [];
  for (const f of files) {
    if (/data-explicit-save-required/.test(f.text)) {
      out.push(hit(f.path, "explicit action to save required to keep work"));
      continue;
    }
    if (!hasFileBrowser(f.text)) continue;
    if (/>Save</.test(f.text) && /\bdata-no-autosave\b/.test(f.text)) {
      out.push(hit(f.path, "explicit action to save required to keep work"));
    }
  }
  return out;
}

function applyExplicitSaveRequired(text) {
  return text.replace(/\s*data-explicit-save-required(?:="[^"]*")?/g, "");
}

function hasFocusSystem(text) {
  return (
    /\bdata-focus-system\b/.test(text) ||
    /\bdata-focus-ring\b/.test(text) ||
    /\bUIFocusHaloEffect\b/.test(text) ||
    /\bfocusGroupIdentifier\b/.test(text) ||
    /\bNSFocusRingType\b/.test(text) ||
    /\bpreferredFocusEnvironments\b/.test(text)
  );
}

function scanStealFocus(files) {
  const out = [];
  for (const f of files) {
    if (/data-steal-focus/.test(f.text)) {
      out.push(hit(f.path, "focus changed without people's interaction"));
      continue;
    }
    if (!hasFocusSystem(f.text)) continue;
    if (/\.focus\s*\(/.test(f.text)) {
      out.push(hit(f.path, "focus changed without people's interaction"));
    }
  }
  return out;
}

function applyStealFocus(text) {
  return text.replace(/\s*data-steal-focus(?:="[^"]*")?/g, "");
}

function scanCustomFocusEffect(files) {
  const out = [];
  for (const f of files) {
    if (/data-custom-focus-effect/.test(f.text)) {
      out.push(hit(f.path, "custom focus effects that replace the system effect"));
    }
  }
  return out;
}

function applyCustomFocusEffect(text) {
  return text.replace(/\s*data-custom-focus-effect(?:="[^"]*")?/g, "");
}

function hasAccountChrome(text) {
  return (
    /\bdata-account\b/.test(text) ||
    /\bdata-sign-in\b/.test(text) ||
    /\bdata-signin\b/.test(text)
  );
}

function scanForceAccountBeforeUse(files) {
  const out = [];
  for (const f of files) {
    if (/data-force-account/.test(f.text)) {
      out.push(hit(f.path, "account required before people can use the app"));
      continue;
    }
    if (!hasAccountChrome(f.text)) continue;
    if (/\bdata-no-guest\b/.test(f.text)) {
      out.push(hit(f.path, "account required before people can use the app"));
    }
  }
  return out;
}

function applyForceAccountBeforeUse(text) {
  return text.replace(/\s*data-force-account(?:="[^"]*")?/g, "");
}

function scanBuriedAccountDeletion(files) {
  const out = [];
  for (const f of files) {
    if (/data-buried-deletion/.test(f.text)) {
      out.push(hit(f.path, "account deletion buried in Privacy Policy or Terms"));
    }
  }
  return out;
}

function applyBuriedAccountDeletion(text) {
  return text.replace(/\s*data-buried-deletion(?:="[^"]*")?/g, "");
}

function scanPasscodeForAccountAuth(files) {
  const out = [];
  for (const f of files) {
    if (/data-passcode-auth/.test(f.text)) {
      out.push(hit(f.path, "passcode used for account authentication"));
      continue;
    }
    if (!hasAccountChrome(f.text)) continue;
    if (/\bpasscode\b/i.test(f.text)) {
      out.push(hit(f.path, "passcode used for account authentication"));
    }
  }
  return out;
}

function applyPasscodeForAccountAuth(text) {
  return text.replace(/\s*data-passcode-auth(?:="[^"]*")?/g, "");
}

function hasTabView(text) {
  return (
    /\bdata-tab-view\b/.test(text) ||
    /\bNSTabView\b/.test(text) ||
    ( /role=["']tablist["']/i.test(text) && /role=["']tabpanel["']/i.test(text) )
  );
}

function countTabViewTabs(text) {
  const roleTabs = (String(text).match(/role=["']tab["']/gi) || []).length;
  const items = (String(text).match(/\bNSTabViewItem\b/g) || []).length;
  return Math.max(roleTabs, items);
}

function scanPopupTabsSwitch(files) {
  const out = [];
  for (const f of files) {
    if (/data-popup-tabs/.test(f.text)) {
      out.push(hit(f.path, "pop-up button used to switch between tabs"));
    }
  }
  return out;
}

function applyPopupTabsSwitch(text) {
  return text.replace(/\s*data-popup-tabs(?:="[^"]*")?/g, "");
}

function scanMoreThanSixTabs(files) {
  const out = [];
  for (const f of files) {
    if (/data-too-many-tabs/.test(f.text)) {
      out.push(hit(f.path, "more than six tabs in a tab view"));
      continue;
    }
    if (!hasTabView(f.text)) continue;
    if (countTabViewTabs(f.text) > 6) {
      out.push(hit(f.path, "more than six tabs in a tab view"));
    }
  }
  return out;
}

function applyMoreThanSixTabs(text) {
  return text.replace(/\s*data-too-many-tabs(?:="[^"]*")?/g, "");
}

function scanCrossPaneControls(files) {
  const out = [];
  for (const f of files) {
    if (/data-cross-pane/.test(f.text)) {
      out.push(hit(f.path, "controls in a pane that affect content in another pane"));
    }
  }
  return out;
}

function applyCrossPaneControls(text) {
  return text.replace(/\s*data-cross-pane(?:="[^"]*")?/g, "");
}

function hasMultitask(text) {
  return (
    /\bdata-multitask\b/.test(text) ||
    /\brequestPictureInPicture\s*\(/.test(text) ||
    /\bAVPictureInPictureController\b/.test(text) ||
    /\bpictureInPictureEnabled\b/.test(text)
  );
}

function scanContinueWhenSwitchedAway(files) {
  const out = [];
  for (const f of files) {
    if (/data-no-pause-on-background/.test(f.text)) {
      out.push(hit(f.path, "attention-requiring activity that continues when people switch away"));
      continue;
    }
    if (!hasMultitask(f.text)) continue;
    if (/\bdata-keep-playing\b/.test(f.text)) {
      out.push(hit(f.path, "attention-requiring activity that continues when people switch away"));
    }
  }
  return out;
}

function applyContinueWhenSwitchedAway(text) {
  return text.replace(/\s*data-no-pause-on-background(?:="[^"]*")?/g, "");
}

function scanNotifyRoutineTask(files) {
  const out = [];
  for (const f of files) {
    if (/data-notify-routine/.test(f.text)) {
      out.push(hit(f.path, "a notification when a routine or secondary task completes"));
    }
  }
  return out;
}

function applyNotifyRoutineTask(text) {
  return text.replace(/\s*data-notify-routine(?:="[^"]*")?/g, "");
}

function scanIgnorePrimaryAudioInterrupt(files) {
  const out = [];
  for (const f of files) {
    if (/data-ignore-audio-interrupt/.test(f.text)) {
      out.push(hit(f.path, "audio that does not pause for a primary audio interruption"));
    }
  }
  return out;
}

function applyIgnorePrimaryAudioInterrupt(text) {
  return text.replace(/\s*data-ignore-audio-interrupt(?:="[^"]*")?/g, "");
}

function hasReviewPrompt(text) {
  return (
    /\bdata-rating-prompt\b/.test(text) ||
    /\bRequestReviewAction\b/.test(text) ||
    /\bSKStoreReviewController\b/.test(text) ||
    /\brequestReview\s*\(/.test(text)
  );
}

function countReviewRequests(text) {
  return (String(text).match(/\brequestReview\s*\(/g) || []).length;
}

function scanRatingOnFirstLaunch(files) {
  const out = [];
  for (const f of files) {
    if (/data-rating-first-launch/.test(f.text)) {
      out.push(hit(f.path, "a rating request on first launch or during onboarding"));
      continue;
    }
    if (!hasReviewPrompt(f.text)) continue;
    if (/\bdata-first-launch\b/.test(f.text)) {
      out.push(hit(f.path, "a rating request on first launch or during onboarding"));
    }
  }
  return out;
}

function applyRatingOnFirstLaunch(text) {
  return text.replace(/\s*data-rating-first-launch(?:="[^"]*")?/g, "");
}

function scanRatingInterruptsTask(files) {
  const out = [];
  for (const f of files) {
    if (/data-rating-interrupt/.test(f.text)) {
      out.push(hit(f.path, "a rating request that interrupts people while they perform a task"));
    }
  }
  return out;
}

function applyRatingInterruptsTask(text) {
  return text.replace(/\s*data-rating-interrupt(?:="[^"]*")?/g, "");
}

function scanPesterRatingRequests(files) {
  const out = [];
  for (const f of files) {
    if (/data-rating-pester/.test(f.text)) {
      out.push(hit(f.path, "repeated rating requests that pester people"));
      continue;
    }
    if (!hasReviewPrompt(f.text)) continue;
    if (countReviewRequests(f.text) > 1) {
      out.push(hit(f.path, "repeated rating requests that pester people"));
    }
  }
  return out;
}

function applyPesterRatingRequests(text) {
  return text.replace(/\s*data-rating-pester(?:="[^"]*")?/g, "");
}

function hasAppWindow(text) {
  return (
    /\bdata-window\b/.test(text) ||
    /\bdata-app-window\b/.test(text) ||
    /\bNSWindow\b/.test(text) ||
    /\bNSWindowController\b/.test(text) ||
    /\bopenWindow\s*\(/.test(text)
  );
}

function scanOpenWindowAsDefault(files) {
  const out = [];
  for (const f of files) {
    if (/data-open-window-default/.test(f.text)) {
      out.push(hit(f.path, "new windows opened as default behavior"));
    }
  }
  return out;
}

function applyOpenWindowAsDefault(text) {
  return text.replace(/\s*data-open-window-default(?:="[^"]*")?/g, "");
}

function scanCustomWindowFrame(files) {
  const out = [];
  for (const f of files) {
    if (/data-custom-window-frame/.test(f.text)) {
      out.push(hit(f.path, "custom window frames or controls that replace the system window"));
    }
  }
  return out;
}

function applyCustomWindowFrame(text) {
  return text.replace(/\s*data-custom-window-frame(?:="[^"]*")?/g, "");
}

function scanCallWindowScene(files) {
  const out = [];
  for (const f of files) {
    if (/data-call-scene/.test(f.text)) {
      out.push(hit(f.path, "a window called a scene in user-facing content"));
    }
  }
  return out;
}

function applyCallWindowScene(text) {
  return text.replace(/\s*data-call-scene(?:="[^"]*")?/g, "");
}

function hasCriticalWindowBottomBar(text) {
  if (!/<footer\b/i.test(text)) return false;
  return /\b(Save|Delete|Pay|Submit)\b/.test(text);
}

function scanCriticalWindowBottomBar(files) {
  const out = [];
  for (const f of files) {
    if (/data-critical-bottom-bar/.test(f.text)) {
      out.push(hit(f.path, "critical information or actions in a window bottom bar"));
      continue;
    }
    if (!hasAppWindow(f.text)) continue;
    if (hasCriticalWindowBottomBar(f.text)) {
      out.push(hit(f.path, "critical information or actions in a window bottom bar"));
    }
  }
  return out;
}

function applyCriticalWindowBottomBar(text) {
  return text.replace(/\s*data-critical-bottom-bar(?:="[^"]*")?/g, "");
}

function hasVideoPlayer(text) {
  return (
    /\bdata-video-player\b/.test(text) ||
    /\bAVPlayerViewController\b/.test(text) ||
    /\bAVPlayer\b/.test(text) ||
    /\bVideoPlayer\s*\(/.test(text) ||
    /<video\b/i.test(text)
  );
}

function scanCustomVideoPlayer(files) {
  const out = [];
  for (const f of files) {
    if (/data-custom-video-player/.test(f.text)) {
      out.push(hit(f.path, "a custom video player that diverges from the system player"));
    }
  }
  return out;
}

function applyCustomVideoPlayer(text) {
  return text.replace(/\s*data-custom-video-player(?:="[^"]*")?/g, "");
}

function scanLetterboxVideoPadding(files) {
  const out = [];
  for (const f of files) {
    if (/data-letterbox-padding/.test(f.text)) {
      out.push(hit(f.path, "video displayed with embedded letterbox or pillarbox padding"));
    }
  }
  return out;
}

function applyLetterboxVideoPadding(text) {
  return text.replace(/\s*data-letterbox-padding(?:="[^"]*")?/g, "");
}

function hasResumePlaybackPrompt(text) {
  return /Resume\s+(playback|watching|playing)\s*\?/i.test(text);
}

function scanAskResumePlayback(files) {
  const out = [];
  for (const f of files) {
    if (/data-resume-prompt/.test(f.text)) {
      out.push(hit(f.path, "asking people if they want to resume playback"));
      continue;
    }
    if (!hasVideoPlayer(f.text)) continue;
    if (hasResumePlaybackPrompt(f.text)) {
      out.push(hit(f.path, "asking people if they want to resume playback"));
    }
  }
  return out;
}

function applyAskResumePlayback(text) {
  return text.replace(/\s*data-resume-prompt(?:="[^"]*")?/g, "");
}

function scanVideoLoadingSplash(files) {
  const out = [];
  for (const f of files) {
    if (/data-video-loading-screen/.test(f.text)) {
      out.push(hit(f.path, "a loading or splash screen before video playback"));
    }
  }
  return out;
}

function applyVideoLoadingSplash(text) {
  return text.replace(/\s*data-video-loading-screen(?:="[^"]*")?/g, "");
}

function hasHaptic(text) {
  return (
    /\bdata-haptic\b/.test(text) ||
    /\bUIFeedbackGenerator\b/.test(text) ||
    /\bUIImpactFeedbackGenerator\b/.test(text) ||
    /\bUINotificationFeedbackGenerator\b/.test(text) ||
    /\bUISelectionFeedbackGenerator\b/.test(text) ||
    /\bCHHapticEngine\b/.test(text) ||
    /\bnavigator\.vibrate\s*\(/.test(text) ||
    /\bsensoryFeedback\b/.test(text)
  );
}

function scanHapticWrongMeaning(files) {
  const out = [];
  for (const f of files) {
    if (/data-haptic-wrong-meaning/.test(f.text)) {
      out.push(hit(f.path, "a system haptic pattern used to mean something else"));
    }
  }
  return out;
}

function applyHapticWrongMeaning(text) {
  return text.replace(/\s*data-haptic-wrong-meaning(?:="[^"]*")?/g, "");
}

function scanOverusedHaptics(files) {
  const out = [];
  for (const f of files) {
    if (/data-haptic-overuse/.test(f.text)) {
      out.push(hit(f.path, "overused haptics"));
    }
  }
  return out;
}

function applyOverusedHaptics(text) {
  return text.replace(/\s*data-haptic-overuse(?:="[^"]*")?/g, "");
}

function hasHapticMute(text) {
  return /haptic[s]?[^\n]{0,80}\b(off|mute|optional)\b/i.test(text);
}

function scanHapticNotOptional(files) {
  const out = [];
  for (const f of files) {
    if (/data-haptic-required/.test(f.text)) {
      out.push(hit(f.path, "haptics with no way to turn them off"));
      continue;
    }
    if (!hasHaptic(f.text)) continue;
    if (/\bnavigator\.vibrate\s*\(/.test(f.text) && !hasHapticMute(f.text)) {
      out.push(hit(f.path, "haptics with no way to turn them off"));
    }
  }
  return out;
}

function applyHapticNotOptional(text) {
  return text.replace(/\s*data-haptic-required(?:="[^"]*")?/g, "");
}

function hasAirplay(text) {
  return (
    /\bdata-airplay\b/.test(text) ||
    /\bAVRoutePickerView\b/.test(text) ||
    /\bAirPlayButton\b/.test(text) ||
    /\ballowsAirPlayVideo\b/.test(text) ||
    /\bisAirPlayVideoActive\b/.test(text) ||
    /\ballowsExternalPlayback\b/.test(text)
  );
}

function scanStopAirplayOnBackground(files) {
  const out = [];
  for (const f of files) {
    if (/data-airplay-stop-on-background/.test(f.text)) {
      out.push(
        hit(
          f.path,
          "airplay playback that stops when the app backgrounds or the device locks",
        ),
      );
    }
  }
  return out;
}

function applyStopAirplayOnBackground(text) {
  return text.replace(/\s*data-airplay-stop-on-background(?:="[^"]*")?/g, "");
}

function hasAutoplayVideo(text) {
  return /<video\b[^>]*\bautoPlay\b/i.test(text);
}

function scanInterruptOtherPlayback(files) {
  const out = [];
  for (const f of files) {
    if (/data-interrupt-airplay/.test(f.text)) {
      out.push(
        hit(f.path, "interrupting another app's playback with non-immersive content"),
      );
      continue;
    }
    if (!hasAirplay(f.text)) continue;
    if (hasAutoplayVideo(f.text)) {
      out.push(
        hit(f.path, "interrupting another app's playback with non-immersive content"),
      );
    }
  }
  return out;
}

function applyInterruptOtherPlayback(text) {
  return text.replace(/\s*data-interrupt-airplay(?:="[^"]*")?/g, "");
}

function scanAutoMirrorAirplay(files) {
  const out = [];
  for (const f of files) {
    if (/data-auto-mirror/.test(f.text)) {
      out.push(hit(f.path, "automatic mirroring without an explicit choice"));
    }
  }
  return out;
}

function applyAutoMirrorAirplay(text) {
  return text.replace(/\s*data-auto-mirror(?:="[^"]*")?/g, "");
}

function scanStreamBackgroundLoop(files) {
  const out = [];
  for (const f of files) {
    if (/data-airplay-background-loop/.test(f.text)) {
      out.push(hit(f.path, "streaming background loops or in-app-only clips"));
    }
  }
  return out;
}

function applyStreamBackgroundLoop(text) {
  return text.replace(/\s*data-airplay-background-loop(?:="[^"]*")?/g, "");
}

function hasGyro(text) {
  return (
    /\bdata-gyro\b/.test(text) ||
    /\bdata-accelerometer\b/.test(text) ||
    /\bDeviceMotionEvent\b/.test(text) ||
    /\bDeviceOrientationEvent\b/.test(text) ||
    /\bCMMotionManager\b/.test(text) ||
    /\bstartDeviceMotionUpdates\b/.test(text) ||
    /\bstartAccelerometerUpdates\b/.test(text) ||
    /\bstartGyroUpdates\b/.test(text)
  );
}

function scanMotionWithoutBenefit(files) {
  const out = [];
  for (const f of files) {
    if (/data-motion-no-benefit/.test(f.text)) {
      out.push(hit(f.path, "motion data gathered with no tangible benefit"));
    }
  }
  return out;
}

function applyMotionWithoutBenefit(text) {
  return text.replace(/\s*data-motion-no-benefit(?:="[^"]*")?/g, "");
}

function hasGameplay(text) {
  return /\bgameplay\b/i.test(text);
}

function hasMotionListener(text) {
  return /\bdevicemotion\b/i.test(text) || /\bdeviceorientation\b/i.test(text);
}

function scanMotionDirectUi(files) {
  const out = [];
  for (const f of files) {
    if (/data-motion-direct-ui/.test(f.text)) {
      out.push(
        hit(
          f.path,
          "accelerometer or gyroscope used to directly manipulate the interface outside of active gameplay",
        ),
      );
      continue;
    }
    if (!hasGyro(f.text)) continue;
    if (hasMotionListener(f.text) && !hasGameplay(f.text)) {
      out.push(
        hit(
          f.path,
          "accelerometer or gyroscope used to directly manipulate the interface outside of active gameplay",
        ),
      );
    }
  }
  return out;
}

function applyMotionDirectUi(text) {
  return text.replace(/\s*data-motion-direct-ui(?:="[^"]*")?/g, "");
}

function hasQuickAction(text) {
  return (
    /\bdata-quick-action\b/.test(text) ||
    /\bUIApplicationShortcutItem\b/.test(text) ||
    /\bUIMutableApplicationShortcutItem\b/.test(text) ||
    /\bUIApplicationShortcutItems\b/.test(text)
  );
}

function scanQuickActionAppName(files) {
  const out = [];
  for (const f of files) {
    if (/data-quick-action-app-name/.test(f.text)) {
      out.push(
        hit(f.path, "app name or extra copy in a home screen quick-action title"),
      );
    }
  }
  return out;
}

function applyQuickActionAppName(text) {
  return text.replace(/\s*data-quick-action-app-name(?:="[^"]*")?/g, "");
}

function hasQuickActionEmoji(text) {
  return /\p{Extended_Pictographic}/u.test(text);
}

function scanQuickActionEmoji(files) {
  const out = [];
  for (const f of files) {
    if (/data-quick-action-emoji/.test(f.text)) {
      out.push(
        hit(f.path, "an emoji used in place of a home screen quick-action symbol"),
      );
      continue;
    }
    if (!hasQuickAction(f.text)) continue;
    if (hasQuickActionEmoji(f.text)) {
      out.push(
        hit(f.path, "an emoji used in place of a home screen quick-action symbol"),
      );
    }
  }
  return out;
}

function applyQuickActionEmoji(text) {
  return text.replace(/\s*data-quick-action-emoji(?:="[^"]*")?/g, "");
}

function hasLiveViewing(text) {
  return /\bdata-live-viewing\b/.test(text);
}

function hasVodCopy(text) {
  return (
    /\bVOD\b/.test(text) ||
    /video-on-demand/i.test(text) ||
    /\bon[\s-]demand\b/i.test(text)
  );
}

function hasLiveBadge(text) {
  return (
    /\bdata-live-badge\b/.test(text) ||
    />\s*Live\s*</.test(text) ||
    /aria-label=["']Live["']/i.test(text) ||
    /\blive-badge\b/i.test(text)
  );
}

function scanLiveUnmarkedVod(files) {
  const out = [];
  for (const f of files) {
    if (/data-live-unmarked/.test(f.text)) {
      out.push(
        hit(f.path, "live content that is not distinguished from video-on-demand"),
      );
      continue;
    }
    if (!hasLiveViewing(f.text)) continue;
    if (hasVodCopy(f.text) && !hasLiveBadge(f.text)) {
      out.push(
        hit(f.path, "live content that is not distinguished from video-on-demand"),
      );
    }
  }
  return out;
}

function applyLiveUnmarkedVod(text) {
  return text.replace(/\s*data-live-unmarked(?:="[^"]*")?/g, "");
}

function scanLiveAudioAfterLeave(files) {
  const out = [];
  for (const f of files) {
    if (/data-live-audio-after-leave/.test(f.text)) {
      out.push(hit(f.path, "audio that continues after leaving the live tab"));
    }
  }
  return out;
}

function applyLiveAudioAfterLeave(text) {
  return text.replace(/\s*data-live-audio-after-leave(?:="[^"]*")?/g, "");
}

function hasSnippet(text) {
  return (
    /\bdata-snippet\b/.test(text) ||
    /\bSnippetIntent\b/.test(text) ||
    /\bInteractiveSnippetIntent\b/.test(text)
  );
}

function scanSnippetDialogueText(files) {
  const out = [];
  for (const f of files) {
    if (/data-snippet-dialogue/.test(f.text)) {
      out.push(hit(f.path, "spoken dialogue text used to convey a snippet's purpose"));
    }
  }
  return out;
}

function applySnippetDialogueText(text) {
  return text.replace(/\s*data-snippet-dialogue(?:="[^"]*")?/g, "");
}

function snippetHeightHits(text) {
  const re =
    /(?:minHeight|min-height|height)\s*[:=]\s*["']?(\d+)/gi;
  let m;
  while ((m = re.exec(text))) {
    if (Number(m[1]) >= 400) return true;
  }
  const bracket = /h-\[(\d+)px\]/gi;
  while ((m = bracket.exec(text))) {
    if (Number(m[1]) >= 400) return true;
  }
  return false;
}

function scanSnippetTooTall(files) {
  const out = [];
  for (const f of files) {
    if (/data-snippet-too-tall/.test(f.text)) {
      out.push(hit(f.path, "a snippet custom view taller than 400 points"));
      continue;
    }
    if (!hasSnippet(f.text)) continue;
    if (snippetHeightHits(f.text)) {
      out.push(hit(f.path, "a snippet custom view taller than 400 points"));
    }
  }
  return out;
}

function applySnippetTooTall(text) {
  return text.replace(/\s*data-snippet-too-tall(?:="[^"]*")?/g, "");
}

function hasGenai(text) {
  return (
    /\bdata-generative\b/.test(text) ||
    /\bdata-genai\b/.test(text) ||
    /\bLanguageModelSession\b/.test(text) ||
    /\bSystemLanguageModel\b/.test(text) ||
    /\bImagePlaygroundView\b/.test(text) ||
    /\bFoundationModels\b/.test(text)
  );
}

function hasHumanAuthoredClaim(text) {
  return (
    /\bas a human\b/i.test(text) ||
    /\bauthored by a human\b/i.test(text) ||
    /\bwritten by a human\b/i.test(text) ||
    /\bhuman-authored\b/i.test(text)
  );
}

function hasAiDisclosure(text) {
  return (
    /\bAI-generated\b/i.test(text) ||
    /\bgenerated by AI\b/i.test(text) ||
    /\bdata-ai-disclosure\b/.test(text)
  );
}

function scanAiAsHuman(files) {
  const out = [];
  for (const f of files) {
    if (/data-ai-as-human/.test(f.text)) {
      out.push(hit(f.path, "ai content presented as human-authored"));
      continue;
    }
    if (!hasGenai(f.text)) continue;
    if (hasHumanAuthoredClaim(f.text) && !hasAiDisclosure(f.text)) {
      out.push(hit(f.path, "ai content presented as human-authored"));
    }
  }
  return out;
}

function applyAiAsHuman(text) {
  return text.replace(/\s*data-ai-as-human(?:="[^"]*")?/g, "");
}

function scanGenaiNoRevert(files) {
  const out = [];
  for (const f of files) {
    if (/data-genai-no-revert/.test(f.text)) {
      out.push(
        hit(f.path, "generated content with no way to dismiss, revert, or retry"),
      );
    }
  }
  return out;
}

function applyGenaiNoRevert(text) {
  return text.replace(/\s*data-genai-no-revert(?:="[^"]*")?/g, "");
}

function hasAlwaysOn(text) {
  return (
    /\bdata-always-on\b/.test(text) ||
    /\bisLuminanceReduced\b/.test(text) ||
    /\bWKSupportsAlwaysOnDisplay\b/.test(text) ||
    /\bsupportsAlwaysOnDisplay\b/.test(text)
  );
}

function hasSensitiveAlwaysOnCopy(text) {
  return (
    /\bbank\b/i.test(text) ||
    /\bbalance\b/i.test(text) ||
    /\bhealth\b/i.test(text) ||
    /\bheart rate\b/i.test(text) ||
    /\bpassword\b/i.test(text) ||
    /\bSSN\b/.test(text) ||
    /\bsocial security\b/i.test(text)
  );
}

function hasAlwaysOnRedaction(text) {
  return (
    /\bdata-redacted\b/.test(text) ||
    /\bprivacySensitive\b/.test(text) ||
    /\.redacted\s*\(/.test(text) ||
    /\bredacted\s*\(/.test(text)
  );
}

function scanAlwaysOnSensitive(files) {
  const out = [];
  for (const f of files) {
    if (/data-always-on-sensitive/.test(f.text)) {
      out.push(hit(f.path, "sensitive information left visible"));
      continue;
    }
    if (!hasAlwaysOn(f.text)) continue;
    if (hasSensitiveAlwaysOnCopy(f.text) && !hasAlwaysOnRedaction(f.text)) {
      out.push(hit(f.path, "sensitive information left visible"));
    }
  }
  return out;
}

function applyAlwaysOnSensitive(text) {
  return text.replace(/\s*data-always-on-sensitive(?:="[^"]*")?/g, "");
}

function scanAlwaysOnStopMotion(files) {
  const out = [];
  for (const f of files) {
    if (/data-always-on-stop-motion/.test(f.text)) {
      out.push(hit(f.path, "motion that stops instantly when always on begins"));
    }
  }
  return out;
}

function applyAlwaysOnStopMotion(text) {
  return text.replace(/\s*data-always-on-stop-motion(?:="[^"]*")?/g, "");
}

function scanMultiplePrimaries(files) {
  const out = [];
  for (const f of files) {
    if (countSubmitButtons(f.text) >= 2) {
      out.push(hit(f.path, "multiple primary actions in one region"));
      continue;
    }
    const primaries = f.text.match(/class(Name)?=["'][^"']*\bprimary\b/g) || [];
    if (primaries.length >= 2) {
      out.push(hit(f.path, "multiple primary actions in one region"));
    }
  }
  return out;
}

function scanHeuristic(id, files) {
  switch (id) {
    case "hero-type-in-lists":
      return scanHeroType(files);
    case "all-caps-long-labels":
      return scanAllCaps(files);
    case "too-many-font-families":
      return scanFontFamilies(files);
    case "rainbow-nav-accents":
      return scanRainbow(files);
    case "muted-only-labels":
      return scanMutedLabels(files);
    case "glass-tints-on-chrome":
      return scanGlass(files);
    case "hard-black-white-chrome":
      return scanBlackWhiteChrome(files);
    case "color-only-error-or-selected":
      return scanColorOnly(files);
    case "bounce-on-appear":
      return scanBounce(files);
    case "locked-out-during-motion":
      return scanLockedOut(files);
    case "motion-without-reduce":
      return scanReduceMotion(files);
    case "placeholder-only-label":
      return scanPlaceholder(files);
    case "tiny-critical-type":
      return scanTinyCritical(files);
    case "color-only-error":
      return scanColorOnly(files);
    case "hide-only-path-behind-search":
      return scanHideOnlySearch(files);
    case "spinner-per-keystroke":
      return scanSearchSpinner(files);
    case "search-as-settings-dump":
      return scanSearchDump(files);
    case "sarcastic-error-hides-fix":
      return scanSarcasticError(files);
    case "title-case-long-help":
      return scanTitleCaseHelp(files);
    case "rewrite-system-alerts":
      return scanRewriteSystemAlerts(files);
    case "dark-pattern-allow-only":
      return scanDarkPatternAllow(files);
    case "preemptive-permission-on-marketing":
      return scanPreemptiveMarketing(files);
    case "rewrite-or-automate-system-ui":
      return scanRewriteOrAutomate(files);
    case "opaque-brand-bar-fills":
      return scanOpaqueBrandBars(files);
    case "watermarks-on-content":
      return scanWatermarks(files);
    case "brand-outlined-sf-rewrite":
      return scanBrandOutlinedSymbols(files);
    case "sf-symbol-name-tables":
      return scanSfSymbolTables(files);
    case "outlined-doodles-in-toolbar":
      return scanBrandOutlinedSymbols(files);
    case "decorative-icon-duplicates-label":
      return scanDecorativeDuplicate(files);
    case "screenshot-empty-state":
      return scanScreenshotEmpty(files);
    case "bitmap-sf-symbols":
      return scanBitmapSf(files);
    case "copied-scale-factor-tables":
      return scanScaleTables(files);
    case "icon-composer-templates-as-law":
      return scanIconComposerLaw(files);
    case "busy-photo-app-icon":
      return scanBusyAppIcon(files);
    case "app-icon-alpha-mask-tricks":
      return scanAppIconAlpha(files);
    case "tokenizing-diversity-stock":
      return scanDiversityStock(files);
    case "ability-body-jokes-empty":
      return scanAbilityJokes(files);
    case "locked-skin-tone-defaults":
      return scanLockedSkin(files);
    case "settings-required-for-first-run":
      return scanSettingsFirstRun(files);
    case "nested-prefs-no-grouping":
      return scanNestedPrefs(files);
    case "retheme-system-settings":
      return scanRethemeSettings(files);
    case "confirm-every-delete-with-undo":
      return scanConfirmEveryDelete(files);
    case "silent-nav-data-loss":
      return scanSilentNavLoss(files);
    case "spinner-loop-no-way-out":
      return scanSpinnerNoWayOut(files);
    case "fake-percent-progress":
      return scanFakePercent(files);
    case "loading-modal-hides-nav":
      return scanLoadingModalHidesNav(files);
    case "modal-success-after-save":
      return scanModalSuccess(files);
    case "error-toast-disappears":
      return scanErrorToast(files);
    case "confetti-on-crud":
      return scanConfettiCrud(files);
    case "account-wall-before-value":
      return scanAccountWall(files);
    case "every-permission-on-page-one":
      return scanEveryPermissionPageOne(files);
    case "help-as-six-interstitials":
      return scanHelpInterstitials(files);
    case "first-launch-notification-wall":
      return scanNotificationWall(files);
    case "marketing-as-time-sensitive":
      return scanMarketingTimeSensitive(files);
    case "custom-lock-screen-ui":
      return scanCustomLockScreen(files);
    case "hidden-drag-no-alternative":
      return scanHiddenDrag(files);
    case "drop-navigates-without-preview":
      return scanDropNavigates(files);
    case "fight-split-view-drops":
      return scanFightSplitDrops(files);
    case "animated-splash-after-launch":
      return scanAnimatedSplash(files);
    case "video-sound-on-launch":
      return scanLaunchMedia(files);
    case "launch-compatibility-brand-bars":
      return scanLaunchBrandBars(files);
    case "dashboard-card-grid-home":
      return scanDashboardCardGrid(files);
    case "list-pane-min-width-steals-detail":
      return scanListPaneMinWidth(files);
    case "relative-bottom-nav-scrolls-away":
      return scanRelativeBottomNav(files);
    case "opaque-nav-bar-fills":
      return scanOpaqueBrandBars(files);
    case "teach-compatibility-look":
      return scanCompatibilityLook(files);
    case "stacked-translucent-layers":
      return scanStackedTranslucent(files);
    case "card-grids-as-master-list":
      return scanCardGridMasterList(files);
    case "cta-only-in-list-toolbar":
      return scanCtaOnlyListToolbar(files);
    case "equal-weight-submits":
      return scanEqualWeightSubmits(files);
    case "marketing-landing-tab-shell":
      return scanMarketingTabShell(files);
    case "hide-unavailable-menu-items":
      return scanHiddenMenuItems(files);
    case "nested-submenus-deep":
      return scanNestedSubmenus(files);
    case "mix-menu-icons":
      return scanMixMenuIcons(files);
    case "picker-owns-the-screen":
      return scanPickerScreen(files);
    case "stepper-no-neighbouring-value":
      return scanStepperNoValue(files);
    case "overweight-wheel-short-list":
      return scanOverweightWheel(files);
    case "morph-circular-bar":
      return scanMorphProgress(files);
    case "jump-progress-ninety":
      return scanJumpNinety(files);
    case "pull-down-to-refresh-title":
      return scanPullDownRefreshTitle(files);
    case "ok-instead-of-verb":
      return scanOkInsteadOfVerb(files);
    case "toggle-navigates-or-submits":
      return scanToggleNavigates(files);
    case "multiple-primaries-one-region":
      return scanMultiplePrimaries(files);
    case "fake-in-app-widget":
      return scanFakeInAppWidget(files);
    case "stretch-small-widget-large":
      return scanStretchSmallWidget(files);
    case "app-icon-as-widget":
      return scanAppIconAsWidget(files);
    case "point-at-dynamic-island":
      return scanPointAtIsland(files);
    case "live-activity-full-app-icon":
      return scanLiveActivityAppIcon(files);
    case "live-activity-ads":
      return scanLiveActivityAds(files);
    case "status-bar-always-hidden":
      return scanStatusBarHidden(files);
    case "fake-status-clock":
      return scanFakeStatusClock(files);
    case "opaque-status-strip":
      return scanOpaqueStatusStrip(files);
    case "settings-row-as-control-center":
      return scanSettingsAsControlCenter(files);
    case "control-toggle-one-symbol":
      return scanControlToggleOneSymbol(files);
    case "locked-control-unredacted":
      return scanLockedControlUnredacted(files);
    case "scalex-whole-window":
      return scanScaleXWholeWindow(files);
    case "physical-margin-padding":
      return scanPhysicalMarginPadding(files);
    case "back-chevron-always-left":
      return scanBackChevronAlwaysLeft(files);
    case "dir-auto-on-locale-root":
      return scanDirAutoOnLocaleRoot(files);
    case "nested-modal-stacks":
      return scanNestedModalStacks(files);
    case "slider-as-volume":
      return scanSliderAsVolume(files);
    case "nested-same-axis-scroll":
      return scanNestedSameAxisScroll(files);
    case "cascade-popover":
      return scanCascadePopover(files);
    case "popover-as-warning":
      return scanPopoverAsWarning(files);
    case "popover-on-compact":
      return scanPopoverOnCompact(files);
    case "custom-collection-layout":
      return scanCustomCollectionLayout(files);
    case "text-collection-as-table":
      return scanTextCollectionAsTable(files);
    case "overlapping-collection-items":
      return scanOverlappingCollectionItems(files);
    case "page-control-as-hierarchy":
      return scanPageControlAsHierarchy(files);
    case "too-many-page-dots":
      return scanTooManyPageDots(files);
    case "too-many-page-indicator-images":
      return scanTooManyPageIndicatorImages(files);
    case "colored-page-indicators":
      return scanColoredPageIndicators(files);
    case "editable-label":
      return scanEditableLabel(files);
    case "long-label-as-text-view":
      return scanLongLabelAsTextView(files);
    case "unselectable-useful-label":
      return scanUnselectableUsefulLabel(files);
    case "short-text-as-field":
      return scanShortTextAsField(files);
    case "unselectable-useful-text-view":
      return scanUnselectableUsefulTextView(files);
    case "image-view-as-button":
      return scanImageViewAsButton(files);
    case "image-view-as-icon":
      return scanImageViewAsIcon(files);
    case "text-overlay-on-image-view":
      return scanTextOverlayOnImageView(files);
    case "color-only-chart-series":
      return scanColorOnlyChartSeries(files);
    case "chart-critical-behind-interaction":
      return scanChartCriticalBehindInteraction(files);
    case "chart-as-table":
      return scanChartAsTable(files);
    case "overcrowded-chart":
      return scanOvercrowdedChart(files);
    case "extra-disclosure-button":
      return scanExtraDisclosureButton(files);
    case "unlabeled-disclosure-triangle":
      return scanUnlabeledDisclosureTriangle(files);
    case "advanced-details-unhidden":
      return scanAdvancedDetailsUnhidden(files);
    case "nested-boxes":
      return scanNestedBoxes(files);
    case "oversized-box":
      return scanOversizedBox(files);
    case "custom-edit-menu":
      return scanCustomEditMenu(files);
    case "inapplicable-edit-commands":
      return scanInapplicableEditCommands(files);
    case "redundant-edit-controls":
      return scanRedundantEditControls(files);
    case "wrong-platform-help":
      return scanWrongPlatformHelp(files);
    case "standard-component-help":
      return scanStandardComponentHelp(files);
    case "promotional-tip":
      return scanPromotionalTip(files);
    case "missing-web-view-back-forward":
      return scanMissingWebViewBackForward(files);
    case "safari-replica-web-view":
      return scanSafariReplicaWebView(files);
    case "duplicate-activity-actions":
      return scanDuplicateActivityActions(files);
    case "alternative-activity-reveal":
      return scanAlternativeActivityReveal(files);
    case "print-when-nothing-printable":
      return scanPrintWhenNothingPrintable(files);
    case "duplicate-page-orientation":
      return scanDuplicatePageOrientation(files);
    case "programmatic-fullscreen-resize":
      return scanProgrammaticFullscreenResize(files);
    case "auto-exit-fullscreen":
      return scanAutoExitFullscreen(files);
    case "custom-window-mode-menu":
      return scanCustomWindowModeMenu(files);
    case "custom-file-toolbar":
      return scanCustomFileToolbar(files);
    case "extensions-shown-by-default":
      return scanExtensionsShownByDefault(files);
    case "explicit-save-required":
      return scanExplicitSaveRequired(files);
    case "steal-focus":
      return scanStealFocus(files);
    case "custom-focus-effect":
      return scanCustomFocusEffect(files);
    case "force-account-before-use":
      return scanForceAccountBeforeUse(files);
    case "buried-account-deletion":
      return scanBuriedAccountDeletion(files);
    case "passcode-for-account-auth":
      return scanPasscodeForAccountAuth(files);
    case "popup-tabs-switch":
      return scanPopupTabsSwitch(files);
    case "more-than-six-tabs":
      return scanMoreThanSixTabs(files);
    case "cross-pane-controls":
      return scanCrossPaneControls(files);
    case "continue-when-switched-away":
      return scanContinueWhenSwitchedAway(files);
    case "notify-routine-task":
      return scanNotifyRoutineTask(files);
    case "ignore-primary-audio-interrupt":
      return scanIgnorePrimaryAudioInterrupt(files);
    case "rating-on-first-launch":
      return scanRatingOnFirstLaunch(files);
    case "rating-interrupts-task":
      return scanRatingInterruptsTask(files);
    case "pester-rating-requests":
      return scanPesterRatingRequests(files);
    case "open-window-as-default":
      return scanOpenWindowAsDefault(files);
    case "custom-window-frame":
      return scanCustomWindowFrame(files);
    case "call-window-scene":
      return scanCallWindowScene(files);
    case "critical-window-bottom-bar":
      return scanCriticalWindowBottomBar(files);
    case "custom-video-player":
      return scanCustomVideoPlayer(files);
    case "letterbox-video-padding":
      return scanLetterboxVideoPadding(files);
    case "ask-resume-playback":
      return scanAskResumePlayback(files);
    case "video-loading-splash":
      return scanVideoLoadingSplash(files);
    case "haptic-wrong-meaning":
      return scanHapticWrongMeaning(files);
    case "overused-haptics":
      return scanOverusedHaptics(files);
    case "haptic-not-optional":
      return scanHapticNotOptional(files);
    case "stop-airplay-on-background":
      return scanStopAirplayOnBackground(files);
    case "interrupt-other-playback":
      return scanInterruptOtherPlayback(files);
    case "auto-mirror-airplay":
      return scanAutoMirrorAirplay(files);
    case "stream-background-loop":
      return scanStreamBackgroundLoop(files);
    case "motion-without-benefit":
      return scanMotionWithoutBenefit(files);
    case "motion-direct-ui":
      return scanMotionDirectUi(files);
    case "quick-action-app-name":
      return scanQuickActionAppName(files);
    case "quick-action-emoji":
      return scanQuickActionEmoji(files);
    case "live-unmarked-vod":
      return scanLiveUnmarkedVod(files);
    case "live-audio-after-leave":
      return scanLiveAudioAfterLeave(files);
    case "snippet-dialogue-text":
      return scanSnippetDialogueText(files);
    case "snippet-too-tall":
      return scanSnippetTooTall(files);
    case "ai-as-human":
      return scanAiAsHuman(files);
    case "genai-no-revert":
      return scanGenaiNoRevert(files);
    case "always-on-sensitive":
      return scanAlwaysOnSensitive(files);
    case "always-on-stop-motion":
      return scanAlwaysOnStopMotion(files);
    default: {
      const _exhaustive = id;
      void _exhaustive;
      return [hit("", `no scanner for ${id}`)];
    }
  }
}

function applyHeuristic(id, file) {
  switch (id) {
    case "hero-type-in-lists":
      return applyHeroType(file.text);
    case "all-caps-long-labels":
      return applyAllCaps(file.text);
    case "too-many-font-families":
      return file.text;
    case "rainbow-nav-accents":
      return file.text;
    case "muted-only-labels":
      return applyMutedLabels(file.text);
    case "glass-tints-on-chrome":
      return applyGlass(file.text);
    case "hard-black-white-chrome":
      return applyBlackWhiteChrome(file.text);
    case "color-only-error-or-selected":
      return applyColorOnly(file.text);
    case "bounce-on-appear":
      return applyBounce(file.text);
    case "locked-out-during-motion":
      return applyLockedOut(file.text);
    case "motion-without-reduce":
      return applyReduceMotion(file.text, file);
    case "placeholder-only-label":
      return applyPlaceholder(file.text);
    case "tiny-critical-type":
      return applyTinyCritical(file.text);
    case "color-only-error":
      return applyColorOnly(file.text);
    case "hide-only-path-behind-search":
      return file.text;
    case "spinner-per-keystroke":
      return applySearchSpinner(file.text);
    case "search-as-settings-dump":
      return file.text;
    case "sarcastic-error-hides-fix":
      return file.text;
    case "title-case-long-help":
      return applyTitleCaseHelp(file.text);
    case "rewrite-system-alerts":
      return file.text;
    case "dark-pattern-allow-only":
      return applyDarkPatternAllow(file.text);
    case "preemptive-permission-on-marketing":
      return file.text;
    case "rewrite-or-automate-system-ui":
      return file.text;
    case "opaque-brand-bar-fills":
      return applyOpaqueBrandBars(file.text);
    case "watermarks-on-content":
      return applyWatermarks(file.text);
    case "brand-outlined-sf-rewrite":
      return file.text;
    case "sf-symbol-name-tables":
      return file.text;
    case "outlined-doodles-in-toolbar":
      return file.text;
    case "decorative-icon-duplicates-label":
      return applyDecorativeDuplicate(file.text);
    case "screenshot-empty-state":
      return applyScreenshotEmpty(file.text);
    case "bitmap-sf-symbols":
      return file.text;
    case "copied-scale-factor-tables":
      return file.text;
    case "icon-composer-templates-as-law":
      return file.text;
    case "busy-photo-app-icon":
      return file.text;
    case "app-icon-alpha-mask-tricks":
      return applyAppIconAlpha(file.text);
    case "tokenizing-diversity-stock":
      return file.text;
    case "ability-body-jokes-empty":
      return file.text;
    case "locked-skin-tone-defaults":
      return file.text;
    case "settings-required-for-first-run":
      return file.text;
    case "nested-prefs-no-grouping":
      return file.text;
    case "retheme-system-settings":
      return applyRethemeSettings(file.text);
    case "confirm-every-delete-with-undo":
      return file.text;
    case "silent-nav-data-loss":
      return file.text;
    case "spinner-loop-no-way-out":
      return file.text;
    case "fake-percent-progress":
      return file.text;
    case "loading-modal-hides-nav":
      return file.text;
    case "modal-success-after-save":
      return file.text;
    case "error-toast-disappears":
      return file.text;
    case "confetti-on-crud":
      return applyConfettiCrud(file.text);
    case "account-wall-before-value":
      return file.text;
    case "every-permission-on-page-one":
      return file.text;
    case "help-as-six-interstitials":
      return file.text;
    case "first-launch-notification-wall":
      return file.text;
    case "marketing-as-time-sensitive":
      return file.text;
    case "custom-lock-screen-ui":
      return file.text;
    case "hidden-drag-no-alternative":
      return file.text;
    case "drop-navigates-without-preview":
      return file.text;
    case "fight-split-view-drops":
      return file.text;
    case "animated-splash-after-launch":
      return file.text;
    case "video-sound-on-launch":
      return applyLaunchMedia(file.text, file);
    case "launch-compatibility-brand-bars":
      return file.text;
    case "dashboard-card-grid-home":
      return applyChromeRecipe("chrome.layout.card-grid-home", file);
    case "list-pane-min-width-steals-detail":
      return applyListPaneMinWidth(file.text);
    case "relative-bottom-nav-scrolls-away":
      return applyRelativeBottomNav(file.text);
    case "opaque-nav-bar-fills":
      return applyOpaqueBrandBars(file.text);
    case "teach-compatibility-look":
      return applyCompatibilityLook(file.text);
    case "stacked-translucent-layers":
      return applyStackedTranslucent(file);
    case "card-grids-as-master-list":
      return applyCardGridMasterList(file.text);
    case "cta-only-in-list-toolbar":
      return applyCtaOnlyListToolbar(file.text);
    case "equal-weight-submits":
      return applyEqualWeightSubmits(file.text);
    case "marketing-landing-tab-shell":
      return applyMarketingTabShell(file.text, file);
    case "hide-unavailable-menu-items":
      return applyHiddenMenuItems(file.text);
    case "nested-submenus-deep":
      return file.text;
    case "mix-menu-icons":
      return file.text;
    case "picker-owns-the-screen":
      return file.text;
    case "stepper-no-neighbouring-value":
      return file.text;
    case "overweight-wheel-short-list":
      return applyOverweightWheel(file.text, file);
    case "morph-circular-bar":
      return applyMorphProgress(file.text);
    case "jump-progress-ninety":
      return applyJumpNinety(file.text);
    case "pull-down-to-refresh-title":
      return applyPullDownRefreshTitle(file.text);
    case "ok-instead-of-verb":
      return applyOkInsteadOfVerb(file.text);
    case "toggle-navigates-or-submits":
      return applyToggleNavigates(file.text);
    case "multiple-primaries-one-region":
      return applyEqualWeightSubmits(file.text);
    case "fake-in-app-widget":
      return applyFakeInAppWidget(file.text, file);
    case "stretch-small-widget-large":
      return applyStretchSmallWidget(file.text);
    case "app-icon-as-widget":
      return file.text;
    case "point-at-dynamic-island":
      return applyPointAtIsland(file.text);
    case "live-activity-full-app-icon":
      return applyLiveActivityAppIcon(file.text, file);
    case "live-activity-ads":
      return applyLiveActivityAds(file.text);
    case "status-bar-always-hidden":
      return applyStatusBarHidden(file.text);
    case "fake-status-clock":
      return applyFakeStatusClock(file.text);
    case "opaque-status-strip":
      return applyOpaqueStatusStrip(file.text);
    case "settings-row-as-control-center":
      return applySettingsAsControlCenter(file.text);
    case "control-toggle-one-symbol":
      return file.text;
    case "locked-control-unredacted":
      return file.text;
    case "scalex-whole-window":
      return applyScaleXWholeWindow(file.text);
    case "physical-margin-padding":
      return applyPhysicalMarginPadding(file.text);
    case "back-chevron-always-left":
      return applyBackChevronAlwaysLeft(file.text);
    case "dir-auto-on-locale-root":
      return applyDirAutoOnLocaleRoot(file.text);
    case "nested-modal-stacks":
      return applyNestedModalStacks(file.text);
    case "slider-as-volume":
      return applySliderAsVolume(file.text);
    case "nested-same-axis-scroll":
      return applyNestedSameAxisScroll(file.text);
    case "cascade-popover":
      return applyCascadePopover(file.text);
    case "popover-as-warning":
      return applyPopoverAsWarning(file.text);
    case "popover-on-compact":
      return applyPopoverOnCompact(file.text);
    case "custom-collection-layout":
      return applyCustomCollectionLayout(file.text);
    case "text-collection-as-table":
      return applyTextCollectionAsTable(file.text);
    case "overlapping-collection-items":
      return applyOverlappingCollectionItems(file.text);
    case "page-control-as-hierarchy":
      return applyPageControlAsHierarchy(file.text);
    case "too-many-page-dots":
      return applyTooManyPageDots(file.text);
    case "too-many-page-indicator-images":
      return applyTooManyPageIndicatorImages(file.text);
    case "colored-page-indicators":
      return applyColoredPageIndicators(file.text);
    case "editable-label":
      return applyEditableLabel(file.text);
    case "long-label-as-text-view":
      return applyLongLabelAsTextView(file.text);
    case "unselectable-useful-label":
      return applyUnselectableUsefulLabel(file.text);
    case "short-text-as-field":
      return applyShortTextAsField(file.text);
    case "unselectable-useful-text-view":
      return applyUnselectableUsefulTextView(file.text);
    case "image-view-as-button":
      return applyImageViewAsButton(file.text);
    case "image-view-as-icon":
      return applyImageViewAsIcon(file.text);
    case "text-overlay-on-image-view":
      return applyTextOverlayOnImageView(file.text);
    case "color-only-chart-series":
      return applyColorOnlyChartSeries(file.text);
    case "chart-critical-behind-interaction":
      return applyChartCriticalBehindInteraction(file.text);
    case "chart-as-table":
      return applyChartAsTable(file.text);
    case "overcrowded-chart":
      return applyOvercrowdedChart(file.text);
    case "extra-disclosure-button":
      return applyExtraDisclosureButton(file.text);
    case "unlabeled-disclosure-triangle":
      return applyUnlabeledDisclosureTriangle(file.text);
    case "advanced-details-unhidden":
      return applyAdvancedDetailsUnhidden(file.text);
    case "nested-boxes":
      return applyNestedBoxes(file.text);
    case "oversized-box":
      return applyOversizedBox(file.text);
    case "custom-edit-menu":
      return applyCustomEditMenu(file.text);
    case "inapplicable-edit-commands":
      return applyInapplicableEditCommands(file.text);
    case "redundant-edit-controls":
      return applyRedundantEditControls(file.text);
    case "wrong-platform-help":
      return applyWrongPlatformHelp(file.text);
    case "standard-component-help":
      return applyStandardComponentHelp(file.text);
    case "promotional-tip":
      return applyPromotionalTip(file.text);
    case "missing-web-view-back-forward":
      return applyMissingWebViewBackForward(file.text);
    case "safari-replica-web-view":
      return applySafariReplicaWebView(file.text);
    case "duplicate-activity-actions":
      return applyDuplicateActivityActions(file.text);
    case "alternative-activity-reveal":
      return applyAlternativeActivityReveal(file.text);
    case "print-when-nothing-printable":
      return applyPrintWhenNothingPrintable(file.text);
    case "duplicate-page-orientation":
      return applyDuplicatePageOrientation(file.text);
    case "programmatic-fullscreen-resize":
      return applyProgrammaticFullscreenResize(file.text);
    case "auto-exit-fullscreen":
      return applyAutoExitFullscreen(file.text);
    case "custom-window-mode-menu":
      return applyCustomWindowModeMenu(file.text);
    case "custom-file-toolbar":
      return applyCustomFileToolbar(file.text);
    case "extensions-shown-by-default":
      return applyExtensionsShownByDefault(file.text);
    case "explicit-save-required":
      return applyExplicitSaveRequired(file.text);
    case "steal-focus":
      return applyStealFocus(file.text);
    case "custom-focus-effect":
      return applyCustomFocusEffect(file.text);
    case "force-account-before-use":
      return applyForceAccountBeforeUse(file.text);
    case "buried-account-deletion":
      return applyBuriedAccountDeletion(file.text);
    case "passcode-for-account-auth":
      return applyPasscodeForAccountAuth(file.text);
    case "popup-tabs-switch":
      return applyPopupTabsSwitch(file.text);
    case "more-than-six-tabs":
      return applyMoreThanSixTabs(file.text);
    case "cross-pane-controls":
      return applyCrossPaneControls(file.text);
    case "continue-when-switched-away":
      return applyContinueWhenSwitchedAway(file.text);
    case "notify-routine-task":
      return applyNotifyRoutineTask(file.text);
    case "ignore-primary-audio-interrupt":
      return applyIgnorePrimaryAudioInterrupt(file.text);
    case "rating-on-first-launch":
      return applyRatingOnFirstLaunch(file.text);
    case "rating-interrupts-task":
      return applyRatingInterruptsTask(file.text);
    case "pester-rating-requests":
      return applyPesterRatingRequests(file.text);
    case "open-window-as-default":
      return applyOpenWindowAsDefault(file.text);
    case "custom-window-frame":
      return applyCustomWindowFrame(file.text);
    case "call-window-scene":
      return applyCallWindowScene(file.text);
    case "critical-window-bottom-bar":
      return applyCriticalWindowBottomBar(file.text);
    case "custom-video-player":
      return applyCustomVideoPlayer(file.text);
    case "letterbox-video-padding":
      return applyLetterboxVideoPadding(file.text);
    case "ask-resume-playback":
      return applyAskResumePlayback(file.text);
    case "video-loading-splash":
      return applyVideoLoadingSplash(file.text);
    case "haptic-wrong-meaning":
      return applyHapticWrongMeaning(file.text);
    case "overused-haptics":
      return applyOverusedHaptics(file.text);
    case "haptic-not-optional":
      return applyHapticNotOptional(file.text);
    case "stop-airplay-on-background":
      return applyStopAirplayOnBackground(file.text);
    case "interrupt-other-playback":
      return applyInterruptOtherPlayback(file.text);
    case "auto-mirror-airplay":
      return applyAutoMirrorAirplay(file.text);
    case "stream-background-loop":
      return applyStreamBackgroundLoop(file.text);
    case "motion-without-benefit":
      return applyMotionWithoutBenefit(file.text);
    case "motion-direct-ui":
      return applyMotionDirectUi(file.text);
    case "quick-action-app-name":
      return applyQuickActionAppName(file.text);
    case "quick-action-emoji":
      return applyQuickActionEmoji(file.text);
    case "live-unmarked-vod":
      return applyLiveUnmarkedVod(file.text);
    case "live-audio-after-leave":
      return applyLiveAudioAfterLeave(file.text);
    case "snippet-dialogue-text":
      return applySnippetDialogueText(file.text);
    case "snippet-too-tall":
      return applySnippetTooTall(file.text);
    case "ai-as-human":
      return applyAiAsHuman(file.text);
    case "genai-no-revert":
      return applyGenaiNoRevert(file.text);
    case "always-on-sensitive":
      return applyAlwaysOnSensitive(file.text);
    case "always-on-stop-motion":
      return applyAlwaysOnStopMotion(file.text);
    default: {
      const _exhaustive = id;
      void _exhaustive;
      return file.text;
    }
  }
}

function applyWanted(files, ids) {
  const mutated = new Set();
  const hitIds = ids.filter((id) => scanHeuristic(id, files).length > 0);
  for (const id of hitIds) {
    for (const file of files) {
      const next = applyHeuristic(id, file);
      if (next === file.text) continue;
      file.text = next;
      mutated.add(id);
    }
  }
  const css = files.find((f) => /\.css$/i.test(f.path));
  if (scanReduceMotion(files).length && css && !/prefers-reduced-motion/i.test(css.text)) {
    css.text = `${css.text.trimEnd()}\n${REDUCE_CSS}`;
    mutated.add("motion-without-reduce");
  }
  if (mutated.size) {
    // Sibling Don'ts can share an applier; credit every pre-apply hit so the
    // cleaned topic accounts as applied instead of already-compliant.
    for (const id of hitIds) mutated.add(id);
  }
  return mutated;
}

export function accountRequiredProseDont({ topics, catalog, files }) {
  const wanted = [];
  const seen = new Set();
  for (const [id, row] of Object.entries(topics)) {
    if (row.state !== "pending") continue;
    const topic = catalog.byId[id];
    if (!topic?.dontCoverageComplete) continue;
    for (const hid of topic.dontHeuristicIds || []) {
      if (seen.has(hid)) continue;
      seen.add(hid);
      wanted.push(hid);
    }
  }
  const mutated = applyWanted(files, wanted);
  const accounted = [];
  const nextTopics = {};
  for (const [id, row] of Object.entries(topics)) {
    let next = { ...row };
    if (row.state === "pending") {
      const topic = catalog.byId[id];
      if (topic?.dontCoverageComplete) {
        const ids = topic.dontHeuristicIds || [];
        const hits = ids.flatMap((hid) => scanHeuristic(hid, files));
        if (hits.length === 0) {
          const didMutate = ids.some((hid) => mutated.has(hid));
          next = {
            ...row,
            state: didMutate ? "applied" : "already-compliant",
          };
          accounted.push({ id, state: next.state, heuristics: ids });
        }
      }
    }
    nextTopics[id] = next;
  }
  return { topics: nextTopics, accounted };
}
