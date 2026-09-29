import { hit } from "./shared.mjs";

function hasShazam(text) {
  return /\bdata-shazam\b/.test(text) || /\bSHSession\b/.test(text) || /\bSHManagedSession\b/.test(text);
}

function hasSzMicCopy(text) {
  return (
    /don['’]?t expect the microphone to stay on/i.test(text) ||
    /microphone to stay on/i.test(text) ||
    /only record for as long as it takes to get the sample/i.test(text) ||
    /microphone that stays on after the recognition sample/i.test(text)
  );
}

function hasSzMicSignal(text) {
  if (!hasShazam(text)) return false;
  if (/microphone stays on/i.test(text) || /keep(?:s|ing)? (?:the )?microphone on/i.test(text)) {
    return true;
  }
  const started = /\.start\s*\(\s*\)/.test(text);
  const stopped = /\.stop\s*\(\s*\)/.test(text);
  const matched = /\.match\s*\(/.test(text);
  return started && matched && !stopped;
}

function scanSzMic(files) {
  const out = [];
  for (const f of files) {
    if (/data-sz-mic/.test(f.text)) {
      out.push(hit(f.path, "a microphone that stays on after the recognition sample"));
      continue;
    }
    if (!hasShazam(f.text)) continue;
    if (hasSzMicCopy(f.text) || hasSzMicSignal(f.text)) {
      out.push(hit(f.path, "a microphone that stays on after the recognition sample"));
    }
  }
  return out;
}

function applySzMic(text) {
  return text.replace(/\s*data-sz-mic(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "sz-mic",
    rewrite: "marker",
    scan: scanSzMic,
    apply(text, file) {
      return applySzMic(text);
    },
  },
];
