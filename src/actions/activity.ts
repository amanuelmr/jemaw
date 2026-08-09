"use server";

import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function getJemawActivity(jemawId: string) {
  await requireAuth();

  const logs = await db.query.activityLogs.findMany({
    where: eq(activityLogs.jemawId, jemawId),
    with: {
      user: true,
    },
    orderBy: (activityLogs, { desc }) => [desc(activityLogs.createdAt)],
    limit: 50,
  });

  return logs;
}
