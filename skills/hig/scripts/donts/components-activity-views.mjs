import { hit } from "./shared.mjs";

function hasActivityView(text) {
  return (
    /\bdata-activity-view\b/.test(text) ||
    /\bdata-share-sheet\b/.test(text) ||
    /\bUIActivityViewController\b/.test(text) ||
    /\bShareLink\s*\(/.test(text) ||
    /\.shareSheet\s*\(/.test(text)
  );
}

function scanDuplicateActivityActions(files) {
  const out = [];
  for (const f of files) {
    if (/data-duplicate-activity-action/.test(f.text)) {
      out.push(hit(f.path, "duplicate versions of common actions"));
      continue;
    }
    if (!hasActivityView(f.text)) continue;
    const prints = (f.text.match(/>Print</g) || []).length;
    const copies = (f.text.match(/>Copy</g) || []).length;
    if (prints >= 2 || copies >= 2) {
      out.push(hit(f.path, "duplicate versions of common actions"));
    }
  }
  return out;
}

function applyDuplicateActivityActions(text) {
  return text.replace(/\s*data-duplicate-activity-action(?:="[^"]*")?/g, "");
}

function scanAlternativeActivityReveal(files) {
  const out = [];
  for (const f of files) {
    if (/data-alt-activity-reveal/.test(f.text)) {
      out.push(hit(f.path, "alternative control that presents the activity view"));
    }
  }
  return out;
}

function applyAlternativeActivityReveal(text) {
  return text.replace(/\s*data-alt-activity-reveal(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "duplicate-activity-actions",
    rewrite: "marker",
    scan: scanDuplicateActivityActions,
    apply(text, file) {
      return applyDuplicateActivityActions(text);
    },
  },
  {
    id: "alternative-activity-reveal",
    rewrite: "marker",
    scan: scanAlternativeActivityReveal,
    apply(text, file) {
      return applyAlternativeActivityReveal(text);
    },
  },
];
