import { hit } from "./shared.mjs";

function hasActivityRings(text) {
  return (
    /\bdata-activity-rings\b/.test(text) ||
    /\bHKActivityRingView\b/.test(text) ||
    /\bWKInterfaceActivityRing\b/.test(text)
  );
}

function hasActivityRingsOtherDataCopy(text) {
  return (
    /other types of data/i.test(text) ||
    /\b(sales|revenue) ring\b/i.test(text)
  );
}

function hasActivityRingsMultiPersonCopy(text) {
  return /more than one person/i.test(text);
}

function scanActivityRingsOtherData(files) {
  const out = [];
  for (const f of files) {
    if (/data-activity-rings-other/.test(f.text)) {
      out.push(hit(f.path, "activity rings used for other types of data"));
      continue;
    }
    if (!hasActivityRings(f.text)) continue;
    if (hasActivityRingsOtherDataCopy(f.text)) {
      out.push(hit(f.path, "activity rings used for other types of data"));
    }
  }
  return out;
}

function applyActivityRingsOtherData(text) {
  return text.replace(/\s*data-activity-rings-other(?:="[^"]*")?/g, "");
}

function scanActivityRingsMultiPerson(files) {
  const out = [];
  for (const f of files) {
    if (/data-activity-rings-multi/.test(f.text)) {
      out.push(hit(f.path, "activity rings used for more than one person"));
      continue;
    }
    if (!hasActivityRings(f.text)) continue;
    if (hasActivityRingsMultiPersonCopy(f.text)) {
      out.push(hit(f.path, "activity rings used for more than one person"));
    }
  }
  return out;
}

function applyActivityRingsMultiPerson(text) {
  return text.replace(/\s*data-activity-rings-multi(?:="[^"]*")?/g, "");
}

function scanActivityRingsRecolor(files) {
  const out = [];
  for (const f of files) {
    if (/data-activity-rings-recolor/.test(f.text)) {
      out.push(hit(f.path, "recolored activity rings"));
    }
  }
  return out;
}

function applyActivityRingsRecolor(text) {
  return text.replace(/\s*data-activity-rings-recolor(?:="[^"]*")?/g, "");
}

function scanActivityRingsDecoration(files) {
  const out = [];
  for (const f of files) {
    if (/data-activity-rings-decor/.test(f.text)) {
      out.push(hit(f.path, "activity rings used for decoration or branding"));
    }
  }
  return out;
}

function applyActivityRingsDecoration(text) {
  return text.replace(/\s*data-activity-rings-decor(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "activity-rings-other-data",
    rewrite: "marker",
    scan: scanActivityRingsOtherData,
    apply(text, file) {
      return applyActivityRingsOtherData(text);
    },
  },
  {
    id: "activity-rings-multi-person",
    rewrite: "marker",
    scan: scanActivityRingsMultiPerson,
    apply(text, file) {
      return applyActivityRingsMultiPerson(text);
    },
  },
  {
    id: "activity-rings-recolor",
    rewrite: "marker",
    scan: scanActivityRingsRecolor,
    apply(text, file) {
      return applyActivityRingsRecolor(text);
    },
  },
  {
    id: "activity-rings-decoration",
    rewrite: "marker",
    scan: scanActivityRingsDecoration,
    apply(text, file) {
      return applyActivityRingsDecoration(text);
    },
  },
];
