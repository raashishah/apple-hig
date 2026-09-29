import { hit, blocksWithAttr, isMarketingFile, openingTags, matchingBrace, hasAppWindow, elementsWithRole } from "./shared.mjs";

function hasTabShell(text) {
  return /data-tab-bar|role=["']tablist["']|UITabBar|\bTabView\s*\(/.test(text);
}

function isTabViewFile(text) {
  return (
    /\bdata-tab-view\b/.test(text) ||
    /\bNSTabView\b/.test(text) ||
    (/role=["']tablist["']/i.test(text) && /role=["']tabpanel["']/i.test(text))
  );
}

function hasTabBar(text) {
  if (isTabViewFile(text)) return false;
  return /data-tab-bar|role=["']tablist["']|\bUITabBar\b|\bTabView\s*[({\[]/.test(text);
}

function hasTabDisabledCopy(text) {
  return (
    /don['’]?t disable or hide tab bar buttons/i.test(text) ||
    /disable or hide tab bar buttons/i.test(text) ||
    /disabled or hidden tab bar button/i.test(text)
  );
}

function tagDisablesTab(attrs) {
  if (/\saria-disabled=["']true["']/i.test(attrs)) return true;
  if (/\saria-hidden=["']true["']/i.test(attrs)) return true;
  if (/(?:^|\s)hidden(?=$|[\s=/>])/.test(attrs)) return true;
  if (/(?:^|\s)disabled(?=$|[\s=/>])/.test(attrs)) {
    if (/disabled\s*=\s*["'{]\s*false/i.test(attrs)) return false;
    return true;
  }
  return false;
}

function tabBarRegions(text) {
  const out = [];
  const re = /<(nav|div|ul|header)\b[^>]*(?:data-tab-bar|role=["']tablist["'])[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}

function hasSwiftDisabledTab(text) {
  if (/\bUITabBarItem\b/.test(text)) {
    if (
      /UITabBarItem[\s\S]{0,240}isEnabled\s*=\s*false|isEnabled\s*=\s*false[\s\S]{0,240}UITabBarItem/.test(
        text,
      )
    ) {
      return true;
    }
  }
  if (!/\bTabView\s*[({\[]/.test(text)) return false;
  return (
    /\.tabItem\s*[({\[][\s\S]{0,240}\.disabled\s*\(\s*true\s*\)/.test(text) ||
    /\.disabled\s*\(\s*true\s*\)[\s\S]{0,240}\.tabItem\s*[({\[]/.test(text) ||
    /Tab\([^)]*\)\s*\.disabled\s*\(\s*true\s*\)/.test(text)
  );
}

function hasDisabledTab(text) {
  if (isTabViewFile(text)) return false;
  if (
    openingTags(text).some((t) => /role=["']tab["']/i.test(t.attrs) && tagDisablesTab(t.attrs))
  ) {
    return true;
  }
  for (const region of tabBarRegions(text)) {
    if (
      openingTags(region).some((t) => /^(button|a)$/i.test(t.tag) && tagDisablesTab(t.attrs))
    ) {
      return true;
    }
  }
  return hasSwiftDisabledTab(text);
}

function scanTabDisabled(files) {
  const out = [];
  for (const f of files) {
    if (/data-tb-off\b/.test(f.text)) {
      out.push(hit(f.path, "a disabled or hidden tab bar button"));
      continue;
    }
    if (!hasTabBar(f.text)) continue;
    if (hasTabDisabledCopy(f.text) || hasDisabledTab(f.text)) {
      out.push(hit(f.path, "a disabled or hidden tab bar button"));
    }
  }
  return out;
}

function applyTabDisabled(text) {
  return text.replace(/\s*data-tb-off(?:="[^"]*")?(?![\w-])/g, "");
}

function hasTabSaleCopy(text) {
  return (
    /reserve badges for critical information/i.test(text) ||
    /marketing word on a tab bar badge/i.test(text)
  );
}

function hasMarketingTabBadge(text) {
  if (!hasTabBar(text)) return false;
  const regions = tabBarRegions(text);
  const blob = regions.length ? regions.join("\n") : text;
  return /<(?:span|sup|small|em)\b[^>]*(?:class(?:Name)?=["'][^"']*\bbadge\b|data-badge\b)[^>]*>\s*(?:Sale|Promo|Offer|Deal)\s*</i.test(
    blob,
  );
}

function scanTabSale(files) {
  const out = [];
  for (const f of files) {
    if (/data-tb-sale(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a marketing word on a tab bar badge"));
      continue;
    }
    if (!hasTabBar(f.text)) continue;
    if (hasTabSaleCopy(f.text) || hasMarketingTabBadge(f.text)) {
      out.push(hit(f.path, "a marketing word on a tab bar badge"));
    }
  }
  return out;
}

function applyTabSale(text) {
  return text.replace(/\s*data-tb-sale(?:="[^"]*")?(?![\w-])/g, "");
}

function scanMarketingTabShell(files) {
  const out = [];
  for (const f of files) {
    if (!isMarketingFile(f)) continue;
    if (hasTabShell(f.text)) {
      out.push(hit(f.path, "marketing landing tab shell"));
    }
  }
  return out;
}

function applyMarketingTabShell(text, file) {
  if (!isMarketingFile(file) || !hasTabShell(text)) return text;
  let next = text.replace(
    /<(nav|div|footer)\b[^>]*(?:data-tab-bar|role=["']tablist["'])[^>]*>[\s\S]*?<\/\1>\s*/gi,
    "",
  );
  next = next.replace(/\s*data-tab-bar(?:="[^"]*")?/g, "");
  next = next.replace(/\s*role=["']tablist["']/g, "");
  return next;
}

function sidebarRegions(text) {
  const regions = blocksWithAttr(text, "data-sidebar").map((block) => block.text);
  const re = /\bNavigationSplitView\b/g;
  let m;
  while ((m = re.exec(text))) {
    const brace = text.indexOf("{", m.index);
    if (brace < 0 || brace - m.index > 160) continue;
    const close = matchingBrace(text, brace);
    if (close < 0) continue;
    regions.push(text.slice(brace + 1, close));
  }
  return regions;
}

function nestedListDepth(html) {
  let depth = 0;
  let max = 0;
  const re = /<\/?(ul|ol)\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (m[0][1] === "/") depth = Math.max(0, depth - 1);
    else {
      depth += 1;
      if (depth > max) max = depth;
    }
  }
  return max;
}

function groupDepth(body) {
  let max = 0;
  function walk(slice, depth) {
    const re = /\b(?:Section|DisclosureGroup)\s*\(/g;
    let m;
    while ((m = re.exec(slice))) {
      const next = depth + 1;
      if (next > max) max = next;
      const brace = slice.indexOf("{", m.index);
      if (brace < 0) continue;
      const close = matchingBrace(slice, brace);
      if (close < 0) continue;
      walk(slice.slice(brace + 1, close), next);
      re.lastIndex = close + 1;
    }
  }
  walk(body, 0);
  return max;
}

function sidebarTooDeep(text) {
  return sidebarRegions(text).some((region) => nestedListDepth(region) >= 3 || groupDepth(region) >= 3);
}

function hasSidebarWidget(text) {
  return /\bdata-sidebar\b/.test(text) || /\bNavigationSplitView\b/.test(text);
}

function hasSidebarDepthCopy(text) {
  return (
    /no more than two levels/i.test(text) ||
    /third level of hierarchy in a sidebar/i.test(text)
  );
}

function scanSidebarDepth(files) {
  const out = [];
  for (const f of files) {
    if (/data-sb-depth(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a third level of hierarchy in a sidebar"));
      continue;
    }
    if (sidebarTooDeep(f.text) || (hasSidebarWidget(f.text) && hasSidebarDepthCopy(f.text))) {
      out.push(hit(f.path, "a third level of hierarchy in a sidebar"));
    }
  }
  return out;
}

function applySidebarDepth(text) {
  return text.replace(/\s*data-sb-depth(?:="[^"]*")?(?![\w-])/g, "");
}

function sidebarControlLabel(chunk) {
  const open = chunk.match(/^<[^>]*>/);
  const tag = open ? open[0] : "";
  const aria = tag.match(/\baria-label=["']([^"']+)["']/i);
  if (aria) return aria[1].trim();
  return chunk.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function labelIsCriticalAction(label) {
  return /^(delete|pay|purchase|erase|buy)$/i.test(label);
}

function sidebarHasCriticalBottom(text) {
  const re = /<(button|a)\b[^>]*>[\s\S]*?<\/\1>/gi;
  for (const region of sidebarRegions(text)) {
    const controls = [];
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(region))) controls.push(m[0]);
    if (!controls.length) continue;
    if (labelIsCriticalAction(sidebarControlLabel(controls[controls.length - 1]))) return true;
  }
  return false;
}

function hasSidebarBottomCopy(text) {
  return /critical (?:information or )?actions? at the bottom of a sidebar/i.test(text);
}

function scanSidebarBottomAction(files) {
  const out = [];
  for (const f of files) {
    if (/data-sb-end(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a critical action at the bottom of a sidebar"));
      continue;
    }
    if (sidebarHasCriticalBottom(f.text) || (hasSidebarWidget(f.text) && hasSidebarBottomCopy(f.text))) {
      out.push(hit(f.path, "a critical action at the bottom of a sidebar"));
    }
  }
  return out;
}

function applySidebarBottomAction(text) {
  return text.replace(/\s*data-sb-end(?:="[^"]*")?(?![\w-])/g, "");
}

function hasNamedAppWindow(text) {
  return hasAppWindow(text) || /\bWindow\s*\(/.test(text);
}

function declaredAppNames(text) {
  const names = new Set();
  const add = (raw) => {
    const name = String(raw || "").trim();
    if (name) names.add(name);
  };
  const plist = /<key>\s*CFBundle(?:Display)?Name\s*<\/key>\s*<string>([^<]+)<\/string>/gi;
  let m;
  while ((m = plist.exec(text))) add(m[1]);
  const product = /PRODUCT_NAME\s*=\s*"([^"]+)"/g;
  while ((m = product.exec(text))) add(m[1]);
  const attr = /data-app-name\s*=\s*"([^"]+)"/gi;
  while ((m = attr.exec(text))) add(m[1]);
  return names;
}

function windowTitles(text) {
  if (!hasNamedAppWindow(text)) return [];
  const titles = [];
  const add = (raw) => {
    const name = String(raw || "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (name) titles.push(name);
  };
  const win = /\bWindow\s*\(\s*"([^"]+)"/g;
  let m;
  while ((m = win.exec(text))) add(m[1]);
  const ns = /\bNSWindow(?:Controller)?\b/g;
  while ((m = ns.exec(text))) {
    const titled = text.slice(m.index, m.index + 500).match(/\btitle\s*[:=]\s*"([^"]+)"/);
    if (titled) add(titled[1]);
  }
  for (const attr of ["data-window", "data-app-window"]) {
    for (const block of blocksWithAttr(text, attr)) {
      const titled = block.text.match(/\bdata-wn-title\s*=\s*"([^"]+)"/i);
      if (titled) add(titled[1]);
      const heading = block.text.match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i);
      if (heading) add(heading[1]);
    }
  }
  return titles;
}

function windowTitleIsAppName(text) {
  const names = declaredAppNames(text);
  if (!names.size) return false;
  return windowTitles(text).some((title) => names.has(title));
}

function hasWindowAppTitleCopy(text) {
  return (
    /don['’]?t title windows with your app name/i.test(text) ||
    /window titled with the app name/i.test(text)
  );
}

function scanWindowAppTitle(files) {
  const out = [];
  for (const f of files) {
    if (/data-wn-app(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a window titled with the app name"));
      continue;
    }
    if (windowTitleIsAppName(f.text) || (hasNamedAppWindow(f.text) && hasWindowAppTitleCopy(f.text))) {
      out.push(hit(f.path, "a window titled with the app name"));
    }
  }
  return out;
}

function applyWindowAppTitle(text) {
  return text.replace(/\s*data-wn-app(?:="[^"]*")?(?![\w-])/g, "");
}

function hasToolbarWidget(text) {
  return (
    /role=["']toolbar["']/i.test(text) ||
    /\.toolbar\s*\{/.test(text) ||
    /\bUIToolbar\b/.test(text) ||
    /\bNSToolbar\b/.test(text) ||
    /\bToolbarItem\b/.test(text)
  );
}

function toolbarControlHasName(attrs, inner) {
  if (/aria-label\s*=\s*(?:["'][^"']*\S[^"']*["']|\{[^}]*\S[^}]*\})/i.test(attrs)) return true;
  if (/aria-labelledby\s*=\s*["'][^"']+["']/i.test(attrs)) return true;
  if (/\btitle\s*=\s*["'][^"']*\S[^"']*["']/i.test(attrs)) return true;
  const visible = inner
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return visible.length > 0;
}

function webToolbarHasUnnamedItem(text) {
  for (const region of elementsWithRole(text, "toolbar")) {
    const re = /<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let m;
    while ((m = re.exec(region))) {
      if (!toolbarControlHasName(m[2], m[3])) return true;
    }
  }
  return false;
}

function swiftToolbarHasUnnamedItem(text) {
  const re = /\.toolbar\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].lastIndexOf("{");
    const close = matchingBrace(text, open);
    if (close < 0) continue;
    const body = text.slice(open, close + 1);
    const buttons = /\bButton\s*(\([^)]*\))?\s*\{/g;
    let b;
    while ((b = buttons.exec(body))) {
      const args = b[1] || "";
      const titled = /["'][^"']*\S[^"']*["']/.test(args);
      const bOpen = b.index + b[0].lastIndexOf("{");
      const bClose = matchingBrace(body, bOpen);
      const inner = bClose > bOpen ? body.slice(bOpen, bClose + 1) : "";
      const after = body.slice(Math.max(bClose, b.index), Math.min(body.length, b.index + 500));
      const labeled = /accessibilityLabel\s*\(\s*"[^"]*\S[^"]*"/.test(after);
      if (!titled && !labeled && /\bImage\s*\(/.test(inner)) return true;
    }
  }
  return false;
}

function hasToolbarUnnamedCopy(text) {
  return (
    /don['’]?t make people guess/i.test(text) ||
    /toolbar item with no visible text and no accessible name/i.test(text)
  );
}

function scanToolbarUnnamed(files) {
  const out = [];
  for (const f of files) {
    if (/data-tb-name(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a toolbar item with no visible text and no accessible name"));
      continue;
    }
    if (
      webToolbarHasUnnamedItem(f.text) ||
      swiftToolbarHasUnnamedItem(f.text) ||
      (hasToolbarWidget(f.text) && hasToolbarUnnamedCopy(f.text))
    ) {
      out.push(hit(f.path, "a toolbar item with no visible text and no accessible name"));
    }
  }
  return out;
}

function applyToolbarUnnamed(text) {
  return text.replace(/\s*data-tb-name(?:="[^"]*")?(?![\w-])/g, "");
}

function regionHasPullDown(region) {
  if (/role=["']menu["']/i.test(region)) return true;
  if (/\bMenu\s*\(/.test(region)) return true;
  if (/aria-haspopup=["']menu["']/i.test(region)) return true;
  return false;
}

function dataToolbarRegions(text) {
  const out = [];
  const openRe = /<([A-Za-z][\w]*)\b[^>]*\bdata-toolbar(?![\w-])[^>]*>/gi;
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

function hasPullDownInToolbar(text) {
  for (const region of elementsWithRole(text, "toolbar")) {
    if (regionHasPullDown(region)) return true;
  }
  for (const region of dataToolbarRegions(text)) {
    if (regionHasPullDown(region)) return true;
  }
  const re = /\.toolbar\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].lastIndexOf("{");
    const close = matchingBrace(text, open);
    if (close < 0) continue;
    if (regionHasPullDown(text.slice(m.index, close + 1))) return true;
  }
  return false;
}

function hasPullDownCopy(text) {
  return /pull-down menu in a toolbar/i.test(text);
}

function scanToolbarPullDown(files) {
  const out = [];
  for (const f of files) {
    if (/data-tb-pull(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a pull-down menu in a toolbar"));
      continue;
    }
    if (hasPullDownInToolbar(f.text) || (hasPullDownCopy(f.text) && hasToolbarWidget(f.text))) {
      out.push(hit(f.path, "a pull-down menu in a toolbar"));
    }
  }
  return out;
}

function applyToolbarPullDown(text) {
  return text.replace(/\s*data-tb-pull(?:="[^"]*")?(?![\w-])/g, "");
}

function regionHasManualOverflow(region) {
  if (/\boverflowMenu\s*[:=({]/.test(region)) return true;
  if (/\bOverflowMenu\s*\(/.test(region)) return true;
  if (/\bButton\s*\(\s*"Overflow"\s*\)/.test(region)) return true;
  const re = /<(button|a|span)\b([^>]*)>([^<]*)<\/\1>/gi;
  let found;
  while ((found = re.exec(region))) {
    const label = (found[2].match(/\baria-label\s*=\s*["']([^"']*)["']/i) || [])[1] || "";
    const text = found[3].replace(/\s+/g, " ").trim();
    if (text === "Overflow" || label === "Overflow") return true;
  }
  return false;
}

function hasManualOverflowInToolbar(text) {
  for (const region of elementsWithRole(text, "toolbar")) {
    if (regionHasManualOverflow(region)) return true;
  }
  for (const region of dataToolbarRegions(text)) {
    if (regionHasManualOverflow(region)) return true;
  }
  const re = /\.toolbar\s*\{/g;
  let found;
  while ((found = re.exec(text))) {
    const open = found.index + found[0].lastIndexOf("{");
    const close = matchingBrace(text, open);
    if (close < 0) continue;
    if (regionHasManualOverflow(text.slice(found.index, close + 1))) return true;
  }
  return false;
}

function scanToolbarOverflow(files) {
  const out = [];
  for (const f of files) {
    if (/data-tb-over(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an overflow menu added in a toolbar"));
      continue;
    }
    if (hasManualOverflowInToolbar(f.text)) {
      out.push(hit(f.path, "an overflow menu added in a toolbar"));
    }
  }
  return out;
}

function applyToolbarOverflow(text) {
  return text.replace(/\s*data-tb-over(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "marketing-landing-tab-shell",
    rewrite: "host",
    scan: scanMarketingTabShell,
    apply(text, file) {
      return applyMarketingTabShell(text, file);
    },
  },
  {
    id: "tb-off",
    rewrite: "marker",
    scan: scanTabDisabled,
    apply(text, file) {
      return applyTabDisabled(text);
    },
  },
  {
    id: "tb-sale",
    rewrite: "marker",
    scan: scanTabSale,
    apply(text, file) {
      return applyTabSale(text);
    },
  },
  {
    id: "sb-depth",
    rewrite: "marker",
    scan: scanSidebarDepth,
    apply(text, file) {
      return applySidebarDepth(text);
    },
  },
  {
    id: "sb-end",
    rewrite: "marker",
    scan: scanSidebarBottomAction,
    apply(text, file) {
      return applySidebarBottomAction(text);
    },
  },
  {
    id: "wn-app",
    rewrite: "marker",
    scan: scanWindowAppTitle,
    apply(text, file) {
      return applyWindowAppTitle(text);
    },
  },
  {
    id: "tb-name",
    rewrite: "marker",
    scan: scanToolbarUnnamed,
    apply(text, file) {
      return applyToolbarUnnamed(text);
    },
  },
  {
    id: "tb-pull",
    rewrite: "marker",
    scan: scanToolbarPullDown,
    apply(text, file) {
      return applyToolbarPullDown(text);
    },
  },
  {
    id: "tb-over",
    rewrite: "marker",
    scan: scanToolbarOverflow,
    apply(text, file) {
      return applyToolbarOverflow(text);
    },
  },
];
