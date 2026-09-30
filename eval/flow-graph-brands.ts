import {
  parseFlowYaml,
  type RouteId,
  type ScreenId,
} from "../skills/hig/scripts/flow-graph.ts";

function assertDistinct(screen: ScreenId, route: RouteId): void {
  // @ts-expect-error ScreenId is not a RouteId
  const asRoute: RouteId = screen;
  void asRoute;
  // @ts-expect-error RouteId is not a ScreenId
  const asScreen: ScreenId = route;
  void asScreen;
}

/** Compile-time probe: brands stay distinct after a real parse. */
export function brandProbe(yaml: string): ScreenId | null {
  const parsed = parseFlowYaml(yaml);
  if (!parsed.ok) return null;
  const screen = parsed.graph.screens[0];
  if (!screen) return null;
  assertDistinct(screen.id, screen.route);
  if (screen.kind === "action") {
    assertDistinct(screen.to, screen.route);
  }
  return screen.id;
}
