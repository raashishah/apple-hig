import { hit } from "./shared.mjs";

function hasStaticLabelWidget(text) {
  return (
    /\bdata-label\b/.test(text) ||
    /\bUILabel\b/.test(text) ||
    /\bLabel\s*\(/.test(text)
  );
}

function scanEditableLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-editable-label/.test(f.text)) {
      out.push(hit(f.path, "editable label"));
      continue;
    }
    if (!hasStaticLabelWidget(f.text)) continue;
    if (
      /contenteditable\s*=\s*["']true["']/i.test(f.text) ||
      /isEditable\s*=\s*true/.test(f.text)
    ) {
      out.push(hit(f.path, "editable label"));
    }
  }
  return out;
}

function applyEditableLabel(text) {
  return text.replace(/\s*data-editable-label(?:="[^"]*")?/g, "");
}

function scanLongLabelAsTextView(files) {
  const out = [];
  for (const f of files) {
    if (/data-long-label/.test(f.text)) {
      out.push(hit(f.path, "large amount of text in a label"));
    }
  }
  return out;
}

function applyLongLabelAsTextView(text) {
  return text.replace(/\s*data-long-label(?:="[^"]*")?/g, "");
}

function scanUnselectableUsefulLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-unselectable-label/.test(f.text)) {
      out.push(hit(f.path, "useful label text people can't copy"));
      continue;
    }
    if (!hasStaticLabelWidget(f.text)) continue;
    if (
      /(user-select\s*:\s*none|userSelect\s*:\s*["']none["'])/.test(f.text) &&
      /\b(error|location|IP|address)\b/i.test(f.text)
    ) {
      out.push(hit(f.path, "useful label text people can't copy"));
    }
  }
  return out;
}

function applyUnselectableUsefulLabel(text) {
  return text.replace(/\s*data-unselectable-label(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "editable-label",
    rewrite: "marker",
    scan: scanEditableLabel,
    apply(text, file) {
      return applyEditableLabel(text);
    },
  },
  {
    id: "long-label-as-text-view",
    rewrite: "marker",
    scan: scanLongLabelAsTextView,
    apply(text, file) {
      return applyLongLabelAsTextView(text);
    },
  },
  {
    id: "unselectable-useful-label",
    rewrite: "marker",
    scan: scanUnselectableUsefulLabel,
    apply(text, file) {
      return applyUnselectableUsefulLabel(text);
    },
  },
];
