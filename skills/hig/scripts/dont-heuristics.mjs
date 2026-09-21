/**
 * Mechanical Don't scanners for catalog surfaces with complete Don't coverage.
 * Do not rewrite host fonts. Do not inject a kit. Do not invent missing widgets.
 */

import fs from "node:fs";
import path from "node:path";
import { DETECTORS } from "../knowledge/chrome/detectors.mjs";

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
    default: {
      const _exhaustive = id;
      void _exhaustive;
      return file.text;
    }
  }
}

function applyWanted(files, ids) {
  const mutated = new Set();
  for (const id of ids) {
    if (scanHeuristic(id, files).length === 0) continue;
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
