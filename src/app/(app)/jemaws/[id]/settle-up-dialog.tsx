"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { getSuggestedSettlements } from "@/actions/jemaws";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { initials } from "@/lib/presentation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

type Suggestion = {
  payerId: string;
  payerName: string;
  receiverId: string;
  receiverName: string;
  amount: string;
};

export function SettleUpDialog({
  children,
  jemawId,
  currency,
}: {
  children: React.ReactNode;
  jemawId: string;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && suggestions === null) {
      startTransition(async () => {
        try {
          const results = await getSuggestedSettlements(jemawId);
          setSuggestions(results);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to load suggestions");
          setOpen(false);
        }
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">The shortest way to even</p>
          <DialogTitle className="text-2xl">Settle up without the puzzle</DialogTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">Jemaw has worked out the fewest payments needed to bring everyone back to zero.</p>
        </DialogHeader>

        {isPending ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions === null ? null : suggestions.length === 0 ? (
          <div className="py-9 text-center text-muted-foreground">
            <span className="text-4xl">✨</span>
            <p className="mt-4 font-extrabold text-foreground">Everyone is even</p>
            <p className="mt-1 text-sm">No payments are needed right now.</p>
          </div>
        ) : (
          <div className="mt-2 border-y border-[#ded8cb]">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 border-b border-[#e2dbcf] py-4 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <Avatar className="size-8"><AvatarFallback className="bg-[#f0dfd8] text-[9px] font-extrabold text-[#8c473c]">{initials(s.payerName)}</AvatarFallback></Avatar>
                  <span className="truncate font-extrabold">{s.payerName}</span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  <Avatar className="size-8"><AvatarFallback className="bg-[#d9e5de] text-[9px] font-extrabold text-[#315747]">{initials(s.receiverName)}</AvatarFallback></Avatar>
                  <span className="hidden truncate font-extrabold sm:inline">{s.receiverName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-money text-base font-semibold">
                    {formatCurrency(s.amount, currency)}
                  </span>
                  <Link
                    href={`/jemaws/${jemawId}/settlements/new?receiverId=${s.receiverId}&amount=${s.amount}`}
                    onClick={() => setOpen(false)}
                  >
                    <Button size="sm">Pay</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
