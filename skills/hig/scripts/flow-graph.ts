/**
 * Flow graph for `.hig/screens.yaml`.
 * YAML enters as `unknown`. One parse returns the domain graph or a typed error.
 */

declare const screenIdBrand: unique symbol;
declare const routeIdBrand: unique symbol;

/** A screen id. Not a route. */
export type ScreenId = string & { readonly [screenIdBrand]: true };

/** A route id. Not a screen id. */
export type RouteId = string & { readonly [routeIdBrand]: true };

export type ListStatus = "empty" | "loading" | "ready" | "fault";

export type ListPane = {
  readonly status: ListStatus;
};

/** Short create stays in detail. Long create owns a route. */
export type CreateFlow =
  | { readonly kind: "short" }
  | { readonly kind: "long"; readonly route: RouteId };

type ScreenFields = {
  readonly id: ScreenId;
  readonly route: RouteId;
  readonly title: string;
  readonly priority: number;
  readonly status: string;
  readonly list?: ListPane;
  readonly create?: CreateFlow;
};

/** Static has no primary action. Action requires a screen destination. */
export type Screen =
  | (ScreenFields & { readonly kind: "static" })
  | (ScreenFields & { readonly kind: "action"; readonly to: ScreenId });

export type FlowGraph = {
  readonly version: 1;
  readonly entry: RouteId | null;
  readonly screens: readonly Screen[];
};

export type FlowParseResult =
  | { readonly ok: true; readonly graph: FlowGraph }
  | { readonly ok: false; readonly errors: readonly string[] };

const LIST_STATUSES: readonly ListStatus[] = ["empty", "loading", "ready", "fault"];

function asScreenId(value: string): ScreenId {
  return value as ScreenId;
}

function asRouteId(value: string): RouteId {
  return value as RouteId;
}

export function primaryDestination(screen: Screen): ScreenId | null {
  switch (screen.kind) {
    case "static":
      return null;
    case "action":
      return screen.to;
    default: {
      const _exhaustive: never = screen;
      return _exhaustive;
    }
  }
}

