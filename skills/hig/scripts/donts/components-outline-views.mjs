import { hit } from "./shared.mjs";

function hasOutline(text) {
  return /\bdata-outline\b/.test(text) || /\bNSOutlineView\b/.test(text);
}

function hasOvColonCopy(text) {
  return /trailing colon/i.test(text) || /column heading[^.\n]{0,40}:/.test(text);
}

function hasOvHeadingsCopy(text) {
  return (
    /no column headings/i.test(text) ||
    /omit column headings/i.test(text) ||
    (/multi-column outline/i.test(text) && /without column headings/i.test(text))
  );
}

function scanOvColon(files) {
  const out = [];
  for (const f of files) {
    if (/data-ov-colon/.test(f.text)) {
      out.push(hit(f.path, "a trailing colon on an outline column heading"));
      continue;
    }
    if (!hasOutline(f.text)) continue;
    if (hasOvColonCopy(f.text)) {
      out.push(hit(f.path, "a trailing colon on an outline column heading"));
    }
  }
  return out;
}

function applyOvColon(text) {
  return text.replace(/\s*data-ov-colon(?:="[^"]*")?/g, "");
}

function scanOvHeadings(files) {
  const out = [];
  for (const f of files) {
    if (/data-ov-headings/.test(f.text)) {
      out.push(hit(f.path, "a multi-column outline view with no column headings"));
      continue;
    }
    if (!hasOutline(f.text)) continue;
    if (hasOvHeadingsCopy(f.text)) {
      out.push(hit(f.path, "a multi-column outline view with no column headings"));
    }
  }
  return out;
}

function applyOvHeadings(text) {
  return text.replace(/\s*data-ov-headings(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "ov-colon",
    rewrite: "marker",
    scan: scanOvColon,
    apply(text, file) {
      return applyOvColon(text);
    },
  },
  {
    id: "ov-headings",
    rewrite: "marker",
    scan: scanOvHeadings,
    apply(text, file) {
      return applyOvHeadings(text);
    },
  },
];
