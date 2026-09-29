import { hit } from "./shared.mjs";

function hasFocusSystem(text) {
  return (
    /\bdata-focus-system\b/.test(text) ||
    /\bdata-focus-ring\b/.test(text) ||
    /\bUIFocusHaloEffect\b/.test(text) ||
    /\bfocusGroupIdentifier\b/.test(text) ||
    /\bNSFocusRingType\b/.test(text) ||
    /\bpreferredFocusEnvironments\b/.test(text)
  );
}

function scanStealFocus(files) {
  const out = [];
  for (const f of files) {
    if (/data-steal-focus/.test(f.text)) {
      out.push(hit(f.path, "focus changed without people's interaction"));
      continue;
    }
    if (!hasFocusSystem(f.text)) continue;
    if (/\.focus\s*\(/.test(f.text)) {
      out.push(hit(f.path, "focus changed without people's interaction"));
    }
  }
  return out;
}

function applyStealFocus(text) {
  return text.replace(/\s*data-steal-focus(?:="[^"]*")?/g, "");
}

function scanCustomFocusEffect(files) {
  const out = [];
  for (const f of files) {
    if (/data-custom-focus-effect/.test(f.text)) {
      out.push(hit(f.path, "custom focus effects that replace the system effect"));
    }
  }
  return out;
}

function applyCustomFocusEffect(text) {
  return text.replace(/\s*data-custom-focus-effect(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "steal-focus",
    rewrite: "marker",
    scan: scanStealFocus,
    apply(text, file) {
      return applyStealFocus(text);
    },
  },
  {
    id: "custom-focus-effect",
    rewrite: "marker",
    scan: scanCustomFocusEffect,
    apply(text, file) {
      return applyCustomFocusEffect(text);
    },
  },
];
