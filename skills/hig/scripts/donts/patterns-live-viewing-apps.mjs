import { hit } from "./shared.mjs";

function hasLiveViewing(text) {
  return /\bdata-live-viewing\b/.test(text);
}

function hasVodCopy(text) {
  return (
    /\bVOD\b/.test(text) ||
    /video-on-demand/i.test(text) ||
    /\bon[\s-]demand\b/i.test(text)
  );
}

function hasLiveBadge(text) {
  return (
    /\bdata-live-badge\b/.test(text) ||
    />\s*Live\s*</.test(text) ||
    /aria-label=["']Live["']/i.test(text) ||
    /\blive-badge\b/i.test(text)
  );
}

function scanLiveUnmarkedVod(files) {
  const out = [];
  for (const f of files) {
    if (/data-live-unmarked/.test(f.text)) {
      out.push(
        hit(f.path, "live content that is not distinguished from video-on-demand"),
      );
      continue;
    }
    if (!hasLiveViewing(f.text)) continue;
    if (hasVodCopy(f.text) && !hasLiveBadge(f.text)) {
      out.push(
        hit(f.path, "live content that is not distinguished from video-on-demand"),
      );
    }
  }
  return out;
}

function applyLiveUnmarkedVod(text) {
  return text.replace(/\s*data-live-unmarked(?:="[^"]*")?/g, "");
}

function scanLiveAudioAfterLeave(files) {
  const out = [];
  for (const f of files) {
    if (/data-live-audio-after-leave/.test(f.text)) {
      out.push(hit(f.path, "audio that continues after leaving the live tab"));
    }
  }
  return out;
}

function applyLiveAudioAfterLeave(text) {
  return text.replace(/\s*data-live-audio-after-leave(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "live-unmarked-vod",
    rewrite: "marker",
    scan: scanLiveUnmarkedVod,
    apply(text, file) {
      return applyLiveUnmarkedVod(text);
    },
  },
  {
    id: "live-audio-after-leave",
    rewrite: "marker",
    scan: scanLiveAudioAfterLeave,
    apply(text, file) {
      return applyLiveAudioAfterLeave(text);
    },
  },
];
