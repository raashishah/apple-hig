import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { fontProblems, kitMargin, scorePair } from "./score.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../..");
const fixtureDir = path.join(repo, "practice/list-detail");
const htmlPath = path.join(fixtureDir, "index.html");
const baselinePath = path.join(fixtureDir, "baseline.json");

const COLLECT = `(() => {
  const root = document.querySelector("#detail:target") || document.querySelector("#list");
  const texts = [...root.querySelectorAll("h1, a, p, label, button, input")];
  const css = [...document.styleSheets].map((sheet) => {
    try { return [...sheet.cssRules].map((rule) => rule.cssText).join("\\n"); }
    catch { return ""; }
  }).join("\\n");
  const hex = (value) => {
    const match = String(value).match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    if (!match) return null;
    return "#" + match.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, "0")).join("");
  };
  const opaque = (element) => {
    let node = element;
    while (node) {
      const color = hex(getComputedStyle(node).backgroundColor);
      const alpha = getComputedStyle(node).backgroundColor;
      if (color && !/rgba\\([^)]+,\\s*0\\)/.test(alpha)) return color;
      node = node.parentElement;
    }
    return "#ffffff";
  };
  const leading = (element) => {
    const box = element.getBoundingClientRect();
    return box.left + parseFloat(getComputedStyle(element).paddingLeft || "0");
  };
  const body = root.querySelector("[data-body]");
  const timing = /(?:animation|transition)(?:-duration)?:\\s*([^;}{]+)/g;
  let invented = false;
  for (const match of css.matchAll(timing)) {
    const times = match[1].match(/\\d+(?:\\.\\d+)?m?s/g) || [];
    if (times.some((time) => !/^0(?:\\.0+)?m?s$/.test(time))) invented = true;
  }
  const radii = [...root.querySelectorAll("*")].map((element) => getComputedStyle(element).borderRadius);
  const safeTop = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
  const safeBottom = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
  let safeViolations = 0;
  for (const element of texts) {
    const box = element.getBoundingClientRect();
    if (box.top < safeTop - 0.5 || box.bottom > window.innerHeight - safeBottom + 0.5) safeViolations += 1;
  }
  return {
    fontSizes: texts.map((element) => Math.round(parseFloat(getComputedStyle(element).fontSize))),
    weights: texts.map((element) => Number(getComputedStyle(element).fontWeight)),
    leadingEdges: texts.map(leading),
    spacings: [],
    margins: [],
    tapTargets: [...root.querySelectorAll("a, button, input, label")].map((element) => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }),
    bodyPairs: [{ foreground: hex(getComputedStyle(body).color), background: opaque(body) }],
    nonTokenColor: /#[0-9a-fA-F]{3,8}\\b/.test(css),
    accentCount: new Set([...root.querySelectorAll("button")].map((element) => getComputedStyle(element).color)).size,
    customControls: root.querySelectorAll("div[onclick], [role=button]").length,
    safeViolations,
    primaryCount: root.querySelectorAll("[data-primary]").length,
    radiiMismatch: new Set(radii).size > 1,
    radiiNonNesting: false,
    inventedTiming: invented,
    reducedMotion: css.includes("prefers-reduced-motion"),
  };
})()`;

function manifestProblems(html, manifest) {
  const found = new Set();
  for (const tag of ["a", "button", "input", "label", "textarea", "select", "ul", "ol", "form"]) {
    if (new RegExp(`<${tag}[\\s>]`, "i").test(html)) found.add(tag);
  }
  const allowed = new Set(manifest.components);
  return [...found].filter((tag) => !allowed.has(tag));
}

async function measure(url) {
  const port = 9334;
  const profile = `/tmp/hig-chrome-${process.pid}`;
  fs.rmSync(profile, { recursive: true, force: true });
  const chrome = spawn(
    "google-chrome",
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "--window-size=390,844",
      url,
    ],
    { stdio: "ignore" },
  );
  try {
    let version;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      try {
        version = await fetch(`http://127.0.0.1:${port}/json/version`).then((response) => response.json());
        break;
      } catch {
        await sleep(100);
      }
    }
    if (!version) throw new Error("Chrome did not open a debugging port");
    const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
    const page = pages.find((entry) => entry.type === "page");
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve);
      socket.addEventListener("error", reject);
    });
    const result = await new Promise((resolve, reject) => {
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.id !== 1) return;
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else if (message.result.exceptionDetails) {
          reject(new Error(JSON.stringify(message.result.exceptionDetails)));
        } else resolve(message.result.result.value);
      });
      socket.send(JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: { expression: COLLECT, returnByValue: true },
      }));
    });
    socket.close();
    return result;
  } finally {
    chrome.kill("SIGKILL");
  }
}

function pluginProblems() {
  const problems = [];
  const banned = [
    new RegExp(String.fromCharCode(97, 115, 116, 114, 111, 108, 111, 103, 121), "i"),
    new RegExp(["Astro", "thunder"].join(""), "i"),
  ];
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(md|mjs|json|css|html|swift|yml)$/.test(entry.name)) files.push(full);
    }
  };
  walk(path.join(repo, "skills"));
  walk(path.join(repo, "practice"));
  for (const file of files) {
    if (file.endsWith("lint-scope.mjs")) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of banned) {
      if (pattern.test(text)) problems.push(`${path.relative(repo, file)} matches ${pattern}`);
    }
  }
  return problems;
}

async function main() {
  const html = fs.readFileSync(htmlPath, "utf8");
  const css = html + fs.readFileSync(path.join(repo, "skills/hig/tokens/web.css"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(fixtureDir, "manifest.json"), "utf8"));
  const missing = manifestProblems(html, manifest);
  const fonts = fontProblems(css);
  const fileUrl = `file://${htmlPath}`;
  const list = await measure(fileUrl);
  const detail = await measure(`${fileUrl}#detail`);
  const margin = kitMargin(css);
  const result = scorePair([list, detail], { margin });
  const extra = [];
  if (missing.length) extra.push(`manifest missing ${missing.join(", ")}`);
  if (fonts.length) extra.push(...fonts);
  extra.push(...pluginProblems());
  const score = result.score + extra.length;
  const report = { score, open: result.open, extra, list, detail };
  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  process.stdout.write(JSON.stringify({ score, open: result.open, extra }, null, 2) + "\n");
  fs.writeFileSync(path.join(fixtureDir, "last-report.json"), JSON.stringify(report, null, 2));
  if (score > baseline.score) {
    process.stderr.write(`practice score ${score} rose above baseline ${baseline.score}\n`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(String(error?.stack || error) + "\n");
    process.exit(1);
  });
}
