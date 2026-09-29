import { hit } from "./shared.mjs";

function hasDuo(text) {
  return /\bdata-duo\b/.test(text);
}

function hasIdReinventCopy(text) {
  return /reinvent (?:your|the) app when it resizes/i.test(text);
}

function hasIdFixedCopy(text) {
  return /fixed widths/i.test(text) || /display-specific dependencies/i.test(text);
}

function hasIdFixedSignal(text) {
  return /@media[^{]*device-width/i.test(text) || /\bUIScreen\.main\.bounds\b/.test(text);
}

function hasIdFoldCopy(text) {
  return /extreme layout changes/i.test(text) || /layout changes as people fold/i.test(text);
}

function scanIdReinvent(files) {
  const out = [];
  for (const f of files) {
    if (/data-id-reinvent/.test(f.text)) {
      out.push(hit(f.path, "reinvent the app when it resizes"));
      continue;
    }
    if (!hasDuo(f.text)) continue;
    if (hasIdReinventCopy(f.text)) out.push(hit(f.path, "reinvent the app when it resizes"));
  }
  return out;
}

function scanIdFixed(files) {
  const out = [];
  for (const f of files) {
    if (/data-id-fixed/.test(f.text)) {
      out.push(hit(f.path, "fixed widths and display-specific dependencies"));
      continue;
    }
    if (!hasDuo(f.text)) continue;
    if (hasIdFixedCopy(f.text) || hasIdFixedSignal(f.text)) {
      out.push(hit(f.path, "fixed widths and display-specific dependencies"));
    }
  }
  return out;
}

function scanIdFold(files) {
  const out = [];
  for (const f of files) {
    if (/data-id-fold/.test(f.text)) {
      out.push(hit(f.path, "extreme layout changes as people fold"));
      continue;
    }
    if (!hasDuo(f.text)) continue;
    if (hasIdFoldCopy(f.text)) out.push(hit(f.path, "extreme layout changes as people fold"));
  }
  return out;
}

function applyIdReinvent(text) {
  return text.replace(/\s*data-id-reinvent(?:="[^"]*")?/g, "");
}

function applyIdFixed(text) {
  return text.replace(/\s*data-id-fixed(?:="[^"]*")?/g, "");
}

function applyIdFold(text) {
  return text.replace(/\s*data-id-fold(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "id-reinvent",
    rewrite: "marker",
    scan: scanIdReinvent,
    apply(text, file) {
      return applyIdReinvent(text);
    },
  },
  {
    id: "id-fixed",
    rewrite: "marker",
    scan: scanIdFixed,
    apply(text, file) {
      return applyIdFixed(text);
    },
  },
  {
    id: "id-fold",
    rewrite: "marker",
    scan: scanIdFold,
    apply(text, file) {
      return applyIdFold(text);
    },
  },
];
