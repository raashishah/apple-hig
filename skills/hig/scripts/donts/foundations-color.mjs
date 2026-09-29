import { hit, blocksWithAttr, scanColorOnly, applyColorOnly } from "./shared.mjs";
import { DETECTORS } from "../../knowledge/chrome/detectors.mjs";

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

export const records = [
  {
    id: "rainbow-nav-accents",
    rewrite: "marker",
    scan: scanRainbow,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "muted-only-labels",
    rewrite: "host",
    scan: scanMutedLabels,
    apply(text, file) {
      return applyMutedLabels(text);
    },
  },
  {
    id: "glass-tints-on-chrome",
    rewrite: "host",
    scan: scanGlass,
    apply(text, file) {
      return applyGlass(text);
    },
  },
  {
    id: "hard-black-white-chrome",
    rewrite: "host",
    scan: scanBlackWhiteChrome,
    apply(text, file) {
      return applyBlackWhiteChrome(text);
    },
  },
  {
    id: "color-only-error-or-selected",
    rewrite: "host",
    scan: scanColorOnly,
    apply(text, file) {
      return applyColorOnly(text);
    },
  },
];
