import { hit, blocksWithAttr, hasPageControlWidget } from "./shared.mjs";

function overflowAxisFromHint(hint) {
  const h = String(hint || "");
  if (
    /overflow-x(?:-auto|-scroll)\b/i.test(h) ||
    /overflow-x\s*:\s*(auto|scroll)/i.test(h) ||
    /overflowX\s*:\s*["'](auto|scroll)["']/i.test(h)
  ) {
    return "x";
  }
  if (
    /overflow-y(?:-auto|-scroll)\b/i.test(h) ||
    /overflow-y\s*:\s*(auto|scroll)/i.test(h) ||
    /overflowY\s*:\s*["'](auto|scroll)["']/i.test(h)
  ) {
    return "y";
  }
  if (
    /\boverflow-(?:auto|scroll)\b/i.test(h) ||
    /(?:^|[^-])overflow\s*:\s*(auto|scroll)/i.test(h) ||
    /overflow\s*:\s*["'](auto|scroll)["']/i.test(h)
  ) {
    return "both";
  }
  return null;
}

function axesOverlap(a, b) {
  if (!a || !b) return false;
  if (a === "both" || b === "both") return true;
  return a === b;
}

function tagOverflowAxis(open) {
  const style = /style=["']([^"']*)["']/i.exec(open);
  const cls = /class(Name)?=["']([^"']*)["']/i.exec(open);
  return overflowAxisFromHint(`${style ? style[1] : ""} ${cls ? cls[2] : ""} ${open}`);
}

function innerAfterOpen(text, tag, start) {
  let i = start;
  let depth = 1;
  const reopen = new RegExp(`<${tag}\\b`, "gi");
  const close = new RegExp(`</${tag}\\s*>`, "gi");
  while (depth > 0 && i < text.length) {
    reopen.lastIndex = i;
    close.lastIndex = i;
    const nOpen = reopen.exec(text);
    const nClose = close.exec(text);
    if (!nClose) return text.slice(start, Math.min(text.length, start + 4000));
    if (nOpen && nOpen.index < nClose.index) {
      depth += 1;
      i = nOpen.index + nOpen[0].length;
    } else {
      depth -= 1;
      i = nClose.index + nClose[0].length;
    }
  }
  return text.slice(start, i);
}

function hasNestedSameAxisOverflow(text) {
  const re = /<([A-Za-z][\w]*)\b[^>]*>/g;
  let m;
  while ((m = re.exec(text))) {
    const tag = m[1];
    if (/^(html|body)$/i.test(tag)) continue;
    const axis = tagOverflowAxis(m[0]);
    if (!axis) continue;
    const inner = innerAfterOpen(text, tag, m.index + m[0].length);
    const innerRe = /<([A-Za-z][\w]*)\b[^>]*>/g;
    let im;
    while ((im = innerRe.exec(inner))) {
      if (/^(html|body)$/i.test(im[1])) continue;
      const iaxis = tagOverflowAxis(im[0]);
      if (axesOverlap(axis, iaxis)) return true;
    }
  }
  return false;
}

function nestedScrollViewSameAxis(text) {
  const re =
    /ScrollView((?:\(\s*\.(horizontal|vertical)\s*\))?)\s*\{[\s\S]{0,2500}?ScrollView((?:\(\s*\.(horizontal|vertical)\s*\))?)\s*\{/;
  const m = re.exec(text);
  if (!m) return false;
  const a = /horizontal/.test(m[1] || "") ? "x" : "y";
  const b = /horizontal/.test(m[3] || "") ? "x" : "y";
  return a === b;
}

function scanNestedSameAxisScroll(files) {
  const out = [];
  for (const f of files) {
    if (/data-nested-same-axis-scroll/.test(f.text)) {
      out.push(hit(f.path, "nested same-axis scroll"));
      continue;
    }
    if (nestedScrollViewSameAxis(f.text) || hasNestedSameAxisOverflow(f.text)) {
      out.push(hit(f.path, "nested same-axis scroll"));
    }
  }
  return out;
}

function applyNestedSameAxisScroll(text) {
  return text.replace(/\s*data-nested-same-axis-scroll(?:="[^"]*")?/g, "");
}

function hasScrollPane(text) {
  if (/\bScrollView\s*[\({]/.test(text)) return true;
  if (/\b(?:UIScrollView|NSScrollView)\b/.test(text)) return true;
  if (/data-scroll-view(?![\w-])/.test(text)) return true;
  if (/data-nested-same-axis-scroll(?![\w-])/.test(text)) return true;
  const tagRe = /<([A-Za-z][\w]*)\b[^>]*>/g;
  let m;
  while ((m = tagRe.exec(text))) {
    if (/^(html|body)$/i.test(m[1])) continue;
    if (tagOverflowAxis(m[0])) return true;
  }
  const cssRe = /([^{]+)\{([^}]*)\}/g;
  while ((m = cssRe.exec(text))) {
    if (!/overflow(?:-(?:x|y))?\s*:\s*(auto|scroll)/i.test(m[2])) continue;
    const parts = m[1]
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .split(",")
      .map((p) => (p.trim().split(/\s+/).pop() || "").trim())
      .filter(Boolean);
    if (!parts.length) continue;
    if (parts.every((p) => /^(html|body|:root|#root|#__next|#app)$/i.test(p))) continue;
    if (parts.every((p) => /^[#.]?[A-Za-z][\w-]*$/.test(p))) return true;
  }
  return false;
}

function scrollIndicatorHidden(text) {
  if (/\.scrollIndicators\(\s*\.hidden\s*\)/.test(text)) return true;
  if (/showsIndicators\s*:\s*false\b/.test(text)) return true;
  if (
    /showsVerticalScrollIndicator\s*=\s*false\b/.test(text) &&
    /showsHorizontalScrollIndicator\s*=\s*false\b/.test(text)
  ) {
    return true;
  }
  if (/scrollbar-width\s*:\s*none\b/i.test(text)) return true;
  if (/scrollbarWidth\s*:\s*["']none["']/.test(text)) return true;
  return false;
}

function hasScrollIndicatorCopy(text) {
  return (
    /don.?t show the scrolling indicator/i.test(text) ||
    /scrolling indicator on a scroll view/i.test(text)
  );
}

function scanScrollIndicator(files) {
  const out = [];
  for (const f of files) {
    if (/data-sv-indicator(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a scrolling indicator on a scroll view that also shows a page control"));
      continue;
    }
    if (!hasScrollPane(f.text) || !hasPageControlWidget(f.text)) continue;
    if (hasScrollIndicatorCopy(f.text) || !scrollIndicatorHidden(f.text)) {
      out.push(hit(f.path, "a scrolling indicator on a scroll view that also shows a page control"));
    }
  }
  return out;
}

function applyScrollIndicator(text) {
  return text.replace(/\s*data-sv-indicator(?:="[^"]*")?(?![\w-])/g, "");
}

function lookListRegions(text) {
  return blocksWithAttr(text, "data-look-scroll").filter((block) =>
    /<(ul|ol|table)\b/i.test(block.text) ||
    /\bList\s*[\({]/.test(block.text) ||
    /\bUITableView\b/.test(block.text) ||
    /\bNSTableView\b/.test(block.text),
  );
}

function hasLookOnList(text) {
  if (/<(ul|ol|table)\b[^>]*\bdata-look-scroll(?![\w-])/i.test(text)) return true;
  if (lookListRegions(text).length > 0) return true;
  if (/List\s*[\({][\s\S]{0,800}?scrollInputKind\s*\(\s*\.look\b/.test(text)) return true;
  if (/scrollInputKind\s*\(\s*\.look\b[\s\S]{0,400}?\bList\s*[\({]/.test(text)) return true;
  if (/\bUITableView\b[\s\S]{0,600}?scrollInputKind\s*\(\s*\.look\b/.test(text)) return true;
  if (/\bNSTableView\b[\s\S]{0,600}?scrollInputKind\s*\(\s*\.look\b/.test(text)) return true;
  if (/\bScrollInputKind\.look\b[\s\S]{0,600}?<(ul|ol|table)\b/i.test(text)) return true;
  return false;
}

function hasLookListCopy(text) {
  return /look to scroll for secondary content/i.test(text) || /look to scroll on a list/i.test(text);
}

function hasLookListWidget(text) {
  return (
    /<(ul|ol|table)\b/i.test(text) ||
    /\bList\s*[\({]/.test(text) ||
    /\bUITableView\b/.test(text) ||
    /\bNSTableView\b/.test(text)
  );
}

function scanLookOnList(files) {
  const out = [];
  for (const f of files) {
    if (/data-sv-look(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "Look to Scroll on a list"));
      continue;
    }
    if (hasLookOnList(f.text)) {
      out.push(hit(f.path, "Look to Scroll on a list"));
      continue;
    }
    if (!hasScrollPane(f.text) || !hasLookListWidget(f.text)) continue;
    if (hasLookListCopy(f.text)) out.push(hit(f.path, "Look to Scroll on a list"));
  }
  return out;
}

function applyLookOnList(text) {
  return text.replace(/\s*data-sv-look(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "nested-same-axis-scroll",
    rewrite: "marker",
    scan: scanNestedSameAxisScroll,
    apply(text, file) {
      return applyNestedSameAxisScroll(text);
    },
  },
  {
    id: "sv-indicator",
    rewrite: "marker",
    scan: scanScrollIndicator,
    apply(text, file) {
      return applyScrollIndicator(text);
    },
  },
  {
    id: "sv-look",
    rewrite: "marker",
    scan: scanLookOnList,
    apply(text, file) {
      return applyLookOnList(text);
    },
  },
];
