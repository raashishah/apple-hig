/**
 * /hig flow — the only writer of missing screens.
 * Patterns: list, form, overlay, chrome. Nothing else.
 */

import fs from "node:fs";
import path from "node:path";
import { loadContext } from "../scripts/load-context.mjs";
import {
  parseFlowYaml,
  primaryDestination,
  type FlowGraph,
  type RouteId,
  type Screen,
  type ScreenId,
} from "../scripts/flow-graph.ts";
import { chromeForListStatus, type ListStatus } from "./list-status.ts";

export const PATTERN_KINDS = ["list", "form", "overlay", "chrome"] as const;
export type PatternKind = (typeof PATTERN_KINDS)[number];

export type ScaffoldStop =
  | { ok: false; reason: "brand" }
  | { ok: false; reason: "no-graph"; stopLine: string | null }
  | { ok: false; reason: "parse"; code: string; path: string };

export type ScaffoldWrote = {
  ok: true;
  wrote: true;
  files: string[];
  patterns: PatternKind[];
};

export type ScaffoldResult =
  | ScaffoldWrote
  | { ok: true; wrote: false; reason: "present" }
  | ScaffoldStop;

const WEB_MARKER = "data-hig-flow-scaffold";
const SWIFT_MARKER = "hig-flow-scaffold";

function walkFiles(dir: string, depth = 0): string[] {
  if (depth > 4 || !fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".") && ent.name !== ".hig") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".git") continue;
      out.push(...walkFiles(full, depth + 1));
      continue;
    }
    out.push(full);
  }
  return out;
}

function hostStack(cwd: string): "swift" | "web" {
  const files = walkFiles(cwd);
  const swift = files.some((file) => file.endsWith(".swift") || file.endsWith("Package.swift"));
  return swift ? "swift" : "web";
}

function listStatus(graph: FlowGraph): ListStatus {
  for (const screen of graph.screens) {
    if (screen.list) return screen.list.status;
  }
  return "ready";
}

function routeForScreen(graph: FlowGraph, id: ScreenId): RouteId | null {
  for (const screen of graph.screens) {
    if (screen.id === id) return screen.route;
  }
  return null;
}

function hrefFor(graph: FlowGraph, screen: Screen): RouteId {
  const destination = primaryDestination(screen);
  if (destination === null) return screen.route;
  return routeForScreen(graph, destination) ?? screen.route;
}

function screenRow(graph: FlowGraph, screen: Screen): string {
  const href = hrefFor(graph, screen);
  return `<li data-screen="${screen.id}"><a data-primary href="${href}">${screen.title}</a></li>`;
}

