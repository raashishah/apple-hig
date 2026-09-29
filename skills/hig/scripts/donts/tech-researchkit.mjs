import { hit } from "./shared.mjs";

function hasStudy(text) {
  return /\bdata-researchkit\b/.test(text);
}

function hasRkCriticalCopy(text) {
  return (
    /data that isn['’]?t critical to (?:your|the) study/i.test(text) ||
    /isn['’]?t critical to (?:your|the) study/i.test(text) ||
    /request access to data that isn['’]?t critical/i.test(text)
  );
}

function hasRkCriticalSignal(text) {
  if (!hasStudy(text)) return false;
  return /\bnot critical to (?:your|the) study\b/i.test(text);
}

function scanRkCritical(files) {
  const out = [];
  for (const f of files) {
    if (/data-rk-critical/.test(f.text)) {
      out.push(hit(f.path, "data that isn't critical to the study"));
      continue;
    }
    if (!hasStudy(f.text)) continue;
    if (hasRkCriticalCopy(f.text) || hasRkCriticalSignal(f.text)) {
      out.push(hit(f.path, "data that isn't critical to the study"));
    }
  }
  return out;
}

function applyRkCritical(text) {
  return text.replace(/\s*data-rk-critical(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "rk-critical",
    rewrite: "marker",
    scan: scanRkCritical,
    apply(text, file) {
      return applyRkCritical(text);
    },
  },
];
