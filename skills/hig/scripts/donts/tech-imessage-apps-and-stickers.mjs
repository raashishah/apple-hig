import { hit } from "./shared.mjs";

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

export const records = [
  {
    id: "st-mixed-sizes",
    rewrite: "marker",
    scan: scanStMixedSizes,
    apply(text, file) {
      return applyStMixedSizes(text);
    },
  },
];
