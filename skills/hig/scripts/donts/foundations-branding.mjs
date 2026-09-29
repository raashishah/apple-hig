import { hit, scanOpaqueBrandBars, applyOpaqueBrandBars, scanBrandOutlinedSymbols } from "./shared.mjs";

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

export const records = [
  {
    id: "opaque-brand-bar-fills",
    rewrite: "host",
    scan: scanOpaqueBrandBars,
    apply(text, file) {
      return applyOpaqueBrandBars(text);
    },
  },
  {
    id: "watermarks-on-content",
    rewrite: "marker",
    scan: scanWatermarks,
    apply(text, file) {
      return applyWatermarks(text);
    },
  },
  {
    id: "brand-outlined-sf-rewrite",
    rewrite: "marker",
    scan: scanBrandOutlinedSymbols,
    apply(text, file) {
      return text;
    },
  },
];
