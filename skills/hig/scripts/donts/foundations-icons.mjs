import { hit, innerText, scanBrandOutlinedSymbols } from "./shared.mjs";

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

export const records = [
  {
    id: "sf-symbol-name-tables",
    rewrite: "marker",
    scan: scanSfSymbolTables,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "outlined-doodles-in-toolbar",
    rewrite: "marker",
    scan: scanBrandOutlinedSymbols,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "decorative-icon-duplicates-label",
    rewrite: "host",
    scan: scanDecorativeDuplicate,
    apply(text, file) {
      return applyDecorativeDuplicate(text);
    },
  },
];
