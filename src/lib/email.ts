import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { PendingApprovalEmail } from "@/emails/pending-approval";
import { JemawInvitationEmail } from "@/emails/jemaw-invitation";
import { VerificationEmail } from "@/emails/verification-email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const EMAIL_FROM = process.env.EMAIL_FROM || "Jemaw <noreply@jemaw.app>";

function createTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export interface SendPendingApprovalEmailParams {
  to: string;
  recipientName: string;
  type: "bill" | "settlement";
  description: string;
  amount: string;
  requesterName: string;
  jemawName: string;
  jemawId: string;
  itemId: string;
}

export async function sendPendingApprovalEmail({
  to,
  recipientName,
  type,
  description,
  amount,
  requesterName,
  jemawName,
  jemawId,
  itemId,
}: SendPendingApprovalEmailParams) {
  const actionUrl =
    `${APP_URL}/pending?type=${type}` +
    `&item=${encodeURIComponent(itemId)}` +
    `&group=${encodeURIComponent(jemawId)}`;

  try {
    const html = await render(
      PendingApprovalEmail({
        recipientName,
        type,
        description,
        amount,
        requesterName,
        jemawName,
        actionUrl,
      })
    );

    const transporter = createTransport();
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject:
        type === "bill"
          ? `New bill requires your approval in ${jemawName}`
          : `Settlement request in ${jemawName}`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send pending approval email:", error);
    return { success: false, error };
  }
}

export interface SendJemawInvitationEmailParams {
  to: string;
  inviterName: string;
  jemawName: string;
  token: string;
}

export async function sendJemawInvitationEmail({
  to,
  inviterName,
  jemawName,
  token,
}: SendJemawInvitationEmailParams) {
  // Fixed: was incorrectly using /invite/ — actual route is /invitations/
  const inviteUrl = `${APP_URL}/invitations/${token}`;

  try {
    const html = await render(
      JemawInvitationEmail({
        inviterName,
        jemawName,
        inviteUrl,
      })
    );

    const transporter = createTransport();
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject: `${inviterName} invited you to join ${jemawName} on Jemaw`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    return { success: false, error };
  }
}

export async function notifyUsersForBillApproval({
  billId,
  jemawId,
  jemawName,
  description,
  amount,
  paidByName,
  eligibleApprovers,
}: {
  billId: string;
  jemawId: string;
  jemawName: string;
  description: string;
  amount: string;
  paidByName: string;
  eligibleApprovers: Array<{ email: string; name: string }>;
}) {
  const results = await Promise.allSettled(
    eligibleApprovers.map((approver) =>
      sendPendingApprovalEmail({
        to: approver.email,
        recipientName: approver.name,
        type: "bill",
        description,
        amount,
        requesterName: paidByName,
        jemawName,
        jemawId,
        itemId: billId,
      })
    )
  );

  const successful = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;
  const failed = results.length - successful;

  return { successful, failed, total: results.length };
}

export async function sendVerificationEmail({
  name,
  email,
  url,
}: {
  name: string;
  email: string;
  url: string;
}) {
  try {
    const html = await render(VerificationEmail({ name, url }));
    const transporter = createTransport();
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: "Verify your Jemaw account",
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return {
      success: false,
      error: "Failed to send verification email",
    };
  }
}

export async function notifyReceiverForSettlementApproval({
  settlementId,
  jemawId,
  jemawName,
  description,
  amount,
  payerName,
  receiver,
}: {
  settlementId: string;
  jemawId: string;
  jemawName: string;
  description: string;
  amount: string;
  payerName: string;
  receiver: { email: string; name: string };
}) {
  return sendPendingApprovalEmail({
    to: receiver.email,
    recipientName: receiver.name,
    type: "settlement",
    description,
    amount,
    requesterName: payerName,
    jemawName,
    jemawId,
    itemId: settlementId,
  });
}
