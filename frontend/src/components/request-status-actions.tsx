"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RequestStatus } from "@/types/domain";

interface StatusActionsProps {
  requestId: string;
  status: RequestStatus;
  token: string;
  role: "renter" | "lender";
  onDone?: () => void;
}

function getActions(status: RequestStatus, role: "renter" | "lender"): RequestStatus[] {
  if (role === "lender" && (status === "requested" || status === "chatting")) {
    return ["accepted", "rejected"];
  }
  if (role === "renter" && status === "accepted") {
    return ["confirmed"];
  }
  if (status === "accepted" || status === "confirmed") {
    return ["active"];
  }
  if (status === "active") {
    return ["return_pending"];
  }
  if (status === "return_pending") {
    return ["completed"];
  }
  return [];
}

function labelForAction(status: RequestStatus) {
  switch (status) {
    case "accepted":
      return "Accept";
    case "rejected":
      return "Reject";
    case "confirmed":
      return "Confirm Booking";
    case "active":
      return "Confirm Pickup";
    case "return_pending":
      return "Start Return";
    case "completed":
      return "Mark Completed";
    default:
      return status;
  }
}

export function RequestStatusActions({
  requestId,
  status,
  token,
  role,
  onDone,
}: StatusActionsProps) {
  const queryClient = useQueryClient();
  const actions = getActions(status, role);

  const mutation = useMutation({
    mutationFn: (nextStatus: RequestStatus) =>
      api.put(`/api/requests/${requestId}/status`, { status: nextStatus }, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["requests"] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onDone?.();
    },
  });

  if (actions.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(action)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            action === "rejected"
              ? "border border-rose-200 bg-rose-50 text-rose-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {labelForAction(action)}
        </button>
      ))}
    </div>
  );
}
