import { hit } from "./shared.mjs";

function hasWorkout(text) {
  return (
    /\bdata-workout\b/.test(text) ||
    /\bHKWorkoutSession\b/.test(text) ||
    /\bHKWorkout\b/.test(text) ||
    /\bWorkoutKit\b/.test(text)
  );
}

function hasWkDistractCopy(text) {
  return (
    (/distract/i.test(text) && /workout/i.test(text)) ||
    (/list of workouts/i.test(text) && /active/i.test(text))
  );
}

function hasWkBriefCopy(text) {
  return (
    /extremely brief/i.test(text) ||
    (/few seconds/i.test(text) && /session/i.test(text))
  );
}

function scanWkDistract(files) {
  const out = [];
  for (const f of files) {
    if (/data-wk-distract/.test(f.text)) {
      out.push(hit(f.path, "distracting chrome during an active workout"));
      continue;
    }
    if (!hasWorkout(f.text)) continue;
    if (hasWkDistractCopy(f.text)) {
      out.push(hit(f.path, "distracting chrome during an active workout"));
    }
  }
  return out;
}

function applyWkDistract(text) {
  return text.replace(/\s*data-wk-distract(?:="[^"]*")?/g, "");
}

function scanWkBriefSession(files) {
  const out = [];
  for (const f of files) {
    if (/data-wk-brief-session/.test(f.text)) {
      out.push(hit(f.path, "extremely brief workout sessions recorded"));
      continue;
    }
    if (!hasWorkout(f.text)) continue;
    if (hasWkBriefCopy(f.text)) {
      out.push(hit(f.path, "extremely brief workout sessions recorded"));
    }
  }
  return out;
}

function applyWkBriefSession(text) {
  return text.replace(/\s*data-wk-brief-session(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "wk-distract",
    rewrite: "marker",
    scan: scanWkDistract,
    apply(text, file) {
      return applyWkDistract(text);
    },
  },
  {
    id: "wk-brief-session",
    rewrite: "marker",
    scan: scanWkBriefSession,
    apply(text, file) {
      return applyWkBriefSession(text);
    },
  },
];
