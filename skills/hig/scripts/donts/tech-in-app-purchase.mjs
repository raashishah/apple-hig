import { hit } from "./shared.mjs";

function hasIap(text) {
  return (
    /\bdata-in-app-purchase\b/.test(text) ||
    /\bStoreKit\b/.test(text) ||
    /\bSKPaymentQueue\b/.test(text) ||
    /\bProduct\.purchase\b/.test(text)
  );
}

function hasIapConfirmCopy(text) {
  return /confirmation sheet/i.test(text);
}

function hasIapRefundBuriedCopy(text) {
  return (
    /scroll.{0,40}refund/i.test(text) ||
    /refund.{0,40}(another screen|extra screen|next screen)/i.test(text)
  );
}

function hasIapRefundPolicyCopy(text) {
  return /refund polic/i.test(text) || /you'll receive the refund/i.test(text);
}

function scanIapConfirmSheet(files) {
  const out = [];
  for (const f of files) {
    if (/data-iap-confirm-sheet/.test(f.text)) {
      out.push(hit(f.path, "modified or replicated system confirmation sheet"));
      continue;
    }
    if (!hasIap(f.text)) continue;
    if (hasIapConfirmCopy(f.text)) {
      out.push(hit(f.path, "modified or replicated system confirmation sheet"));
    }
  }
  return out;
}

function applyIapConfirmSheet(text) {
  return text.replace(/\s*data-iap-confirm-sheet(?:="[^"]*")?/g, "");
}

function scanIapRefundBuried(files) {
  const out = [];
  for (const f of files) {
    if (/data-iap-refund-buried/.test(f.text)) {
      out.push(
        hit(f.path, "refund-request button hidden behind a scroll or extra screen"),
      );
      continue;
    }
    if (!hasIap(f.text)) continue;
    if (hasIapRefundBuriedCopy(f.text)) {
      out.push(
        hit(f.path, "refund-request button hidden behind a scroll or extra screen"),
      );
    }
  }
  return out;
}

function applyIapRefundBuried(text) {
  return text.replace(/\s*data-iap-refund-buried(?:="[^"]*")?/g, "");
}

function scanIapRefundPolicy(files) {
  const out = [];
  for (const f of files) {
    if (/data-iap-refund-policy/.test(f.text)) {
      out.push(
        hit(f.path, "apple refund policies characterized in user-facing copy"),
      );
      continue;
    }
    if (!hasIap(f.text)) continue;
    if (hasIapRefundPolicyCopy(f.text)) {
      out.push(
        hit(f.path, "apple refund policies characterized in user-facing copy"),
      );
    }
  }
  return out;
}

function applyIapRefundPolicy(text) {
  return text.replace(/\s*data-iap-refund-policy(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "iap-confirm-sheet",
    rewrite: "marker",
    scan: scanIapConfirmSheet,
    apply(text, file) {
      return applyIapConfirmSheet(text);
    },
  },
  {
    id: "iap-refund-buried",
    rewrite: "marker",
    scan: scanIapRefundBuried,
    apply(text, file) {
      return applyIapRefundBuried(text);
    },
  },
  {
    id: "iap-refund-policy",
    rewrite: "marker",
    scan: scanIapRefundPolicy,
    apply(text, file) {
      return applyIapRefundPolicy(text);
    },
  },
];
