/**
 * Mechanical Don't scanners for catalog surfaces with complete Don't coverage.
 * Do not rewrite host fonts. Do not inject a kit. Do not invent missing widgets.
 */

import fs from "node:fs";
import path from "node:path";
import { allRecords } from "./donts/registry.mjs";
import { hit } from "./donts/shared.mjs";
import { scanReduceMotion, REDUCE_CSS } from "./donts/foundations-motion.mjs";

function unquote(raw) {
  const v = String(raw).trim();
  if (v.startsWith('"') && v.endsWith('"')) return JSON.parse(v);
  return v;
}

export function normalizePhrase(s) {
  return String(s || "")
    .replace(/`([^`]+)`/g, "$1")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseDontHeuristics(text) {
  const heuristics = [];
  let current = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const start = raw.match(/^\s*-\s+id:\s*(\S+)\s*$/);
    if (start) {
      current = { id: start[1], match: "", chromeIds: [] };
      heuristics.push(current);
      continue;
    }
    if (!current) continue;
    const match = raw.match(/^\s+match:\s*(.+)\s*$/);
    if (match) {
      current.match = unquote(match[1]);
      continue;
    }
    const chrome = raw.match(/^\s+-\s+(chrome\.[a-z0-9.-]+)\s*$/);
    if (chrome) current.chromeIds.push(chrome[1]);
  }
  return heuristics;
}

export function loadDontHeuristics(skillRoot) {
  const file = path.join(skillRoot, "knowledge", "chrome", "dont-heuristics.yaml");
  if (!fs.existsSync(file)) return [];
  return parseDontHeuristics(fs.readFileSync(file, "utf8"));
}

export function matchHeuristic(bullet, heuristics) {
  const n = normalizePhrase(bullet);
  if (!n) return null;
  let best = null;
  let bestLen = 0;
  for (const h of heuristics || []) {
    const m = normalizePhrase(h.match);
    if (!m) continue;
    if (n === m || n.includes(m)) {
      if (m.length >= bestLen) {
        best = h;
        bestLen = m.length;
      }
    }
  }
  return best;
}

const registry = new Map(allRecords.map((row) => [row.id, row]));

function scanRecord(id, files) {
  const row = registry.get(id);
  if (!row) return [hit("", `no scanner for ${id}`)];
  return row.scan(files);
}

function applyRecord(id, file) {
  const row = registry.get(id);
  if (!row) return file.text;
  return row.apply(file.text, file);
}

function applyWanted(files, ids) {
  const mutated = new Set();
  const hitIds = ids.filter((id) => scanRecord(id, files).length > 0);
  for (const id of hitIds) {
    for (const file of files) {
      const next = applyRecord(id, file);
      if (next === file.text) continue;
      file.text = next;
      mutated.add(id);
    }
  }
  const css = files.find((f) => /\.css$/i.test(f.path));
  if (scanReduceMotion(files).length && css && !/prefers-reduced-motion/i.test(css.text)) {
    css.text = `${css.text.trimEnd()}\n${REDUCE_CSS}`;
    mutated.add("motion-without-reduce");
  }
  if (mutated.size) {
    // Sibling Don'ts can share an applier; credit every pre-apply hit so the
    // cleaned topic accounts as applied instead of already-compliant.
    for (const id of hitIds) mutated.add(id);
  }
  return mutated;
}

export function accountRequiredProseDont({ topics, catalog, files }) {
  const wanted = [];
  const seen = new Set();
  for (const [id, row] of Object.entries(topics)) {
    if (row.state !== "pending") continue;
    const topic = catalog.byId[id];
    if (!topic?.dontCoverageComplete) continue;
    for (const hid of topic.dontHeuristicIds || []) {
      if (seen.has(hid)) continue;
      seen.add(hid);
      wanted.push(hid);
    }
  }
  const mutated = applyWanted(files, wanted);
  const accounted = [];
  const nextTopics = {};
  for (const [id, row] of Object.entries(topics)) {
    let next = { ...row };
    if (row.state === "pending") {
      const topic = catalog.byId[id];
      if (topic?.dontCoverageComplete) {
        const ids = topic.dontHeuristicIds || [];
        const hits = ids.flatMap((hid) => scanRecord(hid, files));
        if (hits.length === 0) {
          const didMutate = ids.some((hid) => mutated.has(hid));
          next = {
            ...row,
            state: didMutate ? "applied" : "already-compliant",
          };
          accounted.push({ id, state: next.state, heuristics: ids });
        }
      }
    }
    nextTopics[id] = next;
  }
  return { topics: nextTopics, accounted };
}
