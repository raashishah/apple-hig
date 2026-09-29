import { hit } from "./shared.mjs";

function scanBounce(files) {
  const out = [];
  for (const f of files) {
    if (/\bbounce\b/i.test(f.text) || /cubic-bezier\(\s*0\s*,\s*[12]\.\d+/i.test(f.text)) {
      out.push(hit(f.path, "bounce easing on appear"));
    }
  }
  return out;
}

function applyBounce(text) {
  return text
    .replace(/\banimation(?:-name)?\s*:\s*bounce\b[^;]*/gi, "animation: none")
    .replace(/cubic-bezier\(\s*0\s*,\s*[12]\.\d+[^)]*\)/gi, "ease-out")
    .replace(/\bbounce\s+\d/gi, "ease-out ");
}

function scanLockedOut(files) {
  const out = [];
  for (const f of files) {
    if (
      /\{[^}]*(?:animation(?:-name)?\s*:)[^}]*pointer-events\s*:\s*none[^}]*\}/i.test(f.text) ||
      /\{[^}]*pointer-events\s*:\s*none[^}]*(?:animation(?:-name)?\s*:)[^}]*\}/i.test(f.text)
    ) {
      out.push(hit(f.path, "pointer-events none during animation"));
    }
  }
  return out;
}

function applyLockedOut(text) {
  return text.replace(/\{[^}]*\}/g, (block) => {
    if (!/animation(?:-name)?\s*:/i.test(block) || !/pointer-events\s*:\s*none/i.test(block)) {
      return block;
    }
    return block.replace(/pointer-events\s*:\s*none\s*;?/gi, "");
  });
}

function isLargeScale(text) {
  for (const m of text.matchAll(/scale(?:3d)?\(\s*(-?[\d.]+)/gi)) {
    const n = Math.abs(Number(m[1]));
    if (Number.isFinite(n) && (n >= 1.08 || (n > 0 && n <= 0.92))) return true;
  }
  return false;
}

function hasParallaxZoom(text) {
  return (
    isLargeScale(text) ||
    /translate3d\s*\(/i.test(text) ||
    /\bparallax\b/i.test(text) ||
    /zoom\s*:\s*(?:1\.\d*[1-9]|[2-9])/i.test(text)
  );
}

export function scanReduceMotion(files) {
  const blob = files.map((f) => f.text).join("\n");
  if (!hasParallaxZoom(blob)) return [];
  if (/prefers-reduced-motion/i.test(blob)) return [];
  return [hit(files[0]?.path || "", "parallax/zoom without Reduce Motion")];
}

export const REDUCE_CSS = `@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none; transition: none; transform: none; }
}
`;

function applyReduceMotion(text, file) {
  if (/prefers-reduced-motion/i.test(text)) return text;
  if (/\.css$/i.test(file.path) && hasParallaxZoom(text)) {
    return `${text.trimEnd()}\n${REDUCE_CSS}`;
  }
  return text;
}

export const records = [
  {
    id: "bounce-on-appear",
    rewrite: "host",
    scan: scanBounce,
    apply(text, file) {
      return applyBounce(text);
    },
  },
  {
    id: "locked-out-during-motion",
    rewrite: "host",
    scan: scanLockedOut,
    apply(text, file) {
      return applyLockedOut(text);
    },
  },
  {
    id: "motion-without-reduce",
    rewrite: "host",
    scan: scanReduceMotion,
    apply(text, file) {
      return applyReduceMotion(text, file);
    },
  },
];
