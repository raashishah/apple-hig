#!/usr/bin/env node
/**
 * /hig flow CLI. Type stripping stays inside this process so other scripts
 * keep running on plain node.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(import.meta.url);

if (!process.execArgv.includes("--experimental-strip-types")) {
  const child = spawnSync(
    process.execPath,
    ["--experimental-strip-types", here, ...process.argv.slice(2)],
    { stdio: "inherit" },
  );
  process.exit(child.status ?? 1);
}

const { runFlowCli } = await import("../flow/scaffold.ts");
await runFlowCli(process.argv.slice(2));
