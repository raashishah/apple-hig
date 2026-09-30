/**
 * Flow graph for /hig. Parsed once from YAML or JSON (unknown in).
 * ScreenId and RouteId are branded so a destination cannot be a route.
 */

import { parseYamlUnknown } from "./yaml.ts";
import { isListStatus, type ListStatus } from "./list-status.ts";

declare const screenIdBrand: unique symbol;
declare const routeIdBrand: unique symbol;

export type ScreenId = string & { readonly [screenIdBrand]: "ScreenId" };
export type RouteId = string & { readonly [routeIdBrand]: "RouteId" };

export type CreateFlow =
  | { kind: "short" }
  | { kind: "long"; route: RouteId };

type ScreenBase = {
  id: ScreenId;
  route: RouteId;
  title: string;
  priority: number;
  recordStatus: string | null;
  list: { status: ListStatus } | null;
  create: CreateFlow | null;
};

export type FlowScreen =
  | (ScreenBase & { kind: "static" })
  | (ScreenBase & { kind: "action"; destination: ScreenId });

export type FlowGraph = {
  version: 1;
  entry: RouteId | null;
  screens: FlowScreen[];
};

export type LegacyScreen = {
  id: string;
  route: string;
  title: string;
  priority: number;
  status: string | null;
};

export type FlowErrorCode =
  | "invalid-document"
  | "action-without-destination"
  | "static-with-destination"
  | "list-two-statuses"
  | "create-both-lengths"
  | "unknown-list-status"
  | "unknown-kind"
  | "long-create-without-route"
  | "unknown-destination"
  | "duplicate-id"
  | "entry-not-route";

export type FlowParseError = {
  ok: false;
  code: FlowErrorCode;
  path: string;
};

export type FlowParseResult = { ok: true; graph: FlowGraph } | FlowParseError;

function fail(code: FlowErrorCode, path: string): FlowParseError {
  return { ok: false, code, path };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function brandScreenId(value: string): ScreenId {
  return value as ScreenId;
}

function brandRouteId(value: string): RouteId {
  return value as RouteId;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function statusList(value: unknown): string[] | FlowParseError {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return fail("unknown-list-status", "list.status");
  const names: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return fail("unknown-list-status", "list.status");
    names.push(item);
  }
  return names;
}

function parseList(value: unknown, path: string): { status: ListStatus } | null | FlowParseError {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) return fail("invalid-document", path);
  const flagNames = ["empty", "loading", "ready", "fault"].filter((name) => value[name] === true);
  if (flagNames.length > 1) return fail("list-two-statuses", path);
  if (value.status !== undefined && value.statuses !== undefined) {
    return fail("list-two-statuses", path);
  }
  const raw = value.statuses !== undefined ? value.statuses : value.status;
  if (raw === undefined) {
    if (flagNames.length === 1) {
      const only = flagNames[0];
      if (!only || !isListStatus(only)) return fail("unknown-list-status", path);
      return { status: only };
    }
    return fail("unknown-list-status", path);
  }
  const names = statusList(raw);
  if (!Array.isArray(names)) return names;
  if (names.length !== 1) return fail("list-two-statuses", path);
  const name = names[0];
  if (!name || !isListStatus(name)) return fail("unknown-list-status", `${path}.status`);
  return { status: name };
}

function parseCreate(value: unknown, path: string): CreateFlow | null | FlowParseError {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) return fail("invalid-document", path);
  if (value.short === true && value.long === true) return fail("create-both-lengths", path);
  if (value.kind !== undefined && value.kinds !== undefined) return fail("create-both-lengths", path);
  const rawKind = value.kinds !== undefined ? value.kinds : value.kind;
  const kinds = statusList(rawKind);
  if (!Array.isArray(kinds)) return fail("unknown-kind", `${path}.kind`);
  if (kinds.length !== 1) return fail("create-both-lengths", path);
  const kind = kinds[0];
  const route = readString(value.route);
  if (kind === "short") {
    if (route || value.long === true) return fail("create-both-lengths", path);
    return { kind: "short" };
  }
  if (kind === "long") {
    if (value.short === true) return fail("create-both-lengths", path);
    if (!route) return fail("long-create-without-route", path);
    return { kind: "long", route: brandRouteId(route) };
  }
  return fail("unknown-kind", `${path}.kind`);
}

