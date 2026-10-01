/**
 * List pane status from the flow graph.
 * The union is closed: empty | loading | ready | fault.
 * Callers must not model this as optional booleans.
 */

export const LIST_STATUSES = ["empty", "loading", "ready", "fault"];

/**
 * @param {"empty" | "loading" | "ready" | "fault"} status
 * @returns {{ offerAdd: boolean, deadDetail: "forbid" | "allow" }}
 */
export function listStatusChrome(status) {
  switch (status) {
    case "empty":
      return { offerAdd: false, deadDetail: "allow" };
    case "loading":
      return { offerAdd: false, deadDetail: "forbid" };
    case "ready":
      return { offerAdd: true, deadDetail: "allow" };
    case "fault":
      return { offerAdd: false, deadDetail: "forbid" };
    default: {
      const _exhaustive = status;
      throw new Error(`unhandled list status: ${String(_exhaustive)}`);
    }
  }
}
