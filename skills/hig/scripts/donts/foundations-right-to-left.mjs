import { hit, openingTags } from "./shared.mjs";

const WINDOW_SEL = /\b(html|body|:root|#root|#__next|#app)\b/i;

function cssRules(text) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) {
    out.push({ sel: m[1], body: m[2] });
  }
  return out;
}

function scanScaleXWholeWindow(files) {
  const out = [];
  for (const f of files) {
    let found = false;
    for (const r of cssRules(f.text)) {
      if (WINDOW_SEL.test(r.sel) && /scaleX\(\s*-1\s*\)/i.test(r.body)) {
        found = true;
        break;
      }
    }
    if (
      /<(html|body)\b[^>]*(style=["'][^"']*scaleX\(\s*-1|\bdata-rtl-mirror\b)/i.test(f.text) ||
      /document\.(documentElement|body)\.style\.transform[\s\S]{0,80}scaleX\(\s*-1/i.test(
        f.text,
      )
    ) {
      found = true;
    }
    if (found) out.push(hit(f.path, "scaleX(-1) on the whole window"));
  }
  return out;
}

function applyScaleXWholeWindow(text) {
  let next = text.replace(/([^{}]+)\{([^{}]*)\}/g, (all, sel, body) => {
    if (!WINDOW_SEL.test(sel) || !/scaleX\(\s*-1\s*\)/i.test(body)) return all;
    const cleaned = body
      .replace(/transform\s*:\s*scaleX\(\s*-1\s*\)\s*;?/gi, "")
      .replace(/scaleX\(\s*-1\s*\)/gi, "none");
    return `${sel}{${cleaned}}`;
  });
  next = next.replace(
    /(<html\b[^>]*|<(body)\b[^>]*)\sstyle=(["'])([^"']*)\3/gi,
    (all, open, _body, q, style) => {
      if (!/scaleX\(\s*-1\s*\)/i.test(style)) return all;
      const cleaned = style
        .replace(/transform\s*:\s*scaleX\(\s*-1\s*\)\s*;?/gi, "")
        .replace(/scaleX\(\s*-1\s*\)/gi, "none");
      if (!cleaned.trim()) return `${open}`;
      return `${open} style=${q}${cleaned}${q}`;
    },
  );
  next = next.replace(/\s*data-rtl-mirror(?:="[^"]*")?/g, "");
  next = next.replace(
    /(document\.(documentElement|body)\.style\.transform\s*=\s*["'])scaleX\(\s*-1\s*\)(["'])/gi,
    "$1none$3",
  );
  return next;
}

function scanPhysicalMarginPadding(files) {
  const out = [];
  for (const f of files) {
    if (
      /margin-left\s*:/i.test(f.text) ||
      /padding-right\s*:/i.test(f.text) ||
      /marginLeft\s*:/.test(f.text) ||
      /paddingRight\s*:/.test(f.text)
    ) {
      out.push(hit(f.path, "hard-coded margin-left / padding-right"));
    }
  }
  return out;
}

function applyPhysicalMarginPadding(text) {
  return text
    .replace(/margin-left\s*:/gi, "margin-inline-start:")
    .replace(/padding-right\s*:/gi, "padding-inline-end:")
    .replace(/marginLeft\s*:/g, "marginInlineStart:")
    .replace(/paddingRight\s*:/g, "paddingInlineEnd:");
}

function isBackChrome(text) {
  return (
    /aria-label=["']Back["']/i.test(text) ||
    /\bdata-nav-back\b/.test(text) ||
    /class(?:Name)?=["'][^"']*\b(nav-back|back-button|back-chevron)\b/.test(text) ||
    /\b(BackButton|navigationBarBackIndicator)\b/.test(text) ||
    (/["']Back["']/.test(text) && /chevron\.left|chevron-left|←|&larr;|&#8592;/.test(text))
  );
}

function hasLeftBackChevron(text) {
  return /chevron-left|chevron\.left|←|&larr;|&#8592;|\\u2190/.test(text);
}

function scanBackChevronAlwaysLeft(files) {
  const out = [];
  for (const f of files) {
    if (isBackChrome(f.text) && hasLeftBackChevron(f.text)) {
      out.push(hit(f.path, "back chevron always points left"));
    }
  }
  return out;
}

function applyBackChevronAlwaysLeft(text) {
  if (!isBackChrome(text)) return text;
  return text
    .replace(/chevron-left/g, "chevron-start")
    .replace(/chevron\.left/g, "chevron.backward");
}

function isLocaleRoot(tag, attrs) {
  const t = String(tag).toLowerCase();
  if (t === "html" || t === "body") return true;
  if (/\bid=["'](root|__next|app|locale-root)["']/i.test(attrs)) return true;
  if (/\bdata-locale-root\b/i.test(attrs)) return true;
  return false;
}

function hasDirAuto(attrs) {
  return /\bdir\s*=\s*(["']auto["']|\{\s*["']auto["']\s*\})/i.test(attrs);
}

function scanDirAutoOnLocaleRoot(files) {
  const out = [];
  for (const f of files) {
    const tagged = openingTags(f.text).some(
      (t) => isLocaleRoot(t.tag, t.attrs) && hasDirAuto(t.attrs),
    );
    const script =
      /document\.(documentElement|body)\.dir\s*=\s*["']auto["']/i.test(f.text) ||
      /document\.(documentElement|body)\.setAttribute\(\s*["']dir["']\s*,\s*["']auto["']/i.test(
        f.text,
      );
    if (tagged || script) out.push(hit(f.path, 'dir="auto" on html or locale root'));
  }
  return out;
}

function applyDirAutoOnLocaleRoot(text) {
  let next = text.replace(/<([A-Za-z][\w]*)\b([^>]*)>/g, (all, tag, attrs) => {
    if (!isLocaleRoot(tag, attrs) || !hasDirAuto(attrs)) return all;
    const nextAttrs = attrs
      .replace(/\bdir\s*=\s*["']auto["']/i, 'dir="ltr"')
      .replace(/\bdir\s*=\s*\{\s*["']auto["']\s*\}/i, 'dir="ltr"');
    return `<${tag}${nextAttrs}>`;
  });
  next = next.replace(
    /(document\.(documentElement|body)\.dir\s*=\s*["'])auto(["'])/gi,
    "$1ltr$3",
  );
  next = next.replace(
    /(document\.(documentElement|body)\.setAttribute\(\s*["']dir["']\s*,\s*["'])auto(["'])/gi,
    "$1ltr$3",
  );
  return next;
}

export const records = [
  {
    id: "scalex-whole-window",
    rewrite: "host",
    scan: scanScaleXWholeWindow,
    apply(text, file) {
      return applyScaleXWholeWindow(text);
    },
  },
  {
    id: "physical-margin-padding",
    rewrite: "host",
    scan: scanPhysicalMarginPadding,
    apply(text, file) {
      return applyPhysicalMarginPadding(text);
    },
  },
  {
    id: "back-chevron-always-left",
    rewrite: "host",
    scan: scanBackChevronAlwaysLeft,
    apply(text, file) {
      return applyBackChevronAlwaysLeft(text);
    },
  },
  {
    id: "dir-auto-on-locale-root",
    rewrite: "host",
    scan: scanDirAutoOnLocaleRoot,
    apply(text, file) {
      return applyDirAutoOnLocaleRoot(text);
    },
  },
];
