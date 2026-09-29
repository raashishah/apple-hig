import { hit } from "./shared.mjs";

function hasActionButton(text) {
  return /\bdata-action-button\b/.test(text);
}

function hasAbLongLabelCopy(text) {
  if (/longer than three words/i.test(text)) return true;
  const labeled = /\bdata-ab-label="([^"]*)"/g;
  let match;
  while ((match = labeled.exec(text))) {
    const words = match[1].trim().split(/\s+/).filter(Boolean);
    if (words.length > 3) return true;
  }
  return false;
}

function hasAbSettingsCopy(text) {
  return /repeats the Settings guidance/i.test(text);
}

function scanAbLongLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-ab-long-label/.test(f.text)) {
      out.push(hit(f.path, "an Action button label longer than three words"));
      continue;
    }
    if (!hasActionButton(f.text)) continue;
    if (hasAbLongLabelCopy(f.text)) {
      out.push(hit(f.path, "an Action button label longer than three words"));
    }
  }
  return out;
}

function applyAbLongLabel(text) {
  return text.replace(/\s*data-ab-long-label(?:="[^"]*")?/g, "");
}

function scanAbSettingsRepeat(files) {
  const out = [];
  for (const f of files) {
    if (/data-ab-settings-repeat/.test(f.text)) {
      out.push(hit(f.path, "content that repeats the Settings guidance for the Action button"));
      continue;
    }
    if (!hasActionButton(f.text)) continue;
    if (hasAbSettingsCopy(f.text)) {
      out.push(hit(f.path, "content that repeats the Settings guidance for the Action button"));
    }
  }
  return out;
}

function applyAbSettingsRepeat(text) {
  return text.replace(/\s*data-ab-settings-repeat(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "ab-long-label",
    rewrite: "marker",
    scan: scanAbLongLabel,
    apply(text, file) {
      return applyAbLongLabel(text);
    },
  },
  {
    id: "ab-settings-repeat",
    rewrite: "marker",
    scan: scanAbSettingsRepeat,
    apply(text, file) {
      return applyAbSettingsRepeat(text);
    },
  },
];
