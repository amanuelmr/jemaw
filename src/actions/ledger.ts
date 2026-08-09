"use server";

import { db } from "@/db";
import { ledgerEntries } from "@/db/schema";
import { requireActiveJemawMembership } from "@/lib/authorization";
import { formatMinorUnits, parseMinorUnits } from "@/lib/money";
import { requireAuth } from "@/lib/session";
import { and, desc, eq } from "drizzle-orm";

const LEDGER_PAGE_SIZE = 200;

export async function getMyJemawLedger(jemawId: string) {
  const session = await requireAuth();
  const membership = await requireActiveJemawMembership(
    jemawId,
    session.user.id
  );

  const rows = await db.query.ledgerEntries.findMany({
    where: and(
      eq(ledgerEntries.jemawId, jemawId),
      eq(ledgerEntries.userId, session.user.id)
    ),
    orderBy: [desc(ledgerEntries.createdAt)],
    limit: LEDGER_PAGE_SIZE + 1,
  });

  let runningBalance = parseMinorUnits(
    membership.balance,
    membership.jemaw.currency
  );
  const entries = rows.slice(0, LEDGER_PAGE_SIZE).map((entry) => {
    const balanceAfter = formatMinorUnits(
      runningBalance,
      membership.jemaw.currency
    );
    runningBalance -= parseMinorUnits(entry.amount, membership.jemaw.currency);
    return { ...entry, balanceAfter };
  });

  return {
    currentBalance: membership.balance,
    currency: membership.jemaw.currency,
    entries,
    hasOlderEntries: rows.length > LEDGER_PAGE_SIZE,
  };
}
