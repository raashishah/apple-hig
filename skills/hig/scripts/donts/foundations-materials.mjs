import { hit, scanOpaqueBrandBars, applyOpaqueBrandBars } from "./shared.mjs";
import { applyChromeRecipe } from "../apply-chrome.mjs";

function scanCompatibilityLook(files) {
  const out = [];
  for (const f of files) {
    if (/UIDesignRequiresCompatibility/.test(f.text)) {
      out.push(hit(f.path, "UIDesignRequiresCompatibility"));
    }
  }
  return out;
}

function applyCompatibilityLook(text) {
  return text.replace(/^[^\n]*UIDesignRequiresCompatibility[^\n]*\n?/gm, "");
}

function scanStackedTranslucent(files) {
  const out = [];
  for (const f of files) {
    if (/data-stacked-translucent/.test(f.text)) {
      out.push(hit(f.path, "stacked translucent layers"));
      continue;
    }
    const blurs =
      f.text.match(/backdrop-filter|backdropFilter|UIBlurEffect|ultraThinMaterial/g) || [];
    if (
      blurs.length >= 2 &&
      /<(header|nav)\b/.test(f.text) &&
      !/\b(overlay|sheet|dialog|alert|modal|picker|popover)\b/i.test(f.text)
    ) {
      out.push(hit(f.path, "stacked translucent layers"));
    }
  }
  return out;
}

function applyStackedTranslucent(file) {
  const stripped = file.text.replace(/\s*data-stacked-translucent(?:="[^"]*")?/g, "");
  return applyChromeRecipe("chrome.materials.fashion-glass", { ...file, text: stripped });
}

export const records = [
  {
    id: "opaque-nav-bar-fills",
    rewrite: "host",
    scan: scanOpaqueBrandBars,
    apply(text, file) {
      return applyOpaqueBrandBars(text);
    },
  },
  {
    id: "teach-compatibility-look",
    rewrite: "host",
    scan: scanCompatibilityLook,
    apply(text, file) {
      return applyCompatibilityLook(text);
    },
  },
  {
    id: "stacked-translucent-layers",
    rewrite: "marker",
    scan: scanStackedTranslucent,
    apply(text, file) {
      return applyStackedTranslucent(file);
    },
  },
];
