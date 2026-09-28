#!/usr/bin/env node
/**
 * Load knowledge/catalog.yaml (offline). Optional skillRoot argv.
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadCatalog, selectCatalog } from "./catalog-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSkillRoot = path.resolve(__dirname, "..");

function main() {
  const skillRoot = process.argv[2] ? path.resolve(process.argv[2]) : defaultSkillRoot;
  const catalog = loadCatalog(skillRoot);
  process.stdout.write(
    JSON.stringify(
      {
        version: catalog.version,
        fetched: catalog.fetched,
        sourceUrl: catalog.sourceUrl,
        topicCount: catalog.count,
        ids: catalog.topics.map((t) => t.id),
      },
      null,
      2,
    ) + "\n",
  );
}

export { loadCatalog, selectCatalog };

const isCli =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isCli) {
  try {
    main();
  } catch (err) {
    process.stderr.write(String(err?.stack || err) + "\n");
    process.exit(1);
  }
}
