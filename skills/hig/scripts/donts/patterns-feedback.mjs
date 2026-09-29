import { hit, innerText, dialogRegions } from "./shared.mjs";

function scanModalSuccess(files) {
  const out = [];
  for (const f of files) {
    for (const region of dialogRegions(f.text)) {
      if (/\b(Success|Saved!|Successfully saved)\b/i.test(innerText(region))) {
        out.push(hit(f.path, "modal Success after save"));
      }
    }
  }
  return out;
}

function scanErrorToast(files) {
  const out = [];
  for (const f of files) {
    if (
      /(data-toast|role=["']status["'])[\s\S]{0,240}\berror\b/i.test(f.text) &&
      /setTimeout|toastDuration|autoHide|disappear/i.test(f.text)
    ) {
      out.push(hit(f.path, "error toast that disappears"));
    }
  }
  return out;
}

function scanConfettiCrud(files) {
  const out = [];
  for (const f of files) {
    if (
      /\bconfetti\b/i.test(f.text) &&
      /\b(onSave|handleSave|createItem|updateItem|onSubmit|CRUD)\b/.test(f.text)
    ) {
      out.push(hit(f.path, "confetti on ordinary CRUD"));
    }
  }
  return out;
}

function applyConfettiCrud(text) {
  return text
    .replace(/<([A-Za-z][\w]*)\b[^>]*\bconfetti\b[^>]*\/>\s*/gi, "")
    .replace(/<([A-Za-z][\w]*)\b[^>]*\bconfetti\b[^>]*>[\s\S]*?<\/\1>\s*/gi, "")
    .replace(/\bconfetti\s*\([^)]*\)\s*;?/g, "");
}

export const records = [
  {
    id: "modal-success-after-save",
    rewrite: "marker",
    scan: scanModalSuccess,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "error-toast-disappears",
    rewrite: "marker",
    scan: scanErrorToast,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "confetti-on-crud",
    rewrite: "host",
    scan: scanConfettiCrud,
    apply(text, file) {
      return applyConfettiCrud(text);
    },
  },
];
