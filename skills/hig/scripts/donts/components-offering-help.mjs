import { hit, blocksWithAttr, elementsWithRole } from "./shared.mjs";

function hasHelpWidget(text) {
  return (
    /\bdata-help\b/.test(text) ||
    /\bdata-tip\b/.test(text) ||
    /\bdata-tooltip\b/.test(text) ||
    /role=["']tooltip["']/i.test(text) ||
    /\bTipView\s*\(/.test(text) ||
    /\bpopoverTip\s*\(/.test(text) ||
    /\.help\s*\(/.test(text)
  );
}

function scanWrongPlatformHelp(files) {
  const out = [];
  for (const f of files) {
    if (/data-wrong-platform-help/.test(f.text)) {
      out.push(hit(f.path, "help copy that tells people to click on iPhone"));
      continue;
    }
    if (!hasHelpWidget(f.text)) continue;
    if (
      /click[\s\S]{0,80}(iphone|ios\b)/i.test(f.text) ||
      /tap[\s\S]{0,80}(\bmac\b|macos)/i.test(f.text)
    ) {
      out.push(hit(f.path, "help copy that tells people to click on iPhone"));
    }
  }
  return out;
}

function applyWrongPlatformHelp(text) {
  return text.replace(/\s*data-wrong-platform-help(?:="[^"]*")?/g, "");
}

function scanStandardComponentHelp(files) {
  const out = [];
  for (const f of files) {
    if (/data-standard-component-help/.test(f.text)) {
      out.push(hit(f.path, "help content that explains how standard components work"));
    }
  }
  return out;
}

function applyStandardComponentHelp(text) {
  return text.replace(/\s*data-standard-component-help(?:="[^"]*")?/g, "");
}

function scanPromotionalTip(files) {
  const out = [];
  for (const f of files) {
    if (/data-promotional-tip/.test(f.text)) {
      out.push(hit(f.path, "promotional content in a tip"));
      continue;
    }
    if (!hasHelpWidget(f.text)) continue;
    if (/\b(upgrade now|subscribe now|buy now|limited offer)\b/i.test(f.text)) {
      out.push(hit(f.path, "promotional content in a tip"));
    }
  }
  return out;
}

function applyPromotionalTip(text) {
  return text.replace(/\s*data-promotional-tip(?:="[^"]*")?/g, "");
}

function helpMessageTexts(text) {
  const out = [];
  const quoted = /(?:\.help|popoverTip|TipView)\s*\(\s*"([^"]*)"/g;
  let found;
  while ((found = quoted.exec(text))) out.push(found[1]);
  for (const region of elementsWithRole(text, "tooltip")) {
    out.push(region.replace(/<[^>]+>/g, " "));
  }
  for (const attr of ["data-help", "data-tip", "data-tooltip"]) {
    for (const block of blocksWithAttr(text, attr)) {
      out.push(block.text.replace(/<[^>]+>/g, " "));
    }
  }
  return out;
}

function helpSaysPopover(text) {
  return helpMessageTexts(text).some((message) => /\bpopover\b/i.test(message));
}

function hasHelpPopoverWordCopy(text) {
  return /word popover in help/i.test(text) || /popover in help documentation/i.test(text);
}

function scanHelpPopoverWord(files) {
  const out = [];
  for (const f of files) {
    if (/data-hp-word(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "the word popover in help documentation"));
      continue;
    }
    if (!hasHelpWidget(f.text)) continue;
    if (helpSaysPopover(f.text) || hasHelpPopoverWordCopy(f.text)) {
      out.push(hit(f.path, "the word popover in help documentation"));
    }
  }
  return out;
}

function applyHelpPopoverWord(text) {
  return text.replace(/\s*data-hp-word(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "wrong-platform-help",
    rewrite: "marker",
    scan: scanWrongPlatformHelp,
    apply(text, file) {
      return applyWrongPlatformHelp(text);
    },
  },
  {
    id: "standard-component-help",
    rewrite: "marker",
    scan: scanStandardComponentHelp,
    apply(text, file) {
      return applyStandardComponentHelp(text);
    },
  },
  {
    id: "promotional-tip",
    rewrite: "marker",
    scan: scanPromotionalTip,
    apply(text, file) {
      return applyPromotionalTip(text);
    },
  },
  {
    id: "hp-word",
    rewrite: "marker",
    scan: scanHelpPopoverWord,
    apply(text, file) {
      return applyHelpPopoverWord(text);
    },
  },
];
