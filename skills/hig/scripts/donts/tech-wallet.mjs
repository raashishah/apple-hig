import { hit, hasDuplicateNotificationTitle } from "./shared.mjs";

function hasPass(text) {
  return /\bdata-wallet\b/.test(text);
}

function hasWlMarketingCopy(text) {
  return (
    /change messages? for marketing/i.test(text) ||
    /change messages? used for marketing/i.test(text) ||
    /never use a change message for marketing/i.test(text) ||
    /marketing or other noncritical communication/i.test(text)
  );
}

function hasWlMarketingSignal(text) {
  if (!hasPass(text)) return false;
  return (
    /\bchangeMessage\b[\s\S]{0,80}\b(?:sale|offer|discount|promo|marketing)\b/i.test(text) ||
    /\b(?:sale|offer|discount|promo|marketing)\b[\s\S]{0,80}\bchangeMessage\b/i.test(text)
  );
}

function scanWlMarketing(files) {
  const out = [];
  for (const f of files) {
    if (/data-wl-marketing/.test(f.text)) {
      out.push(hit(f.path, "a change message used for marketing"));
      continue;
    }
    if (!hasPass(f.text)) continue;
    if (hasWlMarketingCopy(f.text) || hasWlMarketingSignal(f.text)) {
      out.push(hit(f.path, "a change message used for marketing"));
    }
  }
  return out;
}

function applyWlMarketing(text) {
  return text.replace(/\s*data-wl-marketing(?:="[^"]*")?/g, "");
}

function hasWlDeclineCopy(text) {
  return (
    /if people decline your suggestion, don['’]?t ask them again/i.test(text) ||
    /decline your suggestion, don['’]?t ask them again/i.test(text) ||
    /asking again after people decline a Wallet suggestion/i.test(text)
  );
}

function hasWlDeclineSignal(text) {
  if (!hasPass(text)) return false;
  return (
    /declined[\s\S]{0,200}(?:ask again|suggest again|add again|suggestAdding)/i.test(text) ||
    /if\s*\(\s*declined\s*\)[\s\S]{0,180}suggest/i.test(text)
  );
}

function scanWlDecline(files) {
  const out = [];
  for (const f of files) {
    if (/data-wl-decline/.test(f.text)) {
      out.push(hit(f.path, "asking again after people decline a Wallet suggestion"));
      continue;
    }
    if (!hasPass(f.text)) continue;
    if (hasWlDeclineCopy(f.text) || hasWlDeclineSignal(f.text)) {
      out.push(hit(f.path, "asking again after people decline a Wallet suggestion"));
    }
  }
  return out;
}

function applyWlDecline(text) {
  return text.replace(/\s*data-wl-decline(?:="[^"]*")?/g, "");
}

function hasWlLogoShadowCopy(text) {
  return (
    /inner drop shadows? on logo artwork/i.test(text) ||
    /avoid inner drop shadows? on (?:the )?logo/i.test(text)
  );
}

function logoTagHasInsetShadow(text) {
  const tags = text.match(/<(?:img|div|span)\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const logo = /\blogo\b/i.test(tag);
    const inset =
      /box-shadow\s*:[^;>]*\binset\b/i.test(tag) ||
      /boxShadow\s*:\s*["'][^"']*\binset\b/i.test(tag);
    if (logo && inset) return true;
  }
  return false;
}

function hasWlLogoShadowSignal(text) {
  if (!hasPass(text)) return false;
  return logoTagHasInsetShadow(text);
}

function scanWlLogoShadow(files) {
  const out = [];
  for (const f of files) {
    if (/data-wl-shadow/.test(f.text)) {
      out.push(hit(f.path, "inner drop shadows on logo artwork"));
      continue;
    }
    if (!hasPass(f.text)) continue;
    if (hasWlLogoShadowCopy(f.text) || hasWlLogoShadowSignal(f.text)) {
      out.push(hit(f.path, "inner drop shadows on logo artwork"));
    }
  }
  return out;
}

function applyWlLogoShadow(text) {
  return text.replace(/\s*data-wl-shadow(?:="[^"]*")?/g, "");
}

function hasWlStripCopy(text) {
  return (
    /embedding text in the strip image/i.test(text) ||
    /text embedded in the strip image/i.test(text) ||
    /avoid embedding text in the strip/i.test(text)
  );
}

function stripSvgContainsText(text) {
  const re = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/gi;
  let match;
  while ((match = re.exec(text))) {
    const isStrip = /\bstrip\b/i.test(match[1]);
    const hasText = /<(?:text|tspan)\b/i.test(match[2]);
    if (isStrip && hasText) return true;
  }
  return false;
}

function scanWlStrip(files) {
  const out = [];
  for (const f of files) {
    if (/data-wl-strip(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "text embedded in the strip image"));
      continue;
    }
    if (!hasPass(f.text)) continue;
    if (hasWlStripCopy(f.text) || stripSvgContainsText(f.text)) {
      out.push(hit(f.path, "text embedded in the strip image"));
    }
  }
  return out;
}

function applyWlStrip(text) {
  return text.replace(/\s*data-wl-strip(?:="[^"]*")?(?![\w-])/g, "");
}

function hasWalletDuplicateCopy(text) {
  return /avoid sending duplicate notifications/i.test(text);
}

function scanWalletDuplicate(files) {
  const out = [];
  for (const f of files) {
    if (/data-wl-dup(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "duplicate notifications on a Wallet pass"));
      continue;
    }
    if (!hasPass(f.text)) continue;
    if (hasDuplicateNotificationTitle(f.text) || hasWalletDuplicateCopy(f.text)) {
      out.push(hit(f.path, "duplicate notifications on a Wallet pass"));
    }
  }
  return out;
}

function applyWalletDuplicate(text) {
  return text.replace(/\s*data-wl-dup(?:="[^"]*")?(?![\w-])/g, "");
}

function hasWlPadCopy(text) {
  return /adding padding to images/i.test(text);
}

function hasPassImagePadding(text) {
  if (!hasPass(text)) return false;
  return /\bimagePadding\s*[:=(]/.test(text);
}

function scanWlPad(files) {
  const out = [];
  for (const f of files) {
    if (/data-wl-pad(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a Wallet pass image with added padding"));
      continue;
    }
    if (!hasPass(f.text)) continue;
    if (hasWlPadCopy(f.text) || hasPassImagePadding(f.text)) {
      out.push(hit(f.path, "a Wallet pass image with added padding"));
    }
  }
  return out;
}

function applyWlPad(text) {
  return text.replace(/\s*data-wl-pad(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "wl-marketing",
    rewrite: "marker",
    scan: scanWlMarketing,
    apply(text, file) {
      return applyWlMarketing(text);
    },
  },
  {
    id: "wl-decline",
    rewrite: "marker",
    scan: scanWlDecline,
    apply(text, file) {
      return applyWlDecline(text);
    },
  },
  {
    id: "wl-shadow",
    rewrite: "marker",
    scan: scanWlLogoShadow,
    apply(text, file) {
      return applyWlLogoShadow(text);
    },
  },
  {
    id: "wl-strip",
    rewrite: "marker",
    scan: scanWlStrip,
    apply(text, file) {
      return applyWlStrip(text);
    },
  },
  {
    id: "wl-dup",
    rewrite: "marker",
    scan: scanWalletDuplicate,
    apply(text, file) {
      return applyWalletDuplicate(text);
    },
  },
  {
    id: "wl-pad",
    rewrite: "marker",
    scan: scanWlPad,
    apply(text, file) {
      return applyWlPad(text);
    },
  },
];
