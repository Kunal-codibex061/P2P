import Link from "next/link";
import { CalendarDays, MapPin, MessageSquare } from "lucide-react";
import { formatCurrency, getId, shortDate } from "@/lib/utils";
import type { ItemRequest } from "@/types/domain";
import { RequestStatusBadge } from "./request-status-badge";

interface RequestedItemCardProps {
  request: ItemRequest;
  onCancel: (requestId: string) => void;
  onEdit: (request: ItemRequest) => void;
}

export function RequestedItemCard({ request, onCancel, onEdit }: RequestedItemCardProps) {
  const isOpenRequest = request.type === "open_request";
  const canCancel =
    isOpenRequest && ["open", "responded", "chatting", "accepted"].includes(request.status);
  const canEdit = isOpenRequest && ["open", "responded", "chatting"].includes(request.status);
  const chatHref = request.primaryConversationId ? `/chat/${request.primaryConversationId}` : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{request.title}</p>
          <p className="text-xs text-slate-500">
            {request.category}
            {request.subcategory ? ` / ${request.subcategory}` : ""}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>

      <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
        <p className="inline-flex items-center gap-1">
          <CalendarDays className="h-4 w-4 text-slate-500" />
          {shortDate(request.startDate)} - {shortDate(request.endDate)}
        </p>
        <p>
          Budget:{" "}
          <strong>
            {formatCurrency(request.budgetAmount)} / {request.budgetUnit}
          </strong>
        </p>
        <p>
          Deposit:{" "}
          <strong>
            {request.depositAmount
              ? formatCurrency(request.depositAmount)
              : request.depositPreference.replace("_", " ")}
          </strong>
        </p>
        <p className="inline-flex items-center gap-1">
          <MapPin className="h-4 w-4 text-slate-500" />
          {request.locality}, {request.city}
        </p>
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {request.pickupDeliveryPreference} · Created {shortDate(request.createdAt)} ·{" "}
        {request.responseCount || 0} response(s)
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {isOpenRequest ? (
          <Link
            href={`/requested-items/${request._id}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            View Details
          </Link>
        ) : (
          <Link
            href={`/listings/${getId(request.listingId || "")}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            View Listing
          </Link>
        )}
        {chatHref ? (
          <Link
            href={chatHref}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold !text-white shadow-sm transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400/60"
          >
            <MessageSquare className="h-3.5 w-3.5 !text-white" />
            Open Chat
          </Link>
        ) : null}
        {isOpenRequest && (
          <Link
            href={`/requested-items/${request._id}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            View Matches
          </Link>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(request)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Edit Request
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={() => onCancel(request._id)}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
          >
            Cancel Request
          </button>
        )}
      </div>
    </article>
  );
}
