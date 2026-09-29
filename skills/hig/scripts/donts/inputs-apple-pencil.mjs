import { hit } from "./shared.mjs";

function hasPencil(text) {
  return (
    /\bdata-pencil\b/.test(text) ||
    /\bPKCanvasView\b/.test(text) ||
    /\bPKToolPicker\b/.test(text) ||
    /\bUIScribbleInteraction\b/.test(text)
  );
}

function hasPeHoverCopy(text) {
  return /hover that initiates an action/i.test(text) || /hover to initiate an action/i.test(text);
}

function hasPeDoubleTapCopy(text) {
  return (
    /double-tap that modifies content/i.test(text) ||
    /double-tap gesture to perform an action that modifies/i.test(text)
  );
}

function hasPeDistractCopy(text) {
  return /distraction while people write/i.test(text) || /distracting people while they write/i.test(text);
}

function scanPeHover(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-hover/.test(f.text)) {
      out.push(hit(f.path, "hover that initiates an action"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPeHoverCopy(f.text)) out.push(hit(f.path, "hover that initiates an action"));
  }
  return out;
}

function scanPeDoubleTap(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-double-tap/.test(f.text)) {
      out.push(hit(f.path, "double-tap that modifies content"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPeDoubleTapCopy(f.text)) out.push(hit(f.path, "double-tap that modifies content"));
  }
  return out;
}

function scanPeDistract(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-distract/.test(f.text)) {
      out.push(hit(f.path, "distraction while people write"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPeDistractCopy(f.text)) out.push(hit(f.path, "distraction while people write"));
  }
  return out;
}

