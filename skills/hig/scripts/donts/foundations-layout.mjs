import { hit } from "./shared.mjs";
import { DETECTORS } from "../../knowledge/chrome/detectors.mjs";
import { applyChromeRecipe } from "../apply-chrome.mjs";

function scanDashboardCardGrid(files) {
  return DETECTORS["chrome.layout.card-grid-home"](files);
}

function scanListPaneMinWidth(files) {
  const out = [];
  for (const f of files) {
    if (!/data-list-pane|list-browser|ListPane/.test(f.text)) continue;
    const pane = f.text.match(
      /<(div|aside|section|nav)\b[^>]*(data-list-pane|list-browser|ListPane)[^>]*>/i,
    );
    if (pane && /minWidth|min-width/.test(pane[0])) {
      out.push(hit(f.path, "list pane min-width"));
      continue;
    }
    if (
      /(data-list-pane|list-browser|\.list-pane)[^{]{0,80}\{\s*[^}]*(min-width|minWidth)/.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "list pane min-width"));
    }
  }
  return out;
}

function applyListPaneMinWidth(text) {
  let next = text.replace(
    /(<(div|aside|section|nav)\b[^>]*(?:data-list-pane|list-browser|ListPane)[^>]*)(>)/gi,
    (all, open, _tag, close) => {
      const stripped = open
        .replace(/minWidth\s*:\s*["'][^"']*["']\s*,?/g, "")
        .replace(/min-width\s*:\s*[^;"'\s}]+;?/gi, "");
      return `${stripped}${close}`;
    },
  );
  next = next.replace(
    /((?:data-list-pane|list-browser|\.list-pane)[^{]{0,80}\{\s*)([^}]*)(\})/g,
    (all, open, body, close) => {
      const stripped = body.replace(/min-width\s*:[^;]+;?/gi, "");
      return stripped === body ? all : `${open}${stripped}${close}`;
    },
  );
  return next;
}

function isBottomChrome(text) {
  return /data-tab-bar|data-bottom-nav|\.tab-bar\b|UITabBar/.test(text);
}

function scanRelativeBottomNav(files) {
  const out = [];
  for (const f of files) {
    if (!isBottomChrome(f.text)) continue;
    const scoped = f.text.match(
      /<(nav|footer|div|header)\b[^>]*(data-tab-bar|data-bottom-nav|tab-bar)[^>]*>/i,
    );
    if (scoped && /position:\s*["']?relative["']?/.test(scoped[0])) {
      out.push(hit(f.path, "relative bottom nav"));
      continue;
    }
    if (
      /(data-tab-bar|data-bottom-nav|\.tab-bar)[^{]{0,80}\{\s*[^}]*position:\s*relative/.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "relative bottom nav"));
    }
  }
  return out;
}

function applyRelativeBottomNav(text) {
  if (!isBottomChrome(text)) return text;
  let next = text.replace(
    /(<(nav|footer|div|header)\b[^>]*(?:data-tab-bar|data-bottom-nav|tab-bar)[^>]*)(>)/gi,
    (all, open, _tag, close) => {
      const sticky = open
        .replace(/position:\s*["']relative["']/g, 'position: "sticky"')
        .replace(/position:\s*relative/g, "position: sticky");
      return `${sticky}${close}`;
    },
  );
  next = next.replace(
    /((?:data-tab-bar|data-bottom-nav|\.tab-bar)[^{]{0,80}\{\s*)([^}]*)(\})/g,
    (all, open, body, close) => {
      const sticky = body.replace(/position\s*:\s*relative/gi, "position: sticky");
      return sticky === body ? all : `${open}${sticky}${close}`;
    },
  );
  return next;
}

export const records = [
  {
    id: "dashboard-card-grid-home",
    rewrite: "host",
    scan: scanDashboardCardGrid,
    apply(text, file) {
      return applyChromeRecipe("chrome.layout.card-grid-home", file);
    },
  },
  {
    id: "list-pane-min-width-steals-detail",
    rewrite: "host",
    scan: scanListPaneMinWidth,
    apply(text, file) {
      return applyListPaneMinWidth(text);
    },
  },
  {
    id: "relative-bottom-nav-scrolls-away",
    rewrite: "host",
    scan: scanRelativeBottomNav,
    apply(text, file) {
      return applyRelativeBottomNav(text);
    },
  },
];
