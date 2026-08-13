"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { acceptInvitation } from "@/actions/jemaws";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

export function AcceptInvitationClient({
  token,
  jemawName,
}: {
  token: string;
  jemawName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      try {
        const result = await acceptInvitation({ token });
        toast.success(result.message);
        router.push(`/jemaws/${result.jemawId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to accept invitation");
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-5 sm:p-8">
      <Brand href="/dashboard" />
      <main className="my-auto flex justify-center py-10">
        <div className="w-full max-w-md border bg-card p-8 text-center sm:p-10">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Join {jemawName}</h1>
        <p className="mb-7 mt-3 text-sm leading-6 text-muted-foreground">
          See the shared record, add your expenses, and always know where you stand.
        </p>
        <Button size="lg" onClick={handleAccept} disabled={isPending} className="w-full">
          {isPending ? "Joining…" : `Join ${jemawName}`}
        </Button>
        </div>
      </main>
      <p className="text-center text-xs text-muted-foreground">Expenses, approvals, and payments in one shared record.</p>
    </div>
  );
}
