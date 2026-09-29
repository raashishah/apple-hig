import { hit, hasNotificationChrome, hasDuplicateNotificationTitle } from "./shared.mjs";

function scanNotificationWall(files) {
  const out = [];
  for (const f of files) {
    if (
      /(useEffect|componentDidMount|DOMContentLoaded|onMounted)\s*\([\s\S]{0,400}Notification\.requestPermission/i.test(
        f.text,
      ) ||
      /data-onboarding[\s\S]{0,400}Enable notifications/i.test(f.text)
    ) {
      out.push(hit(f.path, "first-launch Enable notifications wall"));
    }
  }
  return out;
}

function scanMarketingTimeSensitive(files) {
  const out = [];
  for (const f of files) {
    if (
      /(time[- ]sensitive|interruptionLevel.{0,40}timeSensitive|UNNotificationInterruptionLevel\.timeSensitive)/i.test(
        f.text,
      ) &&
      /\b(sale|offer|discount|promo|marketing|don't miss)\b/i.test(f.text)
    ) {
      out.push(hit(f.path, "marketing marked time-sensitive"));
    }
  }
  return out;
}

function scanCustomLockScreen(files) {
  const out = [];
  for (const f of files) {
    if (
      /data-lock-screen|LockScreen(View|UI)|custom lock[- ]screen/i.test(f.text)
    ) {
      out.push(hit(f.path, "custom lock-screen notification UI"));
    }
  }
  return out;
}

function hasNtBadgeCopy(text) {
  return (
    /don['’]?t use a badge to convey numeric information/i.test(text) ||
    /badge to convey numeric information that isn['’]?t related to notifications/i.test(text) ||
    /numeric information that isn['’]?t related to notifications/i.test(text)
  );
}

function hasNtBadgeSignal(text) {
  if (!hasNotificationChrome(text)) return false;
  const topics = ["weather", "temperature", "stockPrice", "stock price", "gameScore", "highScore"];
  const apis = ["applicationIconBadgeNumber", "setBadgeCount"];
  for (const api of apis) {
    if (!new RegExp(`\\b${api}\\b`).test(text)) continue;
    for (const topic of topics) {
      const escaped = topic.replace(/\s+/g, "\\s+");
      const forward = new RegExp(`\\b${api}\\b[\\s\\S]{0,160}\\b${escaped}\\b`, "i");
      const backward = new RegExp(`\\b${escaped}\\b[\\s\\S]{0,160}\\b${api}\\b`, "i");
      if (forward.test(text) || backward.test(text)) return true;
    }
  }
  return false;
}

function scanNtBadge(files) {
  const out = [];
  for (const f of files) {
    if (/data-nt-badge/.test(f.text)) {
      out.push(hit(f.path, "a badge that conveys numeric information that isn't related to notifications"));
      continue;
    }
    if (!hasNotificationChrome(f.text)) continue;
    if (hasNtBadgeCopy(f.text) || hasNtBadgeSignal(f.text)) {
      out.push(hit(f.path, "a badge that conveys numeric information that isn't related to notifications"));
    }
  }
  return out;
}

function applyNtBadge(text) {
  return text.replace(/\s*data-nt-badge(?:="[^"]*")?/g, "");
}

function bundleDisplayName(text) {
  const patterns = [
    /CFBundleDisplayName<\/key>\s*<string>([^<]+)<\/string>/i,
    /CFBundleDisplayName\s*[:=]\s*"([^"]+)"/,
    /CFBundleDisplayName\s*[:=]\s*'([^']+)'/,
  ];
  for (const re of patterns) {
    const found = text.match(re);
    if (!found) continue;
    const name = found[1].trim();
    if (name.length < 3) continue;
    if (/^(open|snooze|ok|yes|no)$/i.test(name)) continue;
    return name;
  }
  return null;
}

function hasNtLabelCopy(text) {
  return (
    /don['’]?t include your app name/i.test(text) ||
    /include your app name (?:or any extraneous information )?in the button label/i.test(text) ||
    /app name in (?:a |the )?notification button label/i.test(text)
  );
}

function hasNtLabelSignal(text) {
  if (!hasNotificationChrome(text)) return false;
  const name = bundleDisplayName(text);
  if (!name) return false;
  const nameRe = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  const titles = text.matchAll(/UNNotificationAction\s*\([^)]*title:\s*"([^"]+)"/g);
  for (const found of titles) {
    if (nameRe.test(found[1])) return true;
  }
  return false;
}

function scanNtLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-nt-label/.test(f.text)) {
      out.push(hit(f.path, "the app name in a notification button label"));
      continue;
    }
    if (!hasNotificationChrome(f.text)) continue;
    if (hasNtLabelCopy(f.text) || hasNtLabelSignal(f.text)) {
      out.push(hit(f.path, "the app name in a notification button label"));
    }
  }
  return out;
}

function applyNtLabel(text) {
  return text.replace(/\s*data-nt-label(?:="[^"]*")?/g, "");
}

function hasNtOpenCopy(text) {
  return (
    /avoid providing an action that merely opens your app/i.test(text) ||
    /action that merely opens your app/i.test(text)
  );
}

function hasNtOpenSignal(text) {
  if (!hasNotificationChrome(text)) return false;
  const titles = text.matchAll(/UNNotificationAction\s*\([^)]*title:\s*"([^"]+)"/g);
  for (const found of titles) {
    if (/^(open|open app|launch app)$/i.test(found[1].trim())) return true;
  }
  return false;
}

