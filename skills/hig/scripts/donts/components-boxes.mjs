import { hit, blocksWithAttr } from "./shared.mjs";

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

export const records = [
  {
    id: "nested-boxes",
    rewrite: "marker",
    scan: scanNestedBoxes,
    apply(text, file) {
      return applyNestedBoxes(text);
    },
  },
  {
    id: "oversized-box",
    rewrite: "marker",
    scan: scanOversizedBox,
    apply(text, file) {
      return applyOversizedBox(text);
    },
  },
];
