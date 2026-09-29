import { hit } from "./shared.mjs";

function hasHomekit(text) {
  return (
    /\bdata-homekit\b/.test(text) ||
    /\bHMHomeManager\b/.test(text) ||
    /\bHMAccessory\b/.test(text) ||
    /\bHMHome\b/.test(text)
  );
}

function hasHkCompanyNameCopy(text) {
  return (
    (/company names?/i.test(text) && /service names?/i.test(text)) ||
    (/model numbers?/i.test(text) && /service names?/i.test(text)) ||
    /suggested as a siri service name/i.test(text)
  );
}

function hasHkOverwriteCopy(text) {
  return /overwrite/i.test(text) && /homekit database/i.test(text);
}

function hasHkDupSettingsCopy(text) {
  return /duplicate/i.test(text) && /home settings/i.test(text);
}

function hasHkCoverCameraCopy(text) {
  return (
    (/block/i.test(text) && /camera images?/i.test(text)) ||
    (/cover/i.test(text) && /camera(?:'s)? images?/i.test(text))
  );
}

function scanHkCompanyName(files) {
  const out = [];
  for (const f of files) {
    if (/data-hk-company-name/.test(f.text)) {
      out.push(hit(f.path, "company names or model numbers as siri service names"));
      continue;
    }
    if (!hasHomekit(f.text)) continue;
    if (hasHkCompanyNameCopy(f.text)) {
      out.push(hit(f.path, "company names or model numbers as siri service names"));
    }
  }
  return out;
}

function applyHkCompanyName(text) {
  return text.replace(/\s*data-hk-company-name(?:="[^"]*")?/g, "");
}

function scanHkOverwriteDb(files) {
  const out = [];
  for (const f of files) {
    if (/data-hk-overwrite-db/.test(f.text)) {
      out.push(hit(f.path, "homekit database overwritten without direction"));
      continue;
    }
    if (!hasHomekit(f.text)) continue;
    if (hasHkOverwriteCopy(f.text)) {
      out.push(hit(f.path, "homekit database overwritten without direction"));
    }
  }
  return out;
}

function applyHkOverwriteDb(text) {
  return text.replace(/\s*data-hk-overwrite-db(?:="[^"]*")?/g, "");
}

function scanHkDupSettings(files) {
  const out = [];
  for (const f of files) {
    if (/data-hk-dup-settings/.test(f.text)) {
      out.push(hit(f.path, "duplicate home settings"));
      continue;
    }
    if (!hasHomekit(f.text)) continue;
    if (hasHkDupSettingsCopy(f.text)) {
      out.push(hit(f.path, "duplicate home settings"));
    }
  }
  return out;
}

function applyHkDupSettings(text) {
  return text.replace(/\s*data-hk-dup-settings(?:="[^"]*")?/g, "");
}

function scanHkCoverCamera(files) {
  const out = [];
  for (const f of files) {
    if (/data-hk-cover-camera/.test(f.text)) {
      out.push(hit(f.path, "camera images blocked"));
      continue;
    }
    if (!hasHomekit(f.text)) continue;
    if (hasHkCoverCameraCopy(f.text)) {
      out.push(hit(f.path, "camera images blocked"));
    }
  }
  return out;
}

function applyHkCoverCamera(text) {
  return text.replace(/\s*data-hk-cover-camera(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "hk-company-name",
    rewrite: "marker",
    scan: scanHkCompanyName,
    apply(text, file) {
      return applyHkCompanyName(text);
    },
  },
  {
    id: "hk-overwrite-db",
    rewrite: "marker",
    scan: scanHkOverwriteDb,
    apply(text, file) {
      return applyHkOverwriteDb(text);
    },
  },
  {
    id: "hk-dup-settings",
    rewrite: "marker",
    scan: scanHkDupSettings,
    apply(text, file) {
      return applyHkDupSettings(text);
    },
  },
  {
    id: "hk-cover-camera",
    rewrite: "marker",
    scan: scanHkCoverCamera,
    apply(text, file) {
      return applyHkCoverCamera(text);
    },
  },
];
