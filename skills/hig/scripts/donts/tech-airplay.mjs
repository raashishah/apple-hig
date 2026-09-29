import { hit } from "./shared.mjs";

function hasAirplay(text) {
  return (
    /\bdata-airplay\b/.test(text) ||
    /\bAVRoutePickerView\b/.test(text) ||
    /\bAirPlayButton\b/.test(text) ||
    /\ballowsAirPlayVideo\b/.test(text) ||
    /\bisAirPlayVideoActive\b/.test(text) ||
    /\ballowsExternalPlayback\b/.test(text)
  );
}

function scanStopAirplayOnBackground(files) {
  const out = [];
  for (const f of files) {
    if (/data-airplay-stop-on-background/.test(f.text)) {
      out.push(
        hit(
          f.path,
          "airplay playback that stops when the app backgrounds or the device locks",
        ),
      );
    }
  }
  return out;
}

function applyStopAirplayOnBackground(text) {
  return text.replace(/\s*data-airplay-stop-on-background(?:="[^"]*")?/g, "");
}

function hasAutoplayVideo(text) {
  return /<video\b[^>]*\bautoPlay\b/i.test(text);
}

function scanInterruptOtherPlayback(files) {
  const out = [];
  for (const f of files) {
    if (/data-interrupt-airplay/.test(f.text)) {
      out.push(
        hit(f.path, "interrupting another app's playback with non-immersive content"),
      );
      continue;
    }
    if (!hasAirplay(f.text)) continue;
    if (hasAutoplayVideo(f.text)) {
      out.push(
        hit(f.path, "interrupting another app's playback with non-immersive content"),
      );
    }
  }
  return out;
}

function applyInterruptOtherPlayback(text) {
  return text.replace(/\s*data-interrupt-airplay(?:="[^"]*")?/g, "");
}

function scanAutoMirrorAirplay(files) {
  const out = [];
  for (const f of files) {
    if (/data-auto-mirror/.test(f.text)) {
      out.push(hit(f.path, "automatic mirroring without an explicit choice"));
    }
  }
  return out;
}

function applyAutoMirrorAirplay(text) {
  return text.replace(/\s*data-auto-mirror(?:="[^"]*")?/g, "");
}

function scanStreamBackgroundLoop(files) {
  const out = [];
  for (const f of files) {
    if (/data-airplay-background-loop/.test(f.text)) {
      out.push(hit(f.path, "streaming background loops or in-app-only clips"));
    }
  }
  return out;
}

function applyStreamBackgroundLoop(text) {
  return text.replace(/\s*data-airplay-background-loop(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "stop-airplay-on-background",
    rewrite: "marker",
    scan: scanStopAirplayOnBackground,
    apply(text, file) {
      return applyStopAirplayOnBackground(text);
    },
  },
  {
    id: "interrupt-other-playback",
    rewrite: "marker",
    scan: scanInterruptOtherPlayback,
    apply(text, file) {
      return applyInterruptOtherPlayback(text);
    },
  },
  {
    id: "auto-mirror-airplay",
    rewrite: "marker",
    scan: scanAutoMirrorAirplay,
    apply(text, file) {
      return applyAutoMirrorAirplay(text);
    },
  },
  {
    id: "stream-background-loop",
    rewrite: "marker",
    scan: scanStreamBackgroundLoop,
    apply(text, file) {
      return applyStreamBackgroundLoop(text);
    },
  },
];
