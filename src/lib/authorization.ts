import { db } from "@/db";
import { jemawMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function requireActiveJemawMembership(
  jemawId: string,
  userId: string
) {
  const membership = await db.query.jemawMembers.findFirst({
    where: and(
      eq(jemawMembers.jemawId, jemawId),
      eq(jemawMembers.userId, userId)
    ),
    with: { jemaw: true },
  });

  if (!membership || membership.jemaw.archivedAt !== null) {
    throw new Error("You are not a member of this active group");
  }

  return membership;
}
