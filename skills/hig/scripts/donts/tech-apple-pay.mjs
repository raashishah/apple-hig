import { hit } from "./shared.mjs";

function hasApplePay(text) {
  return (
    /\bdata-apple-pay\b/.test(text) ||
    /\bPKPaymentButton\b/.test(text) ||
    /\bPayWithApplePayButton\b/.test(text)
  );
}

function hasApMarkButtonCopy(text) {
  return (
    /apple pay mark used as a payment button/i.test(text) ||
    (/apple pay mark/i.test(text) && /payment button|as a button/i.test(text))
  );
}

function hasApPluralCopy(text) {
  return /Apple Pays\b/.test(text) || /Apple Pay['’]s\b/.test(text);
}

function hasApLogoWordCopy(text) {
  return (
    /apple logo used in place/i.test(text) ||
    /\s*Pay/.test(text) ||
    (/apple logo/i.test(text) && /word Apple/i.test(text))
  );
}

function scanApMarkButton(files) {
  const out = [];
  for (const f of files) {
    if (/data-ap-mark-button/.test(f.text)) {
      out.push(hit(f.path, "the apple pay mark used as a payment button"));
      continue;
    }
    if (!hasApplePay(f.text)) continue;
    if (hasApMarkButtonCopy(f.text)) {
      out.push(hit(f.path, "the apple pay mark used as a payment button"));
    }
  }
  return out;
}

function applyApMarkButton(text) {
  return text.replace(/\s*data-ap-mark-button(?:="[^"]*")?/g, "");
}

function scanApPlural(files) {
  const out = [];
  for (const f of files) {
    if (/data-ap-plural/.test(f.text)) {
      out.push(hit(f.path, "apple pay made plural or possessive"));
      continue;
    }
    if (!hasApplePay(f.text)) continue;
    if (hasApPluralCopy(f.text)) {
      out.push(hit(f.path, "apple pay made plural or possessive"));
    }
  }
  return out;
}

function applyApPlural(text) {
  return text.replace(/\s*data-ap-plural(?:="[^"]*")?/g, "");
}

function scanApLogoWord(files) {
  const out = [];
  for (const f of files) {
    if (/data-ap-logo-word/.test(f.text)) {
      out.push(hit(f.path, "the apple logo used in place of the word apple"));
      continue;
    }
    if (!hasApplePay(f.text)) continue;
    if (hasApLogoWordCopy(f.text)) {
      out.push(hit(f.path, "the apple logo used in place of the word apple"));
    }
  }
  return out;
}

function applyApLogoWord(text) {
  return text.replace(/\s*data-ap-logo-word(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "ap-mark-button",
    rewrite: "marker",
    scan: scanApMarkButton,
    apply(text, file) {
      return applyApMarkButton(text);
    },
  },
  {
    id: "ap-plural",
    rewrite: "marker",
    scan: scanApPlural,
    apply(text, file) {
      return applyApPlural(text);
    },
  },
  {
    id: "ap-logo-word",
    rewrite: "marker",
    scan: scanApLogoWord,
    apply(text, file) {
      return applyApLogoWord(text);
    },
  },
];