function parseScreen(value: unknown, index: number): FlowScreen | FlowParseError {
  const path = `screens[${index}]`;
  if (!isRecord(value)) return fail("invalid-document", path);
  const id = readString(value.id);
  const route = readString(value.route);
  const title = readString(value.title);
  if (!id || !route || !title) return fail("invalid-document", path);
  const priority = typeof value.priority === "number" ? value.priority : 0;
  const recordStatus = typeof value.status === "string" ? value.status : null;
  const list = parseList(value.list, `${path}.list`);
  if (list && "ok" in list) return list;
  const create = parseCreate(value.create, `${path}.create`);
  if (create && "ok" in create) return create;
  const destination = readString(value.destination);
  const kindRaw = value.kind === undefined ? null : readString(value.kind);
  if (value.kind !== undefined && !kindRaw) return fail("unknown-kind", `${path}.kind`);
  const base: ScreenBase = {
    id: brandScreenId(id),
    route: brandRouteId(route),
    title,
    priority,
    recordStatus,
    list,
    create,
  };
  if (kindRaw === null) {
    if (destination) {
      return { ...base, kind: "action", destination: brandScreenId(destination) };
    }
    return { ...base, kind: "static" };
  }
  if (kindRaw === "static") {
    if (destination) return fail("static-with-destination", path);
    return { ...base, kind: "static" };
  }
  if (kindRaw === "action") {
    if (!destination) return fail("action-without-destination", path);
    return { ...base, kind: "action", destination: brandScreenId(destination) };
  }
  return fail("unknown-kind", `${path}.kind`);
}

export function parseFlow(input: { document: unknown }): FlowParseResult {
  const document = input.document;
  if (!isRecord(document)) return fail("invalid-document", "");
  if (document.version !== undefined && document.version !== 1) {
    return fail("invalid-document", "version");
  }
  if (!Array.isArray(document.screens)) return fail("invalid-document", "screens");
  const screens: FlowScreen[] = [];
  const ids = new Set<string>();
  for (let index = 0; index < document.screens.length; index += 1) {
    const screen = parseScreen(document.screens[index], index);
    if ("ok" in screen) return screen;
    if (ids.has(screen.id)) return fail("duplicate-id", `screens[${index}].id`);
    ids.add(screen.id);
    screens.push(screen);
  }
  for (const screen of screens) {
    if (screen.kind === "static") continue;
    if (!ids.has(screen.destination)) {
      return fail("unknown-destination", `screens.${screen.id}.destination`);
    }
  }
  let entry: RouteId | null = null;
  if (document.entry !== undefined && document.entry !== null) {
    const entryText = readString(document.entry);
    if (!entryText) return fail("entry-not-route", "entry");
    const routes = new Set(screens.map((screen) => screen.route));
    if (!routes.has(brandRouteId(entryText))) return fail("entry-not-route", "entry");
    entry = brandRouteId(entryText);
  }
  return { ok: true, graph: { version: 1, entry, screens } };
}

export function parseFlowYaml(input: { text: string }): FlowParseResult {
  return parseFlow({ document: parseYamlUnknown(input.text) });
}

export function legacyScreens(graph: FlowGraph): LegacyScreen[] {
  return graph.screens.map((screen) => ({
    id: screen.id,
    route: screen.route,
    title: screen.title,
    priority: screen.priority,
    status: screen.recordStatus,
  }));
}

export function screenDestination(screen: FlowScreen): ScreenId | null {
  switch (screen.kind) {
    case "static":
      return null;
    case "action":
      return screen.destination;
    default: {
      const _exhaustive: never = screen;
      return _exhaustive;
    }
  }
}

export function routeForScreen(input: { graph: FlowGraph; id: ScreenId }): RouteId | null {
  for (const screen of input.graph.screens) {
    if (screen.id === input.id) return screen.route;
  }
  return null;
}
