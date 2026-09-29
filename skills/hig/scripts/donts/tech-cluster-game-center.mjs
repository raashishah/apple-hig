import { hit, hasGameCenter } from "./shared.mjs";

function hasGcGameplayCopy(text) {
  return (
    /access point shown during active gameplay/i.test(text) ||
    (/during active gameplay/i.test(text) && /access point/i.test(text))
  );
}

function hasGcArtworkCopy(text) {
  return (
    /artwork resized or restyled/i.test(text) ||
    (/artwork/i.test(text) && /resized or restyled|adjust the dimensions/i.test(text))
  );
}

function hasGcTermsCopy(text) {
  return (
    /\bGameKit\b/.test(text) ||
    /\bGameCenter\b/.test(text) ||
    /\bgame center\b/.test(text) ||
    /\bAwards\b/.test(text) ||
    /\bRankings\b/.test(text)
  );
}

function scanGcGameplay(files) {
  const out = [];
  for (const f of files) {
    if (/data-gc-gameplay/.test(f.text)) {
      out.push(hit(f.path, "the access point shown during active gameplay"));
      continue;
    }
    if (!hasGameCenter(f.text)) continue;
    if (hasGcGameplayCopy(f.text)) {
      out.push(hit(f.path, "the access point shown during active gameplay"));
    }
  }
  return out;
}

function applyGcGameplay(text) {
  return text.replace(/\s*data-gc-gameplay(?:="[^"]*")?/g, "");
}

function scanGcArtwork(files) {
  const out = [];
  for (const f of files) {
    if (/data-gc-artwork/.test(f.text)) {
      out.push(hit(f.path, "official game center artwork resized or restyled"));
      continue;
    }
    if (!hasGameCenter(f.text)) continue;
    if (hasGcArtworkCopy(f.text)) {
      out.push(hit(f.path, "official game center artwork resized or restyled"));
    }
  }
  return out;
}

function applyGcArtwork(text) {
  return text.replace(/\s*data-gc-artwork(?:="[^"]*")?/g, "");
}

function scanGcTerms(files) {
  const out = [];
  for (const f of files) {
    if (/data-gc-terms/.test(f.text)) {
      out.push(hit(f.path, "custom links that say gamekit game center awards or rankings"));
      continue;
    }
    if (!hasGameCenter(f.text)) continue;
    if (hasGcTermsCopy(f.text)) {
      out.push(hit(f.path, "custom links that say gamekit game center awards or rankings"));
    }
  }
  return out;
}

function applyGcTerms(text) {
  return text.replace(/\s*data-gc-terms(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "gc-gameplay",
    rewrite: "marker",
    scan: scanGcGameplay,
    apply(text, file) {
      return applyGcGameplay(text);
    },
  },
  {
    id: "gc-artwork",
    rewrite: "marker",
    scan: scanGcArtwork,
    apply(text, file) {
      return applyGcArtwork(text);
    },
  },
  {
    id: "gc-terms",
    rewrite: "marker",
    scan: scanGcTerms,
    apply(text, file) {
      return applyGcTerms(text);
    },
  },
];
