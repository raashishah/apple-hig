import { hit } from "./shared.mjs";

function hasPanel(text) {
  return /\bdata-panel\b/.test(text) || /\bNSPanel\b/.test(text) || /\bdata-hud\b/.test(text);
}

function hasPnWindowMenuCopy(text) {
  return (
    /window menu documents list/i.test(text) ||
    /listed in the window menu/i.test(text) ||
    (/window menu/i.test(text) && /documents list/i.test(text))
  );
}

function hasPnMinimizeCopy(text) {
  return (
    /minimize button on a panel/i.test(text) ||
    (/panel/i.test(text) && /minimizable\s*[:=]\s*true/i.test(text)) ||
    (/panel/i.test(text) && /\bminimize button\b/i.test(text))
  );
}

function hasPnHudObscureCopy(text) {
  return (
    /obscures the content it adjusts/i.test(text) ||
    (/\bhud\b/i.test(text) && /obscur/i.test(text))
  );
}

function scanPnWindowMenu(files) {
  const out = [];
  for (const f of files) {
    if (/data-pn-window-menu/.test(f.text)) {
      out.push(hit(f.path, "a panel listed in the window menu documents list"));
      continue;
    }
    if (!hasPanel(f.text)) continue;
    if (hasPnWindowMenuCopy(f.text)) {
      out.push(hit(f.path, "a panel listed in the window menu documents list"));
    }
  }
  return out;
}

function applyPnWindowMenu(text) {
  return text.replace(/\s*data-pn-window-menu(?:="[^"]*")?/g, "");
}

function scanPnMinimize(files) {
  const out = [];
  for (const f of files) {
    if (/data-pn-minimize/.test(f.text)) {
      out.push(hit(f.path, "a minimize button on a panel"));
      continue;
    }
    if (!hasPanel(f.text)) continue;
    if (hasPnMinimizeCopy(f.text)) {
      out.push(hit(f.path, "a minimize button on a panel"));
    }
  }
  return out;
}

function applyPnMinimize(text) {
  return text.replace(/\s*data-pn-minimize(?:="[^"]*")?/g, "");
}

function scanPnHudObscure(files) {
  const out = [];
  for (const f of files) {
    if (/data-pn-hud-obscure/.test(f.text)) {
      out.push(hit(f.path, "a hud that obscures the content it adjusts"));
      continue;
    }
    if (!hasPanel(f.text)) continue;
    if (hasPnHudObscureCopy(f.text)) {
      out.push(hit(f.path, "a hud that obscures the content it adjusts"));
    }
  }
  return out;
}

function applyPnHudObscure(text) {
  return text.replace(/\s*data-pn-hud-obscure(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "pn-window-menu",
    rewrite: "marker",
    scan: scanPnWindowMenu,
    apply(text, file) {
      return applyPnWindowMenu(text);
    },
  },
  {
    id: "pn-minimize",
    rewrite: "marker",
    scan: scanPnMinimize,
    apply(text, file) {
      return applyPnMinimize(text);
    },
  },
  {
    id: "pn-hud-obscure",
    rewrite: "marker",
    scan: scanPnHudObscure,
    apply(text, file) {
      return applyPnHudObscure(text);
    },
  },
];
