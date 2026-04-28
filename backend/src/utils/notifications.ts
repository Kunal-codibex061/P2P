import { Notification } from "../models";

export type NotificationType =
  | "request_created"
  | "request_status_changed"
  | "item_request_response"
  | "item_request_status_changed"
  | "listing_status_changed"
  | "listing_deleted"
  | "general";

interface NotificationInput {
  userId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: NotificationInput) {
  if (!input.userId) return null;
  if (input.actorId && input.userId === input.actorId) return null;

  return Notification.create({
    userId: input.userId,
    actorId: input.actorId || null,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link || "",
    metadata: input.metadata || {},
  });
}

export async function createNotifications(inputs: NotificationInput[]) {
  const queued = inputs.filter((input) => input.userId && input.userId !== input.actorId);
  if (queued.length === 0) return;
  await Notification.insertMany(
    queued.map((input) => ({
      userId: input.userId,
      actorId: input.actorId || null,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link || "",
      metadata: input.metadata || {},
    })),
    { ordered: false },
  );
}
