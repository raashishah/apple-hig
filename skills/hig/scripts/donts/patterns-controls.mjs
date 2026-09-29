import { hit, blocksWithAttr, countSubmitButtons, applyEqualWeightSubmits, openingTags } from "./shared.mjs";

function scanOkInsteadOfVerb(files) {
  const out = [];
  for (const f of files) {
    if (/>\s*OK\s*</.test(f.text) || /aria-label=["']OK["']/i.test(f.text)) {
      out.push(hit(f.path, "OK instead of a verb"));
    }
  }
  return out;
}

function applyOkInsteadOfVerb(text) {
  if (!/>\s*OK\s*</.test(text) && !/aria-label=["']OK["']/i.test(text)) return text;
  if (!/handleSave|onSubmit|type=["']submit["']/.test(text)) return text;
  return text.replace(/>\s*OK\s*</g, ">Save<").replace(/aria-label=["']OK["']/gi, 'aria-label="Save"');
}

function scanToggleNavigates(files) {
  const out = [];
  for (const f of files) {
    if (!/role=["']switch["']|type=["']checkbox["']|\bToggle\s*\(/.test(f.text)) continue;
    const tagged = openingTags(f.text).some((t) => {
      if (!/role=["']switch["']/i.test(t.attrs)) return false;
      return (
        /type=["']submit["']/i.test(t.attrs) ||
        /href=/i.test(t.attrs) ||
        /data-toggle-nav/.test(t.attrs) ||
        t.tag.toLowerCase() === "a"
      );
    });
    if (
      tagged ||
      /data-toggle-nav/.test(f.text) ||
      /Toggle[\s\S]{0,240}(href=|router\.push|location\.href|navigate\()/i.test(f.text)
    ) {
      out.push(hit(f.path, "toggle used to navigate or submit"));
    }
  }
  return out;
}

function applyToggleNavigates(text) {
  let next = text.replace(/<([A-Za-z][\w]*)\b([^>]*)>/gi, (all, tag, attrs) => {
    if (!/role=["']switch["']/i.test(attrs)) return all;
    if (!/type=["']submit["']/i.test(attrs)) return all;
    return `<${tag}${attrs.replace(/type=["']submit["']/i, 'type="button"')}>`;
  });
  next = next.replace(/\s*data-toggle-nav(?:="[^"]*")?/g, "");
  return next;
}

function hasDestructivePrimaryCopy(text) {
  return (
    /don['’]?t assign the primary role to a button that performs a destructive action/i.test(text) ||
    /primary role to a button that performs a destructive action/i.test(text) ||
    /primary role on a button that performs a destructive action/i.test(text)
  );
}

function hasDestructivePrimary(text) {
  const label = "Delete|Remove|Erase|Destroy";
  const htmlPrimary = new RegExp(
    `<button\\b[^>]*\\b(?:class|className)=["'][^"']*\\bprimary\\b[^"']*["'][^>]*>\\s*(?:${label})\\s*</button>`,
    "i",
  );
  const htmlVariant = new RegExp(
    `<button\\b[^>]*(?:\\bvariant|\\bdata-variant)=["']primary["'][^>]*>\\s*(?:${label})\\s*</button>`,
    "i",
  );
  const htmlSubmit = new RegExp(
    `<button\\b[^>]*\\btype=["']submit["'][^>]*>\\s*(?:${label})\\s*</button>`,
    "i",
  );
  const swiftProminent = new RegExp(
    `Button\\(\\s*["'](?:${label})["'][\\s\\S]{0,240}buttonStyle\\(\\s*\\.borderedProminent\\s*\\)|buttonStyle\\(\\s*\\.borderedProminent\\s*\\)[\\s\\S]{0,240}Button\\(\\s*["'](?:${label})["']`,
    "i",
  );
  const swiftBoth =
    /role:\s*\.destructive[\s\S]{0,240}\.borderedProminent|\.borderedProminent[\s\S]{0,240}role:\s*\.destructive/i;
  return (
    htmlPrimary.test(text) ||
    htmlVariant.test(text) ||
    htmlSubmit.test(text) ||
    swiftProminent.test(text) ||
    swiftBoth.test(text)
  );
}

function scanDestructivePrimary(files) {
  const out = [];
  for (const f of files) {
    if (/data-bt-primary/.test(f.text)) {
      out.push(hit(f.path, "the primary role on a button that performs a destructive action"));
      continue;
    }
    if (hasDestructivePrimaryCopy(f.text) || hasDestructivePrimary(f.text)) {
      out.push(hit(f.path, "the primary role on a button that performs a destructive action"));
    }
  }
  return out;
}

function applyDestructivePrimary(text) {
  return text.replace(/\s*data-bt-primary(?:="[^"]*")?/g, "");
}

function hasRadioWidget(text) {
  return (
    /<input\b[^>]*\btype\s*=\s*["']radio["']/i.test(text) || /\.radioGroup\b/.test(text)
  );
}

function hasTooManyRadiosCopy(text) {
  return (
    /more than about five radio buttons/i.test(text) ||
    /too many radio buttons/i.test(text) ||
    /listing too many radio buttons/i.test(text)
  );
}

function namedRadioSetOverFive(text) {
  const counts = new Map();
  const re = /<input\b[^>]*>/gi;
  let m;
  while ((m = re.exec(text))) {
    const tag = m[0];
    if (!/\btype\s*=\s*["']radio["']/i.test(tag)) continue;
    const name = tag.match(/\bname\s*=\s*["']([^"']+)["']/i);
    if (!name || !name[1]) continue;
    counts.set(name[1], (counts.get(name[1]) || 0) + 1);
  }
  for (const count of counts.values()) {
    if (count > 5) return true;
  }
  return false;
}

function swiftRadioGroupOverFive(text) {
  const re = /\bPicker\b[\s\S]{0,1200}?\.pickerStyle\(\s*\.radioGroup\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    const tags = m[0].match(/\.tag\(/g);
    if (tags && tags.length > 5) return true;
  }
  return false;
}

function scanTooManyRadios(files) {
  const out = [];
  for (const f of files) {
    if (/data-tg-radios\b/.test(f.text)) {
      out.push(hit(f.path, "a set of more than about five radio buttons"));
      continue;
    }
    if (hasRadioWidget(f.text) && hasTooManyRadiosCopy(f.text)) {
      out.push(hit(f.path, "a set of more than about five radio buttons"));
      continue;
    }
    if (namedRadioSetOverFive(f.text) || swiftRadioGroupOverFive(f.text)) {
      out.push(hit(f.path, "a set of more than about five radio buttons"));
    }
  }
  return out;
}

function applyTooManyRadios(text) {
  return text.replace(/\s*data-tg-radios(?:="[^"]*")?(?![\w-])/g, "");
}

function hasSelectionButton(text) {
  return /\bchangesSelectionAsPrimaryAction\b/.test(text);
}

function hasSelectionLabelCopy(text) {
  return (
    /supplying a label that explains the button/i.test(text) ||
    /label that explains a button that changes the selection/i.test(text)
  );
}

function selectionButtonLabeled(text) {
  const re = /changesSelectionAsPrimaryAction/g;
  let m;
  while ((m = re.exec(text))) {
    const window = text.slice(Math.max(0, m.index - 500), m.index + 500);
    const title = window.match(/\btitle\s*[:=]\s*"([^"]*)"/);
    if (title && title[1].trim()) return true;
    const button = window.match(/\bButton\s*\(\s*"([^"]+)"/);
    if (button && button[1].trim()) return true;
  }
  return false;
}

function scanSelectionLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-tg-sel(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a label that explains a button that changes the selection"));
      continue;
    }
    if (!hasSelectionButton(f.text)) continue;
    if (hasSelectionLabelCopy(f.text) || selectionButtonLabeled(f.text)) {
      out.push(hit(f.path, "a label that explains a button that changes the selection"));
    }
  }
  return out;
}

function applySelectionLabel(text) {
  return text.replace(/\s*data-tg-sel(?:="[^"]*")?(?![\w-])/g, "");
}

const TOGGLE_COLOR_PROPS = new Set([
  "color",
  "background",
  "background-color",
  "fill",
  "stroke",
  "border-color",
  "outline-color",
  "caret-color",
]);

function cssBlocks(text) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) out.push({ selector: m[1], body: m[2] });
  return out;
}

function declMap(body) {
  const map = new Map();
  for (const part of String(body).split(/[;\n]/)) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim().toLowerCase();
    if (name) map.set(name, value);
  }
  return map;
}

function colorValue(name, value) {
  if (!TOGGLE_COLOR_PROPS.has(name)) return false;
  return !/url\s*\(|image-set\s*\(|linear-gradient|radial-gradient|repeating-/i.test(value);
}

function mapIsColorOnly(map) {
  if (map.size === 0) return false;
  let sawColor = false;
  for (const [name, value] of map) {
    if (!colorValue(name, value)) return false;
    sawColor = true;
  }
  return sawColor;
}

function mapsDifferOnlyByColor(a, b) {
  const keys = new Set([...a.keys(), ...b.keys()]);
  let colorDiff = false;
  for (const key of keys) {
    const av = a.get(key) || "";
    const bv = b.get(key) || "";
    if (av === bv) continue;
    if (!colorValue(key, av) || !colorValue(key, bv)) return false;
    colorDiff = true;
  }
  return colorDiff;
}

function pressedPolarity(selector) {
  if (/aria-pressed\s*=\s*["']?false/i.test(selector)) return "off";
  if (/aria-pressed\s*=\s*["']?true/i.test(selector)) return "on";
  return null;
}

function hasColorOnlyPressedCss(text) {
  let on = false;
  let off = false;
  for (const rule of cssBlocks(text)) {
    const polarity = pressedPolarity(rule.selector);
    if (!polarity) continue;
    if (!mapIsColorOnly(declMap(rule.body))) return false;
    if (polarity === "on") on = true;
    else off = true;
  }
  return on && off;
}

function pressedValue(tag) {
  const m = tag.match(/\baria-pressed\s*=\s*(?:\{)?\s*["']?(true|false)/i);
  if (m) return m[1].toLowerCase();
  if (/\baria-pressed\b/.test(tag) && !/\baria-pressed\s*=/.test(tag)) return "true";
  return null;
}

function styleDecls(tag) {
  let body = "";
  const css = tag.match(/\bstyle\s*=\s*"([^"]*)"/i);
  if (css) body = css[1];
  const jsx = tag.match(/\bstyle\s*=\s*\{\{([\s\S]*?)\}\}/);
  if (jsx) body = jsx[1].replace(/["']/g, "");
  return declMap(body);
}

function visibleControlText(block) {
  const inner = block.text.replace(/^<[^>]+>/, "").replace(/<\/[A-Za-z][\w]*\s*>\s*$/i, "");
  return inner
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function controlHasIcon(block) {
  return /<(svg|img)\b/i.test(block.text);
}

function controlHasCheck(block) {
  return /[✓✔☑]/.test(visibleControlText(block));
}

function controlIsSwitch(open) {
  return (
    /role\s*=\s*["']switch["']/i.test(open) ||
    /\btype\s*=\s*["']checkbox["']/i.test(open)
  );
}

function customPressedButtons(text) {
  const out = [];
  for (const block of blocksWithAttr(text, "aria-pressed")) {
    const open = block.text.match(/^<[^>]+>/)?.[0] || "";
    if (controlIsSwitch(open)) continue;
    if (controlHasIcon(block) || controlHasCheck(block)) continue;
    out.push({ block, open, text: visibleControlText(block) });
  }
  return out;
}

function inlineColorOnlyPair(buttons) {
  const usable = [];
  for (const button of buttons) {
    const value = pressedValue(button.open);
    if (!value) continue;
    const decls = styleDecls(button.open);
    if (decls.size === 0) continue;
    usable.push({ value, decls, text: button.text });
  }
  const ons = usable.filter((item) => item.value === "true");
  const offs = usable.filter((item) => item.value === "false");
  for (const on of ons) {
    for (const off of offs) {
      if (on.text !== off.text) continue;
      if (mapsDifferOnlyByColor(on.decls, off.decls)) return true;
    }
  }
  return false;
}

function swiftColorOnlyToggle(text) {
  const re =
    /(?:configuration\s*\.\s*)?isOn\s*\?\s*Color\s*\.\s*[A-Za-z]+[\s\S]{0,40}?:\s*Color\s*\.\s*[A-Za-z]+/g;
  let m;
  while ((m = re.exec(text))) {
    const window = text.slice(Math.max(0, m.index - 500), m.index + m[0].length + 200);
    if (/\bToggle\s*\(/.test(window) || /\bUISwitch\b/.test(window)) continue;
    if (/\bImage\s*\(/.test(window) || /checkmark/i.test(window)) continue;
    if (/\bButton\s*\(|\bToggleStyle\b|\bButtonStyle\b/.test(window)) return true;
  }
  return false;
}

function hasColorOnlyToggle(text) {
  const buttons = customPressedButtons(text);
  if (buttons.length > 0 && hasColorOnlyPressedCss(text)) return true;
  if (inlineColorOnlyPair(buttons)) return true;
  return swiftColorOnlyToggle(text);
}

function scanColorOnlyToggle(files) {
  const out = [];
  for (const f of files) {
    if (/data-tg-color(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a toggle that relies solely on different colors to communicate state"));
      continue;
    }
    if (hasColorOnlyToggle(f.text)) {
      out.push(hit(f.path, "a toggle that relies solely on different colors to communicate state"));
    }
  }
  return out;
}

function applyColorOnlyToggle(text) {
  return text.replace(/\s*data-tg-color(?:="[^"]*")?(?![\w-])/g, "");
}

function buttonIsSquare(tag) {
  const width = tag.match(/(?<![\w-])width\s*:\s*(\d+(?:\.\d+)?)/);
  const height = tag.match(/(?<![\w-])height\s*:\s*(\d+(?:\.\d+)?)/);
  if (!width || !height) return false;
  const w = Number(width[1]);
  const h = Number(height[1]);
  return w > 0 && w === h;
}

function buttonHasVisibleText(text, openEnd) {
  const close = text.toLowerCase().indexOf("</button>", openEnd);
  if (close < 0) return false;
  const inner = text
    .slice(openEnd, close)
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return /[A-Za-z0-9]/.test(inner);
}

function visibleLabelIntroduces(text, buttonIndex) {
  const before = text.slice(Math.max(0, buttonIndex - 200), buttonIndex);
  return (
    /<(?:label|span|p)\b[^>]*>\s*[A-Za-z][^<]{0,48}<\/(?:label|span|p)>\s*$/i.test(before) ||
    /<label\b[^>]*>\s*[A-Za-z][^<]{0,48}\s*$/i.test(before)
  );
}

function hasSquareButtonLabel(text) {
  const re = /<button\b[^>]*>/gi;
  let m;
  while ((m = re.exec(text))) {
    if (!buttonIsSquare(m[0])) continue;
    if (buttonHasVisibleText(text, m.index + m[0].length)) continue;
    if (visibleLabelIntroduces(text, m.index)) return true;
  }
  return false;
}

function hasSquareButtonCopy(text) {
  return (
    /labels to introduce square buttons/i.test(text) ||
    /label that introduces a square button/i.test(text)
  );
}

function scanSquareButtonLabel(files) {
  const out = [];
  for (const f of files) {
    if (/data-bt-square(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a label that introduces a square button"));
      continue;
    }
    if (hasSquareButtonLabel(f.text) || (hasSquareButtonCopy(f.text) && /<button\b/i.test(f.text))) {
      out.push(hit(f.path, "a label that introduces a square button"));
    }
  }
  return out;
}

function applySquareButtonLabel(text) {
  return text.replace(/\s*data-bt-square(?:="[^"]*")?(?![\w-])/g, "");
}

function buttonIsBordered(tag) {
  if (/\bisBordered\s*(?:=|:)\s*\{?\s*false\b/.test(tag)) return false;
  return /\bisBordered\b/.test(tag);
}

function buttonHasImage(text, openEnd) {
  const close = text.toLowerCase().indexOf("</button>", openEnd);
  if (close < 0) return false;
  return /<(?:svg|img)\b/i.test(text.slice(openEnd, close));
}

function hasBorderedImageButton(text) {
  const re = /<button\b[^>]*>/gi;
  let m;
  while ((m = re.exec(text))) {
    if (!buttonIsBordered(m[0])) continue;
    const openEnd = m.index + m[0].length;
    if (buttonHasVisibleText(text, openEnd)) continue;
    if (buttonHasImage(text, openEnd)) return true;
  }
  return false;
}

function hasImageBorderCopy(text) {
  return (
    /system-provided border in an image button/i.test(text) ||
    /image button with a system border/i.test(text)
  );
}

function scanImageButtonBorder(files) {
  const out = [];
  for (const f of files) {
    if (/data-bt-border(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an image button with a system border"));
      continue;
    }
    if (hasBorderedImageButton(f.text) || (hasImageBorderCopy(f.text) && /<button\b/i.test(f.text))) {
      out.push(hit(f.path, "an image button with a system border"));
    }
  }
  return out;
}

function applyImageButtonBorder(text) {
  return text.replace(/\s*data-bt-border(?:="[^"]*")?(?![\w-])/g, "");
}

function isReservedToggleTag(tag) {
  return (
    /\brole\s*=\s*["'](?:switch|checkbox|radio)["']/i.test(tag) ||
    /\btype\s*=\s*["'](?:checkbox|radio)["']/i.test(tag)
  );
}

function declaresWhiteFill(chunk) {
  return /(?:background(?:-color)?|backgroundColor)\s*[:=]\s*["']?\s*(?:white|#fff\b|#ffffff\b|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/i.test(
    chunk,
  );
}

function declaresBlackInk(chunk) {
  return /(?<![\w-])(?:color|foreground(?:Color|Style)?)\s*[:=]\s*["']?\s*(?:black|#000\b|#000000\b|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))/i.test(
    chunk,
  );
}

function classHasWhiteFillBlackInk(tag) {
  const named = tag.match(/\bclass(?:Name)?\s*=\s*["']([^"']+)["']/i);
  if (!named) return false;
  const parts = named[1].split(/\s+/);
  const white = parts.some((part) => part === "bg-white");
  const black = parts.some((part) => part === "text-black");
  return white && black;
}

function tagIsWhiteFillBlackButton(tag) {
  if (isReservedToggleTag(tag)) return false;
  if (classHasWhiteFillBlackInk(tag)) return true;
  return declaresWhiteFill(tag) && declaresBlackInk(tag);
}

function hasSwiftWhiteFillBlackButton(text) {
  const re = /\bButton\s*\(/g;
  let found;
  while ((found = re.exec(text))) {
    const slice = text.slice(found.index, found.index + 500);
    if (
      /\.background\(\s*\.white\s*\)/.test(slice) &&
      /\.foreground(?:Style|Color)\(\s*\.black\s*\)/.test(slice)
    ) {
      return true;
    }
  }
  return false;
}

function hasWhiteFillBlackButton(text) {
  const re = /<button\b[^>]*>/gi;
  let found;
  while ((found = re.exec(text))) {
    if (tagIsWhiteFillBlackButton(found[0])) return true;
  }
  return hasSwiftWhiteFillBlackButton(text);
}

function hasWhiteFillCopy(text) {
  return /white background fill and black text/i.test(text);
}

function hasNonToggleButton(text) {
  const re = /<button\b[^>]*>/gi;
  let found;
  while ((found = re.exec(text))) {
    if (!isReservedToggleTag(found[0])) return true;
  }
  return /\bButton\s*\(/.test(text);
}

function scanWhiteFillButton(files) {
  const out = [];
  for (const f of files) {
    if (/data-bt-white(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a custom button with a white background fill and black text"));
      continue;
    }
    if (hasWhiteFillBlackButton(f.text)) {
      out.push(hit(f.path, "a custom button with a white background fill and black text"));
      continue;
    }
    if (hasWhiteFillCopy(f.text) && hasNonToggleButton(f.text)) {
      out.push(hit(f.path, "a custom button with a white background fill and black text"));
    }
  }
  return out;
}

function applyWhiteFillButton(text) {
  return text.replace(/\s*data-bt-white(?:="[^"]*")?(?![\w-])/g, "");
}

function hasSegmentedWidget(text) {
  return (
    /role=["']radiogroup["']/i.test(text) ||
    /\bdata-segmented\b/.test(text) ||
    /\bUISegmentedControl\b/.test(text) ||
    /\.pickerStyle\(\s*\.segmented\s*\)/.test(text)
  );
}

function hasSegmentMixCopy(text) {
  return (
    /not a mix of both/i.test(text) ||
    /mix of text and images/i.test(text) ||
    /mixes text and images/i.test(text)
  );
}

function segmentKinds(region) {
  const kinds = [];
  const re = /<(button|a)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(region))) {
    const inner = m[2];
    const hasImage = /<(svg|img)\b/i.test(inner);
    const visible = inner
      .replace(/<svg\b[\s\S]*?<\/svg>/gi, "")
      .replace(/<img\b[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, "");
    kinds.push({ hasText: visible.length > 0, hasImage });
  }
  return kinds;
}

function kindsAreMix(kinds) {
  if (kinds.length < 2) return false;
  const key = (k) => `${k.hasText}:${k.hasImage}`;
  if (kinds.every((k) => key(k) === key(kinds[0]))) return false;
  return kinds.some((k) => k.hasText) && kinds.some((k) => k.hasImage);
}

function segmentedRegions(text) {
  const out = [];
  const re =
    /<(div|nav|fieldset)\b[^>]*(?:role=["']radiogroup["']|\bdata-segmented\b)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}

function webSegmentMix(text) {
  return segmentedRegions(text).some((region) => kindsAreMix(segmentKinds(region)));
}

function swiftSegmentMix(text) {
  const re = /\bPicker\b[\s\S]{0,1500}?\.pickerStyle\(\s*\.segmented\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    const body = m[0].replace(/\bLabel\s*\([^)]*\)/g, "");
    if (/\bText\s*\(\s*"/.test(body) && /\bImage\s*\(/.test(body)) return true;
  }
  return false;
}

function uiSegmentMix(text) {
  if (!/\bUISegmentedControl\b/.test(text)) return false;
  const title = /insertSegment\(withTitle:|setTitle\(/.test(text);
  const image = /insertSegment\(with:\s|setImage\(/.test(text);
  return title && image;
}

function scanSegmentMix(files) {
  const out = [];
  for (const f of files) {
    if (/data-sg-mix\b/.test(f.text)) {
      out.push(hit(f.path, "a segmented control that mixes text and images"));
      continue;
    }
    if (!hasSegmentedWidget(f.text)) continue;
    if (
      hasSegmentMixCopy(f.text) ||
      webSegmentMix(f.text) ||
      swiftSegmentMix(f.text) ||
      uiSegmentMix(f.text)
    ) {
      out.push(hit(f.path, "a segmented control that mixes text and images"));
    }
  }
  return out;
}

function applySegmentMix(text) {
  return text.replace(/\s*data-sg-mix(?:="[^"]*")?(?![\w-])/g, "");
}

function hasSegmentCountCopy(text) {
  return (
    /eight or more segments/i.test(text) ||
    /no more than about five to seven segments/i.test(text)
  );
}

function controlSegmentCount(region) {
  const tags = region.match(/<(button|a)\b/gi);
  return tags ? tags.length : 0;
}

function webSegmentCountOver(text, limit) {
  return segmentedRegions(text).some((region) => controlSegmentCount(region) > limit);
}

function swiftSegmentCountOver(text, limit) {
  const re = /\bPicker\b[\s\S]{0,2500}?\.pickerStyle\(\s*\.segmented\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    const tags = m[0].match(/\.tag\s*\(/g);
    if (tags && tags.length > limit) return true;
  }
  return false;
}

function scanSegmentCount(files) {
  const out = [];
  for (const f of files) {
    if (/data-sg-count(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a segmented control with eight or more segments"));
      continue;
    }
    if (!hasSegmentedWidget(f.text)) continue;
    if (
      hasSegmentCountCopy(f.text) ||
      webSegmentCountOver(f.text, 7) ||
      swiftSegmentCountOver(f.text, 7)
    ) {
      out.push(hit(f.path, "a segmented control with eight or more segments"));
    }
  }
  return out;
}

function applySegmentCount(text) {
  return text.replace(/\s*data-sg-count(?:="[^"]*")?(?![\w-])/g, "");
}

function hasSegmentRoleCopy(text) {
  return (
    /assign actions to segments/i.test(text) ||
    /selection state for segments/i.test(text) ||
    /segmented control that both selects and acts/i.test(text)
  );
}

function regionSelectsAndActs(region) {
  const selects =
    /role=["']radio["']/i.test(region) ||
    /aria-checked(?![\w-])/i.test(region) ||
    /aria-current=/i.test(region);
  const acts = /<a\b[^>]*\bhref=/i.test(region) || /type=["']submit["']/i.test(region);
  return selects && acts;
}

function webSelectsAndActs(text) {
  return segmentedRegions(text).some((region) => regionSelectsAndActs(region));
}

function swiftSelectsAndActs(text) {
  const re = /\bPicker\b[\s\S]{0,1500}?\.pickerStyle\(\s*\.segmented\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    const body = m[0];
    const selects = /\bselection\s*:/.test(body) || /\.tag\s*\(/.test(body);
    const acts = /\bButton\s*\(/.test(body) || /\bNavigationLink\s*\(/.test(body);
    if (selects && acts) return true;
  }
  return false;
}

function scanSegmentRole(files) {
  const out = [];
  for (const f of files) {
    if (/data-sg-role(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a segmented control that both selects and acts"));
      continue;
    }
    if (!hasSegmentedWidget(f.text)) continue;
    if (hasSegmentRoleCopy(f.text) || webSelectsAndActs(f.text) || swiftSelectsAndActs(f.text)) {
      out.push(hit(f.path, "a segmented control that both selects and acts"));
    }
  }
  return out;
}

function applySegmentRole(text) {
  return text.replace(/\s*data-sg-role(?:="[^"]*")?(?![\w-])/g, "");
}

function scanMultiplePrimaries(files) {
  const out = [];
  for (const f of files) {
    if (countSubmitButtons(f.text) >= 2) {
      out.push(hit(f.path, "multiple primary actions in one region"));
      continue;
    }
    const primaries = f.text.match(/class(Name)?=["'][^"']*\bprimary\b/g) || [];
    if (primaries.length >= 2) {
      out.push(hit(f.path, "multiple primary actions in one region"));
    }
  }
  return out;
}

export const records = [
  {
    id: "ok-instead-of-verb",
    rewrite: "host",
    scan: scanOkInsteadOfVerb,
    apply(text, file) {
      return applyOkInsteadOfVerb(text);
    },
  },
  {
    id: "toggle-navigates-or-submits",
    rewrite: "host",
    scan: scanToggleNavigates,
    apply(text, file) {
      return applyToggleNavigates(text);
    },
  },
  {
    id: "multiple-primaries-one-region",
    rewrite: "host",
    scan: scanMultiplePrimaries,
    apply(text, file) {
      return applyEqualWeightSubmits(text);
    },
  },
  {
    id: "destructive-as-primary",
    rewrite: "marker",
    scan: scanDestructivePrimary,
    apply(text, file) {
      return applyDestructivePrimary(text);
    },
  },
  {
    id: "tg-radios",
    rewrite: "marker",
    scan: scanTooManyRadios,
    apply(text, file) {
      return applyTooManyRadios(text);
    },
  },
  {
    id: "sg-mix",
    rewrite: "marker",
    scan: scanSegmentMix,
    apply(text, file) {
      return applySegmentMix(text);
    },
  },
  {
    id: "sg-count",
    rewrite: "marker",
    scan: scanSegmentCount,
    apply(text, file) {
      return applySegmentCount(text);
    },
  },
  {
    id: "sg-role",
    rewrite: "marker",
    scan: scanSegmentRole,
    apply(text, file) {
      return applySegmentRole(text);
    },
  },
  {
    id: "tg-sel",
    rewrite: "marker",
    scan: scanSelectionLabel,
    apply(text, file) {
      return applySelectionLabel(text);
    },
  },
  {
    id: "tg-color",
    rewrite: "marker",
    scan: scanColorOnlyToggle,
    apply(text, file) {
      return applyColorOnlyToggle(text);
    },
  },
  {
    id: "bt-square",
    rewrite: "marker",
    scan: scanSquareButtonLabel,
    apply(text, file) {
      return applySquareButtonLabel(text);
    },
  },
  {
    id: "bt-border",
    rewrite: "marker",
    scan: scanImageButtonBorder,
    apply(text, file) {
      return applyImageButtonBorder(text);
    },
  },
  {
    id: "bt-white",
    rewrite: "marker",
    scan: scanWhiteFillButton,
    apply(text, file) {
      return applyWhiteFillButton(text);
    },
  },
];
