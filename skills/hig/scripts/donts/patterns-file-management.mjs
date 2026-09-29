import { hit } from "./shared.mjs";

function hasFileBrowser(text) {
  return (
    /\bdata-file-browser\b/.test(text) ||
    /\bdata-document-browser\b/.test(text) ||
    /\bUIDocumentBrowserViewController\b/.test(text) ||
    /\bUIDocumentPickerViewController\b/.test(text) ||
    /\bDocumentGroup\s*\(/.test(text) ||
    /\bNSOpenPanel\b/.test(text) ||
    /\bNSSavePanel\b/.test(text)
  );
}

function scanCustomFileToolbar(files) {
  const out = [];
  for (const f of files) {
    if (/data-custom-file-toolbar/.test(f.text)) {
      out.push(hit(f.path, "custom top toolbar on a file-browser modal"));
    }
  }
  return out;
}

function applyCustomFileToolbar(text) {
  return text.replace(/\s*data-custom-file-toolbar(?:="[^"]*")?/g, "");
}

function scanExtensionsShownByDefault(files) {
  const out = [];
  for (const f of files) {
    if (/data-show-extensions-by-default/.test(f.text)) {
      out.push(hit(f.path, "file extensions shown by default"));
    }
  }
  return out;
}

function applyExtensionsShownByDefault(text) {
  return text.replace(/\s*data-show-extensions-by-default(?:="[^"]*")?/g, "");
}

function scanExplicitSaveRequired(files) {
  const out = [];
  for (const f of files) {
    if (/data-explicit-save-required/.test(f.text)) {
      out.push(hit(f.path, "explicit action to save required to keep work"));
      continue;
    }
    if (!hasFileBrowser(f.text)) continue;
    if (/>Save</.test(f.text) && /\bdata-no-autosave\b/.test(f.text)) {
      out.push(hit(f.path, "explicit action to save required to keep work"));
    }
  }
  return out;
}

function applyExplicitSaveRequired(text) {
  return text.replace(/\s*data-explicit-save-required(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "custom-file-toolbar",
    rewrite: "marker",
    scan: scanCustomFileToolbar,
    apply(text, file) {
      return applyCustomFileToolbar(text);
    },
  },
  {
    id: "extensions-shown-by-default",
    rewrite: "marker",
    scan: scanExtensionsShownByDefault,
    apply(text, file) {
      return applyExtensionsShownByDefault(text);
    },
  },
  {
    id: "explicit-save-required",
    rewrite: "marker",
    scan: scanExplicitSaveRequired,
    apply(text, file) {
      return applyExplicitSaveRequired(text);
    },
  },
];
