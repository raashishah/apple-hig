import { hit } from "./shared.mjs";

function hasPrintAction(text) {
  return (
    /\bdata-print\b/.test(text) ||
    /\bwindow\.print\s*\(/.test(text) ||
    /\bUIPrintInteractionController\b/.test(text) ||
    /\bNSPrintOperation\b/.test(text)
  );
}

function scanPrintWhenNothingPrintable(files) {
  const out = [];
  for (const f of files) {
    if (/data-print-nothing/.test(f.text)) {
      out.push(hit(f.path, "Print action shown when nothing is printable"));
      continue;
    }
    if (!hasPrintAction(f.text)) continue;
    if (
      /\bdata-nothing-printable\b/.test(f.text) &&
      !/\b(disabled|aria-disabled=["']true["'])/.test(f.text)
    ) {
      out.push(hit(f.path, "Print action shown when nothing is printable"));
    }
  }
  return out;
}

function applyPrintWhenNothingPrintable(text) {
  return text.replace(/\s*data-print-nothing(?:="[^"]*")?/g, "");
}

function scanDuplicatePageOrientation(files) {
  const out = [];
  for (const f of files) {
    if (/data-duplicate-page-orientation/.test(f.text)) {
      out.push(hit(f.path, "duplicate system page-orientation options"));
    }
  }
  return out;
}

function applyDuplicatePageOrientation(text) {
  return text.replace(/\s*data-duplicate-page-orientation(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "print-when-nothing-printable",
    rewrite: "marker",
    scan: scanPrintWhenNothingPrintable,
    apply(text, file) {
      return applyPrintWhenNothingPrintable(text);
    },
  },
  {
    id: "duplicate-page-orientation",
    rewrite: "marker",
    scan: scanDuplicatePageOrientation,
    apply(text, file) {
      return applyDuplicatePageOrientation(text);
    },
  },
];
