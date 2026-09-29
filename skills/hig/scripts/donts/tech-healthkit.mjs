import { hit } from "./shared.mjs";

function hasHealthKit(text) {
  return (
    /\bdata-healthkit\b/.test(text) ||
    /\bHKHealthStore\b/.test(text) ||
    /\bHKQuantityTypeIdentifier\b/.test(text)
  );
}

function hasHltReplicaCopy(text) {
  return (
    (/replicat/i.test(text) && /permission/i.test(text)) ||
    /custom (health )?permission screen/i.test(text)
  );
}

function hasHltSharingCopy(text) {
  return (
    /health data sharing/i.test(text) ||
    (/additional screens/i.test(text) && /health/i.test(text))
  );
}

function hasHltTermCopy(text) {
  return (
    /the term HealthKit/i.test(text) ||
    />[^<]*\bHealthKit\b[^<]*</.test(text) ||
    /["'][^"']*\bHealthKit\b[^"']*["']/.test(text)
  );
}

function scanHltReplica(files) {
  const out = [];
  for (const f of files) {
    if (/data-hlt-replica/.test(f.text)) {
      out.push(hit(f.path, "custom screens that replicate the health permission screen"));
      continue;
    }
    if (!hasHealthKit(f.text)) continue;
    if (hasHltReplicaCopy(f.text)) {
      out.push(hit(f.path, "custom screens that replicate the health permission screen"));
    }
  }
  return out;
}

function applyHltReplica(text) {
  return text.replace(/\s*data-hlt-replica(?:="[^"]*")?/g, "");
}

function scanHltSharing(files) {
  const out = [];
  for (const f of files) {
    if (/data-hlt-sharing/.test(f.text)) {
      out.push(hit(f.path, "in-app screens that manage health data sharing"));
      continue;
    }
    if (!hasHealthKit(f.text)) continue;
    if (hasHltSharingCopy(f.text)) {
      out.push(hit(f.path, "in-app screens that manage health data sharing"));
    }
  }
  return out;
}

function applyHltSharing(text) {
  return text.replace(/\s*data-hlt-sharing(?:="[^"]*")?/g, "");
}

function scanHltTerm(files) {
  const out = [];
  for (const f of files) {
    if (/data-hlt-term/.test(f.text)) {
      out.push(hit(f.path, "the term healthkit in user-facing copy"));
      continue;
    }
    if (!hasHealthKit(f.text)) continue;
    if (hasHltTermCopy(f.text)) {
      out.push(hit(f.path, "the term healthkit in user-facing copy"));
    }
  }
  return out;
}

function applyHltTerm(text) {
  return text.replace(/\s*data-hlt-term(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "hlt-replica",
    rewrite: "marker",
    scan: scanHltReplica,
    apply(text, file) {
      return applyHltReplica(text);
    },
  },
  {
    id: "hlt-sharing",
    rewrite: "marker",
    scan: scanHltSharing,
    apply(text, file) {
      return applyHltSharing(text);
    },
  },
  {
    id: "hlt-term",
    rewrite: "marker",
    scan: scanHltTerm,
    apply(text, file) {
      return applyHltTerm(text);
    },
  },
];
