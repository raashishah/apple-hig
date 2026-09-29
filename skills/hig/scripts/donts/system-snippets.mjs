import { hit } from "./shared.mjs";

function hasSnippet(text) {
  return (
    /\bdata-snippet\b/.test(text) ||
    /\bSnippetIntent\b/.test(text) ||
    /\bInteractiveSnippetIntent\b/.test(text)
  );
}

function scanSnippetDialogueText(files) {
  const out = [];
  for (const f of files) {
    if (/data-snippet-dialogue/.test(f.text)) {
      out.push(hit(f.path, "spoken dialogue text used to convey a snippet's purpose"));
    }
  }
  return out;
}

function applySnippetDialogueText(text) {
  return text.replace(/\s*data-snippet-dialogue(?:="[^"]*")?/g, "");
}

function snippetHeightHits(text) {
  const re =
    /(?:minHeight|min-height|height)\s*[:=]\s*["']?(\d+)/gi;
  let m;
  while ((m = re.exec(text))) {
    if (Number(m[1]) >= 400) return true;
  }
  const bracket = /h-\[(\d+)px\]/gi;
  while ((m = bracket.exec(text))) {
    if (Number(m[1]) >= 400) return true;
  }
  return false;
}

function scanSnippetTooTall(files) {
  const out = [];
  for (const f of files) {
    if (/data-snippet-too-tall/.test(f.text)) {
      out.push(hit(f.path, "a snippet custom view taller than 400 points"));
      continue;
    }
    if (!hasSnippet(f.text)) continue;
    if (snippetHeightHits(f.text)) {
      out.push(hit(f.path, "a snippet custom view taller than 400 points"));
    }
  }
  return out;
}

function applySnippetTooTall(text) {
  return text.replace(/\s*data-snippet-too-tall(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "snippet-dialogue-text",
    rewrite: "marker",
    scan: scanSnippetDialogueText,
    apply(text, file) {
      return applySnippetDialogueText(text);
    },
  },
  {
    id: "snippet-too-tall",
    rewrite: "marker",
    scan: scanSnippetTooTall,
    apply(text, file) {
      return applySnippetTooTall(text);
    },
  },
];
