import Link from "next/link";
import { getServerSession } from "@/lib/session";
import { getInvitationByToken } from "@/actions/jemaws";
import { AcceptInvitationClient } from "./accept-invitation-client";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { getGroupEmoji } from "@/lib/presentation";

function InvitationFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grid flex min-h-screen flex-col bg-[#f5f1e8] p-5 sm:p-8">
      <Brand href="/sign-in" />
      <main className="my-auto flex justify-center py-10">
        <div className="w-full max-w-lg rounded-[30px] border border-[#ded8cb] bg-[#fffdf7] p-7 text-center shadow-[0_24px_70px_rgba(54,52,43,0.1)] sm:p-10">{children}</div>
      </main>
      <p className="text-center text-[10px] font-semibold text-muted-foreground">Shared money, without the awkwardness.</p>
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
          <span className="text-4xl">🫥</span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">This invitation wandered off</h1>
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
          <span className="text-4xl">⌛</span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">This invite has expired</h1>
          <p className="mb-6 mt-2 text-sm leading-relaxed text-muted-foreground">
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
          <span className="text-4xl">✓</span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">You&apos;re already in</h1>
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
          <span className="grid size-16 place-items-center rounded-[22px] bg-[#e7e0d4] text-3xl mx-auto">{getGroupEmoji(invitation.jemawName)}</span>
          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">You&apos;re invited</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">Join {invitation.jemawName}</h1>
          <p className="mb-7 mt-3 text-sm leading-relaxed text-muted-foreground">
            You&apos;ve been invited to join <strong>{invitation.jemawName}</strong>.
            Sign in or create an account, then step into the group journal.
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
