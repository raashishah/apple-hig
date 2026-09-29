import { hit } from "./shared.mjs";

function hasHaptic(text) {
  return (
    /\bdata-haptic\b/.test(text) ||
    /\bUIFeedbackGenerator\b/.test(text) ||
    /\bUIImpactFeedbackGenerator\b/.test(text) ||
    /\bUINotificationFeedbackGenerator\b/.test(text) ||
    /\bUISelectionFeedbackGenerator\b/.test(text) ||
    /\bCHHapticEngine\b/.test(text) ||
    /\bnavigator\.vibrate\s*\(/.test(text) ||
    /\bsensoryFeedback\b/.test(text)
  );
}

function scanHapticWrongMeaning(files) {
  const out = [];
  for (const f of files) {
    if (/data-haptic-wrong-meaning/.test(f.text)) {
      out.push(hit(f.path, "a system haptic pattern used to mean something else"));
    }
  }
  return out;
}

function applyHapticWrongMeaning(text) {
  return text.replace(/\s*data-haptic-wrong-meaning(?:="[^"]*")?/g, "");
}

function scanOverusedHaptics(files) {
  const out = [];
  for (const f of files) {
    if (/data-haptic-overuse/.test(f.text)) {
      out.push(hit(f.path, "overused haptics"));
    }
  }
  return out;
}

function applyOverusedHaptics(text) {
  return text.replace(/\s*data-haptic-overuse(?:="[^"]*")?/g, "");
}

function hasHapticMute(text) {
  return /haptic[s]?[^\n]{0,80}\b(off|mute|optional)\b/i.test(text);
}

function scanHapticNotOptional(files) {
  const out = [];
  for (const f of files) {
    if (/data-haptic-required/.test(f.text)) {
      out.push(hit(f.path, "haptics with no way to turn them off"));
      continue;
    }
    if (!hasHaptic(f.text)) continue;
    if (/\bnavigator\.vibrate\s*\(/.test(f.text) && !hasHapticMute(f.text)) {
      out.push(hit(f.path, "haptics with no way to turn them off"));
    }
  }
  return out;
}

function applyHapticNotOptional(text) {
  return text.replace(/\s*data-haptic-required(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "haptic-wrong-meaning",
    rewrite: "marker",
    scan: scanHapticWrongMeaning,
    apply(text, file) {
      return applyHapticWrongMeaning(text);
    },
  },
  {
    id: "overused-haptics",
    rewrite: "marker",
    scan: scanOverusedHaptics,
    apply(text, file) {
      return applyOverusedHaptics(text);
    },
  },
  {
    id: "haptic-not-optional",
    rewrite: "marker",
    scan: scanHapticNotOptional,
    apply(text, file) {
      return applyHapticNotOptional(text);
    },
  },
];
