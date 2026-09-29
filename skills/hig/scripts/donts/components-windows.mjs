import { hit, blocksWithAttr, hasAppWindow } from "./shared.mjs";

function hasOpaqueTitleBarCopy(text) {
  return /opaque custom title bars/i.test(text);
}

function opaqueFill(chunk) {
  return (
    /background(?:-color)?\s*:\s*["']?#(?:fff|ffffff|000|000000)\b/i.test(chunk) ||
    /background(?:-color)?\s*:\s*["']?(?:white|black)\b/i.test(chunk) ||
    /backgroundColor\s*[:=]\s*["']?(?:#(?:fff|ffffff|000|000000)|white|black)\b/i.test(chunk) ||
    /\bNSColor\.(?:white|black)\b/.test(chunk)
  );
}

function opaqueTitleBarChunks(text) {
  const chunks = [];
  const tagRe = /<(header|div|nav)\b[^>]*\b(?:title-bar|titlebar|data-title-bar)\b[^>]*>/gi;
  let m;
  while ((m = tagRe.exec(text))) chunks.push(m[0]);
  const cssRe = /\.(?:title-bar|titlebar)\b[^{]*\{[^}]*\}/gi;
  while ((m = cssRe.exec(text))) chunks.push(m[0]);
  const swiftRe = /\bNSTitlebarAccessoryViewController\b[\s\S]{0,500}/g;
  while ((m = swiftRe.exec(text))) chunks.push(m[0]);
  return chunks;
}

function scanOpaqueTitleBar(files) {
  const out = [];
  for (const f of files) {
    if (/data-wn-opaque(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an opaque custom title bar"));
      continue;
    }
    if (!hasAppWindow(f.text)) continue;
    if (hasOpaqueTitleBarCopy(f.text) || opaqueTitleBarChunks(f.text).some(opaqueFill)) {
      out.push(hit(f.path, "an opaque custom title bar"));
    }
  }
  return out;
}

function applyOpaqueTitleBar(text) {
  return text.replace(/\s*data-wn-opaque(?:="[^"]*")?(?![\w-])/g, "");
}

function hasTabCanonCopy(text) {
  return /iphone tab-bar-only exclusive canon/i.test(text);
}

function hasTabCanonSignal(text) {
  return /\btab-canon\b/.test(text) || /\btabBarOnlyCanon\b/.test(text);
}

function windowHasExclusiveTabBar(text) {
  const windows = [
    ...blocksWithAttr(text, "data-window"),
    ...blocksWithAttr(text, "data-app-window"),
  ];
  for (const block of windows) {
    const hasTab = /\bdata-tab-bar\b/.test(block.text) || /\brole=["']tablist["']/.test(block.text);
    const hasSplit =
      /\bdata-sidebar\b/.test(block.text) ||
      /\bNavigationSplitView\b/.test(block.text) ||
      /\bNSSplitView\b/.test(block.text);
    if (hasTab && !hasSplit) return true;
  }
  if (!windows.length && /\bNSWindow(?:Controller)?\b/.test(text) && /\bUITabBar\b/.test(text)) {
    return !/\bNSSplitView\b/.test(text) && !/\bNavigationSplitView\b/.test(text);
  }
  return false;
}

function scanWnCanon(files) {
  const out = [];
  for (const f of files) {
    if (/data-wn-canon(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an iphone tab bar used as the exclusive window canon"));
      continue;
    }
    if (!hasAppWindow(f.text)) continue;
    if (hasTabCanonCopy(f.text) || hasTabCanonSignal(f.text) || windowHasExclusiveTabBar(f.text)) {
      out.push(hit(f.path, "an iphone tab bar used as the exclusive window canon"));
    }
  }
  return out;
}

function applyWnCanon(text) {
  return text.replace(/\s*data-wn-canon(?:="[^"]*")?(?![\w-])/g, "");
}

function scanOpenWindowAsDefault(files) {
  const out = [];
  for (const f of files) {
    if (/data-open-window-default/.test(f.text)) {
      out.push(hit(f.path, "new windows opened as default behavior"));
    }
  }
  return out;
}

function applyOpenWindowAsDefault(text) {
  return text.replace(/\s*data-open-window-default(?:="[^"]*")?/g, "");
}

function scanCustomWindowFrame(files) {
  const out = [];
  for (const f of files) {
    if (/data-custom-window-frame/.test(f.text)) {
      out.push(hit(f.path, "custom window frames or controls that replace the system window"));
    }
  }
  return out;
}

function applyCustomWindowFrame(text) {
  return text.replace(/\s*data-custom-window-frame(?:="[^"]*")?/g, "");
}

function scanCallWindowScene(files) {
  const out = [];
  for (const f of files) {
    if (/data-call-scene/.test(f.text)) {
      out.push(hit(f.path, "a window called a scene in user-facing content"));
    }
  }
  return out;
}

function applyCallWindowScene(text) {
  return text.replace(/\s*data-call-scene(?:="[^"]*")?/g, "");
}

function hasCriticalWindowBottomBar(text) {
  if (!/<footer\b/i.test(text)) return false;
  return /\b(Save|Delete|Pay|Submit)\b/.test(text);
}

function scanCriticalWindowBottomBar(files) {
  const out = [];
  for (const f of files) {
    if (/data-critical-bottom-bar/.test(f.text)) {
      out.push(hit(f.path, "critical information or actions in a window bottom bar"));
      continue;
    }
    if (!hasAppWindow(f.text)) continue;
    if (hasCriticalWindowBottomBar(f.text)) {
      out.push(hit(f.path, "critical information or actions in a window bottom bar"));
    }
  }
  return out;
}

function applyCriticalWindowBottomBar(text) {
  return text.replace(/\s*data-critical-bottom-bar(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "open-window-as-default",
    rewrite: "marker",
    scan: scanOpenWindowAsDefault,
    apply(text, file) {
      return applyOpenWindowAsDefault(text);
    },
  },
  {
    id: "custom-window-frame",
    rewrite: "marker",
    scan: scanCustomWindowFrame,
    apply(text, file) {
      return applyCustomWindowFrame(text);
    },
  },
  {
    id: "call-window-scene",
    rewrite: "marker",
    scan: scanCallWindowScene,
    apply(text, file) {
      return applyCallWindowScene(text);
    },
  },
  {
    id: "critical-window-bottom-bar",
    rewrite: "marker",
    scan: scanCriticalWindowBottomBar,
    apply(text, file) {
      return applyCriticalWindowBottomBar(text);
    },
  },
  {
    id: "wn-opaque",
    rewrite: "marker",
    scan: scanOpaqueTitleBar,
    apply(text, file) {
      return applyOpaqueTitleBar(text);
    },
  },
  {
    id: "wn-canon",
    rewrite: "marker",
    scan: scanWnCanon,
    apply(text, file) {
      return applyWnCanon(text);
    },
  },
];
