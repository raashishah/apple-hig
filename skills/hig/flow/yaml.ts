/**
 * YAML subset → unknown. Screens and flow files only.
 * No schema library. Callers parse the unknown value once.
 */

type YamlAssign = {
  map: Record<string, unknown>;
  key: string;
  value: unknown;
};

function assignKey(input: YamlAssign): void {
  const { map, key, value } = input;
  if (!Object.prototype.hasOwnProperty.call(map, key)) {
    map[key] = value;
    return;
  }
  const prev = map[key];
  map[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
}

function parseScalar(raw: string): unknown {
  const text = raw.trim();
  if (text === "" || text === "~" || text === "null") return null;
  if (text === "true") return true;
  if (text === "false") return false;
  if (/^-?\d+$/.test(text)) return Number(text);
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  if (text.startsWith("[") && text.endsWith("]")) {
    const inner = text.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((part) => parseScalar(part.trim()));
  }
  return text;
}

function indentOf(line: string): number {
  const match = line.match(/^( *)\S/);
  return match?.[1]?.length ?? 0;
}

function nextContent(lines: readonly string[], index: number): number {
  let cursor = index;
  while (cursor < lines.length) {
    const line = lines[cursor] ?? "";
    if (line.trim() && !line.trim().startsWith("#")) return cursor;
    cursor += 1;
  }
  return cursor;
}

type BlockResult = { value: unknown; next: number };

function parseBlock(lines: readonly string[], start: number, indent: number): BlockResult {
  const index = nextContent(lines, start);
  if (index >= lines.length) return { value: null, next: index };
  const line = lines[index] ?? "";
  if (indentOf(line) < indent) return { value: null, next: index };
  if (line.trimStart().startsWith("- ")) return parseSequence(lines, index, indent);
  return parseMap(lines, index, indent);
}

function parseSequence(lines: readonly string[], start: number, indent: number): BlockResult {
  const items: unknown[] = [];
  let cursor = start;
  while (cursor < lines.length) {
    const index = nextContent(lines, cursor);
    if (index >= lines.length) return { value: items, next: index };
    const line = lines[index] ?? "";
    if (indentOf(line) < indent) return { value: items, next: index };
    if (indentOf(line) > indent) return { value: items, next: index };
    const trimmed = line.trim();
    if (!trimmed.startsWith("- ")) return { value: items, next: index };
    const rest = trimmed.slice(2);
    const nestedIndex = nextContent(lines, index + 1);
    const nestedLine = lines[nestedIndex] ?? "";
    const keyValue = rest.match(/^([^:#]+):\s*(.*)$/);
    if (keyValue && keyValue[1] && (keyValue[2] !== undefined)) {
      const map: Record<string, unknown> = {};
      const inline = keyValue[2].trim();
      assignKey({
        map,
        key: keyValue[1].trim(),
        value: inline === "" ? null : parseScalar(inline),
      });
      if (inline === "" && nestedIndex < lines.length && indentOf(nestedLine) > indent) {
        const nested = parseBlock(lines, nestedIndex, indentOf(nestedLine));
        assignKey({ map, key: keyValue[1].trim(), value: nested.value });
        cursor = nested.next;
      } else {
        cursor = index + 1;
      }
      while (cursor < lines.length) {
        const childIndex = nextContent(lines, cursor);
        if (childIndex >= lines.length) {
          cursor = childIndex;
          break;
        }
        const child = lines[childIndex] ?? "";
        if (indentOf(child) <= indent) {
          cursor = childIndex;
          break;
        }
        const childTrim = child.trim();
        const childKey = childTrim.match(/^([^:#]+):\s*(.*)$/);
        if (!childKey?.[1]) {
          cursor = childIndex + 1;
          continue;
        }
        const childInline = (childKey[2] ?? "").trim();
        if (childInline === "") {
          const after = nextContent(lines, childIndex + 1);
          const afterLine = lines[after] ?? "";
          if (after < lines.length && indentOf(afterLine) > indentOf(child)) {
            const nested = parseBlock(lines, after, indentOf(afterLine));
            assignKey({ map, key: childKey[1].trim(), value: nested.value });
            cursor = nested.next;
            continue;
          }
        }
        assignKey({
          map,
          key: childKey[1].trim(),
          value: childInline === "" ? null : parseScalar(childInline),
        });
        cursor = childIndex + 1;
      }
      items.push(map);
      continue;
    }
    items.push(parseScalar(rest));
    cursor = index + 1;
  }
  return { value: items, next: cursor };
}

function parseMap(lines: readonly string[], start: number, indent: number): BlockResult {
  const map: Record<string, unknown> = {};
  let cursor = start;
  while (cursor < lines.length) {
    const index = nextContent(lines, cursor);
    if (index >= lines.length) return { value: map, next: index };
    const line = lines[index] ?? "";
    if (indentOf(line) < indent) return { value: map, next: index };
    if (indentOf(line) > indent) return { value: map, next: index };
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) return { value: map, next: index };
    const keyValue = trimmed.match(/^([^:#]+):\s*(.*)$/);
    if (!keyValue?.[1]) {
      cursor = index + 1;
      continue;
    }
    const inline = (keyValue[2] ?? "").trim();
    if (inline === "" || inline === "|" || inline === ">") {
      const after = nextContent(lines, index + 1);
      const afterLine = lines[after] ?? "";
      if (after < lines.length && indentOf(afterLine) > indent) {
        const nested = parseBlock(lines, after, indentOf(afterLine));
        assignKey({ map, key: keyValue[1].trim(), value: nested.value });
        cursor = nested.next;
        continue;
      }
      assignKey({ map, key: keyValue[1].trim(), value: null });
      cursor = index + 1;
      continue;
    }
    assignKey({ map, key: keyValue[1].trim(), value: parseScalar(inline) });
    cursor = index + 1;
  }
  return { value: map, next: cursor };
}

export function parseYamlUnknown(text: string): unknown {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\t/g, "  "));
  const first = nextContent(lines, 0);
  if (first >= lines.length) return null;
  return parseBlock(lines, first, indentOf(lines[first] ?? "")).value;
}
