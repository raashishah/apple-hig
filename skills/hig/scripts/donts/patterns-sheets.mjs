import { hit, dialogRegions, elementsWithRole } from "./shared.mjs";

function hasAlertWidget(text) {
  return (
    /<dialog\b/i.test(text) ||
    /role=["'](?:dialog|alertdialog)["']/i.test(text) ||
    /\bUIAlertController\b/.test(text) ||
    /\.alert\s*\(/.test(text)
  );
}

function hasAlertErrorCopy(text) {
  return (
    /avoid writing a title that doesn['’]?t convey useful information/i.test(text) ||
    /title that doesn['’]?t convey useful information/i.test(text) ||
    /alert title that is only Error or an error number/i.test(text)
  );
}

function hasBareErrorTitle(text) {
  const title = "Error(?:\\s+\\d+(?:\\s+occurred)?)?";
  const heading = new RegExp(`<(h[1-3])\\b[^>]*>\\s*${title}\\s*[.!?]?\\s*<\\/\\1>`, "i");
  for (const region of dialogRegions(text)) {
    if (heading.test(region)) return true;
  }
  const api = new RegExp(
    `(?:UIAlertController[\\s\\S]{0,240}title:\\s*["']${title}["']|title:\\s*["']${title}["'][\\s\\S]{0,240}UIAlertController|\\.alert\\(\\s*["']${title}["'])`,
    "i",
  );
  return api.test(text);
}

function scanAlertErrorTitle(files) {
  const out = [];
  for (const f of files) {
    if (/data-al-error/.test(f.text)) {
      out.push(hit(f.path, "an alert title that is only Error or an error number"));
      continue;
    }
    if (!hasAlertWidget(f.text)) continue;
    if (hasAlertErrorCopy(f.text) || hasBareErrorTitle(f.text)) {
      out.push(hit(f.path, "an alert title that is only Error or an error number"));
    }
  }
  return out;
}

function applyAlertErrorTitle(text) {
  return text.replace(/\s*data-al-error(?:="[^"]*")?/g, "");
}

function hasAlertCancelCopy(text) {
  return (
    /don['’]?t make a Cancel button the default/i.test(text) ||
    /Cancel button the default button/i.test(text) ||
    /use a Done button, not a Cancel button/i.test(text) ||
    /Cancel button that is the default button in an alert/i.test(text)
  );
}

function hasDefaultCancel(text) {
  const primary =
    /<button\b[^>]*\b(?:class|className)=["'][^"']*\bprimary\b[^"']*["'][^>]*>\s*Cancel\s*<\/button>/i;
  const variant =
    /<button\b[^>]*\b(?:variant|data-variant)=["']primary["'][^>]*>\s*Cancel\s*<\/button>/i;
  const submit = /<button\b[^>]*\btype=["']submit["'][^>]*>\s*Cancel\s*<\/button>/i;
  for (const region of dialogRegions(text)) {
    if (primary.test(region) || variant.test(region) || submit.test(region)) return true;
  }
  if (/\bUIAlertController\b/.test(text)) {
    if (
      /UIAlertAction\(\s*title:\s*["']Cancel["']\s*,\s*style:\s*\.default\b/i.test(text)
    ) {
      return true;
    }
  }
  if (!hasAlertWidget(text)) return false;
  const prominent =
    /Button\(\s*["']Cancel["'][\s\S]{0,240}buttonStyle\(\s*\.borderedProminent\s*\)|buttonStyle\(\s*\.borderedProminent\s*\)[\s\S]{0,240}Button\(\s*["']Cancel["']/i;
  const shortcut = /Button\(\s*["']Cancel["'][\s\S]{0,240}keyboardShortcut\(\s*\.defaultAction\s*\)/i;
  return prominent.test(text) || shortcut.test(text);
}

function scanAlertCancelDefault(files) {
  const out = [];
  for (const f of files) {
    if (/data-al-cancel/.test(f.text)) {
      out.push(hit(f.path, "a Cancel button that is the default button in an alert"));
      continue;
    }
    if (!hasAlertWidget(f.text)) continue;
    if (hasAlertCancelCopy(f.text) || hasDefaultCancel(f.text)) {
      out.push(hit(f.path, "a Cancel button that is the default button in an alert"));
    }
  }
  return out;
}

function applyAlertCancelDefault(text) {
  return text.replace(/\s*data-al-cancel(?:="[^"]*")?/g, "");
}

function hasAlertYesNoCopy(text) {
  return (
    /avoiding Yes and No/i.test(text) ||
    /don['’]?t use Yes or No/i.test(text) ||
    /Yes or No button in an alert/i.test(text)
  );
}

function hasYesNoButton(text) {
  const html = /<button\b[^>]*>\s*(?:Yes|No)\s*<\/button>/i;
  for (const region of dialogRegions(text)) {
    if (html.test(region)) return true;
  }
  if (/\bUIAlertController\b/.test(text)) {
    if (/UIAlertAction\(\s*title:\s*["'](?:Yes|No)["']/i.test(text)) return true;
  }
  if (!hasAlertWidget(text)) return false;
  return /Button\(\s*["'](?:Yes|No)["']/i.test(text);
}

function scanAlertYesNo(files) {
  const out = [];
  for (const f of files) {
    if (/data-al-yes\b/.test(f.text)) {
      out.push(hit(f.path, "a Yes or No button in an alert"));
      continue;
    }
    if (!hasAlertWidget(f.text)) continue;
    if (hasAlertYesNoCopy(f.text) || hasYesNoButton(f.text)) {
      out.push(hit(f.path, "a Yes or No button in an alert"));
    }
  }
  return out;
}

function applyAlertYesNo(text) {
  return text.replace(/\s*data-al-yes(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAlertCautionCopy(text) {
  return (
    /don['’]?t use the symbol for tasks whose only purpose is to overwrite or remove data/i.test(
      text,
    ) ||
    /symbol for a save or empty trash/i.test(text) ||
    /caution symbol on a Save or Empty Trash alert/i.test(text)
  );
}

function hasCautionOnSave(text) {
  const buttonRe = /<button\b[^>]*>\s*(?:Save|Empty Trash)\s*<\/button>/i;
  for (const region of dialogRegions(text)) {
    if (region.includes("exclamationmark.triangle") && buttonRe.test(region)) return true;
  }
  if (!hasAlertWidget(text) || !text.includes("exclamationmark.triangle")) return false;
  const titled =
    /(?:Button\(\s*["'](?:Save|Empty Trash)["']|UIAlertAction\(\s*title:\s*["'](?:Save|Empty Trash)["'])/i;
  const nearSymbol =
    /exclamationmark\.triangle[\s\S]{0,400}(?:Button\(\s*["'](?:Save|Empty Trash)["']|UIAlertAction\(\s*title:\s*["'](?:Save|Empty Trash)["'])|(?:Button\(\s*["'](?:Save|Empty Trash)["']|UIAlertAction\(\s*title:\s*["'](?:Save|Empty Trash)["'])[\s\S]{0,400}exclamationmark\.triangle/i;
  if (/\bUIAlertController\b/.test(text) && titled.test(text) && nearSymbol.test(text)) return true;
  if (/\.alert\s*\(|confirmationDialog\s*\(/.test(text) && nearSymbol.test(text)) return true;
  return false;
}

function scanAlertCautionOnSave(files) {
  const out = [];
  for (const f of files) {
    if (/data-al-caution\b/.test(f.text)) {
      out.push(hit(f.path, "a caution symbol on a Save or Empty Trash alert"));
      continue;
    }
    if (!hasAlertWidget(f.text)) continue;
    if (hasAlertCautionCopy(f.text) || hasCautionOnSave(f.text)) {
      out.push(hit(f.path, "a caution symbol on a Save or Empty Trash alert"));
    }
  }
  return out;
}

function applyAlertCautionOnSave(text) {
  return text.replace(/\s*data-al-caution(?:="[^"]*")?(?![\w-])/g, "");
}

function hasSheetWidget(text) {
  return (
    /<dialog\b/i.test(text) ||
    /role=["'](?:dialog|alertdialog)["']/i.test(text) ||
    /\.sheet\s*\(/.test(text) ||
    /\bUISheetPresentationController\b/.test(text) ||
    /\bpresentAsSheet\s*\(/.test(text)
  );
}

function hasSheetTrioCopy(text) {
  return (
    /avoid showing all three buttons/i.test(text) ||
    /Cancel, Done, and Back — together/i.test(text) ||
    /Cancel, Done, and Back together in a sheet/i.test(text)
  );
}

function hasExactButton(region, label) {
  return new RegExp(`<button\\b[^>]*>\\s*${label}\\s*<\\/button>`, "i").test(region);
}

function hasSheetTrioButtons(text) {
  const labels = ["Cancel", "Done", "Back"];
  for (const region of dialogRegions(text)) {
    if (labels.every((label) => hasExactButton(region, label))) return true;
  }
  if (!/\.sheet\s*\(|\bUISheetPresentationController\b|\bpresentAsSheet\s*\(/.test(text)) return false;
  return labels.every((label) => new RegExp(`Button\\(\\s*["']${label}["']`, "i").test(text));
}

function scanSheetTrio(files) {
  const out = [];
  for (const f of files) {
    if (/data-sh-trio\b/.test(f.text)) {
      out.push(hit(f.path, "Cancel, Done, and Back together in a sheet"));
      continue;
    }
    if (!hasSheetWidget(f.text)) continue;
    if (hasSheetTrioCopy(f.text) || hasSheetTrioButtons(f.text)) {
      out.push(hit(f.path, "Cancel, Done, and Back together in a sheet"));
    }
  }
  return out;
}

function applySheetTrio(text) {
  return text.replace(/\s*data-sh-trio(?:="[^"]*")?(?![\w-])/g, "");
}

function hasSheetDoneOnlyCopy(text) {
  return (
    /always pair it with a Cancel button/i.test(text) ||
    /relying solely on the Done button/i.test(text) ||
    /Done button to exit a sheet/i.test(text)
  );
}

function regionButtonLabels(region) {
  const labels = [];
  const re = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;
  let m;
  while ((m = re.exec(region))) {
    labels.push(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase());
  }
  return labels;
}

function isDoneOnlyExit(labels) {
  if (!labels.includes("done")) return false;
  return !labels.includes("cancel") && !labels.includes("close") && !labels.includes("back");
}

function hasSheetDoneOnlyButtons(text) {
  if (!/\.sheet\s*\(|\bUISheetPresentationController\b|\bpresentAsSheet\s*\(/.test(text)) return false;
  for (const region of dialogRegions(text)) {
    if (isDoneOnlyExit(regionButtonLabels(region))) return true;
  }
  const labels = ["done", "cancel", "close", "back"].filter((name) =>
    new RegExp(`Button\\(\\s*["']${name}["']`, "i").test(text),
  );
  return isDoneOnlyExit(labels);
}

function scanSheetDoneOnly(files) {
  const out = [];
  for (const f of files) {
    if (/data-sh-done\b/.test(f.text)) {
      out.push(hit(f.path, "relying solely on the Done button to exit a sheet"));
      continue;
    }
    if (!hasSheetWidget(f.text)) continue;
    if (hasSheetDoneOnlyCopy(f.text) || hasSheetDoneOnlyButtons(f.text)) {
      out.push(hit(f.path, "relying solely on the Done button to exit a sheet"));
    }
  }
  return out;
}

function applySheetDoneOnly(text) {
  return text.replace(/\s*data-sh-done(?:="[^"]*")?(?![\w-])/g, "");
}

function hasNestedDialogTags(text) {
  let depth = 0;
  const re = /<(\/)?dialog\b[^>]*>/gi;
  let m;
  while ((m = re.exec(text))) {
    const selfClose = /\/\s*>$/.test(m[0]);
    if (m[1]) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    depth += 1;
    if (depth >= 2) return true;
    if (selfClose) depth -= 1;
  }
  return false;
}

function overlayOpenBlocks(text) {
  const out = [];
  const openRe = /<([A-Za-z][\w]*)\b[^>]*\brole=["'](?:dialog|alertdialog)["'][^>]*>/gi;
  let m;
  while ((m = openRe.exec(text))) {
    const tag = m[1];
    let i = m.index + m[0].length;
    let depth = 1;
    const reopen = new RegExp(`<${tag}\\b`, "gi");
    const close = new RegExp(`</${tag}\\s*>`, "gi");
    while (depth > 0 && i < text.length) {
      reopen.lastIndex = i;
      close.lastIndex = i;
      const nOpen = reopen.exec(text);
      const nClose = close.exec(text);
      if (!nClose) {
        i = Math.min(text.length, m.index + 4000);
        break;
      }
      if (nOpen && nOpen.index < nClose.index) {
        depth += 1;
        i = nOpen.index + nOpen[0].length;
      } else {
        depth -= 1;
        i = nClose.index + nClose[0].length;
      }
    }
    out.push(text.slice(m.index, i));
  }
  return out;
}

function scanNestedModalStacks(files) {
  const out = [];
  for (const f of files) {
    if (/data-nested-modal/.test(f.text)) {
      out.push(hit(f.path, "nested modal stacks"));
      continue;
    }
    if (hasNestedDialogTags(f.text)) {
      out.push(hit(f.path, "nested modal stacks"));
      continue;
    }
    const nestedRole = overlayOpenBlocks(f.text).some((block) => {
      const inner = block.replace(/^<[^>]+>/, "");
      return /\brole=["'](?:dialog|alertdialog)["']/i.test(inner);
    });
    if (nestedRole) {
      out.push(hit(f.path, "nested modal stacks"));
      continue;
    }
    if (
      /\.sheet\s*\([\s\S]{0,1200}?\{[\s\S]{0,1200}?(\.sheet\s*\(|\.alert\s*\(|\.confirmationDialog\s*\(|\.fullScreenCover\s*\()/.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "nested modal stacks"));
    }
  }
  return out;
}

function applyNestedModalStacks(text) {
  return text.replace(/\s*data-nested-modal(?:="[^"]*")?/g, "");
}

function headingLineCount(inner) {
  const normalized = String(inner || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li)>/gi, "\n");
  const text = normalized.replace(/<[^>]+>/g, "");
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function titleLineCount(raw) {
  return String(raw || "")
    .replace(/\\n/g, "\n")
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function alertTitleTooLong(text) {
  const roleRe = /<([A-Za-z][\w]*)\b[^>]*role=["']alertdialog["'][^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = roleRe.exec(text))) {
    const heading = m[2].match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i);
    if (heading && headingLineCount(heading[1]) > 2) return true;
  }
  const titles = [];
  if (/\bUIAlertController\b/.test(text)) {
    const titled = /\btitle:\s*"([^"]*)"/g;
    let u;
    while ((u = titled.exec(text))) titles.push(u[1]);
  }
  if (/\.alert\s*\(/.test(text)) {
    const titled = /\.alert\(\s*"([^"]*)"/g;
    let u;
    while ((u = titled.exec(text))) titles.push(u[1]);
  }
  return titles.some((title) => titleLineCount(title) > 2);
}

function hasAlertTitleLinesCopy(text) {
  return (
    /wrap to more than two lines/i.test(text) ||
    /alert title that wraps to more than two lines/i.test(text)
  );
}

function scanAlertTitleLines(files) {
  const out = [];
  for (const f of files) {
    if (/data-al-lines(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an alert title that wraps to more than two lines"));
      continue;
    }
    if (alertTitleTooLong(f.text) || (hasAlertWidget(f.text) && hasAlertTitleLinesCopy(f.text))) {
      out.push(hit(f.path, "an alert title that wraps to more than two lines"));
    }
  }
  return out;
}

function applyAlertTitleLines(text) {
  return text.replace(/\s*data-al-lines(?:="[^"]*")?(?![\w-])/g, "");
}

function collectedAlertTitles(text) {
  const titles = [];
  const roleRe = /<([A-Za-z][\w]*)\b[^>]*role=["']alertdialog["'][^>]*>[\s\S]*?<\/\1>/gi;
  let found;
  while ((found = roleRe.exec(text))) {
    const heading = found[0].match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i);
    if (heading) titles.push(heading[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  }
  if (/\bUIAlertController\b/.test(text)) {
    const titled = /\btitle:\s*"([^"]*)"/g;
    let title;
    while ((title = titled.exec(text))) titles.push(title[1].trim());
  }
  if (/\.alert\s*\(/.test(text)) {
    const titled = /\.alert\(\s*"([^"]*)"/g;
    let title;
    while ((title = titled.exec(text))) titles.push(title[1].trim());
  }
  return titles;
}

function shortAlertTitleHasPunctuation(text) {
  return collectedAlertTitles(text).some((title) => {
    const trimmed = title.trim();
    if (!/[.!?]$/.test(trimmed)) return false;
    const words = trimmed.replace(/[.!?]+$/g, "").trim().split(/\s+/).filter(Boolean);
    return words.length > 0 && words.length <= 4;
  });
}

function hasAlertPunctuationCopy(text) {
  return /do not add ending punctuation|don['’]?t add ending punctuation/i.test(text);
}

function hasAlertTitleWidget(text) {
  return /role=["']alertdialog["']/i.test(text) || /\bUIAlertController\b/.test(text) || /\.alert\s*\(/.test(text);
}

function scanAlertPunctuation(files) {
  const out = [];
  for (const f of files) {
    if (/data-al-punct(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a short alert title that ends with punctuation"));
      continue;
    }
    if (!hasAlertTitleWidget(f.text)) continue;
    if (shortAlertTitleHasPunctuation(f.text) || hasAlertPunctuationCopy(f.text)) {
      out.push(hit(f.path, "a short alert title that ends with punctuation"));
    }
  }
  return out;
}

function applyAlertPunctuation(text) {
  return text.replace(/\s*data-al-punct(?:="[^"]*")?(?![\w-])/g, "");
}

function hasAlertScrollWidget(text) {
  return /role=["']alertdialog["']/i.test(text) || /\bUIAlertController\b/.test(text);
}

function alertScrollRegions(text) {
  const out = [];
  const roleRe = /<([A-Za-z][\w]*)\b[^>]*role=["']alertdialog["'][^>]*>[\s\S]*?<\/\1>/gi;
  let m;
  while ((m = roleRe.exec(text))) out.push(m[0]);
  const ui = /\bUIAlertController\b/g;
  while ((m = ui.exec(text))) out.push(text.slice(m.index, m.index + 500));
  return out;
}

function alertOwnStyleScrolls(region) {
  const open = region.match(/<([A-Za-z][\w]*)\b[^>]*>/);
  const tag = open ? open[0] : "";
  if (!tag) return false;
  return (
    /(?<![\w-])overflow(?:-[xy])?\s*:\s*["']?(?:auto|scroll)\b/i.test(tag) ||
    /\boverflow[XY]?\s*:\s*["'](?:auto|scroll)["']/.test(tag)
  );
}

function hasAlertScrollCopy(text) {
  return /alert that scrolls/i.test(text);
}

function scanAlertScroll(files) {
  const out = [];
  for (const f of files) {
    if (/data-al-scroll(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an alert that scrolls"));
      continue;
    }
    if (!hasAlertScrollWidget(f.text)) continue;
    if (alertScrollRegions(f.text).some(alertOwnStyleScrolls) || hasAlertScrollCopy(f.text)) {
      out.push(hit(f.path, "an alert that scrolls"));
    }
  }
  return out;
}

function applyAlertScroll(text) {
  return text.replace(/\s*data-al-scroll(?:="[^"]*")?(?![\w-])/g, "");
}

function hasActionSheetWidget(text) {
  return /\bconfirmationDialog\s*\(/.test(text) || /\.actionSheet\b/.test(text) || /\bdata-action-sheet\b/.test(text);
}

function actionSheetScrolls(text) {
  if (/\bconfirmationDialog\s*\(/.test(text)) {
    const re = /\bconfirmationDialog\s*\(/g;
    let found;
    while ((found = re.exec(text))) {
      const slice = text.slice(found.index, found.index + 800);
      if (/\bScrollView\b/.test(slice)) return true;
    }
  }
  if (/\.actionSheet\b/.test(text)) {
    const re = /\.actionSheet\b/g;
    let found;
    while ((found = re.exec(text))) {
      const slice = text.slice(found.index, found.index + 800);
      if (/\bScrollView\b/.test(slice)) return true;
    }
  }
  const tagRe = /<[^>]*\bdata-action-sheet\b[^>]*>/gi;
  let tag;
  while ((tag = tagRe.exec(text))) {
    if (/(?<![\w-])overflow(?:-[xy])?\s*:\s*["']?(?:auto|scroll)\b/i.test(tag[0])) return true;
    if (/\boverflow[XY]?\s*:\s*["'](?:auto|scroll)["']/.test(tag[0])) return true;
  }
  return false;
}

function hasActionSheetScrollCopy(text) {
  return /letting an action sheet scroll/i.test(text);
}

function scanActionSheetScroll(files) {
  const out = [];
  for (const f of files) {
    if (/data-act-scroll(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an action sheet that scrolls"));
      continue;
    }
    if (!hasActionSheetWidget(f.text)) continue;
    if (actionSheetScrolls(f.text) || hasActionSheetScrollCopy(f.text)) {
      out.push(hit(f.path, "an action sheet that scrolls"));
    }
  }
  return out;
}

function applyActionSheetScroll(text) {
  return text.replace(/\s*data-act-scroll(?:="[^"]*")?(?![\w-])/g, "");
}

function alertButtonLabel(chunk) {
  const open = chunk.match(/^<[^>]*>/);
  const tag = open ? open[0] : "";
  const aria = tag.match(/\baria-label=["']([^"']+)["']/i);
  if (aria) return aria[1].trim();
  return chunk.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function messageExplainsLabel(message, label) {
  const name = String(label || "").trim();
  if (name.length < 2 || name.length > 40) return false;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b(?:tap|press|click|choose)\\s+${escaped}\\b`, "i").test(message);
}

function regionExplainsAlertButton(region) {
  const labels = [];
  const re = /<(button|a)\b[^>]*>[\s\S]*?<\/\1>/gi;
  let m;
  while ((m = re.exec(region))) {
    const label = alertButtonLabel(m[0]);
    if (label) labels.push(label);
  }
  if (!labels.length) return false;
  const message = region
    .replace(/<(button|a)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  return labels.some((label) => messageExplainsLabel(message, label));
}

function swiftAlertExplainsButton(text) {
  const re = /\.alert\s*\(/g;
  let m;
  while ((m = re.exec(text))) {
    const window = text.slice(m.index, m.index + 1200);
    const labels = [...window.matchAll(/\bButton\s*\(\s*"([^"]+)"/g)].map((item) => item[1]);
    const messages = [...window.matchAll(/\bText\s*\(\s*"([^"]+)"/g)].map((item) => item[1]);
    const blob = messages.join(" ");
    if (labels.some((label) => messageExplainsLabel(blob, label))) return true;
  }
  return false;
}

function uikitAlertExplainsButton(text) {
  if (!/\bUIAlertController\b/.test(text) || !/\.alert\b/.test(text)) return false;
  const message = (text.match(/\bmessage:\s*"([^"]*)"/) || [])[1] || "";
  const labels = [...text.matchAll(/\bUIAlertAction\s*\(\s*title:\s*"([^"]+)"/g)].map((item) => item[1]);
  return labels.some((label) => messageExplainsLabel(message, label));
}

function hasExplainAlertButton(text) {
  if (elementsWithRole(text, "alertdialog").some(regionExplainsAlertButton)) return true;
  if (swiftAlertExplainsButton(text)) return true;
  if (uikitAlertExplainsButton(text)) return true;
  return false;
}

function hasExplainAlertCopy(text) {
  return /explaining alert buttons/i.test(text) || /alert message that explains a button/i.test(text);
}

function hasExplainAlertWidget(text) {
  return /role=["']alertdialog["']/i.test(text) || /\.alert\s*\(/.test(text) || /\bUIAlertController\b/.test(text);
}

function scanExplainAlertButton(files) {
  const out = [];
  for (const f of files) {
    if (/data-al-hint(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an alert message that explains a button"));
      continue;
    }
    if (hasExplainAlertButton(f.text) || (hasExplainAlertCopy(f.text) && hasExplainAlertWidget(f.text))) {
      out.push(hit(f.path, "an alert message that explains a button"));
    }
  }
  return out;
}

function applyExplainAlertButton(text) {
  return text.replace(/\s*data-al-hint(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "al-lines",
    rewrite: "marker",
    scan: scanAlertTitleLines,
    apply(text, file) {
      return applyAlertTitleLines(text);
    },
  },
  {
    id: "al-punct",
    rewrite: "marker",
    scan: scanAlertPunctuation,
    apply(text, file) {
      return applyAlertPunctuation(text);
    },
  },
  {
    id: "al-scroll",
    rewrite: "marker",
    scan: scanAlertScroll,
    apply(text, file) {
      return applyAlertScroll(text);
    },
  },
  {
    id: "ash-scroll",
    rewrite: "marker",
    scan: scanActionSheetScroll,
    apply(text, file) {
      return applyActionSheetScroll(text);
    },
  },
  {
    id: "al-hint",
    rewrite: "marker",
    scan: scanExplainAlertButton,
    apply(text, file) {
      return applyExplainAlertButton(text);
    },
  },
  {
    id: "nested-modal-stacks",
    rewrite: "marker",
    scan: scanNestedModalStacks,
    apply(text, file) {
      return applyNestedModalStacks(text);
    },
  },
  {
    id: "al-error",
    rewrite: "marker",
    scan: scanAlertErrorTitle,
    apply(text, file) {
      return applyAlertErrorTitle(text);
    },
  },
  {
    id: "al-cancel",
    rewrite: "marker",
    scan: scanAlertCancelDefault,
    apply(text, file) {
      return applyAlertCancelDefault(text);
    },
  },
  {
    id: "al-yes-no",
    rewrite: "marker",
    scan: scanAlertYesNo,
    apply(text, file) {
      return applyAlertYesNo(text);
    },
  },
  {
    id: "al-caution",
    rewrite: "marker",
    scan: scanAlertCautionOnSave,
    apply(text, file) {
      return applyAlertCautionOnSave(text);
    },
  },
  {
    id: "sh-trio",
    rewrite: "marker",
    scan: scanSheetTrio,
    apply(text, file) {
      return applySheetTrio(text);
    },
  },
  {
    id: "sh-done",
    rewrite: "marker",
    scan: scanSheetDoneOnly,
    apply(text, file) {
      return applySheetDoneOnly(text);
    },
  },
];
