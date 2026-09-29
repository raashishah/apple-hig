import { hit } from "./shared.mjs";

function hasMultitask(text) {
  return (
    /\bdata-multitask\b/.test(text) ||
    /\brequestPictureInPicture\s*\(/.test(text) ||
    /\bAVPictureInPictureController\b/.test(text) ||
    /\bpictureInPictureEnabled\b/.test(text)
  );
}

function scanContinueWhenSwitchedAway(files) {
  const out = [];
  for (const f of files) {
    if (/data-no-pause-on-background/.test(f.text)) {
      out.push(hit(f.path, "attention-requiring activity that continues when people switch away"));
      continue;
    }
    if (!hasMultitask(f.text)) continue;
    if (/\bdata-keep-playing\b/.test(f.text)) {
      out.push(hit(f.path, "attention-requiring activity that continues when people switch away"));
    }
  }
  return out;
}

function applyContinueWhenSwitchedAway(text) {
  return text.replace(/\s*data-no-pause-on-background(?:="[^"]*")?/g, "");
}

function scanNotifyRoutineTask(files) {
  const out = [];
  for (const f of files) {
    if (/data-notify-routine/.test(f.text)) {
      out.push(hit(f.path, "a notification when a routine or secondary task completes"));
    }
  }
  return out;
}

function applyNotifyRoutineTask(text) {
  return text.replace(/\s*data-notify-routine(?:="[^"]*")?/g, "");
}

function scanIgnorePrimaryAudioInterrupt(files) {
  const out = [];
  for (const f of files) {
    if (/data-ignore-audio-interrupt/.test(f.text)) {
      out.push(hit(f.path, "audio that does not pause for a primary audio interruption"));
    }
  }
  return out;
}

function applyIgnorePrimaryAudioInterrupt(text) {
  return text.replace(/\s*data-ignore-audio-interrupt(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "continue-when-switched-away",
    rewrite: "marker",
    scan: scanContinueWhenSwitchedAway,
    apply(text, file) {
      return applyContinueWhenSwitchedAway(text);
    },
  },
  {
    id: "notify-routine-task",
    rewrite: "marker",
    scan: scanNotifyRoutineTask,
    apply(text, file) {
      return applyNotifyRoutineTask(text);
    },
  },
  {
    id: "ignore-primary-audio-interrupt",
    rewrite: "marker",
    scan: scanIgnorePrimaryAudioInterrupt,
    apply(text, file) {
      return applyIgnorePrimaryAudioInterrupt(text);
    },
  },
];