export function listStatusName(status: ListStatus): ListStatus {
  switch (status) {
    case "empty":
      return "empty";
    case "loading":
      return "loading";
    case "ready":
      return "ready";
    case "fault":
      return "fault";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function createFlow(spec: { kind: "short" } | { kind: "long"; route: RouteId }): CreateFlow {
  switch (spec.kind) {
    case "short":
      return { kind: "short" };
    case "long":
      return { kind: "long", route: spec.route };
    default: {
      const _exhaustive: never = spec;
      return _exhaustive;
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const duplicateKeys = new WeakMap<object, string[]>();

function repeatedKeys(value: object): readonly string[] {
  return duplicateKeys.get(value) ?? [];
}

function parseScalar(raw: string): unknown {
  const value = raw.replace(/\s+#.*$/, "").trim();
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((part) => parseScalar(part.trim()));
  }
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  if (/^-?\d+$/.test(value)) return Number(value);
  return value;
}

function blankMap(): Record<string, unknown> {
  return {};
}

function assign(map: Record<string, unknown>, key: string, value: unknown): void {
  if (Object.hasOwn(map, key)) {
    const dups = duplicateKeys.get(map) ?? [];
    dups.push(key);
    duplicateKeys.set(map, dups);
  }
  map[key] = value;
}

function contentLine(raw: string): { indent: number; text: string } | null {
  if (!raw.trim() || raw.trim().startsWith("#")) return null;
  const indent = raw.match(/^ */)?.[0].length ?? 0;
  return { indent, text: raw.trim() };
}

function nextMeaningful(
  lines: readonly string[],
  start: number,
): { indent: number; text: string } | null {
  for (let i = start; i < lines.length; i++) {
    const line = contentLine(lines[i] ?? "");
    if (line) return line;
  }
  return null;
}

/** Minimal YAML subset for screens.yaml. Returns `unknown` on purpose. */
function parseYamlDocument(text: string): unknown {
  if (text.includes("\t")) {
    throw new Error("yaml tabs are not allowed");
  }
  const lines = text.split(/\r?\n/);
  const root = blankMap();
  const frames: { indent: number; map: Record<string, unknown> }[] = [
    { indent: -1, map: root },
  ];
  const sequences: { indent: number; items: Record<string, unknown>[] }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const content = contentLine(lines[i] ?? "");
    if (!content) continue;
    const indent = content.indent;
    const line = content.text;

    while (frames.length > 1) {
      const frame = frames[frames.length - 1];
      if (!frame || indent > frame.indent) break;
      frames.pop();
    }

    const item = line.match(/^-\s*(.*)$/);
    const body = item ? (item[1] ?? "") : line;
    let map = frames[frames.length - 1]?.map ?? root;

    if (item) {
      let seq: { indent: number; items: Record<string, unknown>[] } | undefined;
      for (let s = sequences.length - 1; s >= 0; s--) {
        const candidate = sequences[s];
        if (candidate?.indent === indent) {
          seq = candidate;
          break;
        }
      }
      if (!seq) {
        throw new Error(`yaml sequence item has no list at indent ${indent}`);
      }
      const obj = blankMap();
      seq.items.push(obj);
      frames.push({ indent, map: obj });
      map = obj;
      if (!body) continue;
    }

    const kv = body.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!kv) {
      throw new Error(`yaml line is not a field: ${line}`);
    }
    const key = kv[1] ?? "";
    const rawVal = (kv[2] ?? "").trim();
    if (rawVal === "" || rawVal === "|" || rawVal === ">") {
      const next = nextMeaningful(lines, i + 1);
      if (next && next.indent > indent && next.text.startsWith("- ")) {
        const items: Record<string, unknown>[] = [];
        assign(map, key, items);
        sequences.push({ indent: next.indent, items });
      } else {
        const child = blankMap();
        assign(map, key, child);
        frames.push({ indent, map: child });
      }
      continue;
    }
    assign(map, key, parseScalar(rawVal));
  }

  return root;
}

function screenIdText(value: unknown, label: string, errors: string[]): ScreenId | null {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(value)) {
    errors.push(`${label} must be a screen id`);
    return null;
  }
  return asScreenId(value);
}

function routeText(value: unknown, label: string, errors: string[]): RouteId | null {
  if (typeof value !== "string" || value.length === 0 || /\s/.test(value)) {
    errors.push(`${label} must be a route`);
    return null;
  }
  return asRouteId(value);
}

function isListStatus(value: string): value is ListStatus {
  return LIST_STATUSES.some((status) => status === value);
}

function parseList(value: unknown, label: string, errors: string[]): ListPane | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    errors.push(`${label} list must be one status`);
    return undefined;
  }
  const dups = repeatedKeys(value);
  const status = value.status;
  if (dups.includes("status") || Array.isArray(status)) {
    errors.push(`${label} list has two statuses`);
    return undefined;
  }
  if (typeof status !== "string" || !isListStatus(status)) {
    errors.push(`${label} list status must be empty, loading, ready, or fault`);
    return undefined;
  }
  return { status: listStatusName(status) };
}

function parseCreate(
  value: unknown,
  label: string,
  errors: string[],
): CreateFlow | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    errors.push(`${label} create must be short or long`);
    return undefined;
  }
  const dups = repeatedKeys(value);
  const kind = value.kind;
  const hasRoute = Object.hasOwn(value, "route");
  if (dups.includes("route")) {
    errors.push(`${label} create has two routes`);
    return undefined;
  }
  if (dups.includes("kind") || (kind === "short" && hasRoute)) {
    errors.push(`${label} create is both short and long`);
    return undefined;
  }
  if (kind !== "short" && kind !== "long") {
    errors.push(`${label} create must be short or long`);
    return undefined;
  }
  if (kind === "short") {
    return createFlow({ kind: "short" });
  }
  const route = routeText(value.route, `${label} create route`, errors);
  if (!route) return undefined;
  return createFlow({ kind: "long", route });
}

