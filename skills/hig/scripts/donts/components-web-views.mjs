import { hit } from "./shared.mjs";

function hasWebView(text) {
  return (
    /\bdata-web-view\b/.test(text) ||
    /<iframe\b/i.test(text) ||
    /\bWKWebView\b/.test(text) ||
    /\bWebView\s*\(/.test(text)
  );
}

function hasWebViewBackForward(text) {
  return (
    /\b(goBack|goForward|canGoBack|canGoForward|allowsBackForwardNavigationGestures)\b/.test(
      text,
    ) ||
    (/\bBack\b/.test(text) && /\bForward\b/.test(text))
  );
}

function scanMissingWebViewBackForward(files) {
  const out = [];
  for (const f of files) {
    if (/data-no-web-back-forward/.test(f.text)) {
      out.push(hit(f.path, "multi-page web view without forward and back"));
      continue;
    }
    if (!hasWebView(f.text)) continue;
    if (
      /\bdata-web-view-multipage\b/.test(f.text) &&
      !hasWebViewBackForward(f.text)
    ) {
      out.push(hit(f.path, "multi-page web view without forward and back"));
    }
  }
  return out;
}

function applyMissingWebViewBackForward(text) {
  return text.replace(/\s*data-no-web-back-forward(?:="[^"]*")?/g, "");
}

function scanSafariReplicaWebView(files) {
  const out = [];
  for (const f of files) {
    if (/data-safari-replica/.test(f.text)) {
      out.push(hit(f.path, "a web view that replicates Safari"));
    }
  }
  return out;
}

function applySafariReplicaWebView(text) {
  return text.replace(/\s*data-safari-replica(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "missing-web-view-back-forward",
    rewrite: "marker",
    scan: scanMissingWebViewBackForward,
    apply(text, file) {
      return applyMissingWebViewBackForward(text);
    },
  },
  {
    id: "safari-replica-web-view",
    rewrite: "marker",
    scan: scanSafariReplicaWebView,
    apply(text, file) {
      return applySafariReplicaWebView(text);
    },
  },
];
