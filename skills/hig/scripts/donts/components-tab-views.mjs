import { hit } from "./shared.mjs";

function hasTabView(text) {
  return (
    /\bdata-tab-view\b/.test(text) ||
    /\bNSTabView\b/.test(text) ||
    ( /role=["']tablist["']/i.test(text) && /role=["']tabpanel["']/i.test(text) )
  );
}

function countTabViewTabs(text) {
  const roleTabs = (String(text).match(/role=["']tab["']/gi) || []).length;
  const items = (String(text).match(/\bNSTabViewItem\b/g) || []).length;
  return Math.max(roleTabs, items);
}

function scanPopupTabsSwitch(files) {
  const out = [];
  for (const f of files) {
    if (/data-popup-tabs/.test(f.text)) {
      out.push(hit(f.path, "pop-up button used to switch between tabs"));
    }
  }
  return out;
}

function applyPopupTabsSwitch(text) {
  return text.replace(/\s*data-popup-tabs(?:="[^"]*")?/g, "");
}

function scanMoreThanSixTabs(files) {
  const out = [];
  for (const f of files) {
    if (/data-too-many-tabs/.test(f.text)) {
      out.push(hit(f.path, "more than six tabs in a tab view"));
      continue;
    }
    if (!hasTabView(f.text)) continue;
    if (countTabViewTabs(f.text) > 6) {
      out.push(hit(f.path, "more than six tabs in a tab view"));
    }
  }
  return out;
}

function applyMoreThanSixTabs(text) {
  return text.replace(/\s*data-too-many-tabs(?:="[^"]*")?/g, "");
}

function scanCrossPaneControls(files) {
  const out = [];
  for (const f of files) {
    if (/data-cross-pane/.test(f.text)) {
      out.push(hit(f.path, "controls in a pane that affect content in another pane"));
    }
  }
  return out;
}

function applyCrossPaneControls(text) {
  return text.replace(/\s*data-cross-pane(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "popup-tabs-switch",
    rewrite: "marker",
    scan: scanPopupTabsSwitch,
    apply(text, file) {
      return applyPopupTabsSwitch(text);
    },
  },
  {
    id: "more-than-six-tabs",
    rewrite: "marker",
    scan: scanMoreThanSixTabs,
    apply(text, file) {
      return applyMoreThanSixTabs(text);
    },
  },
  {
    id: "cross-pane-controls",
    rewrite: "marker",
    scan: scanCrossPaneControls,
    apply(text, file) {
      return applyCrossPaneControls(text);
    },
  },
];
