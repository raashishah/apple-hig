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

function hasTrackingRequest(text) {
  return /\bATTrackingManager\b/.test(text) || /\brequestTrackingAuthorization\b/.test(text);
}

function hasAttPrealertCopy(text) {
  return (
    /never precede the system-provided alert with a custom screen/i.test(text) ||
    /custom screen or window that could confuse or mislead/i.test(text)
  );
}

function hasAttAllowButton(text) {
  return /<button\b[^>]*>\s*Allow\s*<\/button>/i.test(text);
}

function hasAttIncentive(text) {
  const incentive = "earn coins|get a reward|\\bincentive\\b";
  const request = "requestTrackingAuthorization|ATTrackingManager";
  const forward = new RegExp(`(?:${request})[\\s\\S]{0,240}(?:${incentive})`, "i");
  const backward = new RegExp(`(?:${incentive})[\\s\\S]{0,240}(?:${request})`, "i");
  return forward.test(text) || backward.test(text);
}

function hasAttPrealertSignal(text) {
  if (!hasTrackingRequest(text)) return false;
  return hasAttAllowButton(text) || hasAttIncentive(text);
}

function scanAttPrealert(files) {
  const out = [];
  for (const f of files) {
    if (/data-pv-att/.test(f.text)) {
      out.push(hit(f.path, "a custom tracking screen with an incentive or an Allow button"));
      continue;
    }
    if (!hasTrackingRequest(f.text)) continue;
    if (hasAttPrealertCopy(f.text) || hasAttPrealertSignal(f.text)) {
      out.push(hit(f.path, "a custom tracking screen with an incentive or an Allow button"));
    }
  }
  return out;
}

