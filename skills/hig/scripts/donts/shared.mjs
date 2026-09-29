/** Helpers shared by more than one Don't surface. */

import { DETECTORS } from "../../knowledge/chrome/detectors.mjs";

export function hit(file, evidence) {
  return { file, evidence: String(evidence).replace(/\s+/g, " ").trim().slice(0, 180) };
}

export function blocksWithAttr(text, attr) {
  const out = [];
  const openRe = new RegExp(`<([A-Za-z][\\w]*)\\b[^>]*\\b${attr}\\b[^>]*>`, "g");
  let m;
  while ((m = openRe.exec(text))) {
    const tag = m[1];
    let i = m.index + m[0].length;
    let depth = 1;
    const reopen = new RegExp(`<${tag}\\b`, "gi");
    const close = new RegExp(`</${tag}\\s*>`, "gi");
    while (depth > 0 && i < text.length) {
      reopen.lastIndex = i;
      close.lastIndex = i;
      const nOpen = reopen.exec(text);
      const nClose = close.exec(text);
      if (!nClose) {
        i = Math.min(text.length, m.index + 4000);
        break;
      }
      if (nOpen && nOpen.index < nClose.index) {
        depth += 1;
        i = nOpen.index + nOpen[0].length;
      } else {
        depth -= 1;
        i = nClose.index + nClose[0].length;
      }
    }
    out.push({ start: m.index, end: i, text: text.slice(m.index, i) });
  }
  return out;
}

export function colorOnlyRule(text) {
  return (
    /\.error[^{]{0,60}\{[^}]*\bcolor\s*:[^}]*\}/i.test(text) &&
    !/\.error[^{]{0,60}\{[^}]*(border|outline|background|box-shadow|content)\s*:/i.test(text)
  ) || (
    /\[(?:aria-selected|aria-current)\][^{]{0,40}\{[^}]*\bcolor\s*:[^}]*\}/i.test(text) &&
    !/\[(?:aria-selected|aria-current)\][^{]{0,40}\{[^}]*(border|font-weight|background|text-decoration)\s*:/i.test(
      text,
    )
  );
}

export function scanColorOnly(files) {
  const out = [];
  for (const f of files) {
    if (colorOnlyRule(f.text)) out.push(hit(f.path, "error/selected conveyed by color only"));
  }
  return out;
}

export function applyColorOnly(text) {
  let next = text.replace(
    /(\.error[^{]{0,60}\{)([^}]*)(\})/gi,
    (all, open, body, close) => {
      if (/border\s*:/.test(body)) return all;
      return `${open}${body} border: 1px solid currentColor;${close}`;
    },
  );
  next = next.replace(
    /(\[(?:aria-selected|aria-current)\][^{]{0,40}\{)([^}]*)(\})/gi,
    (all, open, body, close) => {
      if (/font-weight\s*:/.test(body)) return all;
      return `${open}${body} font-weight: 600;${close}`;
    },
  );
  return next;
}

export const SYSTEM_JOB =
  /sign\s*in\s*with\s*apple|apple\s*pay|would like to access your|allow .{0,80}to (access|use) your (camera|mic(?:rophone)?|location|photos)/i;

