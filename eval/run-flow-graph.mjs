#!/usr/bin/env node
/**
 * Flow graph: legacy screens.yaml still loads, and the parser rejects
 * an action with no destination, a list with two statuses, and a create
 * that is both short and long.
 *
 * Run with `node --experimental-strip-types` so this file can import
 * the TypeScript parser directly.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFlowYaml } from "../skills/hig/scripts/flow-graph.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const legacy = `# Screen list for /hig implement + review
version: 1
screens:
  - id: example-home
    route: /
    title: Home
    priority: 1
    status: designed
`;

const walk = `version: 1
entry: /items
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
    kind: action
    to: item
    list:
      status: ready
    create:
      kind: short
  - id: item
    route: /items/example
    title: Item
    priority: 2
    status: designed
    kind: static
  - id: new-item
    route: /items/new
    title: New item
    priority: 3
    status: designed
    kind: static
`;

const actionWithoutDestination = `version: 1
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
    kind: action
`;

const listTwoStatuses = `version: 1
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
    list:
      status: empty
      status: loading
`;

const listStatusArray = `version: 1
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
    list:
      status: [empty, loading]
`;

const createBothKinds = `version: 1
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
    create:
      kind: short
      kind: long
      route: /items/new
`;

const createShortWithRoute = `version: 1
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
    create:
      kind: short
      route: /items/new
`;

const longCreate = `version: 1
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
    create:
      kind: long
      route: /items/new
`;

function errorText(result) {
  return result.ok ? "" : result.errors.join("\n");
}

const results = [];

{
  const parsed = parseFlowYaml(legacy);
  const screen = parsed.ok ? parsed.graph.screens[0] : undefined;
  const ok =
    parsed.ok === true &&
    parsed.graph.entry === null &&
    parsed.graph.screens.length === 1 &&
    screen?.kind === "static" &&
    screen.list === undefined &&
    screen.create === undefined &&
    !("to" in screen);
  results.push({ case: "legacy-fields", ok });
}

{
  const parsed = parseFlowYaml(walk);
  const items = parsed.ok ? parsed.graph.screens[0] : undefined;
  const ok =
    parsed.ok === true &&
    parsed.graph.entry === "/items" &&
    items?.kind === "action" &&
    items.to === "item" &&
    items.list?.status === "ready" &&
    items.create?.kind === "short";
  results.push({ case: "walk", ok, detail: parsed.ok ? null : parsed.errors });
}

{
  const parsed = parseFlowYaml(actionWithoutDestination);
  const text = errorText(parsed);
  const ok = parsed.ok === false && /destination/i.test(text);
  results.push({ case: "action-without-destination", ok, detail: text });
}

{
  const parsed = parseFlowYaml(listTwoStatuses);
  const text = errorText(parsed);
  const ok = parsed.ok === false && /two statuses/i.test(text);
  results.push({ case: "list-two-statuses", ok, detail: text });
}

{
  const parsed = parseFlowYaml(listStatusArray);
  const text = errorText(parsed);
  const ok = parsed.ok === false && /two statuses/i.test(text);
  results.push({ case: "list-status-array", ok, detail: text });
}

{
  const parsed = parseFlowYaml(createBothKinds);
  const text = errorText(parsed);
  const ok = parsed.ok === false && /short and long/i.test(text);
  results.push({ case: "create-both-kinds", ok, detail: text });
}

{
  const parsed = parseFlowYaml(createShortWithRoute);
  const text = errorText(parsed);
  const ok = parsed.ok === false && /short and long/i.test(text);
  results.push({ case: "create-short-with-route", ok, detail: text });
}

function rejects(name, yaml, pattern) {
  const parsed = parseFlowYaml(yaml);
  const text = errorText(parsed);
  results.push({
    case: name,
    ok: parsed.ok === false && pattern.test(text),
    detail: text,
  });
}

rejects(
  "two-list-blocks",
  `version: 1
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
    list:
      status: empty
    list:
      status: loading
`,
  /two statuses/i,
);

rejects(
  "two-create-blocks",
  `version: 1
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
    create:
      kind: short
    create:
      kind: long
      route: /items/new
`,
  /short and long/i,
);

rejects(
  "kind-static-then-action",
  `version: 1
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
    kind: static
    kind: action
    to: item
  - id: item
    route: /items/example
    title: Item
    priority: 2
    status: designed
`,
  /kind or destination/i,
);

rejects(
  "two-destinations",
  `version: 1
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
    kind: action
    to: item
    to: other
  - id: item
    route: /items/example
    title: Item
    priority: 2
    status: designed
  - id: other
    route: /other
    title: Other
    priority: 3
    status: designed
`,
  /kind or destination/i,
);

rejects(
  "two-create-routes",
  `version: 1
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
    create:
      kind: long
      route: /items/new
      route: /items/other
`,
  /two routes/i,
);

rejects(
  "two-screen-lists",
  `version: 1
screens:
  - id: gone
    route: /gone
    title: Gone
    priority: 1
    status: designed
screens:
  - id: items
    route: /items
    title: Items
    priority: 1
    status: designed
`,
  /repeats version, entry, or screens/i,
);

rejects(
  "two-entries",
  `version: 1
entry: /gone
entry: /items
screens:
  - id: gone
    route: /gone
    title: Gone
    priority: 1
    status: designed
  - id: items
    route: /items
    title: Items
    priority: 2
    status: designed
`,
  /repeats version, entry, or screens/i,
);

rejects(
  "tab-indent",
  "version: 1\nscreens:\n  - id: items\n    route: /items\n    title: Items\n    priority: 1\n    status: designed\n\tkind: action\n\tto: item\n",
  /tabs are not allowed/i,
);

{
  const parsed = parseFlowYaml(longCreate);
  const screen = parsed.ok ? parsed.graph.screens[0] : undefined;
  const ok =
    parsed.ok === true &&
    screen?.create?.kind === "long" &&
    screen.create.route === "/items/new";
  results.push({ case: "create-long", ok, detail: parsed.ok ? null : parsed.errors });
}

{
  const template = fs.readFileSync(
    path.join(root, "skills/hig/references/project/screens-yaml-template.yaml"),
    "utf8",
  );
  const parsed = parseFlowYaml(template);
  const screen = parsed.ok ? parsed.graph.screens[0] : undefined;
  const ok =
    parsed.ok === true &&
    parsed.graph.entry === null &&
    screen?.kind === "static" &&
    screen.id === "example-home";
  results.push({ case: "template", ok, detail: parsed.ok ? null : parsed.errors });
}

{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hig-legacy-screens-"));
  try {
    fs.cpSync(path.join(__dirname, "fixtures/sparse"), dir, { recursive: true });
    fs.mkdirSync(path.join(dir, ".hig"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".hig/screens.yaml"), legacy);
    const r = spawnSync(
      process.execPath,
      [path.join(root, "skills/hig/scripts/load-context.mjs"), dir],
      { encoding: "utf8" },
    );
    const json = r.status === 0 ? JSON.parse(r.stdout) : null;
    const ok = json?.hasScreens === true && json.screensPath === ".hig/screens.yaml";
    results.push({ case: "legacy-reader", ok, status: r.status });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const tsc = spawnSync(
  "npx",
  ["--yes", "-p", "typescript@5.8.3", "tsc", "--noEmit", "-p", "eval/tsconfig.flow.json"],
  { encoding: "utf8", cwd: root },
);
results.push({
  case: "types",
  ok: tsc.status === 0,
  detail: tsc.status === 0 ? null : `${tsc.stdout}\n${tsc.stderr}`.trim(),
});

const failed = results.filter((row) => !row.ok);
process.stdout.write(JSON.stringify({ ok: failed.length === 0, results }, null, 2) + "\n");
if (failed.length) process.exit(1);
