import { hit } from "./shared.mjs";

function hasIdVerifier(text) {
  return (
    /\bdata-id-verifier\b/.test(text) ||
    /\bMobileDriversLicenseDisplayRequest\b/.test(text) ||
    /\bMobileDriversLicenseDataRequest\b/.test(text) ||
    /\bMobileDriversLicenseRawDataRequest\b/.test(text)
  );
}

function hasIdvAppleLogoCopy(text) {
  return /apple logo/i.test(text);
}

function hasIdvCommSymbolCopy(text) {
  return /\bNFC\b|\bQR codes?\b/i.test(text);
}

function scanIdvAppleLogo(files) {
  const out = [];
  for (const f of files) {
    if (/data-idv-apple-logo/.test(f.text)) {
      out.push(hit(f.path, "apple logo in an id verifier button"));
      continue;
    }
    if (!hasIdVerifier(f.text)) continue;
    if (hasIdvAppleLogoCopy(f.text)) {
      out.push(hit(f.path, "apple logo in an id verifier button"));
    }
  }
  return out;
}

function applyIdvAppleLogo(text) {
  return text.replace(/\s*data-idv-apple-logo(?:="[^"]*")?/g, "");
}

function scanIdvCommSymbol(files) {
  const out = [];
  for (const f of files) {
    if (/data-idv-comm-symbol/.test(f.text)) {
      out.push(
        hit(
          f.path,
          "nfc or qr communication symbol on a verify age or verify identity button",
        ),
      );
      continue;
    }
    if (!hasIdVerifier(f.text)) continue;
    if (hasIdvCommSymbolCopy(f.text)) {
      out.push(
        hit(
          f.path,
          "nfc or qr communication symbol on a verify age or verify identity button",
        ),
      );
    }
  }
  return out;
}

function applyIdvCommSymbol(text) {
  return text.replace(/\s*data-idv-comm-symbol(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "idv-apple-logo",
    rewrite: "marker",
    scan: scanIdvAppleLogo,
    apply(text, file) {
      return applyIdvAppleLogo(text);
    },
  },
  {
    id: "idv-comm-symbol",
    rewrite: "marker",
    scan: scanIdvCommSymbol,
    apply(text, file) {
      return applyIdvCommSymbol(text);
    },
  },
];
