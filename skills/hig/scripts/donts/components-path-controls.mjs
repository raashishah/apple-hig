import { hit } from "./shared.mjs";

function hasPathControl(text) {
  return /\bdata-path-control\b/.test(text) || /\bNSPathControl\b/.test(text);
}

function hasPcToolbarCopy(text) {
  return (
    /placed in a toolbar or status bar/i.test(text) ||
    (/path control/i.test(text) && /toolbar|status bar/i.test(text))
  );
}

function scanPcToolbar(files) {
  const out = [];
  for (const f of files) {
    if (/data-pc-toolbar/.test(f.text)) {
      out.push(hit(f.path, "a path control placed in a toolbar or status bar"));
      continue;
    }
    if (!hasPathControl(f.text)) continue;
    if (hasPcToolbarCopy(f.text)) {
      out.push(hit(f.path, "a path control placed in a toolbar or status bar"));
    }
  }
  return out;
}

function applyPcToolbar(text) {
  return text.replace(/\s*data-pc-toolbar(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "pc-toolbar",
    rewrite: "marker",
    scan: scanPcToolbar,
    apply(text, file) {
      return applyPcToolbar(text);
    },
  },
];
