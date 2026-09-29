import { hit } from "./shared.mjs";

function hasNearby(text) {
  return (
    /\bdata-nearby\b/.test(text) ||
    /\bNISession\b/.test(text) ||
    /\bNINearbyPeerConfiguration\b/.test(text) ||
    /\bNINearbyObject\b/.test(text) ||
    /\bNIDiscoveryToken\b/.test(text) ||
    /\bNearbyInteraction\b/.test(text)
  );
}

function hasNearbyOnlyWayCopy(text) {
  return /\b(the\s+)?only way\b/i.test(text);
}

function hasNearbyPortraitInstructionCopy(text) {
  return (
    /hold(?:ing)? (?:the device|your (?:iphone|phone|device)|it) in portrait/i.test(
      text,
    ) || /hold in portrait/i.test(text)
  );
}

function scanNearbyOnlyWay(files) {
  const out = [];
  for (const f of files) {
    if (/data-nearby-only/.test(f.text)) {
      out.push(hit(f.path, "nearby interaction as the only way to perform a task"));
      continue;
    }
    if (!hasNearby(f.text)) continue;
    if (hasNearbyOnlyWayCopy(f.text)) {
      out.push(hit(f.path, "nearby interaction as the only way to perform a task"));
    }
  }
  return out;
}

function applyNearbyOnlyWay(text) {
  return text.replace(/\s*data-nearby-only(?:="[^"]*")?/g, "");
}

function scanNearbyPortraitInstruction(files) {
  const out = [];
  for (const f of files) {
    if (/data-nearby-portrait/.test(f.text)) {
      out.push(hit(f.path, "explicit instruction to hold the device in portrait"));
      continue;
    }
    if (!hasNearby(f.text)) continue;
    if (hasNearbyPortraitInstructionCopy(f.text)) {
      out.push(hit(f.path, "explicit instruction to hold the device in portrait"));
    }
  }
  return out;
}

function applyNearbyPortraitInstruction(text) {
  return text.replace(/\s*data-nearby-portrait(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "nearby-only-way",
    rewrite: "marker",
    scan: scanNearbyOnlyWay,
    apply(text, file) {
      return applyNearbyOnlyWay(text);
    },
  },
  {
    id: "nearby-portrait-instruction",
    rewrite: "marker",
    scan: scanNearbyPortraitInstruction,
    apply(text, file) {
      return applyNearbyPortraitInstruction(text);
    },
  },
];
