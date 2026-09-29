import { hit } from "./shared.mjs";

function scanSettingsAsControlCenter(files) {
  const out = [];
  for (const f of files) {
    if (/\bControlWidget(?:Toggle|Button)?\b/.test(f.text)) continue;
    if (/data-control-center/.test(f.text) || /Control Center settings row/i.test(f.text)) {
      out.push(hit(f.path, "settings row styled as Control Center"));
    }
  }
  return out;
}

function applySettingsAsControlCenter(text) {
  if (/\bControlWidget(?:Toggle|Button)?\b/.test(text)) return text;
  return text.replace(/\s*data-control-center(?:="[^"]*")?/g, "");
}

function scanControlToggleOneSymbol(files) {
  const out = [];
  for (const f of files) {
    if (!/\bControlWidgetToggle\b/.test(f.text)) continue;
    const images = [...f.text.matchAll(/systemImage:\s*["']([^"']+)["']/g)].map((m) => m[1]);
    if (images.length === 1) {
      out.push(hit(f.path, "Control Center toggle has one symbol"));
    }
  }
  return out;
}

function scanLockedControlUnredacted(files) {
  const out = [];
  for (const f of files) {
    if (!/\bControlWidget/.test(f.text) && !/data-control-locked/.test(f.text)) continue;
    const locked = /isLocked|data-control-locked/.test(f.text);
    const redacted = /privacySensitive|\.redacted\(|data-redact/.test(f.text);
    if (locked && !redacted) {
      out.push(hit(f.path, "locked control shows personal title/value"));
    }
  }
  return out;
}

export const records = [
  {
    id: "settings-row-as-control-center",
    rewrite: "host",
    scan: scanSettingsAsControlCenter,
    apply(text, file) {
      return applySettingsAsControlCenter(text);
    },
  },
  {
    id: "control-toggle-one-symbol",
    rewrite: "marker",
    scan: scanControlToggleOneSymbol,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "locked-control-unredacted",
    rewrite: "marker",
    scan: scanLockedControlUnredacted,
    apply(text, file) {
      return text;
    },
  },
];
