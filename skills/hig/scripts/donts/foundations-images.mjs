import { hit, emptyStateRegions } from "./shared.mjs";

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

export const records = [
  {
    id: "screenshot-empty-state",
    rewrite: "host",
    scan: scanScreenshotEmpty,
    apply(text, file) {
      return applyScreenshotEmpty(text);
    },
  },
  {
    id: "bitmap-sf-symbols",
    rewrite: "marker",
    scan: scanBitmapSf,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "copied-scale-factor-tables",
    rewrite: "marker",
    scan: scanScaleTables,
    apply(text, file) {
      return text;
    },
  },
];
