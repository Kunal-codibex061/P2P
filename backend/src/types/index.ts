export type KycStatus = "not_started" | "pending" | "verified" | "failed";

export type RentUnit = "day" | "week" | "month";

export type AvailabilityStatus = "available" | "unavailable" | "rented";

export type ModerationStatus = "approved" | "pending" | "rejected";

export type RequestStatus =
  | "requested"
  | "chatting"
  | "accepted"
  | "rejected"
  | "confirmed"
  | "active"
  | "return_pending"
  | "completed"
  | "disputed"
  | "cancelled";

export type MessageType = "text" | "system";

export interface AuthUserPayload {
  id: string;
}

export interface AuthedRequestUser {
  _id: string;
  name: string;
  email: string;
  roleTags: string[];
}
