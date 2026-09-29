import { hit, blocksWithAttr, hasPageControlWidget } from "./shared.mjs";

function pageControlNumberOfPages(text) {
  const nums = [...String(text).matchAll(/numberOfPages\s*[:=]\s*\{?\s*(\d+)/g)].map((m) =>
    Number(m[1]),
  );
  return nums.length ? Math.max(...nums) : 0;
}

function countPageControlDots(text) {
  let max = pageControlNumberOfPages(text);
  for (const b of blocksWithAttr(text, "data-page-control")) {
    const buttons = b.text.match(/<button\b/gi) || [];
    const dots = b.text.match(/data-page-dot/g) || [];
    max = Math.max(max, buttons.length, dots.length);
  }
  return max;
}

function isMinimalPageStyle(chunk) {
  return (
    /data-page-minimal(?![\w-])/.test(chunk) ||
    /backgroundStyle\s*[:=]\s*\.minimal\b/.test(chunk) ||
    /\.backgroundStyle\(\s*\.minimal\s*\)/.test(chunk)
  );
}

function hasPageScrubber(chunk) {
  return (
    /data-page-scrub(?![\w-])/.test(chunk) ||
    /allowsContinuousInteraction\s*[:=]\s*true\b/.test(chunk) ||
    /\.allowsContinuousInteraction\(\s*true\s*\)/.test(chunk)
  );
}

function hasMinimalScrubCopy(text) {
  return (
    /supporting the scrubber when you use the minimal/i.test(text) ||
    /scrubber on a page control that uses the minimal/i.test(text)
  );
}

function minimalScrubPage(text) {
  const blocks = [
    ...blocksWithAttr(text, "data-page-control"),
    ...blocksWithAttr(text, "data-carousel-dots"),
  ];
  if (blocks.some((b) => isMinimalPageStyle(b.text) && hasPageScrubber(b.text))) return true;
  const re = /\b(?:UIPageControl|PageControl)\s*[\({]/g;
  let m;
  while ((m = re.exec(text))) {
    const window = text.slice(m.index, m.index + 600);
    if (isMinimalPageStyle(window) && hasPageScrubber(window)) return true;
  }
  return false;
}

function scanMinimalPageScrub(files) {
  const out = [];
  for (const f of files) {
    if (/data-pgc-scrub(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a scrubber on a page control that uses the minimal background style"));
      continue;
    }
    if (!hasPageControlWidget(f.text)) continue;
    if (hasMinimalScrubCopy(f.text) || minimalScrubPage(f.text)) {
      out.push(hit(f.path, "a scrubber on a page control that uses the minimal background style"));
    }
  }
  return out;
}

function applyMinimalPageScrub(text) {
  return text.replace(/\s*data-pgc-scrub(?:="[^"]*")?(?![\w-])/g, "");
}

function pageScrubChunks(text) {
  const out = [
    ...blocksWithAttr(text, "data-page-control").map((b) => b.text),
    ...blocksWithAttr(text, "data-carousel-dots").map((b) => b.text),
  ];
  const re = /\b(?:UIPageControl|PageControl)\s*[\({]/g;
  let m;
  while ((m = re.exec(text))) out.push(text.slice(m.index, m.index + 700));
  return out;
}

function chunkAnimatesPage(chunk) {
  return (
    /scroll-behavior\s*:\s*smooth/i.test(chunk) ||
    /scrollBehavior\s*:\s*["']smooth["']/.test(chunk) ||
    /\bwithAnimation\s*\(/.test(chunk) ||
    /\.animation\s*\(/.test(chunk) ||
    /\banimated\s*:\s*true\b/.test(chunk)
  );
}

function hasScrubAnimCopy(text) {
  return (
    /animating page transitions during scrubbing/i.test(text) ||
    /animated page transition while a page control is scrubbing/i.test(text)
  );
}

function scrubAnimates(text) {
  return pageScrubChunks(text).some((chunk) => hasPageScrubber(chunk) && chunkAnimatesPage(chunk));
}

function scanScrubAnimation(files) {
  const out = [];
  for (const f of files) {
    if (/data-pgc-anim(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an animated page transition while a page control is scrubbing"));
      continue;
    }
    if (!hasPageControlWidget(f.text)) continue;
    if (hasScrubAnimCopy(f.text) || scrubAnimates(f.text)) {
      out.push(hit(f.path, "an animated page transition while a page control is scrubbing"));
    }
  }
  return out;
}

function applyScrubAnimation(text) {
  return text.replace(/\s*data-pgc-anim(?:="[^"]*")?(?![\w-])/g, "");
}

function scanPageControlAsHierarchy(files) {
  const out = [];
  for (const f of files) {
    if (/data-hierarchical-page-control/.test(f.text)) {
      out.push(hit(f.path, "hierarchical page control"));
    }
  }
  return out;
}

function applyPageControlAsHierarchy(text) {
  return text.replace(/\s*data-hierarchical-page-control(?:="[^"]*")?/g, "");
}

function scanTooManyPageDots(files) {
  const out = [];
  for (const f of files) {
    if (/data-too-many-page-dots/.test(f.text)) {
      out.push(hit(f.path, "too many page-control dots"));
      continue;
    }
    if (!hasPageControlWidget(f.text) && pageControlNumberOfPages(f.text) < 11) continue;
    if (countPageControlDots(f.text) >= 11) {
      out.push(hit(f.path, "too many page-control dots"));
    }
  }
  return out;
}

function applyTooManyPageDots(text) {
  return text.replace(/\s*data-too-many-page-dots(?:="[^"]*")?/g, "");
}

function scanTooManyPageIndicatorImages(files) {
  const out = [];
  for (const f of files) {
    if (/data-many-page-indicator-images/.test(f.text)) {
      out.push(hit(f.path, "too many page-control indicator images"));
      continue;
    }
    if (!hasPageControlWidget(f.text)) continue;
    const images = f.text.match(/<(img|Image)\b/gi) || [];
    const symbols = f.text.match(/systemName:\s*["'][^"']+["']/g) || [];
    if (images.length + symbols.length > 2) {
      out.push(hit(f.path, "too many page-control indicator images"));
    }
  }
  return out;
}

function applyTooManyPageIndicatorImages(text) {
  return text.replace(/\s*data-many-page-indicator-images(?:="[^"]*")?/g, "");
}

function scanColoredPageIndicators(files) {
  const out = [];
  for (const f of files) {
    if (/data-colored-page-indicators/.test(f.text)) {
      out.push(hit(f.path, "colored page-control indicators"));
      continue;
    }
    if (!hasPageControlWidget(f.text)) continue;
    if (
      /pageIndicatorTintColor/.test(f.text) ||
      /currentPageIndicatorTintColor/.test(f.text) ||
      /--page-indicator-color/.test(f.text)
    ) {
      out.push(hit(f.path, "colored page-control indicators"));
    }
  }
  return out;
}

function applyColoredPageIndicators(text) {
  return text.replace(/\s*data-colored-page-indicators(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "page-control-as-hierarchy",
    rewrite: "marker",
    scan: scanPageControlAsHierarchy,
    apply(text, file) {
      return applyPageControlAsHierarchy(text);
    },
  },
  {
    id: "too-many-page-dots",
    rewrite: "marker",
    scan: scanTooManyPageDots,
    apply(text, file) {
      return applyTooManyPageDots(text);
    },
  },
  {
    id: "too-many-page-indicator-images",
    rewrite: "marker",
    scan: scanTooManyPageIndicatorImages,
    apply(text, file) {
      return applyTooManyPageIndicatorImages(text);
    },
  },
  {
    id: "colored-page-indicators",
    rewrite: "marker",
    scan: scanColoredPageIndicators,
    apply(text, file) {
      return applyColoredPageIndicators(text);
    },
  },
  {
    id: "pgc-scrub",
    rewrite: "marker",
    scan: scanMinimalPageScrub,
    apply(text, file) {
      return applyMinimalPageScrub(text);
    },
  },
  {
    id: "pgc-anim",
    rewrite: "marker",
    scan: scanScrubAnimation,
    apply(text, file) {
      return applyScrubAnimation(text);
    },
  },
];
