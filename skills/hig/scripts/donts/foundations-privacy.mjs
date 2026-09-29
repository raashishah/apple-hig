import { hit, dialogRegions, scanRewriteSystemAlerts, isMarketingFile } from "./shared.mjs";

function isHiddenMarkup(html) {
  return (
    /\bhidden\b/i.test(html) ||
    /aria-hidden=["']true["']/i.test(html) ||
    /\bsr-only\b/.test(html) ||
    /display\s*:\s*none/i.test(html) ||
    /opacity\s*:\s*0(?:\.0+)?(?:\s|;|"|')/i.test(html) ||
    /visibility\s*:\s*hidden/i.test(html) ||
    /font-size\s*:\s*(?:[0-9]|10)px/i.test(html)
  );
}

function permissionRegions(text) {
  const extra = [];
  const re = /<([A-Za-z][\w]*)\b([^>]*data-permission[^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) extra.push(m[0]);
  return [...dialogRegions(text), ...extra];
}

function controlTags(region) {
  return [
    ...(region.match(/<button\b[\s\S]*?<\/button>/gi) || []),
    ...(region.match(/<a\b[\s\S]*?<\/a>/gi) || []),
  ];
}

function scanDarkPatternAllow(files) {
  const out = [];
  for (const f of files) {
    for (const region of permissionRegions(f.text)) {
      const controls = controlTags(region);
      const allow = controls.filter((c) => />\s*Allow\s*</i.test(c));
      if (!allow.length) continue;
      const deny = controls.filter((c) =>
        />\s*(Don't Allow|Don't allow|Deny|Not now)\s*</i.test(c),
      );
      const readableDeny = deny.filter((c) => !isHiddenMarkup(c));
      if (!readableDeny.length) {
        out.push(hit(f.path, "Allow is the only readable permission control"));
      }
    }
  }
  return out;
}

function applyDarkPatternAllow(text) {
  return text.replace(
    /<(button|a)\b([^>]*)>(\s*(?:Don't Allow|Don't allow|Deny|Not now)\s*)<\/\1>/gi,
    (all, tag, attrs, label) => {
      if (!isHiddenMarkup(all)) return all;
      const nextAttrs = attrs
        .replace(/\s*hidden(?:=["'][^"']*["'])?/gi, "")
        .replace(/\s*aria-hidden=["']true["']/gi, "")
        .replace(/(\bclass(?:Name)?=["'][^"']*)\bsr-only\b\s*/g, "$1")
        .replace(/display\s*:\s*none\s*;?/gi, "")
        .replace(/opacity\s*:\s*0(?:\.0+)?\s*;?/gi, "")
        .replace(/visibility\s*:\s*hidden\s*;?/gi, "")
        .replace(/font-size\s*:\s*(?:[0-9]|10)px\s*;?/gi, "");
      return `<${tag}${nextAttrs}>${label}</${tag}>`;
    },
  );
}

function hasDevicePrompt(text) {
  return (
    /getUserMedia\s*\(/i.test(text) ||
    /geolocation\.getCurrentPosition/i.test(text) ||
    /would like to access your (camera|mic(?:rophone)?|location)/i.test(text) ||
    /allow .{0,40}(camera|mic(?:rophone)?|location)/i.test(text)
  );
}

function scanPreemptiveMarketing(files) {
  const out = [];
  for (const f of files) {
    if (!isMarketingFile(f)) continue;
    if (hasDevicePrompt(f.text)) {
      out.push(hit(f.path, "camera/mic/location prompt on a marketing screen"));
    }
  }
  return out;
}

function hasTrackingRequest(text) {
  return /\bATTrackingManager\b/.test(text) || /\brequestTrackingAuthorization\b/.test(text);
}

function hasAttPrealertCopy(text) {
  return (
    /never precede the system-provided alert with a custom screen/i.test(text) ||
    /custom screen or window that could confuse or mislead/i.test(text)
  );
}

function hasAttAllowButton(text) {
  return /<button\b[^>]*>\s*Allow\s*<\/button>/i.test(text);
}

function hasAttIncentive(text) {
  const incentive = "earn coins|get a reward|\\bincentive\\b";
  const request = "requestTrackingAuthorization|ATTrackingManager";
  const forward = new RegExp(`(?:${request})[\\s\\S]{0,240}(?:${incentive})`, "i");
  const backward = new RegExp(`(?:${incentive})[\\s\\S]{0,240}(?:${request})`, "i");
  return forward.test(text) || backward.test(text);
}

function hasAttPrealertSignal(text) {
  if (!hasTrackingRequest(text)) return false;
  return hasAttAllowButton(text) || hasAttIncentive(text);
}

function scanAttPrealert(files) {
  const out = [];
  for (const f of files) {
    if (/data-pv-att/.test(f.text)) {
      out.push(hit(f.path, "a custom tracking screen with an incentive or an Allow button"));
      continue;
    }
    if (!hasTrackingRequest(f.text)) continue;
    if (hasAttPrealertCopy(f.text) || hasAttPrealertSignal(f.text)) {
      out.push(hit(f.path, "a custom tracking screen with an incentive or an Allow button"));
    }
  }
  return out;
}

function applyAttPrealert(text) {
  return text.replace(/\s*data-pv-att(?:="[^"]*")?/g, "");
}

function hasAttLeaveCopy(text) {
  return (
    /don['’]?t include additional actions in your custom screen/i.test(text) ||
    /additional actions in your custom screen or window/i.test(text) ||
    /option to close or cancel/i.test(text) ||
    /leave the screen or window without viewing the system alert/i.test(text)
  );
}

function hasAttLeaveButton(text) {
  if (!hasTrackingRequest(text)) return false;
  const button =
    "<button\\b[^>]*>\\s*(?:Close|Cancel)\\s*</button>|Button\\(\\s*[\"'](?:Close|Cancel)[\"']\\s*\\)";
  const request = "requestTrackingAuthorization|ATTrackingManager";
  const forward = new RegExp(`(?:${request})[\\s\\S]{0,240}(?:${button})`, "i");
  const backward = new RegExp(`(?:${button})[\\s\\S]{0,240}(?:${request})`, "i");
  if (!forward.test(text) && !backward.test(text)) return false;
  const consent = new RegExp(
    `(?:legal consent)[\\s\\S]{0,240}(?:${button})|(?:${button})[\\s\\S]{0,240}legal consent`,
    "i",
  );
  return !consent.test(text);
}

function scanAttLeave(files) {
  const out = [];
  for (const f of files) {
    if (/data-pv-leave/.test(f.text)) {
      out.push(hit(f.path, "a Close or Cancel button on a custom tracking screen"));
      continue;
    }
    if (!hasTrackingRequest(f.text)) continue;
    if (hasAttLeaveCopy(f.text) || hasAttLeaveButton(f.text)) {
      out.push(hit(f.path, "a Close or Cancel button on a custom tracking screen"));
    }
  }
  return out;
}

function applyAttLeave(text) {
  return text.replace(/\s*data-pv-leave(?:="[^"]*")?/g, "");
}

function hasPlaintextPasswordWrite(text) {
  const jsWrite =
    /(?:writeFileSync|writeFile|writeTextFile|appendFileSync|appendFile)\s*\([\s\S]{0,180}?\.(?:txt|text)["'`][\s\S]{0,80}?\bpassword\b/i;
  const swiftWrite =
    /\bpassword\b[\s\S]{0,120}?\.write\s*\([\s\S]{0,160}?\.(?:txt|text)\b/i;
  return jsWrite.test(text) || swiftWrite.test(text);
}

function scanPlaintextPassword(files) {
  const out = [];
  for (const f of files) {
    if (/data-pv-plain(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a password written to a plain-text file"));
      continue;
    }
    if (hasPlaintextPasswordWrite(f.text)) {
      out.push(hit(f.path, "a password written to a plain-text file"));
    }
  }
  return out;
}

function applyPlaintextPassword(text) {
  return text.replace(/\s*data-pv-plain(?:="[^"]*")?(?![\w-])/g, "");
}

function namesSignedInPerson(text) {
  return (
    /\b[Ww]elcome back,\s+[A-Z][a-z]{2,}\b/.test(text) ||
    /\b[Ss]igned in as\s+[A-Z][a-z]{2,}\b/.test(text)
  );
}

function scanSignedInPerson(files) {
  const out = [];
  for (const f of files) {
    if (/data-pv-who(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a greeting that names the signed-in person"));
      continue;
    }
    if (namesSignedInPerson(f.text)) {
      out.push(hit(f.path, "a greeting that names the signed-in person"));
    }
  }
  return out;
}

function applySignedInPerson(text) {
  return text.replace(/\s*data-pv-who(?:="[^"]*")?(?![\w-])/g, "");
}

function scanRewriteOrAutomate(files) {
  const out = scanRewriteSystemAlerts(files);
  for (const f of files) {
    if (
      /querySelector[\s\S]{0,120}Allow[\s\S]{0,40}\.click\s*\(/i.test(f.text) ||
      /\.click\s*\([\s\S]{0,40}Allow/i.test(f.text)
    ) {
      out.push(hit(f.path, "scripted Allow click"));
    }
    if (
      /(useEffect|componentDidMount|DOMContentLoaded|onMounted)\s*\([\s\S]{0,500}(requestPermission|getUserMedia|geolocation\.getCurrentPosition)/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "auto permission without a gesture"));
    }
  }
  return out;
}

export const records = [
  {
    id: "dark-pattern-allow-only",
    rewrite: "host",
    scan: scanDarkPatternAllow,
    apply(text, file) {
      return applyDarkPatternAllow(text);
    },
  },
  {
    id: "preemptive-permission-on-marketing",
    rewrite: "marker",
    scan: scanPreemptiveMarketing,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "pv-att",
    rewrite: "marker",
    scan: scanAttPrealert,
    apply(text, file) {
      return applyAttPrealert(text);
    },
  },
  {
    id: "pv-leave",
    rewrite: "marker",
    scan: scanAttLeave,
    apply(text, file) {
      return applyAttLeave(text);
    },
  },
  {
    id: "pv-plain",
    rewrite: "marker",
    scan: scanPlaintextPassword,
    apply(text, file) {
      return applyPlaintextPassword(text);
    },
  },
  {
    id: "pv-who",
    rewrite: "marker",
    scan: scanSignedInPerson,
    apply(text, file) {
      return applySignedInPerson(text);
    },
  },
  {
    id: "rewrite-or-automate-system-ui",
    rewrite: "marker",
    scan: scanRewriteOrAutomate,
    apply(text, file) {
      return text;
    },
  },
];
