export const LIST_STATUSES = ["empty", "loading", "ready", "fault"] as const;

export type ListStatus = (typeof LIST_STATUSES)[number];

export type ListChrome = {
  offerAdd: boolean;
  idleSelect: boolean;
};

export function chromeForListStatus(status: ListStatus): ListChrome {
  switch (status) {
    case "empty":
      return { offerAdd: false, idleSelect: false };
    case "loading":
      return { offerAdd: false, idleSelect: false };
    case "ready":
      return { offerAdd: true, idleSelect: false };
    case "fault":
      return { offerAdd: false, idleSelect: false };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function isListStatus(value: string): value is ListStatus {
  switch (value) {
    case "empty":
    case "loading":
    case "ready":
    case "fault":
      return true;
    default:
      return false;
  }
}
