"use server";

import { db } from "@/db";
import {
  settlements,
  jemawMembers,
  jemaws,
  users,
  ledgerEntries,
  activityLogs,
} from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { notifyReceiverForSettlementApproval } from "@/lib/email";
import { formatCurrency } from "@/lib/utils";
import { assertBalancedMoney, normalizeMoney } from "@/lib/money";
import { createNotification } from "@/actions/notifications";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Validation schemas
const createSettlementSchema = z.object({
  jemawId: z.string().uuid(),
  receiverId: z.string().min(1, "Receiver is required"),
  amount: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Amount must be a positive number" }
  ),
  description: z.string().max(255).optional(),
  paymentProofUrl: z.string().min(1, "Payment proof screenshot is required"),
});

const approveSettlementSchema = z.object({
  settlementId: z.string().uuid(),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;

export async function createSettlement(input: CreateSettlementInput) {
  const session = await requireAuth();
  const userId = session.user.id;

  const validatedData = createSettlementSchema.parse(input);
  const { jemawId, receiverId, amount, description, paymentProofUrl } = validatedData;

  // Cannot settle with yourself
  if (userId === receiverId) {
    throw new Error("You cannot create a settlement with yourself");
  }

  // Verify user is a member of the jemaw
  const payerMembership = await db.query.jemawMembers.findFirst({
    where: and(
      eq(jemawMembers.jemawId, jemawId),
      eq(jemawMembers.userId, userId)
    ),
    with: { jemaw: true },
  });

  if (!payerMembership) {
    throw new Error("You are not a member of this group");
  }

  // Verify receiver is a member of the jemaw
  const receiverMembership = await db.query.jemawMembers.findFirst({
    where: and(
      eq(jemawMembers.jemawId, jemawId),
      eq(jemawMembers.userId, receiverId)
    ),
    with: { user: true },
  });

  if (!receiverMembership) {
    throw new Error("The receiver is not a member of this group");
  }

  const normalizedAmount = normalizeMoney(amount, payerMembership.jemaw.currency);

  const newSettlement = await db.transaction(async (tx) => {
    const [createdSettlement] = await tx
      .insert(settlements)
      .values({
        jemawId,
        payerId: userId,
        receiverId,
        amount: normalizedAmount,
        description: description || null,
        paymentProofUrl,
        status: "pending",
      })
      .returning();

    await tx.insert(activityLogs).values({
      jemawId,
      userId,
      action: "settlement.created",
      targetType: "settlement",
      targetId: createdSettlement.id,
      metadata: JSON.stringify({
        amount: normalizedAmount,
        receiverName: receiverMembership.user.name,
      }),
    });

    return createdSettlement;
  });

  // Get jemaw and user info for notification
  const jemaw = await db.query.jemaws.findFirst({
    where: eq(jemaws.id, jemawId),
  });

  const payer = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const receiver = await db.query.users.findFirst({
    where: eq(users.id, receiverId),
  });

  // Send notification to receiver
  if (receiver && payer) {
    notifyReceiverForSettlementApproval({
      settlementId: newSettlement.id,
      jemawId,
      jemawName: jemaw?.name || "Unknown Group",
      description: description || `Payment from ${payer.name}`,
      amount: formatCurrency(normalizedAmount, jemaw?.currency || "USD"),
      payerName: payer.name,
      receiver: {
        email: receiver.email,
        name: receiver.name,
      },
    }).catch(console.error);
  }

  revalidatePath(`/jemaws/${jemawId}`);

  if (receiver && payer) {
    createNotification({
      userId: receiverId,
      message: `${payer.name} recorded a payment of ${formatCurrency(normalizedAmount, jemaw?.currency || "USD")} for you`,
      link: `/jemaws/${jemawId}`,
    }).catch(console.error);
  }

  return {
    success: true,
    settlement: newSettlement,
    message: "Settlement created successfully. Awaiting receiver's approval.",
  };
}

export async function approveSettlement(
  input: z.infer<typeof approveSettlementSchema>
) {
  const session = await requireAuth();
  const userId = session.user.id;

  const validatedData = approveSettlementSchema.parse(input);
  const { settlementId } = validatedData;

  // Get the settlement
  const settlement = await db.query.settlements.findFirst({
    where: eq(settlements.id, settlementId),
    with: {
      jemaw: true,
    },
  });

  if (!settlement) {
    throw new Error("Settlement not found");
  }

  // IMMUTABILITY CHECK: Prevent modification of approved settlements
  if (settlement.status === "approved") {
    throw new Error(
      "This settlement has already been approved and cannot be modified"
    );
  }

  if (settlement.status === "rejected") {
    throw new Error("This settlement has been rejected and cannot be approved");
  }

  // APPROVAL RULE: Only the receiver can approve the settlement
  if (settlement.receiverId !== userId) {
    throw new Error("Only the payment receiver can approve this settlement");
  }

  // Approve the settlement and update balances in a transaction
  await db.transaction(async (tx) => {
    // Update settlement status to approved
    const [approvedSettlement] = await tx
      .update(settlements)
      .set({
        status: "approved",
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(settlements.id, settlementId),
          eq(settlements.status, "pending")
        )
      )
      .returning({ id: settlements.id });

    if (!approvedSettlement) {
      throw new Error("This settlement has already been processed");
    }

    const entries: Array<typeof ledgerEntries.$inferInsert> = [
      {
        jemawId: settlement.jemawId,
        userId: settlement.payerId,
        currency: settlement.jemaw.currency,
        amount: settlement.amount,
        sourceType: "settlement",
        sourceId: settlement.id,
        description: settlement.description,
      },
      {
        jemawId: settlement.jemawId,
        userId: settlement.receiverId,
        currency: settlement.jemaw.currency,
        amount: `-${settlement.amount}`,
        sourceType: "settlement",
        sourceId: settlement.id,
        description: settlement.description,
      },
    ];

    assertBalancedMoney(
      entries.map((entry) => entry.amount),
      settlement.jemaw.currency
    );
    await tx.insert(ledgerEntries).values(entries);

    for (const entry of entries) {
      const [updatedMember] = await tx
        .update(jemawMembers)
        .set({
          balance: sql`${jemawMembers.balance} + ${entry.amount}`,
        })
        .where(
          and(
            eq(jemawMembers.jemawId, settlement.jemawId),
            eq(jemawMembers.userId, entry.userId)
          )
        )
        .returning({ id: jemawMembers.id });

      if (!updatedMember) {
        throw new Error("A settlement participant is no longer in this group");
      }
    }

    await tx.insert(activityLogs).values({
      jemawId: settlement.jemawId,
      userId,
      action: "settlement.approved",
      targetType: "settlement",
      targetId: settlementId,
      metadata: JSON.stringify({ amount: settlement.amount }),
    });
  });

  revalidatePath(`/jemaws/${settlement.jemawId}`);

  createNotification({
    userId: settlement.payerId,
    message: `Your payment of ${formatCurrency(settlement.amount, settlement.jemaw.currency)} was confirmed`,
    link: `/jemaws/${settlement.jemawId}`,
  }).catch(console.error);

  return {
    success: true,
    message: "Settlement approved successfully. Balances have been updated.",
  };
}

export async function rejectSettlement(input: {
  settlementId: string;
  reason: string;
}) {
  const session = await requireAuth();
  const userId = session.user.id;

  const { settlementId, reason } = z.object({
    settlementId: z.string().uuid(),
    reason: z.string().min(1, "Please provide a reason for rejection"),
  }).parse(input);

  const settlement = await db.query.settlements.findFirst({
    where: eq(settlements.id, settlementId),
    with: { jemaw: true },
  });

  if (!settlement) {
    throw new Error("Settlement not found");
  }

  if (settlement.status === "approved") {
    throw new Error("This settlement has already been approved and cannot be rejected");
  }

  if (settlement.status === "rejected") {
    throw new Error("This settlement has already been rejected");
  }

  if (settlement.receiverId !== userId) {
    throw new Error("Only the payment receiver can reject this settlement");
  }

  await db.transaction(async (tx) => {
    const [rejectedSettlement] = await tx
      .update(settlements)
      .set({
        status: "rejected",
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(settlements.id, settlementId),
          eq(settlements.status, "pending")
        )
      )
      .returning({ id: settlements.id });

    if (!rejectedSettlement) {
      throw new Error("This settlement has already been processed");
    }

    await tx.insert(activityLogs).values({
      jemawId: settlement.jemawId,
      userId,
      action: "settlement.rejected",
      targetType: "settlement",
      targetId: settlementId,
      metadata: JSON.stringify({ amount: settlement.amount, reason }),
    });
  });

  revalidatePath(`/jemaws/${settlement.jemawId}`);
  revalidatePath("/pending");

  createNotification({
    userId: settlement.payerId,
    message: `Your payment of ${formatCurrency(settlement.amount, settlement.jemaw.currency)} was rejected: ${reason}`,
    link: `/jemaws/${settlement.jemawId}`,
  }).catch(console.error);

  return {
    success: true,
    message: "Settlement rejected.",
  };
}

export async function getSettlementsByJemaw(jemawId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  // Verify membership
  const membership = await db.query.jemawMembers.findFirst({
    where: and(
      eq(jemawMembers.jemawId, jemawId),
      eq(jemawMembers.userId, userId)
    ),
  });

  if (!membership) {
    throw new Error("You are not a member of this group");
  }

  const jemawSettlements = await db.query.settlements.findMany({
    where: eq(settlements.jemawId, jemawId),
    with: {
      payer: true,
      receiver: true,
    },
    orderBy: (settlements, { desc }) => [desc(settlements.createdAt)],
  });

  return jemawSettlements;
}

export async function getPendingSettlementsForUser() {
  const session = await requireAuth();
  const userId = session.user.id;

  // Get settlements where user is the receiver and status is pending
  const pendingSettlements = await db.query.settlements.findMany({
    where: and(
      eq(settlements.receiverId, userId),
      eq(settlements.status, "pending")
    ),
    with: {
      payer: true,
      jemaw: true,
    },
    orderBy: (settlements, { desc }) => [desc(settlements.createdAt)],
  });

  return pendingSettlements;
}
