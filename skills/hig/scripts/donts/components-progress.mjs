import { hit } from "./shared.mjs";

function htmlIndeterminateSpinners(text) {
  const spans = [];
  const progressRe = /<progress\b([^>]*)>/gi;
  let m;
  while ((m = progressRe.exec(text))) {
    if (/\bvalue\s*=/.test(m[1])) continue;
    spans.push({ start: m.index, end: m.index + m[0].length });
  }
  const barRe = /<([A-Za-z][\w]*)\b([^>]*\brole=["']progressbar["'][^>]*)>/gi;
  while ((m = barRe.exec(text))) {
    if (/\baria-valuenow\s*=/.test(m[2]) || /\bvalue\s*=/.test(m[2])) continue;
    spans.push({ start: m.index, end: m.index + m[0].length });
  }
  return spans;
}

function adjacentVisibleLabel(text, start, end) {
  const before = text.slice(Math.max(0, start - 80), start);
  const after = text.slice(end, end + 80);
  const gt = before.lastIndexOf(">");
  const beforeText = gt >= 0 ? before.slice(gt + 1) : "";
  const lt = after.indexOf("<");
  const afterText = lt >= 0 ? after.slice(0, lt) : "";
  const chunk = `${beforeText} ${afterText}`.replace(/\s+/g, " ").trim();
  return /[A-Za-z]/.test(chunk);
}

function hasSpinnerWidget(text) {
  if (htmlIndeterminateSpinners(text).length) return true;
  if (/\bUIActivityIndicatorView\b/.test(text)) return true;
  if (/\bNSProgressIndicator\b/.test(text) && /\.spinning\b/.test(text)) return true;
  const re = /\bProgressView\s*\(/g;
  let m;
  while ((m = re.exec(text))) {
    const call = text.slice(m.index, m.index + 80);
    if (!/\bvalue\s*:/.test(call)) return true;
  }
  return false;
}

function hasSpinnerLabelCopy(text) {
  return (
    /labeling a spinning progress indicator/i.test(text) ||
    /label on a spinning progress indicator/i.test(text)
  );
}

function htmlSpinnerHasVisibleLabel(text) {
  return htmlIndeterminateSpinners(text).some((span) =>
    adjacentVisibleLabel(text, span.start, span.end),
  );
}

function swiftLabeledSpinner(text) {
  const titled = /\bProgressView\s*\(\s*"[^"]+"/g;
  let m;
  while ((m = titled.exec(text))) {
    const call = text.slice(m.index, m.index + 160);
    if (!/\bvalue\s*:/.test(call)) return true;
  }
  const bare = /\bProgressView\s*\(\s*\)\s*\{/g;
  while ((m = bare.exec(text))) {
    const body = text.slice(m.index, m.index + 180);
    if (/Text\s*\(\s*"/.test(body)) return true;
  }
  return false;
}

function activityLabeled(text) {
  if (/\bNSProgressIndicator\b/.test(text) && /\.spinning\b/.test(text)) {
    if (/Text\s*\(\s*"[^"]+"/.test(text) || /text\s*=\s*"[^"]+"/.test(text)) return true;
  }
  const re = /\bUIActivityIndicatorView\b/g;
  let m;
  while ((m = re.exec(text))) {
    const window = text.slice(Math.max(0, m.index - 180), Math.min(text.length, m.index + 220));
    if (/Text\s*\(\s*"[^"]+"/.test(window) || /text\s*=\s*"[^"]+"/.test(window)) return true;
  }
  return false;
}

function scanSpinnerLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-pg-label(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a label on a spinning progress indicator"));
      continue;
    }
    if (!hasSpinnerWidget(f.text)) continue;
    if (
      hasSpinnerLabelCopy(f.text) ||
      htmlSpinnerHasVisibleLabel(f.text) ||
      swiftLabeledSpinner(f.text) ||
      activityLabeled(f.text)
    ) {
      out.push(hit(f.path, "a label on a spinning progress indicator"));
    }
  }
  return out;
}

function applySpinnerLabel(text) {
  return text.replace(/\s*data-pg-label(?:="[^"]*")?(?![\w-])/g, "");
}

function isVagueProgressLabel(label) {
  const n = String(label || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?…]+$/g, "")
    .trim();
  return /^(loading|authenticating)$/i.test(n);
}

function hasVagueProgressCopy(text) {
  return (
    /vague terms like loading or authenticating/i.test(text) ||
    /determinate progress indicator labeled loading or authenticating/i.test(text)
  );
}

function htmlDeterminateProgressSpans(text) {
  const spans = [];
  const progressRe = /<progress\b([^>]*)>/gi;
  let m;
  while ((m = progressRe.exec(text))) {
    if (!/\bvalue\s*=/.test(m[1])) continue;
    spans.push({ start: m.index, end: m.index + m[0].length });
  }
  const barRe = /<([A-Za-z][\w]*)\b([^>]*\brole=["']progressbar["'][^>]*)>/gi;
  while ((m = barRe.exec(text))) {
    if (!/\baria-valuenow\s*=/.test(m[2]) && !/\bvalue\s*=/.test(m[2])) continue;
    spans.push({ start: m.index, end: m.index + m[0].length });
  }
  return spans;
}

function labelsNearDeterminate(text, start, end) {
  const from = Math.max(0, start - 180);
  const slice = text.slice(from, Math.min(text.length, end + 180));
  const relEnd = end - from;
  const bits = [];
  const nodes = />([^<]+)</g;
  let m;
  while ((m = nodes.exec(slice))) bits.push(m[1]);
  const after = slice.slice(relEnd, relEnd + 80);
  const lt = after.search(/[<{]/);
  const afterText = (lt >= 0 ? after.slice(0, lt) : after).replace(/[);]/g, " ");
  if (afterText.trim()) bits.push(afterText);
  return bits
    .map((bit) => bit.replace(/\s+/g, " ").trim())
    .filter((bit) => /[A-Za-z]/.test(bit));
}

function htmlDeterminateVague(text) {
  return htmlDeterminateProgressSpans(text).some((span) =>
    labelsNearDeterminate(text, span.start, span.end).some(isVagueProgressLabel),
  );
}

function swiftDeterminateVague(text) {
  const titled = /\bProgressView\s*\(\s*"([^"]*)"/g;
  let m;
  while ((m = titled.exec(text))) {
    const call = text.slice(m.index, m.index + 180);
    if (!/\bvalue\s*:/.test(call)) continue;
    if (isVagueProgressLabel(m[1])) return true;
  }
  const block = /\bProgressView\s*\(\s*value\s*:/g;
  while ((m = block.exec(text))) {
    const body = text.slice(m.index, m.index + 220);
    const label = body.match(/\bText\s*\(\s*"([^"]*)"/);
    if (label && isVagueProgressLabel(label[1])) return true;
  }
  const bar = /\bUIProgressView\b/g;
  while ((m = bar.exec(text))) {
    const window = text.slice(Math.max(0, m.index - 40), Math.min(text.length, m.index + 240));
    const labels = [
      ...window.matchAll(/\bText\s*\(\s*"([^"]*)"/g),
      ...window.matchAll(/\btext\s*=\s*"([^"]*)"/g),
    ];
    if (labels.some((hit) => isVagueProgressLabel(hit[1]))) return true;
  }
  return false;
}

function hasDeterminateProgress(text) {
  return htmlDeterminateProgressSpans(text).length > 0 || swiftDeterminateVague(text) || /\bUIProgressView\b/.test(text) || /\bProgressView\s*\([^)]*\bvalue\s*:/.test(text);
}

function scanVagueProgress(files) {
  const out = [];
  for (const f of files) {
    if (/data-pg-vague(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a determinate progress indicator labeled loading or authenticating"));
      continue;
    }
    if (!hasDeterminateProgress(f.text)) continue;
    if (htmlDeterminateVague(f.text) || swiftDeterminateVague(f.text) || hasVagueProgressCopy(f.text)) {
      out.push(hit(f.path, "a determinate progress indicator labeled loading or authenticating"));
    }
  }
  return out;
}

function applyVagueProgress(text) {
  return text.replace(/\s*data-pg-vague(?:="[^"]*")?(?![\w-])/g, "");
}

function scanMorphProgress(files) {
  const out = [];
  for (const f of files) {
    if (/data-morph-progress/.test(f.text)) {
      out.push(hit(f.path, "circular indicator morphs into a bar"));
      continue;
    }
    if (
      /role=["']progressbar["']|<progress\b/.test(f.text) &&
      /spinner|circular|activity-indicator/i.test(f.text) &&
      /morph|swapIndicator|circularToBar/i.test(f.text)
    ) {
      out.push(hit(f.path, "circular indicator morphs into a bar"));
    }
  }
  return out;
}

function applyMorphProgress(text) {
  return text.replace(/\s*data-morph-progress(?:="[^"]*")?/g, "");
}

function scanJumpNinety(files) {
  const out = [];
  for (const f of files) {
    if (/data-jump-ninety/.test(f.text)) {
      out.push(hit(f.path, "progress jumps to 90% then stalls"));
      continue;
    }
    if (
      /<(progress)[^>]*(value=["']90["']|value=\{0\.9\}|value=\{90\})/i.test(f.text) &&
      /stall|fake|loading/i.test(f.text)
    ) {
      out.push(hit(f.path, "progress jumps to 90% then stalls"));
    }
  }
  return out;
}

function applyJumpNinety(text) {
  let next = text.replace(/\s*data-jump-ninety(?:="[^"]*")?/g, "");
  next = next.replace(/(<(progress)\b[^>]*\bvalue=["'])90(["'])/gi, "$10$3");
  next = next.replace(/(<(progress)\b[^>]*\bvalue=\{)0\.9(\})/gi, "$10$3");
  next = next.replace(/(<(progress)\b[^>]*\bvalue=\{)90(\})/gi, "$10$3");
  return next;
}

function scanPullDownRefreshTitle(files) {
  const out = [];
  for (const f of files) {
    if (/pull down to refresh/i.test(f.text)) {
      out.push(hit(f.path, "pull down to refresh title"));
    }
  }
  return out;
}

function applyPullDownRefreshTitle(text) {
  return text
    .replace(/>\s*pull down to refresh\s*</gi, ">Refresh<")
    .replace(/aria-label=["']pull down to refresh["']/gi, 'aria-label="Refresh"')
    .replace(/pull down to refresh/gi, "");
}

export const records = [
  {
    id: "morph-circular-bar",
    rewrite: "marker",
    scan: scanMorphProgress,
    apply(text, file) {
      return applyMorphProgress(text);
    },
  },
  {
    id: "pg-label",
    rewrite: "marker",
    scan: scanSpinnerLabel,
    apply(text, file) {
      return applySpinnerLabel(text);
    },
  },
  {
    id: "pg-vague",
    rewrite: "marker",
    scan: scanVagueProgress,
    apply(text, file) {
      return applyVagueProgress(text);
    },
  },
  {
    id: "jump-progress-ninety",
    rewrite: "host",
    scan: scanJumpNinety,
    apply(text, file) {
      return applyJumpNinety(text);
    },
  },
  {
    id: "pull-down-to-refresh-title",
    rewrite: "host",
    scan: scanPullDownRefreshTitle,
    apply(text, file) {
      return applyPullDownRefreshTitle(text);
    },
  },
];
