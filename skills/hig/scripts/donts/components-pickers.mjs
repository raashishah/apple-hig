import { hit, blocksWithAttr } from "./shared.mjs";

function scanPickerScreen(files) {
  const out = [];
  for (const f of files) {
    const marker =
      /data-picker-screen/.test(f.text) || /Picker(Screen|Page)\.(tsx|jsx|swift|vue|html)\b/i.test(f.path);
    if (!marker) continue;
    const hasPicker = /<select\b|\bPicker\s*\(|<input\b[^>]*type=["']date["']/.test(f.text);
    const otherWork = /<textarea\b|<table\b|data-list-pane|<ul\b/.test(f.text);
    if (hasPicker && !otherWork) {
      out.push(hit(f.path, "screen whose only job is a picker"));
    }
  }
  return out;
}

function scanStepperNoValue(files) {
  const out = [];
  for (const f of files) {
    if (!/data-stepper|\bUIStepper\b|\bStepper\s*\(/.test(f.text)) continue;
    if (/<input\b|<output\b|aria-valuenow|data-stepper-value/.test(f.text)) continue;
    out.push(hit(f.path, "stepper with no neighbouring value"));
  }
  return out;
}

function scanOverweightWheel(files) {
  const out = [];
  for (const f of files) {
    if (/\.swift$/i.test(f.path)) continue;
    if (!/data-ios-wheel|wheel-picker|className=["'][^"']*wheel/.test(f.text)) continue;
    out.push(hit(f.path, "overweight wheel for a short list"));
  }
  return out;
}

function applyOverweightWheel(text, file) {
  if (/\.swift$/i.test(file.path)) return text;
  const blocks = [
    ...blocksWithAttr(text, "data-ios-wheel"),
    ...blocksWithAttr(text, "wheel-picker"),
  ];
  if (!blocks.length) return text;
  const seen = new Set();
  let next = text;
  for (const b of [...blocks].sort((a, c) => c.start - a.start)) {
    const key = `${b.start}:${b.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const inner = b.text.replace(/^<[^>]+>/, "").replace(/<\/[A-Za-z][\w]*>\s*$/, "");
    const opts = [...inner.matchAll(/<(div|li|option)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
      .map((m) => m[2].replace(/<[^>]+>/g, "").trim())
      .filter(Boolean);
    if (!opts.length) continue;
    const select = `<select>\n${opts.map((o) => `  <option>${o}</option>`).join("\n")}\n</select>`;
    next = next.slice(0, b.start) + select + next.slice(b.end);
  }
  return next;
}

export const records = [
  {
    id: "picker-owns-the-screen",
    rewrite: "marker",
    scan: scanPickerScreen,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "stepper-no-neighbouring-value",
    rewrite: "marker",
    scan: scanStepperNoValue,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "overweight-wheel-short-list",
    rewrite: "host",
    scan: scanOverweightWheel,
    apply(text, file) {
      return applyOverweightWheel(text, file);
    },
  },
];
