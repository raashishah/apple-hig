import { hit } from "./shared.mjs";

function hasCameraControl(text) {
  return /\bdata-camera-control\b/.test(text) || /\bAVCaptureControl\b/.test(text);
}

function hasCcDuplicateCopy(text) {
  return /duplicating controls/i.test(text);
}

function scanCcDuplicate(files) {
  const out = [];
  for (const f of files) {
    if (/data-cc-duplicate/.test(f.text)) {
      out.push(hit(f.path, "duplicating controls in the UI and the Camera Control overlay"));
      continue;
    }
    if (!hasCameraControl(f.text)) continue;
    if (hasCcDuplicateCopy(f.text)) {
      out.push(hit(f.path, "duplicating controls in the UI and the Camera Control overlay"));
    }
  }
  return out;
}

function applyCcDuplicate(text) {
  return text.replace(/\s*data-cc-duplicate(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "cc-duplicate",
    rewrite: "marker",
    scan: scanCcDuplicate,
    apply(text, file) {
      return applyCcDuplicate(text);
    },
  },
];
