import { hit, matchingBrace } from "./shared.mjs";

function scanHiddenDrag(files) {
  const out = [];
  for (const f of files) {
    const drag = /\bdraggable\b|\bonDrag\s*\(|data-drop/.test(f.text);
    if (!drag) continue;
    const hidden = /draggable[\s\S]{0,120}(hidden|sr-only|opacity:\s*0)/i.test(f.text);
    const alt = /\b(Move|Cut|Copy)\b/.test(f.text) || /aria-keyshortcuts|onKeyDown/.test(f.text);
    if (hidden && !alt) {
      out.push(hit(f.path, "hidden drag with no alternative"));
    }
  }
  return out;
}

function scanDropNavigates(files) {
  const out = [];
  for (const f of files) {
    if (
      /onDrop\s*\([\s\S]{0,400}(navigate\s*\(|router\.(push|replace)|location\.href)/i.test(
        f.text,
      ) &&
      !/preview|drag-preview|lift/i.test(f.text)
    ) {
      out.push(hit(f.path, "drop navigates away without a preview"));
    }
  }
  return out;
}

function scanFightSplitDrops(files) {
  const out = [];
  for (const f of files) {
    if (
      /UIDropProposal[\s\S]{0,80}forbidden|preventDefault\s*\([\s\S]{0,120}(splitView|multi-?window|UISplitView)/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "fighting system split-view drops"));
    }
  }
  return out;
}

function hasDragSource(text) {
  return (
    /\bdraggable\b/i.test(text) ||
    /\bdropDestination\b/.test(text) ||
    /\bonDrag\b/.test(text) ||
    /\.onDrag\b/.test(text) ||
    /\b(UIDragInteraction|UIDropInteraction|NSDragging)/.test(text) ||
    /aria-grabbed/.test(text) ||
    /data-drop(?![\w-])/.test(text)
  );
}

function hasDgMorphCopy(text) {
  return (
    /drag image is constantly and radically changing/i.test(text) ||
    /constantly and radically changing/i.test(text)
  );
}

function dragHandlerBodies(text) {
  const bodies = [];
  const re = /(?:\bonDrag(?:Over|Start)?\s*=\s*\{|\.onDrag(?:Over)?\s*\{)/gi;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].lastIndexOf("{");
    const close = matchingBrace(text, open);
    if (close < 0) continue;
    bodies.push(text.slice(open + 1, close));
  }
  return bodies;
}

function dragPreviewSwaps(text) {
  if (!hasDragSource(text)) return false;
  for (const body of dragHandlerBodies(text)) {
    const paths = new Set(
      [...body.matchAll(/["'`]([^"'`\s]+\.(?:png|jpe?g|webp|gif))["'`]/gi)].map((hitPath) =>
        hitPath[1].toLowerCase(),
      ),
    );
    if (paths.size >= 2) return true;
  }
  return false;
}

function scanDgMorph(files) {
  const out = [];
  for (const f of files) {
    if (/data-dg-morph(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a drag image that is constantly and radically changing"));
      continue;
    }
    if (!hasDragSource(f.text)) continue;
    if (hasDgMorphCopy(f.text) || dragPreviewSwaps(f.text)) {
      out.push(hit(f.path, "a drag image that is constantly and radically changing"));
    }
  }
  return out;
}

function applyDgMorph(text) {
  return text.replace(/\s*data-dg-morph(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "hidden-drag-no-alternative",
    rewrite: "marker",
    scan: scanHiddenDrag,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "drop-navigates-without-preview",
    rewrite: "marker",
    scan: scanDropNavigates,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "fight-split-view-drops",
    rewrite: "marker",
    scan: scanFightSplitDrops,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "dg-morph",
    rewrite: "marker",
    scan: scanDgMorph,
    apply(text, file) {
      return applyDgMorph(text);
    },
  },
];
