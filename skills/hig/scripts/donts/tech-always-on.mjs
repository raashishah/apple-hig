import { hit } from "./shared.mjs";

function hasAlwaysOn(text) {
  return (
    /\bdata-always-on\b/.test(text) ||
    /\bisLuminanceReduced\b/.test(text) ||
    /\bWKSupportsAlwaysOnDisplay\b/.test(text) ||
    /\bsupportsAlwaysOnDisplay\b/.test(text)
  );
}

function hasSensitiveAlwaysOnCopy(text) {
  return (
    /\bbank\b/i.test(text) ||
    /\bbalance\b/i.test(text) ||
    /\bhealth\b/i.test(text) ||
    /\bheart rate\b/i.test(text) ||
    /\bpassword\b/i.test(text) ||
    /\bSSN\b/.test(text) ||
    /\bsocial security\b/i.test(text)
  );
}

function hasAlwaysOnRedaction(text) {
  return (
    /\bdata-redacted\b/.test(text) ||
    /\bprivacySensitive\b/.test(text) ||
    /\.redacted\s*\(/.test(text) ||
    /\bredacted\s*\(/.test(text)
  );
}

function scanAlwaysOnSensitive(files) {
  const out = [];
  for (const f of files) {
    if (/data-always-on-sensitive/.test(f.text)) {
      out.push(hit(f.path, "sensitive information left visible"));
      continue;
    }
    if (!hasAlwaysOn(f.text)) continue;
    if (hasSensitiveAlwaysOnCopy(f.text) && !hasAlwaysOnRedaction(f.text)) {
      out.push(hit(f.path, "sensitive information left visible"));
    }
  }
  return out;
}

function applyAlwaysOnSensitive(text) {
  return text.replace(/\s*data-always-on-sensitive(?:="[^"]*")?/g, "");
}

function scanAlwaysOnStopMotion(files) {
  const out = [];
  for (const f of files) {
    if (/data-always-on-stop-motion/.test(f.text)) {
      out.push(hit(f.path, "motion that stops instantly when always on begins"));
    }
  }
  return out;
}

function applyAlwaysOnStopMotion(text) {
  return text.replace(/\s*data-always-on-stop-motion(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "always-on-sensitive",
    rewrite: "marker",
    scan: scanAlwaysOnSensitive,
    apply(text, file) {
      return applyAlwaysOnSensitive(text);
    },
  },
  {
    id: "always-on-stop-motion",
    rewrite: "marker",
    scan: scanAlwaysOnStopMotion,
    apply(text, file) {
      return applyAlwaysOnStopMotion(text);
    },
  },
];
