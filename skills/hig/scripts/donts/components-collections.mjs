import { hit, blocksWithAttr } from "./shared.mjs";

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

export const records = [
  {
    id: "custom-collection-layout",
    rewrite: "marker",
    scan: scanCustomCollectionLayout,
    apply(text, file) {
      return applyCustomCollectionLayout(text);
    },
  },
  {
    id: "text-collection-as-table",
    rewrite: "marker",
    scan: scanTextCollectionAsTable,
    apply(text, file) {
      return applyTextCollectionAsTable(text);
    },
  },
  {
    id: "overlapping-collection-items",
    rewrite: "marker",
    scan: scanOverlappingCollectionItems,
    apply(text, file) {
      return applyOverlappingCollectionItems(text);
    },
  },
];