function scanNtOpen(files) {
  const out = [];
  for (const f of files) {
    if (/data-nt-open/.test(f.text)) {
      out.push(hit(f.path, "a notification action that merely opens your app"));
      continue;
    }
    if (!hasNotificationChrome(f.text)) continue;
    if (hasNtOpenCopy(f.text) || hasNtOpenSignal(f.text)) {
      out.push(hit(f.path, "a notification action that merely opens your app"));
    }
  }
  return out;
}

function applyNtOpen(text) {
  return text.replace(/\s*data-nt-open(?:="[^"]*")?/g, "");
}

function hasNtContentCopy(text) {
  return (
    /avoid including your app name or icon/i.test(text) ||
    /app name or icon inside the notification content/i.test(text)
  );
}

function notificationContentStrings(text) {
  const withoutActions = text.replace(/UNNotificationAction\s*\([^)]*\)/g, "");
  const out = [];
  const re = /(?:\.title|\.body)\s*=\s*"([^"]+)"/g;
  let found;
  while ((found = re.exec(withoutActions))) out.push(found[1]);
  return out;
}

function hasNtContentSignal(text) {
  if (!hasNotificationChrome(text)) return false;
  const name = bundleDisplayName(text);
  if (!name) return false;
  const nameRe = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  return notificationContentStrings(text).some((value) => nameRe.test(value));
}

function scanNtContent(files) {
  const out = [];
  for (const f of files) {
    if (/data-nt-content/.test(f.text)) {
      out.push(hit(f.path, "the app name or icon inside the notification content"));
      continue;
    }
    if (!hasNotificationChrome(f.text)) continue;
    if (hasNtContentCopy(f.text) || hasNtContentSignal(f.text)) {
      out.push(hit(f.path, "the app name or icon inside the notification content"));
    }
  }
  return out;
}

function applyNtContent(text) {
  return text.replace(/\s*data-nt-content(?:="[^"]*")?/g, "");
}

function hasDuplicateNotificationCopy(text) {
  return /multiple notifications for the same thing/i.test(text);
}

function scanDuplicateNotification(files) {
  const out = [];
  for (const f of files) {
    if (/data-nt-dup(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "multiple notifications for the same thing"));
      continue;
    }
    if (!hasNotificationChrome(f.text)) continue;
    if (hasDuplicateNotificationTitle(f.text) || hasDuplicateNotificationCopy(f.text)) {
      out.push(hit(f.path, "multiple notifications for the same thing"));
    }
  }
  return out;
}

function applyDuplicateNotification(text) {
  return text.replace(/\s*data-nt-dup(?:="[^"]*")?(?![\w-])/g, "");
}

function hasFakeBadgeCopy(text) {
  return (
    /custom image or component that mimics/i.test(text) ||
    /mimics the appearance or behavior of a badge/i.test(text) ||
    /custom component that mimics a notification badge/i.test(text)
  );
}

function hasCustomNotificationBadge(text) {
  return (
    /class(Name)?=["'][^"']*\bnotification-badge\b/.test(text) ||
    /\bdata-app-icon-badge\b/.test(text)
  );
}

function scanFakeBadge(files) {
  const out = [];
  for (const f of files) {
    if (/data-nt-mimic(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a custom component that mimics a notification badge"));
      continue;
    }
    if (!hasNotificationChrome(f.text)) continue;
    if (hasCustomNotificationBadge(f.text) || hasFakeBadgeCopy(f.text)) {
      out.push(hit(f.path, "a custom component that mimics a notification badge"));
    }
  }
  return out;
}

function applyFakeBadge(text) {
  return text.replace(/\s*data-nt-mimic(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "first-launch-notification-wall",
    rewrite: "marker",
    scan: scanNotificationWall,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "marketing-as-time-sensitive",
    rewrite: "marker",
    scan: scanMarketingTimeSensitive,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "custom-lock-screen-ui",
    rewrite: "marker",
    scan: scanCustomLockScreen,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "nt-badge",
    rewrite: "marker",
    scan: scanNtBadge,
    apply(text, file) {
      return applyNtBadge(text);
    },
  },
  {
    id: "nt-label",
    rewrite: "marker",
    scan: scanNtLabel,
    apply(text, file) {
      return applyNtLabel(text);
    },
  },
  {
    id: "nt-open",
    rewrite: "marker",
    scan: scanNtOpen,
    apply(text, file) {
      return applyNtOpen(text);
    },
  },
  {
    id: "nt-content",
    rewrite: "marker",
    scan: scanNtContent,
    apply(text, file) {
      return applyNtContent(text);
    },
  },
  {
    id: "nt-dup",
    rewrite: "marker",
    scan: scanDuplicateNotification,
    apply(text, file) {
      return applyDuplicateNotification(text);
    },
  },
  {
    id: "nt-mimic",
    rewrite: "marker",
    scan: scanFakeBadge,
    apply(text, file) {
      return applyFakeBadge(text);
    },
  },
];
