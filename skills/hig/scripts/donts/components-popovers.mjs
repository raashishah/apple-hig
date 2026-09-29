import { hit, blocksWithAttr } from "./shared.mjs";

function hasNestedPopoverTags(text) {
  return blocksWithAttr(text, "popover").some((b) => {
    const inner = b.text.replace(/^<[^>]+>/, "");
    return /<[A-Za-z][\w]*\b[^>]*\spopover(?:\s|=|\/|>)/i.test(inner);
  });
}

function scanCascadePopover(files) {
  const out = [];
  for (const f of files) {
    if (/data-nested-popover/.test(f.text)) {
      out.push(hit(f.path, "cascade popovers"));
      continue;
    }
    if (hasNestedPopoverTags(f.text)) {
      out.push(hit(f.path, "cascade popovers"));
      continue;
    }
    if (/\.popover\s*\([\s\S]{0,1500}?\.popover\s*\(/.test(f.text)) {
      out.push(hit(f.path, "cascade popovers"));
    }
  }
  return out;
}

function applyCascadePopover(text) {
  return text.replace(/\s*data-nested-popover(?:="[^"]*")?/g, "");
}

function scanPopoverAsWarning(files) {
  const out = [];
  for (const f of files) {
    if (/data-popover-warning/.test(f.text)) {
      out.push(hit(f.path, "popover as warning"));
      continue;
    }
    const blocks = [
      ...blocksWithAttr(f.text, "popover"),
      ...blocksWithAttr(f.text, "data-popover"),
    ];
    if (
      blocks.some((b) =>
        /role=["']alertdialog["']|<h[1-6][^>]*>\s*warning\b/i.test(b.text),
      )
    ) {
      out.push(hit(f.path, "popover as warning"));
    }
  }
  return out;
}

function applyPopoverAsWarning(text) {
  return text.replace(/\s*data-popover-warning(?:="[^"]*")?/g, "");
}

function scanPopoverOnCompact(files) {
  const out = [];
  for (const f of files) {
    if (/data-popover-compact/.test(f.text)) {
      out.push(hit(f.path, "popover on compact"));
      continue;
    }
    if (/\.presentationCompactAdaptation\(\s*\.popover\s*\)/.test(f.text)) {
      out.push(hit(f.path, "popover on compact"));
    }
  }
  return out;
}

function applyPopoverOnCompact(text) {
  return text
    .replace(/\s*data-popover-compact(?:="[^"]*")?/g, "")
    .replace(/\s*\.presentationCompactAdaptation\(\s*\.popover\s*\)/g, "");
}

export const records = [
  {
    id: "cascade-popover",
    rewrite: "marker",
    scan: scanCascadePopover,
    apply(text, file) {
      return applyCascadePopover(text);
    },
  },
  {
    id: "popover-as-warning",
    rewrite: "marker",
    scan: scanPopoverAsWarning,
    apply(text, file) {
      return applyPopoverAsWarning(text);
    },
  },
  {
    id: "popover-on-compact",
    rewrite: "host",
    scan: scanPopoverOnCompact,
    apply(text, file) {
      return applyPopoverOnCompact(text);
    },
  },
];
