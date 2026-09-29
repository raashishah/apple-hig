import { hit, hasNotificationChrome } from "./shared.mjs";

function hasAppClipCode(text) {
  return /\bdata-app-clip-code\b/.test(text);
}

function hasAcModifiedCopy(text) {
  return (
    /create your own App Clip Code/i.test(text) ||
    /modify a generated App Clip Code/i.test(text) ||
    /homemade App Clip Code/i.test(text) ||
    /add glows, shadows, gradients, or reflections/i.test(text)
  );
}

function hasAcModifiedSignal(text) {
  if (!hasAppClipCode(text)) return false;
  return /filter\s*:|drop-shadow|box-shadow|linear-gradient|radial-gradient|\bglow\b/i.test(text);
}

function scanAcModified(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-modified/.test(f.text)) {
      out.push(hit(f.path, "a homemade or modified App Clip Code"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcModifiedCopy(f.text) || hasAcModifiedSignal(f.text)) {
      out.push(hit(f.path, "a homemade or modified App Clip Code"));
    }
  }
  return out;
}

function applyAcModified(text) {
  return text.replace(/\s*data-ac-modified(?:="[^"]*")?/g, "");
}

function hasAcOverlayCopy(text) {
  return (
    /overlay the App Clip Code with text, logos, or images/i.test(text) ||
    /text, logos, or images over an App Clip Code/i.test(text)
  );
}

function hasAcOverlaySignal(text) {
  if (!hasAppClipCode(text)) return false;
  return /data-app-clip-code[\s\S]{0,500}<img\b/i.test(text) ||
    /data-app-clip-code[^>]*background-image\s*:/i.test(text);
}

function scanAcOverlay(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-overlay/.test(f.text)) {
      out.push(hit(f.path, "text, logos, or images over an App Clip Code"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcOverlayCopy(f.text) || hasAcOverlaySignal(f.text)) {
      out.push(hit(f.path, "text, logos, or images over an App Clip Code"));
    }
  }
  return out;
}

function hasAcMotionCopy(text) {
  return (
    /never animate the App Clip Code/i.test(text) ||
    /animate the App Clip Code or dim/i.test(text) ||
    /animated or dimmed App Clip Code/i.test(text)
  );
}

function hasAcMotionSignal(text) {
  if (!hasAppClipCode(text)) return false;
  return /data-app-clip-code[\s\S]{0,240}animation\s*:/i.test(text);
}

function scanAcMotion(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-motion/.test(f.text)) {
      out.push(hit(f.path, "an animated or dimmed App Clip Code"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcMotionCopy(f.text) || hasAcMotionSignal(f.text)) {
      out.push(hit(f.path, "an animated or dimmed App Clip Code"));
    }
  }
  return out;
}

function hasAcRotateCopy(text) {
  return (
    /don['’]?t rotate the generated App Clip Code/i.test(text) ||
    /rotate the generated App Clip Code/i.test(text) ||
    /rotated App Clip Code/i.test(text)
  );
}

function hasAcRotateSignal(text) {
  if (!hasAppClipCode(text)) return false;
  return /data-app-clip-code[\s\S]{0,240}rotate\s*\(/i.test(text);
}

function scanAcRotate(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-rotate/.test(f.text)) {
      out.push(hit(f.path, "a rotated App Clip Code"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcRotateCopy(f.text) || hasAcRotateSignal(f.text)) {
      out.push(hit(f.path, "a rotated App Clip Code"));
    }
  }
  return out;
}

function applyAcOverlay(text) {
  return text.replace(/\s*data-ac-overlay(?:="[^"]*")?/g, "");
}

function applyAcMotion(text) {
  return text.replace(/\s*data-ac-motion(?:="[^"]*")?/g, "");
}

function applyAcRotate(text) {
  return text.replace(/\s*data-ac-rotate(?:="[^"]*")?/g, "");
}

function hasAcAspectCopy(text) {
  return (
    /don['’]?t change the generated code['’]?s aspect ratio/i.test(text) ||
    /change the generated (?:code|App Clip Code)['’]?s aspect ratio/i.test(text) ||
    /generated App Clip Code with a changed aspect ratio/i.test(text)
  );
}

function hasAcAspectSignal(text) {
  if (!hasAppClipCode(text)) return false;
  const window = text.match(/data-app-clip-code[\s\S]{0,240}/i);
  if (!window) return false;
  const slice = window[0];
  if (/object-fit\s*:\s*fill\b/i.test(slice) || /objectFit\s*:\s*["']fill["']/i.test(slice)) {
    return true;
  }
  const pair = slice.match(/scale\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/);
  if (pair && pair[1] !== pair[2]) return true;
  const x = slice.match(/scaleX\(\s*([0-9.]+)\s*\)/);
  const y = slice.match(/scaleY\(\s*([0-9.]+)\s*\)/);
  return Boolean(x && y && x[1] !== y[1]);
}

function scanAcAspect(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-aspect/.test(f.text)) {
      out.push(hit(f.path, "a generated App Clip Code with a changed aspect ratio"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcAspectCopy(f.text) || hasAcAspectSignal(f.text)) {
      out.push(hit(f.path, "a generated App Clip Code with a changed aspect ratio"));
    }
  }
  return out;
}

function applyAcAspect(text) {
  return text.replace(/\s*data-ac-aspect(?:="[^"]*")?/g, "");
}

function hasAcSymbolCopy(text) {
  return (
    /don['’]?t add a symbol to App Clip Codes/i.test(text) ||
    /add a symbol to (?:an |the )?App Clip Code/i.test(text) ||
    /symbol added to an App Clip Code/i.test(text)
  );
}

function hasAcSymbolSignal(text) {
  if (!hasAppClipCode(text)) return false;
  const window = text.match(/data-app-clip-code[\s\S]{0,240}/i);
  if (!window) return false;
  return /[™®©℠]|&trade;|&reg;|&copy;|&#8482;|&#174;|&#169;/i.test(window[0]);
}

function scanAcSymbol(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-symbol/.test(f.text)) {
      out.push(hit(f.path, "a symbol added to an App Clip Code"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcSymbolCopy(f.text) || hasAcSymbolSignal(f.text)) {
      out.push(hit(f.path, "a symbol added to an App Clip Code"));
    }
  }
  return out;
}

function applyAcSymbol(text) {
  return text.replace(/\s*data-ac-symbol(?:="[^"]*")?/g, "");
}

function hasAcSoloCopy(text) {
  return (
    /App Clip logo on its own/i.test(text) ||
    /use the App Clip logo on its own/i.test(text)
  );
}

function appClipLogoOnItsOwn(text) {
  if (!hasAppClipCode(text)) return false;
  const logo = /\bapp-clip-logo\b/i.test(text) || /aria-label=["']App Clip logo["']/i.test(text);
  if (!logo) return false;
  const generated =
    /\bclass(?:Name)?=["'][^"']*\bapp-clip-code\b/i.test(text) ||
    /aria-label=["']App Clip Code["']/i.test(text) ||
    /\bdata-generated-code\b/.test(text);
  return !generated;
}

function scanAcSolo(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-solo(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "the App Clip logo used on its own"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcSoloCopy(f.text) || appClipLogoOnItsOwn(f.text)) {
      out.push(hit(f.path, "the App Clip logo used on its own"));
    }
  }
  return out;
}

function applyAcSolo(text) {
  return text.replace(/\s*data-ac-solo(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAcFetchCopy(text) {
  return (
    /downloading additional data/i.test(text) ||
    /download of additional data/i.test(text) ||
    /avoid downloading additional data/i.test(text)
  );
}

function appClipDownloadsExtra(text) {
  if (!hasAppClipCode(text)) return false;
  return /\b(?:fetch|downloadFile|URLSession)\b[\s\S]{0,200}?\.(?:zip|bin|pkg|bundle)/i.test(text);
}

function scanAcFetch(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-fetch(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a download of additional data with an App Clip Code"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcFetchCopy(f.text) || appClipDownloadsExtra(f.text)) {
      out.push(hit(f.path, "a download of additional data with an App Clip Code"));
    }
  }
  return out;
}

function applyAcFetch(text) {
  return text.replace(/\s*data-ac-fetch(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAcSplashCopy(text) {
  return (
    /omit splash screens/i.test(text) ||
    /never make people wait on launch/i.test(text) ||
    /splash screen that makes people wait on launch/i.test(text)
  );
}

function appClipShowsSplash(text) {
  if (!hasAppClipCode(text)) return false;
  return /\bclass(?:Name)?=["'][^"']*\bsplash\b/i.test(text);
}

function scanAcSplash(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-splash(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a splash screen that makes people wait on launch"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcSplashCopy(f.text) || appClipShowsSplash(f.text)) {
      out.push(hit(f.path, "a splash screen that makes people wait on launch"));
    }
  }
  return out;
}

function applyAcSplash(text) {
  return text.replace(/\s*data-ac-splash(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAcSmallCopy(text) {
  return (
    /App Clip Codes that are too small/i.test(text) ||
    /App Clip Code that is too small/i.test(text)
  );
}

function tagHasTinyAppClipSize(tag) {
  const re = /(?<![\w-])(?:width|height)\s*[:=]\s*["']?(\d+(?:\.\d+)?)(?:px)?(?![\d.%])/gi;
  let m;
  while ((m = re.exec(tag))) {
    if (Number(m[1]) < 32) return true;
  }
  return false;
}

function appClipCodeIsTiny(text) {
  if (!hasAppClipCode(text)) return false;
  const re = /<[^>]*\bdata-app-clip-code\b[^>]*>/gi;
  let m;
  while ((m = re.exec(text))) {
    if (tagHasTinyAppClipSize(m[0])) return true;
  }
  return false;
}

function scanAcSmall(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-small(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an App Clip Code that is too small"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcSmallCopy(f.text) || appClipCodeIsTiny(f.text)) {
      out.push(hit(f.path, "an App Clip Code that is too small"));
    }
  }
  return out;
}

function applyAcSmall(text) {
  return text.replace(/\s*data-ac-small(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAcGapCopy(text) {
  return (
    /enough space between an App Clip Code/i.test(text) ||
    /minimum clear space around an App Clip Code/i.test(text) ||
    /App Clip Code without clear space/i.test(text)
  );
}

function hasPositiveClearSpace(tag) {
  const re = /(?<![\w-])(?:margin|gap)\s*[:=]\s*["']?(\d+(?:\.\d+)?)(?:px)?(?![\d.%])/gi;
  let m;
  while ((m = re.exec(tag))) {
    if (Number(m[1]) >= 1) return true;
  }
  return false;
}

function hasZeroMargin(tag) {
  return /(?<![\w-])margin\s*[:=]\s*["']?0(?:px)?(?![\d.])/i.test(tag);
}

function appClipCodesAreFlush(text) {
  if (!hasAppClipCode(text)) return false;
  const tags = [...text.matchAll(/<[^>]*\bdata-app-clip-code\b[^>]*>/gi)].map((m) => m[0]);
  if (tags.length >= 2 && tags.every((tag) => !hasPositiveClearSpace(tag))) return true;
  return (
    tags.length === 1 &&
    hasZeroMargin(tags[0]) &&
    /className=["'][^"']*\bgraphic\b/i.test(text) &&
    !/<img\b/i.test(text)
  );
}

function scanAcGap(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-gap(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an App Clip Code without clear space"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcGapCopy(f.text) || appClipCodesAreFlush(f.text)) {
      out.push(hit(f.path, "an App Clip Code without clear space"));
    }
  }
  return out;
}

function applyAcGap(text) {
  return text.replace(/\s*data-ac-gap(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAcShotCopy(text) {
  return (
    /screenshot of your app/i.test(text) ||
    /screenshot of the app interface/i.test(text)
  );
}

function appClipShowsScreenshot(text) {
  if (!hasAppClipCode(text)) return false;
  if (/<img\b/i.test(text)) return false;
  return /className=["'][^"']*\bscreenshot\b/i.test(text);
}

function scanAcShot(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-shot(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a screenshot of the app interface on an App Clip Code"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcShotCopy(f.text) || appClipShowsScreenshot(f.text)) {
      out.push(hit(f.path, "a screenshot of the app interface on an App Clip Code"));
    }
  }
  return out;
}

function applyAcShot(text) {
  return text.replace(/\s*data-ac-shot(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAcAdsCopy(text) {
  return /don['’]?t display ads in your app clip/i.test(text);
}

function hasAppClipAdvertisement(text) {
  if (!hasAppClipCode(text)) return false;
  return /role=["']advertisement["']/i.test(text) || /\badsbygoogle\b/i.test(text);
}

function scanAcAds(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-ads(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an advertisement in an App Clip"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcAdsCopy(f.text) || hasAppClipAdvertisement(f.text)) {
      out.push(hit(f.path, "an advertisement in an App Clip"));
    }
  }
  return out;
}

function applyAcAds(text) {
  return text.replace(/\s*data-ac-ads(?:="[^"]*")?(?![\w-])/g, "");
}

function hasPromotionalNotification(text) {
  if (!hasAppClipCode(text) || !hasNotificationChrome(text)) return false;
  return /\bpromotional\s*[:=]\s*true\b/.test(text);
}

function hasAcPromoCopy(text) {
  return /purely promotional notifications/i.test(text);
}

function scanAcPromo(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-promo(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a purely promotional notification from an App Clip"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasPromotionalNotification(f.text) || (hasAcPromoCopy(f.text) && hasNotificationChrome(f.text))) {
      out.push(hit(f.path, "a purely promotional notification from an App Clip"));
    }
  }
  return out;
}

function applyAcPromo(text) {
  return text.replace(/\s*data-ac-promo(?:="[^"]*")?(?![\w-])/g, "");
}

function hasLoginAgain(text) {
  if (!hasAppClipCode(text)) return false;
  if (/\bloginAgain\s*[:=]\s*\{?\s*true\b/.test(text)) return true;
  if (/<(?:button|a)\b[^>]*>\s*(?:Log|Sign) in again\s*<\/(?:button|a)>/i.test(text)) return true;
  return /\b(?:Link|Button)\s*\(\s*"(?:Log|Sign) in again"\s*\)/.test(text);
}

function hasAcAgainCopy(text) {
  return /log in again when they transition/i.test(text);
}

function scanAcAgain(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-again(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a Log in again control on the transition from an App Clip to the app"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasLoginAgain(f.text) || hasAcAgainCopy(f.text)) {
      out.push(hit(f.path, "a Log in again control on the transition from an App Clip to the app"));
    }
  }
  return out;
}

function applyAcAgain(text) {
  return text.replace(/\s*data-ac-again(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAcWideCopy(text) {
  return /scan from a wide angle/i.test(text);
}

function hasWideScanAngle(text) {
  if (!hasAppClipCode(text)) return false;
  if (/\bscanAngle\s*[:=(]\s*["']wide["']/i.test(text)) return true;
  return /\bwideAngle\s*[:=]\s*\{?\s*true\b/.test(text);
}

function scanAcWide(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-wide(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an App Clip Code that requires a wide scan angle"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcWideCopy(f.text) || hasWideScanAngle(f.text)) {
      out.push(hit(f.path, "an App Clip Code that requires a wide scan angle"));
    }
  }
  return out;
}

function applyAcWide(text) {
  return text.replace(/\s*data-ac-wide(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAcFoldCopy(text) {
  return /deformable materials/i.test(text);
}

function hasDeformableCode(text) {
  if (!hasAppClipCode(text)) return false;
  return /\b(?:material|substrate)\s*[:=(]\s*["'](?:paper|plastic|fabric)["']/i.test(text);
}

function scanAcFold(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-fold(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an App Clip Code on paper, plastic, or fabric"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcFoldCopy(f.text) || hasDeformableCode(f.text)) {
      out.push(hit(f.path, "an App Clip Code on paper, plastic, or fabric"));
    }
  }
  return out;
}

function applyAcFold(text) {
  return text.replace(/\s*data-ac-fold(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAcTmCopy(text) {
  return /don['’]?t translate any Apple trademark/i.test(text);
}

function hasTranslatableTrademark(text) {
  if (!hasAppClipCode(text)) return false;
  const re = /<([A-Za-z][\w]*)\b([^>]*\btranslate\s*=\s*["']yes["'][^>]*)>([^<]*)<\/\1>/gi;
  let found;
  while ((found = re.exec(text))) {
    const visible = found[3].replace(/\s+/g, " ").trim();
    if (/^(?:App Clip|App Clips|App Clip Code|App Clip Codes)$/.test(visible)) return true;
  }
  return /\b(?:Text|Button)\s*\(\s*"(?:App Clip|App Clips|App Clip Code|App Clip Codes)"\s*\)[\s\S]{0,160}?\.translate\(\s*true\s*\)/.test(text);
}

function scanAcTm(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-tm(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an App Clip Code that marks an Apple trademark as translatable"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcTmCopy(f.text) || hasTranslatableTrademark(f.text)) {
      out.push(hit(f.path, "an App Clip Code that marks an Apple trademark as translatable"));
    }
  }
  return out;
}

function applyAcTm(text) {
  return text.replace(/\s*data-ac-tm(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAcCaseCopy(text) {
  return /use title case when using the terms/i.test(text);
}

function hasSentenceCaseLabel(text) {
  if (!hasAppClipCode(text)) return false;
  const re = />([^<]*)</g;
  let found;
  while ((found = re.exec(text))) {
    const visible = found[1].replace(/\s+/g, " ").trim();
    if (/^(?:app clip|app clips|app clip code|app clip codes)$/.test(visible)) return true;
  }
  return /\b(?:Text|Button|Label)\s*\(\s*"(?:app clip|app clips|app clip code|app clip codes)"\s*\)/.test(text);
}

function scanAcCase(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-case(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an App Clip Code labeled in sentence case"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcCaseCopy(f.text) || hasSentenceCaseLabel(f.text)) {
      out.push(hit(f.path, "an App Clip Code labeled in sentence case"));
    }
  }
  return out;
}

function applyAcCase(text) {
  return text.replace(/\s*data-ac-case(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAcGlossCopy(text) {
  return /shine, gloss, reflective or holographic/i.test(text);
}

function hasGlossFinish(text) {
  if (!hasAppClipCode(text)) return false;
  return /\b(?:finish|overlay|laminate)\s*[:=(]\s*["'](?:gloss|shine|holographic|laminate|reflective)["']/i.test(text);
}

function scanAcGloss(files) {
  const out = [];
  for (const f of files) {
    if (/data-ac-gloss(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an App Clip Code with a gloss finish"));
      continue;
    }
    if (!hasAppClipCode(f.text)) continue;
    if (hasAcGlossCopy(f.text) || hasGlossFinish(f.text)) {
      out.push(hit(f.path, "an App Clip Code with a gloss finish"));
    }
  }
  return out;
}

function applyAcGloss(text) {
  return text.replace(/\s*data-ac-gloss(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "ac-modified",
    rewrite: "marker",
    scan: scanAcModified,
    apply(text, file) {
      return applyAcModified(text);
    },
  },
  {
    id: "ac-overlay",
    rewrite: "marker",
    scan: scanAcOverlay,
    apply(text, file) {
      return applyAcOverlay(text);
    },
  },
  {
    id: "ac-motion",
    rewrite: "marker",
    scan: scanAcMotion,
    apply(text, file) {
      return applyAcMotion(text);
    },
  },
  {
    id: "ac-rotate",
    rewrite: "marker",
    scan: scanAcRotate,
    apply(text, file) {
      return applyAcRotate(text);
    },
  },
  {
    id: "ac-aspect",
    rewrite: "marker",
    scan: scanAcAspect,
    apply(text, file) {
      return applyAcAspect(text);
    },
  },
  {
    id: "ac-symbol",
    rewrite: "marker",
    scan: scanAcSymbol,
    apply(text, file) {
      return applyAcSymbol(text);
    },
  },
  {
    id: "ac-solo",
    rewrite: "marker",
    scan: scanAcSolo,
    apply(text, file) {
      return applyAcSolo(text);
    },
  },
  {
    id: "ac-fetch",
    rewrite: "marker",
    scan: scanAcFetch,
    apply(text, file) {
      return applyAcFetch(text);
    },
  },
  {
    id: "ac-splash",
    rewrite: "marker",
    scan: scanAcSplash,
    apply(text, file) {
      return applyAcSplash(text);
    },
  },
  {
    id: "ac-small",
    rewrite: "marker",
    scan: scanAcSmall,
    apply(text, file) {
      return applyAcSmall(text);
    },
  },
  {
    id: "ac-gap",
    rewrite: "marker",
    scan: scanAcGap,
    apply(text, file) {
      return applyAcGap(text);
    },
  },
  {
    id: "ac-shot",
    rewrite: "marker",
    scan: scanAcShot,
    apply(text, file) {
      return applyAcShot(text);
    },
  },
  {
    id: "ac-ads",
    rewrite: "marker",
    scan: scanAcAds,
    apply(text, file) {
      return applyAcAds(text);
    },
  },
  {
    id: "ac-promo",
    rewrite: "marker",
    scan: scanAcPromo,
    apply(text, file) {
      return applyAcPromo(text);
    },
  },
  {
    id: "ac-again",
    rewrite: "marker",
    scan: scanAcAgain,
    apply(text, file) {
      return applyAcAgain(text);
    },
  },
  {
    id: "ac-wide",
    rewrite: "marker",
    scan: scanAcWide,
    apply(text, file) {
      return applyAcWide(text);
    },
  },
  {
    id: "ac-fold",
    rewrite: "marker",
    scan: scanAcFold,
    apply(text, file) {
      return applyAcFold(text);
    },
  },
  {
    id: "ac-tm",
    rewrite: "marker",
    scan: scanAcTm,
    apply(text, file) {
      return applyAcTm(text);
    },
  },
  {
    id: "ac-case",
    rewrite: "marker",
    scan: scanAcCase,
    apply(text, file) {
      return applyAcCase(text);
    },
  },
  {
    id: "ac-gloss",
    rewrite: "marker",
    scan: scanAcGloss,
    apply(text, file) {
      return applyAcGloss(text);
    },
  },
];
