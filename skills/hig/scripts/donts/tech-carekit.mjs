import { hit } from "./shared.mjs";

function hasCarePlan(text) {
  return /\bdata-carekit\b/.test(text);
}

function hasCkAdCopy(text) {
  return (
    /don['’]?t want to see advertising/i.test(text) ||
    /advertising in a care plan/i.test(text) ||
    /distract(?:ing)? people from their care plan/i.test(text)
  );
}

function hasCkAdSignal(text) {
  if (!hasCarePlan(text)) return false;
  return (
    /\b(?:Advertisement|Sponsored)\b/.test(text) ||
    /adsbygoogle/i.test(text)
  );
}

function scanCkAd(files) {
  const out = [];
  for (const f of files) {
    if (/data-ck-ad/.test(f.text)) {
      out.push(hit(f.path, "advertising in a care plan"));
      continue;
    }
    if (!hasCarePlan(f.text)) continue;
    if (hasCkAdCopy(f.text) || hasCkAdSignal(f.text)) {
      out.push(hit(f.path, "advertising in a care plan"));
    }
  }
  return out;
}

function applyCkAd(text) {
  return text.replace(/\s*data-ck-ad(?:="[^"]*")?/g, "");
}

function hasCkLogoCopy(text) {
  return (
    /purely decorative symbol/i.test(text) ||
    /corporate logo as a custom symbol/i.test(text) ||
    /decorative symbol or using a corporate logo/i.test(text)
  );
}

function careSymbolIsLogoOrDecorative(text) {
  if (!hasCarePlan(text)) return false;
  const tags = text.match(/<(?:img|svg)\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const isSymbol = /\b(?:logo|care-symbol|data-care-symbol)\b/i.test(tag);
    const health = /\b(?:heart|health|wellness|pulse)\b/i.test(tag);
    if (!isSymbol || health) continue;
    const decorative = /\baria-hidden=["']true["']/i.test(tag);
    const logo = /\blogo\b/i.test(tag);
    if (logo || decorative) return true;
  }
  return false;
}

function scanCkLogo(files) {
  const out = [];
  for (const f of files) {
    if (/data-ck-logo(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a corporate logo or purely decorative symbol used as the care symbol"));
      continue;
    }
    if (!hasCarePlan(f.text)) continue;
    if (hasCkLogoCopy(f.text) || careSymbolIsLogoOrDecorative(f.text)) {
      out.push(hit(f.path, "a corporate logo or purely decorative symbol used as the care symbol"));
    }
  }
  return out;
}

function applyCkLogo(text) {
  return text.replace(/\s*data-ck-logo(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "ck-ad",
    rewrite: "marker",
    scan: scanCkAd,
    apply(text, file) {
      return applyCkAd(text);
    },
  },
  {
    id: "ck-logo",
    rewrite: "marker",
    scan: scanCkLogo,
    apply(text, file) {
      return applyCkLogo(text);
    },
  },
];
