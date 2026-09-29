import { hit } from "./shared.mjs";

function hasDisclosureWidget(text) {
  return (
    /\bdata-disclosure\b/.test(text) ||
    /<details\b/i.test(text) ||
    /\bDisclosureGroup\s*\(/.test(text) ||
    /BezelStyle\.(disclosure|pushDisclosure)/.test(text)
  );
}

function scanExtraDisclosureButton(files) {
  const out = [];
  for (const f of files) {
    if (/data-many-disclosure-buttons/.test(f.text)) {
      out.push(hit(f.path, "more than one disclosure button in a view"));
      continue;
    }
    if (!hasDisclosureWidget(f.text)) continue;
    const buttons = f.text.match(/data-disclosure-button|pushDisclosure/g) || [];
    if (buttons.length >= 2) {
      out.push(hit(f.path, "more than one disclosure button in a view"));
    }
  }
  return out;
}

function applyExtraDisclosureButton(text) {
  return text.replace(/\s*data-many-disclosure-buttons(?:="[^"]*")?/g, "");
}

function scanUnlabeledDisclosureTriangle(files) {
  const out = [];
  for (const f of files) {
    if (/data-unlabeled-disclosure/.test(f.text)) {
      out.push(hit(f.path, "disclosure triangle without a descriptive label"));
      continue;
    }
    if (!hasDisclosureWidget(f.text)) continue;
    if (/<details\b/i.test(f.text) && !/<summary\b[^>]*>\s*\S/i.test(f.text)) {
      out.push(hit(f.path, "disclosure triangle without a descriptive label"));
    }
  }
  return out;
}

function applyUnlabeledDisclosureTriangle(text) {
  return text.replace(/\s*data-unlabeled-disclosure(?:="[^"]*")?/g, "");
}

function scanAdvancedDetailsUnhidden(files) {
  const out = [];
  for (const f of files) {
    if (/data-advanced-unhidden/.test(f.text)) {
      out.push(hit(f.path, "advanced details shown without hiding them"));
    }
  }
  return out;
}

function applyAdvancedDetailsUnhidden(text) {
  return text.replace(/\s*data-advanced-unhidden(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "extra-disclosure-button",
    rewrite: "marker",
    scan: scanExtraDisclosureButton,
    apply(text, file) {
      return applyExtraDisclosureButton(text);
    },
  },
  {
    id: "unlabeled-disclosure-triangle",
    rewrite: "marker",
    scan: scanUnlabeledDisclosureTriangle,
    apply(text, file) {
      return applyUnlabeledDisclosureTriangle(text);
    },
  },
  {
    id: "advanced-details-unhidden",
    rewrite: "marker",
    scan: scanAdvancedDetailsUnhidden,
    apply(text, file) {
      return applyAdvancedDetailsUnhidden(text);
    },
  },
];
