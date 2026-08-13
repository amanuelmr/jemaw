import Link from "next/link";
import { getServerSession } from "@/lib/session";
import { getInvitationByToken } from "@/actions/jemaws";
import { AcceptInvitationClient } from "./accept-invitation-client";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

function InvitationFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background p-5 sm:p-8">
      <Brand href="/sign-in" />
      <main className="my-auto flex justify-center py-10">
        <div className="w-full max-w-md border bg-card p-8 text-center sm:p-10">{children}</div>
      </main>
      <p className="text-center text-xs text-muted-foreground">Expenses, approvals, and payments in one shared record.</p>
    </div>
  );
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <InvitationFrame>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Invitation not found</h1>
          <p className="mb-6 mt-2 text-sm text-muted-foreground">
            This invitation link is not valid.
          </p>
          <Button asChild variant="secondary"><Link href="/sign-in">Go to sign in</Link></Button>
      </InvitationFrame>
    );
  }

  if (invitation.isExpired) {
    return (
      <InvitationFrame>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">This invite has expired</h1>
          <p className="mb-6 mt-2 text-sm leading-6 text-muted-foreground">
            This invitation to <strong>{invitation.jemawName}</strong> has expired.
            Ask the group admin to send a new one.
          </p>
          <Button asChild variant="secondary"><Link href="/dashboard">Go home</Link></Button>
      </InvitationFrame>
    );
  }

  if (invitation.isUsed) {
    return (
      <InvitationFrame>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Invitation already accepted</h1>
          <p className="mb-6 mt-2 text-sm text-muted-foreground">
            This invitation has already been accepted.
          </p>
          <Button asChild><Link href="/dashboard">Open your groups</Link></Button>
      </InvitationFrame>
    );
  }

  const session = await getServerSession();

  if (!session) {
    return (
      <InvitationFrame>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Join {invitation.jemawName}</h1>
          <p className="mb-7 mt-3 text-sm leading-6 text-muted-foreground">
            You&apos;ve been invited to join <strong>{invitation.jemawName}</strong>.
            Sign in or create an account to get started.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild variant="secondary"><Link href={`/sign-in?redirect=/invitations/${token}`}>Sign in</Link></Button>
            <Button asChild><Link href={`/sign-up?redirect=/invitations/${token}`}>Create account</Link></Button>
          </div>
      </InvitationFrame>
    );
  }

  return (
    <AcceptInvitationClient token={token} jemawName={invitation.jemawName} />
  );
}
