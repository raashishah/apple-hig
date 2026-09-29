import { hit } from "./shared.mjs";

function hasKeyboard(text) {
  return (
    /\bdata-keyboard\b/.test(text) ||
    /\bkeyboardShortcut\b/.test(text) ||
    /\bUIKeyCommand\b/.test(text) ||
    /\bkeyEquivalent\b/.test(text)
  );
}

function keyboardBlocks(text) {
  const blocks = [];
  const re = /<([A-Za-z][\w]*)\b[^>]*\bdata-keyboard\b[^>]*>[\s\S]*?<\/\1>/g;
  let match;
  while ((match = re.exec(text))) blocks.push(match[0]);
  return blocks;
}

function shortcutWindows(text) {
  const hits = [];
  const shortcut = /keyboardShortcut\(\s*"([^"]+)"([\s\S]{0,200})/gi;
  let match;
  while ((match = shortcut.exec(text))) {
    const args = match[2] || "";
    const explicit = /\bmodifiers\s*:/.test(args);
    hits.push({
      key: match[1].toLowerCase(),
      command: explicit ? /\.command\b/.test(args) : true,
      shift: /\.shift\b/.test(args),
      context: text.slice(Math.max(0, match.index - 280), match.index) + args,
    });
  }
  const command = /UIKeyCommand\(([\s\S]{0,300}?)\)/gi;
  while ((match = command.exec(text))) {
    const body = match[1];
    const key = (body.match(/input:\s*"([^"]+)"/) || [])[1] || "";
    hits.push({
      key: key.toLowerCase(),
      command: /\.command\b/.test(body),
      shift: /\.shift\b/.test(body),
      context: text.slice(Math.max(0, match.index - 160), match.index) + body,
    });
  }
  const equivalent = /keyEquivalent\s*[:=]\s*"([^"]+)"/gi;
  while ((match = equivalent.exec(text))) {
    const key = match[1];
    const around = text.slice(match.index, match.index + 180);
    hits.push({
      key: key.toLowerCase(),
      command: /\.command\b/.test(around) || !/modifier/i.test(around),
      shift: /\.shift\b/.test(around) || key === "Z" || key === "Q",
      context: text.slice(Math.max(0, match.index - 280), match.index) + around,
    });
  }
  return hits;
}

function hasKbRepurposeCopy(text) {
  if (/command-z or command-q/i.test(text)) return true;
  for (const hit of shortcutWindows(text)) {
    if (hit.key !== "z" && hit.key !== "q") continue;
    if (!hit.command) continue;
    if (hit.key === "z" && hit.shift) continue;
    if (hit.key === "z" && /\b(?:undo|redo)\b/i.test(hit.context)) continue;
    if (hit.key === "q" && /\bquit\b/i.test(hit.context)) continue;
    return true;
  }
  return false;
}

function hasKbModifierCopy(text) {
  if (/modifier added to an existing shortcut/i.test(text)) return true;
  for (const hit of shortcutWindows(text)) {
    if (hit.key !== "z" || !hit.command || !hit.shift) continue;
    if (/\b(?:undo|redo)\b/i.test(hit.context)) continue;
    return true;
  }
  return false;
}

function hasKbHelpCopy(text) {
  if (/help content within the keyboard/i.test(text)) return true;
  return keyboardBlocks(text).some((block) =>
    /<(?:p|aside|section)\b[^>]*>[^<]*(?:How to use this keyboard|Keyboard help)/i.test(block),
  );
}

function hasKbDupKeysCopy(text) {
  if (/duplicated emoji\/globe or dictation/i.test(text)) return true;
  return keyboardBlocks(text).some((block) =>
    /<(?:button|a)\b[^>]*>\s*(?:Emoji|Globe|Dictation)\s*</i.test(block),
  );
}

function scanKbRepurpose(files) {
  const out = [];
  for (const f of files) {
    if (/data-kb-repurpose/.test(f.text)) {
      out.push(hit(f.path, "repurposed Command-Z or Command-Q"));
      continue;
    }
    if (!hasKeyboard(f.text)) continue;
    if (hasKbRepurposeCopy(f.text)) out.push(hit(f.path, "repurposed Command-Z or Command-Q"));
  }
  return out;
}

function scanKbModifier(files) {
  const out = [];
  for (const f of files) {
    if (/data-kb-modifier/.test(f.text)) {
      out.push(hit(f.path, "a modifier added to an existing shortcut for an unrelated command"));
      continue;
    }
    if (!hasKeyboard(f.text)) continue;
    if (hasKbModifierCopy(f.text)) {
      out.push(hit(f.path, "a modifier added to an existing shortcut for an unrelated command"));
    }
  }
  return out;
}

function scanKbHelp(files) {
  const out = [];
  for (const f of files) {
    if (/data-kb-help/.test(f.text)) {
      out.push(hit(f.path, "help content displayed within the keyboard"));
      continue;
    }
    if (!hasKeyboard(f.text)) continue;
    if (hasKbHelpCopy(f.text)) out.push(hit(f.path, "help content displayed within the keyboard"));
  }
  return out;
}

function scanKbDupKeys(files) {
  const out = [];
  for (const f of files) {
    if (/data-kb-dup-keys/.test(f.text)) {
      out.push(hit(f.path, "duplicated Emoji/Globe or Dictation keys"));
      continue;
    }
    if (!hasKeyboard(f.text)) continue;
    if (hasKbDupKeysCopy(f.text)) out.push(hit(f.path, "duplicated Emoji/Globe or Dictation keys"));
  }
  return out;
}

function applyKbRepurpose(text) {
  return text.replace(/\s*data-kb-repurpose(?:="[^"]*")?/g, "");
}

function applyKbModifier(text) {
  return text.replace(/\s*data-kb-modifier(?:="[^"]*")?/g, "");
}

function applyKbHelp(text) {
  return text.replace(/\s*data-kb-help(?:="[^"]*")?/g, "");
}

function applyKbDupKeys(text) {
  return text.replace(/\s*data-kb-dup-keys(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "kb-repurpose",
    rewrite: "marker",
    scan: scanKbRepurpose,
    apply(text, file) {
      return applyKbRepurpose(text);
    },
  },
  {
    id: "kb-modifier",
    rewrite: "marker",
    scan: scanKbModifier,
    apply(text, file) {
      return applyKbModifier(text);
    },
  },
  {
    id: "kb-help",
    rewrite: "marker",
    scan: scanKbHelp,
    apply(text, file) {
      return applyKbHelp(text);
    },
  },
  {
    id: "kb-dup-keys",
    rewrite: "marker",
    scan: scanKbDupKeys,
    apply(text, file) {
      return applyKbDupKeys(text);
    },
  },
];
