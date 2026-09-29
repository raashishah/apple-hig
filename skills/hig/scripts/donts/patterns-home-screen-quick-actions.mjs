import { hit } from "./shared.mjs";

function hasQuickAction(text) {
  return (
    /\bdata-quick-action\b/.test(text) ||
    /\bUIApplicationShortcutItem\b/.test(text) ||
    /\bUIMutableApplicationShortcutItem\b/.test(text) ||
    /\bUIApplicationShortcutItems\b/.test(text)
  );
}

function scanQuickActionAppName(files) {
  const out = [];
  for (const f of files) {
    if (/data-quick-action-app-name/.test(f.text)) {
      out.push(
        hit(f.path, "app name or extra copy in a home screen quick-action title"),
      );
    }
  }
  return out;
}

function applyQuickActionAppName(text) {
  return text.replace(/\s*data-quick-action-app-name(?:="[^"]*")?/g, "");
}

function hasQuickActionEmoji(text) {
  return /\p{Extended_Pictographic}/u.test(text);
}

function scanQuickActionEmoji(files) {
  const out = [];
  for (const f of files) {
    if (/data-quick-action-emoji/.test(f.text)) {
      out.push(
        hit(f.path, "an emoji used in place of a home screen quick-action symbol"),
      );
      continue;
    }
    if (!hasQuickAction(f.text)) continue;
    if (hasQuickActionEmoji(f.text)) {
      out.push(
        hit(f.path, "an emoji used in place of a home screen quick-action symbol"),
      );
    }
  }
  return out;
}

function applyQuickActionEmoji(text) {
  return text.replace(/\s*data-quick-action-emoji(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "quick-action-app-name",
    rewrite: "marker",
    scan: scanQuickActionAppName,
    apply(text, file) {
      return applyQuickActionAppName(text);
    },
  },
  {
    id: "quick-action-emoji",
    rewrite: "marker",
    scan: scanQuickActionEmoji,
    apply(text, file) {
      return applyQuickActionEmoji(text);
    },
  },
];
