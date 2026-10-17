import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pagesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../pages");
const topics = [
  "typography",
  "color",
  "dark-mode",
  "tab-bars",
  "lists-and-tables",
  "buttons",
  "text-fields",
  "motion",
];
const indexUrl = "https://developer.apple.com/tutorials/data/index/design--human-interface-guidelines";

function slugs(index) {
  const found = new Set();
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "article" && node.path) {
      const slug = String(node.path).replace(/\/+$/, "").split("/").pop();
      found.add(slug);
    }
    for (const child of node.children || []) walk(child);
  };
  const root = index?.interfaceLanguages?.swift;
  for (const node of Array.isArray(root) ? root : [root]) walk(node);
  return found;
}

const index = await fetch(indexUrl, { headers: { "user-agent": "apple-hig-coverage" } }).then((response) => {
  if (!response.ok) throw new Error(`HIG index ${response.status}`);
  return response.json();
});
const live = slugs(index);
let covered = 0;
const missing = [];
for (const topic of topics) {
  const file = path.join(pagesDir, `${topic}.md`);
  const onApple = live.has(topic);
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const rules = text.match(/^### /gm)?.length || 0;
  const linked = text.includes(`https://developer.apple.com/design/human-interface-guidelines/${topic}`);
  if (onApple && rules > 0 && linked) covered += 1;
  else missing.push(topic);
}
process.stdout.write(`pages ${covered} / ${topics.length}\n`);
if (missing.length) {
  process.stderr.write(`missing ${missing.join(", ")}\n`);
  process.exit(1);
}
