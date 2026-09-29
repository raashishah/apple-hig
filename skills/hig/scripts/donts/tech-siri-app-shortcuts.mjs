import { hit } from "./shared.mjs";

function hasAppShortcut(text) {
  return (
    /\bdata-app-shortcuts\b/.test(text) ||
    /\bAppShortcutsProvider\b/.test(text) ||
    /\bSiriTipUIView\b/.test(text)
  );
}

function hasAsReskinCopy(text) {
  return (
    /re-skin/i.test(text) ||
    /shortcuts editor/i.test(text) ||
    (/reskin/i.test(text) && /siri|shortcuts/i.test(text))
  );
}

function hasAsLowercaseCopy(text) {
  return /app shortcuts/.test(text) || /the shortcuts app/.test(text);
}

function hasAsTitleItemCopy(text) {
  return (
    /written in title case/i.test(text) ||
    (/\bShortcut\b/.test(text) &&
      !/\bApp Shortcuts\b/.test(text) &&
      !/\bShortcuts\b/.test(text))
  );
}

function scanAsReskin(files) {
  const out = [];
  for (const f of files) {
    if (/data-as-reskin/.test(f.text)) {
      out.push(hit(f.path, "re-skin siri or shortcuts editor chrome"));
      continue;
    }
    if (!hasAppShortcut(f.text)) continue;
    if (hasAsReskinCopy(f.text)) {
      out.push(hit(f.path, "re-skin siri or shortcuts editor chrome"));
    }
  }
  return out;
}

function applyAsReskin(text) {
  return text.replace(/\s*data-as-reskin(?:="[^"]*")?/g, "");
}

function scanAsLowercase(files) {
  const out = [];
  for (const f of files) {
    if (/data-as-lowercase/.test(f.text)) {
      out.push(hit(f.path, "app shortcuts or shortcuts written in lowercase"));
      continue;
    }
    if (!hasAppShortcut(f.text)) continue;
    if (hasAsLowercaseCopy(f.text)) {
      out.push(hit(f.path, "app shortcuts or shortcuts written in lowercase"));
    }
  }
  return out;
}

function applyAsLowercase(text) {
  return text.replace(/\s*data-as-lowercase(?:="[^"]*")?/g, "");
}

function scanAsTitleItem(files) {
  const out = [];
  for (const f of files) {
    if (/data-as-title-item/.test(f.text)) {
      out.push(hit(f.path, "individual shortcuts written in title case"));
      continue;
    }
    if (!hasAppShortcut(f.text)) continue;
    if (hasAsTitleItemCopy(f.text)) {
      out.push(hit(f.path, "individual shortcuts written in title case"));
    }
  }
  return out;
}

function applyAsTitleItem(text) {
  return text.replace(/\s*data-as-title-item(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "as-reskin",
    rewrite: "marker",
    scan: scanAsReskin,
    apply(text, file) {
      return applyAsReskin(text);
    },
  },
  {
    id: "as-lowercase",
    rewrite: "marker",
    scan: scanAsLowercase,
    apply(text, file) {
      return applyAsLowercase(text);
    },
  },
  {
    id: "as-title-item",
    rewrite: "marker",
    scan: scanAsTitleItem,
    apply(text, file) {
      return applyAsTitleItem(text);
    },
  },
];
