import { hit } from "./shared.mjs";

function hasFullscreen(text) {
  return (
    /\bdata-fullscreen\b/.test(text) ||
    /\brequestFullscreen\s*\(/.test(text) ||
    /\bwebkitRequestFullscreen\s*\(/.test(text) ||
    /\btoggleFullScreen\s*\(/.test(text) ||
    /\bfullScreenCover\s*\(/.test(text)
  );
}

function scanProgrammaticFullscreenResize(files) {
  const out = [];
  for (const f of files) {
    if (/data-programmatic-resize/.test(f.text)) {
      out.push(hit(f.path, "window programmatically resized for full-screen"));
      continue;
    }
    if (!hasFullscreen(f.text)) continue;
    if (/\bresizeTo\s*\(/.test(f.text)) {
      out.push(hit(f.path, "window programmatically resized for full-screen"));
    }
  }
  return out;
}

function applyProgrammaticFullscreenResize(text) {
  return text.replace(/\s*data-programmatic-resize(?:="[^"]*")?/g, "");
}

function scanAutoExitFullscreen(files) {
  const out = [];
  for (const f of files) {
    if (/data-auto-exit-fullscreen/.test(f.text)) {
      out.push(hit(f.path, "full-screen mode that ends automatically"));
    }
  }
  return out;
}

function applyAutoExitFullscreen(text) {
  return text.replace(/\s*data-auto-exit-fullscreen(?:="[^"]*")?/g, "");
}

function scanCustomWindowModeMenu(files) {
  const out = [];
  for (const f of files) {
    if (/data-custom-window-mode-menu/.test(f.text)) {
      out.push(hit(f.path, "custom menu of window modes"));
    }
  }
  return out;
}

function applyCustomWindowModeMenu(text) {
  return text.replace(/\s*data-custom-window-mode-menu(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "programmatic-fullscreen-resize",
    rewrite: "marker",
    scan: scanProgrammaticFullscreenResize,
    apply(text, file) {
      return applyProgrammaticFullscreenResize(text);
    },
  },
  {
    id: "auto-exit-fullscreen",
    rewrite: "marker",
    scan: scanAutoExitFullscreen,
    apply(text, file) {
      return applyAutoExitFullscreen(text);
    },
  },
  {
    id: "custom-window-mode-menu",
    rewrite: "marker",
    scan: scanCustomWindowModeMenu,
    apply(text, file) {
      return applyCustomWindowModeMenu(text);
    },
  },
];
