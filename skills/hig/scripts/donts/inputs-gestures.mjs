import { hit } from "./shared.mjs";

function hasGesture(text) {
  return (
    /\bdata-gesture\b/.test(text) ||
    /\bonTapGesture\b/.test(text) ||
    /\bUITapGestureRecognizer\b/.test(text) ||
    /\bUISwipeGestureRecognizer\b/.test(text) ||
    /\bUIPanGestureRecognizer\b/.test(text) ||
    /\bDragGesture\b/.test(text)
  );
}

function hasGsUniqueCopy(text) {
  return /tap-to-delete with no button/i.test(text) || /unique meaning for tap or swipe/i.test(text);
}

function hasGsEdgeCopy(text) {
  return /edge swipes that fight system Home/i.test(text);
}

function hasGsOnlyCopy(text) {
  return /gesture-only navigation/i.test(text) || /no toolbar Back/i.test(text);
}

function scanGsUniqueTap(files) {
  const out = [];
  for (const f of files) {
    if (/data-gs-unique/.test(f.text)) {
      out.push(hit(f.path, "unique meaning for tap or swipe"));
      continue;
    }
    if (!hasGesture(f.text)) continue;
    if (hasGsUniqueCopy(f.text)) {
      out.push(hit(f.path, "unique meaning for tap or swipe"));
    }
  }
  return out;
}

function scanGsEdgeSwipe(files) {
  const out = [];
  for (const f of files) {
    if (/data-gs-edge/.test(f.text)) {
      out.push(hit(f.path, "edge swipes that fight system Home"));
      continue;
    }
    if (!hasGesture(f.text)) continue;
    if (hasGsEdgeCopy(f.text)) {
      out.push(hit(f.path, "edge swipes that fight system Home"));
    }
  }
  return out;
}

function scanGsGestureOnly(files) {
  const out = [];
  for (const f of files) {
    if (/data-gs-only/.test(f.text)) {
      out.push(hit(f.path, "gesture-only navigation with no toolbar Back"));
      continue;
    }
    if (!hasGesture(f.text)) continue;
    if (hasGsOnlyCopy(f.text)) {
      out.push(hit(f.path, "gesture-only navigation with no toolbar Back"));
    }
  }
  return out;
}

function applyGsUniqueTap(text) {
  return text.replace(/\s*data-gs-unique(?:="[^"]*")?/g, "");
}

function applyGsEdgeSwipe(text) {
  return text.replace(/\s*data-gs-edge(?:="[^"]*")?/g, "");
}

function applyGsGestureOnly(text) {
  return text.replace(/\s*data-gs-only(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "gs-unique-tap",
    rewrite: "marker",
    scan: scanGsUniqueTap,
    apply(text, file) {
      return applyGsUniqueTap(text);
    },
  },
  {
    id: "gs-edge-swipe",
    rewrite: "marker",
    scan: scanGsEdgeSwipe,
    apply(text, file) {
      return applyGsEdgeSwipe(text);
    },
  },
  {
    id: "gs-gesture-only",
    rewrite: "marker",
    scan: scanGsGestureOnly,
    apply(text, file) {
      return applyGsGestureOnly(text);
    },
  },
];
