#!/usr/bin/env node
/**
 * One-shot System One call. Not imported by /hig apply, check, or catalog.
 * Reads TYPESAFE_API_KEY from the environment. Never prints the key.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildJevRequest } from "../skills/hig/knowledge/chrome/jev-questions.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = process.argv[2] || "/opt/cursor/artifacts/jev-rank.json";
const endpoint = "https://api.typesafe.ai/v1/systemone";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function post(body, key) {
  const delays = [0, 2000, 4000, 8000];
  let last = null;
  for (const delay of delays) {
    if (delay) await sleep(delay);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
    if (res.status === 429 || res.status === 529) {
      last = { status: res.status, body: parsed };
      continue;
    }
    return { status: res.status, body: parsed };
  }
  return last;
}

const key = process.env.TYPESAFE_API_KEY;
if (!key) {
  process.stderr.write("TYPESAFE_API_KEY is missing\n");
  process.exit(1);
}

const request = buildJevRequest();
const result = await post(request, key);
if (!result || result.status !== 200) {
  const status = result ? result.status : "no-response";
  process.stderr.write(`TypeSafe API error ${status}\n`);
  process.stderr.write(`${JSON.stringify(result ? result.body : null)}\n`);
  process.exit(1);
}

const payload = {
  model: result.body.model ?? null,
  answers: result.body.answers ?? null,
  usage: result.body.usage ?? null,
};
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n");
process.stdout.write(`wrote ${outPath}\n`);
process.stdout.write(`${JSON.stringify(payload)}\n`);
