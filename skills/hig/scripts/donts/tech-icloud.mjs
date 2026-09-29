import { hit } from "./shared.mjs";

function hasIcloud(text) {
  return (
    /\bdata-icloud\b/.test(text) ||
    /\bCKContainer\b/.test(text) ||
    /\bNSUbiquitousKeyValueStore\b/.test(text)
  );
}

function hasIcAskDocsCopy(text) {
  return /which documents to keep/i.test(text);
}

function hasIcUnavailableCopy(text) {
  return (
    /icloud is unavailable/i.test(text) ||
    (/airplane mode/i.test(text) && /alert/i.test(text))
  );
}

function hasIcAppResourcesCopy(text) {
  return /app resources/i.test(text) && /icloud/i.test(text);
}

function scanIcAskDocs(files) {
  const out = [];
  for (const f of files) {
    if (/data-ic-ask-docs/.test(f.text)) {
      out.push(hit(f.path, "asking which documents to keep in icloud"));
      continue;
    }
    if (!hasIcloud(f.text)) continue;
    if (hasIcAskDocsCopy(f.text)) {
      out.push(hit(f.path, "asking which documents to keep in icloud"));
    }
  }
  return out;
}

function applyIcAskDocs(text) {
  return text.replace(/\s*data-ic-ask-docs(?:="[^"]*")?/g, "");
}

function scanIcUnavailableAlert(files) {
  const out = [];
  for (const f of files) {
    if (/data-ic-unavailable-alert/.test(f.text)) {
      out.push(hit(f.path, "alert when icloud is unavailable"));
      continue;
    }
    if (!hasIcloud(f.text)) continue;
    if (hasIcUnavailableCopy(f.text)) {
      out.push(hit(f.path, "alert when icloud is unavailable"));
    }
  }
  return out;
}

function applyIcUnavailableAlert(text) {
  return text.replace(/\s*data-ic-unavailable-alert(?:="[^"]*")?/g, "");
}

function scanIcAppResources(files) {
  const out = [];
  for (const f of files) {
    if (/data-ic-app-resources/.test(f.text)) {
      out.push(hit(f.path, "app resources stored in icloud"));
      continue;
    }
    if (!hasIcloud(f.text)) continue;
    if (hasIcAppResourcesCopy(f.text)) {
      out.push(hit(f.path, "app resources stored in icloud"));
    }
  }
  return out;
}

function applyIcAppResources(text) {
  return text.replace(/\s*data-ic-app-resources(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "ic-ask-docs",
    rewrite: "marker",
    scan: scanIcAskDocs,
    apply(text, file) {
      return applyIcAskDocs(text);
    },
  },
  {
    id: "ic-unavailable-alert",
    rewrite: "marker",
    scan: scanIcUnavailableAlert,
    apply(text, file) {
      return applyIcUnavailableAlert(text);
    },
  },
  {
    id: "ic-app-resources",
    rewrite: "marker",
    scan: scanIcAppResources,
    apply(text, file) {
      return applyIcAppResources(text);
    },
  },
];
