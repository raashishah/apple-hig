import { hit, hasGameCenter } from "./shared.mjs";

function hasGcReskinCopy(text) {
  return /re-skin game center or in-app purchase chrome/i.test(text);
}

function hasReskinnedChrome(text) {
  if (!hasGameCenter(text)) return false;
  return (
    /\bclass(?:Name)?=["'][^"']*\breskin\b/i.test(text) || /\bcustomChrome\b/.test(text)
  );
}

function scanGcReskin(files) {
  const out = [];
  for (const f of files) {
    if (/data-gc-reskin(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "reskinned game center or in-app purchase chrome"));
      continue;
    }
    if (!hasGameCenter(f.text)) continue;
    if (hasGcReskinCopy(f.text) || hasReskinnedChrome(f.text)) {
      out.push(hit(f.path, "reskinned game center or in-app purchase chrome"));
    }
  }
  return out;
}

function applyGcReskin(text) {
  return text.replace(/\s*data-gc-reskin(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "gc-reskin",
    rewrite: "marker",
    scan: scanGcReskin,
    apply(text, file) {
      return applyGcReskin(text);
    },
  },
];
