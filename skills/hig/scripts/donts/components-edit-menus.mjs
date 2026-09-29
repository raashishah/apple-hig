import { hit } from "./shared.mjs";

function hasEditMenuWidget(text) {
  return (
    /\bdata-edit-menu\b/.test(text) ||
    /\bUIMenuController\b/.test(text) ||
    /\bUIEditMenuInteraction\b/.test(text) ||
    /\.editMenu\s*\(/.test(text)
  );
}

function scanCustomEditMenu(files) {
  const out = [];
  for (const f of files) {
    if (/data-custom-edit-menu/.test(f.text)) {
      out.push(hit(f.path, "custom menu that presents the same commands"));
    }
  }
  return out;
}

function applyCustomEditMenu(text) {
  return text.replace(/\s*data-custom-edit-menu(?:="[^"]*")?/g, "");
}

function scanInapplicableEditCommands(files) {
  const out = [];
  for (const f of files) {
    if (/data-edit-no-selection/.test(f.text)) {
      out.push(hit(f.path, "Cut or Copy shown when nothing is selected"));
      continue;
    }
    if (!hasEditMenuWidget(f.text)) continue;
    const hasCutCopy = /\b(Cut|Copy)\b/.test(f.text);
    const hasSelection =
      /\bdata-selection\b/.test(f.text) || /aria-selected=["']true["']/i.test(f.text);
    if (hasCutCopy && !hasSelection) {
      out.push(hit(f.path, "Cut or Copy shown when nothing is selected"));
    }
  }
  return out;
}

function applyInapplicableEditCommands(text) {
  return text.replace(/\s*data-edit-no-selection(?:="[^"]*")?/g, "");
}

function scanRedundantEditControls(files) {
  const out = [];
  for (const f of files) {
    if (/data-redundant-edit-controls/.test(f.text)) {
      out.push(hit(f.path, "other controls that perform the same functions"));
    }
  }
  return out;
}

function applyRedundantEditControls(text) {
  return text.replace(/\s*data-redundant-edit-controls(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "custom-edit-menu",
    rewrite: "marker",
    scan: scanCustomEditMenu,
    apply(text, file) {
      return applyCustomEditMenu(text);
    },
  },
  {
    id: "inapplicable-edit-commands",
    rewrite: "marker",
    scan: scanInapplicableEditCommands,
    apply(text, file) {
      return applyInapplicableEditCommands(text);
    },
  },
  {
    id: "redundant-edit-controls",
    rewrite: "marker",
    scan: scanRedundantEditControls,
    apply(text, file) {
      return applyRedundantEditControls(text);
    },
  },
];
