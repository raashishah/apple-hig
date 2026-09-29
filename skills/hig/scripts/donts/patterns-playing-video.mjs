import { hit } from "./shared.mjs";

function hasVideoPlayer(text) {
  return (
    /\bdata-video-player\b/.test(text) ||
    /\bAVPlayerViewController\b/.test(text) ||
    /\bAVPlayer\b/.test(text) ||
    /\bVideoPlayer\s*\(/.test(text) ||
    /<video\b/i.test(text)
  );
}

function scanCustomVideoPlayer(files) {
  const out = [];
  for (const f of files) {
    if (/data-custom-video-player/.test(f.text)) {
      out.push(hit(f.path, "a custom video player that diverges from the system player"));
    }
  }
  return out;
}

function applyCustomVideoPlayer(text) {
  return text.replace(/\s*data-custom-video-player(?:="[^"]*")?/g, "");
}

function scanLetterboxVideoPadding(files) {
  const out = [];
  for (const f of files) {
    if (/data-letterbox-padding/.test(f.text)) {
      out.push(hit(f.path, "video displayed with embedded letterbox or pillarbox padding"));
    }
  }
  return out;
}

function applyLetterboxVideoPadding(text) {
  return text.replace(/\s*data-letterbox-padding(?:="[^"]*")?/g, "");
}

function hasResumePlaybackPrompt(text) {
  return /Resume\s+(playback|watching|playing)\s*\?/i.test(text);
}

function scanAskResumePlayback(files) {
  const out = [];
  for (const f of files) {
    if (/data-resume-prompt/.test(f.text)) {
      out.push(hit(f.path, "asking people if they want to resume playback"));
      continue;
    }
    if (!hasVideoPlayer(f.text)) continue;
    if (hasResumePlaybackPrompt(f.text)) {
      out.push(hit(f.path, "asking people if they want to resume playback"));
    }
  }
  return out;
}

function applyAskResumePlayback(text) {
  return text.replace(/\s*data-resume-prompt(?:="[^"]*")?/g, "");
}

function scanVideoLoadingSplash(files) {
  const out = [];
  for (const f of files) {
    if (/data-video-loading-screen/.test(f.text)) {
      out.push(hit(f.path, "a loading or splash screen before video playback"));
    }
  }
  return out;
}

function applyVideoLoadingSplash(text) {
  return text.replace(/\s*data-video-loading-screen(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "custom-video-player",
    rewrite: "marker",
    scan: scanCustomVideoPlayer,
    apply(text, file) {
      return applyCustomVideoPlayer(text);
    },
  },
  {
    id: "letterbox-video-padding",
    rewrite: "marker",
    scan: scanLetterboxVideoPadding,
    apply(text, file) {
      return applyLetterboxVideoPadding(text);
    },
  },
  {
    id: "ask-resume-playback",
    rewrite: "marker",
    scan: scanAskResumePlayback,
    apply(text, file) {
      return applyAskResumePlayback(text);
    },
  },
  {
    id: "video-loading-splash",
    rewrite: "marker",
    scan: scanVideoLoadingSplash,
    apply(text, file) {
      return applyVideoLoadingSplash(text);
    },
  },
];
