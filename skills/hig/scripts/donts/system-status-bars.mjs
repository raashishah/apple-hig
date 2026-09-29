import { hit, stripAttrBlocks } from "./shared.mjs";

function scanStatusBarHidden(files) {
  const out = [];
  for (const f of files) {
    if (/data-status-bar-hidden/.test(f.text)) {
      out.push(hit(f.path, "status bar permanently hidden"));
      continue;
    }
    if (
      /prefersStatusBarHidden[\s\S]{0,80}\{\s*true\s*\}/.test(f.text) &&
      !/\b(isVideo|isFullscreen|AVPlayer|immersive)\b/.test(f.text)
    ) {
      out.push(hit(f.path, "status bar permanently hidden"));
    }
  }
  return out;
}

function applyStatusBarHidden(text) {
  let next = text.replace(/\s*data-status-bar-hidden(?:="[^"]*")?/g, "");
  next = next.replace(
    /(prefersStatusBarHidden[\s\S]{0,80}\{\s*)true(\s*\})/,
    "$1false$2",
  );
  return next;
}

function scanFakeStatusClock(files) {
  const out = [];
  for (const f of files) {
    if (
      /data-fake-status-bar/.test(f.text) ||
      /class(?:Name)?=["'][^"']*\bfake-status-clock\b/.test(f.text)
    ) {
      out.push(hit(f.path, "fake clock covering the status bar"));
    }
  }
  return out;
}

function applyFakeStatusClock(text) {
  let next = stripAttrBlocks(text, "data-fake-status-bar");
  next = next.replace(
    /<([A-Za-z][\w]*)\b([^>]*\bclass(?:Name)?=["'][^"']*\bfake-status-clock\b[^>]*)>([\s\S]*?)<\/\1>\s*/gi,
    "",
  );
  return next;
}

function scanOpaqueStatusStrip(files) {
  const out = [];
  for (const f of files) {
    if (/data-status-bar-fill/.test(f.text)) {
      out.push(hit(f.path, "opaque strip on the status bar"));
    }
  }
  return out;
}

function applyOpaqueStatusStrip(text) {
  return text.replace(
    /<(header|div|nav|section)\b([^>]*data-status-bar-fill[^>]*)>/gi,
    (all, tag, attrs) => {
      const next = attrs
        .replace(/\s*data-status-bar-fill(?:="[^"]*")?/g, "")
        .replace(/background(?:Color)?\s*:\s*["']?#[0-9a-fA-F]{3,8}["']?\s*,?/gi, "")
        .replace(/background(?:-color)?\s*:\s*#[0-9a-fA-F]{3,8}\s*;?/gi, "");
      return `<${tag}${next}>`;
    },
  );
}

export const records = [
  {
    id: "status-bar-always-hidden",
    rewrite: "host",
    scan: scanStatusBarHidden,
    apply(text, file) {
      return applyStatusBarHidden(text);
    },
  },
  {
    id: "fake-status-clock",
    rewrite: "host",
    scan: scanFakeStatusClock,
    apply(text, file) {
      return applyFakeStatusClock(text);
    },
  },
  {
    id: "opaque-status-strip",
    rewrite: "host",
    scan: scanOpaqueStatusStrip,
    apply(text, file) {
      return applyOpaqueStatusStrip(text);
    },
  },
];
