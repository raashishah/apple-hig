import { hit } from "./shared.mjs";

function hasAr(text) {
  return (
    /\bdata-ar\b/.test(text) ||
    /\bARView\b/.test(text) ||
    /\bARSCNView\b/.test(text) ||
    /\bARQuickLookPreviewing\b/.test(text) ||
    /\brel=["']ar["']/.test(text)
  );
}

function hasArJargonCopy(text) {
  return (
    /world detection/i.test(text) ||
    /adjust tracking/i.test(text) ||
    /anchor an object/i.test(text) ||
    /find a plane/i.test(text)
  );
}

function hasArGlyphMisusedCopy(text) {
  return (
    /not created using ARKit/i.test(text) ||
    /not created with ARKit/i.test(text) ||
    /\bnon-ARKit\b/i.test(text)
  );
}

function scanArJargon(files) {
  const out = [];
  for (const f of files) {
    if (/data-ar-jargon/.test(f.text)) {
      out.push(
        hit(f.path, "world detection, adjust tracking, or plane to anchor in user-facing copy"),
      );
      continue;
    }
    if (!hasAr(f.text)) continue;
    if (hasArJargonCopy(f.text)) {
      out.push(
        hit(f.path, "world detection, adjust tracking, or plane to anchor in user-facing copy"),
      );
    }
  }
  return out;
}

function applyArJargon(text) {
  return text.replace(/\s*data-ar-jargon(?:="[^"]*")?/g, "");
}

function scanArGlyphMisused(files) {
  const out = [];
  for (const f of files) {
    if (/data-ar-altered/.test(f.text) || /data-ar-non-arkit/.test(f.text)) {
      out.push(
        hit(f.path, "altered ar glyph or ar badge, or used for a non-arkit experience"),
      );
      continue;
    }
    if (!hasAr(f.text)) continue;
    if (hasArGlyphMisusedCopy(f.text)) {
      out.push(
        hit(f.path, "altered ar glyph or ar badge, or used for a non-arkit experience"),
      );
    }
  }
  return out;
}

function applyArGlyphMisused(text) {
  return text
    .replace(/\s*data-ar-altered(?:="[^"]*")?/g, "")
    .replace(/\s*data-ar-non-arkit(?:="[^"]*")?/g, "");
}

function hasArBadge(text) {
  return /\bdata-ar-badge\b/.test(text) || /\bARBadge\s*\(/.test(text) || /alt=["']AR Badge["']/i.test(text);
}

function hasBadgeClearanceZero(text) {
  if (!hasAr(text) || !hasArBadge(text)) return false;
  return /\b(?:clearSpace|badgeClearance)\s*[:=]\s*\{?\s*["']?0(?![\d.])/.test(text);
}

function hasArBadgeCopy(text) {
  return /occlude the badge/i.test(text);
}

function scanArBadge(files) {
  const out = [];
  for (const f of files) {
    if (/data-xr-badge(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an AR badge with no clear space"));
      continue;
    }
    if (!hasAr(f.text) || !hasArBadge(f.text)) continue;
    if (hasBadgeClearanceZero(f.text) || hasArBadgeCopy(f.text)) {
      out.push(hit(f.path, "an AR badge with no clear space"));
    }
  }
  return out;
}

function applyArBadge(text) {
  return text.replace(/\s*data-xr-badge(?:="[^"]*")?(?![\w-])/g, "");
}

function hasArGlyph(text) {
  return /\bdata-ar-glyph\b/.test(text) || /\bARGlyph\s*\(/.test(text) || /alt=["']AR Glyph["']/i.test(text);
}

function tagHasGlyphZero(tag) {
  const glyph = /alt=["']AR Glyph["']/i.test(tag) || /\bdata-ar-glyph\b/.test(tag);
  if (!glyph) return false;
  return /\b(?:clearSpace|glyphClearance)\s*[:=]\s*\{?\s*["']?0(?![\d.])/.test(tag);
}

function hasGlyphClearanceZero(text) {
  if (!hasAr(text) || !hasArGlyph(text)) return false;
  const re = /<[^>]+>/g;
  let found;
  while ((found = re.exec(text))) {
    if (tagHasGlyphZero(found[0])) return true;
  }
  return /\bARGlyph\s*\([^)]*clearSpace\s*:\s*0(?![\d.])/.test(text);
}

function hasArGlyphCopy(text) {
  return /occlude the glyph/i.test(text);
}

function scanArGlyph(files) {
  const out = [];
  for (const f of files) {
    if (/data-xr-glyph(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an AR glyph with no clear space"));
      continue;
    }
    if (!hasAr(f.text) || !hasArGlyph(f.text)) continue;
    if (hasGlyphClearanceZero(f.text) || hasArGlyphCopy(f.text)) {
      out.push(hit(f.path, "an AR glyph with no clear space"));
    }
  }
  return out;
}

function applyArGlyph(text) {
  return text.replace(/\s*data-xr-glyph(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "ar-jargon",
    rewrite: "marker",
    scan: scanArJargon,
    apply(text, file) {
      return applyArJargon(text);
    },
  },
  {
    id: "ar-glyph-misused",
    rewrite: "marker",
    scan: scanArGlyphMisused,
    apply(text, file) {
      return applyArGlyphMisused(text);
    },
  },
  {
    id: "ar-badge",
    rewrite: "marker",
    scan: scanArBadge,
    apply(text, file) {
      return applyArBadge(text);
    },
  },
  {
    id: "ar-glyph",
    rewrite: "marker",
    scan: scanArGlyph,
    apply(text, file) {
      return applyArGlyph(text);
    },
  },
];
