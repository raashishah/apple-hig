import { hit, matchingBrace } from "./shared.mjs";

const CTA_LABEL = "Add|New|Create|Save|Submit|Done";

function scanCardGridMasterList(files) {
  const out = [];
  for (const f of files) {
    if (!/data-list-pane|list-browser|ListPane/.test(f.text)) continue;
    if (/card-grid|dashboard-cards/.test(f.text)) {
      out.push(hit(f.path, "card grid as master list"));
      continue;
    }
    const cards = f.text.match(/class(Name)?=["'][^"']*\bcard\b/g) || [];
    if (cards.length >= 3) {
      out.push(hit(f.path, "card grid as master list"));
    }
  }
  return out;
}

function applyCardGridMasterList(text) {
  if (!/data-list-pane|list-browser|ListPane/.test(text)) return text;
  let next = text.replace(
    /<(div|section)\b([^>]*\bclass(?:Name)?=["'][^"']*(?:card-grid|dashboard-cards)[^"']*["'][^>]*)>\s*([\s\S]*?)<\/\1>/i,
    (all, _tag, _attrs, inner) => {
      const items = [...inner.matchAll(/<(article|div|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(
        (m) => m[2].trim(),
      );
      if (!items.length) return all;
      return `<ul>\n${items.map((t) => `        <li>${t}</li>`).join("\n")}\n      </ul>`;
    },
  );
  next = next.replace(/\s+className=["']card["']/g, "");
  next = next.replace(/\s+class=["']card["']/g, "");
  return next;
}

function scanCtaOnlyListToolbar(files) {
  const blob = files.map((f) => f.text).join("\n");
  if (!/data-detail(?:-pane)?\b/.test(blob)) return [];
  const ctaRe = new RegExp(`<button\\b[^>]*>\\s*(?:${CTA_LABEL})\\s*</button>`, "i");
  const detailCta = new RegExp(
    `data-detail[\\s\\S]{0,1200}<button\\b[^>]*>\\s*(?:${CTA_LABEL})`,
    "i",
  );
  const out = [];
  for (const f of files) {
    if (!/data-list-pane/.test(f.text)) continue;
    const toolbar = f.text.match(
      /<header\b[^>]*(?:role=["']toolbar["']|toolbar)[^>]*>[\s\S]*?<\/header>/i,
    );
    if (!toolbar) continue;
    if (!ctaRe.test(toolbar[0]) && !/<button\b[^>]*type=["']submit["']/.test(toolbar[0])) {
      continue;
    }
    if (detailCta.test(blob)) continue;
    out.push(hit(f.path, "primary CTA only in list toolbar"));
  }
  return out;
}

function applyCtaOnlyListToolbar(text) {
  if (!/data-list-pane/.test(text) || !/data-detail(?:-pane)?\b/.test(text)) return text;
  const ctaRe = new RegExp(`<button\\b[^>]*>\\s*(?:${CTA_LABEL})\\s*</button>\\s*`, "i");
  const toolbarRe =
    /(<header\b[^>]*(?:role=["']toolbar["']|toolbar)[^>]*>)([\s\S]*?)(<\/header>)/i;
  const tm = text.match(toolbarRe);
  if (!tm) return text;
  const btn = tm[2].match(ctaRe);
  if (!btn) return text;
  let next = text.replace(
    toolbarRe,
    (_, open, body, close) => `${open}${body.replace(ctaRe, "")}${close}`,
  );
  next = next.replace(
    /(<([A-Za-z][\w]*)\b[^>]*data-detail(?:-pane)?\b[^>]*>)(\s*)/,
    `$1$3${btn[0]}$3`,
  );
  return next;
}

function hasListWidget(text) {
  return /<(ul|ol|table)\b/i.test(text) || /data-list-pane/.test(text) || /\bList\s*[\({]/.test(text);
}

function hasIndexDisclosureCopy(text) {
  return (
    /adding an index to a table that displays controls/i.test(text) ||
    /section index on a list that also shows disclosure indicators/i.test(text)
  );
}

function hasSectionIndexToken(text) {
  return (
    /data-section-index(?![\w-])/.test(text) ||
    /\bsectionIndexTitles\b/.test(text) ||
    /\bsectionIndexMinimumDisplayRowCount\b/.test(text)
  );
}

function hasDisclosureIndicatorToken(text) {
  return (
    /data-disclosure-indicator(?![\w-])/.test(text) ||
    /\bdisclosureIndicator\b/.test(text) ||
    /\bchevron\.right\b/.test(text)
  );
}

function listRegions(text) {
  const out = [];
  const re = /<(ul|ol|table)\b[^>]*>[\s\S]*?<\/\1>/gi;
  let m;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}

function hasIndexDisclosurePair(text) {
  if (listRegions(text).some((region) => hasSectionIndexToken(region) && hasDisclosureIndicatorToken(region))) {
    return true;
  }
  if (!hasSectionIndexToken(text) || !hasDisclosureIndicatorToken(text)) return false;
  return /(?:data-section-index|sectionIndexTitles|sectionIndexMinimumDisplayRowCount)[\s\S]{0,600}(?:data-disclosure-indicator|disclosureIndicator|chevron\.right)|(?:data-disclosure-indicator|disclosureIndicator|chevron\.right)[\s\S]{0,600}(?:data-section-index|sectionIndexTitles|sectionIndexMinimumDisplayRowCount)/.test(
    text,
  );
}

function scanIndexBesideDisclosure(files) {
  const out = [];
  for (const f of files) {
    if (/data-ix-both(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a section index on a list that also shows disclosure indicators"));
      continue;
    }
    if (hasIndexDisclosurePair(f.text)) {
      out.push(hit(f.path, "a section index on a list that also shows disclosure indicators"));
      continue;
    }
    if (hasListWidget(f.text) && hasIndexDisclosureCopy(f.text)) {
      out.push(hit(f.path, "a section index on a list that also shows disclosure indicators"));
    }
  }
  return out;
}

function applyIndexBesideDisclosure(text) {
  return text.replace(/\s*data-ix-both(?:="[^"]*")?(?![\w-])/g, "");
}

function imageTagHasCornerMask(tag) {
  return (
    /(?<![\w-])border-radius\s*:/i.test(tag) ||
    /\bborderRadius\s*:/.test(tag) ||
    /\bmask(?:-image)?\s*:/i.test(tag) ||
    /\bmaskImage\s*:/.test(tag) ||
    /\bclip-path\s*:/i.test(tag) ||
    /\bclipPath\s*:/.test(tag)
  );
}

function listHasMaskedImage(text) {
  return listRegions(text).some((region) => {
    const tags = region.match(/<img\b[^>]*>/gi) || [];
    return tags.some((tag) => imageTagHasCornerMask(tag));
  });
}

function hasListMaskCopy(text) {
  return (
    /own masks to round the corners/i.test(text) ||
    /image in a list with a corner mask/i.test(text)
  );
}

function scanListCornerMask(files) {
  const out = [];
  for (const f of files) {
    if (/data-ls-mask(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an image in a list with a corner mask"));
      continue;
    }
    if (!hasListWidget(f.text)) continue;
    if (listHasMaskedImage(f.text) || hasListMaskCopy(f.text)) {
      out.push(hit(f.path, "an image in a list with a corner mask"));
    }
  }
  return out;
}

function applyListCornerMask(text) {
  return text.replace(/\s*data-ls-mask(?:="[^"]*")?(?![\w-])/g, "");
}

const OVERLARGE_ROW_CHARS = 100;

function visibleRowText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rowIsOverlarge(text) {
  return visibleRowText(text).length >= OVERLARGE_ROW_CHARS;
}

function htmlRowsAreOverlarge(text) {
  for (const region of listRegions(text)) {
    const rows = region.match(/<(li|tr)\b[^>]*>[\s\S]*?<\/\1>/gi) || [];
    for (const row of rows) {
      if (rowIsOverlarge(row)) return true;
    }
  }
  return false;
}

function swiftListBodies(text) {
  const out = [];
  const re = /\bList\s*[\({]/g;
  let found;
  while ((found = re.exec(text))) {
    const brace = text.indexOf("{", found.index);
    if (brace < 0 || brace - found.index > 80) continue;
    const close = matchingBrace(text, brace);
    if (close < 0) continue;
    out.push(text.slice(brace + 1, close));
  }
  return out;
}

function swiftRowsAreOverlarge(text) {
  const re = /\bText\s*\(\s*"([^"]+)"/g;
  for (const body of swiftListBodies(text)) {
    let found;
    while ((found = re.exec(body))) {
      if (rowIsOverlarge(found[1])) return true;
    }
  }
  return false;
}

function fileHasListRows(text) {
  return listRegions(text).length > 0 || swiftListBodies(text).length > 0;
}

function hasOverlargeRowCopy(text) {
  return /over-large table rows/i.test(text);
}

function scanOverlargeRow(files) {
  const out = [];
  for (const f of files) {
    if (/data-ls-tall(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "an over-large table row made of a long paragraph"));
      continue;
    }
    if (htmlRowsAreOverlarge(f.text) || swiftRowsAreOverlarge(f.text)) {
      out.push(hit(f.path, "an over-large table row made of a long paragraph"));
      continue;
    }
    if (fileHasListRows(f.text) && hasOverlargeRowCopy(f.text)) {
      out.push(hit(f.path, "an over-large table row made of a long paragraph"));
    }
  }
  return out;
}

function applyOverlargeRow(text) {
  return text.replace(/\s*data-ls-tall(?:="[^"]*")?(?![\w-])/g, "");
}

function stripOutlineRegions(text) {
  return text
    .replace(/<([A-Za-z][\w]*)\b[^>]*\bdata-outline\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\bNSOutlineView\b[\s\S]{0,500}/g, "");
}

function visibleHeading(inner) {
  return inner
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function headingEndsWithPunctuation(label) {
  return /[.!?…;:,]$|\.\.\.$/.test(label);
}

function headingsInTable(chunk) {
  const heads = [];
  const th = /<th\b([^>]*)>([\s\S]*?)<\/th>/gi;
  let m;
  while ((m = th.exec(chunk))) heads.push(visibleHeading(m[2]));
  const role = /<([A-Za-z][\w]*)\b([^>]*\brole=["']columnheader["'][^>]*)>([\s\S]*?)<\/\1>/gi;
  while ((m = role.exec(chunk))) {
    if (m[1].toLowerCase() === "th") continue;
    heads.push(visibleHeading(m[3]));
  }
  return heads;
}

function htmlMultiColumnTables(text) {
  const tables = [];
  const re = /<table\b[\s\S]*?<\/table>/gi;
  let m;
  while ((m = re.exec(text))) {
    const heads = headingsInTable(m[0]);
    if (heads.length >= 2) tables.push(heads);
  }
  return tables;
}

function swiftMultiColumnTables(text) {
  const tables = [];
  const re = /\bTable\b/g;
  let m;
  while ((m = re.exec(text))) {
    const brace = text.indexOf("{", m.index);
    if (brace < 0 || brace - m.index > 120) continue;
    const close = matchingBrace(text, brace);
    if (close < 0) continue;
    const body = text.slice(brace + 1, close);
    const heads = [];
    const col = /TableColumn\s*\(\s*"([^"]*)"/g;
    let c;
    while ((c = col.exec(body))) heads.push(c[1].trim());
    if (heads.length >= 2) tables.push(heads);
  }
  return tables;
}

function multiColumnHeadings(text) {
  const source = stripOutlineRegions(text);
  return [...htmlMultiColumnTables(source), ...swiftMultiColumnTables(source)];
}

function hasPunctuatedColumnHeading(text) {
  return multiColumnHeadings(text).some((heads) => heads.some((head) => headingEndsWithPunctuation(head)));
}

function hasColumnPunctuationCopy(text) {
  return (
    /don['’]?t add ending punctuation/i.test(text) ||
    /column heading that ends with punctuation/i.test(text)
  );
}

function scanColumnPunctuation(files) {
  const out = [];
  for (const f of files) {
    if (/data-hd-punct(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a column heading that ends with punctuation"));
      continue;
    }
    const tables = multiColumnHeadings(f.text);
    if (tables.length === 0) continue;
    if (hasPunctuatedColumnHeading(f.text) || hasColumnPunctuationCopy(f.text)) {
      out.push(hit(f.path, "a column heading that ends with punctuation"));
    }
  }
  return out;
}

function applyColumnPunctuation(text) {
  return text.replace(/\s*data-hd-punct(?:="[^"]*")?(?![\w-])/g, "");
}

function splitContainers(text) {
  const out = [];
  const openRe = /<([A-Za-z][\w]*)\b[^>]*\bdata-split(?![\w-])[^>]*>/gi;
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
        i = text.length;
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

function separatorThickness(tag) {
  const re = /(?<![\w-])(?:width|height)\s*(?:=|:)\s*\{?\s*["']?(\d+(?:\.\d+)?)(px|pt|%)?/gi;
  let max = 0;
  let m;
  while ((m = re.exec(tag))) {
    if (m[2] === "%") continue;
    max = Math.max(max, Number(m[1]));
  }
  return max;
}

function hasThickSplitDivider(text) {
  if (/dividerStyle\s*\(\s*\.thick\b|\bDividerStyle\.thick\b/.test(text)) return true;
  const sep = /<(div|hr|span)\b[^>]*(?:role=["']separator["']|\bdata-divider(?![\w-]))[^>]*>/gi;
  for (const region of splitContainers(text)) {
    sep.lastIndex = 0;
    let m;
    while ((m = sep.exec(region))) {
      if (separatorThickness(m[0]) > 1) return true;
    }
  }
  return false;
}

function hasThickDividerCopy(text) {
  return /thicker divider/i.test(text) || /divider thicker than a hairline/i.test(text);
}

function hasSplitWidget(text) {
  return (
    /\bdata-split(?![\w-])/.test(text) ||
    /\bNavigationSplitView\b/.test(text) ||
    /\bUISplitViewController\b/.test(text) ||
    /\bNSSplitView\b/.test(text)
  );
}

function scanThickDivider(files) {
  const out = [];
  for (const f of files) {
    if (/data-dv-thick(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a split view with a divider thicker than a hairline"));
      continue;
    }
    if (hasThickSplitDivider(f.text) || (hasThickDividerCopy(f.text) && hasSplitWidget(f.text))) {
      out.push(hit(f.path, "a split view with a divider thicker than a hairline"));
    }
  }
  return out;
}

function applyThickDivider(text) {
  return text.replace(/\s*data-dv-thick(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "card-grids-as-master-list",
    rewrite: "host",
    scan: scanCardGridMasterList,
    apply(text, file) {
      return applyCardGridMasterList(text);
    },
  },
  {
    id: "cta-only-in-list-toolbar",
    rewrite: "host",
    scan: scanCtaOnlyListToolbar,
    apply(text, file) {
      return applyCtaOnlyListToolbar(text);
    },
  },
  {
    id: "ix-both",
    rewrite: "marker",
    scan: scanIndexBesideDisclosure,
    apply(text, file) {
      return applyIndexBesideDisclosure(text);
    },
  },
  {
    id: "ls-mask",
    rewrite: "marker",
    scan: scanListCornerMask,
    apply(text, file) {
      return applyListCornerMask(text);
    },
  },
  {
    id: "ls-tall",
    rewrite: "marker",
    scan: scanOverlargeRow,
    apply(text, file) {
      return applyOverlargeRow(text);
    },
  },
  {
    id: "hd-punct",
    rewrite: "marker",
    scan: scanColumnPunctuation,
    apply(text, file) {
      return applyColumnPunctuation(text);
    },
  },
  {
    id: "dv-thick",
    rewrite: "marker",
    scan: scanThickDivider,
    apply(text, file) {
      return applyThickDivider(text);
    },
  },
];
