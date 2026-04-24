import type { RequestStatus } from "../types";

const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  requested: ["chatting", "accepted", "rejected", "cancelled"],
  chatting: ["accepted", "rejected", "cancelled"],
  accepted: ["confirmed", "active", "cancelled"],
  rejected: [],
  confirmed: ["active", "cancelled"],
  active: ["return_pending", "disputed"],
  return_pending: ["completed", "disputed"],
  completed: [],
  disputed: ["completed", "cancelled"],
  cancelled: [],
};

export function canTransitionStatus(from: RequestStatus, to: RequestStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function requestTimeline(status: RequestStatus): string[] {
  const steps = [
    "requested",
    "accepted",
    "confirmed",
    "active",
    "return_pending",
    "completed",
  ];
  if (status === "rejected" || status === "cancelled" || status === "disputed") {
    return ["requested", status];
  }
  return steps;
}
