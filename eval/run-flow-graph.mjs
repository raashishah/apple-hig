#!/usr/bin/env node
/**
 * Flow graph parse contract. Spawns type-stripping so .mjs evals stay flag-free.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");

if (!process.execArgv.includes("--experimental-strip-types")) {
  const child = spawnSync(
    process.execPath,
    ["--experimental-strip-types", fileURLToPath(import.meta.url)],
    { stdio: "inherit" },
  );
  process.exit(child.status ?? 1);
}

const { parseFlow, parseFlowYaml, legacyScreens, screenDestination } = await import(
  "../skills/hig/flow/graph.ts"
);
const { chromeForListStatus, LIST_STATUSES } = await import(
  "../skills/hig/flow/list-status.ts"
);

const results = [];

function record(caseName, ok, detail) {
  results.push({ case: caseName, ok, ...detail });
}

{
  const parsed = parseFlowYaml({
    text: `version: 1
screens:
  - id: example-home
    route: /
    title: Home
    priority: 1
    status: designed
`,
  });
  const legacy = parsed.ok ? legacyScreens(parsed.graph) : [];
  record("legacy-screens-still-parse", parsed.ok && legacy[0]?.status === "designed" && parsed.graph.screens[0]?.kind === "static" && parsed.graph.entry === null, {
    code: parsed.ok ? null : parsed.code,
    legacy,
  });
}

{
  const parsed = parseFlowYaml({
    text: `version: 1
entry: /items
screens:
  - id: home
    route: /
    title: Home
    kind: static
  - id: items
    route: /items
    title: Items
    kind: action
    destination: home
    list:
      status: ready
    create:
      kind: short
  - id: create
    route: /items/new
    title: New item
    kind: static
    create:
      kind: long
      route: /items/new
`,
  });
  const items = parsed.ok ? parsed.graph.screens.find((screen) => screen.id === "items") : null;
  const create = parsed.ok ? parsed.graph.screens.find((screen) => screen.id === "create") : null;
  const destination = items ? screenDestination(items) : null;
  record(
    "graph-brands-destination",
    Boolean(
      parsed.ok &&
        parsed.graph.entry === "/items" &&
        items?.kind === "action" &&
        destination === "home" &&
        items.list?.status === "ready" &&
        items.create?.kind === "short" &&
        create?.create?.kind === "long" &&
        create.create.route === "/items/new",
    ),
    { code: parsed.ok ? null : parsed.code },
  );
}

{
  const parsed = parseFlowYaml({
    text: `screens:
  - id: a
    route: /a
    title: A
    kind: action
`,
  });
  record("reject-action-without-destination", !parsed.ok && parsed.code === "action-without-destination", {
    code: parsed.ok ? null : parsed.code,
  });
}

{
  const parsed = parseFlowYaml({
    text: `screens:
  - id: a
    route: /a
    title: A
    kind: static
    list:
      statuses:
        - empty
        - loading
`,
  });
  record("reject-list-two-statuses", !parsed.ok && parsed.code === "list-two-statuses", {
    code: parsed.ok ? null : parsed.code,
  });
}

{
  const parsed = parseFlowYaml({
    text: `screens:
  - id: a
    route: /a
    title: A
    kind: static
    create:
      kind: short
      route: /a/new
`,
  });
  record("reject-create-both-lengths", !parsed.ok && parsed.code === "create-both-lengths", {
    code: parsed.ok ? null : parsed.code,
  });
}

{
  const parsed = parseFlow({
    document: {
      version: 1,
      entry: "/",
      screens: [{ id: "home", route: "/", title: "Home", kind: "static" }],
    },
  });
  record("json-unknown-parses", parsed.ok && parsed.graph.screens.length === 1, {
    code: parsed.ok ? null : parsed.code,
  });
}

{
  const parsed = parseFlowYaml({
    text: `screens:
  - id: home
    route: /
    title: Home
    kind: action
    destination: /items
  - id: items
    route: /items
    title: Items
    kind: static
`,
  });
  record("reject-route-used-as-screen-id", !parsed.ok && parsed.code === "unknown-destination", {
    code: parsed.ok ? null : parsed.code,
  });
}

{
  const offers = LIST_STATUSES.map((status) => ({ status, ...chromeForListStatus(status) }));
  const ready = offers.find((row) => row.status === "ready");
  const blocked = offers.filter((row) => row.status !== "ready");
  record(
    "list-status-exhaustive-chrome",
    ready?.offerAdd === true &&
      ready.idleSelect === false &&
      blocked.every((row) => row.offerAdd === false && row.idleSelect === false),
    { offers },
  );
}

const failed = results.filter((row) => !row.ok);
process.stdout.write(JSON.stringify({ ok: failed.length === 0, results }, null, 2) + "\n");
process.exit(failed.length === 0 ? 0 : 1);
