import { hit } from "./shared.mjs";

function hasPointer(text) {
  return (
    /\bdata-pointer\b/.test(text) ||
    /\bUIPointerStyle\b/.test(text) ||
    /\bUIPointerInteraction\b/.test(text) ||
    /\bNSCursor\b/.test(text) ||
    /\bcursor:\s*url\(/.test(text)
  );
}

function hasPtInstructCopy(text) {
  return /instructional text (?:displayed )?with a pointer/i.test(text);
}

function hasPtDecorativeCopy(text) {
  return /purely decorative pointer/i.test(text) || /gratuitous pointer/i.test(text);
}

function scanPtInstruct(files) {
  const out = [];
  for (const f of files) {
    if (/data-pt-instruct/.test(f.text)) {
      out.push(hit(f.path, "instructional text displayed with a pointer"));
      continue;
    }
    if (!hasPointer(f.text)) continue;
    if (hasPtInstructCopy(f.text)) {
      out.push(hit(f.path, "instructional text displayed with a pointer"));
    }
  }
  return out;
}

function scanPtDecorative(files) {
  const out = [];
  for (const f of files) {
    if (/data-pt-decorative/.test(f.text)) {
      out.push(hit(f.path, "a purely decorative pointer effect"));
      continue;
    }
    if (!hasPointer(f.text)) continue;
    if (hasPtDecorativeCopy(f.text)) out.push(hit(f.path, "a purely decorative pointer effect"));
  }
  return out;
}

function applyPtInstruct(text) {
  return text.replace(/\s*data-pt-instruct(?:="[^"]*")?/g, "");
}

function applyPtDecorative(text) {
  return text.replace(/\s*data-pt-decorative(?:="[^"]*")?/g, "");
}

function hasPtTrackCopy(text) {
  return /redefining systemwide trackpad gestures/i.test(text);
}

function hasRedefinedSystemTrackpad(text) {
  if (!hasPointer(text)) return false;
  if (/\bswipeBetweenPages\s*[:=]/.test(text)) return true;
  if (/\b(?:missionControl|revealDock)\s*[:=]\s*(?:custom|true|\{)/.test(text)) return true;
  return /trackpadGesture\s*=\s*["'](?:mission-control|dock-reveal|swipe-between-pages)["']/i.test(text);
}

function scanPtTrack(files) {
  const out = [];
  for (const f of files) {
    if (/data-pt-track(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a redefined systemwide trackpad gesture"));
      continue;
    }
    if (!hasPointer(f.text)) continue;
    if (hasPtTrackCopy(f.text) || hasRedefinedSystemTrackpad(f.text)) {
      out.push(hit(f.path, "a redefined systemwide trackpad gesture"));
    }
  }
  return out;
}

function applyPtTrack(text) {
  return text.replace(/\s*data-pt-track(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "pt-instruct",
    rewrite: "marker",
    scan: scanPtInstruct,
    apply(text, file) {
      return applyPtInstruct(text);
    },
  },
  {
    id: "pt-decorative",
    rewrite: "marker",
    scan: scanPtDecorative,
    apply(text, file) {
      return applyPtDecorative(text);
    },
  },
  {
    id: "pt-track",
    rewrite: "marker",
    scan: scanPtTrack,
    apply(text, file) {
      return applyPtTrack(text);
    },
  },
];
