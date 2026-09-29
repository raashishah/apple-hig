import { hit } from "./shared.mjs";

function isLaunchFile(file) {
  return (
    /Launch(Screen|View|Storyboard)?|Splash/i.test(file.path) ||
    /data-launch|data-splash/.test(file.text) ||
    /\bUILaunchStoryboard\b/.test(file.text)
  );
}

function scanAnimatedSplash(files) {
  const out = [];
  for (const f of files) {
    if (!isLaunchFile(f)) continue;
    if (/animation:|keyframes|setTimeout\s*\([\s\S]{0,80}splash/i.test(f.text)) {
      out.push(hit(f.path, "animated splash after launch"));
    }
  }
  return out;
}

function scanLaunchMedia(files) {
  const out = [];
  for (const f of files) {
    if (!isLaunchFile(f)) continue;
    if (/<(video|audio)\b[^>]*(autoPlay|autoplay)/i.test(f.text)) {
      out.push(hit(f.path, "video or sound on launch"));
    }
  }
  return out;
}

function applyLaunchMedia(text, file) {
  if (!isLaunchFile(file)) return text;
  return text.replace(/<(video|audio)\b([^>]*)>/gi, (all, tag, attrs) => {
    if (!/autoPlay|autoplay/i.test(attrs)) return all;
    const next = attrs
      .replace(/\s*autoPlay(=\{[^}]*\})?/g, "")
      .replace(/\s*autoplay(="[^"]*")?/gi, "");
    return `<${tag}${next}>`;
  });
}

function scanLaunchBrandBars(files) {
  const out = [];
  for (const f of files) {
    if (/UIDesignRequiresCompatibility/.test(f.text)) {
      out.push(hit(f.path, "UIDesignRequiresCompatibility launch design"));
      continue;
    }
    if (!isLaunchFile(f)) continue;
    if (
      /(background(?:-color|Color)?)\s*[:=]\s*["']?#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "opaque brand bar as launch chrome"));
    }
  }
  return out;
}

export const records = [
  {
    id: "animated-splash-after-launch",
    rewrite: "marker",
    scan: scanAnimatedSplash,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "video-sound-on-launch",
    rewrite: "host",
    scan: scanLaunchMedia,
    apply(text, file) {
      return applyLaunchMedia(text, file);
    },
  },
  {
    id: "launch-compatibility-brand-bars",
    rewrite: "marker",
    scan: scanLaunchBrandBars,
    apply(text, file) {
      return text;
    },
  },
];
