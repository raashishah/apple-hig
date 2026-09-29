import { hit } from "./shared.mjs";

function hasSiri(text) {
  return (
    /\bdata-siri\b/.test(text) ||
    /\bINInteraction\b/.test(text) ||
    /\bSiriKit\b/.test(text)
  );
}

function hasSiAdvertiseCopy(text) {
  return (
    /advertisements? or iap/i.test(text) ||
    ((/advertisement/i.test(text) || /marketing/i.test(text)) && /siri/i.test(text)) ||
    (/in-app purchase/i.test(text) && /pitch/i.test(text) && /siri/i.test(text))
  );
}

function hasSiImpersonateCopy(text) {
  return (
    /impersonated siri/i.test(text) ||
    /hey siri/i.test(text) ||
    /call 911/i.test(text) ||
    (/appears to come from apple/i.test(text) && /siri/i.test(text))
  );
}

function hasSiPronounCopy(text) {
  return /\bSiri\b/.test(text) && /\b(she|he|him|her)\b/i.test(text);
}

function scanSiAdvertise(files) {
  const out = [];
  for (const f of files) {
    if (/data-si-advertise/.test(f.text)) {
      out.push(hit(f.path, "advertisements or iap pitches in siri-delivered content"));
      continue;
    }
    if (!hasSiri(f.text)) continue;
    if (hasSiAdvertiseCopy(f.text)) {
      out.push(hit(f.path, "advertisements or iap pitches in siri-delivered content"));
    }
  }
  return out;
}

function applySiAdvertise(text) {
  return text.replace(/\s*data-si-advertise(?:="[^"]*")?/g, "");
}

function scanSiImpersonate(files) {
  const out = [];
  for (const f of files) {
    if (/data-si-impersonate/.test(f.text)) {
      out.push(hit(f.path, "impersonated siri or reserved phrases"));
      continue;
    }
    if (!hasSiri(f.text)) continue;
    if (hasSiImpersonateCopy(f.text)) {
      out.push(hit(f.path, "impersonated siri or reserved phrases"));
    }
  }
  return out;
}

function applySiImpersonate(text) {
  return text.replace(/\s*data-si-impersonate(?:="[^"]*")?/g, "");
}

function scanSiPronoun(files) {
  const out = [];
  for (const f of files) {
    if (/data-si-pronoun/.test(f.text)) {
      out.push(hit(f.path, "siri referred to with she, he, or her"));
      continue;
    }
    if (!hasSiri(f.text)) continue;
    if (hasSiPronounCopy(f.text)) {
      out.push(hit(f.path, "siri referred to with she, he, or her"));
    }
  }
  return out;
}

function applySiPronoun(text) {
  return text.replace(/\s*data-si-pronoun(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "si-advertise",
    rewrite: "marker",
    scan: scanSiAdvertise,
    apply(text, file) {
      return applySiAdvertise(text);
    },
  },
  {
    id: "si-impersonate",
    rewrite: "marker",
    scan: scanSiImpersonate,
    apply(text, file) {
      return applySiImpersonate(text);
    },
  },
  {
    id: "si-pronoun",
    rewrite: "marker",
    scan: scanSiPronoun,
    apply(text, file) {
      return applySiPronoun(text);
    },
  },
];
