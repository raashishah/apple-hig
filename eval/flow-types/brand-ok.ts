import { parseFlowYaml, type FlowScreen, type RouteId, type ScreenId } from "../../skills/hig/flow/graph.ts";

function needsScreen(id: ScreenId): ScreenId {
  return id;
}

function needsRoute(route: RouteId): RouteId {
  return route;
}

const parsed = parseFlowYaml({
  text: `screens:
  - id: home
    route: /
    title: Home
    kind: action
    destination: list
  - id: list
    route: /items
    title: Items
    kind: static
`,
});

if (parsed.ok) {
  const screen: FlowScreen | undefined = parsed.graph.screens[0];
  if (screen?.kind === "action") {
    needsScreen(screen.destination);
    needsRoute(screen.route);
  }
}
