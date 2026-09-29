import { hit } from "./shared.mjs";

function hasShareplay(text) {
  return (
    /\bdata-shareplay\b/.test(text) ||
    /\bGroupActivity\b/.test(text) ||
    /\bGroupSession\b/.test(text) ||
    /\bActivitySharingView\b/.test(text)
  );
}

function hasShareplayAdjective(text) {
  return (
    /\b(virtual|spatial)\s+SharePlay\b/i.test(text) ||
    /\bSharePlay\s+(virtual|spatial)\b/i.test(text)
  );
}

function hasShareplayInflected(text) {
  return /\bSharePlay(ed|s|ing)\b/.test(text);
}

function scanShareplayAdjective(files) {
  const out = [];
  for (const f of files) {
    if (/data-shareplay-adjective/.test(f.text)) {
      out.push(hit(f.path, "shareplay paired with an adjective"));
      continue;
    }
    if (!hasShareplay(f.text)) continue;
    if (hasShareplayAdjective(f.text)) {
      out.push(hit(f.path, "shareplay paired with an adjective"));
    }
  }
  return out;
}

function applyShareplayAdjective(text) {
  return text.replace(/\s*data-shareplay-adjective(?:="[^"]*")?/g, "");
}

function scanShareplayInflected(files) {
  const out = [];
  for (const f of files) {
    if (/data-shareplay-inflected/.test(f.text)) {
      out.push(hit(f.path, "shareplayed, shareplays, or shareplaying"));
      continue;
    }
    if (!hasShareplay(f.text)) continue;
    if (hasShareplayInflected(f.text)) {
      out.push(hit(f.path, "shareplayed, shareplays, or shareplaying"));
    }
  }
  return out;
}

function applyShareplayInflected(text) {
  return text.replace(/\s*data-shareplay-inflected(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "shareplay-adjective",
    rewrite: "marker",
    scan: scanShareplayAdjective,
    apply(text, file) {
      return applyShareplayAdjective(text);
    },
  },
  {
    id: "shareplay-inflected",
    rewrite: "marker",
    scan: scanShareplayInflected,
    apply(text, file) {
      return applyShareplayInflected(text);
    },
  },
];
