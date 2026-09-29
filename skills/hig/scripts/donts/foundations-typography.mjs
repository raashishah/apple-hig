import { hit, blocksWithAttr } from "./shared.mjs";

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

export const records = [
  {
    id: "hero-type-in-lists",
    rewrite: "host",
    scan: scanHeroType,
    apply(text, file) {
      return applyHeroType(text);
    },
  },
  {
    id: "all-caps-long-labels",
    rewrite: "host",
    scan: scanAllCaps,
    apply(text, file) {
      return applyAllCaps(text);
    },
  },
  {
    id: "too-many-font-families",
    rewrite: "marker",
    scan: scanFontFamilies,
    apply(text, file) {
      return text;
    },
  },
];
