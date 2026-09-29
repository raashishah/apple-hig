import { hit, stripAttrBlocks } from "./shared.mjs";

function scanFakeInAppWidget(files) {
  const out = [];
  for (const f of files) {
    if (/\bstruct\s+\w+\s*:\s*Widget\b/.test(f.text) && /import\s+WidgetKit/.test(f.text)) {
      continue;
    }
    if (
      /data-fake-widget/.test(f.text) ||
      /class(?:Name)?=["'][^"']*\bfake-widget\b/.test(f.text) ||
      /fake Home Screen widget/i.test(f.text)
    ) {
      out.push(hit(f.path, "fake Home Screen widget in-app"));
    }
  }
  return out;
}

function applyFakeInAppWidget(text, file) {
  if (/\bstruct\s+\w+\s*:\s*Widget\b/.test(text) && /import\s+WidgetKit/.test(text)) {
    return text;
  }
  let next = stripAttrBlocks(text, "data-fake-widget");
  next = next.replace(
    /<([A-Za-z][\w]*)\b([^>]*\bclass(?:Name)?=["'][^"']*\bfake-widget\b[^>]*)>([\s\S]*?)<\/\1>\s*/gi,
    "",
  );
  return next;
}

function scanStretchSmallWidget(files) {
  const out = [];
  for (const f of files) {
    if (/data-widget-stretch/.test(f.text) || /stretch a small widget/i.test(f.text)) {
      out.push(hit(f.path, "small widget stretched to large"));
    }
  }
  return out;
}

function applyStretchSmallWidget(text) {
  return text.replace(/\s*data-widget-stretch(?:="[^"]*")?/g, "");
}

function scanAppIconAsWidget(files) {
  const out = [];
  for (const f of files) {
    const widget = /\bstruct\s+\w+\s*:\s*Widget\b/.test(f.text) || /data-widget-app-icon/.test(f.text);
    if (!widget) continue;
    if (/Image\(["']AppIcon["']\)|data-widget-app-icon/.test(f.text)) {
      out.push(hit(f.path, "app icon used as the widget"));
    }
  }
  return out;
}

export const records = [
  {
    id: "fake-in-app-widget",
    rewrite: "host",
    scan: scanFakeInAppWidget,
    apply(text, file) {
      return applyFakeInAppWidget(text, file);
    },
  },
  {
    id: "stretch-small-widget-large",
    rewrite: "marker",
    scan: scanStretchSmallWidget,
    apply(text, file) {
      return applyStretchSmallWidget(text);
    },
  },
  {
    id: "app-icon-as-widget",
    rewrite: "marker",
    scan: scanAppIconAsWidget,
    apply(text, file) {
      return text;
    },
  },
];
