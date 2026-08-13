"use server";

import { db } from "@/db";
import { activityLogs, jemawMembers } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { requireActiveJemawMembership } from "@/lib/authorization";
import { eq, inArray } from "drizzle-orm";

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

export async function getMyRecentActivity() {
  const session = await requireAuth();
  const memberships = await db.query.jemawMembers.findMany({
    where: eq(jemawMembers.userId, session.user.id),
    with: { jemaw: true },
  });
  const activeJemawIds = memberships
    .filter((membership) => !membership.jemaw.archivedAt)
    .map((membership) => membership.jemawId);

  if (activeJemawIds.length === 0) return [];

  return db.query.activityLogs.findMany({
    where: inArray(activityLogs.jemawId, activeJemawIds),
    with: { user: true, jemaw: true },
    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    limit: 12,
  });
}
