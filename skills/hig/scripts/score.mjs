import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const DEFECTS = JSON.parse(
  fs.readFileSync(path.join(root, "defects.json"), "utf8"),
);

const TYPE_SCALE = JSON.parse(
  fs.readFileSync(path.join(root, "type-scale.json"), "utf8"),
).styles.map((style) => style.size);

const FONT_STACK = "-apple-system, system-ui, sans-serif";

export function kitMargin(cssText) {
  const match = cssText.match(/--hig-margin-min:\s*(\d+(?:\.\d+)?)px/);
  return match ? Number(match[1]) : null;
}

function contrastRatio(foreground, background) {
  const lum = (hex) => {
    const value = hex.replace("#", "");
    const channels = [0, 2, 4].map((index) => {
      const channel = parseInt(value.slice(index, index + 2), 16) / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const [lighter, darker] = [lum(foreground), lum(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

export function scoreScreen(screen, options = {}) {
  const open = [];
  const sizes = [...new Set(screen.fontSizes.map((size) => Number(size)))];
  if (sizes.length > 4 || sizes.some((size) => !TYPE_SCALE.includes(size))) {
    open.push(DEFECTS[0]);
  }
  if (new Set(screen.weights).size > 2) open.push(DEFECTS[1]);
  const edges = screen.leadingEdges.map((edge) => Number(edge));
  const offGrid =
    options.grid != null &&
    screen.spacings.some((space) => Number(space) % options.grid !== 0);
  if (
    (edges.length > 0 && Math.max(...edges) - Math.min(...edges) > 1) ||
    offGrid
  ) {
    open.push(DEFECTS[2]);
  }
  if (
    options.margin != null &&
    screen.margins.some((margin) => Number(margin) < options.margin)
  ) {
    open.push(DEFECTS[3]);
  }
  if (screen.tapTargets.some((target) => target.width < 44 || target.height < 44)) {
    open.push(DEFECTS[4]);
  }
  if (
    screen.bodyPairs.some(
      (pair) => contrastRatio(pair.foreground, pair.background) < 4.5,
    )
  ) {
    open.push(DEFECTS[5]);
  }
  const waived = new Set(screen.waived || []);
  if (!waived.has("colour") && (screen.nonTokenColor || screen.accentCount > 1)) {
    open.push(DEFECTS[6]);
  }
  if (screen.customControls > 0) open.push(DEFECTS[7]);
  if (screen.safeViolations > 0) open.push(DEFECTS[8]);
  if (screen.primaryCount > 1) open.push(DEFECTS[9]);
  if (screen.radiiMismatch || screen.radiiNonNesting) open.push(DEFECTS[10]);
  if (screen.inventedTiming || !screen.reducedMotion) open.push(DEFECTS[11]);
  return open;
}

export function fontProblems(cssText) {
  const problems = [];
  if (!cssText.includes("-apple-system") || !cssText.includes("system-ui")) {
    problems.push("font stack must include -apple-system and system-ui");
  }
  const faces = cssText.match(/@font-face\s*\{[^}]*\}/g) || [];
  for (const face of faces) {
    if (/SF\s*Pro|SFPro|-apple-system.*url\(|\.otf|\.ttf/i.test(face)) {
      problems.push("@font-face loads an SF file");
    }
  }
  return problems;
}

export const REQUIRED_FONT_STACK = FONT_STACK;

export function scorePair(screens, options = {}) {
  const open = new Set();
  for (const screen of screens) {
    for (const defect of scoreScreen(screen, options)) open.add(defect);
  }
  return { score: open.size, open: [...open] };
}
