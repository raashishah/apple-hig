import { hit } from "./shared.mjs";

function hasGameControl(text) {
  return /\bdata-game-controls\b/.test(text);
}

function hasGmLetterCopy(text) {
  return (
    /abstract shapes or controller-based naming/i.test(text) ||
    /\bA,\s*X,\s*or\s*R1\b/.test(text)
  );
}

function hasGmLetterArtwork(text) {
  if (!hasGameControl(text)) return false;
  if (/<(?:button|Button)\b[^>]*>\s*(?:A|X|R1)\s*<\/(?:button|Button)>/.test(text)) return true;
  return /\bButton\s*\(\s*"(?:A|X|R1)"\s*\)/.test(text);
}

function scanGmLetter(files) {
  const out = [];
  for (const f of files) {
    if (/data-gm-letter/.test(f.text)) {
      out.push(hit(f.path, "abstract shapes or A, X, or R1 as artwork"));
      continue;
    }
    if (!hasGameControl(f.text)) continue;
    if (hasGmLetterCopy(f.text) || hasGmLetterArtwork(f.text)) {
      out.push(hit(f.path, "abstract shapes or A, X, or R1 as artwork"));
    }
  }
  return out;
}

function applyGmLetter(text) {
  return text.replace(/\s*data-gm-letter(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "gm-letter",
    rewrite: "marker",
    scan: scanGmLetter,
    apply(text, file) {
      return applyGmLetter(text);
    },
  },
];
