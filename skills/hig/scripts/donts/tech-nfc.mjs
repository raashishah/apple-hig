import { hit } from "./shared.mjs";

function hasNfc(text) {
  return (
    /\bdata-nfc\b/.test(text) ||
    /\bNFCNDEFReaderSession\b/.test(text) ||
    /\bNFCTagReaderSession\b/.test(text) ||
    /\bNFCReaderSession\b/.test(text) ||
    /\bCoreNFC\b/.test(text)
  );
}

function hasNfcContactCopy(text) {
  return (
    /\btap or touch\b/i.test(text) ||
    /\btap(?:ping)? (?:your|the) (?:phone|iphone|device)\b/i.test(text) ||
    /\btouch(?:ing)? (?:your|the) (?:phone|iphone|device|tag)\b/i.test(text) ||
    /\b(?:tap|touch) to scan\b/i.test(text)
  );
}

function hasNfcJargonCopy(text) {
  return (
    /\bNFC tag\b/.test(text) ||
    /\bCore NFC\b/.test(text) ||
    /\bNear[- ]field communication\b/i.test(text)
  );
}

function scanNfcContact(files) {
  const out = [];
  for (const f of files) {
    if (/data-nfc-contact/.test(f.text)) {
      out.push(hit(f.path, "tap or touch used to ask people to scan"));
      continue;
    }
    if (!hasNfc(f.text)) continue;
    if (hasNfcContactCopy(f.text)) {
      out.push(hit(f.path, "tap or touch used to ask people to scan"));
    }
  }
  return out;
}

function applyNfcContact(text) {
  return text.replace(/\s*data-nfc-contact(?:="[^"]*")?/g, "");
}

function scanNfcJargon(files) {
  const out = [];
  for (const f of files) {
    if (/data-nfc-jargon/.test(f.text)) {
      out.push(
        hit(f.path, "nfc, core nfc, near-field communication, or nfc tag in user-facing copy"),
      );
      continue;
    }
    if (!hasNfc(f.text)) continue;
    if (hasNfcJargonCopy(f.text)) {
      out.push(
        hit(f.path, "nfc, core nfc, near-field communication, or nfc tag in user-facing copy"),
      );
    }
  }
  return out;
}

function applyNfcJargon(text) {
  return text.replace(/\s*data-nfc-jargon(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "nfc-contact",
    rewrite: "marker",
    scan: scanNfcContact,
    apply(text, file) {
      return applyNfcContact(text);
    },
  },
  {
    id: "nfc-jargon",
    rewrite: "marker",
    scan: scanNfcJargon,
    apply(text, file) {
      return applyNfcJargon(text);
    },
  },
];
