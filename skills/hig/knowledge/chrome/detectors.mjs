/**
 * Source heuristics for chrome grammar failWhen lines.
 * Conservative: hit the FAIL, not a passing aria-label.
 */

import { listStatusChrome } from "./list-status.mjs";
import { detailBody, splitSections, swiftStructs } from "./source-spans.mjs";

function hit(file, evidence) {
  return { file, evidence: String(evidence).replace(/\s+/g, " ").trim().slice(0, 180) };
}

function isOverlayContext(text) {
  return /\b(overlay|sheet|dialog|alert|modal|picker|popover|scrim)\b/i.test(text);
}

function detectViewModeIcons(files) {
  const out = [];
  for (const f of files) {
    const visibleGlyph = />\s*(List|Grid|Table|Gallery)\s*</.test(f.text);
    const viewGroup =
      /role=["']radiogroup["']|role=["']radio["']|segmented|view-mode|ViewMode|PickerStyle\.segmented|Picker\(/i.test(
        f.text,
      );
    const swiftPair =
      /Text\(\s*"List"\s*\)/.test(f.text) && /Text\(\s*"Grid"\s*\)/.test(f.text);
    if ((visibleGlyph && viewGroup) || swiftPair) {
      out.push(hit(f.path, "visible List/Grid text used as the view-mode glyph"));
    }
  }
  return out;
}

function detectToolbarBudget(files) {
  const out = [];
  for (const f of files) {
    const bands = f.text.match(/data-chrome-band/g);
    if (bands && bands.length > 1) {
      out.push(hit(f.path, `${bands.length} data-chrome-band markers in one list pane`));
      continue;
    }
    const listPane = /data-list-pane|list-browser|ListPane/.test(f.text);
    const toolbarBlocks = f.text.match(/<(header|div)[^>]*(toolbar|chrome-band|options|search)/gi);
    if (listPane && toolbarBlocks && toolbarBlocks.length > 1) {
      out.push(hit(f.path, "list pane stacks multiple chrome/header bands"));
    }
  }
  return out;
}

