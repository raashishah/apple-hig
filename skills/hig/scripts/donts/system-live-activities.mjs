import { hit, stripAttrBlocks } from "./shared.mjs";

function scanPointAtIsland(files) {
  const out = [];
  for (const f of files) {
    if (
      /data-dynamic-island-pointer/.test(f.text) ||
      /look up at the Dynamic Island/i.test(f.text)
    ) {
      out.push(hit(f.path, "in-app pointer at Dynamic Island"));
    }
  }
  return out;
}

function applyPointAtIsland(text) {
  return stripAttrBlocks(text, "data-dynamic-island-pointer").replace(
    /\s*look up at the Dynamic Island\.?/gi,
    "",
  );
}

function isLiveActivityFile(file) {
  return (
    /import\s+ActivityKit/.test(file.text) ||
    /\bActivityAttributes\b/.test(file.text) ||
    /data-live-activity/.test(file.text)
  );
}

function scanLiveActivityAppIcon(files) {
  const out = [];
  for (const f of files) {
    if (!isLiveActivityFile(f)) continue;
    if (/Image\(["']AppIcon["']\)|data-live-activity-icon/.test(f.text)) {
      out.push(hit(f.path, "full app icon on a Live Activity"));
    }
  }
  return out;
}

function applyLiveActivityAppIcon(text, file) {
  if (!isLiveActivityFile(file)) return text;
  let next = stripAttrBlocks(text, "data-live-activity-icon");
  next = next.replace(/\s*Image\(["']AppIcon["']\)/g, "");
  return next;
}

function scanLiveActivityAds(files) {
  const out = [];
  for (const f of files) {
    if (!isLiveActivityFile(f) && !/data-live-activity-ad/.test(f.text)) continue;
    if (
      /data-live-activity-ad/.test(f.text) ||
      (isLiveActivityFile(f) && /\b(sponsored|advertisement|buy now)\b/i.test(f.text))
    ) {
      out.push(hit(f.path, "ads in a Live Activity"));
    }
  }
  return out;
}

function applyLiveActivityAds(text) {
  return stripAttrBlocks(text, "data-live-activity-ad");
}

export const records = [
  {
    id: "point-at-dynamic-island",
    rewrite: "host",
    scan: scanPointAtIsland,
    apply(text, file) {
      return applyPointAtIsland(text);
    },
  },
  {
    id: "live-activity-full-app-icon",
    rewrite: "host",
    scan: scanLiveActivityAppIcon,
    apply(text, file) {
      return applyLiveActivityAppIcon(text, file);
    },
  },
  {
    id: "live-activity-ads",
    rewrite: "host",
    scan: scanLiveActivityAds,
    apply(text, file) {
      return applyLiveActivityAds(text);
    },
  },
];
