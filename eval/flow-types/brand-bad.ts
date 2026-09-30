import { parseFlowYaml, type ScreenId } from "../../skills/hig/flow/graph.ts";

function needsScreen(id: ScreenId): ScreenId {
  return id;
}

const parsed = parseFlowYaml({
  text: `screens:
  - id: home
    route: /
    title: Home
    kind: static
`,
});

if (parsed.ok) {
  const screen = parsed.graph.screens[0];
  if (screen) needsScreen(screen.route);
}
