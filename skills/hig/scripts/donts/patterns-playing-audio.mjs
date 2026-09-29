import { hit } from "./shared.mjs";

function hasPlayingAudio(text) {
  return (
    /\bdata-playing-audio\b/.test(text) ||
    /\bAVAudioSession\b/.test(text) ||
    /\bMPNowPlayingInfoCenter\b/.test(text)
  );
}

function hasAuOutputVolumeCopy(text) {
  return (
    /sets? the system output volume/i.test(text) ||
    /adjust the overall volume/i.test(text) ||
    /\.outputVolume\s*=/.test(text) ||
    /\bsetOutputVolume\b/.test(text)
  );
}

function hasAuRepurposeCopy(text) {
  return (
    /repurposed for a non-playback/i.test(text) ||
    /repurpos\w* audio controls/i.test(text) ||
    (/audio controls?/i.test(text) && /redefin/i.test(text))
  );
}

function hasAuHeadphonesCopy(text) {
  return (
    /playback continues after headphones disconnect/i.test(text) ||
    (/headphones disconnect/i.test(text) && /continue playback|keep playing|do not pause|don't pause/i.test(text))
  );
}

function scanAuOutputVolume(files) {
  const out = [];
  for (const f of files) {
    if (/data-au-output-volume/.test(f.text)) {
      out.push(hit(f.path, "the app sets the system output volume"));
      continue;
    }
    if (!hasPlayingAudio(f.text)) continue;
    if (hasAuOutputVolumeCopy(f.text)) {
      out.push(hit(f.path, "the app sets the system output volume"));
    }
  }
  return out;
}

function applyAuOutputVolume(text) {
  return text.replace(/\s*data-au-output-volume(?:="[^"]*")?/g, "");
}

function scanAuRepurpose(files) {
  const out = [];
  for (const f of files) {
    if (/data-au-repurpose/.test(f.text)) {
      out.push(hit(f.path, "audio controls repurposed for a non-playback action"));
      continue;
    }
    if (!hasPlayingAudio(f.text)) continue;
    if (hasAuRepurposeCopy(f.text)) {
      out.push(hit(f.path, "audio controls repurposed for a non-playback action"));
    }
  }
  return out;
}

function applyAuRepurpose(text) {
  return text.replace(/\s*data-au-repurpose(?:="[^"]*")?/g, "");
}

function scanAuHeadphones(files) {
  const out = [];
  for (const f of files) {
    if (/data-au-headphones/.test(f.text)) {
      out.push(hit(f.path, "playback continues after headphones disconnect"));
      continue;
    }
    if (!hasPlayingAudio(f.text)) continue;
    if (hasAuHeadphonesCopy(f.text)) {
      out.push(hit(f.path, "playback continues after headphones disconnect"));
    }
  }
  return out;
}

function applyAuHeadphones(text) {
  return text.replace(/\s*data-au-headphones(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "au-output-volume",
    rewrite: "marker",
    scan: scanAuOutputVolume,
    apply(text, file) {
      return applyAuOutputVolume(text);
    },
  },
  {
    id: "au-repurpose",
    rewrite: "marker",
    scan: scanAuRepurpose,
    apply(text, file) {
      return applyAuRepurpose(text);
    },
  },
  {
    id: "au-headphones",
    rewrite: "marker",
    scan: scanAuHeadphones,
    apply(text, file) {
      return applyAuHeadphones(text);
    },
  },
];