function detectFilterDensity(files) {
  const out = [];
  for (const f of files) {
    const checkbox = /<input\b[^>]*type=["']checkbox["'][^>]*>/i.test(f.text);
    const phrase =
      /Hide out of stock|Show only|full-phrase|>\s*[A-Za-z]+(?:\s+[A-Za-z]+){2,}\s*</.test(
        f.text,
      );
    const inListChrome =
      /data-chrome-band|data-list-pane|toolbar|filter/i.test(f.text);
    if (checkbox && phrase && inListChrome) {
      out.push(hit(f.path, "list chrome uses a full-phrase checkbox filter"));
    }
  }
  return out;
}

function detectFormColumn(files) {
  const out = [];
  for (const f of files) {
    const form = /data-form-page|data-form-body|<form\b/i.test(f.text);
    if (!form) continue;
    const fullHeader =
      /<header[^>]*width:\s*["']100%["']|header[^{]{0,80}width:\s*["']100%["']|data-form-page[\s\S]{0,400}<header[^>]*style=\{\{\s*width:\s*["']100%["']/i.test(
        f.text,
      );
    const cappedBody =
      /data-form-body[^>]*maxWidth|maxWidth:\s*["']?\d/.test(f.text);
    if (fullHeader && cappedBody) {
      out.push(hit(f.path, "full-bleed form header over a capped field column"));
    }
  }
  return out;
}

function detectSidebarCollapsible(files) {
  const out = [];
  for (const f of files) {
    const sidebar = /<aside\b|data-sidebar|NavigationSplitView/.test(f.text);
    if (!sidebar) continue;
    const fixed =
      /position:\s*["']?fixed["']?|position:\s*fixed/.test(f.text) &&
      /width:\s*["']?\d/.test(f.text);
    const canCollapse =
      /aria-expanded=/.test(f.text) ||
      /data-collapsed/.test(f.text) ||
      /aria-label=["'][^"']*collapse sidebar/i.test(f.text) ||
      /sidebarToggle/.test(f.text);
    if (fixed && !canCollapse) {
      out.push(hit(f.path, "fixed-width sidebar with no collapse affordance"));
    }
  }
  return out;
}

function detectOpaqueBarFill(files) {
  const out = [];
  for (const f of files) {
    if (isOverlayContext(f.path)) continue;
    const jsxBar =
      /<(header|nav)[^>]*(data-nav|aria-label=["']Primary["'])[\s\S]{0,400}background(?:Color)?:\s*["']#[0-9a-fA-F]{3,8}["']/.test(
        f.text,
      ) ||
      /<(header|nav)[^>]*style=\{\{[^}]*(background(?:Color)?):\s*["']#[0-9a-fA-F]{3,8}["']/.test(
        f.text,
      );
    const cssBar =
      /(header|nav|\.tab-bar|\.toolbar|\.sidebar)\s*[^{]{0,60}\{\s*[^}]*background(?:-color)?:\s*#[0-9a-fA-F]{3,8}/.test(
        f.text,
      );
    const swiftBar =
      /(UINavigationBar|UITabBar|UIToolbar)[\s\S]{0,200}(barTintColor|backgroundColor)\s*=/.test(
        f.text,
      );
    if (jsxBar || cssBar || swiftBar) {
      out.push(hit(f.path, "custom opaque fill on nav/toolbar chrome"));
    }
  }
  return out;
}

function detectFashionGlass(files) {
  const out = [];
  for (const f of files) {
    const usesBlur =
      /backdrop-filter|backdropFilter|UIBlurEffect|ultraThinMaterial/.test(f.text);
    if (!usesBlur) continue;
    if (isOverlayContext(f.text) && !/<(header|nav)\b/.test(f.text)) continue;
    const onChrome =
      /<(header|nav)\b[\s\S]{0,500}(backdrop-filter|backdropFilter)/.test(f.text) ||
      /(header|nav|\.card|main|\.content)\s*[^{]{0,40}\{\s*[^}]*backdrop-filter/.test(
        f.text,
      ) ||
      /className=["'][^"']*(nav|header|card)[^"']*["'][\s\S]{0,200}backdrop/i.test(
        f.text,
      ) ||
      /data-fashion-glass/.test(f.text);
    if (onChrome) {
      out.push(hit(f.path, "glass/blur on nav or content rather than a functional overlay"));
    }
  }
  return out;
}

function detectCardGridHome(files) {
  const out = [];
  for (const f of files) {
    const home =
      /data-home|function Home\b|export function Dashboard\b|data-dashboard/.test(
        f.text,
      );
    if (!home) continue;
    const grid =
      /card-grid|dashboard-cards|className=["'][^"']*card-grid/.test(f.text);
    const cards = f.text.match(/class(Name)?=["'][^"']*\bcard\b/g) || [];
    if (grid || cards.length >= 3) {
      out.push(hit(f.path, "product home is a dashboard card grid"));
    }
  }
  return out;
}

function hasIdleSelect(text) {
  return /Select a\b/i.test(text);
}

function detectEmptySelect(files) {
  const out = [];
  for (const f of files) {
    for (const section of splitSections(f.text)) {
      if (!/data-list-status=["']empty["']/.test(section)) continue;
      if (hasIdleSelect(section)) {
        out.push(hit(f.path, "empty list still renders an idle Select detail"));
      }
    }
    for (const block of swiftStructs(f.text)) {
      if (!/NavigationSplitView/.test(block) || !/\.listStatus\(\.empty\)/.test(block)) continue;
      if (hasIdleSelect(block)) {
        out.push(hit(f.path, "empty list still renders an idle Select detail"));
      }
    }
  }
  return out;
}

function isStarvedList(inner) {
  if (!/data-empty-detail|EmptyView\(/.test(inner)) return false;
  if (/width:\s*["']?20rem|minWidth:\s*220|idealWidth:\s*320/.test(inner)) return false;
  const rem = inner.match(/width:\s*["']?(\d+(?:\.\d+)?)rem/i);
  if (rem && Number(rem[1]) < 12) return true;
  const px = inner.match(/width:\s*["']?(\d+)px/i);
  if (px && Number(px[1]) < 160) return true;
  const frame = inner.match(/\.frame\(\s*width:\s*(\d+)/);
  if (frame && Number(frame[1]) < 160) return true;
  return false;
}

function detectListWidth(files) {
  const out = [];
  for (const f of files) {
    for (const section of splitSections(f.text)) {
      if (isStarvedList(section)) {
        out.push(hit(f.path, "list rail is starved beside an empty detail"));
      }
    }
    for (const block of swiftStructs(f.text)) {
      if (!/NavigationSplitView/.test(block)) continue;
      if (isStarvedList(block)) {
        out.push(hit(f.path, "list rail is starved beside an empty detail"));
      }
    }
  }
  return out;
}

function shortCreateOutside(text) {
  if (!/data-create=["']short["']/.test(text)) return false;
  const sections = splitSections(text);
  if (!sections.length) return false;
  return sections.every((section) => !/data-create=["']short["']/.test(section));
}

function detectShortVsLong(files) {
  const out = [];
  for (const f of files) {
    const longInSplit = splitSections(f.text).some((section) =>
      /data-create=["']long["']/.test(section),
    );
    const shortOutside = shortCreateOutside(f.text);
    const swiftLong = swiftStructs(f.text).some(
      (block) => /NavigationSplitView/.test(block) && /\.createKind\(\.long\)/.test(block),
    );
    const swiftShort = swiftStructs(f.text).some((block) => {
      if (!/NavigationSplitView/.test(block) || !/\.createKind\(\.short\)/.test(block)) return false;
      const detail = detailBody(block);
      return !/\.createKind\(\.short\)/.test(detail);
    });
    if (longInSplit || shortOutside || swiftLong || swiftShort) {
      out.push(hit(f.path, "long create is trapped in the split or short create left the detail"));
    }
  }
  return out;
}

function statusRegions(text) {
  const regions = [];
  const html = [
    ...text.matchAll(
      /<section\b[^>]*\bdata-list-status=["'](empty|loading|ready|fault)["'][^>]*>[\s\S]*?<\/section>/gi,
    ),
  ];
  for (const match of html) regions.push({ status: match[1], slice: match[0] });
  const parts = text.split(/(?=ListStatus\.(?:empty|loading|ready|fault))/);
  for (const part of parts) {
    const mark = part.match(/^ListStatus\.(empty|loading|ready|fault)/);
    if (mark) regions.push({ status: mark[1], slice: part });
  }
  return regions;
}

function offersAdd(slice) {
  return />\s*Add\s*</.test(slice) || /Button\(\s*"Add"\s*\)/.test(slice);
}

function detectListStatus(files) {
  const out = [];
  for (const f of files) {
    for (const region of statusRegions(f.text)) {
      const policy = listStatusChrome(region.status);
      const add = !policy.offerAdd && offersAdd(region.slice);
      const dead = policy.deadDetail === "forbid" && hasIdleSelect(region.slice);
      if (add || dead) {
        out.push(hit(f.path, `${region.status} list status offers Add or a dead detail`));
      }
    }
  }
  return out;
}

function detectNestedCards(files) {
  const out = [];
  for (const f of files) {
    const nestedClass =
      /class(Name)?=["'][^"']*\bcard\b[^"']*["'][\s\S]{0,400}class(Name)?=["'][^"']*\bcard\b/.test(
        f.text,
      );
    const cardWrapsList =
      /class(Name)?=["'][^"']*\bcard\b[^"']*["'][\s\S]{0,300}<(ul|table)\b/.test(
        f.text,
      ) && /data-nested-cards|card[\s\S]{0,200}<(ul|table)\b/.test(f.text);
    if (nestedClass || cardWrapsList || /data-nested-cards/.test(f.text)) {
      out.push(hit(f.path, "list/form wrapped in extra card panels"));
    }
  }
  return out;
}

export const DETECTORS = {
  "chrome.view-mode.icons": detectViewModeIcons,
  "chrome.list-browser.toolbar-budget": detectToolbarBudget,
  "chrome.list-browser.filter-density": detectFilterDensity,
  "chrome.form.column-cohesion": detectFormColumn,
  "chrome.sidebar.collapsible": detectSidebarCollapsible,
  "chrome.bars.system-materials": detectOpaqueBarFill,
  "chrome.materials.fashion-glass": detectFashionGlass,
  "chrome.layout.card-grid-home": detectCardGridHome,
  "chrome.ive.nested-cards": detectNestedCards,
  "chrome.split.empty-select": detectEmptySelect,
  "chrome.split.list-width": detectListWidth,
  "chrome.create.short-vs-long": detectShortVsLong,
  "chrome.list-status.lifecycle": detectListStatus,
};
