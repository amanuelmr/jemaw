"use server";

import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { requireActiveJemawMembership } from "@/lib/authorization";
import { eq } from "drizzle-orm";

export async function getJemawActivity(jemawId: string) {
  const session = await requireAuth();
  await requireActiveJemawMembership(jemawId, session.user.id);

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
