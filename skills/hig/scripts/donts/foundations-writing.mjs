import { hit, innerText, scanRewriteSystemAlerts, emptyStateRegions, matchingBrace } from "./shared.mjs";

const CUTE_ERROR =
  /\b(oops(?:ie)?|whoops(?:ie)?|uh-oh|uh oh|yikes|d'oh|my bad|nice try|silly|champ|butterfingers|try harder|not this time|well that didn't)\b/i;

const ERROR_NEXT_STEP =
  /\b(try again|enter a? ?valid|check your|retry|go back|use a different|contact|add a|choose a|re-?enter|fix the|correct the)\b/i;

const HELP_ATTR =
  /data-help|data-hint|aria-description|class(?:Name)?=["'][^"']*\b(?:help|hint|description|empty-state)\b/;

function errorRegions(text) {
  const out = [];
  const tagRe =
    /<(p|div|span|small)\b([^>]*(?:role=["']alert["']|aria-live|data-error|class(?:Name)?=["'][^"']*\berror\b)[^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = tagRe.exec(text))) out.push(innerText(m[3]));
  const assignRe =
    /\b(?:error(?:Message|Text)?|errMsg|setError)\s*(?:=|\()\s*["']([^"']+)["']/g;
  while ((m = assignRe.exec(text))) out.push(m[1]);
  return out;
}

function scanSarcasticError(files) {
  const out = [];
  for (const f of files) {
    for (const copy of errorRegions(f.text)) {
      if (CUTE_ERROR.test(copy) && !ERROR_NEXT_STEP.test(copy)) {
        out.push(hit(f.path, "sarcastic error without a next step"));
      }
    }
  }
  return out;
}

function isTitleCaseLong(s) {
  const words = String(s || "")
    .replace(/[^\w\s'-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 6) return false;
  const skip = new Set(["a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "at"]);
  let content = 0;
  let titled = 0;
  for (const w of words) {
    if (skip.has(w.toLowerCase())) continue;
    content += 1;
    if (/^[A-Z][a-z]/.test(w) || /^[A-Z]{2,}$/.test(w)) titled += 1;
  }
  return content >= 4 && titled >= Math.ceil(content * 0.7);
}

function toSentenceCase(s) {
  return String(s).replace(/[A-Za-z][A-Za-z']*/g, (word, offset, whole) => {
    if (/^[A-Z]{2,4}$/.test(word)) return word;
    const lead = whole.slice(0, offset);
    if (offset === 0 || /[.!?]\s*$/.test(lead)) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
  });
}

function helpSpans(text) {
  const spans = [];
  const tagRe = /<(p|small|span|div|em)\b([^>]*)>([^<]{8,})<\/\1>/gi;
  let m;
  while ((m = tagRe.exec(text))) {
    if (!HELP_ATTR.test(m[2])) continue;
    const inner = m[3];
    const start = m.index + m[0].indexOf(inner);
    spans.push({ start, end: start + inner.length, text: inner });
  }
  const propRe =
    /\b(?:helpText|description|emptyMessage|hintText)\s*[:=]\s*(["'])([^"']{8,})\1/g;
  while ((m = propRe.exec(text))) {
    const inner = m[2];
    const start = m.index + m[0].lastIndexOf(inner);
    spans.push({ start, end: start + inner.length, text: inner });
  }
  const ariaRe = /aria-description=["']([^"']{8,})["']/g;
  while ((m = ariaRe.exec(text))) {
    const inner = m[1];
    const start = m.index + m[0].indexOf(inner);
    spans.push({ start, end: start + inner.length, text: inner });
  }
  return spans;
}

function scanTitleCaseHelp(files) {
  const out = [];
  for (const f of files) {
    for (const span of helpSpans(f.text)) {
      if (isTitleCaseLong(span.text)) {
        out.push(hit(f.path, "title case on long help"));
      }
    }
  }
  return out;
}

function applyTitleCaseHelp(text) {
  const spans = helpSpans(text).filter((s) => isTitleCaseLong(s.text));
  if (!spans.length) return text;
  let next = text;
  for (const span of [...spans].sort((a, b) => b.start - a.start)) {
    next = next.slice(0, span.start) + toSentenceCase(span.text) + next.slice(span.end);
  }
  return next;
}

function stripWritingComments(text) {
  return String(text || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function stripWritingGuidance(text) {
  return String(text || "")
    .replace(/avoid using we altogether[.!?]?/gi, "")
    .replace(/visible copy that says we or we['’]re[.!?]?/gi, "");
}

function meaningfulWritingCopy(text) {
  const stripped = stripWritingGuidance(stripWritingComments(text));
  const bits = [];
  const nodes = />([^<]+)</g;
  let m;
  while ((m = nodes.exec(stripped))) bits.push(m[1]);
  const quotes = /(["'])([^"'\n]{1,180})\1/g;
  while ((m = quotes.exec(stripped))) bits.push(m[2]);
  return bits
    .map((bit) => bit.replace(/\s+/g, " ").trim())
    .filter((bit) => /[a-z0-9]/i.test(bit));
}

function copySaysWe(bits) {
  return bits.some((bit) => /\bwe\b/i.test(bit));
}

function hasWeGuidance(text) {
  return (
    /avoid using we altogether/i.test(text) ||
    /visible copy that says we or we['’]re/i.test(text)
  );
}

function scanWeCopy(files) {
  const out = [];
  for (const f of files) {
    if (/data-wr-we(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "visible copy that says we or we're"));
      continue;
    }
    const bits = meaningfulWritingCopy(f.text);
    if (copySaysWe(bits) || (bits.length > 0 && hasWeGuidance(f.text))) {
      out.push(hit(f.path, "visible copy that says we or we're"));
    }
  }
  return out;
}

function applyWeCopy(text) {
  return text.replace(/\s*data-wr-we(?:="[^"]*")?(?![\w-])/g, "");
}

function hasRoboticInvalidName(text) {
  const stripped = stripWritingComments(text).replace(
    /avoid robotic error messages with no helpful information, like ["“]?invalid name\.?["”]?/gi,
    "",
  );
  const nodes = />([^<]+)</g;
  let found;
  while ((found = nodes.exec(stripped))) {
    if (/^\s*Invalid name\.?\s*$/i.test(found[1])) return true;
  }
  return /\bText\s*\(\s*"Invalid name\.?"\s*\)/.test(stripped);
}

function scanRoboticInvalidName(files) {
  const out = [];
  for (const f of files) {
    if (/data-wr-name(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a robotic error that says Invalid name"));
      continue;
    }
    if (hasRoboticInvalidName(f.text)) {
      out.push(hit(f.path, "a robotic error that says Invalid name"));
    }
  }
  return out;
}

function applyRoboticInvalidName(text) {
  return text.replace(/\s*data-wr-name(?:="[^"]*")?(?![\w-])/g, "");
}

function hasClickHereLink(text) {
  const stripped = stripWritingComments(text).replace(
    /for links, avoid using ["“]?click here\.?["”]?/gi,
    "",
  );
  const tags = /<(a|button)\b[^>]*>([^<]*)<\/\1>/gi;
  let found;
  while ((found = tags.exec(stripped))) {
    if (/^\s*click here\.?\s*$/i.test(found[2])) return true;
  }
  return /\b(?:Link|Button)\s*\(\s*"click here\.?"/i.test(stripped);
}

function scanClickHereLink(files) {
  const out = [];
  for (const f of files) {
    if (/data-wr-here(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a link that says Click here"));
      continue;
    }
    if (hasClickHereLink(f.text)) {
      out.push(hit(f.path, "a link that says Click here"));
    }
  }
  return out;
}

function applyClickHereLink(text) {
  return text.replace(/\s*data-wr-here(?:="[^"]*")?(?![\w-])/g, "");
}

function matchingParen(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function contentUnavailableRegions(text) {
  const out = [];
  const re = /\bContentUnavailableView\b/g;
  let m;
  while ((m = re.exec(text))) {
    const start = m.index;
    const paren = text.indexOf("(", start);
    let end = start + m[0].length;
    if (paren >= 0 && paren - start < 40) {
      const closeParen = matchingParen(text, paren);
      end = closeParen > paren ? closeParen + 1 : end;
      const braceAt = text.slice(end, end + 40).search(/\{/);
      if (braceAt >= 0) {
        const open = end + braceAt;
        const close = matchingBrace(text, open);
        if (close > open) end = close + 1;
      }
    }
    out.push(text.slice(start, end));
    if (end > re.lastIndex) re.lastIndex = end;
  }
  return out;
}

function crucialEmptyRegions(text) {
  return [...emptyStateRegions(text), ...contentUnavailableRegions(text)];
}

function regionShowsCrucialSecret(region) {
  const stripped = stripWritingComments(region);
  return (
    /\b(?:password|passcode|recovery key)\b/i.test(stripped) ||
    /\btype\s*=\s*["']password["']/i.test(stripped) ||
    /\bSecureField\s*\(/.test(stripped)
  );
}

function hasEmptyStateWidget(text) {
  return crucialEmptyRegions(text).length > 0;
}

function hasCrucialEmptyCopy(text) {
  return /crucial information that could then disappear/i.test(text);
}

function scanEmptyCrucial(files) {
  const out = [];
  for (const f of files) {
    if (/data-wr-gone(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "crucial information in a temporary empty state"));
      continue;
    }
    if (crucialEmptyRegions(f.text).some(regionShowsCrucialSecret)) {
      out.push(hit(f.path, "crucial information in a temporary empty state"));
      continue;
    }
    if (hasCrucialEmptyCopy(f.text) && hasEmptyStateWidget(f.text)) {
      out.push(hit(f.path, "crucial information in a temporary empty state"));
    }
  }
  return out;
}

function applyEmptyCrucial(text) {
  return text.replace(/\s*data-wr-gone(?:="[^"]*")?(?![\w-])/g, "");
}

function hasNumbersSymbolsError(text) {
  const stripped = stripWritingComments(text).replace(
    /better than ["“]?don['’]t use numbers or symbols\.?["”]?/gi,
    "",
  );
  const nodes = />([^<]+)</g;
  let found;
  while ((found = nodes.exec(stripped))) {
    if (/^\s*don['’]t use numbers or symbols\.?\s*$/i.test(found[1])) return true;
  }
  return /\bText\s*\(\s*"don['’]t use numbers or symbols\.?"\s*\)/i.test(stripped);
}

function scanNumbersSymbolsError(files) {
  const out = [];
  for (const f of files) {
    if (/data-wr-sym(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an error that says Don't use numbers or symbols"));
      continue;
    }
    if (hasNumbersSymbolsError(f.text)) {
      out.push(hit(f.path, "an error that says Don't use numbers or symbols"));
    }
  }
  return out;
}

function applyNumbersSymbolsError(text) {
  return text.replace(/\s*data-wr-sym(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "sarcastic-error-hides-fix",
    rewrite: "marker",
    scan: scanSarcasticError,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "title-case-long-help",
    rewrite: "host",
    scan: scanTitleCaseHelp,
    apply(text, file) {
      return applyTitleCaseHelp(text);
    },
  },
  {
    id: "rewrite-system-alerts",
    rewrite: "marker",
    scan: scanRewriteSystemAlerts,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "wr-we",
    rewrite: "marker",
    scan: scanWeCopy,
    apply(text, file) {
      return applyWeCopy(text);
    },
  },
  {
    id: "wr-name",
    rewrite: "marker",
    scan: scanRoboticInvalidName,
    apply(text, file) {
      return applyRoboticInvalidName(text);
    },
  },
  {
    id: "wr-here",
    rewrite: "marker",
    scan: scanClickHereLink,
    apply(text, file) {
      return applyClickHereLink(text);
    },
  },
  {
    id: "wr-gone",
    rewrite: "marker",
    scan: scanEmptyCrucial,
    apply(text, file) {
      return applyEmptyCrucial(text);
    },
  },
  {
    id: "wr-sym",
    rewrite: "marker",
    scan: scanNumbersSymbolsError,
    apply(text, file) {
      return applyNumbersSymbolsError(text);
    },
  },
];
