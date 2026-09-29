import { hit } from "./shared.mjs";

function fileHasSearchWidget(text) {
  return (
    /type=["']search["']/i.test(text) ||
    /role=["']search["']/i.test(text) ||
    /\.searchable\b/.test(text) ||
    /\b(UISearchBar|UISearchController|NSSearchField)\b/.test(text)
  );
}

function fileHasCollection(text) {
  return (
    /<(ul|ol|table)\b/i.test(text) ||
    /role=["']list["']/i.test(text) ||
    /data-list-pane/.test(text) ||
    /\bList\s*[\({]/.test(text) ||
    /card-grid|dashboard-cards/.test(text)
  );
}

function scanHideOnlySearch(files) {
  const blob = files.map((f) => f.text).join("\n");
  if (!fileHasSearchWidget(blob)) return [];
  const out = [];
  if (!fileHasCollection(blob)) {
    const f = files.find((x) => fileHasSearchWidget(x.text)) || files[0];
    out.push(hit(f.path, "search is the only path to content"));
  }
  for (const f of files) {
    if (
      /\{\s*(query|searchQuery|q)\s*(&&|\?)/.test(f.text) &&
      /<(ul|ol|table)\b/i.test(f.text)
    ) {
      out.push(hit(f.path, "collection gated on search query"));
    }
    if (/<(ul|ol|table)\b[^>]*hidden=\{\s*!/.test(f.text)) {
      out.push(hit(f.path, "list hidden unless query"));
    }
  }
  return out;
}

function scanSearchSpinner(files) {
  const out = [];
  for (const f of files) {
    if (!fileHasSearchWidget(f.text)) continue;
    const types = /on(Change|Input)\s*=/.test(f.text);
    const busy =
      /aria-busy=["']true["']/.test(f.text) ||
      /\bspinner\b/i.test(f.text) ||
      /setLoading\s*\(\s*true/.test(f.text);
    const debounced = /\bdebounce\b|\bsetTimeout\b/.test(f.text);
    if (types && busy && !debounced) {
      out.push(hit(f.path, "spinner on search keystroke"));
    }
  }
  return out;
}

function applySearchSpinner(text) {
  if (!fileHasSearchWidget(text)) return text;
  if (!/on(Change|Input)\s*=/.test(text)) return text;
  if (/\bdebounce\b|\bsetTimeout\b/.test(text)) return text;
  return text
    .replace(/\s*aria-busy=["']true["']/gi, "")
    .replace(/\s*<span[^>]*\bspinner\b[^>]*>(?:\s*<\/span>)?/gi, "")
    .replace(/\s*<progress\b[^>]*\/?>(?:\s*<\/progress>)?/gi, "");
}

function scanSearchDump(files) {
  const out = [];
  for (const f of files) {
    if (!fileHasSearchWidget(f.text)) continue;
    if (
      /(?:placeholder|aria-label)=["'][^"']*\b(settings|commands|command palette)\b/i.test(
        f.text,
      ) ||
      /\b(cmdk|Command\.Dialog|data-command-palette)\b/.test(f.text)
    ) {
      out.push(hit(f.path, "search used as settings or command dump"));
    }
  }
  return out;
}

export const records = [
  {
    id: "hide-only-path-behind-search",
    rewrite: "marker",
    scan: scanHideOnlySearch,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "spinner-per-keystroke",
    rewrite: "host",
    scan: scanSearchSpinner,
    apply(text, file) {
      return applySearchSpinner(text);
    },
  },
  {
    id: "search-as-settings-dump",
    rewrite: "marker",
    scan: scanSearchDump,
    apply(text, file) {
      return text;
    },
  },
];
