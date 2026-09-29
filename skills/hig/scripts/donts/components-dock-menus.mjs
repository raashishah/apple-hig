import { hit } from "./shared.mjs";

function hasDockMenu(text) {
  return /\bdata-dock-menu\b/.test(text) || /\bapplicationDockMenu\b/.test(text);
}

function dockMenuBlocks(text) {
  const blocks = [];
  const re = /<([A-Za-z][\w]*)\b[^>]*\bdata-dock-menu\b[^>]*>[\s\S]*?<\/\1>/g;
  let match;
  while ((match = re.exec(text))) blocks.push(match[0]);
  return blocks;
}

function dockItemTitles(block) {
  const titles = [];
  const re = /<(?:button|a)\b[^>]*>([^<]*)</gi;
  let match;
  while ((match = re.exec(block))) {
    const title = match[1].replace(/\s+/g, " ").trim();
    if (title) titles.push(title);
  }
  return titles;
}

function hasDockOnlyItem(text) {
  const blocks = dockMenuBlocks(text);
  if (!blocks.length) return false;
  let outside = text;
  for (const block of blocks) outside = outside.split(block).join(" ");
  for (const block of blocks) {
    for (const title of dockItemTitles(block)) {
      if (!outside.includes(title)) return true;
    }
  }
  return false;
}

function hasDkElsewhereCopy(text) {
  return /not available in other places/i.test(text) || hasDockOnlyItem(text);
}

function scanDkElsewhere(files) {
  const out = [];
  for (const f of files) {
    if (/data-dk-elsewhere/.test(f.text)) {
      out.push(hit(f.path, "a custom Dock menu item that is not available in other places"));
      continue;
    }
    if (!hasDockMenu(f.text)) continue;
    if (hasDkElsewhereCopy(f.text)) {
      out.push(hit(f.path, "a custom Dock menu item that is not available in other places"));
    }
  }
  return out;
}

function applyDkElsewhere(text) {
  return text.replace(/\s*data-dk-elsewhere(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "dk-elsewhere",
    rewrite: "marker",
    scan: scanDkElsewhere,
    apply(text, file) {
      return applyDkElsewhere(text);
    },
  },
];