function applyAttPrealert(text) {
  return text.replace(/\s*data-pv-att(?:="[^"]*")?/g, "");
}

function hasAttLeaveCopy(text) {
  return (
    /don['’]?t include additional actions in your custom screen/i.test(text) ||
    /additional actions in your custom screen or window/i.test(text) ||
    /option to close or cancel/i.test(text) ||
    /leave the screen or window without viewing the system alert/i.test(text)
  );
}

function hasAttLeaveButton(text) {
  if (!hasTrackingRequest(text)) return false;
  const button =
    "<button\\b[^>]*>\\s*(?:Close|Cancel)\\s*</button>|Button\\(\\s*[\"'](?:Close|Cancel)[\"']\\s*\\)";
  const request = "requestTrackingAuthorization|ATTrackingManager";
  const forward = new RegExp(`(?:${request})[\\s\\S]{0,240}(?:${button})`, "i");
  const backward = new RegExp(`(?:${button})[\\s\\S]{0,240}(?:${request})`, "i");
  if (!forward.test(text) && !backward.test(text)) return false;
  const consent = new RegExp(
    `(?:legal consent)[\\s\\S]{0,240}(?:${button})|(?:${button})[\\s\\S]{0,240}legal consent`,
    "i",
  );
  return !consent.test(text);
}

function scanAttLeave(files) {
  const out = [];
  for (const f of files) {
    if (/data-pv-leave/.test(f.text)) {
      out.push(hit(f.path, "a Close or Cancel button on a custom tracking screen"));
      continue;
    }
    if (!hasTrackingRequest(f.text)) continue;
    if (hasAttLeaveCopy(f.text) || hasAttLeaveButton(f.text)) {
      out.push(hit(f.path, "a Close or Cancel button on a custom tracking screen"));
    }
  }
  return out;
}

function applyAttLeave(text) {
  return text.replace(/\s*data-pv-leave(?:="[^"]*")?/g, "");
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

function hasAlertWidget(text) {
  return (
    /<dialog\b/i.test(text) ||
    /role=["'](?:dialog|alertdialog)["']/i.test(text) ||
    /\bUIAlertController\b/.test(text) ||
    /\.alert\s*\(/.test(text)
  );
}

function hasAlertErrorCopy(text) {
  return (
    /avoid writing a title that doesn['’]?t convey useful information/i.test(text) ||
    /title that doesn['’]?t convey useful information/i.test(text) ||
    /alert title that is only Error or an error number/i.test(text)
  );
}

function hasBareErrorTitle(text) {
  const title = "Error(?:\\s+\\d+(?:\\s+occurred)?)?";
  const heading = new RegExp(`<(h[1-3])\\b[^>]*>\\s*${title}\\s*[.!?]?\\s*<\\/\\1>`, "i");
  for (const region of dialogRegions(text)) {
    if (heading.test(region)) return true;
  }
  const api = new RegExp(
    `(?:UIAlertController[\\s\\S]{0,240}title:\\s*["']${title}["']|title:\\s*["']${title}["'][\\s\\S]{0,240}UIAlertController|\\.alert\\(\\s*["']${title}["'])`,
    "i",
  );
  return api.test(text);
}

function scanAlertErrorTitle(files) {
  const out = [];
  for (const f of files) {
    if (/data-al-error/.test(f.text)) {
      out.push(hit(f.path, "an alert title that is only Error or an error number"));
      continue;
    }
    if (!hasAlertWidget(f.text)) continue;
    if (hasAlertErrorCopy(f.text) || hasBareErrorTitle(f.text)) {
      out.push(hit(f.path, "an alert title that is only Error or an error number"));
    }
  }
  return out;
}

function applyAlertErrorTitle(text) {
  return text.replace(/\s*data-al-error(?:="[^"]*")?/g, "");
}

function hasAlertCancelCopy(text) {
  return (
    /don['’]?t make a Cancel button the default/i.test(text) ||
    /Cancel button the default button/i.test(text) ||
    /use a Done button, not a Cancel button/i.test(text) ||
    /Cancel button that is the default button in an alert/i.test(text)
  );
}

function hasDefaultCancel(text) {
  const primary =
    /<button\b[^>]*\b(?:class|className)=["'][^"']*\bprimary\b[^"']*["'][^>]*>\s*Cancel\s*<\/button>/i;
  const variant =
    /<button\b[^>]*\b(?:variant|data-variant)=["']primary["'][^>]*>\s*Cancel\s*<\/button>/i;
  const submit = /<button\b[^>]*\btype=["']submit["'][^>]*>\s*Cancel\s*<\/button>/i;
  for (const region of dialogRegions(text)) {
    if (primary.test(region) || variant.test(region) || submit.test(region)) return true;
  }
  if (/\bUIAlertController\b/.test(text)) {
    if (
      /UIAlertAction\(\s*title:\s*["']Cancel["']\s*,\s*style:\s*\.default\b/i.test(text)
    ) {
      return true;
    }
  }
  if (!hasAlertWidget(text)) return false;
  const prominent =
    /Button\(\s*["']Cancel["'][\s\S]{0,240}buttonStyle\(\s*\.borderedProminent\s*\)|buttonStyle\(\s*\.borderedProminent\s*\)[\s\S]{0,240}Button\(\s*["']Cancel["']/i;
  const shortcut = /Button\(\s*["']Cancel["'][\s\S]{0,240}keyboardShortcut\(\s*\.defaultAction\s*\)/i;
  return prominent.test(text) || shortcut.test(text);
}

function scanAlertCancelDefault(files) {
  const out = [];
  for (const f of files) {
    if (/data-al-cancel/.test(f.text)) {
      out.push(hit(f.path, "a Cancel button that is the default button in an alert"));
      continue;
    }
    if (!hasAlertWidget(f.text)) continue;
    if (hasAlertCancelCopy(f.text) || hasDefaultCancel(f.text)) {
      out.push(hit(f.path, "a Cancel button that is the default button in an alert"));
    }
  }
  return out;
}

function applyAlertCancelDefault(text) {
  return text.replace(/\s*data-al-cancel(?:="[^"]*")?/g, "");
}

function hasAlertYesNoCopy(text) {
  return (
    /avoiding Yes and No/i.test(text) ||
    /don['’]?t use Yes or No/i.test(text) ||
    /Yes or No button in an alert/i.test(text)
  );
}

function hasYesNoButton(text) {
  const html = /<button\b[^>]*>\s*(?:Yes|No)\s*<\/button>/i;
  for (const region of dialogRegions(text)) {
    if (html.test(region)) return true;
  }
  if (/\bUIAlertController\b/.test(text)) {
    if (/UIAlertAction\(\s*title:\s*["'](?:Yes|No)["']/i.test(text)) return true;
  }
  if (!hasAlertWidget(text)) return false;
  return /Button\(\s*["'](?:Yes|No)["']/i.test(text);
}

function scanAlertYesNo(files) {
  const out = [];
  for (const f of files) {
    if (/data-al-yes\b/.test(f.text)) {
      out.push(hit(f.path, "a Yes or No button in an alert"));
      continue;
    }
    if (!hasAlertWidget(f.text)) continue;
    if (hasAlertYesNoCopy(f.text) || hasYesNoButton(f.text)) {
      out.push(hit(f.path, "a Yes or No button in an alert"));
    }
  }
  return out;
}

function applyAlertYesNo(text) {
  return text.replace(/\s*data-al-yes(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAlertCautionCopy(text) {
  return (
    /don['’]?t use the symbol for tasks whose only purpose is to overwrite or remove data/i.test(
      text,
    ) ||
    /symbol for a save or empty trash/i.test(text) ||
    /caution symbol on a Save or Empty Trash alert/i.test(text)
  );
}

function hasCautionOnSave(text) {
  const buttonRe = /<button\b[^>]*>\s*(?:Save|Empty Trash)\s*<\/button>/i;
  for (const region of dialogRegions(text)) {
    if (region.includes("exclamationmark.triangle") && buttonRe.test(region)) return true;
  }
  if (!hasAlertWidget(text) || !text.includes("exclamationmark.triangle")) return false;
  const titled =
    /(?:Button\(\s*["'](?:Save|Empty Trash)["']|UIAlertAction\(\s*title:\s*["'](?:Save|Empty Trash)["'])/i;
  const nearSymbol =
    /exclamationmark\.triangle[\s\S]{0,400}(?:Button\(\s*["'](?:Save|Empty Trash)["']|UIAlertAction\(\s*title:\s*["'](?:Save|Empty Trash)["'])|(?:Button\(\s*["'](?:Save|Empty Trash)["']|UIAlertAction\(\s*title:\s*["'](?:Save|Empty Trash)["'])[\s\S]{0,400}exclamationmark\.triangle/i;
  if (/\bUIAlertController\b/.test(text) && titled.test(text) && nearSymbol.test(text)) return true;
  if (/\.alert\s*\(|confirmationDialog\s*\(/.test(text) && nearSymbol.test(text)) return true;
  return false;
}

function scanAlertCautionOnSave(files) {
  const out = [];
  for (const f of files) {
    if (/data-al-caution\b/.test(f.text)) {
      out.push(hit(f.path, "a caution symbol on a Save or Empty Trash alert"));
      continue;
    }
    if (!hasAlertWidget(f.text)) continue;
    if (hasAlertCautionCopy(f.text) || hasCautionOnSave(f.text)) {
      out.push(hit(f.path, "a caution symbol on a Save or Empty Trash alert"));
    }
  }
  return out;
}

function applyAlertCautionOnSave(text) {
  return text.replace(/\s*data-al-caution(?:="[^"]*")?(?![\w-])/g, "");
}

function hasSheetWidget(text) {
  return (
    /<dialog\b/i.test(text) ||
    /role=["'](?:dialog|alertdialog)["']/i.test(text) ||
    /\.sheet\s*\(/.test(text) ||
    /\bUISheetPresentationController\b/.test(text) ||
    /\bpresentAsSheet\s*\(/.test(text)
  );
}

function hasSheetTrioCopy(text) {
  return (
    /avoid showing all three buttons/i.test(text) ||
    /Cancel, Done, and Back — together/i.test(text) ||
    /Cancel, Done, and Back together in a sheet/i.test(text)
  );
}

function hasExactButton(region, label) {
  return new RegExp(`<button\\b[^>]*>\\s*${label}\\s*<\\/button>`, "i").test(region);
}

function hasSheetTrioButtons(text) {
  const labels = ["Cancel", "Done", "Back"];
  for (const region of dialogRegions(text)) {
    if (labels.every((label) => hasExactButton(region, label))) return true;
  }
  if (!/\.sheet\s*\(|\bUISheetPresentationController\b|\bpresentAsSheet\s*\(/.test(text)) return false;
  return labels.every((label) => new RegExp(`Button\\(\\s*["']${label}["']`, "i").test(text));
}

function scanSheetTrio(files) {
  const out = [];
  for (const f of files) {
    if (/data-sh-trio\b/.test(f.text)) {
      out.push(hit(f.path, "Cancel, Done, and Back together in a sheet"));
      continue;
    }
    if (!hasSheetWidget(f.text)) continue;
    if (hasSheetTrioCopy(f.text) || hasSheetTrioButtons(f.text)) {
      out.push(hit(f.path, "Cancel, Done, and Back together in a sheet"));
    }
  }
  return out;
}

function applySheetTrio(text) {
  return text.replace(/\s*data-sh-trio(?:="[^"]*")?(?![\w-])/g, "");
}

function hasSheetDoneOnlyCopy(text) {
  return (
    /always pair it with a Cancel button/i.test(text) ||
    /relying solely on the Done button/i.test(text) ||
    /Done button to exit a sheet/i.test(text)
  );
}

function regionButtonLabels(region) {
  const labels = [];
  const re = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;
  let m;
  while ((m = re.exec(region))) {
    labels.push(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase());
  }
  return labels;
}

function isDoneOnlyExit(labels) {
  if (!labels.includes("done")) return false;
  return !labels.includes("cancel") && !labels.includes("close") && !labels.includes("back");
}

function hasSheetDoneOnlyButtons(text) {
  if (!/\.sheet\s*\(|\bUISheetPresentationController\b|\bpresentAsSheet\s*\(/.test(text)) return false;
  for (const region of dialogRegions(text)) {
    if (isDoneOnlyExit(regionButtonLabels(region))) return true;
  }
  const labels = ["done", "cancel", "close", "back"].filter((name) =>
    new RegExp(`Button\\(\\s*["']${name}["']`, "i").test(text),
  );
  return isDoneOnlyExit(labels);
}

function scanSheetDoneOnly(files) {
  const out = [];
  for (const f of files) {
    if (/data-sh-done\b/.test(f.text)) {
      out.push(hit(f.path, "relying solely on the Done button to exit a sheet"));
      continue;
    }
    if (!hasSheetWidget(f.text)) continue;
    if (hasSheetDoneOnlyCopy(f.text) || hasSheetDoneOnlyButtons(f.text)) {
      out.push(hit(f.path, "relying solely on the Done button to exit a sheet"));
    }
  }
  return out;
}

function applySheetDoneOnly(text) {
  return text.replace(/\s*data-sh-done(?:="[^"]*")?(?![\w-])/g, "");
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

function isTabViewFile(text) {
  return (
    /\bdata-tab-view\b/.test(text) ||
    /\bNSTabView\b/.test(text) ||
    (/role=["']tablist["']/i.test(text) && /role=["']tabpanel["']/i.test(text))
  );
}

function hasTabBar(text) {
  if (isTabViewFile(text)) return false;
  return /data-tab-bar|role=["']tablist["']|\bUITabBar\b|\bTabView\s*[({\[]/.test(text);
}

function hasTabDisabledCopy(text) {
  return (
    /don['’]?t disable or hide tab bar buttons/i.test(text) ||
    /disable or hide tab bar buttons/i.test(text) ||
    /disabled or hidden tab bar button/i.test(text)
  );
}

function tagDisablesTab(attrs) {
  if (/\saria-disabled=["']true["']/i.test(attrs)) return true;
  if (/\saria-hidden=["']true["']/i.test(attrs)) return true;
  if (/(?:^|\s)hidden(?=$|[\s=/>])/.test(attrs)) return true;
  if (/(?:^|\s)disabled(?=$|[\s=/>])/.test(attrs)) {
    if (/disabled\s*=\s*["'{]\s*false/i.test(attrs)) return false;
    return true;
  }
  return false;
}

function tabBarRegions(text) {
  const out = [];
  const re = /<(nav|div|ul|header)\b[^>]*(?:data-tab-bar|role=["']tablist["'])[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}

function hasSwiftDisabledTab(text) {
  if (/\bUITabBarItem\b/.test(text)) {
    if (
      /UITabBarItem[\s\S]{0,240}isEnabled\s*=\s*false|isEnabled\s*=\s*false[\s\S]{0,240}UITabBarItem/.test(
        text,
      )
    ) {
      return true;
    }
  }
  if (!/\bTabView\s*[({\[]/.test(text)) return false;
  return (
    /\.tabItem\s*[({\[][\s\S]{0,240}\.disabled\s*\(\s*true\s*\)/.test(text) ||
    /\.disabled\s*\(\s*true\s*\)[\s\S]{0,240}\.tabItem\s*[({\[]/.test(text) ||
    /Tab\([^)]*\)\s*\.disabled\s*\(\s*true\s*\)/.test(text)
  );
}

function hasDisabledTab(text) {
  if (isTabViewFile(text)) return false;
  if (
    openingTags(text).some((t) => /role=["']tab["']/i.test(t.attrs) && tagDisablesTab(t.attrs))
  ) {
    return true;
  }
  for (const region of tabBarRegions(text)) {
    if (
      openingTags(region).some((t) => /^(button|a)$/i.test(t.tag) && tagDisablesTab(t.attrs))
    ) {
      return true;
    }
  }
  return hasSwiftDisabledTab(text);
}

function scanTabDisabled(files) {
  const out = [];
  for (const f of files) {
    if (/data-tb-off\b/.test(f.text)) {
      out.push(hit(f.path, "a disabled or hidden tab bar button"));
      continue;
    }
    if (!hasTabBar(f.text)) continue;
    if (hasTabDisabledCopy(f.text) || hasDisabledTab(f.text)) {
      out.push(hit(f.path, "a disabled or hidden tab bar button"));
    }
  }
  return out;
}

function applyTabDisabled(text) {
  return text.replace(/\s*data-tb-off(?:="[^"]*")?(?![\w-])/g, "");
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

function isDisabledAttrs(attrs) {
  return (
    /(?:^|\s)disabled(?=$|[\s=/>])/i.test(attrs) ||
    /aria-disabled=["']true["']/i.test(attrs)
  );
}

function hasSubmenuWidget(text) {
  return (
    /role=["']menuitem["'][^>]*aria-haspopup=["'](?:menu|true)["']/i.test(text) ||
    /aria-haspopup=["'](?:menu|true)["'][^>]*role=["']menuitem["']/i.test(text) ||
    /\bMenu\s*\([^)]*\)\s*\{[\s\S]*?\bMenu\s*\(/.test(text)
  );
}

function hasSubmenuCopy(text) {
  return (
    /submenu remains available/i.test(text) ||
    /submenu item that is unavailable/i.test(text) ||
    /nested menu items are unavailable/i.test(text)
  );
}

function htmlDisabledSubmenu(text) {
  const re = /<([A-Za-z][\w]*)\b([^>]*role=["']menuitem["'][^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) {
    const attrs = m[2];
    const body = m[3];
    const isSub =
      /aria-haspopup=["'](?:menu|true)["']/i.test(attrs) || /role=["']menu["']/i.test(body);
    if (isSub && isDisabledAttrs(attrs)) return true;
  }
  return false;
}

function matchingBrace(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function swiftDisabledSubmenu(text) {
  const re = /\bMenu\s*\([^)]*\)\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].lastIndexOf("{");
    const close = matchingBrace(text, open);
    if (close < 0) continue;
    const body = text.slice(open + 1, close);
    if (!/\bMenu\s*\(/.test(body)) continue;
    if (/^\s*\.disabled\s*\(\s*true\s*\)/.test(text.slice(close + 1, close + 40))) return true;
  }
  return false;
}

function scanSubmenuAvailable(files) {
  const out = [];
  for (const f of files) {
    if (/data-mn-sub(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a submenu item that is unavailable"));
      continue;
    }
    if (htmlDisabledSubmenu(f.text) || swiftDisabledSubmenu(f.text)) {
      out.push(hit(f.path, "a submenu item that is unavailable"));
      continue;
    }
    if (hasSubmenuWidget(f.text) && hasSubmenuCopy(f.text)) {
      out.push(hit(f.path, "a submenu item that is unavailable"));
    }
  }
  return out;
}

function applySubmenuAvailable(text) {
  return text.replace(/\s*data-mn-sub(?:="[^"]*")?(?![\w-])/g, "");
}

function contextMenuBodies(text) {
  const bodies = [];
  const re = /\.contextMenu\b/g;
  let m;
  while ((m = re.exec(text))) {
    const brace = text.indexOf("{", m.index);
    if (brace < 0 || brace - m.index > 80) continue;
    const close = matchingBrace(text, brace);
    if (close < 0) continue;
    bodies.push(text.slice(brace + 1, close));
  }
  const ui = /UIContextMenuInteraction|popUpContextMenu/g;
  while ((m = ui.exec(text))) bodies.push(text.slice(m.index, m.index + 700));
  for (const attr of ["oncontextmenu", "onContextMenu"]) {
    for (const block of blocksWithAttr(text, attr)) bodies.push(block.text);
  }
  return bodies;
}

function bodyHasShortcut(body) {
  return (
    /\bkeyboardShortcut\s*\(/.test(body) ||
    /\bkeyEquivalent\b/.test(body) ||
    /<kbd\b/i.test(body) ||
    /⌘/.test(body)
  );
}

function contextMenuHasShortcut(text) {
  return contextMenuBodies(text).some((body) => bodyHasShortcut(body));
}

function hasContextMenuWidget(text) {
  return (
    /\.contextMenu\b/.test(text) ||
    /\bUIContextMenuInteraction\b/.test(text) ||
    /\bpopUpContextMenu\b/.test(text) ||
    /\boncontextmenu\b/i.test(text)
  );
}

function hasContextShortcutCopy(text) {
  return (
    /not in context menus/i.test(text) ||
    /keyboard shortcuts in your app/i.test(text) ||
    /keyboard shortcut inside a context menu/i.test(text)
  );
}

function scanContextShortcut(files) {
  const out = [];
  for (const f of files) {
    if (/data-mn-key(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a keyboard shortcut inside a context menu"));
      continue;
    }
    if (contextMenuHasShortcut(f.text)) {
      out.push(hit(f.path, "a keyboard shortcut inside a context menu"));
      continue;
    }
    if (hasContextMenuWidget(f.text) && hasContextShortcutCopy(f.text)) {
      out.push(hit(f.path, "a keyboard shortcut inside a context menu"));
    }
  }
  return out;
}

function applyContextShortcut(text) {
  return text.replace(/\s*data-mn-key(?:="[^"]*")?(?![\w-])/g, "");
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

function htmlIndeterminateSpinners(text) {
  const spans = [];
  const progressRe = /<progress\b([^>]*)>/gi;
  let m;
  while ((m = progressRe.exec(text))) {
    if (/\bvalue\s*=/.test(m[1])) continue;
    spans.push({ start: m.index, end: m.index + m[0].length });
  }
  const barRe = /<([A-Za-z][\w]*)\b([^>]*\brole=["']progressbar["'][^>]*)>/gi;
  while ((m = barRe.exec(text))) {
    if (/\baria-valuenow\s*=/.test(m[2]) || /\bvalue\s*=/.test(m[2])) continue;
    spans.push({ start: m.index, end: m.index + m[0].length });
  }
  return spans;
}

function adjacentVisibleLabel(text, start, end) {
  const before = text.slice(Math.max(0, start - 80), start);
  const after = text.slice(end, end + 80);
  const gt = before.lastIndexOf(">");
  const beforeText = gt >= 0 ? before.slice(gt + 1) : "";
  const lt = after.indexOf("<");
  const afterText = lt >= 0 ? after.slice(0, lt) : "";
  const chunk = `${beforeText} ${afterText}`.replace(/\s+/g, " ").trim();
  return /[A-Za-z]/.test(chunk);
}

function hasSpinnerWidget(text) {
  if (htmlIndeterminateSpinners(text).length) return true;
  if (/\bUIActivityIndicatorView\b/.test(text)) return true;
  if (/\bNSProgressIndicator\b/.test(text) && /\.spinning\b/.test(text)) return true;
  const re = /\bProgressView\s*\(/g;
  let m;
  while ((m = re.exec(text))) {
    const call = text.slice(m.index, m.index + 80);
    if (!/\bvalue\s*:/.test(call)) return true;
  }
  return false;
}

function hasSpinnerLabelCopy(text) {
  return (
    /labeling a spinning progress indicator/i.test(text) ||
    /label on a spinning progress indicator/i.test(text)
  );
}

function htmlSpinnerHasVisibleLabel(text) {
  return htmlIndeterminateSpinners(text).some((span) =>
    adjacentVisibleLabel(text, span.start, span.end),
  );
}

function swiftLabeledSpinner(text) {
  const titled = /\bProgressView\s*\(\s*"[^"]+"/g;
  let m;
  while ((m = titled.exec(text))) {
    const call = text.slice(m.index, m.index + 160);
    if (!/\bvalue\s*:/.test(call)) return true;
  }
  const bare = /\bProgressView\s*\(\s*\)\s*\{/g;
  while ((m = bare.exec(text))) {
    const body = text.slice(m.index, m.index + 180);
    if (/Text\s*\(\s*"/.test(body)) return true;
  }
  return false;
}

function activityLabeled(text) {
  if (/\bNSProgressIndicator\b/.test(text) && /\.spinning\b/.test(text)) {
    if (/Text\s*\(\s*"[^"]+"/.test(text) || /text\s*=\s*"[^"]+"/.test(text)) return true;
  }
  const re = /\bUIActivityIndicatorView\b/g;
  let m;
  while ((m = re.exec(text))) {
    const window = text.slice(Math.max(0, m.index - 180), Math.min(text.length, m.index + 220));
    if (/Text\s*\(\s*"[^"]+"/.test(window) || /text\s*=\s*"[^"]+"/.test(window)) return true;
  }
  return false;
}

function scanSpinnerLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-pg-label(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a label on a spinning progress indicator"));
      continue;
    }
    if (!hasSpinnerWidget(f.text)) continue;
    if (
      hasSpinnerLabelCopy(f.text) ||
      htmlSpinnerHasVisibleLabel(f.text) ||
      swiftLabeledSpinner(f.text) ||
      activityLabeled(f.text)
    ) {
      out.push(hit(f.path, "a label on a spinning progress indicator"));
    }
  }
  return out;
}

function applySpinnerLabel(text) {
  return text.replace(/\s*data-pg-label(?:="[^"]*")?(?![\w-])/g, "");
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

function hasScrollPane(text) {
  if (/\bScrollView\s*[\({]/.test(text)) return true;
  if (/\b(?:UIScrollView|NSScrollView)\b/.test(text)) return true;
  if (/data-scroll-view(?![\w-])/.test(text)) return true;
  if (/data-nested-same-axis-scroll(?![\w-])/.test(text)) return true;
  const tagRe = /<([A-Za-z][\w]*)\b[^>]*>/g;
  let m;
  while ((m = tagRe.exec(text))) {
    if (/^(html|body)$/i.test(m[1])) continue;
    if (tagOverflowAxis(m[0])) return true;
  }
  const cssRe = /([^{]+)\{([^}]*)\}/g;
  while ((m = cssRe.exec(text))) {
    if (!/overflow(?:-(?:x|y))?\s*:\s*(auto|scroll)/i.test(m[2])) continue;
    const parts = m[1]
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .split(",")
      .map((p) => (p.trim().split(/\s+/).pop() || "").trim())
      .filter(Boolean);
    if (!parts.length) continue;
    if (parts.every((p) => /^(html|body|:root|#root|#__next|#app)$/i.test(p))) continue;
    if (parts.every((p) => /^[#.]?[A-Za-z][\w-]*$/.test(p))) return true;
  }
  return false;
}

function scrollIndicatorHidden(text) {
  if (/\.scrollIndicators\(\s*\.hidden\s*\)/.test(text)) return true;
  if (/showsIndicators\s*:\s*false\b/.test(text)) return true;
  if (
    /showsVerticalScrollIndicator\s*=\s*false\b/.test(text) &&
    /showsHorizontalScrollIndicator\s*=\s*false\b/.test(text)
  ) {
    return true;
  }
  if (/scrollbar-width\s*:\s*none\b/i.test(text)) return true;
  if (/scrollbarWidth\s*:\s*["']none["']/.test(text)) return true;
  return false;
}

function hasScrollIndicatorCopy(text) {
  return (
    /don.?t show the scrolling indicator/i.test(text) ||
    /scrolling indicator on a scroll view/i.test(text)
  );
}

function scanScrollIndicator(files) {
  const out = [];
  for (const f of files) {
    if (/data-sv-indicator(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a scrolling indicator on a scroll view that also shows a page control"));
      continue;
    }
    if (!hasScrollPane(f.text) || !hasPageControlWidget(f.text)) continue;
    if (hasScrollIndicatorCopy(f.text) || !scrollIndicatorHidden(f.text)) {
      out.push(hit(f.path, "a scrolling indicator on a scroll view that also shows a page control"));
    }
  }
  return out;
}

function applyScrollIndicator(text) {
  return text.replace(/\s*data-sv-indicator(?:="[^"]*")?(?![\w-])/g, "");
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

function isMinimalPageStyle(chunk) {
  return (
    /data-page-minimal(?![\w-])/.test(chunk) ||
    /backgroundStyle\s*[:=]\s*\.minimal\b/.test(chunk) ||
    /\.backgroundStyle\(\s*\.minimal\s*\)/.test(chunk)
  );
}

function hasPageScrubber(chunk) {
  return (
    /data-page-scrub(?![\w-])/.test(chunk) ||
    /allowsContinuousInteraction\s*[:=]\s*true\b/.test(chunk) ||
    /\.allowsContinuousInteraction\(\s*true\s*\)/.test(chunk)
  );
}

function hasMinimalScrubCopy(text) {
  return (
    /supporting the scrubber when you use the minimal/i.test(text) ||
    /scrubber on a page control that uses the minimal/i.test(text)
  );
}

function minimalScrubPage(text) {
  const blocks = [
    ...blocksWithAttr(text, "data-page-control"),
    ...blocksWithAttr(text, "data-carousel-dots"),
  ];
  if (blocks.some((b) => isMinimalPageStyle(b.text) && hasPageScrubber(b.text))) return true;
  const re = /\b(?:UIPageControl|PageControl)\s*[\({]/g;
  let m;
  while ((m = re.exec(text))) {
    const window = text.slice(m.index, m.index + 600);
    if (isMinimalPageStyle(window) && hasPageScrubber(window)) return true;
  }
  return false;
}

function scanMinimalPageScrub(files) {
  const out = [];
  for (const f of files) {
    if (/data-pgc-scrub(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a scrubber on a page control that uses the minimal background style"));
      continue;
    }
    if (!hasPageControlWidget(f.text)) continue;
    if (hasMinimalScrubCopy(f.text) || minimalScrubPage(f.text)) {
      out.push(hit(f.path, "a scrubber on a page control that uses the minimal background style"));
    }
  }
  return out;
}

function applyMinimalPageScrub(text) {
  return text.replace(/\s*data-pgc-scrub(?:="[^"]*")?(?![\w-])/g, "");
}

function pageScrubChunks(text) {
  const out = [
    ...blocksWithAttr(text, "data-page-control").map((b) => b.text),
    ...blocksWithAttr(text, "data-carousel-dots").map((b) => b.text),
  ];
  const re = /\b(?:UIPageControl|PageControl)\s*[\({]/g;
  let m;
  while ((m = re.exec(text))) out.push(text.slice(m.index, m.index + 700));
  return out;
}

function chunkAnimatesPage(chunk) {
  return (
    /scroll-behavior\s*:\s*smooth/i.test(chunk) ||
    /scrollBehavior\s*:\s*["']smooth["']/.test(chunk) ||
    /\bwithAnimation\s*\(/.test(chunk) ||
    /\.animation\s*\(/.test(chunk) ||
    /\banimated\s*:\s*true\b/.test(chunk)
  );
}

function hasScrubAnimCopy(text) {
  return (
    /animating page transitions during scrubbing/i.test(text) ||
    /animated page transition while a page control is scrubbing/i.test(text)
  );
}

function scrubAnimates(text) {
  return pageScrubChunks(text).some((chunk) => hasPageScrubber(chunk) && chunkAnimatesPage(chunk));
}

function scanScrubAnimation(files) {
  const out = [];
  for (const f of files) {
    if (/data-pgc-anim(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an animated page transition while a page control is scrubbing"));
      continue;
    }
    if (!hasPageControlWidget(f.text)) continue;
    if (hasScrubAnimCopy(f.text) || scrubAnimates(f.text)) {
      out.push(hit(f.path, "an animated page transition while a page control is scrubbing"));
    }
  }
  return out;
}

function applyScrubAnimation(text) {
  return text.replace(/\s*data-pgc-anim(?:="[^"]*")?(?![\w-])/g, "");
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

function hasNotificationChrome(text) {
  return (
    /Notification\.requestPermission/.test(text) ||
    /Notification\.permission/.test(text) ||
    /new\s+Notification\s*\(/.test(text) ||
    /\bUNUserNotificationCenter\b/.test(text) ||
    /\bUNNotificationRequest\b/.test(text)
  );
}

function hasNtBadgeCopy(text) {
  return (
    /don['’]?t use a badge to convey numeric information/i.test(text) ||
    /badge to convey numeric information that isn['’]?t related to notifications/i.test(text) ||
    /numeric information that isn['’]?t related to notifications/i.test(text)
  );
}

function hasNtBadgeSignal(text) {
  if (!hasNotificationChrome(text)) return false;
  const topics = ["weather", "temperature", "stockPrice", "stock price", "gameScore", "highScore"];
  const apis = ["applicationIconBadgeNumber", "setBadgeCount"];
  for (const api of apis) {
    if (!new RegExp(`\\b${api}\\b`).test(text)) continue;
    for (const topic of topics) {
      const escaped = topic.replace(/\s+/g, "\\s+");
      const forward = new RegExp(`\\b${api}\\b[\\s\\S]{0,160}\\b${escaped}\\b`, "i");
      const backward = new RegExp(`\\b${escaped}\\b[\\s\\S]{0,160}\\b${api}\\b`, "i");
      if (forward.test(text) || backward.test(text)) return true;
    }
  }
  return false;
}

function scanNtBadge(files) {
  const out = [];
  for (const f of files) {
    if (/data-nt-badge/.test(f.text)) {
      out.push(hit(f.path, "a badge that conveys numeric information that isn't related to notifications"));
      continue;
    }
    if (!hasNotificationChrome(f.text)) continue;
    if (hasNtBadgeCopy(f.text) || hasNtBadgeSignal(f.text)) {
      out.push(hit(f.path, "a badge that conveys numeric information that isn't related to notifications"));
    }
  }
  return out;
}

function applyNtBadge(text) {
  return text.replace(/\s*data-nt-badge(?:="[^"]*")?/g, "");
}

function bundleDisplayName(text) {
  const patterns = [
    /CFBundleDisplayName<\/key>\s*<string>([^<]+)<\/string>/i,
    /CFBundleDisplayName\s*[:=]\s*"([^"]+)"/,
    /CFBundleDisplayName\s*[:=]\s*'([^']+)'/,
  ];
  for (const re of patterns) {
    const found = text.match(re);
    if (!found) continue;
    const name = found[1].trim();
    if (name.length < 3) continue;
    if (/^(open|snooze|ok|yes|no)$/i.test(name)) continue;
    return name;
  }
  return null;
}

function hasNtLabelCopy(text) {
  return (
    /don['’]?t include your app name/i.test(text) ||
    /include your app name (?:or any extraneous information )?in the button label/i.test(text) ||
    /app name in (?:a |the )?notification button label/i.test(text)
  );
}

function hasNtLabelSignal(text) {
  if (!hasNotificationChrome(text)) return false;
  const name = bundleDisplayName(text);
  if (!name) return false;
  const nameRe = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  const titles = text.matchAll(/UNNotificationAction\s*\([^)]*title:\s*"([^"]+)"/g);
  for (const found of titles) {
    if (nameRe.test(found[1])) return true;
  }
  return false;
}

function scanNtLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-nt-label/.test(f.text)) {
      out.push(hit(f.path, "the app name in a notification button label"));
      continue;
    }
    if (!hasNotificationChrome(f.text)) continue;
    if (hasNtLabelCopy(f.text) || hasNtLabelSignal(f.text)) {
      out.push(hit(f.path, "the app name in a notification button label"));
    }
  }
  return out;
}

function applyNtLabel(text) {
  return text.replace(/\s*data-nt-label(?:="[^"]*")?/g, "");
}

function hasNtOpenCopy(text) {
  return (
    /avoid providing an action that merely opens your app/i.test(text) ||
    /action that merely opens your app/i.test(text)
  );
}

function hasNtOpenSignal(text) {
  if (!hasNotificationChrome(text)) return false;
  const titles = text.matchAll(/UNNotificationAction\s*\([^)]*title:\s*"([^"]+)"/g);
  for (const found of titles) {
    if (/^(open|open app|launch app)$/i.test(found[1].trim())) return true;
  }
  return false;
}

function scanNtOpen(files) {
  const out = [];
  for (const f of files) {
    if (/data-nt-open/.test(f.text)) {
      out.push(hit(f.path, "a notification action that merely opens your app"));
      continue;
    }
    if (!hasNotificationChrome(f.text)) continue;
    if (hasNtOpenCopy(f.text) || hasNtOpenSignal(f.text)) {
      out.push(hit(f.path, "a notification action that merely opens your app"));
    }
  }
  return out;
}

function applyNtOpen(text) {
  return text.replace(/\s*data-nt-open(?:="[^"]*")?/g, "");
}

function hasNtContentCopy(text) {
  return (
    /avoid including your app name or icon/i.test(text) ||
    /app name or icon inside the notification content/i.test(text)
  );
}

function notificationContentStrings(text) {
  const withoutActions = text.replace(/UNNotificationAction\s*\([^)]*\)/g, "");
  const out = [];
  const re = /(?:\.title|\.body)\s*=\s*"([^"]+)"/g;
  let found;
  while ((found = re.exec(withoutActions))) out.push(found[1]);
  return out;
}

function hasNtContentSignal(text) {
  if (!hasNotificationChrome(text)) return false;
  const name = bundleDisplayName(text);
  if (!name) return false;
  const nameRe = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  return notificationContentStrings(text).some((value) => nameRe.test(value));
}

function scanNtContent(files) {
  const out = [];
  for (const f of files) {
    if (/data-nt-content/.test(f.text)) {
      out.push(hit(f.path, "the app name or icon inside the notification content"));
      continue;
    }
    if (!hasNotificationChrome(f.text)) continue;
    if (hasNtContentCopy(f.text) || hasNtContentSignal(f.text)) {
      out.push(hit(f.path, "the app name or icon inside the notification content"));
    }
  }
  return out;
}

function applyNtContent(text) {
  return text.replace(/\s*data-nt-content(?:="[^"]*")?/g, "");
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

function hasShareplay(text) {
  return (
    /\bdata-shareplay\b/.test(text) ||
    /\bGroupActivity\b/.test(text) ||
    /\bGroupSession\b/.test(text) ||
    /\bActivitySharingView\b/.test(text)
  );
}

function hasShareplayAdjective(text) {
  return (
    /\b(virtual|spatial)\s+SharePlay\b/i.test(text) ||
    /\bSharePlay\s+(virtual|spatial)\b/i.test(text)
  );
}

function hasShareplayInflected(text) {
  return /\bSharePlay(ed|s|ing)\b/.test(text);
}

function scanShareplayAdjective(files) {
  const out = [];
  for (const f of files) {
    if (/data-shareplay-adjective/.test(f.text)) {
      out.push(hit(f.path, "shareplay paired with an adjective"));
      continue;
    }
    if (!hasShareplay(f.text)) continue;
    if (hasShareplayAdjective(f.text)) {
      out.push(hit(f.path, "shareplay paired with an adjective"));
    }
  }
  return out;
}

function applyShareplayAdjective(text) {
  return text.replace(/\s*data-shareplay-adjective(?:="[^"]*")?/g, "");
}

function scanShareplayInflected(files) {
  const out = [];
  for (const f of files) {
    if (/data-shareplay-inflected/.test(f.text)) {
      out.push(hit(f.path, "shareplayed, shareplays, or shareplaying"));
      continue;
    }
    if (!hasShareplay(f.text)) continue;
    if (hasShareplayInflected(f.text)) {
      out.push(hit(f.path, "shareplayed, shareplays, or shareplaying"));
    }
  }
  return out;
}

function applyShareplayInflected(text) {
  return text.replace(/\s*data-shareplay-inflected(?:="[^"]*")?/g, "");
}

function hasNearby(text) {
  return (
    /\bdata-nearby\b/.test(text) ||
    /\bNISession\b/.test(text) ||
    /\bNINearbyPeerConfiguration\b/.test(text) ||
    /\bNINearbyObject\b/.test(text) ||
    /\bNIDiscoveryToken\b/.test(text) ||
    /\bNearbyInteraction\b/.test(text)
  );
}

function hasNearbyOnlyWayCopy(text) {
  return /\b(the\s+)?only way\b/i.test(text);
}

function hasNearbyPortraitInstructionCopy(text) {
  return (
    /hold(?:ing)? (?:the device|your (?:iphone|phone|device)|it) in portrait/i.test(
      text,
    ) || /hold in portrait/i.test(text)
  );
}

function scanNearbyOnlyWay(files) {
  const out = [];
  for (const f of files) {
    if (/data-nearby-only/.test(f.text)) {
      out.push(hit(f.path, "nearby interaction as the only way to perform a task"));
      continue;
    }
    if (!hasNearby(f.text)) continue;
    if (hasNearbyOnlyWayCopy(f.text)) {
      out.push(hit(f.path, "nearby interaction as the only way to perform a task"));
    }
  }
  return out;
}

function applyNearbyOnlyWay(text) {
  return text.replace(/\s*data-nearby-only(?:="[^"]*")?/g, "");
}

function scanNearbyPortraitInstruction(files) {
  const out = [];
  for (const f of files) {
    if (/data-nearby-portrait/.test(f.text)) {
      out.push(hit(f.path, "explicit instruction to hold the device in portrait"));
      continue;
    }
    if (!hasNearby(f.text)) continue;
    if (hasNearbyPortraitInstructionCopy(f.text)) {
      out.push(hit(f.path, "explicit instruction to hold the device in portrait"));
    }
  }
  return out;
}

function applyNearbyPortraitInstruction(text) {
  return text.replace(/\s*data-nearby-portrait(?:="[^"]*")?/g, "");
}

function hasActivityRings(text) {
  return (
    /\bdata-activity-rings\b/.test(text) ||
    /\bHKActivityRingView\b/.test(text) ||
    /\bWKInterfaceActivityRing\b/.test(text)
  );
}

function hasActivityRingsOtherDataCopy(text) {
  return (
    /other types of data/i.test(text) ||
    /\b(sales|revenue) ring\b/i.test(text)
  );
}

function hasActivityRingsMultiPersonCopy(text) {
  return /more than one person/i.test(text);
}

function scanActivityRingsOtherData(files) {
  const out = [];
  for (const f of files) {
    if (/data-activity-rings-other/.test(f.text)) {
      out.push(hit(f.path, "activity rings used for other types of data"));
      continue;
    }
    if (!hasActivityRings(f.text)) continue;
    if (hasActivityRingsOtherDataCopy(f.text)) {
      out.push(hit(f.path, "activity rings used for other types of data"));
    }
  }
  return out;
}

function applyActivityRingsOtherData(text) {
  return text.replace(/\s*data-activity-rings-other(?:="[^"]*")?/g, "");
}

function scanActivityRingsMultiPerson(files) {
  const out = [];
  for (const f of files) {
    if (/data-activity-rings-multi/.test(f.text)) {
      out.push(hit(f.path, "activity rings used for more than one person"));
      continue;
    }
    if (!hasActivityRings(f.text)) continue;
    if (hasActivityRingsMultiPersonCopy(f.text)) {
      out.push(hit(f.path, "activity rings used for more than one person"));
    }
  }
  return out;
}

function applyActivityRingsMultiPerson(text) {
  return text.replace(/\s*data-activity-rings-multi(?:="[^"]*")?/g, "");
}

function scanActivityRingsRecolor(files) {
  const out = [];
  for (const f of files) {
    if (/data-activity-rings-recolor/.test(f.text)) {
      out.push(hit(f.path, "recolored activity rings"));
    }
  }
  return out;
}

function applyActivityRingsRecolor(text) {
  return text.replace(/\s*data-activity-rings-recolor(?:="[^"]*")?/g, "");
}

function scanActivityRingsDecoration(files) {
  const out = [];
  for (const f of files) {
    if (/data-activity-rings-decor/.test(f.text)) {
      out.push(hit(f.path, "activity rings used for decoration or branding"));
    }
  }
  return out;
}

function applyActivityRingsDecoration(text) {
  return text.replace(/\s*data-activity-rings-decor(?:="[^"]*")?/g, "");
}

function hasNfc(text) {
  return (
    /\bdata-nfc\b/.test(text) ||
    /\bNFCNDEFReaderSession\b/.test(text) ||
    /\bNFCTagReaderSession\b/.test(text) ||
    /\bNFCReaderSession\b/.test(text) ||
    /\bCoreNFC\b/.test(text)
  );
}

function hasNfcContactCopy(text) {
  return (
    /\btap or touch\b/i.test(text) ||
    /\btap(?:ping)? (?:your|the) (?:phone|iphone|device)\b/i.test(text) ||
    /\btouch(?:ing)? (?:your|the) (?:phone|iphone|device|tag)\b/i.test(text) ||
    /\b(?:tap|touch) to scan\b/i.test(text)
  );
}

function hasNfcJargonCopy(text) {
  return (
    /\bNFC tag\b/.test(text) ||
    /\bCore NFC\b/.test(text) ||
    /\bNear[- ]field communication\b/i.test(text)
  );
}

function scanNfcContact(files) {
  const out = [];
  for (const f of files) {
    if (/data-nfc-contact/.test(f.text)) {
      out.push(hit(f.path, "tap or touch used to ask people to scan"));
      continue;
    }
    if (!hasNfc(f.text)) continue;
    if (hasNfcContactCopy(f.text)) {
      out.push(hit(f.path, "tap or touch used to ask people to scan"));
    }
  }
  return out;
}

function applyNfcContact(text) {
  return text.replace(/\s*data-nfc-contact(?:="[^"]*")?/g, "");
}

function scanNfcJargon(files) {
  const out = [];
  for (const f of files) {
    if (/data-nfc-jargon/.test(f.text)) {
      out.push(
        hit(f.path, "nfc, core nfc, near-field communication, or nfc tag in user-facing copy"),
      );
      continue;
    }
    if (!hasNfc(f.text)) continue;
    if (hasNfcJargonCopy(f.text)) {
      out.push(
        hit(f.path, "nfc, core nfc, near-field communication, or nfc tag in user-facing copy"),
      );
    }
  }
  return out;
}

function applyNfcJargon(text) {
  return text.replace(/\s*data-nfc-jargon(?:="[^"]*")?/g, "");
}

function hasAr(text) {
  return (
    /\bdata-ar\b/.test(text) ||
    /\bARView\b/.test(text) ||
    /\bARSCNView\b/.test(text) ||
    /\bARQuickLookPreviewing\b/.test(text) ||
    /\brel=["']ar["']/.test(text)
  );
}

function hasArJargonCopy(text) {
  return (
    /world detection/i.test(text) ||
    /adjust tracking/i.test(text) ||
    /anchor an object/i.test(text) ||
    /find a plane/i.test(text)
  );
}

function hasArGlyphMisusedCopy(text) {
  return (
    /not created using ARKit/i.test(text) ||
    /not created with ARKit/i.test(text) ||
    /\bnon-ARKit\b/i.test(text)
  );
}

function scanArJargon(files) {
  const out = [];
  for (const f of files) {
    if (/data-ar-jargon/.test(f.text)) {
      out.push(
        hit(f.path, "world detection, adjust tracking, or plane to anchor in user-facing copy"),
      );
      continue;
    }
    if (!hasAr(f.text)) continue;
    if (hasArJargonCopy(f.text)) {
      out.push(
        hit(f.path, "world detection, adjust tracking, or plane to anchor in user-facing copy"),
      );
    }
  }
  return out;
}

function applyArJargon(text) {
  return text.replace(/\s*data-ar-jargon(?:="[^"]*")?/g, "");
}

function scanArGlyphMisused(files) {
  const out = [];
  for (const f of files) {
    if (/data-ar-altered/.test(f.text) || /data-ar-non-arkit/.test(f.text)) {
      out.push(
        hit(f.path, "altered ar glyph or ar badge, or used for a non-arkit experience"),
      );
      continue;
    }
    if (!hasAr(f.text)) continue;
    if (hasArGlyphMisusedCopy(f.text)) {
      out.push(
        hit(f.path, "altered ar glyph or ar badge, or used for a non-arkit experience"),
      );
    }
  }
  return out;
}

function applyArGlyphMisused(text) {
  return text
    .replace(/\s*data-ar-altered(?:="[^"]*")?/g, "")
    .replace(/\s*data-ar-non-arkit(?:="[^"]*")?/g, "");
}

function hasTapToPay(text) {
  return (
    /\bdata-tap-to-pay\b/.test(text) ||
    /\bProximityReader\b/.test(text) ||
    /\bPaymentCardReader\b/.test(text) ||
    /\bPaymentCardReaderSession\b/.test(text)
  );
}

function hasTtpAppleLogoCopy(text) {
  return /apple logo/i.test(text);
}

function hasTtpNonpaymentCopy(text) {
  const paymentLabel = /Tap to Pay(?: on iPhone)?/i.test(text);
  const nonpayment = /\bLook Up\b|\bStore Card\b|\bVerify\b|\bRefund\b|\bloyalty\b/i.test(
    text,
  );
  return paymentLabel && nonpayment;
}

function scanTtpAppleLogo(files) {
  const out = [];
  for (const f of files) {
    if (/data-ttp-apple-logo/.test(f.text)) {
      out.push(hit(f.path, "apple logo in a tap to pay button"));
      continue;
    }
    if (!hasTapToPay(f.text)) continue;
    if (hasTtpAppleLogoCopy(f.text)) {
      out.push(hit(f.path, "apple logo in a tap to pay button"));
    }
  }
  return out;
}

function applyTtpAppleLogo(text) {
  return text.replace(/\s*data-ttp-apple-logo(?:="[^"]*")?/g, "");
}

function scanTtpNonpaymentLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-ttp-nonpayment/.test(f.text)) {
      out.push(
        hit(
          f.path,
          "tap to pay or tap to pay on iphone on a look up, store card, verify, refund, or loyalty button",
        ),
      );
      continue;
    }
    if (!hasTapToPay(f.text)) continue;
    if (hasTtpNonpaymentCopy(f.text)) {
      out.push(
        hit(
          f.path,
          "tap to pay or tap to pay on iphone on a look up, store card, verify, refund, or loyalty button",
        ),
      );
    }
  }
  return out;
}

function applyTtpNonpaymentLabel(text) {
  return text.replace(/\s*data-ttp-nonpayment(?:="[^"]*")?/g, "");
}

function hasIdVerifier(text) {
  return (
    /\bdata-id-verifier\b/.test(text) ||
    /\bMobileDriversLicenseDisplayRequest\b/.test(text) ||
    /\bMobileDriversLicenseDataRequest\b/.test(text) ||
    /\bMobileDriversLicenseRawDataRequest\b/.test(text)
  );
}

function hasIdvAppleLogoCopy(text) {
  return /apple logo/i.test(text);
}

function hasIdvCommSymbolCopy(text) {
  return /\bNFC\b|\bQR codes?\b/i.test(text);
}

function scanIdvAppleLogo(files) {
  const out = [];
  for (const f of files) {
    if (/data-idv-apple-logo/.test(f.text)) {
      out.push(hit(f.path, "apple logo in an id verifier button"));
      continue;
    }
    if (!hasIdVerifier(f.text)) continue;
    if (hasIdvAppleLogoCopy(f.text)) {
      out.push(hit(f.path, "apple logo in an id verifier button"));
    }
  }
  return out;
}

function applyIdvAppleLogo(text) {
  return text.replace(/\s*data-idv-apple-logo(?:="[^"]*")?/g, "");
}

function scanIdvCommSymbol(files) {
  const out = [];
  for (const f of files) {
    if (/data-idv-comm-symbol/.test(f.text)) {
      out.push(
        hit(
          f.path,
          "nfc or qr communication symbol on a verify age or verify identity button",
        ),
      );
      continue;
    }
    if (!hasIdVerifier(f.text)) continue;
    if (hasIdvCommSymbolCopy(f.text)) {
      out.push(
        hit(
          f.path,
          "nfc or qr communication symbol on a verify age or verify identity button",
        ),
      );
    }
  }
  return out;
}

function applyIdvCommSymbol(text) {
  return text.replace(/\s*data-idv-comm-symbol(?:="[^"]*")?/g, "");
}

function hasIap(text) {
  return (
    /\bdata-in-app-purchase\b/.test(text) ||
    /\bStoreKit\b/.test(text) ||
    /\bSKPaymentQueue\b/.test(text) ||
    /\bProduct\.purchase\b/.test(text)
  );
}

function hasIapConfirmCopy(text) {
  return /confirmation sheet/i.test(text);
}

function hasIapRefundBuriedCopy(text) {
  return (
    /scroll.{0,40}refund/i.test(text) ||
    /refund.{0,40}(another screen|extra screen|next screen)/i.test(text)
  );
}

function hasIapRefundPolicyCopy(text) {
  return /refund polic/i.test(text) || /you'll receive the refund/i.test(text);
}

function scanIapConfirmSheet(files) {
  const out = [];
  for (const f of files) {
    if (/data-iap-confirm-sheet/.test(f.text)) {
      out.push(hit(f.path, "modified or replicated system confirmation sheet"));
      continue;
    }
    if (!hasIap(f.text)) continue;
    if (hasIapConfirmCopy(f.text)) {
      out.push(hit(f.path, "modified or replicated system confirmation sheet"));
    }
  }
  return out;
}

function applyIapConfirmSheet(text) {
  return text.replace(/\s*data-iap-confirm-sheet(?:="[^"]*")?/g, "");
}

function scanIapRefundBuried(files) {
  const out = [];
  for (const f of files) {
    if (/data-iap-refund-buried/.test(f.text)) {
      out.push(
        hit(f.path, "refund-request button hidden behind a scroll or extra screen"),
      );
      continue;
    }
    if (!hasIap(f.text)) continue;
    if (hasIapRefundBuriedCopy(f.text)) {
      out.push(
        hit(f.path, "refund-request button hidden behind a scroll or extra screen"),
      );
    }
  }
  return out;
}

function applyIapRefundBuried(text) {
  return text.replace(/\s*data-iap-refund-buried(?:="[^"]*")?/g, "");
}

function scanIapRefundPolicy(files) {
  const out = [];
  for (const f of files) {
    if (/data-iap-refund-policy/.test(f.text)) {
      out.push(
        hit(f.path, "apple refund policies characterized in user-facing copy"),
      );
      continue;
    }
    if (!hasIap(f.text)) continue;
    if (hasIapRefundPolicyCopy(f.text)) {
      out.push(
        hit(f.path, "apple refund policies characterized in user-facing copy"),
      );
    }
  }
  return out;
}

function applyIapRefundPolicy(text) {
  return text.replace(/\s*data-iap-refund-policy(?:="[^"]*")?/g, "");
}

function hasMap(text) {
  return (
    /\bdata-map\b/.test(text) ||
    /\bMKMapView\b/.test(text) ||
    /\bMapKit\b/.test(text) ||
    /\bmapkit\.Map\b/.test(text)
  );
}

function hasMapCoverCopy(text) {
  return /legal link/i.test(text) && /cover/i.test(text);
}

function hasMapReplicaCopy(text) {
  return /replicat/i.test(text) && /apple maps/i.test(text);
}

function scanMapCoverLegal(files) {
  const out = [];
  for (const f of files) {
    if (/data-mapkit-cover-logo/.test(f.text)) {
      out.push(hit(f.path, "maps legal link covered all the time"));
      continue;
    }
    if (!hasMap(f.text)) continue;
    if (hasMapCoverCopy(f.text)) {
      out.push(hit(f.path, "maps legal link covered all the time"));
    }
  }
  return out;
}

function applyMapCoverLegal(text) {
  return text.replace(/\s*data-mapkit-cover-logo(?:="[^"]*")?/g, "");
}

function scanMapReplicaApple(files) {
  const out = [];
  for (const f of files) {
    if (/data-mapkit-replica/.test(f.text)) {
      out.push(hit(f.path, "indoor map that replicates apple maps"));
      continue;
    }
    if (!hasMap(f.text)) continue;
    if (hasMapReplicaCopy(f.text)) {
      out.push(hit(f.path, "indoor map that replicates apple maps"));
    }
  }
  return out;
}

function applyMapReplicaApple(text) {
  return text.replace(/\s*data-mapkit-replica(?:="[^"]*")?/g, "");
}

function hasHomekit(text) {
  return (
    /\bdata-homekit\b/.test(text) ||
    /\bHMHomeManager\b/.test(text) ||
    /\bHMAccessory\b/.test(text) ||
    /\bHMHome\b/.test(text)
  );
}

function hasHkCompanyNameCopy(text) {
  return (
    (/company names?/i.test(text) && /service names?/i.test(text)) ||
    (/model numbers?/i.test(text) && /service names?/i.test(text)) ||
    /suggested as a siri service name/i.test(text)
  );
}

function hasHkOverwriteCopy(text) {
  return /overwrite/i.test(text) && /homekit database/i.test(text);
}

function hasHkDupSettingsCopy(text) {
  return /duplicate/i.test(text) && /home settings/i.test(text);
}

function hasHkCoverCameraCopy(text) {
  return (
    (/block/i.test(text) && /camera images?/i.test(text)) ||
    (/cover/i.test(text) && /camera(?:'s)? images?/i.test(text))
  );
}

function scanHkCompanyName(files) {
  const out = [];
  for (const f of files) {
    if (/data-hk-company-name/.test(f.text)) {
      out.push(hit(f.path, "company names or model numbers as siri service names"));
      continue;
    }
    if (!hasHomekit(f.text)) continue;
    if (hasHkCompanyNameCopy(f.text)) {
      out.push(hit(f.path, "company names or model numbers as siri service names"));
    }
  }
  return out;
}

function applyHkCompanyName(text) {
  return text.replace(/\s*data-hk-company-name(?:="[^"]*")?/g, "");
}

function scanHkOverwriteDb(files) {
  const out = [];
  for (const f of files) {
    if (/data-hk-overwrite-db/.test(f.text)) {
      out.push(hit(f.path, "homekit database overwritten without direction"));
      continue;
    }
    if (!hasHomekit(f.text)) continue;
    if (hasHkOverwriteCopy(f.text)) {
      out.push(hit(f.path, "homekit database overwritten without direction"));
    }
  }
  return out;
}

function applyHkOverwriteDb(text) {
  return text.replace(/\s*data-hk-overwrite-db(?:="[^"]*")?/g, "");
}

function scanHkDupSettings(files) {
  const out = [];
  for (const f of files) {
    if (/data-hk-dup-settings/.test(f.text)) {
      out.push(hit(f.path, "duplicate home settings"));
      continue;
    }
    if (!hasHomekit(f.text)) continue;
    if (hasHkDupSettingsCopy(f.text)) {
      out.push(hit(f.path, "duplicate home settings"));
    }
  }
  return out;
}

function applyHkDupSettings(text) {
  return text.replace(/\s*data-hk-dup-settings(?:="[^"]*")?/g, "");
}

function scanHkCoverCamera(files) {
  const out = [];
  for (const f of files) {
    if (/data-hk-cover-camera/.test(f.text)) {
      out.push(hit(f.path, "camera images blocked"));
      continue;
    }
    if (!hasHomekit(f.text)) continue;
    if (hasHkCoverCameraCopy(f.text)) {
      out.push(hit(f.path, "camera images blocked"));
    }
  }
  return out;
}

function applyHkCoverCamera(text) {
  return text.replace(/\s*data-hk-cover-camera(?:="[^"]*")?/g, "");
}

function hasWorkout(text) {
  return (
    /\bdata-workout\b/.test(text) ||
    /\bHKWorkoutSession\b/.test(text) ||
    /\bHKWorkout\b/.test(text) ||
    /\bWorkoutKit\b/.test(text)
  );
}

function hasWkDistractCopy(text) {
  return (
    (/distract/i.test(text) && /workout/i.test(text)) ||
    (/list of workouts/i.test(text) && /active/i.test(text))
  );
}

function hasWkBriefCopy(text) {
  return (
    /extremely brief/i.test(text) ||
    (/few seconds/i.test(text) && /session/i.test(text))
  );
}

function scanWkDistract(files) {
  const out = [];
  for (const f of files) {
    if (/data-wk-distract/.test(f.text)) {
      out.push(hit(f.path, "distracting chrome during an active workout"));
      continue;
    }
    if (!hasWorkout(f.text)) continue;
    if (hasWkDistractCopy(f.text)) {
      out.push(hit(f.path, "distracting chrome during an active workout"));
    }
  }
  return out;
}

function applyWkDistract(text) {
  return text.replace(/\s*data-wk-distract(?:="[^"]*")?/g, "");
}

function scanWkBriefSession(files) {
  const out = [];
  for (const f of files) {
    if (/data-wk-brief-session/.test(f.text)) {
      out.push(hit(f.path, "extremely brief workout sessions recorded"));
      continue;
    }
    if (!hasWorkout(f.text)) continue;
    if (hasWkBriefCopy(f.text)) {
      out.push(hit(f.path, "extremely brief workout sessions recorded"));
    }
  }
  return out;
}

function applyWkBriefSession(text) {
  return text.replace(/\s*data-wk-brief-session(?:="[^"]*")?/g, "");
}

function hasLivePhoto(text) {
  return (
    /\bdata-live-photo\b/.test(text) ||
    /\bPHLivePhotoView\b/.test(text) ||
    /\bPHLivePhoto\b/.test(text)
  );
}

function hasLpDisassembleCopy(text) {
  return (
    /frames or audio/i.test(text) ||
    (/disassemble/i.test(text) && /live photo/i.test(text))
  );
}

function hasLpPlaybackCopy(text) {
  return /video playback button/i.test(text);
}

function hasLpUnsupportedCopy(text) {
  return (
    /unsupported environment/i.test(text) ||
    (/replicat/i.test(text) && /live photos? experience/i.test(text))
  );
}

function scanLpDisassemble(files) {
  const out = [];
  for (const f of files) {
    if (/data-lp-disassemble/.test(f.text)) {
      out.push(hit(f.path, "live photo frames or audio presented separately"));
      continue;
    }
    if (!hasLivePhoto(f.text)) continue;
    if (hasLpDisassembleCopy(f.text)) {
      out.push(hit(f.path, "live photo frames or audio presented separately"));
    }
  }
  return out;
}

function applyLpDisassemble(text) {
  return text.replace(/\s*data-lp-disassemble(?:="[^"]*")?/g, "");
}

function scanLpPlaybackButton(files) {
  const out = [];
  for (const f of files) {
    if (/data-lp-playback-button/.test(f.text)) {
      out.push(hit(f.path, "video playback button on a live photo"));
      continue;
    }
    if (!hasLivePhoto(f.text)) continue;
    if (hasLpPlaybackCopy(f.text)) {
      out.push(hit(f.path, "video playback button on a live photo"));
    }
  }
  return out;
}

function applyLpPlaybackButton(text) {
  return text.replace(/\s*data-lp-playback-button(?:="[^"]*")?/g, "");
}

function scanLpUnsupportedReplica(files) {
  const out = [];
  for (const f of files) {
    if (/data-lp-unsupported-replica/.test(f.text)) {
      out.push(hit(f.path, "live photos experience replicated in an unsupported environment"));
      continue;
    }
    if (!hasLivePhoto(f.text)) continue;
    if (hasLpUnsupportedCopy(f.text)) {
      out.push(hit(f.path, "live photos experience replicated in an unsupported environment"));
    }
  }
  return out;
}

function applyLpUnsupportedReplica(text) {
  return text.replace(/\s*data-lp-unsupported-replica(?:="[^"]*")?/g, "");
}

function hasIcloud(text) {
  return (
    /\bdata-icloud\b/.test(text) ||
    /\bCKContainer\b/.test(text) ||
    /\bNSUbiquitousKeyValueStore\b/.test(text)
  );
}

function hasIcAskDocsCopy(text) {
  return /which documents to keep/i.test(text);
}

function hasIcUnavailableCopy(text) {
  return (
    /icloud is unavailable/i.test(text) ||
    (/airplane mode/i.test(text) && /alert/i.test(text))
  );
}

function hasIcAppResourcesCopy(text) {
  return /app resources/i.test(text) && /icloud/i.test(text);
}

function scanIcAskDocs(files) {
  const out = [];
  for (const f of files) {
    if (/data-ic-ask-docs/.test(f.text)) {
      out.push(hit(f.path, "asking which documents to keep in icloud"));
      continue;
    }
    if (!hasIcloud(f.text)) continue;
    if (hasIcAskDocsCopy(f.text)) {
      out.push(hit(f.path, "asking which documents to keep in icloud"));
    }
  }
  return out;
}

function applyIcAskDocs(text) {
  return text.replace(/\s*data-ic-ask-docs(?:="[^"]*")?/g, "");
}

function scanIcUnavailableAlert(files) {
  const out = [];
  for (const f of files) {
    if (/data-ic-unavailable-alert/.test(f.text)) {
      out.push(hit(f.path, "alert when icloud is unavailable"));
      continue;
    }
    if (!hasIcloud(f.text)) continue;
    if (hasIcUnavailableCopy(f.text)) {
      out.push(hit(f.path, "alert when icloud is unavailable"));
    }
  }
  return out;
}

function applyIcUnavailableAlert(text) {
  return text.replace(/\s*data-ic-unavailable-alert(?:="[^"]*")?/g, "");
}

function scanIcAppResources(files) {
  const out = [];
  for (const f of files) {
    if (/data-ic-app-resources/.test(f.text)) {
      out.push(hit(f.path, "app resources stored in icloud"));
      continue;
    }
    if (!hasIcloud(f.text)) continue;
    if (hasIcAppResourcesCopy(f.text)) {
      out.push(hit(f.path, "app resources stored in icloud"));
    }
  }
  return out;
}

function applyIcAppResources(text) {
  return text.replace(/\s*data-ic-app-resources(?:="[^"]*")?/g, "");
}

function hasSiri(text) {
  return (
    /\bdata-siri\b/.test(text) ||
    /\bINInteraction\b/.test(text) ||
    /\bSiriKit\b/.test(text)
  );
}

function hasSiAdvertiseCopy(text) {
  return (
    /advertisements? or iap/i.test(text) ||
    ((/advertisement/i.test(text) || /marketing/i.test(text)) && /siri/i.test(text)) ||
    (/in-app purchase/i.test(text) && /pitch/i.test(text) && /siri/i.test(text))
  );
}

function hasSiImpersonateCopy(text) {
  return (
    /impersonated siri/i.test(text) ||
    /hey siri/i.test(text) ||
    /call 911/i.test(text) ||
    (/appears to come from apple/i.test(text) && /siri/i.test(text))
  );
}

function hasSiPronounCopy(text) {
  return /\bSiri\b/.test(text) && /\b(she|he|him|her)\b/i.test(text);
}

function scanSiAdvertise(files) {
  const out = [];
  for (const f of files) {
    if (/data-si-advertise/.test(f.text)) {
      out.push(hit(f.path, "advertisements or iap pitches in siri-delivered content"));
      continue;
    }
    if (!hasSiri(f.text)) continue;
    if (hasSiAdvertiseCopy(f.text)) {
      out.push(hit(f.path, "advertisements or iap pitches in siri-delivered content"));
    }
  }
  return out;
}

function applySiAdvertise(text) {
  return text.replace(/\s*data-si-advertise(?:="[^"]*")?/g, "");
}

function scanSiImpersonate(files) {
  const out = [];
  for (const f of files) {
    if (/data-si-impersonate/.test(f.text)) {
      out.push(hit(f.path, "impersonated siri or reserved phrases"));
      continue;
    }
    if (!hasSiri(f.text)) continue;
    if (hasSiImpersonateCopy(f.text)) {
      out.push(hit(f.path, "impersonated siri or reserved phrases"));
    }
  }
  return out;
}

function applySiImpersonate(text) {
  return text.replace(/\s*data-si-impersonate(?:="[^"]*")?/g, "");
}

function scanSiPronoun(files) {
  const out = [];
  for (const f of files) {
    if (/data-si-pronoun/.test(f.text)) {
      out.push(hit(f.path, "siri referred to with she, he, or her"));
      continue;
    }
    if (!hasSiri(f.text)) continue;
    if (hasSiPronounCopy(f.text)) {
      out.push(hit(f.path, "siri referred to with she, he, or her"));
    }
  }
  return out;
}

function applySiPronoun(text) {
  return text.replace(/\s*data-si-pronoun(?:="[^"]*")?/g, "");
}

function hasAppShortcut(text) {
  return (
    /\bdata-app-shortcuts\b/.test(text) ||
    /\bAppShortcutsProvider\b/.test(text) ||
    /\bSiriTipUIView\b/.test(text)
  );
}

function hasAsReskinCopy(text) {
  return (
    /re-skin/i.test(text) ||
    /shortcuts editor/i.test(text) ||
    (/reskin/i.test(text) && /siri|shortcuts/i.test(text))
  );
}

function hasAsLowercaseCopy(text) {
  return /app shortcuts/.test(text) || /the shortcuts app/.test(text);
}

function hasAsTitleItemCopy(text) {
  return (
    /written in title case/i.test(text) ||
    (/\bShortcut\b/.test(text) &&
      !/\bApp Shortcuts\b/.test(text) &&
      !/\bShortcuts\b/.test(text))
  );
}

function scanAsReskin(files) {
  const out = [];
  for (const f of files) {
    if (/data-as-reskin/.test(f.text)) {
      out.push(hit(f.path, "re-skin siri or shortcuts editor chrome"));
      continue;
    }
    if (!hasAppShortcut(f.text)) continue;
    if (hasAsReskinCopy(f.text)) {
      out.push(hit(f.path, "re-skin siri or shortcuts editor chrome"));
    }
  }
  return out;
}

function applyAsReskin(text) {
  return text.replace(/\s*data-as-reskin(?:="[^"]*")?/g, "");
}

function scanAsLowercase(files) {
  const out = [];
  for (const f of files) {
    if (/data-as-lowercase/.test(f.text)) {
      out.push(hit(f.path, "app shortcuts or shortcuts written in lowercase"));
      continue;
    }
    if (!hasAppShortcut(f.text)) continue;
    if (hasAsLowercaseCopy(f.text)) {
      out.push(hit(f.path, "app shortcuts or shortcuts written in lowercase"));
    }
  }
  return out;
}

function applyAsLowercase(text) {
  return text.replace(/\s*data-as-lowercase(?:="[^"]*")?/g, "");
}

function scanAsTitleItem(files) {
  const out = [];
  for (const f of files) {
    if (/data-as-title-item/.test(f.text)) {
      out.push(hit(f.path, "individual shortcuts written in title case"));
      continue;
    }
    if (!hasAppShortcut(f.text)) continue;
    if (hasAsTitleItemCopy(f.text)) {
      out.push(hit(f.path, "individual shortcuts written in title case"));
    }
  }
  return out;
}

function applyAsTitleItem(text) {
  return text.replace(/\s*data-as-title-item(?:="[^"]*")?/g, "");
}

function hasHealthKit(text) {
  return (
    /\bdata-healthkit\b/.test(text) ||
    /\bHKHealthStore\b/.test(text) ||
    /\bHKQuantityTypeIdentifier\b/.test(text)
  );
}

function hasHltReplicaCopy(text) {
  return (
    (/replicat/i.test(text) && /permission/i.test(text)) ||
    /custom (health )?permission screen/i.test(text)
  );
}

function hasHltSharingCopy(text) {
  return (
    /health data sharing/i.test(text) ||
    (/additional screens/i.test(text) && /health/i.test(text))
  );
}

function hasHltTermCopy(text) {
  return (
    /the term HealthKit/i.test(text) ||
    />[^<]*\bHealthKit\b[^<]*</.test(text) ||
    /["'][^"']*\bHealthKit\b[^"']*["']/.test(text)
  );
}

function scanHltReplica(files) {
  const out = [];
  for (const f of files) {
    if (/data-hlt-replica/.test(f.text)) {
      out.push(hit(f.path, "custom screens that replicate the health permission screen"));
      continue;
    }
    if (!hasHealthKit(f.text)) continue;
    if (hasHltReplicaCopy(f.text)) {
      out.push(hit(f.path, "custom screens that replicate the health permission screen"));
    }
  }
  return out;
}

function applyHltReplica(text) {
  return text.replace(/\s*data-hlt-replica(?:="[^"]*")?/g, "");
}

function scanHltSharing(files) {
  const out = [];
  for (const f of files) {
    if (/data-hlt-sharing/.test(f.text)) {
      out.push(hit(f.path, "in-app screens that manage health data sharing"));
      continue;
    }
    if (!hasHealthKit(f.text)) continue;
    if (hasHltSharingCopy(f.text)) {
      out.push(hit(f.path, "in-app screens that manage health data sharing"));
    }
  }
  return out;
}

function applyHltSharing(text) {
  return text.replace(/\s*data-hlt-sharing(?:="[^"]*")?/g, "");
}

function scanHltTerm(files) {
  const out = [];
  for (const f of files) {
    if (/data-hlt-term/.test(f.text)) {
      out.push(hit(f.path, "the term healthkit in user-facing copy"));
      continue;
    }
    if (!hasHealthKit(f.text)) continue;
    if (hasHltTermCopy(f.text)) {
      out.push(hit(f.path, "the term healthkit in user-facing copy"));
    }
  }
  return out;
}

function applyHltTerm(text) {
  return text.replace(/\s*data-hlt-term(?:="[^"]*")?/g, "");
}

function hasCarPlay(text) {
  return (
    /\bdata-carplay\b/.test(text) ||
    /\bCPInterfaceController\b/.test(text) ||
    /\bCPTemplateApplicationScene\b/.test(text)
  );
}

function hasCpIphoneLockCopy(text) {
  return (
    /iphone requires input/i.test(text) ||
    /locked out of carplay/i.test(text) ||
    (/unlock iphone/i.test(text) && /carplay/i.test(text))
  );
}

function hasCpIphoneErrorCopy(text) {
  return (
    /errors reported on iphone/i.test(text) ||
    (/pick up (their |the )?iphone/i.test(text) && /error|resolve/i.test(text)) ||
    (/report(ed)? errors? on (the connected )?iphone/i.test(text))
  );
}

function hasCpIphoneInteractCopy(text) {
  return (
    /iphone interactions? required/i.test(text) ||
    (/setup on iphone/i.test(text) && /carplay|vehicle|motion/i.test(text)) ||
    /app interactions on iphone/i.test(text)
  );
}

function scanCpIphoneLock(files) {
  const out = [];
  for (const f of files) {
    if (/data-cp-iphone-lock/.test(f.text)) {
      out.push(hit(f.path, "carplay locked out because iphone requires input"));
      continue;
    }
    if (!hasCarPlay(f.text)) continue;
    if (hasCpIphoneLockCopy(f.text)) {
      out.push(hit(f.path, "carplay locked out because iphone requires input"));
    }
  }
  return out;
}

function applyCpIphoneLock(text) {
  return text.replace(/\s*data-cp-iphone-lock(?:="[^"]*")?/g, "");
}

function scanCpIphoneError(files) {
  const out = [];
  for (const f of files) {
    if (/data-cp-iphone-error/.test(f.text)) {
      out.push(hit(f.path, "errors reported on iphone instead of carplay"));
      continue;
    }
    if (!hasCarPlay(f.text)) continue;
    if (hasCpIphoneErrorCopy(f.text)) {
      out.push(hit(f.path, "errors reported on iphone instead of carplay"));
    }
  }
  return out;
}

function applyCpIphoneError(text) {
  return text.replace(/\s*data-cp-iphone-error(?:="[^"]*")?/g, "");
}

function scanCpIphoneInteract(files) {
  const out = [];
  for (const f of files) {
    if (/data-cp-iphone-interact/.test(f.text)) {
      out.push(hit(f.path, "iphone interactions required while carplay is active"));
      continue;
    }
    if (!hasCarPlay(f.text)) continue;
    if (hasCpIphoneInteractCopy(f.text)) {
      out.push(hit(f.path, "iphone interactions required while carplay is active"));
    }
  }
  return out;
}

function applyCpIphoneInteract(text) {
  return text.replace(/\s*data-cp-iphone-interact(?:="[^"]*")?/g, "");
}

function hasSiwa(text) {
  return (
    /\bdata-siwa\b/.test(text) ||
    /\bSignInWithAppleButton\b/.test(text) ||
    /\bASAuthorizationAppleIDButton\b/.test(text)
  );
}

function hasSiaPasswordCopy(text) {
  return (
    /password asked for/i.test(text) ||
    /ask(ed|ing)? (people )?for a password/i.test(text) ||
    /supply a password/i.test(text) ||
    /create a password/i.test(text)
  );
}

function hasSiaEmailCopy(text) {
  return (
    /personal email asked/i.test(text) ||
    /personal email address/i.test(text) ||
    (/private relay/i.test(text) && /email/i.test(text) && /ask|enter|provide|supply/i.test(text))
  );
}

function hasSiaLogoCopy(text) {
  return (
    /custom apple logo/i.test(text) ||
    /create a custom apple logo/i.test(text) ||
    (/apple logo/i.test(text) && /draw|invent|recreat/i.test(text))
  );
}

function scanSiaPassword(files) {
  const out = [];
  for (const f of files) {
    if (/data-sia-password/.test(f.text)) {
      out.push(hit(f.path, "a password asked for alongside sign in with apple"));
      continue;
    }
    if (!hasSiwa(f.text)) continue;
    if (hasSiaPasswordCopy(f.text)) {
      out.push(hit(f.path, "a password asked for alongside sign in with apple"));
    }
  }
  return out;
}

function applySiaPassword(text) {
  return text.replace(/\s*data-sia-password(?:="[^"]*")?/g, "");
}

function scanSiaEmail(files) {
  const out = [];
  for (const f of files) {
    if (/data-sia-email/.test(f.text)) {
      out.push(hit(f.path, "a personal email asked for when a private relay address is used"));
      continue;
    }
    if (!hasSiwa(f.text)) continue;
    if (hasSiaEmailCopy(f.text)) {
      out.push(hit(f.path, "a personal email asked for when a private relay address is used"));
    }
  }
  return out;
}

function applySiaEmail(text) {
  return text.replace(/\s*data-sia-email(?:="[^"]*")?/g, "");
}

function scanSiaLogo(files) {
  const out = [];
  for (const f of files) {
    if (/data-sia-logo/.test(f.text)) {
      out.push(hit(f.path, "a custom apple logo on the sign in with apple button"));
      continue;
    }
    if (!hasSiwa(f.text)) continue;
    if (hasSiaLogoCopy(f.text)) {
      out.push(hit(f.path, "a custom apple logo on the sign in with apple button"));
    }
  }
  return out;
}

function applySiaLogo(text) {
  return text.replace(/\s*data-sia-logo(?:="[^"]*")?/g, "");
}

function hasApplePay(text) {
  return (
    /\bdata-apple-pay\b/.test(text) ||
    /\bPKPaymentButton\b/.test(text) ||
    /\bPayWithApplePayButton\b/.test(text)
  );
}

function hasApMarkButtonCopy(text) {
  return (
    /apple pay mark used as a payment button/i.test(text) ||
    (/apple pay mark/i.test(text) && /payment button|as a button/i.test(text))
  );
}

function hasApPluralCopy(text) {
  return /Apple Pays\b/.test(text) || /Apple Pay['’]s\b/.test(text);
}

function hasApLogoWordCopy(text) {
  return (
    /apple logo used in place/i.test(text) ||
    /\s*Pay/.test(text) ||
    (/apple logo/i.test(text) && /word Apple/i.test(text))
  );
}

function scanApMarkButton(files) {
  const out = [];
  for (const f of files) {
    if (/data-ap-mark-button/.test(f.text)) {
      out.push(hit(f.path, "the apple pay mark used as a payment button"));
      continue;
    }
    if (!hasApplePay(f.text)) continue;
    if (hasApMarkButtonCopy(f.text)) {
      out.push(hit(f.path, "the apple pay mark used as a payment button"));
    }
  }
  return out;
}

function applyApMarkButton(text) {
  return text.replace(/\s*data-ap-mark-button(?:="[^"]*")?/g, "");
}

function scanApPlural(files) {
  const out = [];
  for (const f of files) {
    if (/data-ap-plural/.test(f.text)) {
      out.push(hit(f.path, "apple pay made plural or possessive"));
      continue;
    }
    if (!hasApplePay(f.text)) continue;
    if (hasApPluralCopy(f.text)) {
      out.push(hit(f.path, "apple pay made plural or possessive"));
    }
  }
  return out;
}

function applyApPlural(text) {
  return text.replace(/\s*data-ap-plural(?:="[^"]*")?/g, "");
}

function scanApLogoWord(files) {
  const out = [];
  for (const f of files) {
    if (/data-ap-logo-word/.test(f.text)) {
      out.push(hit(f.path, "the apple logo used in place of the word apple"));
      continue;
    }
    if (!hasApplePay(f.text)) continue;
    if (hasApLogoWordCopy(f.text)) {
      out.push(hit(f.path, "the apple logo used in place of the word apple"));
    }
  }
  return out;
}

function applyApLogoWord(text) {
  return text.replace(/\s*data-ap-logo-word(?:="[^"]*")?/g, "");
}

function hasPlayingAudio(text) {
  return (
    /\bdata-playing-audio\b/.test(text) ||
    /\bAVAudioSession\b/.test(text) ||
    /\bMPNowPlayingInfoCenter\b/.test(text)
  );
}

function hasAuOutputVolumeCopy(text) {
  return (
    /sets? the system output volume/i.test(text) ||
    /adjust the overall volume/i.test(text) ||
    /\.outputVolume\s*=/.test(text) ||
    /\bsetOutputVolume\b/.test(text)
  );
}

function hasAuRepurposeCopy(text) {
  return (
    /repurposed for a non-playback/i.test(text) ||
    /repurpos\w* audio controls/i.test(text) ||
    (/audio controls?/i.test(text) && /redefin/i.test(text))
  );
}

function hasAuHeadphonesCopy(text) {
  return (
    /playback continues after headphones disconnect/i.test(text) ||
    (/headphones disconnect/i.test(text) && /continue playback|keep playing|do not pause|don't pause/i.test(text))
  );
}

function scanAuOutputVolume(files) {
  const out = [];
  for (const f of files) {
    if (/data-au-output-volume/.test(f.text)) {
      out.push(hit(f.path, "the app sets the system output volume"));
      continue;
    }
    if (!hasPlayingAudio(f.text)) continue;
    if (hasAuOutputVolumeCopy(f.text)) {
      out.push(hit(f.path, "the app sets the system output volume"));
    }
  }
  return out;
}

function applyAuOutputVolume(text) {
  return text.replace(/\s*data-au-output-volume(?:="[^"]*")?/g, "");
}

function scanAuRepurpose(files) {
  const out = [];
  for (const f of files) {
    if (/data-au-repurpose/.test(f.text)) {
      out.push(hit(f.path, "audio controls repurposed for a non-playback action"));
      continue;
    }
    if (!hasPlayingAudio(f.text)) continue;
    if (hasAuRepurposeCopy(f.text)) {
      out.push(hit(f.path, "audio controls repurposed for a non-playback action"));
    }
  }
  return out;
}

function applyAuRepurpose(text) {
  return text.replace(/\s*data-au-repurpose(?:="[^"]*")?/g, "");
}

function scanAuHeadphones(files) {
  const out = [];
  for (const f of files) {
    if (/data-au-headphones/.test(f.text)) {
      out.push(hit(f.path, "playback continues after headphones disconnect"));
      continue;
    }
    if (!hasPlayingAudio(f.text)) continue;
    if (hasAuHeadphonesCopy(f.text)) {
      out.push(hit(f.path, "playback continues after headphones disconnect"));
    }
  }
  return out;
}

function applyAuHeadphones(text) {
  return text.replace(/\s*data-au-headphones(?:="[^"]*")?/g, "");
}

function hasGameCenter(text) {
  return /\bdata-game-center\b/.test(text) || /\bGKAccessPoint\b/.test(text);
}

function hasGcGameplayCopy(text) {
  return (
    /access point shown during active gameplay/i.test(text) ||
    (/during active gameplay/i.test(text) && /access point/i.test(text))
  );
}

function hasGcArtworkCopy(text) {
  return (
    /artwork resized or restyled/i.test(text) ||
    (/artwork/i.test(text) && /resized or restyled|adjust the dimensions/i.test(text))
  );
}

function hasGcTermsCopy(text) {
  return (
    /\bGameKit\b/.test(text) ||
    /\bGameCenter\b/.test(text) ||
    /\bgame center\b/.test(text) ||
    /\bAwards\b/.test(text) ||
    /\bRankings\b/.test(text)
  );
}

function scanGcGameplay(files) {
  const out = [];
  for (const f of files) {
    if (/data-gc-gameplay/.test(f.text)) {
      out.push(hit(f.path, "the access point shown during active gameplay"));
      continue;
    }
    if (!hasGameCenter(f.text)) continue;
    if (hasGcGameplayCopy(f.text)) {
      out.push(hit(f.path, "the access point shown during active gameplay"));
    }
  }
  return out;
}

function applyGcGameplay(text) {
  return text.replace(/\s*data-gc-gameplay(?:="[^"]*")?/g, "");
}

function scanGcArtwork(files) {
  const out = [];
  for (const f of files) {
    if (/data-gc-artwork/.test(f.text)) {
      out.push(hit(f.path, "official game center artwork resized or restyled"));
      continue;
    }
    if (!hasGameCenter(f.text)) continue;
    if (hasGcArtworkCopy(f.text)) {
      out.push(hit(f.path, "official game center artwork resized or restyled"));
    }
  }
  return out;
}

function applyGcArtwork(text) {
  return text.replace(/\s*data-gc-artwork(?:="[^"]*")?/g, "");
}

function scanGcTerms(files) {
  const out = [];
  for (const f of files) {
    if (/data-gc-terms/.test(f.text)) {
      out.push(hit(f.path, "custom links that say gamekit game center awards or rankings"));
      continue;
    }
    if (!hasGameCenter(f.text)) continue;
    if (hasGcTermsCopy(f.text)) {
      out.push(hit(f.path, "custom links that say gamekit game center awards or rankings"));
    }
  }
  return out;
}

function applyGcTerms(text) {
  return text.replace(/\s*data-gc-terms(?:="[^"]*")?/g, "");
}

function hasPanel(text) {
  return /\bdata-panel\b/.test(text) || /\bNSPanel\b/.test(text) || /\bdata-hud\b/.test(text);
}

function hasPnWindowMenuCopy(text) {
  return (
    /window menu documents list/i.test(text) ||
    /listed in the window menu/i.test(text) ||
    (/window menu/i.test(text) && /documents list/i.test(text))
  );
}

function hasPnMinimizeCopy(text) {
  return (
    /minimize button on a panel/i.test(text) ||
    (/panel/i.test(text) && /minimizable\s*[:=]\s*true/i.test(text)) ||
    (/panel/i.test(text) && /\bminimize button\b/i.test(text))
  );
}

function hasPnHudObscureCopy(text) {
  return (
    /obscures the content it adjusts/i.test(text) ||
    (/\bhud\b/i.test(text) && /obscur/i.test(text))
  );
}

function scanPnWindowMenu(files) {
  const out = [];
  for (const f of files) {
    if (/data-pn-window-menu/.test(f.text)) {
      out.push(hit(f.path, "a panel listed in the window menu documents list"));
      continue;
    }
    if (!hasPanel(f.text)) continue;
    if (hasPnWindowMenuCopy(f.text)) {
      out.push(hit(f.path, "a panel listed in the window menu documents list"));
    }
  }
  return out;
}

function applyPnWindowMenu(text) {
  return text.replace(/\s*data-pn-window-menu(?:="[^"]*")?/g, "");
}

function scanPnMinimize(files) {
  const out = [];
  for (const f of files) {
    if (/data-pn-minimize/.test(f.text)) {
      out.push(hit(f.path, "a minimize button on a panel"));
      continue;
    }
    if (!hasPanel(f.text)) continue;
    if (hasPnMinimizeCopy(f.text)) {
      out.push(hit(f.path, "a minimize button on a panel"));
    }
  }
  return out;
}

function applyPnMinimize(text) {
  return text.replace(/\s*data-pn-minimize(?:="[^"]*")?/g, "");
}

function scanPnHudObscure(files) {
  const out = [];
  for (const f of files) {
    if (/data-pn-hud-obscure/.test(f.text)) {
      out.push(hit(f.path, "a hud that obscures the content it adjusts"));
      continue;
    }
    if (!hasPanel(f.text)) continue;
    if (hasPnHudObscureCopy(f.text)) {
      out.push(hit(f.path, "a hud that obscures the content it adjusts"));
    }
  }
  return out;
}

function applyPnHudObscure(text) {
  return text.replace(/\s*data-pn-hud-obscure(?:="[^"]*")?/g, "");
}

function hasPathControl(text) {
  return /\bdata-path-control\b/.test(text) || /\bNSPathControl\b/.test(text);
}

function hasPcToolbarCopy(text) {
  return (
    /placed in a toolbar or status bar/i.test(text) ||
    (/path control/i.test(text) && /toolbar|status bar/i.test(text))
  );
}

function scanPcToolbar(files) {
  const out = [];
  for (const f of files) {
    if (/data-pc-toolbar/.test(f.text)) {
      out.push(hit(f.path, "a path control placed in a toolbar or status bar"));
      continue;
    }
    if (!hasPathControl(f.text)) continue;
    if (hasPcToolbarCopy(f.text)) {
      out.push(hit(f.path, "a path control placed in a toolbar or status bar"));
    }
  }
  return out;
}

function applyPcToolbar(text) {
  return text.replace(/\s*data-pc-toolbar(?:="[^"]*")?/g, "");
}

function hasOutline(text) {
  return /\bdata-outline\b/.test(text) || /\bNSOutlineView\b/.test(text);
}

function hasOvColonCopy(text) {
  return /trailing colon/i.test(text) || /column heading[^.\n]{0,40}:/.test(text);
}

function hasOvHeadingsCopy(text) {
  return (
    /no column headings/i.test(text) ||
    /omit column headings/i.test(text) ||
    (/multi-column outline/i.test(text) && /without column headings/i.test(text))
  );
}

function scanOvColon(files) {
  const out = [];
  for (const f of files) {
    if (/data-ov-colon/.test(f.text)) {
      out.push(hit(f.path, "a trailing colon on an outline column heading"));
      continue;
    }
    if (!hasOutline(f.text)) continue;
    if (hasOvColonCopy(f.text)) {
      out.push(hit(f.path, "a trailing colon on an outline column heading"));
    }
  }
  return out;
}

function applyOvColon(text) {
  return text.replace(/\s*data-ov-colon(?:="[^"]*")?/g, "");
}

function scanOvHeadings(files) {
  const out = [];
  for (const f of files) {
    if (/data-ov-headings/.test(f.text)) {
      out.push(hit(f.path, "a multi-column outline view with no column headings"));
      continue;
    }
    if (!hasOutline(f.text)) continue;
    if (hasOvHeadingsCopy(f.text)) {
      out.push(hit(f.path, "a multi-column outline view with no column headings"));
    }
  }
  return out;
}

function applyOvHeadings(text) {
  return text.replace(/\s*data-ov-headings(?:="[^"]*")?/g, "");
}

function hasStickerPack(text) {
  return /\bdata-sticker-pack\b/.test(text) || /\bMSSticker\b/.test(text);
}

function hasStMixedSizesCopy(text) {
  return /mix(?:ed)? sizes within a single sticker pack/i.test(text);
}

function scanStMixedSizes(files) {
  const out = [];
  for (const f of files) {
    if (/data-st-mixed-sizes/.test(f.text)) {
      out.push(hit(f.path, "mixed sizes within a single sticker pack"));
      continue;
    }
    if (!hasStickerPack(f.text)) continue;
    if (hasStMixedSizesCopy(f.text)) {
      out.push(hit(f.path, "mixed sizes within a single sticker pack"));
    }
  }
  return out;
}

function applyStMixedSizes(text) {
  return text.replace(/\s*data-st-mixed-sizes(?:="[^"]*")?/g, "");
}

function hasActionButton(text) {
  return /\bdata-action-button\b/.test(text);
}

function hasAbLongLabelCopy(text) {
  if (/longer than three words/i.test(text)) return true;
  const labeled = /\bdata-ab-label="([^"]*)"/g;
  let match;
  while ((match = labeled.exec(text))) {
    const words = match[1].trim().split(/\s+/).filter(Boolean);
    if (words.length > 3) return true;
  }
  return false;
}

function hasAbSettingsCopy(text) {
  return /repeats the Settings guidance/i.test(text);
}

function scanAbLongLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-ab-long-label/.test(f.text)) {
      out.push(hit(f.path, "an Action button label longer than three words"));
      continue;
    }
    if (!hasActionButton(f.text)) continue;
    if (hasAbLongLabelCopy(f.text)) {
      out.push(hit(f.path, "an Action button label longer than three words"));
    }
  }
  return out;
}

function applyAbLongLabel(text) {
  return text.replace(/\s*data-ab-long-label(?:="[^"]*")?/g, "");
}

function scanAbSettingsRepeat(files) {
  const out = [];
  for (const f of files) {
    if (/data-ab-settings-repeat/.test(f.text)) {
      out.push(hit(f.path, "content that repeats the Settings guidance for the Action button"));
      continue;
    }
    if (!hasActionButton(f.text)) continue;
    if (hasAbSettingsCopy(f.text)) {
      out.push(hit(f.path, "content that repeats the Settings guidance for the Action button"));
    }
  }
  return out;
}

function applyAbSettingsRepeat(text) {
  return text.replace(/\s*data-ab-settings-repeat(?:="[^"]*")?/g, "");
}

function hasCameraControl(text) {
  return /\bdata-camera-control\b/.test(text) || /\bAVCaptureControl\b/.test(text);
}

function hasCcDuplicateCopy(text) {
  return /duplicating controls/i.test(text);
}

function scanCcDuplicate(files) {
  const out = [];
  for (const f of files) {
    if (/data-cc-duplicate/.test(f.text)) {
      out.push(hit(f.path, "duplicating controls in the UI and the Camera Control overlay"));
      continue;
    }
    if (!hasCameraControl(f.text)) continue;
    if (hasCcDuplicateCopy(f.text)) {
      out.push(hit(f.path, "duplicating controls in the UI and the Camera Control overlay"));
    }
  }
  return out;
}

function applyCcDuplicate(text) {
  return text.replace(/\s*data-cc-duplicate(?:="[^"]*")?/g, "");
}

function hasDockMenu(text) {
  return /\bdata-dock-menu\b/.test(text) || /\bapplicationDockMenu\b/.test(text);
}

function dockMenuBlocks(text) {
  const blocks = [];
  const re = /<([A-Za-z][\w]*)\b[^>]*\bdata-dock-menu\b[^>]*>[\s\S]*?<\/\1>/g;
  let match;
  while ((match = re.exec(text))) blocks.push(match[0]);
  return blocks;
}

function dockItemTitles(block) {
  const titles = [];
  const re = /<(?:button|a)\b[^>]*>([^<]*)</gi;
  let match;
  while ((match = re.exec(block))) {
    const title = match[1].replace(/\s+/g, " ").trim();
    if (title) titles.push(title);
  }
  return titles;
}

function hasDockOnlyItem(text) {
  const blocks = dockMenuBlocks(text);
  if (!blocks.length) return false;
  let outside = text;
  for (const block of blocks) outside = outside.split(block).join(" ");
  for (const block of blocks) {
    for (const title of dockItemTitles(block)) {
      if (!outside.includes(title)) return true;
    }
  }
  return false;
}

function hasDkElsewhereCopy(text) {
  return /not available in other places/i.test(text) || hasDockOnlyItem(text);
}

function scanDkElsewhere(files) {
  const out = [];
  for (const f of files) {
    if (/data-dk-elsewhere/.test(f.text)) {
      out.push(hit(f.path, "a custom Dock menu item that is not available in other places"));
      continue;
    }
    if (!hasDockMenu(f.text)) continue;
    if (hasDkElsewhereCopy(f.text)) {
      out.push(hit(f.path, "a custom Dock menu item that is not available in other places"));
    }
  }
  return out;
}

function applyDkElsewhere(text) {
  return text.replace(/\s*data-dk-elsewhere(?:="[^"]*")?/g, "");
}

function hasGesture(text) {
  return (
    /\bdata-gesture\b/.test(text) ||
    /\bonTapGesture\b/.test(text) ||
    /\bUITapGestureRecognizer\b/.test(text) ||
    /\bUISwipeGestureRecognizer\b/.test(text) ||
    /\bUIPanGestureRecognizer\b/.test(text) ||
    /\bDragGesture\b/.test(text)
  );
}

function hasGsUniqueCopy(text) {
  return /tap-to-delete with no button/i.test(text) || /unique meaning for tap or swipe/i.test(text);
}

function hasGsEdgeCopy(text) {
  return /edge swipes that fight system Home/i.test(text);
}

function hasGsOnlyCopy(text) {
  return /gesture-only navigation/i.test(text) || /no toolbar Back/i.test(text);
}

function scanGsUniqueTap(files) {
  const out = [];
  for (const f of files) {
    if (/data-gs-unique/.test(f.text)) {
      out.push(hit(f.path, "unique meaning for tap or swipe"));
      continue;
    }
    if (!hasGesture(f.text)) continue;
    if (hasGsUniqueCopy(f.text)) {
      out.push(hit(f.path, "unique meaning for tap or swipe"));
    }
  }
  return out;
}

function scanGsEdgeSwipe(files) {
  const out = [];
  for (const f of files) {
    if (/data-gs-edge/.test(f.text)) {
      out.push(hit(f.path, "edge swipes that fight system Home"));
      continue;
    }
    if (!hasGesture(f.text)) continue;
    if (hasGsEdgeCopy(f.text)) {
      out.push(hit(f.path, "edge swipes that fight system Home"));
    }
  }
  return out;
}

function scanGsGestureOnly(files) {
  const out = [];
  for (const f of files) {
    if (/data-gs-only/.test(f.text)) {
      out.push(hit(f.path, "gesture-only navigation with no toolbar Back"));
      continue;
    }
    if (!hasGesture(f.text)) continue;
    if (hasGsOnlyCopy(f.text)) {
      out.push(hit(f.path, "gesture-only navigation with no toolbar Back"));
    }
  }
  return out;
}

function applyGsUniqueTap(text) {
  return text.replace(/\s*data-gs-unique(?:="[^"]*")?/g, "");
}

function applyGsEdgeSwipe(text) {
  return text.replace(/\s*data-gs-edge(?:="[^"]*")?/g, "");
}

function applyGsGestureOnly(text) {
  return text.replace(/\s*data-gs-only(?:="[^"]*")?/g, "");
}

function hasKeyboard(text) {
  return (
    /\bdata-keyboard\b/.test(text) ||
    /\bkeyboardShortcut\b/.test(text) ||
    /\bUIKeyCommand\b/.test(text) ||
    /\bkeyEquivalent\b/.test(text)
  );
}

function keyboardBlocks(text) {
  const blocks = [];
  const re = /<([A-Za-z][\w]*)\b[^>]*\bdata-keyboard\b[^>]*>[\s\S]*?<\/\1>/g;
  let match;
  while ((match = re.exec(text))) blocks.push(match[0]);
  return blocks;
}

function shortcutWindows(text) {
  const hits = [];
  const shortcut = /keyboardShortcut\(\s*"([^"]+)"([\s\S]{0,200})/gi;
  let match;
  while ((match = shortcut.exec(text))) {
    const args = match[2] || "";
    const explicit = /\bmodifiers\s*:/.test(args);
    hits.push({
      key: match[1].toLowerCase(),
      command: explicit ? /\.command\b/.test(args) : true,
      shift: /\.shift\b/.test(args),
      context: text.slice(Math.max(0, match.index - 280), match.index) + args,
    });
  }
  const command = /UIKeyCommand\(([\s\S]{0,300}?)\)/gi;
  while ((match = command.exec(text))) {
    const body = match[1];
    const key = (body.match(/input:\s*"([^"]+)"/) || [])[1] || "";
    hits.push({
      key: key.toLowerCase(),
      command: /\.command\b/.test(body),
      shift: /\.shift\b/.test(body),
      context: text.slice(Math.max(0, match.index - 160), match.index) + body,
    });
  }
  const equivalent = /keyEquivalent\s*[:=]\s*"([^"]+)"/gi;
  while ((match = equivalent.exec(text))) {
    const key = match[1];
    const around = text.slice(match.index, match.index + 180);
    hits.push({
      key: key.toLowerCase(),
      command: /\.command\b/.test(around) || !/modifier/i.test(around),
      shift: /\.shift\b/.test(around) || key === "Z" || key === "Q",
      context: text.slice(Math.max(0, match.index - 280), match.index) + around,
    });
  }
  return hits;
}

function hasKbRepurposeCopy(text) {
  if (/command-z or command-q/i.test(text)) return true;
  for (const hit of shortcutWindows(text)) {
    if (hit.key !== "z" && hit.key !== "q") continue;
    if (!hit.command) continue;
    if (hit.key === "z" && hit.shift) continue;
    if (hit.key === "z" && /\b(?:undo|redo)\b/i.test(hit.context)) continue;
    if (hit.key === "q" && /\bquit\b/i.test(hit.context)) continue;
    return true;
  }
  return false;
}

function hasKbModifierCopy(text) {
  if (/modifier added to an existing shortcut/i.test(text)) return true;
  for (const hit of shortcutWindows(text)) {
    if (hit.key !== "z" || !hit.command || !hit.shift) continue;
    if (/\b(?:undo|redo)\b/i.test(hit.context)) continue;
    return true;
  }
  return false;
}

function hasKbHelpCopy(text) {
  if (/help content within the keyboard/i.test(text)) return true;
  return keyboardBlocks(text).some((block) =>
    /<(?:p|aside|section)\b[^>]*>[^<]*(?:How to use this keyboard|Keyboard help)/i.test(block),
  );
}

function hasKbDupKeysCopy(text) {
  if (/duplicated emoji\/globe or dictation/i.test(text)) return true;
  return keyboardBlocks(text).some((block) =>
    /<(?:button|a)\b[^>]*>\s*(?:Emoji|Globe|Dictation)\s*</i.test(block),
  );
}

function scanKbRepurpose(files) {
  const out = [];
  for (const f of files) {
    if (/data-kb-repurpose/.test(f.text)) {
      out.push(hit(f.path, "repurposed Command-Z or Command-Q"));
      continue;
    }
    if (!hasKeyboard(f.text)) continue;
    if (hasKbRepurposeCopy(f.text)) out.push(hit(f.path, "repurposed Command-Z or Command-Q"));
  }
  return out;
}

function scanKbModifier(files) {
  const out = [];
  for (const f of files) {
    if (/data-kb-modifier/.test(f.text)) {
      out.push(hit(f.path, "a modifier added to an existing shortcut for an unrelated command"));
      continue;
    }
    if (!hasKeyboard(f.text)) continue;
    if (hasKbModifierCopy(f.text)) {
      out.push(hit(f.path, "a modifier added to an existing shortcut for an unrelated command"));
    }
  }
  return out;
}

function scanKbHelp(files) {
  const out = [];
  for (const f of files) {
    if (/data-kb-help/.test(f.text)) {
      out.push(hit(f.path, "help content displayed within the keyboard"));
      continue;
    }
    if (!hasKeyboard(f.text)) continue;
    if (hasKbHelpCopy(f.text)) out.push(hit(f.path, "help content displayed within the keyboard"));
  }
  return out;
}

function scanKbDupKeys(files) {
  const out = [];
  for (const f of files) {
    if (/data-kb-dup-keys/.test(f.text)) {
      out.push(hit(f.path, "duplicated Emoji/Globe or Dictation keys"));
      continue;
    }
    if (!hasKeyboard(f.text)) continue;
    if (hasKbDupKeysCopy(f.text)) out.push(hit(f.path, "duplicated Emoji/Globe or Dictation keys"));
  }
  return out;
}

function applyKbRepurpose(text) {
  return text.replace(/\s*data-kb-repurpose(?:="[^"]*")?/g, "");
}

function applyKbModifier(text) {
  return text.replace(/\s*data-kb-modifier(?:="[^"]*")?/g, "");
}

function applyKbHelp(text) {
  return text.replace(/\s*data-kb-help(?:="[^"]*")?/g, "");
}

function applyKbDupKeys(text) {
  return text.replace(/\s*data-kb-dup-keys(?:="[^"]*")?/g, "");
}

function hasPointer(text) {
  return (
    /\bdata-pointer\b/.test(text) ||
    /\bUIPointerStyle\b/.test(text) ||
    /\bUIPointerInteraction\b/.test(text) ||
    /\bNSCursor\b/.test(text) ||
    /\bcursor:\s*url\(/.test(text)
  );
}

function hasPtInstructCopy(text) {
  return /instructional text (?:displayed )?with a pointer/i.test(text);
}

function hasPtDecorativeCopy(text) {
  return /purely decorative pointer/i.test(text) || /gratuitous pointer/i.test(text);
}

function scanPtInstruct(files) {
  const out = [];
  for (const f of files) {
    if (/data-pt-instruct/.test(f.text)) {
      out.push(hit(f.path, "instructional text displayed with a pointer"));
      continue;
    }
    if (!hasPointer(f.text)) continue;
    if (hasPtInstructCopy(f.text)) {
      out.push(hit(f.path, "instructional text displayed with a pointer"));
    }
  }
  return out;
}

function scanPtDecorative(files) {
  const out = [];
  for (const f of files) {
    if (/data-pt-decorative/.test(f.text)) {
      out.push(hit(f.path, "a purely decorative pointer effect"));
      continue;
    }
    if (!hasPointer(f.text)) continue;
    if (hasPtDecorativeCopy(f.text)) out.push(hit(f.path, "a purely decorative pointer effect"));
  }
  return out;
}

function applyPtInstruct(text) {
  return text.replace(/\s*data-pt-instruct(?:="[^"]*")?/g, "");
}

function applyPtDecorative(text) {
  return text.replace(/\s*data-pt-decorative(?:="[^"]*")?/g, "");
}

function hasPencil(text) {
  return (
    /\bdata-pencil\b/.test(text) ||
    /\bPKCanvasView\b/.test(text) ||
    /\bPKToolPicker\b/.test(text) ||
    /\bUIScribbleInteraction\b/.test(text)
  );
}

function hasPeHoverCopy(text) {
  return /hover that initiates an action/i.test(text) || /hover to initiate an action/i.test(text);
}

function hasPeDoubleTapCopy(text) {
  return (
    /double-tap that modifies content/i.test(text) ||
    /double-tap gesture to perform an action that modifies/i.test(text)
  );
}

function hasPeDistractCopy(text) {
  return /distraction while people write/i.test(text) || /distracting people while they write/i.test(text);
}

function scanPeHover(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-hover/.test(f.text)) {
      out.push(hit(f.path, "hover that initiates an action"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPeHoverCopy(f.text)) out.push(hit(f.path, "hover that initiates an action"));
  }
  return out;
}

function scanPeDoubleTap(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-double-tap/.test(f.text)) {
      out.push(hit(f.path, "double-tap that modifies content"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPeDoubleTapCopy(f.text)) out.push(hit(f.path, "double-tap that modifies content"));
  }
  return out;
}

function scanPeDistract(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-distract/.test(f.text)) {
      out.push(hit(f.path, "distraction while people write"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPeDistractCopy(f.text)) out.push(hit(f.path, "distraction while people write"));
  }
  return out;
}

function applyPeHover(text) {
  return text.replace(/\s*data-pe-hover(?:="[^"]*")?/g, "");
}

function applyPeDoubleTap(text) {
  return text.replace(/\s*data-pe-double-tap(?:="[^"]*")?/g, "");
}

function applyPeDistract(text) {
  return text.replace(/\s*data-pe-distract(?:="[^"]*")?/g, "");
}

function hasGameControl(text) {
  return /\bdata-game-controls\b/.test(text);
}

function hasGmLetterCopy(text) {
  return (
    /abstract shapes or controller-based naming/i.test(text) ||
    /\bA,\s*X,\s*or\s*R1\b/.test(text)
  );
}

function hasGmLetterArtwork(text) {
  if (!hasGameControl(text)) return false;
  if (/<(?:button|Button)\b[^>]*>\s*(?:A|X|R1)\s*<\/(?:button|Button)>/.test(text)) return true;
  return /\bButton\s*\(\s*"(?:A|X|R1)"\s*\)/.test(text);
}

function scanGmLetter(files) {
  const out = [];
  for (const f of files) {
    if (/data-gm-letter/.test(f.text)) {
      out.push(hit(f.path, "abstract shapes or A, X, or R1 as artwork"));
      continue;
    }
    if (!hasGameControl(f.text)) continue;
    if (hasGmLetterCopy(f.text) || hasGmLetterArtwork(f.text)) {
      out.push(hit(f.path, "abstract shapes or A, X, or R1 as artwork"));
    }
  }
  return out;
}

function applyGmLetter(text) {
  return text.replace(/\s*data-gm-letter(?:="[^"]*")?/g, "");
}

function hasDuo(text) {
  return /\bdata-duo\b/.test(text);
}

function hasIdReinventCopy(text) {
  return /reinvent (?:your|the) app when it resizes/i.test(text);
}

function hasIdFixedCopy(text) {
  return /fixed widths/i.test(text) || /display-specific dependencies/i.test(text);
}

function hasIdFixedSignal(text) {
  return /@media[^{]*device-width/i.test(text) || /\bUIScreen\.main\.bounds\b/.test(text);
}

function hasIdFoldCopy(text) {
  return /extreme layout changes/i.test(text) || /layout changes as people fold/i.test(text);
}

function scanIdReinvent(files) {
  const out = [];
  for (const f of files) {
    if (/data-id-reinvent/.test(f.text)) {
      out.push(hit(f.path, "reinvent the app when it resizes"));
      continue;
    }
    if (!hasDuo(f.text)) continue;
    if (hasIdReinventCopy(f.text)) out.push(hit(f.path, "reinvent the app when it resizes"));
  }
  return out;
}

function scanIdFixed(files) {
  const out = [];
  for (const f of files) {
    if (/data-id-fixed/.test(f.text)) {
      out.push(hit(f.path, "fixed widths and display-specific dependencies"));
      continue;
    }
    if (!hasDuo(f.text)) continue;
    if (hasIdFixedCopy(f.text) || hasIdFixedSignal(f.text)) {
      out.push(hit(f.path, "fixed widths and display-specific dependencies"));
    }
  }
  return out;
}

function scanIdFold(files) {
  const out = [];
  for (const f of files) {
    if (/data-id-fold/.test(f.text)) {
      out.push(hit(f.path, "extreme layout changes as people fold"));
      continue;
    }
    if (!hasDuo(f.text)) continue;
    if (hasIdFoldCopy(f.text)) out.push(hit(f.path, "extreme layout changes as people fold"));
  }
  return out;
}

function applyIdReinvent(text) {
  return text.replace(/\s*data-id-reinvent(?:="[^"]*")?/g, "");
}

function applyIdFixed(text) {
  return text.replace(/\s*data-id-fixed(?:="[^"]*")?/g, "");
}

function applyIdFold(text) {
  return text.replace(/\s*data-id-fold(?:="[^"]*")?/g, "");
}

function hasCarePlan(text) {
  return /\bdata-carekit\b/.test(text);
}

function hasCkAdCopy(text) {
  return (
    /don['’]?t want to see advertising/i.test(text) ||
    /advertising in a care plan/i.test(text) ||
    /distract(?:ing)? people from their care plan/i.test(text)
  );
}

function hasCkAdSignal(text) {
  if (!hasCarePlan(text)) return false;
  return (
    /\b(?:Advertisement|Sponsored)\b/.test(text) ||
    /adsbygoogle/i.test(text)
  );
}

function scanCkAd(files) {
  const out = [];
  for (const f of files) {
    if (/data-ck-ad/.test(f.text)) {
      out.push(hit(f.path, "advertising in a care plan"));
      continue;
    }
    if (!hasCarePlan(f.text)) continue;
    if (hasCkAdCopy(f.text) || hasCkAdSignal(f.text)) {
      out.push(hit(f.path, "advertising in a care plan"));
    }
  }
  return out;
}

function applyCkAd(text) {
  return text.replace(/\s*data-ck-ad(?:="[^"]*")?/g, "");
}

function hasStudy(text) {
  return /\bdata-researchkit\b/.test(text);
}

function hasRkCriticalCopy(text) {
  return (
    /data that isn['’]?t critical to (?:your|the) study/i.test(text) ||
    /isn['’]?t critical to (?:your|the) study/i.test(text) ||
    /request access to data that isn['’]?t critical/i.test(text)
  );
}

function hasRkCriticalSignal(text) {
  if (!hasStudy(text)) return false;
  return /\bnot critical to (?:your|the) study\b/i.test(text);
}

function scanRkCritical(files) {
  const out = [];
  for (const f of files) {
    if (/data-rk-critical/.test(f.text)) {
      out.push(hit(f.path, "data that isn't critical to the study"));
      continue;
    }
    if (!hasStudy(f.text)) continue;
    if (hasRkCriticalCopy(f.text) || hasRkCriticalSignal(f.text)) {
      out.push(hit(f.path, "data that isn't critical to the study"));
    }
  }
  return out;
}

function applyRkCritical(text) {
  return text.replace(/\s*data-rk-critical(?:="[^"]*")?/g, "");
}

function hasPass(text) {
  return /\bdata-wallet\b/.test(text);
}

function hasWlMarketingCopy(text) {
  return (
    /change messages? for marketing/i.test(text) ||
    /change messages? used for marketing/i.test(text) ||
    /never use a change message for marketing/i.test(text) ||
    /marketing or other noncritical communication/i.test(text)
  );
}

function hasWlMarketingSignal(text) {
  if (!hasPass(text)) return false;
  return (
    /\bchangeMessage\b[\s\S]{0,80}\b(?:sale|offer|discount|promo|marketing)\b/i.test(text) ||
    /\b(?:sale|offer|discount|promo|marketing)\b[\s\S]{0,80}\bchangeMessage\b/i.test(text)
  );
}

function scanWlMarketing(files) {
  const out = [];
  for (const f of files) {
    if (/data-wl-marketing/.test(f.text)) {
      out.push(hit(f.path, "a change message used for marketing"));
      continue;
    }
    if (!hasPass(f.text)) continue;
    if (hasWlMarketingCopy(f.text) || hasWlMarketingSignal(f.text)) {
      out.push(hit(f.path, "a change message used for marketing"));
    }
  }
  return out;
}

function applyWlMarketing(text) {
  return text.replace(/\s*data-wl-marketing(?:="[^"]*")?/g, "");
}

function hasWlDeclineCopy(text) {
  return (
    /if people decline your suggestion, don['’]?t ask them again/i.test(text) ||
    /decline your suggestion, don['’]?t ask them again/i.test(text) ||
    /asking again after people decline a Wallet suggestion/i.test(text)
  );
}

function hasWlDeclineSignal(text) {
  if (!hasPass(text)) return false;
  return (
    /declined[\s\S]{0,200}(?:ask again|suggest again|add again|suggestAdding)/i.test(text) ||
    /if\s*\(\s*declined\s*\)[\s\S]{0,180}suggest/i.test(text)
  );
}

function scanWlDecline(files) {
  const out = [];
  for (const f of files) {
    if (/data-wl-decline/.test(f.text)) {
      out.push(hit(f.path, "asking again after people decline a Wallet suggestion"));
      continue;
    }
    if (!hasPass(f.text)) continue;
    if (hasWlDeclineCopy(f.text) || hasWlDeclineSignal(f.text)) {
      out.push(hit(f.path, "asking again after people decline a Wallet suggestion"));
    }
  }
  return out;
}

function applyWlDecline(text) {
  return text.replace(/\s*data-wl-decline(?:="[^"]*")?/g, "");
}

function hasWlLogoShadowCopy(text) {
  return (
    /inner drop shadows? on logo artwork/i.test(text) ||
    /avoid inner drop shadows? on (?:the )?logo/i.test(text)
  );
}

function logoTagHasInsetShadow(text) {
  const tags = text.match(/<(?:img|div|span)\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const logo = /\blogo\b/i.test(tag);
    const inset =
      /box-shadow\s*:[^;>]*\binset\b/i.test(tag) ||
      /boxShadow\s*:\s*["'][^"']*\binset\b/i.test(tag);
    if (logo && inset) return true;
  }
  return false;
}

function hasWlLogoShadowSignal(text) {
  if (!hasPass(text)) return false;
  return logoTagHasInsetShadow(text);
}

function scanWlLogoShadow(files) {
  const out = [];
  for (const f of files) {
    if (/data-wl-shadow/.test(f.text)) {
      out.push(hit(f.path, "inner drop shadows on logo artwork"));
      continue;
    }
    if (!hasPass(f.text)) continue;
    if (hasWlLogoShadowCopy(f.text) || hasWlLogoShadowSignal(f.text)) {
      out.push(hit(f.path, "inner drop shadows on logo artwork"));
    }
  }
  return out;
}

function applyWlLogoShadow(text) {
  return text.replace(/\s*data-wl-shadow(?:="[^"]*")?/g, "");
}

function hasShazam(text) {
  return /\bdata-shazam\b/.test(text) || /\bSHSession\b/.test(text) || /\bSHManagedSession\b/.test(text);
}

function hasSzMicCopy(text) {
  return (
    /don['’]?t expect the microphone to stay on/i.test(text) ||
    /microphone to stay on/i.test(text) ||
    /only record for as long as it takes to get the sample/i.test(text) ||
    /microphone that stays on after the recognition sample/i.test(text)
  );
}

function hasSzMicSignal(text) {
  if (!hasShazam(text)) return false;
  if (/microphone stays on/i.test(text) || /keep(?:s|ing)? (?:the )?microphone on/i.test(text)) {
    return true;
  }
  const started = /\.start\s*\(\s*\)/.test(text);
  const stopped = /\.stop\s*\(\s*\)/.test(text);
  const matched = /\.match\s*\(/.test(text);
  return started && matched && !stopped;
}

function scanSzMic(files) {
  const out = [];
  for (const f of files) {
    if (/data-sz-mic/.test(f.text)) {
      out.push(hit(f.path, "a microphone that stays on after the recognition sample"));
      continue;
    }
    if (!hasShazam(f.text)) continue;
    if (hasSzMicCopy(f.text) || hasSzMicSignal(f.text)) {
      out.push(hit(f.path, "a microphone that stays on after the recognition sample"));
    }
  }
  return out;
}

function applySzMic(text) {
  return text.replace(/\s*data-sz-mic(?:="[^"]*")?/g, "");
}

function hasPhotoEdit(text) {
  return /\bdata-photo-edit\b/.test(text) || /\bPHContentEditingController\b/.test(text);
}

function hasPxCancelCopy(text) {
  return (
    /don['’]?t immediately discard their changes/i.test(text) ||
    /immediately discard (?:their|the) changes/i.test(text)
  );
}

function hasPxCancelSignal(text) {
  if (!hasPhotoEdit(text)) return false;
  if (!/\b(?:hasEdits|isEdited|unsavedEdits)\b/.test(text)) return false;
  if (/\bconfirm\b/i.test(text)) return false;
  return (
    /cancel[\s\S]{0,240}(?:discard|revert)/i.test(text) ||
    /(?:discard|revert)[\s\S]{0,240}cancel/i.test(text)
  );
}

function scanPxCancel(files) {
  const out = [];
  for (const f of files) {
    if (/data-px-cancel/.test(f.text)) {
      out.push(hit(f.path, "Cancel that discards edits without a confirm"));
      continue;
    }
    if (!hasPhotoEdit(f.text)) continue;
    if (hasPxCancelCopy(f.text) || hasPxCancelSignal(f.text)) {
      out.push(hit(f.path, "Cancel that discards edits without a confirm"));
    }
  }
  return out;
}

function applyPxCancel(text) {
  return text.replace(/\s*data-px-cancel(?:="[^"]*")?/g, "");
}

function hasAppClipCode(text) {
  return /\bdata-app-clip-code\b/.test(text);
}

function hasAcModifiedCopy(text) {
  return (
    /create your own App Clip Code/i.test(text) ||
    /modify a generated App Clip Code/i.test(text) ||
    /homemade App Clip Code/i.test(text) ||
    /add glows, shadows, gradients, or reflections/i.test(text)
  );
}

function hasAcModifiedSignal(text) {
  if (!hasAppClipCode(text)) return false;
  return /filter\s*:|drop-shadow|box-shadow|linear-gradient|radial-gradient|\bglow\b/i.test(text);
}

function scanAcModified(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-modified/.test(f.text)) {
      out.push(hit(f.path, "a homemade or modified App Clip Code"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcModifiedCopy(f.text) || hasAcModifiedSignal(f.text)) {
      out.push(hit(f.path, "a homemade or modified App Clip Code"));
    }
  }
  return out;
}

function applyAcModified(text) {
  return text.replace(/\s*data-ac-modified(?:="[^"]*")?/g, "");
}

function hasAcOverlayCopy(text) {
  return (
    /overlay the App Clip Code with text, logos, or images/i.test(text) ||
    /text, logos, or images over an App Clip Code/i.test(text)
  );
}

function hasAcOverlaySignal(text) {
  if (!hasAppClipCode(text)) return false;
  return /data-app-clip-code[\s\S]{0,500}<img\b/i.test(text) ||
    /data-app-clip-code[^>]*background-image\s*:/i.test(text);
}

function scanAcOverlay(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-overlay/.test(f.text)) {
      out.push(hit(f.path, "text, logos, or images over an App Clip Code"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcOverlayCopy(f.text) || hasAcOverlaySignal(f.text)) {
      out.push(hit(f.path, "text, logos, or images over an App Clip Code"));
    }
  }
  return out;
}

function hasAcMotionCopy(text) {
  return (
    /never animate the App Clip Code/i.test(text) ||
    /animate the App Clip Code or dim/i.test(text) ||
    /animated or dimmed App Clip Code/i.test(text)
  );
}

function hasAcMotionSignal(text) {
  if (!hasAppClipCode(text)) return false;
  return /data-app-clip-code[\s\S]{0,240}animation\s*:/i.test(text);
}

function scanAcMotion(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-motion/.test(f.text)) {
      out.push(hit(f.path, "an animated or dimmed App Clip Code"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcMotionCopy(f.text) || hasAcMotionSignal(f.text)) {
      out.push(hit(f.path, "an animated or dimmed App Clip Code"));
    }
  }
  return out;
}

function hasAcRotateCopy(text) {
  return (
    /don['’]?t rotate the generated App Clip Code/i.test(text) ||
    /rotate the generated App Clip Code/i.test(text) ||
    /rotated App Clip Code/i.test(text)
  );
}

function hasAcRotateSignal(text) {
  if (!hasAppClipCode(text)) return false;
  return /data-app-clip-code[\s\S]{0,240}rotate\s*\(/i.test(text);
}

function scanAcRotate(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-rotate/.test(f.text)) {
      out.push(hit(f.path, "a rotated App Clip Code"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcRotateCopy(f.text) || hasAcRotateSignal(f.text)) {
      out.push(hit(f.path, "a rotated App Clip Code"));
    }
  }
  return out;
}

function applyAcOverlay(text) {
  return text.replace(/\s*data-ac-overlay(?:="[^"]*")?/g, "");
}

function applyAcMotion(text) {
  return text.replace(/\s*data-ac-motion(?:="[^"]*")?/g, "");
}

function applyAcRotate(text) {
  return text.replace(/\s*data-ac-rotate(?:="[^"]*")?/g, "");
}

function hasAcAspectCopy(text) {
  return (
    /don['’]?t change the generated code['’]?s aspect ratio/i.test(text) ||
    /change the generated (?:code|App Clip Code)['’]?s aspect ratio/i.test(text) ||
    /generated App Clip Code with a changed aspect ratio/i.test(text)
  );
}

function hasAcAspectSignal(text) {
  if (!hasAppClipCode(text)) return false;
  const window = text.match(/data-app-clip-code[\s\S]{0,240}/i);
  if (!window) return false;
  const slice = window[0];
  if (/object-fit\s*:\s*fill\b/i.test(slice) || /objectFit\s*:\s*["']fill["']/i.test(slice)) {
    return true;
  }
  const pair = slice.match(/scale\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/);
  if (pair && pair[1] !== pair[2]) return true;
  const x = slice.match(/scaleX\(\s*([0-9.]+)\s*\)/);
  const y = slice.match(/scaleY\(\s*([0-9.]+)\s*\)/);
  return Boolean(x && y && x[1] !== y[1]);
}

function scanAcAspect(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-aspect/.test(f.text)) {
      out.push(hit(f.path, "a generated App Clip Code with a changed aspect ratio"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcAspectCopy(f.text) || hasAcAspectSignal(f.text)) {
      out.push(hit(f.path, "a generated App Clip Code with a changed aspect ratio"));
    }
  }
  return out;
}

function applyAcAspect(text) {
  return text.replace(/\s*data-ac-aspect(?:="[^"]*")?/g, "");
}

function hasAcSymbolCopy(text) {
  return (
    /don['’]?t add a symbol to App Clip Codes/i.test(text) ||
    /add a symbol to (?:an |the )?App Clip Code/i.test(text) ||
    /symbol added to an App Clip Code/i.test(text)
  );
}

function hasAcSymbolSignal(text) {
  if (!hasAppClipCode(text)) return false;
  const window = text.match(/data-app-clip-code[\s\S]{0,240}/i);
  if (!window) return false;
  return /[™®©℠]|&trade;|&reg;|&copy;|&#8482;|&#174;|&#169;/i.test(window[0]);
}

function scanAcSymbol(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-symbol/.test(f.text)) {
      out.push(hit(f.path, "a symbol added to an App Clip Code"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcSymbolCopy(f.text) || hasAcSymbolSignal(f.text)) {
      out.push(hit(f.path, "a symbol added to an App Clip Code"));
    }
  }
  return out;
}

function applyAcSymbol(text) {
  return text.replace(/\s*data-ac-symbol(?:="[^"]*")?/g, "");
}

function hasDestructivePrimaryCopy(text) {
  return (
    /don['’]?t assign the primary role to a button that performs a destructive action/i.test(text) ||
    /primary role to a button that performs a destructive action/i.test(text) ||
    /primary role on a button that performs a destructive action/i.test(text)
  );
}

function hasDestructivePrimary(text) {
  const label = "Delete|Remove|Erase|Destroy";
  const htmlPrimary = new RegExp(
    `<button\\b[^>]*\\b(?:class|className)=["'][^"']*\\bprimary\\b[^"']*["'][^>]*>\\s*(?:${label})\\s*</button>`,
    "i",
  );
  const htmlVariant = new RegExp(
    `<button\\b[^>]*(?:\\bvariant|\\bdata-variant)=["']primary["'][^>]*>\\s*(?:${label})\\s*</button>`,
    "i",
  );
  const htmlSubmit = new RegExp(
    `<button\\b[^>]*\\btype=["']submit["'][^>]*>\\s*(?:${label})\\s*</button>`,
    "i",
  );
  const swiftProminent = new RegExp(
    `Button\\(\\s*["'](?:${label})["'][\\s\\S]{0,240}buttonStyle\\(\\s*\\.borderedProminent\\s*\\)|buttonStyle\\(\\s*\\.borderedProminent\\s*\\)[\\s\\S]{0,240}Button\\(\\s*["'](?:${label})["']`,
    "i",
  );
  const swiftBoth =
    /role:\s*\.destructive[\s\S]{0,240}\.borderedProminent|\.borderedProminent[\s\S]{0,240}role:\s*\.destructive/i;
  return (
    htmlPrimary.test(text) ||
    htmlVariant.test(text) ||
    htmlSubmit.test(text) ||
    swiftProminent.test(text) ||
    swiftBoth.test(text)
  );
}

function scanDestructivePrimary(files) {
  const out = [];
  for (const f of files) {
    if (/data-bt-primary/.test(f.text)) {
      out.push(hit(f.path, "the primary role on a button that performs a destructive action"));
      continue;
    }
    if (hasDestructivePrimaryCopy(f.text) || hasDestructivePrimary(f.text)) {
      out.push(hit(f.path, "the primary role on a button that performs a destructive action"));
    }
  }
  return out;
}

function applyDestructivePrimary(text) {
  return text.replace(/\s*data-bt-primary(?:="[^"]*")?/g, "");
}

function hasRadioWidget(text) {
  return (
    /<input\b[^>]*\btype\s*=\s*["']radio["']/i.test(text) || /\.radioGroup\b/.test(text)
  );
}

function hasTooManyRadiosCopy(text) {
  return (
    /more than about five radio buttons/i.test(text) ||
    /too many radio buttons/i.test(text) ||
    /listing too many radio buttons/i.test(text)
  );
}

function namedRadioSetOverFive(text) {
  const counts = new Map();
  const re = /<input\b[^>]*>/gi;
  let m;
  while ((m = re.exec(text))) {
    const tag = m[0];
    if (!/\btype\s*=\s*["']radio["']/i.test(tag)) continue;
    const name = tag.match(/\bname\s*=\s*["']([^"']+)["']/i);
    if (!name || !name[1]) continue;
    counts.set(name[1], (counts.get(name[1]) || 0) + 1);
  }
  for (const count of counts.values()) {
    if (count > 5) return true;
  }
  return false;
}

function swiftRadioGroupOverFive(text) {
  const re = /\bPicker\b[\s\S]{0,1200}?\.pickerStyle\(\s*\.radioGroup\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    const tags = m[0].match(/\.tag\(/g);
    if (tags && tags.length > 5) return true;
  }
  return false;
}

function scanTooManyRadios(files) {
  const out = [];
  for (const f of files) {
    if (/data-tg-radios\b/.test(f.text)) {
      out.push(hit(f.path, "a set of more than about five radio buttons"));
      continue;
    }
    if (hasRadioWidget(f.text) && hasTooManyRadiosCopy(f.text)) {
      out.push(hit(f.path, "a set of more than about five radio buttons"));
      continue;
    }
    if (namedRadioSetOverFive(f.text) || swiftRadioGroupOverFive(f.text)) {
      out.push(hit(f.path, "a set of more than about five radio buttons"));
    }
  }
  return out;
}

function applyTooManyRadios(text) {
  return text.replace(/\s*data-tg-radios(?:="[^"]*")?(?![\w-])/g, "");
}

function hasSelectionButton(text) {
  return /\bchangesSelectionAsPrimaryAction\b/.test(text);
}

function hasSelectionLabelCopy(text) {
  return (
    /supplying a label that explains the button/i.test(text) ||
    /label that explains a button that changes the selection/i.test(text)
  );
}

function selectionButtonLabeled(text) {
  const re = /changesSelectionAsPrimaryAction/g;
  let m;
  while ((m = re.exec(text))) {
    const window = text.slice(Math.max(0, m.index - 500), m.index + 500);
    const title = window.match(/\btitle\s*[:=]\s*"([^"]*)"/);
    if (title && title[1].trim()) return true;
    const button = window.match(/\bButton\s*\(\s*"([^"]+)"/);
    if (button && button[1].trim()) return true;
  }
  return false;
}

function scanSelectionLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-tg-sel(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a label that explains a button that changes the selection"));
      continue;
    }
    if (!hasSelectionButton(f.text)) continue;
    if (hasSelectionLabelCopy(f.text) || selectionButtonLabeled(f.text)) {
      out.push(hit(f.path, "a label that explains a button that changes the selection"));
    }
  }
  return out;
}

function applySelectionLabel(text) {
  return text.replace(/\s*data-tg-sel(?:="[^"]*")?(?![\w-])/g, "");
}

const TOGGLE_COLOR_PROPS = new Set([
  "color",
  "background",
  "background-color",
  "fill",
  "stroke",
  "border-color",
  "outline-color",
  "caret-color",
]);

function cssBlocks(text) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) out.push({ selector: m[1], body: m[2] });
  return out;
}

function declMap(body) {
  const map = new Map();
  for (const part of String(body).split(/[;\n]/)) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim().toLowerCase();
    if (name) map.set(name, value);
  }
  return map;
}

function colorValue(name, value) {
  if (!TOGGLE_COLOR_PROPS.has(name)) return false;
  return !/url\s*\(|image-set\s*\(|linear-gradient|radial-gradient|repeating-/i.test(value);
}

function mapIsColorOnly(map) {
  if (map.size === 0) return false;
  let sawColor = false;
  for (const [name, value] of map) {
    if (!colorValue(name, value)) return false;
    sawColor = true;
  }
  return sawColor;
}

function mapsDifferOnlyByColor(a, b) {
  const keys = new Set([...a.keys(), ...b.keys()]);
  let colorDiff = false;
  for (const key of keys) {
    const av = a.get(key) || "";
    const bv = b.get(key) || "";
    if (av === bv) continue;
    if (!colorValue(key, av) || !colorValue(key, bv)) return false;
    colorDiff = true;
  }
  return colorDiff;
}

function pressedPolarity(selector) {
  if (/aria-pressed\s*=\s*["']?false/i.test(selector)) return "off";
  if (/aria-pressed\s*=\s*["']?true/i.test(selector)) return "on";
  return null;
}

function hasColorOnlyPressedCss(text) {
  let on = false;
  let off = false;
  for (const rule of cssBlocks(text)) {
    const polarity = pressedPolarity(rule.selector);
    if (!polarity) continue;
    if (!mapIsColorOnly(declMap(rule.body))) return false;
    if (polarity === "on") on = true;
    else off = true;
  }
  return on && off;
}

function pressedValue(tag) {
  const m = tag.match(/\baria-pressed\s*=\s*(?:\{)?\s*["']?(true|false)/i);
  if (m) return m[1].toLowerCase();
  if (/\baria-pressed\b/.test(tag) && !/\baria-pressed\s*=/.test(tag)) return "true";
  return null;
}

function styleDecls(tag) {
  let body = "";
  const css = tag.match(/\bstyle\s*=\s*"([^"]*)"/i);
  if (css) body = css[1];
  const jsx = tag.match(/\bstyle\s*=\s*\{\{([\s\S]*?)\}\}/);
  if (jsx) body = jsx[1].replace(/["']/g, "");
  return declMap(body);
}

function visibleControlText(block) {
  const inner = block.text.replace(/^<[^>]+>/, "").replace(/<\/[A-Za-z][\w]*\s*>\s*$/i, "");
  return inner
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function controlHasIcon(block) {
  return /<(svg|img)\b/i.test(block.text);
}

function controlHasCheck(block) {
  return /[✓✔☑]/.test(visibleControlText(block));
}

function controlIsSwitch(open) {
  return (
    /role\s*=\s*["']switch["']/i.test(open) ||
    /\btype\s*=\s*["']checkbox["']/i.test(open)
  );
}

function customPressedButtons(text) {
  const out = [];
  for (const block of blocksWithAttr(text, "aria-pressed")) {
    const open = block.text.match(/^<[^>]+>/)?.[0] || "";
    if (controlIsSwitch(open)) continue;
    if (controlHasIcon(block) || controlHasCheck(block)) continue;
    out.push({ block, open, text: visibleControlText(block) });
  }
  return out;
}

function inlineColorOnlyPair(buttons) {
  const usable = [];
  for (const button of buttons) {
    const value = pressedValue(button.open);
    if (!value) continue;
    const decls = styleDecls(button.open);
    if (decls.size === 0) continue;
    usable.push({ value, decls, text: button.text });
  }
  const ons = usable.filter((item) => item.value === "true");
  const offs = usable.filter((item) => item.value === "false");
  for (const on of ons) {
    for (const off of offs) {
      if (on.text !== off.text) continue;
      if (mapsDifferOnlyByColor(on.decls, off.decls)) return true;
    }
  }
  return false;
}

function swiftColorOnlyToggle(text) {
  const re =
    /(?:configuration\s*\.\s*)?isOn\s*\?\s*Color\s*\.\s*[A-Za-z]+[\s\S]{0,40}?:\s*Color\s*\.\s*[A-Za-z]+/g;
  let m;
  while ((m = re.exec(text))) {
    const window = text.slice(Math.max(0, m.index - 500), m.index + m[0].length + 200);
    if (/\bToggle\s*\(/.test(window) || /\bUISwitch\b/.test(window)) continue;
    if (/\bImage\s*\(/.test(window) || /checkmark/i.test(window)) continue;
    if (/\bButton\s*\(|\bToggleStyle\b|\bButtonStyle\b/.test(window)) return true;
  }
  return false;
}

function hasColorOnlyToggle(text) {
  const buttons = customPressedButtons(text);
  if (buttons.length > 0 && hasColorOnlyPressedCss(text)) return true;
  if (inlineColorOnlyPair(buttons)) return true;
  return swiftColorOnlyToggle(text);
}

function scanColorOnlyToggle(files) {
  const out = [];
  for (const f of files) {
    if (/data-tg-color(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a toggle that relies solely on different colors to communicate state"));
      continue;
    }
    if (hasColorOnlyToggle(f.text)) {
      out.push(hit(f.path, "a toggle that relies solely on different colors to communicate state"));
    }
  }
  return out;
}

function applyColorOnlyToggle(text) {
  return text.replace(/\s*data-tg-color(?:="[^"]*")?(?![\w-])/g, "");
}

function hasSegmentedWidget(text) {
  return (
    /role=["']radiogroup["']/i.test(text) ||
    /\bdata-segmented\b/.test(text) ||
    /\bUISegmentedControl\b/.test(text) ||
    /\.pickerStyle\(\s*\.segmented\s*\)/.test(text)
  );
}

function hasSegmentMixCopy(text) {
  return (
    /not a mix of both/i.test(text) ||
    /mix of text and images/i.test(text) ||
    /mixes text and images/i.test(text)
  );
}

function segmentKinds(region) {
  const kinds = [];
  const re = /<(button|a)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(region))) {
    const inner = m[2];
    const hasImage = /<(svg|img)\b/i.test(inner);
    const visible = inner
      .replace(/<svg\b[\s\S]*?<\/svg>/gi, "")
      .replace(/<img\b[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, "");
    kinds.push({ hasText: visible.length > 0, hasImage });
  }
  return kinds;
}

function kindsAreMix(kinds) {
  if (kinds.length < 2) return false;
  const key = (k) => `${k.hasText}:${k.hasImage}`;
  if (kinds.every((k) => key(k) === key(kinds[0]))) return false;
  return kinds.some((k) => k.hasText) && kinds.some((k) => k.hasImage);
}

function segmentedRegions(text) {
  const out = [];
  const re =
    /<(div|nav|fieldset)\b[^>]*(?:role=["']radiogroup["']|\bdata-segmented\b)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}

function webSegmentMix(text) {
  return segmentedRegions(text).some((region) => kindsAreMix(segmentKinds(region)));
}

function swiftSegmentMix(text) {
  const re = /\bPicker\b[\s\S]{0,1500}?\.pickerStyle\(\s*\.segmented\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    const body = m[0].replace(/\bLabel\s*\([^)]*\)/g, "");
    if (/\bText\s*\(\s*"/.test(body) && /\bImage\s*\(/.test(body)) return true;
  }
  return false;
}

function uiSegmentMix(text) {
  if (!/\bUISegmentedControl\b/.test(text)) return false;
  const title = /insertSegment\(withTitle:|setTitle\(/.test(text);
  const image = /insertSegment\(with:\s|setImage\(/.test(text);
  return title && image;
}

function scanSegmentMix(files) {
  const out = [];
  for (const f of files) {
    if (/data-sg-mix\b/.test(f.text)) {
      out.push(hit(f.path, "a segmented control that mixes text and images"));
      continue;
    }
    if (!hasSegmentedWidget(f.text)) continue;
    if (
      hasSegmentMixCopy(f.text) ||
      webSegmentMix(f.text) ||
      swiftSegmentMix(f.text) ||
      uiSegmentMix(f.text)
    ) {
      out.push(hit(f.path, "a segmented control that mixes text and images"));
    }
  }
  return out;
}

function applySegmentMix(text) {
  return text.replace(/\s*data-sg-mix(?:="[^"]*")?(?![\w-])/g, "");
}

function hasSegmentCountCopy(text) {
  return (
    /eight or more segments/i.test(text) ||
    /no more than about five to seven segments/i.test(text)
  );
}

function controlSegmentCount(region) {
  const tags = region.match(/<(button|a)\b/gi);
  return tags ? tags.length : 0;
}

function webSegmentCountOver(text, limit) {
  return segmentedRegions(text).some((region) => controlSegmentCount(region) > limit);
}

function swiftSegmentCountOver(text, limit) {
  const re = /\bPicker\b[\s\S]{0,2500}?\.pickerStyle\(\s*\.segmented\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    const tags = m[0].match(/\.tag\s*\(/g);
    if (tags && tags.length > limit) return true;
  }
  return false;
}

function scanSegmentCount(files) {
  const out = [];
  for (const f of files) {
    if (/data-sg-count(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a segmented control with eight or more segments"));
      continue;
    }
    if (!hasSegmentedWidget(f.text)) continue;
    if (
      hasSegmentCountCopy(f.text) ||
      webSegmentCountOver(f.text, 7) ||
      swiftSegmentCountOver(f.text, 7)
    ) {
      out.push(hit(f.path, "a segmented control with eight or more segments"));
    }
  }
  return out;
}

function applySegmentCount(text) {
  return text.replace(/\s*data-sg-count(?:="[^"]*")?(?![\w-])/g, "");
}

function hasSegmentRoleCopy(text) {
  return (
    /assign actions to segments/i.test(text) ||
    /selection state for segments/i.test(text) ||
    /segmented control that both selects and acts/i.test(text)
  );
}

function regionSelectsAndActs(region) {
  const selects =
    /role=["']radio["']/i.test(region) ||
    /aria-checked(?![\w-])/i.test(region) ||
    /aria-current=/i.test(region);
  const acts = /<a\b[^>]*\bhref=/i.test(region) || /type=["']submit["']/i.test(region);
  return selects && acts;
}

function webSelectsAndActs(text) {
  return segmentedRegions(text).some((region) => regionSelectsAndActs(region));
}

function swiftSelectsAndActs(text) {
  const re = /\bPicker\b[\s\S]{0,1500}?\.pickerStyle\(\s*\.segmented\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    const body = m[0];
    const selects = /\bselection\s*:/.test(body) || /\.tag\s*\(/.test(body);
    const acts = /\bButton\s*\(/.test(body) || /\bNavigationLink\s*\(/.test(body);
    if (selects && acts) return true;
  }
  return false;
}

function scanSegmentRole(files) {
  const out = [];
  for (const f of files) {
    if (/data-sg-role(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a segmented control that both selects and acts"));
      continue;
    }
    if (!hasSegmentedWidget(f.text)) continue;
    if (hasSegmentRoleCopy(f.text) || webSelectsAndActs(f.text) || swiftSelectsAndActs(f.text)) {
      out.push(hit(f.path, "a segmented control that both selects and acts"));
    }
  }
  return out;
}

function applySegmentRole(text) {
  return text.replace(/\s*data-sg-role(?:="[^"]*")?(?![\w-])/g, "");
}

function hasListWidget(text) {
  return /<(ul|ol|table)\b/i.test(text) || /data-list-pane/.test(text) || /\bList\s*[\({]/.test(text);
}

function hasIndexDisclosureCopy(text) {
  return (
    /adding an index to a table that displays controls/i.test(text) ||
    /section index on a list that also shows disclosure indicators/i.test(text)
  );
}

function hasSectionIndexToken(text) {
  return (
    /data-section-index(?![\w-])/.test(text) ||
    /\bsectionIndexTitles\b/.test(text) ||
    /\bsectionIndexMinimumDisplayRowCount\b/.test(text)
  );
}

function hasDisclosureIndicatorToken(text) {
  return (
    /data-disclosure-indicator(?![\w-])/.test(text) ||
    /\bdisclosureIndicator\b/.test(text) ||
    /\bchevron\.right\b/.test(text)
  );
}

function listRegions(text) {
  const out = [];
  const re = /<(ul|ol|table)\b[^>]*>[\s\S]*?<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}

function hasIndexDisclosurePair(text) {
  if (listRegions(text).some((region) => hasSectionIndexToken(region) && hasDisclosureIndicatorToken(region))) {
    return true;
  }
  if (!hasSectionIndexToken(text) || !hasDisclosureIndicatorToken(text)) return false;
  return /(?:data-section-index|sectionIndexTitles|sectionIndexMinimumDisplayRowCount)[\s\S]{0,600}(?:data-disclosure-indicator|disclosureIndicator|chevron\.right)|(?:data-disclosure-indicator|disclosureIndicator|chevron\.right)[\s\S]{0,600}(?:data-section-index|sectionIndexTitles|sectionIndexMinimumDisplayRowCount)/.test(
    text,
  );
}

function scanIndexBesideDisclosure(files) {
  const out = [];
  for (const f of files) {
    if (/data-ix-both(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a section index on a list that also shows disclosure indicators"));
      continue;
    }
    if (hasIndexDisclosurePair(f.text)) {
      out.push(hit(f.path, "a section index on a list that also shows disclosure indicators"));
      continue;
    }
    if (hasListWidget(f.text) && hasIndexDisclosureCopy(f.text)) {
      out.push(hit(f.path, "a section index on a list that also shows disclosure indicators"));
    }
  }
  return out;
}

function applyIndexBesideDisclosure(text) {
  return text.replace(/\s*data-ix-both(?:="[^"]*")?(?![\w-])/g, "");
}

function stripOutlineRegions(text) {
  return text
    .replace(/<([A-Za-z][\w]*)\b[^>]*\bdata-outline\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\bNSOutlineView\b[\s\S]{0,500}/g, "");
}

function visibleHeading(inner) {
  return inner
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function headingEndsWithPunctuation(label) {
  return /[.!?…;:,]$|\.\.\.$/.test(label);
}

function headingsInTable(chunk) {
  const heads = [];
  const th = /<th\b([^>]*)>([\s\S]*?)<\/th>/gi;
  let m;
  while ((m = th.exec(chunk))) heads.push(visibleHeading(m[2]));
  const role = /<([A-Za-z][\w]*)\b([^>]*\brole=["']columnheader["'][^>]*)>([\s\S]*?)<\/\1>/gi;
  while ((m = role.exec(chunk))) {
    if (m[1].toLowerCase() === "th") continue;
    heads.push(visibleHeading(m[3]));
  }
  return heads;
}

function htmlMultiColumnTables(text) {
  const tables = [];
  const re = /<table\b[\s\S]*?<\/table>/gi;
  let m;
  while ((m = re.exec(text))) {
    const heads = headingsInTable(m[0]);
    if (heads.length >= 2) tables.push(heads);
  }
  return tables;
}

function swiftMultiColumnTables(text) {
  const tables = [];
  const re = /\bTable\b/g;
  let m;
  while ((m = re.exec(text))) {
    const brace = text.indexOf("{", m.index);
    if (brace < 0 || brace - m.index > 120) continue;
    const close = matchingBrace(text, brace);
    if (close < 0) continue;
    const body = text.slice(brace + 1, close);
    const heads = [];
    const col = /TableColumn\s*\(\s*"([^"]*)"/g;
    let c;
    while ((c = col.exec(body))) heads.push(c[1].trim());
    if (heads.length >= 2) tables.push(heads);
  }
  return tables;
}

function multiColumnHeadings(text) {
  const source = stripOutlineRegions(text);
  return [...htmlMultiColumnTables(source), ...swiftMultiColumnTables(source)];
}

function hasPunctuatedColumnHeading(text) {
  return multiColumnHeadings(text).some((heads) => heads.some((head) => headingEndsWithPunctuation(head)));
}

function hasColumnPunctuationCopy(text) {
  return (
    /don['’]?t add ending punctuation/i.test(text) ||
    /column heading that ends with punctuation/i.test(text)
  );
}

function scanColumnPunctuation(files) {
  const out = [];
  for (const f of files) {
    if (/data-hd-punct(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a column heading that ends with punctuation"));
      continue;
    }
    const tables = multiColumnHeadings(f.text);
    if (tables.length === 0) continue;
    if (hasPunctuatedColumnHeading(f.text) || hasColumnPunctuationCopy(f.text)) {
      out.push(hit(f.path, "a column heading that ends with punctuation"));
    }
  }
  return out;
}

function applyColumnPunctuation(text) {
  return text.replace(/\s*data-hd-punct(?:="[^"]*")?(?![\w-])/g, "");
}

function sidebarRegions(text) {
  const regions = blocksWithAttr(text, "data-sidebar").map((block) => block.text);
  const re = /\bNavigationSplitView\b/g;
  let m;
  while ((m = re.exec(text))) {
    const brace = text.indexOf("{", m.index);
    if (brace < 0 || brace - m.index > 160) continue;
    const close = matchingBrace(text, brace);
    if (close < 0) continue;
    regions.push(text.slice(brace + 1, close));
  }
  return regions;
}

function nestedListDepth(html) {
  let depth = 0;
  let max = 0;
  const re = /<\/?(ul|ol)\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (m[0][1] === "/") depth = Math.max(0, depth - 1);
    else {
      depth += 1;
      if (depth > max) max = depth;
    }
  }
  return max;
}

function groupDepth(body) {
  let max = 0;
  function walk(slice, depth) {
    const re = /\b(?:Section|DisclosureGroup)\s*\(/g;
    let m;
    while ((m = re.exec(slice))) {
      const next = depth + 1;
      if (next > max) max = next;
      const brace = slice.indexOf("{", m.index);
      if (brace < 0) continue;
      const close = matchingBrace(slice, brace);
      if (close < 0) continue;
      walk(slice.slice(brace + 1, close), next);
      re.lastIndex = close + 1;
    }
  }
  walk(body, 0);
  return max;
}

function sidebarTooDeep(text) {
  return sidebarRegions(text).some((region) => nestedListDepth(region) >= 3 || groupDepth(region) >= 3);
}

function hasSidebarWidget(text) {
  return /\bdata-sidebar\b/.test(text) || /\bNavigationSplitView\b/.test(text);
}

function hasSidebarDepthCopy(text) {
  return (
    /no more than two levels/i.test(text) ||
    /third level of hierarchy in a sidebar/i.test(text)
  );
}

function scanSidebarDepth(files) {
  const out = [];
  for (const f of files) {
    if (/data-sb-depth(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a third level of hierarchy in a sidebar"));
      continue;
    }
    if (sidebarTooDeep(f.text) || (hasSidebarWidget(f.text) && hasSidebarDepthCopy(f.text))) {
      out.push(hit(f.path, "a third level of hierarchy in a sidebar"));
    }
  }
  return out;
}

function applySidebarDepth(text) {
  return text.replace(/\s*data-sb-depth(?:="[^"]*")?(?![\w-])/g, "");
}

function hasNamedAppWindow(text) {
  return hasAppWindow(text) || /\bWindow\s*\(/.test(text);
}

function declaredAppNames(text) {
  const names = new Set();
  const add = (raw) => {
    const name = String(raw || "").trim();
    if (name) names.add(name);
  };
  const plist = /<key>\s*CFBundle(?:Display)?Name\s*<\/key>\s*<string>([^<]+)<\/string>/gi;
  let m;
  while ((m = plist.exec(text))) add(m[1]);
  const product = /PRODUCT_NAME\s*=\s*"([^"]+)"/g;
  while ((m = product.exec(text))) add(m[1]);
  const attr = /data-app-name\s*=\s*"([^"]+)"/gi;
  while ((m = attr.exec(text))) add(m[1]);
  return names;
}

function windowTitles(text) {
  if (!hasNamedAppWindow(text)) return [];
  const titles = [];
  const add = (raw) => {
    const name = String(raw || "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (name) titles.push(name);
  };
  const win = /\bWindow\s*\(\s*"([^"]+)"/g;
  let m;
  while ((m = win.exec(text))) add(m[1]);
  const ns = /\bNSWindow(?:Controller)?\b/g;
  while ((m = ns.exec(text))) {
    const titled = text.slice(m.index, m.index + 500).match(/\btitle\s*[:=]\s*"([^"]+)"/);
    if (titled) add(titled[1]);
  }
  for (const attr of ["data-window", "data-app-window"]) {
    for (const block of blocksWithAttr(text, attr)) {
      const titled = block.text.match(/\bdata-wn-title\s*=\s*"([^"]+)"/i);
      if (titled) add(titled[1]);
      const heading = block.text.match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i);
      if (heading) add(heading[1]);
    }
  }
  return titles;
}

function windowTitleIsAppName(text) {
  const names = declaredAppNames(text);
  if (!names.size) return false;
  return windowTitles(text).some((title) => names.has(title));
}

function hasWindowAppTitleCopy(text) {
  return (
    /don['’]?t title windows with your app name/i.test(text) ||
    /window titled with the app name/i.test(text)
  );
}

function scanWindowAppTitle(files) {
  const out = [];
  for (const f of files) {
    if (/data-wn-app(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a window titled with the app name"));
      continue;
    }
    if (windowTitleIsAppName(f.text) || (hasNamedAppWindow(f.text) && hasWindowAppTitleCopy(f.text))) {
      out.push(hit(f.path, "a window titled with the app name"));
    }
  }
  return out;
}

function applyWindowAppTitle(text) {
  return text.replace(/\s*data-wn-app(?:="[^"]*")?(?![\w-])/g, "");
}

function elementsWithRole(text, role) {
  const out = [];
  const openRe = new RegExp(
    `<([A-Za-z][\\w]*)\\b[^>]*\\brole=["']${role}["'][^>]*>`,
    "gi",
  );
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
        i = text.length;
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

function hasToolbarWidget(text) {
  return (
    /role=["']toolbar["']/i.test(text) ||
    /\.toolbar\s*\{/.test(text) ||
    /\bUIToolbar\b/.test(text) ||
    /\bNSToolbar\b/.test(text) ||
    /\bToolbarItem\b/.test(text)
  );
}

function toolbarControlHasName(attrs, inner) {
  if (/aria-label\s*=\s*(?:["'][^"']*\S[^"']*["']|\{[^}]*\S[^}]*\})/i.test(attrs)) return true;
  if (/aria-labelledby\s*=\s*["'][^"']+["']/i.test(attrs)) return true;
  if (/\btitle\s*=\s*["'][^"']*\S[^"']*["']/i.test(attrs)) return true;
  const visible = inner
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return visible.length > 0;
}

function webToolbarHasUnnamedItem(text) {
  for (const region of elementsWithRole(text, "toolbar")) {
    const re = /<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let m;
    while ((m = re.exec(region))) {
      if (!toolbarControlHasName(m[2], m[3])) return true;
    }
  }
  return false;
}

function swiftToolbarHasUnnamedItem(text) {
  const re = /\.toolbar\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].lastIndexOf("{");
    const close = matchingBrace(text, open);
    if (close < 0) continue;
    const body = text.slice(open, close + 1);
    const buttons = /\bButton\s*(\([^)]*\))?\s*\{/g;
    let b;
    while ((b = buttons.exec(body))) {
      const args = b[1] || "";
      const titled = /["'][^"']*\S[^"']*["']/.test(args);
      const bOpen = b.index + b[0].lastIndexOf("{");
      const bClose = matchingBrace(body, bOpen);
      const inner = bClose > bOpen ? body.slice(bOpen, bClose + 1) : "";
      const after = body.slice(Math.max(bClose, b.index), Math.min(body.length, b.index + 500));
      const labeled = /accessibilityLabel\s*\(\s*"[^"]*\S[^"]*"/.test(after);
      if (!titled && !labeled && /\bImage\s*\(/.test(inner)) return true;
    }
  }
  return false;
}

function hasToolbarUnnamedCopy(text) {
  return (
    /don['’]?t make people guess/i.test(text) ||
    /toolbar item with no visible text and no accessible name/i.test(text)
  );
}

function scanToolbarUnnamed(files) {
  const out = [];
  for (const f of files) {
    if (/data-tb-name(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a toolbar item with no visible text and no accessible name"));
      continue;
    }
    if (
      webToolbarHasUnnamedItem(f.text) ||
      swiftToolbarHasUnnamedItem(f.text) ||
      (hasToolbarWidget(f.text) && hasToolbarUnnamedCopy(f.text))
    ) {
      out.push(hit(f.path, "a toolbar item with no visible text and no accessible name"));
    }
  }
  return out;
}

function applyToolbarUnnamed(text) {
  return text.replace(/\s*data-tb-name(?:="[^"]*")?(?![\w-])/g, "");
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
    case "pv-att":
      return scanAttPrealert(files);
    case "pv-leave":
      return scanAttLeave(files);
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
    case "nt-badge":
      return scanNtBadge(files);
    case "nt-label":
      return scanNtLabel(files);
    case "nt-open":
      return scanNtOpen(files);
    case "nt-content":
      return scanNtContent(files);
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
    case "ix-both":
      return scanIndexBesideDisclosure(files);
    case "hd-punct":
      return scanColumnPunctuation(files);
    case "equal-weight-submits":
      return scanEqualWeightSubmits(files);
    case "marketing-landing-tab-shell":
      return scanMarketingTabShell(files);
    case "tb-off":
      return scanTabDisabled(files);
    case "sb-depth":
      return scanSidebarDepth(files);
    case "wn-app":
      return scanWindowAppTitle(files);
    case "tb-name":
      return scanToolbarUnnamed(files);
    case "hide-unavailable-menu-items":
      return scanHiddenMenuItems(files);
    case "nested-submenus-deep":
      return scanNestedSubmenus(files);
    case "mix-menu-icons":
      return scanMixMenuIcons(files);
    case "mn-sub":
      return scanSubmenuAvailable(files);
    case "mn-key":
      return scanContextShortcut(files);
    case "picker-owns-the-screen":
      return scanPickerScreen(files);
    case "stepper-no-neighbouring-value":
      return scanStepperNoValue(files);
    case "overweight-wheel-short-list":
      return scanOverweightWheel(files);
    case "morph-circular-bar":
      return scanMorphProgress(files);
    case "pg-label":
      return scanSpinnerLabel(files);
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
    case "destructive-as-primary":
      return scanDestructivePrimary(files);
    case "tg-radios":
      return scanTooManyRadios(files);
    case "tg-sel":
      return scanSelectionLabel(files);
    case "tg-color":
      return scanColorOnlyToggle(files);
    case "sg-mix":
      return scanSegmentMix(files);
    case "sg-count":
      return scanSegmentCount(files);
    case "sg-role":
      return scanSegmentRole(files);
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
    case "al-error":
      return scanAlertErrorTitle(files);
    case "al-cancel":
      return scanAlertCancelDefault(files);
    case "al-yes-no":
      return scanAlertYesNo(files);
    case "al-caution":
      return scanAlertCautionOnSave(files);
    case "sh-trio":
      return scanSheetTrio(files);
    case "sh-done":
      return scanSheetDoneOnly(files);
    case "slider-as-volume":
      return scanSliderAsVolume(files);
    case "nested-same-axis-scroll":
      return scanNestedSameAxisScroll(files);
    case "sv-indicator":
      return scanScrollIndicator(files);
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
    case "pgc-scrub":
      return scanMinimalPageScrub(files);
    case "pgc-anim":
      return scanScrubAnimation(files);
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
    case "shareplay-adjective":
      return scanShareplayAdjective(files);
    case "shareplay-inflected":
      return scanShareplayInflected(files);
    case "nearby-only-way":
      return scanNearbyOnlyWay(files);
    case "nearby-portrait-instruction":
      return scanNearbyPortraitInstruction(files);
    case "activity-rings-other-data":
      return scanActivityRingsOtherData(files);
    case "activity-rings-multi-person":
      return scanActivityRingsMultiPerson(files);
    case "activity-rings-recolor":
      return scanActivityRingsRecolor(files);
    case "activity-rings-decoration":
      return scanActivityRingsDecoration(files);
    case "nfc-contact":
      return scanNfcContact(files);
    case "nfc-jargon":
      return scanNfcJargon(files);
    case "ar-jargon":
      return scanArJargon(files);
    case "ar-glyph-misused":
      return scanArGlyphMisused(files);
    case "ttp-apple-logo":
      return scanTtpAppleLogo(files);
    case "ttp-nonpayment-label":
      return scanTtpNonpaymentLabel(files);
    case "idv-apple-logo":
      return scanIdvAppleLogo(files);
    case "idv-comm-symbol":
      return scanIdvCommSymbol(files);
    case "iap-confirm-sheet":
      return scanIapConfirmSheet(files);
    case "iap-refund-buried":
      return scanIapRefundBuried(files);
    case "iap-refund-policy":
      return scanIapRefundPolicy(files);
    case "map-cover-legal":
      return scanMapCoverLegal(files);
    case "map-replica-apple":
      return scanMapReplicaApple(files);
    case "hk-company-name":
      return scanHkCompanyName(files);
    case "hk-overwrite-db":
      return scanHkOverwriteDb(files);
    case "hk-dup-settings":
      return scanHkDupSettings(files);
    case "hk-cover-camera":
      return scanHkCoverCamera(files);
    case "wk-distract":
      return scanWkDistract(files);
    case "wk-brief-session":
      return scanWkBriefSession(files);
    case "lp-disassemble":
      return scanLpDisassemble(files);
    case "lp-playback-button":
      return scanLpPlaybackButton(files);
    case "lp-unsupported-replica":
      return scanLpUnsupportedReplica(files);
    case "ic-ask-docs":
      return scanIcAskDocs(files);
    case "ic-unavailable-alert":
      return scanIcUnavailableAlert(files);
    case "ic-app-resources":
      return scanIcAppResources(files);
    case "si-advertise":
      return scanSiAdvertise(files);
    case "si-impersonate":
      return scanSiImpersonate(files);
    case "si-pronoun":
      return scanSiPronoun(files);
    case "as-reskin":
      return scanAsReskin(files);
    case "as-lowercase":
      return scanAsLowercase(files);
    case "as-title-item":
      return scanAsTitleItem(files);
    case "hlt-replica":
      return scanHltReplica(files);
    case "hlt-sharing":
      return scanHltSharing(files);
    case "hlt-term":
      return scanHltTerm(files);
    case "cp-iphone-lock":
      return scanCpIphoneLock(files);
    case "cp-iphone-error":
      return scanCpIphoneError(files);
    case "cp-iphone-interact":
      return scanCpIphoneInteract(files);
    case "sia-password":
      return scanSiaPassword(files);
    case "sia-email":
      return scanSiaEmail(files);
    case "sia-logo":
      return scanSiaLogo(files);
    case "ap-mark-button":
      return scanApMarkButton(files);
    case "ap-plural":
      return scanApPlural(files);
    case "ap-logo-word":
      return scanApLogoWord(files);
    case "au-output-volume":
      return scanAuOutputVolume(files);
    case "au-repurpose":
      return scanAuRepurpose(files);
    case "au-headphones":
      return scanAuHeadphones(files);
    case "gc-gameplay":
      return scanGcGameplay(files);
    case "gc-artwork":
      return scanGcArtwork(files);
    case "gc-terms":
      return scanGcTerms(files);
    case "pn-window-menu":
      return scanPnWindowMenu(files);
    case "pn-minimize":
      return scanPnMinimize(files);
    case "pn-hud-obscure":
      return scanPnHudObscure(files);
    case "pc-toolbar":
      return scanPcToolbar(files);
    case "ov-colon":
      return scanOvColon(files);
    case "ov-headings":
      return scanOvHeadings(files);
    case "st-mixed-sizes":
      return scanStMixedSizes(files);
    case "ab-long-label":
      return scanAbLongLabel(files);
    case "ab-settings-repeat":
      return scanAbSettingsRepeat(files);
    case "cc-duplicate":
      return scanCcDuplicate(files);
    case "dk-elsewhere":
      return scanDkElsewhere(files);
    case "gs-unique-tap":
      return scanGsUniqueTap(files);
    case "gs-edge-swipe":
      return scanGsEdgeSwipe(files);
    case "gs-gesture-only":
      return scanGsGestureOnly(files);
    case "kb-repurpose":
      return scanKbRepurpose(files);
    case "kb-modifier":
      return scanKbModifier(files);
    case "kb-help":
      return scanKbHelp(files);
    case "kb-dup-keys":
      return scanKbDupKeys(files);
    case "pt-instruct":
      return scanPtInstruct(files);
    case "pt-decorative":
      return scanPtDecorative(files);
    case "pe-hover":
      return scanPeHover(files);
    case "pe-double-tap":
      return scanPeDoubleTap(files);
    case "pe-distract":
      return scanPeDistract(files);
    case "gm-letter":
      return scanGmLetter(files);
    case "id-reinvent":
      return scanIdReinvent(files);
    case "id-fixed":
      return scanIdFixed(files);
    case "id-fold":
      return scanIdFold(files);
    case "ck-ad":
      return scanCkAd(files);
    case "rk-critical":
      return scanRkCritical(files);
    case "wl-marketing":
      return scanWlMarketing(files);
    case "wl-decline":
      return scanWlDecline(files);
    case "wl-shadow":
      return scanWlLogoShadow(files);
    case "sz-mic":
      return scanSzMic(files);
    case "px-cancel":
      return scanPxCancel(files);
    case "ac-modified":
      return scanAcModified(files);
    case "ac-overlay":
      return scanAcOverlay(files);
    case "ac-motion":
      return scanAcMotion(files);
    case "ac-rotate":
      return scanAcRotate(files);
    case "ac-aspect":
      return scanAcAspect(files);
    case "ac-symbol":
      return scanAcSymbol(files);
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
    case "pv-att":
      return applyAttPrealert(file.text);
    case "pv-leave":
      return applyAttLeave(file.text);
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
    case "nt-badge":
      return applyNtBadge(file.text);
    case "nt-label":
      return applyNtLabel(file.text);
    case "nt-open":
      return applyNtOpen(file.text);
    case "nt-content":
      return applyNtContent(file.text);
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
    case "ix-both":
      return applyIndexBesideDisclosure(file.text);
    case "hd-punct":
      return applyColumnPunctuation(file.text);
    case "equal-weight-submits":
      return applyEqualWeightSubmits(file.text);
    case "marketing-landing-tab-shell":
      return applyMarketingTabShell(file.text, file);
    case "tb-off":
      return applyTabDisabled(file.text);
    case "sb-depth":
      return applySidebarDepth(file.text);
    case "wn-app":
      return applyWindowAppTitle(file.text);
    case "tb-name":
      return applyToolbarUnnamed(file.text);
    case "hide-unavailable-menu-items":
      return applyHiddenMenuItems(file.text);
    case "nested-submenus-deep":
      return file.text;
    case "mix-menu-icons":
      return file.text;
    case "mn-sub":
      return applySubmenuAvailable(file.text);
    case "mn-key":
      return applyContextShortcut(file.text);
    case "picker-owns-the-screen":
      return file.text;
    case "stepper-no-neighbouring-value":
      return file.text;
    case "overweight-wheel-short-list":
      return applyOverweightWheel(file.text, file);
    case "morph-circular-bar":
      return applyMorphProgress(file.text);
    case "pg-label":
      return applySpinnerLabel(file.text);
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
    case "destructive-as-primary":
      return applyDestructivePrimary(file.text);
    case "tg-radios":
      return applyTooManyRadios(file.text);
    case "tg-sel":
      return applySelectionLabel(file.text);
    case "tg-color":
      return applyColorOnlyToggle(file.text);
    case "sg-mix":
      return applySegmentMix(file.text);
    case "sg-count":
      return applySegmentCount(file.text);
    case "sg-role":
      return applySegmentRole(file.text);
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
    case "al-error":
      return applyAlertErrorTitle(file.text);
    case "al-cancel":
      return applyAlertCancelDefault(file.text);
    case "al-yes-no":
      return applyAlertYesNo(file.text);
    case "al-caution":
      return applyAlertCautionOnSave(file.text);
    case "sh-trio":
      return applySheetTrio(file.text);
    case "sh-done":
      return applySheetDoneOnly(file.text);
    case "slider-as-volume":
      return applySliderAsVolume(file.text);
    case "nested-same-axis-scroll":
      return applyNestedSameAxisScroll(file.text);
    case "sv-indicator":
      return applyScrollIndicator(file.text);
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
    case "pgc-scrub":
      return applyMinimalPageScrub(file.text);
    case "pgc-anim":
      return applyScrubAnimation(file.text);
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
    case "shareplay-adjective":
      return applyShareplayAdjective(file.text);
    case "shareplay-inflected":
      return applyShareplayInflected(file.text);
    case "nearby-only-way":
      return applyNearbyOnlyWay(file.text);
    case "nearby-portrait-instruction":
      return applyNearbyPortraitInstruction(file.text);
    case "activity-rings-other-data":
      return applyActivityRingsOtherData(file.text);
    case "activity-rings-multi-person":
      return applyActivityRingsMultiPerson(file.text);
    case "activity-rings-recolor":
      return applyActivityRingsRecolor(file.text);
    case "activity-rings-decoration":
      return applyActivityRingsDecoration(file.text);
    case "nfc-contact":
      return applyNfcContact(file.text);
    case "nfc-jargon":
      return applyNfcJargon(file.text);
    case "ar-jargon":
      return applyArJargon(file.text);
    case "ar-glyph-misused":
      return applyArGlyphMisused(file.text);
    case "ttp-apple-logo":
      return applyTtpAppleLogo(file.text);
    case "ttp-nonpayment-label":
      return applyTtpNonpaymentLabel(file.text);
    case "idv-apple-logo":
      return applyIdvAppleLogo(file.text);
    case "idv-comm-symbol":
      return applyIdvCommSymbol(file.text);
    case "iap-confirm-sheet":
      return applyIapConfirmSheet(file.text);
    case "iap-refund-buried":
      return applyIapRefundBuried(file.text);
    case "iap-refund-policy":
      return applyIapRefundPolicy(file.text);
    case "map-cover-legal":
      return applyMapCoverLegal(file.text);
    case "map-replica-apple":
      return applyMapReplicaApple(file.text);
    case "hk-company-name":
      return applyHkCompanyName(file.text);
    case "hk-overwrite-db":
      return applyHkOverwriteDb(file.text);
    case "hk-dup-settings":
      return applyHkDupSettings(file.text);
    case "hk-cover-camera":
      return applyHkCoverCamera(file.text);
    case "wk-distract":
      return applyWkDistract(file.text);
    case "wk-brief-session":
      return applyWkBriefSession(file.text);
    case "lp-disassemble":
      return applyLpDisassemble(file.text);
    case "lp-playback-button":
      return applyLpPlaybackButton(file.text);
    case "lp-unsupported-replica":
      return applyLpUnsupportedReplica(file.text);
    case "ic-ask-docs":
      return applyIcAskDocs(file.text);
    case "ic-unavailable-alert":
      return applyIcUnavailableAlert(file.text);
    case "ic-app-resources":
      return applyIcAppResources(file.text);
    case "si-advertise":
      return applySiAdvertise(file.text);
    case "si-impersonate":
      return applySiImpersonate(file.text);
    case "si-pronoun":
      return applySiPronoun(file.text);
    case "as-reskin":
      return applyAsReskin(file.text);
    case "as-lowercase":
      return applyAsLowercase(file.text);
    case "as-title-item":
      return applyAsTitleItem(file.text);
    case "hlt-replica":
      return applyHltReplica(file.text);
    case "hlt-sharing":
      return applyHltSharing(file.text);
    case "hlt-term":
      return applyHltTerm(file.text);
    case "cp-iphone-lock":
      return applyCpIphoneLock(file.text);
    case "cp-iphone-error":
      return applyCpIphoneError(file.text);
    case "cp-iphone-interact":
      return applyCpIphoneInteract(file.text);
    case "sia-password":
      return applySiaPassword(file.text);
    case "sia-email":
      return applySiaEmail(file.text);
    case "sia-logo":
      return applySiaLogo(file.text);
    case "ap-mark-button":
      return applyApMarkButton(file.text);
    case "ap-plural":
      return applyApPlural(file.text);
    case "ap-logo-word":
      return applyApLogoWord(file.text);
    case "au-output-volume":
      return applyAuOutputVolume(file.text);
    case "au-repurpose":
      return applyAuRepurpose(file.text);
    case "au-headphones":
      return applyAuHeadphones(file.text);
    case "gc-gameplay":
      return applyGcGameplay(file.text);
    case "gc-artwork":
      return applyGcArtwork(file.text);
    case "gc-terms":
      return applyGcTerms(file.text);
    case "pn-window-menu":
      return applyPnWindowMenu(file.text);
    case "pn-minimize":
      return applyPnMinimize(file.text);
    case "pn-hud-obscure":
      return applyPnHudObscure(file.text);
    case "pc-toolbar":
      return applyPcToolbar(file.text);
    case "ov-colon":
      return applyOvColon(file.text);
    case "ov-headings":
      return applyOvHeadings(file.text);
    case "st-mixed-sizes":
      return applyStMixedSizes(file.text);
    case "ab-long-label":
      return applyAbLongLabel(file.text);
    case "ab-settings-repeat":
      return applyAbSettingsRepeat(file.text);
    case "cc-duplicate":
      return applyCcDuplicate(file.text);
    case "dk-elsewhere":
      return applyDkElsewhere(file.text);
    case "gs-unique-tap":
      return applyGsUniqueTap(file.text);
    case "gs-edge-swipe":
      return applyGsEdgeSwipe(file.text);
    case "gs-gesture-only":
      return applyGsGestureOnly(file.text);
    case "kb-repurpose":
      return applyKbRepurpose(file.text);
    case "kb-modifier":
      return applyKbModifier(file.text);
    case "kb-help":
      return applyKbHelp(file.text);
    case "kb-dup-keys":
      return applyKbDupKeys(file.text);
    case "pt-instruct":
      return applyPtInstruct(file.text);
    case "pt-decorative":
      return applyPtDecorative(file.text);
    case "pe-hover":
      return applyPeHover(file.text);
    case "pe-double-tap":
      return applyPeDoubleTap(file.text);
    case "pe-distract":
      return applyPeDistract(file.text);
    case "gm-letter":
      return applyGmLetter(file.text);
    case "id-reinvent":
      return applyIdReinvent(file.text);
    case "id-fixed":
      return applyIdFixed(file.text);
    case "id-fold":
      return applyIdFold(file.text);
    case "ck-ad":
      return applyCkAd(file.text);
    case "rk-critical":
      return applyRkCritical(file.text);
    case "wl-marketing":
      return applyWlMarketing(file.text);
    case "wl-decline":
      return applyWlDecline(file.text);
    case "wl-shadow":
      return applyWlLogoShadow(file.text);
    case "sz-mic":
      return applySzMic(file.text);
    case "px-cancel":
      return applyPxCancel(file.text);
    case "ac-modified":
      return applyAcModified(file.text);
    case "ac-overlay":
      return applyAcOverlay(file.text);
    case "ac-motion":
      return applyAcMotion(file.text);
    case "ac-rotate":
      return applyAcRotate(file.text);
    case "ac-aspect":
      return applyAcAspect(file.text);
    case "ac-symbol":
      return applyAcSymbol(file.text);
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
