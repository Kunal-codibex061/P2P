import type { ItemRequestStatus } from "../types";

const ITEM_REQUEST_TRANSITIONS: Record<ItemRequestStatus, ItemRequestStatus[]> = {
  open: ["responded", "chatting", "accepted", "cancelled", "expired"],
  responded: ["chatting", "accepted", "cancelled", "expired"],
  chatting: ["accepted", "cancelled", "expired"],
  accepted: ["confirmed", "active", "cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  expired: [],
};

export function canTransitionItemRequestStatus(
  from: ItemRequestStatus,
  to: ItemRequestStatus,
): boolean {
  return ITEM_REQUEST_TRANSITIONS[from]?.includes(to) ?? false;
}

export function itemRequestTimeline(status: ItemRequestStatus): ItemRequestStatus[] {
  const steps: ItemRequestStatus[] = ["open", "responded", "accepted", "active", "completed"];
  if (status === "cancelled" || status === "expired") {
    return ["open", status];
  }
  if (status === "chatting") {
    return ["open", "responded", "chatting"];
  }
  return steps;
}
