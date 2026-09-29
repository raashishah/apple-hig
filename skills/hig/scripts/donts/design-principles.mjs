import { hit } from "./shared.mjs";

function scanDpPlatform(files) {
  const out = [];
  for (const f of files) {
    if (/data-dp-platform(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a claim that this pack covers watch, tv, or vision"));
      continue;
    }
    if (
      /covers Watch, TV, or Vision/i.test(f.text) ||
      /design-principles covers watch/i.test(f.text)
    ) {
      out.push(hit(f.path, "a claim that this pack covers watch, tv, or vision"));
    }
  }
  return out;
}

function applyDpPlatform(text) {
  return text.replace(/\s*data-dp-platform(?:="[^"]*")?(?![\w-])/g, "");
}

function scanDpTaste(files) {
  const out = [];
  for (const f of files) {
    if (/data-dp-taste(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "house taste treated as these principles"));
      continue;
    }
    if (/house taste/i.test(f.text) || /768\/375-only gold/i.test(f.text)) {
      out.push(hit(f.path, "house taste treated as these principles"));
    }
  }
  return out;
}

function applyDpTaste(text) {
  return text.replace(/\s*data-dp-taste(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "dp-platform",
    rewrite: "marker",
    scan: scanDpPlatform,
    apply(text, file) {
      return applyDpPlatform(text);
    },
  },
  {
    id: "dp-taste",
    rewrite: "marker",
    scan: scanDpTaste,
    apply(text, file) {
      return applyDpTaste(text);
    },
  },
];
