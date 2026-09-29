import { hit } from "./shared.mjs";

function hasPhotoEdit(text) {
  return /\bdata-photo-edit\b/.test(text) || /\bPHContentEditingController\b/.test(text);
}

function hasPxCancelCopy(text) {
  return (
    /don['’]?t immediately discard their changes/i.test(text) ||
    /immediately discard (?:their|the) changes/i.test(text)
  );
}

function hasPxCancelSignal(text) {
  if (!hasPhotoEdit(text)) return false;
  if (!/\b(?:hasEdits|isEdited|unsavedEdits)\b/.test(text)) return false;
  if (/\bconfirm\b/i.test(text)) return false;
  return (
    /cancel[\s\S]{0,240}(?:discard|revert)/i.test(text) ||
    /(?:discard|revert)[\s\S]{0,240}cancel/i.test(text)
  );
}

function scanPxCancel(files) {
  const out = [];
  for (const f of files) {
    if (/data-px-cancel/.test(f.text)) {
      out.push(hit(f.path, "Cancel that discards edits without a confirm"));
      continue;
    }
    if (!hasPhotoEdit(f.text)) continue;
    if (hasPxCancelCopy(f.text) || hasPxCancelSignal(f.text)) {
      out.push(hit(f.path, "Cancel that discards edits without a confirm"));
    }
  }
  return out;
}

function applyPxCancel(text) {
  return text.replace(/\s*data-px-cancel(?:="[^"]*")?/g, "");
}

function hasPxToolbarCopy(text) {
  return /custom top toolbar/i.test(text) || /providing a second toolbar/i.test(text);
}

function hasCustomPhotoToolbar(text) {
  if (!hasPhotoEdit(text)) return false;
  return /role=["']toolbar["']/i.test(text) || /\bToolbarItem\b/.test(text);
}

function scanPxToolbar(files) {
  const out = [];
  for (const f of files) {
    if (/data-px-toolbar(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a custom top toolbar in a photo-editing session"));
      continue;
    }
    if (!hasPhotoEdit(f.text)) continue;
    if (hasPxToolbarCopy(f.text) || hasCustomPhotoToolbar(f.text)) {
      out.push(hit(f.path, "a custom top toolbar in a photo-editing session"));
    }
  }
  return out;
}

function applyPxToolbar(text) {
  return text.replace(/\s*data-px-toolbar(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "px-cancel",
    rewrite: "marker",
    scan: scanPxCancel,
    apply(text, file) {
      return applyPxCancel(text);
    },
  },
  {
    id: "px-toolbar",
    rewrite: "marker",
    scan: scanPxToolbar,
    apply(text, file) {
      return applyPxToolbar(text);
    },
  },
];
