import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function createNotification({
  userId,
  message,
  link,
}: {
  userId: string;
  message: string;
  link: string;
}) {
  await db.insert(notifications).values({ userId, message, link, read: false });
}