function applyPeHover(text) {
  return text.replace(/\s*data-pe-hover(?:="[^"]*")?/g, "");
}

function applyPeDoubleTap(text) {
  return text.replace(/\s*data-pe-double-tap(?:="[^"]*")?/g, "");
}

function applyPeDistract(text) {
  return text.replace(/\s*data-pe-distract(?:="[^"]*")?/g, "");
}

function hasPeSqueezeCopy(text) {
  return (
    /squeeze to perform an action that could result in data loss/i.test(text) ||
    /squeeze that could result in data loss/i.test(text)
  );
}

function squeezeDeletes(text) {
  if (!hasPencil(text)) return false;
  return /onSqueeze\b[\s\S]{0,160}?\b(?:delete|remove|destroy)\w*/i.test(text);
}

function scanPeSqueeze(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-squeeze(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a squeeze that could result in data loss"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPeSqueezeCopy(f.text) || squeezeDeletes(f.text)) {
      out.push(hit(f.path, "a squeeze that could result in data loss"));
    }
  }
  return out;
}

function applyPeSqueeze(text) {
  return text.replace(/\s*data-pe-squeeze(?:="[^"]*")?(?![\w-])/g, "");
}

function hasPePreviewCopy(text) {
  return (
    /continuously modifying the preview/i.test(text) ||
    /preview as people move Apple Pencil closer or farther/i.test(text) ||
    /preview as Apple Pencil moves closer or farther/i.test(text)
  );
}

function pencilPreviewTracksDistance(text) {
  if (!hasPencil(text)) return false;
  const scale = "scale|width|size";
  const distance = "distance|closer|farther";
  const forward = new RegExp(
    `on(?:Pencil)?Hover\\b[\\s\\S]{0,180}?\\b(?:${scale})\\b[\\s\\S]{0,80}?\\b(?:${distance})\\b`,
    "i",
  );
  const reverse = new RegExp(
    `on(?:Pencil)?Hover\\b[\\s\\S]{0,180}?\\b(?:${distance})\\b[\\s\\S]{0,80}?\\b(?:${scale})\\b`,
    "i",
  );
  return forward.test(text) || reverse.test(text);
}

function scanPePreview(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-preview(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a preview continuously modified as Apple Pencil moves closer or farther"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPePreviewCopy(f.text) || pencilPreviewTracksDistance(f.text)) {
      out.push(hit(f.path, "a preview continuously modified as Apple Pencil moves closer or farther"));
    }
  }
  return out;
}

function applyPePreview(text) {
  return text.replace(/\s*data-pe-preview(?:="[^"]*")?(?![\w-])/g, "");
}

function hasPeHandCopy(text) {
  return (
    /obscured by either hand/i.test(text) ||
    /controls in locations that may be obscured/i.test(text)
  );
}

function buttonInPalmZone(tag) {
  const quoted = tag.match(/(?:style|className|class)\s*=\s*["']([^"']*)["']/i);
  const brace = tag.match(/style=\{\{([^}]*)\}\}/i);
  const blob = `${quoted ? quoted[1] : ""} ${brace ? brace[1] : ""}`.toLowerCase();
  if (!blob.trim()) return false;
  const bottom = /\bbottom\s*[:=]\s*0\b/.test(blob);
  const side = /\b(?:left|right)\s*[:=]\s*0\b/.test(blob);
  return bottom && side;
}

function pencilControlInPalm(text) {
  if (!hasPencil(text)) return false;
  const re = /<button\b[^>]*>/gi;
  let m;
  while ((m = re.exec(text))) {
    if (buttonInPalmZone(m[0])) return true;
  }
  return false;
}

function scanPeHand(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-hand(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "controls in locations that may be obscured by either hand"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPeHandCopy(f.text) || pencilControlInPalm(f.text)) {
      out.push(hit(f.path, "controls in locations that may be obscured by either hand"));
    }
  }
  return out;
}

function applyPeHand(text) {
  return text.replace(/\s*data-pe-hand(?:="[^"]*")?(?![\w-])/g, "");
}

function hasPeOnCopy(text) {
  return /don['’]?t turn it on by default/i.test(text);
}

function hasCustomDoubleTapOnByDefault(text) {
  if (!hasPencil(text)) return false;
  if (/\bcustomDoubleTap\s*=\s*true\b/.test(text)) return true;
  if (/Toggle\(\s*"Custom double-tap"\s*,[\s\S]{0,80}\.constant\(\s*true\s*\)/.test(text)) return true;
  return (
    /<label\b[^>]*>[\s\S]{0,200}\bchecked\b[\s\S]{0,80}custom double-tap/i.test(text) ||
    /\bchecked\b[^>]*>[\s\S]{0,80}custom double-tap/i.test(text)
  );
}

function scanPeOn(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-on(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a custom double-tap that is on by default"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPeOnCopy(f.text) || hasCustomDoubleTapOnByDefault(f.text)) {
      out.push(hit(f.path, "a custom double-tap that is on by default"));
    }
  }
  return out;
}

function applyPeOn(text) {
  return text.replace(/\s*data-pe-on(?:="[^"]*")?(?![\w-])/g, "");
}

function hasPeModeCopy(text) {
  return (
    /special mode before they can make a mark/i.test(text) ||
    /tap a button or enter a special mode/i.test(text)
  );
}

function hasPencilModeButton(text) {
  if (!hasPencil(text)) return false;
  if (/<(?:button|Button)\b[^>]*>\s*(?:Draw|Ink) mode\s*<\/(?:button|Button)>/i.test(text)) return true;
  return /\bButton\s*\(\s*"(?:Draw|Ink) mode"\s*\)/.test(text);
}

function scanPeMode(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-mode(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a special mode before a Pencil mark"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPeModeCopy(f.text) || hasPencilModeButton(f.text)) {
      out.push(hit(f.path, "a special mode before a Pencil mark"));
    }
  }
  return out;
}

function applyPeMode(text) {
  return text.replace(/\s*data-pe-mode(?:="[^"]*")?(?![\w-])/g, "");
}

function hasPeFarCopy(text) {
  return (
    /affect content on other parts of the screen/i.test(text) ||
    /seemingly disconnected actions/i.test(text)
  );
}

function hasPencilDistantAction(text) {
  if (!hasPencil(text)) return false;
  if (/\baffectsDistant\s*=\s*(?:true|\{)/.test(text)) return true;
  if (/\bpencilAffectsRemote\s*=\s*true\b/.test(text)) return true;
  return /\bdistantTarget\s*=/.test(text);
}

function scanPeFar(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-far(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a Pencil mark that affects content on other parts of the screen"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPeFarCopy(f.text) || hasPencilDistantAction(f.text)) {
      out.push(hit(f.path, "a Pencil mark that affects content on other parts of the screen"));
    }
  }
  return out;
}

function applyPeFar(text) {
  return text.replace(/\s*data-pe-far(?:="[^"]*")?(?![\w-])/g, "");
}

function hasPeSuggestCopy(text) {
  return /autocompletion text/i.test(text);
}

function hasPencilAutocomplete(text) {
  if (!hasPencil(text)) return false;
  return /\bautocompletionText\s*[:=(]/.test(text);
}

function scanPeSuggest(files) {
  const out = [];
  for (const f of files) {
    if (/data-pe-suggest(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "autocomplete text while writing with Pencil"));
      continue;
    }
    if (!hasPencil(f.text)) continue;
    if (hasPeSuggestCopy(f.text) || hasPencilAutocomplete(f.text)) {
      out.push(hit(f.path, "autocomplete text while writing with Pencil"));
    }
  }
  return out;
}

function applyPeSuggest(text) {
  return text.replace(/\s*data-pe-suggest(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "pe-hover",
    rewrite: "marker",
    scan: scanPeHover,
    apply(text, file) {
      return applyPeHover(text);
    },
  },
  {
    id: "pe-double-tap",
    rewrite: "marker",
    scan: scanPeDoubleTap,
    apply(text, file) {
      return applyPeDoubleTap(text);
    },
  },
  {
    id: "pe-distract",
    rewrite: "marker",
    scan: scanPeDistract,
    apply(text, file) {
      return applyPeDistract(text);
    },
  },
  {
    id: "pe-squeeze",
    rewrite: "marker",
    scan: scanPeSqueeze,
    apply(text, file) {
      return applyPeSqueeze(text);
    },
  },
  {
    id: "pe-preview",
    rewrite: "marker",
    scan: scanPePreview,
    apply(text, file) {
      return applyPePreview(text);
    },
  },
  {
    id: "pe-hand",
    rewrite: "marker",
    scan: scanPeHand,
    apply(text, file) {
      return applyPeHand(text);
    },
  },
  {
    id: "pe-on",
    rewrite: "marker",
    scan: scanPeOn,
    apply(text, file) {
      return applyPeOn(text);
    },
  },
  {
    id: "pe-mode",
    rewrite: "marker",
    scan: scanPeMode,
    apply(text, file) {
      return applyPeMode(text);
    },
  },
  {
    id: "pe-far",
    rewrite: "marker",
    scan: scanPeFar,
    apply(text, file) {
      return applyPeFar(text);
    },
  },
  {
    id: "pe-suggest",
    rewrite: "marker",
    scan: scanPeSuggest,
    apply(text, file) {
      return applyPeSuggest(text);
    },
  },
];
