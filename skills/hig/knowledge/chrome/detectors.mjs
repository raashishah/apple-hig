/**
 * Source heuristics for chrome grammar failWhen lines.
 * Conservative: a hit must look like the FAIL, not a passing aria-label.
 * Packs still own the prose; this module is what models cannot skip.
 */

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
};