function detailCopy(status: ListStatus, graph: FlowGraph): string {
  const chrome = chromeForListStatus(status);
  const short = graph.screens.find((screen) => screen.create?.kind === "short");
  const parts: string[] = [];
  switch (status) {
    case "empty":
      parts.push("<p>No items</p>");
      break;
    case "loading":
      parts.push("<p>Loading</p>");
      break;
    case "ready":
      parts.push("<p>Detail</p>");
      break;
    case "fault":
      parts.push("<p>Could not load</p>");
      break;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
  if (short && !chrome.idleSelect) {
    parts.push(
      `<form data-create="short"><label>Title <input name="title"></label><button type="submit">Save</button></form>`,
    );
  }
  return parts.join("\n");
}

function renderPattern(kind: PatternKind, graph: FlowGraph): string {
  const status = listStatus(graph);
  const chrome = chromeForListStatus(status);
  const long = graph.screens.find((screen) => screen.create?.kind === "long");
  switch (kind) {
    case "chrome": {
      const entry = graph.entry ?? graph.screens[0]?.route ?? "/";
      return `<header data-hig-pattern="chrome"><a href="${entry}">${graph.screens[0]?.title ?? "Home"}</a></header>`;
    }
    case "list": {
      const rows = graph.screens.map((screen) => screenRow(graph, screen)).join("\n");
      const add =
        chrome.offerAdd && long && long.create?.kind === "long"
          ? `<a href="${long.create.route}">Add</a>`
          : "";
      return `<section data-hig-pattern="list" data-list-pane data-list-rail="kept" data-list-status="${status}"><ul>\n${rows}\n</ul>${add}</section>`;
    }
    case "form": {
      const longForm =
        long && long.create?.kind === "long"
          ? `<main data-page="create"><form data-create="long" action="${long.create.route}"><label>Title <input name="title"></label><button type="submit">Save</button></form></main>`
          : `<form data-create="short"><label>Title <input name="title"></label><button type="submit">Save</button></form>`;
      return `<section data-hig-pattern="form">${longForm}</section>`;
    }
    case "overlay":
      return `<dialog open data-hig-pattern="overlay"><p>Sheet</p><form method="dialog"><button type="submit">Done</button></form></dialog>`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function renderWeb(graph: FlowGraph): string {
  const status = listStatus(graph);
  const list = renderPattern("list", graph);
  const form = renderPattern("form", graph);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${graph.screens[0]?.title ?? "Flow"}</title>
  <link rel="stylesheet" href="flow.css" />
</head>
<body ${WEB_MARKER}="1">
  ${renderPattern("chrome", graph)}
  <div data-split>
    ${list}
    <section data-detail>
      ${detailCopy(status, graph)}
    </section>
  </div>
  ${form}
  ${renderPattern("overlay", graph)}
</body>
</html>
`;
}

const FLOW_CSS = `[data-split] { display: flex; flex-direction: column; }
[data-list-pane] ul { list-style: none; margin: 0; padding: 0; }
[data-hig-pattern="form"] form { max-width: 32rem; }
dialog { max-width: 24rem; }
@media (min-width: 768px) {
  [data-split] { display: grid; grid-template-columns: minmax(18rem, 34%) 1fr; }
}
`;

function swiftPatternMarker(kind: PatternKind): string {
  switch (kind) {
    case "list":
    case "form":
    case "overlay":
    case "chrome":
      return `// hig-pattern:${kind}`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function renderSwift(graph: FlowGraph): string {
  const status = listStatus(graph);
  const chrome = chromeForListStatus(status);
  const rows = graph.screens
    .map((screen) => `// screen:${screen.id}\nText("${screen.title}")`)
    .join("\n");
  const detail = (() => {
    switch (status) {
      case "empty":
        return 'Text("No items")';
      case "loading":
        return 'Text("Loading")';
      case "ready":
        return 'Text("Detail")';
      case "fault":
        return 'Text("Could not load")';
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  })();
  const long = graph.screens.find((screen) => screen.create?.kind === "long");
  const longPage =
    long && long.create?.kind === "long"
      ? `struct LongCreatePage: View {\n  var body: some View {\n    Form { TextField("Title", text: .constant("")) }\n      .accessibilityIdentifier("create-long")\n  }\n}`
      : "";
  const markers = PATTERN_KINDS.map((kind) => swiftPatternMarker(kind)).join("\n");
  return `import SwiftUI

// ${SWIFT_MARKER}
${markers}

struct HigFlowScaffold: View {
  var body: some View {
    NavigationSplitView {
      List {
        ${rows}
        ${chrome.offerAdd ? 'Button("Add") { }' : ""}
      }
      .frame(minWidth: 280)
    } detail: {
      ${detail}
      Form { TextField("Title", text: .constant("")) }
        .accessibilityIdentifier("create-short")
    }
    .sheet(isPresented: .constant(false)) {
      Text("Sheet")
    }
  }
}

${longPage}
`;
}

function missingScreenIds(text: string, graph: FlowGraph, stack: "swift" | "web"): ScreenId[] {
  return graph.screens
    .map((screen) => screen.id)
    .filter((id) => {
      if (stack === "web") return !text.includes(`data-screen="${id}"`);
      return !text.includes(`// screen:${id}`);
    });
}

function insertWebRows(text: string, graph: FlowGraph, ids: ScreenId[]): string {
  const rows = graph.screens
    .filter((screen) => ids.includes(screen.id))
    .map((screen) => screenRow(graph, screen))
    .join("\n");
  if (!rows || !text.includes("</ul>")) return text;
  return text.replace("</ul>", `${rows}\n</ul>`);
}

function insertSwiftRows(text: string, graph: FlowGraph, ids: ScreenId[]): string {
  const rows = graph.screens
    .filter((screen) => ids.includes(screen.id))
    .map((screen) => `// screen:${screen.id}\nText("${screen.title}")`)
    .join("\n");
  if (!rows || !text.includes("List {")) return text;
  return text.replace("List {", `List {\n        ${rows}`);
}

export function scaffoldFlow(input: { cwd: string }): ScaffoldResult {
  const cwd = path.resolve(input.cwd);
  const context = loadContext(cwd);
  const graphPath = path.join(cwd, ".hig", "screens.yaml");
  if (!fs.existsSync(graphPath)) {
    return { ok: false, reason: "no-graph", stopLine: context.stopLine };
  }
  if (context.register === "brand") return { ok: false, reason: "brand" };
  const parsed = parseFlowYaml(fs.readFileSync(graphPath, "utf8"));
  if (!parsed.ok) {
    return { ok: false, reason: "parse", code: parsed.errors[0] ?? "invalid flow graph", path: graphPath };
  }
  const graph = parsed.graph;
  const stack = hostStack(cwd);
  if (stack === "swift") return scaffoldSwift({ cwd, graph });
  return scaffoldWeb({ cwd, graph });
}

function scaffoldWeb(input: { cwd: string; graph: FlowGraph }): ScaffoldResult {
  const htmlPath = path.join(input.cwd, "index.html");
  const cssPath = path.join(input.cwd, "flow.css");
  const files: string[] = [];
  if (fs.existsSync(htmlPath)) {
    const text = fs.readFileSync(htmlPath, "utf8");
    if (text.includes(`${WEB_MARKER}=`)) {
      const missing = missingScreenIds(text, input.graph, "web");
      if (missing.length === 0) return { ok: true, wrote: false, reason: "present" };
      fs.writeFileSync(htmlPath, insertWebRows(text, input.graph, missing));
      return { ok: true, wrote: true, files: ["index.html"], patterns: [] };
    }
  }
  fs.writeFileSync(htmlPath, renderWeb(input.graph));
  files.push("index.html");
  if (!fs.existsSync(cssPath)) {
    fs.writeFileSync(cssPath, FLOW_CSS);
    files.push("flow.css");
  }
  return { ok: true, wrote: true, files, patterns: [...PATTERN_KINDS] };
}

function scaffoldSwift(input: { cwd: string; graph: FlowGraph }): ScaffoldResult {
  const rel = path.join("Sources", "HigFlow", "FlowScaffold.swift");
  const abs = path.join(input.cwd, rel);
  if (fs.existsSync(abs)) {
    const text = fs.readFileSync(abs, "utf8");
    if (text.includes(SWIFT_MARKER)) {
      const missing = missingScreenIds(text, input.graph, "swift");
      if (missing.length === 0) return { ok: true, wrote: false, reason: "present" };
      fs.writeFileSync(abs, insertSwiftRows(text, input.graph, missing));
      return { ok: true, wrote: true, files: [rel], patterns: [] };
    }
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, renderSwift(input.graph));
  return { ok: true, wrote: true, files: [rel], patterns: [...PATTERN_KINDS] };
}

export async function runFlowCli(argv: readonly string[]): Promise<void> {
  let cwd = process.cwd();
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--cwd") {
      const next = argv[index + 1];
      if (next) cwd = path.resolve(next);
    }
  }
  const result = scaffoldFlow({ cwd });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok && result.reason === "no-graph" && result.stopLine) {
    process.stderr.write(`${result.stopLine}\n`);
  }
  process.exit(result.ok ? 0 : 1);
}
