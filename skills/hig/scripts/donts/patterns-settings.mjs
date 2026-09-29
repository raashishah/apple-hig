import { hit, applyOpaqueBrandBars } from "./shared.mjs";

function fileHasSettings(file) {
  return (
    /data-settings/.test(file.text) ||
    /\bSettingsLink\b/.test(file.text) ||
    /<(h1|h2)[^>]*>\s*(Settings|Preferences)\s*</i.test(file.text) ||
    /Settings(View|Screen|Page|Form)?\.(tsx|jsx|swift|vue|html)\b/i.test(file.path)
  );
}

function scanSettingsFirstRun(files) {
  const out = [];
  const blob = files.map((f) => f.text).join("\n");
  if (!files.some(fileHasSettings)) return out;
  if (
    /(isOnboarding|data-onboarding|first-?run)[\s\S]{0,400}(settingsComplete|mustOpenSettings|requiredSettings|\/settings)/i.test(
      blob,
    ) ||
    /(settingsComplete|hasCompletedSettings|requireSettings)\s*(\?|&&)/.test(blob)
  ) {
    const f = files.find(fileHasSettings) || files[0];
    out.push(hit(f.path, "Settings required to finish first-run"));
  }
  return out;
}

function scanNestedPrefs(files) {
  const out = [];
  for (const f of files) {
    if (!fileHasSettings(f)) continue;
    const grouped = /<(fieldset|section)\b/i.test(f.text) || /\bSection\s*[\({]/.test(f.text);
    const marks = [
      ...(f.text.match(/[›→]/g) || []),
      ...(f.text.match(/data-chevron/g) || []),
      ...(f.text.match(/chevron\.right|ChevronRight/g) || []),
      ...(f.text.match(/>\{\s*["']>["']\s*\}/g) || []),
    ];
    if (!grouped && marks.length >= 3) {
      out.push(hit(f.path, "settings prefs nested under chevrons with no grouping"));
    }
  }
  return out;
}

function scanRethemeSettings(files) {
  const out = [];
  for (const f of files) {
    if (!fileHasSettings(f)) continue;
    if (
      /(background(?:-color|Color)?|barTintColor)\s*[:=]\s*["']?#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/i.test(
        f.text,
      ) ||
      /data-fashion-glass/.test(f.text)
    ) {
      out.push(hit(f.path, "re-themed Settings chrome"));
    }
  }
  return out;
}

function applyRethemeSettings(text) {
  let next = applyOpaqueBrandBars(text);
  next = next.replace(/\s*barTintColor=["']#[0-9a-fA-F]{3,8}["']/g, "");
  next = next.replace(/\s*data-fashion-glass(?:="[^"]*")?/g, "");
  return next;
}

export const records = [
  {
    id: "settings-required-for-first-run",
    rewrite: "marker",
    scan: scanSettingsFirstRun,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "nested-prefs-no-grouping",
    rewrite: "marker",
    scan: scanNestedPrefs,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "retheme-system-settings",
    rewrite: "host",
    scan: scanRethemeSettings,
    apply(text, file) {
      return applyRethemeSettings(text);
    },
  },
];
