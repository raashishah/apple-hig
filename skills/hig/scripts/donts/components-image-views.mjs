import { hit } from "./shared.mjs";

function hasImageViewWidget(text) {
  return (
    /\bdata-image-view\b/.test(text) ||
    /\bUIImageView\b/.test(text) ||
    /\bNSImageView\b/.test(text) ||
    /\bAsyncImage\s*\(/.test(text)
  );
}

function scanImageViewAsButton(files) {
  const out = [];
  for (const f of files) {
    if (/data-interactive-image-view/.test(f.text)) {
      out.push(hit(f.path, "button behaviors on an image view"));
      continue;
    }
    if (!hasImageViewWidget(f.text)) continue;
    if (
      /\bon(Click|TapGesture)\b/.test(f.text) ||
      /role=["']button["']/i.test(f.text)
    ) {
      out.push(hit(f.path, "button behaviors on an image view"));
    }
  }
  return out;
}

function applyImageViewAsButton(text) {
  return text.replace(/\s*data-interactive-image-view(?:="[^"]*")?/g, "");
}

function scanImageViewAsIcon(files) {
  const out = [];
  for (const f of files) {
    if (/data-icon-image-view/.test(f.text)) {
      out.push(hit(f.path, "image view for an interface icon"));
    }
  }
  return out;
}

function applyImageViewAsIcon(text) {
  return text.replace(/\s*data-icon-image-view(?:="[^"]*")?/g, "");
}

function scanTextOverlayOnImageView(files) {
  const out = [];
  for (const f of files) {
    if (/data-text-on-image-view/.test(f.text)) {
      out.push(hit(f.path, "overlaying text on an image view"));
    }
  }
  return out;
}

function applyTextOverlayOnImageView(text) {
  return text.replace(/\s*data-text-on-image-view(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "image-view-as-button",
    rewrite: "marker",
    scan: scanImageViewAsButton,
    apply(text, file) {
      return applyImageViewAsButton(text);
    },
  },
  {
    id: "image-view-as-icon",
    rewrite: "marker",
    scan: scanImageViewAsIcon,
    apply(text, file) {
      return applyImageViewAsIcon(text);
    },
  },
  {
    id: "text-overlay-on-image-view",
    rewrite: "marker",
    scan: scanTextOverlayOnImageView,
    apply(text, file) {
      return applyTextOverlayOnImageView(text);
    },
  },
];