export const SYSTEM_EXTRA =
  /\b(unlock|magic|exclusive|delight|sprinkle|continue to enjoy|don't miss|we need you to)\b/i;

export function innerText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function dialogRegions(text) {
  const out = [];
  const tagRe = /<(dialog)\b([^>]*)>([\s\S]*?)<\/dialog>/gi;
  let m;
  while ((m = tagRe.exec(text))) out.push(m[0]);
  const roleRe =
    /<([A-Za-z][\w]*)\b([^>]*role=["'](?:dialog|alertdialog)["'][^>]*)>([\s\S]*?)<\/\1>/gi;
  while ((m = roleRe.exec(text))) out.push(m[0]);
  return out;
}

export function scanRewriteSystemAlerts(files) {
  const out = [];
  for (const f of files) {
    if (
      /<(button|a|span)\b[^>]*>\s*((?:Continue|Log in|Unlock|Join) with (?:your )?Apple(?: ID)?|Pay With Apple Pay Now!?)\s*</i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "rewritten Sign in/Pay control label"));
    }
    for (const region of dialogRegions(f.text)) {
      const copy = innerText(region);
      if (!SYSTEM_JOB.test(copy)) continue;
      const leftover = copy
        .replace(/sign\s*in\s*with\s*apple/gi, "")
        .replace(/apple\s*pay/gi, "")
        .replace(/\b(cancel|continue|ok|allow|don'?t allow|pay)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
      if (leftover.length > 24 || SYSTEM_EXTRA.test(copy)) {
        out.push(hit(f.path, "rewritten system Sign in/Pay/permission alert"));
      }
    }
  }
  return out;
}

export function isMarketingFile(file) {
  return (
    /data-marketing|data-register=["']brand["']/i.test(file.text) ||
    /(^|\/)(Landing|Marketing|Hero)(Page|View|Screen)?\.(tsx|jsx|html|vue|swift)$/i.test(
      file.path,
    )
  );
}

export function scanOpaqueBrandBars(files) {
  return DETECTORS["chrome.bars.system-materials"](files);
}

export function applyOpaqueBrandBars(text) {
  let next = text.replace(
    /((?:^|,|\n)\s*(?:header|nav|\.tab-bar|\.toolbar|\.sidebar)[^{]*)\{([^}]*)\}/gi,
    (all, sel, body) => {
      const stripped = body.replace(/background(?:-color)?\s*:\s*#[0-9a-fA-F]{3,8}\s*;?/gi, "");
      return stripped === body ? all : `${sel}{${stripped}}`;
    },
  );
  next = next.replace(
    /(<(header|nav)\b[^>]*style=\{\{)([^}]*)(\}\})/gi,
    (all, open, _tag, body, close) => {
      const stripped = body.replace(
        /background(?:Color)?\s*:\s*["']#[0-9a-fA-F]{3,8}["']\s*,?/gi,
        "",
      );
      return stripped === body ? all : `${open}${stripped}${close}`;
    },
  );
  next = next.replace(
    /(<(header|nav)\b[^>]*style=["'])([^"']*)(["'])/gi,
    (all, open, _tag, body, close) => {
      const stripped = body.replace(/background(?:-color)?\s*:\s*#[0-9a-fA-F]{3,8}\s*;?/gi, "");
      return stripped === body ? all : `${open}${stripped}${close}`;
    },
  );
  next = next.replace(
    /^[^\n]*(UINavigationBar|UITabBar|UIToolbar)[^\n]*(barTintColor|backgroundColor)[^\n]*\n?/gm,
    "",
  );
  next = next.replace(
    /((?:^|,|\n)\s*(?:header|nav|\.tab-bar|\.toolbar|\.sidebar)[^{]*)\{\s*\}/gi,
    "",
  );
  return next;
}

export function toolbarRegions(text) {
  const out = [];
  const re =
    /<([A-Za-z][\w]*)\b([^>]*(?:role=["']toolbar["']|data-nav|data-toolbar)[^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) out.push(m[0]);
  for (const block of text.match(/<(header|nav)\b[\s\S]*?<\/\1>/gi) || []) {
    if (!out.includes(block)) out.push(block);
  }
  return out;
}

export function scanBrandOutlinedSymbols(files) {
  const out = [];
  for (const f of files) {
    if (
      /replace(?:ing)? SF Symbols|outlined (?:icon )?set for brand|sfSymbolsToBrand/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "SF Symbols rewritten into a brand outline set"));
    }
    for (const region of toolbarRegions(f.text)) {
      const system = /\b(systemName|Image\(systemName|UIImage\(systemName:)/.test(region);
      const outlined =
        /fill=["']none["'][^>]*(stroke|strokeWidth)|from ["']lucide-react["']|@heroicons|data-brand-icon/.test(
          region,
        );
      if (system && outlined) {
        out.push(hit(f.path, "custom outlined doodles next to system symbols"));
      }
    }
  }
  return out;
}

export function emptyStateRegions(text) {
  const out = [];
  const re =
    /<([A-Za-z][\w]*)\b([^>]*(?:data-empty|class(?:Name)?=["'][^"']*\bempty-state\b)[^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}

export function countSubmitButtons(text) {
  return [...text.matchAll(/<button\b([^>]*)>/gi)].filter((m) => {
    const attrs = m[1];
    if (/\btype=["']button["']/i.test(attrs) || /\btype=["']reset["']/i.test(attrs)) {
      return false;
    }
    return /\btype=["']submit["']/i.test(attrs) || !/\btype=/.test(attrs);
  }).length;
}

export function applyEqualWeightSubmits(text) {
  if (!/data-form-page|<form\b/.test(text)) return text;
  let seen = false;
  return text.replace(/<button\b([^>]*)>/gi, (all, attrs) => {
    if (/\btype=["']button["']/i.test(attrs) || /\btype=["']reset["']/i.test(attrs)) {
      return all;
    }
    const isSubmit = /\btype=["']submit["']/i.test(attrs) || !/\btype=/.test(attrs);
    if (!isSubmit) return all;
    if (!seen) {
      seen = true;
      return all;
    }
    if (/\btype=["']submit["']/i.test(attrs)) {
      return all.replace(/\btype=["']submit["']/i, 'type="button"');
    }
    return `<button type="button"${attrs}>`;
  });
}

export function openingTags(text) {
  const out = [];
  const re = /<([A-Za-z][\w]*)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(text))) out.push({ tag: m[1], attrs: m[2] });
  return out;
}

export function matchingBrace(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function stripAttrBlocks(text, attr) {
  let next = text;
  for (const b of [...blocksWithAttr(text, attr)].sort((a, c) => c.start - a.start)) {
    next = next.slice(0, b.start) + next.slice(b.end);
  }
  next = next.replace(new RegExp(`\\s*${attr}(?:="[^"]*")?`, "g"), "");
  return next;
}

export function hasPageControlWidget(text) {
  return (
    /data-page-control/.test(text) ||
    /data-carousel-dots/.test(text) ||
    /\bUIPageControl\b/.test(text) ||
    /\bPageControl\s*[\({]/.test(text) ||
    /PageTabViewStyle/.test(text) ||
    /\.tabViewStyle\(\s*\.page/.test(text)
  );
}

export function hasNotificationChrome(text) {
  return (
    /Notification\.requestPermission/.test(text) ||
    /Notification\.permission/.test(text) ||
    /new\s+Notification\s*\(/.test(text) ||
    /\bUNUserNotificationCenter\b/.test(text) ||
    /\bUNNotificationRequest\b/.test(text)
  );
}

export function notificationTitles(text) {
  const titles = [];
  const web = /new\s+Notification\s*\(\s*(["'])([^"']+)\1/g;
  let m;
  while ((m = web.exec(text))) {
    const title = m[2].trim();
    if (title) titles.push(title);
  }
  const content = /\bUNMutableNotificationContent\b/g;
  while ((m = content.exec(text))) {
    const window = text.slice(m.index, m.index + 400);
    const titled = window.match(/\.title\s*=\s*(["'])([^"']+)\1/);
    if (titled && titled[2].trim()) titles.push(titled[2].trim());
  }
  return titles;
}

export function hasDuplicateNotificationTitle(text) {
  const seen = new Set();
  for (const title of notificationTitles(text)) {
    if (seen.has(title)) return true;
    seen.add(title);
  }
  return false;
}

export function hasAppWindow(text) {
  return (
    /\bdata-window\b/.test(text) ||
    /\bdata-app-window\b/.test(text) ||
    /\bNSWindow\b/.test(text) ||
    /\bNSWindowController\b/.test(text) ||
    /\bopenWindow\s*\(/.test(text)
  );
}

export function hasGameCenter(text) {
  return /\bdata-game-center\b/.test(text) || /\bGKAccessPoint\b/.test(text);
}

export function elementsWithRole(text, role) {
  const out = [];
  const openRe = new RegExp(
    `<([A-Za-z][\\w]*)\\b[^>]*\\brole=["']${role}["'][^>]*>`,
    "gi",
  );
  let m;
  while ((m = openRe.exec(text))) {
    const tag = m[1];
    let i = m.index + m[0].length;
    let depth = 1;
    const reopen = new RegExp(`<${tag}\\b`, "gi");
    const close = new RegExp(`</${tag}\\s*>`, "gi");
    while (depth > 0 && i < text.length) {
      reopen.lastIndex = i;
      close.lastIndex = i;
      const nOpen = reopen.exec(text);
      const nClose = close.exec(text);
      if (!nClose) {
        i = text.length;
        break;
      }
      if (nOpen && nOpen.index < nClose.index) {
        depth += 1;
        i = nOpen.index + nOpen[0].length;
      } else {
        depth -= 1;
        i = nClose.index + nClose[0].length;
      }
    }
    out.push(text.slice(m.index, i));
  }
  return out;
}
