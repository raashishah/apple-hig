import { hit, blocksWithAttr, openingTags, matchingBrace } from "./shared.mjs";

function isMenuFile(text) {
  return /role=["']menu["']|role=["']menuitem|<menu\b/i.test(text);
}

function scanHiddenMenuItems(files) {
  const out = [];
  for (const f of files) {
    if (!isMenuFile(f.text)) continue;
    const hidden = openingTags(f.text).some(
      (t) =>
        /role=["']menuitem["']/i.test(t.attrs) &&
        (/\bhidden\b/i.test(t.attrs) ||
          /display:\s*["']?none/.test(t.attrs) ||
          /data-hidden-item/.test(t.attrs)),
    );
    if (hidden) out.push(hit(f.path, "hidden unavailable menu item"));
  }
  return out;
}

function applyHiddenMenuItems(text) {
  if (!isMenuFile(text)) return text;
  return text.replace(
    /(<([A-Za-z][\w]*)\b)([^>]*role=["']menuitem["'][^>]*)(\s*\/?>)/gi,
    (all, start, _tag, attrs, end) => {
      if (!/\bhidden\b/i.test(attrs) && !/display:\s*["']?none/.test(attrs) && !/data-hidden-item/.test(attrs)) {
        return all;
      }
      let next = attrs
        .replace(/\s*\bhidden\b/gi, "")
        .replace(/\s*data-hidden-item(?:="[^"]*")?/g, "")
        .replace(/display:\s*["']none["']\s*,?/g, "");
      if (!/aria-disabled=/.test(next)) next += " aria-disabled={true}";
      return `${start}${next}${end}`;
    },
  );
}

function maxMenuNest(text) {
  const stack = [];
  let max = 0;
  const re = /<\/?([A-Za-z][\w]*)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(text))) {
    const attrs = m[2];
    const close = m[0].startsWith("</");
    const self = /\/\s*$/.test(attrs);
    if (close) {
      if (stack.length) stack.pop();
      continue;
    }
    const isMenu = /role=["']menu["']/i.test(attrs);
    const menuDepth = stack.filter(Boolean).length + (isMenu ? 1 : 0);
    if (isMenu && menuDepth > max) max = menuDepth;
    if (!self) stack.push(isMenu);
  }
  return max;
}

function scanNestedSubmenus(files) {
  const out = [];
  for (const f of files) {
    if (!isMenuFile(f.text)) continue;
    if (maxMenuNest(f.text) >= 3) {
      out.push(hit(f.path, "submenu nested deeper than one level"));
    }
  }
  return out;
}

function isDisabledAttrs(attrs) {
  return (
    /(?:^|\s)disabled(?=$|[\s=/>])/i.test(attrs) ||
    /aria-disabled=["']true["']/i.test(attrs)
  );
}

function hasSubmenuWidget(text) {
  return (
    /role=["']menuitem["'][^>]*aria-haspopup=["'](?:menu|true)["']/i.test(text) ||
    /aria-haspopup=["'](?:menu|true)["'][^>]*role=["']menuitem["']/i.test(text) ||
    /\bMenu\s*\([^)]*\)\s*\{[\s\S]*?\bMenu\s*\(/.test(text)
  );
}

function hasSubmenuCopy(text) {
  return (
    /submenu remains available/i.test(text) ||
    /submenu item that is unavailable/i.test(text) ||
    /nested menu items are unavailable/i.test(text)
  );
}

function htmlDisabledSubmenu(text) {
  const re = /<([A-Za-z][\w]*)\b([^>]*role=["']menuitem["'][^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) {
    const attrs = m[2];
    const body = m[3];
    const isSub =
      /aria-haspopup=["'](?:menu|true)["']/i.test(attrs) || /role=["']menu["']/i.test(body);
    if (isSub && isDisabledAttrs(attrs)) return true;
  }
  return false;
}

function swiftDisabledSubmenu(text) {
  const re = /\bMenu\s*\([^)]*\)\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].lastIndexOf("{");
    const close = matchingBrace(text, open);
    if (close < 0) continue;
    const body = text.slice(open + 1, close);
    if (!/\bMenu\s*\(/.test(body)) continue;
    if (/^\s*\.disabled\s*\(\s*true\s*\)/.test(text.slice(close + 1, close + 40))) return true;
  }
  return false;
}

function scanSubmenuAvailable(files) {
  const out = [];
  for (const f of files) {
    if (/data-mn-sub(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a submenu item that is unavailable"));
      continue;
    }
    if (htmlDisabledSubmenu(f.text) || swiftDisabledSubmenu(f.text)) {
      out.push(hit(f.path, "a submenu item that is unavailable"));
      continue;
    }
    if (hasSubmenuWidget(f.text) && hasSubmenuCopy(f.text)) {
      out.push(hit(f.path, "a submenu item that is unavailable"));
    }
  }
  return out;
}

function applySubmenuAvailable(text) {
  return text.replace(/\s*data-mn-sub(?:="[^"]*")?(?![\w-])/g, "");
}

function contextMenuBodies(text) {
  const bodies = [];
  const re = /\.contextMenu\b/g;
  let m;
  while ((m = re.exec(text))) {
    const brace = text.indexOf("{", m.index);
    if (brace < 0 || brace - m.index > 80) continue;
    const close = matchingBrace(text, brace);
    if (close < 0) continue;
    bodies.push(text.slice(brace + 1, close));
  }
  const ui = /UIContextMenuInteraction|popUpContextMenu/g;
  while ((m = ui.exec(text))) bodies.push(text.slice(m.index, m.index + 700));
  for (const attr of ["oncontextmenu", "onContextMenu"]) {
    for (const block of blocksWithAttr(text, attr)) bodies.push(block.text);
  }
  return bodies;
}

function bodyHasShortcut(body) {
  return (
    /\bkeyboardShortcut\s*\(/.test(body) ||
    /\bkeyEquivalent\b/.test(body) ||
    /<kbd\b/i.test(body) ||
    /⌘/.test(body)
  );
}

function contextMenuHasShortcut(text) {
  return contextMenuBodies(text).some((body) => bodyHasShortcut(body));
}

function hasContextMenuWidget(text) {
  return (
    /\.contextMenu\b/.test(text) ||
    /\bUIContextMenuInteraction\b/.test(text) ||
    /\bpopUpContextMenu\b/.test(text) ||
    /\boncontextmenu\b/i.test(text)
  );
}

function hasContextShortcutCopy(text) {
  return (
    /not in context menus/i.test(text) ||
    /keyboard shortcuts in your app/i.test(text) ||
    /keyboard shortcut inside a context menu/i.test(text)
  );
}

function scanContextShortcut(files) {
  const out = [];
  for (const f of files) {
    if (/data-mn-key(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a keyboard shortcut inside a context menu"));
      continue;
    }
    if (contextMenuHasShortcut(f.text)) {
      out.push(hit(f.path, "a keyboard shortcut inside a context menu"));
      continue;
    }
    if (hasContextMenuWidget(f.text) && hasContextShortcutCopy(f.text)) {
      out.push(hit(f.path, "a keyboard shortcut inside a context menu"));
    }
  }
  return out;
}

function applyContextShortcut(text) {
  return text.replace(/\s*data-mn-key(?:="[^"]*")?(?![\w-])/g, "");
}

function hasContextMenuLaunch(text) {
  return (
    /\.contextMenu\s*\(/.test(text) ||
    /\bUIContextMenuInteraction\b/.test(text) ||
    /\bpopUpContextMenu\b/.test(text) ||
    /\boncontextmenu\b/i.test(text)
  );
}

function menuTagIsWindowTall(tag) {
  return (
    /(?<![\w-])(?:min-)?height\s*:\s*["']?\s*100vh\b/i.test(tag) ||
    /\bminHeight\s*:\s*["']100vh["']/.test(tag)
  );
}

function regionHasWindowTallMenu(region) {
  const tags = region.match(/<[A-Za-z][\w]*\b[^>]*>/g) || [];
  return tags.some((tag) => {
    const isMenu = /^<menu\b/i.test(tag) || /role=["']menu["']/i.test(tag);
    return isMenu && menuTagIsWindowTall(tag);
  });
}

function launchedContextMenuRegions(text) {
  const regions = [];
  for (const attr of ["oncontextmenu", "onContextMenu"]) {
    for (const block of blocksWithAttr(text, attr)) regions.push(block.text);
  }
  const re = /\.contextMenu\s*\(/g;
  let m;
  while ((m = re.exec(text))) {
    const brace = text.indexOf("{", m.index);
    if (brace < 0 || brace - m.index > 80) continue;
    const close = matchingBrace(text, brace);
    if (close < 0) continue;
    regions.push(text.slice(m.index, close + 1));
  }
  const ui = /UIContextMenuInteraction|popUpContextMenu/g;
  while ((m = ui.exec(text))) regions.push(text.slice(m.index, m.index + 700));
  return regions;
}

function contextMenuIsWindowTall(text) {
  if (!hasContextMenuLaunch(text)) return false;
  return launchedContextMenuRegions(text).some((region) => regionHasWindowTallMenu(region));
}

function hasContextMenuHeightCopy(text) {
  return (
    /height exceed the height of the window/i.test(text) ||
    /context menu taller than the window/i.test(text)
  );
}

function scanContextMenuHeight(files) {
  const out = [];
  for (const f of files) {
    if (/data-mn-tall(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a context menu taller than the window"));
      continue;
    }
    if (!hasContextMenuLaunch(f.text)) continue;
    if (contextMenuIsWindowTall(f.text) || hasContextMenuHeightCopy(f.text)) {
      out.push(hit(f.path, "a context menu taller than the window"));
    }
  }
  return out;
}

function applyContextMenuHeight(text) {
  return text.replace(/\s*data-mn-tall(?:="[^"]*")?(?![\w-])/g, "");
}

function contextMenuSeparatorCount(region) {
  const patterns = [/<hr\b/gi, /role=["']separator["']/gi, /\bDivider\s*\(/g, /\bseparatorItem\b/g];
  let count = 0;
  for (const pattern of patterns) {
    const found = region.match(pattern);
    if (found) count += found.length;
  }
  return count;
}

function contextMenuHasTooManyGroups(region) {
  const groups = (region.match(/role=["']group["']/gi) || []).length;
  return contextMenuSeparatorCount(region) >= 3 || groups >= 4;
}

function hasContextMenuGroupCopy(text) {
  return (
    /more than about three groups in a context menu/i.test(text) ||
    /three groups in a context menu/i.test(text)
  );
}

function scanContextMenuGroups(files) {
  const out = [];
  for (const f of files) {
    if (/data-mn-grp(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "more than about three groups in a context menu"));
      continue;
    }
    if (!hasContextMenuLaunch(f.text)) continue;
    const tooMany = launchedContextMenuRegions(f.text).some(contextMenuHasTooManyGroups);
    if (tooMany || hasContextMenuGroupCopy(f.text)) {
      out.push(hit(f.path, "more than about three groups in a context menu"));
    }
  }
  return out;
}

function applyContextMenuGroups(text) {
  return text.replace(/\s*data-mn-grp(?:="[^"]*")?(?![\w-])/g, "");
}

function scanMixMenuIcons(files) {
  const out = [];
  for (const f of files) {
    if (!isMenuFile(f.text)) continue;
    const items = [
      ...f.text.matchAll(
        /<([A-Za-z][\w]*)\b[^>]*role=["']menuitem["'][^>]*>[\s\S]*?<\/\1>/gi,
      ),
    ];
    if (items.length < 2) continue;
    let withIcon = 0;
    let without = 0;
    for (const item of items) {
      if (/<svg\b|<img\b|systemImage/.test(item[0])) withIcon += 1;
      else without += 1;
    }
    if (withIcon && without) {
      out.push(hit(f.path, "menu group mixes icons and no-icons"));
    }
  }
  return out;
}

function roleSpans(text, role) {
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
    out.push({ start: m.index, end: i });
  }
  return out;
}

function dataToolbarSpans(text) {
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
    out.push({ start: m.index, end: i });
  }
  return out;
}

function toolbarModifierSpans(text) {
  const out = [];
  const re = /\.toolbar\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].lastIndexOf("{");
    const close = matchingBrace(text, open);
    if (close < 0) continue;
    out.push({ start: m.index, end: close + 1 });
  }
  return out;
}

function indexInSpans(index, spans) {
  return spans.some((span) => index >= span.start && index < span.end);
}

function menuCommandSpans(text) {
  const spans = roleSpans(text, "menu");
  const re = /\bMenu\s*\(/g;
  let m;
  while ((m = re.exec(text))) {
    if (/context$/i.test(text.slice(Math.max(0, m.index - 8), m.index))) continue;
    const paren = text.indexOf("(", m.index);
    const close = matchingBrace(text, paren);
    if (close < 0) continue;
    spans.push({ start: m.index, end: close + 1 });
  }
  return spans;
}

function pullDownLauncherIndexes(text, toolbars) {
  const indexes = [];
  const menus = roleSpans(text, "menu");
  const re =
    /<button\b[^>]*\baria-haspopup=["']menu["'][^>]*>|\bNSPullDownButton\b|\.menuStyle\s*\(\s*\.pullDown\b/gi;
  let m;
  while ((m = re.exec(text))) {
    if (indexInSpans(m.index, toolbars) || indexInSpans(m.index, menus)) continue;
    if (/role=["']menuitem["']/i.test(m[0])) continue;
    indexes.push(m.index);
  }
  return indexes;
}

function outsidePullDownActionCount(text) {
  const toolbars = [...roleSpans(text, "toolbar"), ...dataToolbarSpans(text), ...toolbarModifierSpans(text)];
  const launchers = pullDownLauncherIndexes(text, toolbars);
  if (launchers.length === 0) return null;
  const menus = menuCommandSpans(text);
  let count = 0;
  const buttonRe = /<button\b[^>]*>|\bButton\s*\(\s*"/g;
  let m;
  while ((m = buttonRe.exec(text))) {
    if (indexInSpans(m.index, toolbars) || indexInSpans(m.index, menus)) continue;
    if (/role=["']menuitem["']/i.test(m[0])) continue;
    if (/aria-haspopup=["']menu["']/i.test(m[0])) continue;
    count += 1;
  }
  return count;
}

function hasLonePullDown(text) {
  return outsidePullDownActionCount(text) === 0;
}

function hasPullDownAllCopy(text) {
  return (
    /all of a view['’]?s actions in one pull-down/i.test(text) ||
    /pull-down button that holds every action/i.test(text)
  );
}

function hasPullDownLauncher(text) {
  const toolbars = [...roleSpans(text, "toolbar"), ...dataToolbarSpans(text), ...toolbarModifierSpans(text)];
  return pullDownLauncherIndexes(text, toolbars).length > 0;
}

function scanPullDownAllActions(files) {
  const out = [];
  for (const f of files) {
    if (/data-pd-all(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "all of a view's actions in one pull-down button"));
      continue;
    }
    if (hasLonePullDown(f.text) || (hasPullDownAllCopy(f.text) && hasPullDownLauncher(f.text))) {
      out.push(hit(f.path, "all of a view's actions in one pull-down button"));
    }
  }
  return out;
}

function applyPullDownAllActions(text) {
  return text.replace(/\s*data-pd-all(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "pd-all",
    rewrite: "marker",
    scan: scanPullDownAllActions,
    apply(text, file) {
      return applyPullDownAllActions(text);
    },
  },
  {
    id: "hide-unavailable-menu-items",
    rewrite: "host",
    scan: scanHiddenMenuItems,
    apply(text, file) {
      return applyHiddenMenuItems(text);
    },
  },
  {
    id: "nested-submenus-deep",
    rewrite: "marker",
    scan: scanNestedSubmenus,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "mix-menu-icons",
    rewrite: "marker",
    scan: scanMixMenuIcons,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "mn-sub",
    rewrite: "marker",
    scan: scanSubmenuAvailable,
    apply(text, file) {
      return applySubmenuAvailable(text);
    },
  },
  {
    id: "mn-key",
    rewrite: "marker",
    scan: scanContextShortcut,
    apply(text, file) {
      return applyContextShortcut(text);
    },
  },
  {
    id: "mn-tall",
    rewrite: "marker",
    scan: scanContextMenuHeight,
    apply(text, file) {
      return applyContextMenuHeight(text);
    },
  },
  {
    id: "mn-grp",
    rewrite: "marker",
    scan: scanContextMenuGroups,
    apply(text, file) {
      return applyContextMenuGroups(text);
    },
  },
];