function parseScreen(
  value: unknown,
  index: number,
  errors: string[],
): Screen | null {
  const label = `screens[${index}]`;
  if (!isRecord(value)) {
    errors.push(`${label} must be a screen`);
    return null;
  }
  const idText = screenIdText(value.id, `${label} id`, errors);
  const route = routeText(value.route, `${label} route`, errors);
  if (typeof value.title !== "string" || value.title.length === 0) {
    errors.push(`${label} needs a title`);
  }
  if (typeof value.priority !== "number") {
    errors.push(`${label} needs a priority`);
  }
  if (typeof value.status !== "string" || value.status.length === 0) {
    errors.push(`${label} needs a status`);
  }
  const screenDups = repeatedKeys(value);
  if (screenDups.includes("list")) {
    errors.push(`${label} list has two statuses`);
    return null;
  }
  if (screenDups.includes("create")) {
    errors.push(`${label} create is both short and long`);
    return null;
  }
  if (screenDups.includes("kind") || screenDups.includes("to")) {
    errors.push(`${label} screen repeats kind or destination`);
    return null;
  }
  const list = parseList(value.list, label, errors);
  const create = parseCreate(value.create, label, errors);
  const kind = value.kind === undefined ? "static" : value.kind;
  const hasTo = Object.hasOwn(value, "to");
  if (kind !== "static" && kind !== "action") {
    errors.push(`${label} kind must be static or action`);
    return null;
  }
  if (kind === "static" && hasTo) {
    errors.push(`${label} static screen has no primary action`);
    return null;
  }
  if (kind === "action" && !hasTo) {
    errors.push(`${label} action screen needs a destination`);
    return null;
  }
  if (
    idText === null ||
    route === null ||
    typeof value.title !== "string" ||
    typeof value.priority !== "number" ||
    typeof value.status !== "string"
  ) {
    return null;
  }
  const base: ScreenFields = {
    id: idText,
    route,
    title: value.title,
    priority: value.priority,
    status: value.status,
    ...(list ? { list } : {}),
    ...(create ? { create } : {}),
  };
  if (kind === "static") {
    return { ...base, kind: "static" };
  }
  const toText = screenIdText(value.to, `${label} destination`, errors);
  if (toText === null) return null;
  return { ...base, kind: "action", to: toText };
}

export function parseFlowGraph(input: unknown): FlowParseResult {
  const errors: string[] = [];
  if (!isRecord(input)) {
    return { ok: false, errors: ["flow graph must be a document"] };
  }
  const docDups = repeatedKeys(input);
  if (
    docDups.includes("version") ||
    docDups.includes("entry") ||
    docDups.includes("screens")
  ) {
    errors.push("flow graph repeats version, entry, or screens");
    return { ok: false, errors };
  }
  if (input.version !== 1) {
    errors.push("version must be 1");
  }
  let entry: RouteId | null = null;
  if (Object.hasOwn(input, "entry")) {
    entry = routeText(input.entry, "entry", errors);
  }
  if (!Array.isArray(input.screens)) {
    errors.push("screens must be a list");
    return { ok: false, errors };
  }
  const screens: Screen[] = [];
  input.screens.forEach((row, index) => {
    const screen = parseScreen(row, index, errors);
    if (screen) screens.push(screen);
  });
  if (errors.length > 0) return { ok: false, errors };

  const ids = new Set(screens.map((screen) => screen.id));
  if (ids.size !== screens.length) {
    errors.push("screen ids must be unique");
  }
  const routes = new Set(screens.map((screen) => screen.route));
  if (entry !== null && !routes.has(entry)) {
    errors.push("entry must be a screen route");
  }
  for (const screen of screens) {
    const destination = primaryDestination(screen);
    if (destination !== null && !ids.has(destination)) {
      errors.push(`screens ${screen.id} destination is not a screen id`);
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    graph: {
      version: 1,
      entry,
      screens,
    },
  };
}

export function parseFlowYaml(text: string): FlowParseResult {
  try {
    return parseFlowGraph(parseYamlDocument(text));
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid yaml";
    return { ok: false, errors: [message] };
  }
}
