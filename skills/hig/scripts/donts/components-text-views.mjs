import { hit } from "./shared.mjs";

function hasTextViewWidget(text) {
  return (
    /\bdata-text-view\b/.test(text) ||
    /\bUITextView\b/.test(text) ||
    /\bNSTextView\b/.test(text) ||
    /\bTextEditor\s*\(/.test(text) ||
    /<textarea\b/i.test(text)
  );
}

function scanShortTextAsField(files) {
  const out = [];
  for (const f of files) {
    if (/data-short-text-view/.test(f.text)) {
      out.push(hit(f.path, "text view for a small amount of text"));
      continue;
    }
    if (!hasTextViewWidget(f.text)) continue;
    if (
      /<textarea\b[^>]*(rows\s*=\s*["']?1["']?|rows\s*=\s*\{\s*1\s*\})/i.test(
        f.text,
      ) ||
      /(maximumNumberOfLines|numberOfLines)\s*=\s*1/.test(f.text)
    ) {
      out.push(hit(f.path, "text view for a small amount of text"));
    }
  }
  return out;
}

function applyShortTextAsField(text) {
  return text.replace(/\s*data-short-text-view(?:="[^"]*")?/g, "");
}

function scanUnselectableUsefulTextView(files) {
  const out = [];
  for (const f of files) {
    if (/data-unselectable-text-view/.test(f.text)) {
      out.push(hit(f.path, "useful text-view text people can't copy"));
      continue;
    }
    if (!hasTextViewWidget(f.text)) continue;
    if (
      /(user-select\s*:\s*none|userSelect\s*:\s*["']none["'])/.test(f.text) &&
      /\b(error|serial|IP|address)\b/i.test(f.text)
    ) {
      out.push(hit(f.path, "useful text-view text people can't copy"));
    }
  }
  return out;
}

function applyUnselectableUsefulTextView(text) {
  return text.replace(/\s*data-unselectable-text-view(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "short-text-as-field",
    rewrite: "marker",
    scan: scanShortTextAsField,
    apply(text, file) {
      return applyShortTextAsField(text);
    },
  },
  {
    id: "unselectable-useful-text-view",
    rewrite: "marker",
    scan: scanUnselectableUsefulTextView,
    apply(text, file) {
      return applyUnselectableUsefulTextView(text);
    },
  },
];
