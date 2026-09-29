import { hit } from "./shared.mjs";

function hasLivePhoto(text) {
  return (
    /\bdata-live-photo\b/.test(text) ||
    /\bPHLivePhotoView\b/.test(text) ||
    /\bPHLivePhoto\b/.test(text)
  );
}

function hasLpDisassembleCopy(text) {
  return (
    /frames or audio/i.test(text) ||
    (/disassemble/i.test(text) && /live photo/i.test(text))
  );
}

function hasLpPlaybackCopy(text) {
  return /video playback button/i.test(text);
}

function hasLpUnsupportedCopy(text) {
  return (
    /unsupported environment/i.test(text) ||
    (/replicat/i.test(text) && /live photos? experience/i.test(text))
  );
}

function scanLpDisassemble(files) {
  const out = [];
  for (const f of files) {
    if (/data-lp-disassemble/.test(f.text)) {
      out.push(hit(f.path, "live photo frames or audio presented separately"));
      continue;
    }
    if (!hasLivePhoto(f.text)) continue;
    if (hasLpDisassembleCopy(f.text)) {
      out.push(hit(f.path, "live photo frames or audio presented separately"));
    }
  }
  return out;
}

function applyLpDisassemble(text) {
  return text.replace(/\s*data-lp-disassemble(?:="[^"]*")?/g, "");
}

function scanLpPlaybackButton(files) {
  const out = [];
  for (const f of files) {
    if (/data-lp-playback-button/.test(f.text)) {
      out.push(hit(f.path, "video playback button on a live photo"));
      continue;
    }
    if (!hasLivePhoto(f.text)) continue;
    if (hasLpPlaybackCopy(f.text)) {
      out.push(hit(f.path, "video playback button on a live photo"));
    }
  }
  return out;
}

function applyLpPlaybackButton(text) {
  return text.replace(/\s*data-lp-playback-button(?:="[^"]*")?/g, "");
}

function scanLpUnsupportedReplica(files) {
  const out = [];
  for (const f of files) {
    if (/data-lp-unsupported-replica/.test(f.text)) {
      out.push(hit(f.path, "live photos experience replicated in an unsupported environment"));
      continue;
    }
    if (!hasLivePhoto(f.text)) continue;
    if (hasLpUnsupportedCopy(f.text)) {
      out.push(hit(f.path, "live photos experience replicated in an unsupported environment"));
    }
  }
  return out;
}

function applyLpUnsupportedReplica(text) {
  return text.replace(/\s*data-lp-unsupported-replica(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "lp-disassemble",
    rewrite: "marker",
    scan: scanLpDisassemble,
    apply(text, file) {
      return applyLpDisassemble(text);
    },
  },
  {
    id: "lp-playback-button",
    rewrite: "marker",
    scan: scanLpPlaybackButton,
    apply(text, file) {
      return applyLpPlaybackButton(text);
    },
  },
  {
    id: "lp-unsupported-replica",
    rewrite: "marker",
    scan: scanLpUnsupportedReplica,
    apply(text, file) {
      return applyLpUnsupportedReplica(text);
    },
  },
];
