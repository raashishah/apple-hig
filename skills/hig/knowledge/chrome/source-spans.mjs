/** Shared source spans for split/list chrome checks and recipes. */

export function matchBrace(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function splitSections(text) {
  return [...text.matchAll(/<section\b[^>]*\bdata-split\b[^>]*>[\s\S]*?<\/section>/gi)].map(
    (match) => match[0],
  );
}

export function swiftStructs(text) {
  return text.split(/(?=struct )/).filter((part) => part.includes("struct "));
}

export function detailBody(block) {
  const at = block.search(/detail:\s*\{/);
  if (at < 0) return "";
  const open = block.indexOf("{", at);
  const close = matchBrace(block, open);
  if (close < 0) return "";
  return block.slice(open + 1, close);
}
