"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { and, eq } from "drizzle-orm";

export async function getNotifications() {
  const session = await requireAuth();
  const userId = session.user.id;

  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: (n, { desc }) => [desc(n.createdAt)],
    limit: 20,
  });
}

export async function getUnreadNotificationCount() {
  const session = await requireAuth();
  const userId = session.user.id;

  const unread = await db.query.notifications.findMany({
    where: and(eq(notifications.userId, userId), eq(notifications.read, false)),
  });

  return unread.length;
}

export async function markAsRead({ notificationId }: { notificationId: string }) {
  const session = await requireAuth();
  const userId = session.user.id;

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));

  return { success: true };
}

export async function markAllAsRead() {
  const session = await requireAuth();
  const userId = session.user.id;

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId));

  return { success: true };
}
