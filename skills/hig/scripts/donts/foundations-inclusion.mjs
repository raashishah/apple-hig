import { hit, innerText, emptyStateRegions } from "./shared.mjs";

function scanDiversityStock(files) {
  const out = [];
  for (const f of files) {
    if (
      /diversity[- ]stock|tokeniz(?:e|ing) diversity|stock photo.{0,40}diverse team/i.test(
        f.text,
      ) ||
      /alt=["'][^"']*(diverse team|multicultural group|people of all)[^"']*["']/i.test(f.text)
    ) {
      out.push(hit(f.path, "tokenizing diversity stock"));
    }
  }
  return out;
}

function scanAbilityJokes(files) {
  const out = [];
  const joke = /\b(lame|cripple|spaz|wheelchair joke|fat joke|blind joke)\b/i;
  for (const f of files) {
    for (const region of emptyStateRegions(f.text)) {
      if (joke.test(innerText(region))) {
        out.push(hit(f.path, "ability or body joke in empty state"));
      }
    }
  }
  return out;
}

function scanLockedSkin(files) {
  const blob = files.map((f) => f.text).join("\n");
  const avatar = /data-avatar|UserAvatar|profile-photo|emoji-avatar/;
  const tone = /skin-tone|skinTone|fitzpatrick|skin_tone/;
  const changer =
    /skinTonePicker|data-skin-tone-picker|aria-label=["'][^"']*skin tone/i;
  const out = [];
  for (const f of files) {
    if (avatar.test(f.text) && tone.test(f.text) && !changer.test(blob)) {
      out.push(hit(f.path, "locked skin-tone default on a user depiction"));
    }
  }
  return out;
}

function hasInAvatarCopy(text) {
  return (
    /specific gender in an avatar/i.test(text) ||
    /referencing a specific gender in an avatar/i.test(text)
  );
}

function hasGenderedAvatar(text) {
  const tags = text.match(/<(?:img|svg|span)\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const isAvatar = /\b(?:avatar|emoji|game-character)\b/i.test(tag);
    if (!isAvatar) continue;
    if (/\b(?:she|he|her|him)\b/i.test(tag)) return true;
  }
  return false;
}

function scanInAvatar(files) {
  const out = [];
  for (const f of files) {
    if (/data-in-av(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a specific gender referenced in an avatar"));
      continue;
    }
    if (hasInAvatarCopy(f.text) || hasGenderedAvatar(f.text)) {
      out.push(hit(f.path, "a specific gender referenced in an avatar"));
    }
  }
  return out;
}

function applyInAvatar(text) {
  return text.replace(/\s*data-in-av(?:="[^"]*")?(?![\w-])/g, "");
}

function hasUndefinedAbbreviation(text) {
  const re = /<abbr\b([^>]*)>([^<]*)<\/abbr>/gi;
  let found;
  while ((found = re.exec(text))) {
    if (/\btitle\s*=\s*["'][^"']+["']/i.test(found[1])) continue;
    if (found[2].replace(/\s+/g, " ").trim()) return true;
  }
  return /\bAbbreviation\s*\(\s*"[^"]+"\s*\)/.test(text);
}

function scanInTerm(files) {
  const out = [];
  for (const f of files) {
    if (/data-in-term(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an abbreviation with no definition"));
      continue;
    }
    if (hasUndefinedAbbreviation(f.text)) {
      out.push(hit(f.path, "an abbreviation with no definition"));
    }
  }
  return out;
}

function applyInTerm(text) {
  return text.replace(/\s*data-in-term(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "tokenizing-diversity-stock",
    rewrite: "marker",
    scan: scanDiversityStock,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "ability-body-jokes-empty",
    rewrite: "marker",
    scan: scanAbilityJokes,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "locked-skin-tone-defaults",
    rewrite: "marker",
    scan: scanLockedSkin,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "in-avatar",
    rewrite: "marker",
    scan: scanInAvatar,
    apply(text, file) {
      return applyInAvatar(text);
    },
  },
  {
    id: "in-term",
    rewrite: "marker",
    scan: scanInTerm,
    apply(text, file) {
      return applyInTerm(text);
    },
  },
];
