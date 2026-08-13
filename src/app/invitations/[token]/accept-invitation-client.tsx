"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { acceptInvitation } from "@/actions/jemaws";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { getGroupEmoji } from "@/lib/presentation";

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
    <div className="paper-grid flex min-h-screen flex-col bg-[#f5f1e8] p-5 sm:p-8">
      <Brand href="/dashboard" />
      <main className="my-auto flex justify-center py-10">
        <div className="w-full max-w-lg rounded-[30px] border border-[#ded8cb] bg-[#fffdf7] p-7 text-center shadow-[0_24px_70px_rgba(54,52,43,0.1)] sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-[22px] bg-[#e7e0d4] text-3xl">{getGroupEmoji(jemawName)}</span>
        <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Your seat is ready</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">Join {jemawName}</h1>
        <p className="mb-7 mt-3 text-sm leading-relaxed text-muted-foreground">
          See the shared journal, add your expenses, and always know where you stand.
        </p>
        <Button size="lg" onClick={handleAccept} disabled={isPending} className="w-full">
          {isPending ? "Joining…" : `Join ${jemawName}`}
        </Button>
        </div>
      </main>
      <p className="text-center text-[10px] font-semibold text-muted-foreground">Shared money, without the awkwardness.</p>
      </div>
  );
}
