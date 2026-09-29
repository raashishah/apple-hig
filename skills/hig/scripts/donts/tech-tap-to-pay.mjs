import { hit } from "./shared.mjs";

function hasTapToPay(text) {
  return (
    /\bdata-tap-to-pay\b/.test(text) ||
    /\bProximityReader\b/.test(text) ||
    /\bPaymentCardReader\b/.test(text) ||
    /\bPaymentCardReaderSession\b/.test(text)
  );
}

function hasTtpAppleLogoCopy(text) {
  return /apple logo/i.test(text);
}

function hasTtpNonpaymentCopy(text) {
  const paymentLabel = /Tap to Pay(?: on iPhone)?/i.test(text);
  const nonpayment = /\bLook Up\b|\bStore Card\b|\bVerify\b|\bRefund\b|\bloyalty\b/i.test(
    text,
  );
  return paymentLabel && nonpayment;
}

function scanTtpAppleLogo(files) {
  const out = [];
  for (const f of files) {
    if (/data-ttp-apple-logo/.test(f.text)) {
      out.push(hit(f.path, "apple logo in a tap to pay button"));
      continue;
    }
    if (!hasTapToPay(f.text)) continue;
    if (hasTtpAppleLogoCopy(f.text)) {
      out.push(hit(f.path, "apple logo in a tap to pay button"));
    }
  }
  return out;
}

function applyTtpAppleLogo(text) {
  return text.replace(/\s*data-ttp-apple-logo(?:="[^"]*")?/g, "");
}

function scanTtpNonpaymentLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-ttp-nonpayment/.test(f.text)) {
      out.push(
        hit(
          f.path,
          "tap to pay or tap to pay on iphone on a look up, store card, verify, refund, or loyalty button",
        ),
      );
      continue;
    }
    if (!hasTapToPay(f.text)) continue;
    if (hasTtpNonpaymentCopy(f.text)) {
      out.push(
        hit(
          f.path,
          "tap to pay or tap to pay on iphone on a look up, store card, verify, refund, or loyalty button",
        ),
      );
    }
  }
  return out;
}

function applyTtpNonpaymentLabel(text) {
  return text.replace(/\s*data-ttp-nonpayment(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "ttp-apple-logo",
    rewrite: "marker",
    scan: scanTtpAppleLogo,
    apply(text, file) {
      return applyTtpAppleLogo(text);
    },
  },
  {
    id: "ttp-nonpayment-label",
    rewrite: "marker",
    scan: scanTtpNonpaymentLabel,
    apply(text, file) {
      return applyTtpNonpaymentLabel(text);
    },
  },
];
