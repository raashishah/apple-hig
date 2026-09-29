import { hit } from "./shared.mjs";

function hasCarPlay(text) {
  return (
    /\bdata-carplay\b/.test(text) ||
    /\bCPInterfaceController\b/.test(text) ||
    /\bCPTemplateApplicationScene\b/.test(text)
  );
}

function hasCpIphoneLockCopy(text) {
  return (
    /iphone requires input/i.test(text) ||
    /locked out of carplay/i.test(text) ||
    (/unlock iphone/i.test(text) && /carplay/i.test(text))
  );
}

function hasCpIphoneErrorCopy(text) {
  return (
    /errors reported on iphone/i.test(text) ||
    (/pick up (their |the )?iphone/i.test(text) && /error|resolve/i.test(text)) ||
    (/report(ed)? errors? on (the connected )?iphone/i.test(text))
  );
}

function hasCpIphoneInteractCopy(text) {
  return (
    /iphone interactions? required/i.test(text) ||
    (/setup on iphone/i.test(text) && /carplay|vehicle|motion/i.test(text)) ||
    /app interactions on iphone/i.test(text)
  );
}

function scanCpIphoneLock(files) {
  const out = [];
  for (const f of files) {
    if (/data-cp-iphone-lock/.test(f.text)) {
      out.push(hit(f.path, "carplay locked out because iphone requires input"));
      continue;
    }
    if (!hasCarPlay(f.text)) continue;
    if (hasCpIphoneLockCopy(f.text)) {
      out.push(hit(f.path, "carplay locked out because iphone requires input"));
    }
  }
  return out;
}

function applyCpIphoneLock(text) {
  return text.replace(/\s*data-cp-iphone-lock(?:="[^"]*")?/g, "");
}

function scanCpIphoneError(files) {
  const out = [];
  for (const f of files) {
    if (/data-cp-iphone-error/.test(f.text)) {
      out.push(hit(f.path, "errors reported on iphone instead of carplay"));
      continue;
    }
    if (!hasCarPlay(f.text)) continue;
    if (hasCpIphoneErrorCopy(f.text)) {
      out.push(hit(f.path, "errors reported on iphone instead of carplay"));
    }
  }
  return out;
}

function applyCpIphoneError(text) {
  return text.replace(/\s*data-cp-iphone-error(?:="[^"]*")?/g, "");
}

function scanCpIphoneInteract(files) {
  const out = [];
  for (const f of files) {
    if (/data-cp-iphone-interact/.test(f.text)) {
      out.push(hit(f.path, "iphone interactions required while carplay is active"));
      continue;
    }
    if (!hasCarPlay(f.text)) continue;
    if (hasCpIphoneInteractCopy(f.text)) {
      out.push(hit(f.path, "iphone interactions required while carplay is active"));
    }
  }
  return out;
}

function applyCpIphoneInteract(text) {
  return text.replace(/\s*data-cp-iphone-interact(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "cp-iphone-lock",
    rewrite: "marker",
    scan: scanCpIphoneLock,
    apply(text, file) {
      return applyCpIphoneLock(text);
    },
  },
  {
    id: "cp-iphone-error",
    rewrite: "marker",
    scan: scanCpIphoneError,
    apply(text, file) {
      return applyCpIphoneError(text);
    },
  },
  {
    id: "cp-iphone-interact",
    rewrite: "marker",
    scan: scanCpIphoneInteract,
    apply(text, file) {
      return applyCpIphoneInteract(text);
    },
  },
];
