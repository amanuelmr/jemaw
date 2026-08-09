import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bills, settlements } from "@/db/schema";
import { requireActiveJemawMembership } from "@/lib/authorization";
import { createCsv } from "@/lib/csv";
import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { z } from "zod";

const groupIdSchema = z.string().uuid();

function safeFilename(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${slug || "jemaw"}-export.csv`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const parsedId = groupIdSchema.safeParse((await params).id);
  if (!parsedId.success) return new Response("Group not found", { status: 404 });

  let membership;
  try {
    membership = await requireActiveJemawMembership(
      parsedId.data,
      session.user.id
    );
  } catch {
    return new Response("Group not found", { status: 404 });
  }

  const [groupBills, groupSettlements] = await Promise.all([
    db.query.bills.findMany({
      where: eq(bills.jemawId, parsedId.data),
      with: {
        paidBy: true,
        splits: { with: { user: true } },
      },
    }),
    db.query.settlements.findMany({
      where: eq(settlements.jemawId, parsedId.data),
      with: { payer: true, receiver: true },
    }),
  ]);

  const exportRows: Array<{
    createdAt: Date;
    values: Array<string | Date | null>;
  }> = [];

  for (const bill of groupBills) {
    for (const split of bill.splits) {
      exportRows.push({
        createdAt: bill.createdAt,
        values: [
          bill.id,
          bill.createdAt,
          "bill",
          bill.status,
          bill.description,
          bill.amount,
          membership.jemaw.currency,
          bill.paidBy.name,
          bill.paidBy.email,
          split.user.name,
          split.user.email,
          split.amount,
          bill.approvedAt,
        ],
      });
    }
  }

  for (const settlement of groupSettlements) {
    exportRows.push({
      createdAt: settlement.createdAt,
      values: [
        settlement.id,
        settlement.createdAt,
        "settlement",
        settlement.status,
        settlement.description,
        settlement.amount,
        membership.jemaw.currency,
        settlement.payer.name,
        settlement.payer.email,
        settlement.receiver.name,
        settlement.receiver.email,
        settlement.amount,
        settlement.approvedAt,
      ],
    });
  }

  exportRows.sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());

  const csv = createCsv(
    [
      "record_id",
      "created_at",
      "type",
      "status",
      "description",
      "total_amount",
      "currency",
      "payer_name",
      "payer_email",
      "participant_name",
      "participant_email",
      "participant_amount",
      "approved_at",
    ],
    exportRows.map((row) => row.values)
  );

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename(membership.jemaw.name)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
