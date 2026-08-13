"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { getSuggestedSettlements } from "@/actions/jemaws";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { initials } from "@/lib/presentation";
import { CreateSettlementForm } from "./settlements/new/create-settlement-form";

type Suggestion = {
  payerId: string;
  payerName: string;
  receiverId: string;
  receiverName: string;
  amount: string;
};

type Member = {
  userId: string;
  user: { id: string; name: string };
};

export function SettleUpDialog({
  children,
  jemawId,
  currency,
  members,
}: {
  children: React.ReactNode;
  jemawId: string;
  currency: string;
  members: Member[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<"suggestions" | "form">("suggestions");
  const [selected, setSelected] = useState<{ receiverId: string; amount: string } | null>(null);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setStep("suggestions");
      setSelected(null);
    }
    if (isOpen && suggestions === null) {
      startTransition(async () => {
        try {
          setSuggestions(await getSuggestedSettlements(jemawId));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to load suggestions");
          setOpen(false);
        }
      });
    }
  }

  function handlePay(suggestion: Suggestion) {
    setSelected({ receiverId: suggestion.receiverId, amount: suggestion.amount });
    setStep("form");
  }

  function returnToSuggestions() {
    setStep("suggestions");
    setSelected(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        {step === "suggestions" ? (
          <>
            <DialogHeader>
              <DialogTitle>Suggested payments</DialogTitle>
              <p className="text-sm leading-6 text-muted-foreground">The fewest payments that can bring every balance back to zero.</p>
            </DialogHeader>

            {isPending ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : suggestions === null ? null : suggestions.length === 0 ? (
              <div className="border-y py-9 text-center text-muted-foreground">
                <p className="font-semibold text-foreground">Everyone is even</p>
                <p className="mt-1 text-sm">No payments are needed right now.</p>
              </div>
            ) : (
              <div className="mt-2 border-y border-foreground">
                {suggestions.map((suggestion) => (
                  <div
                    key={`${suggestion.payerId}-${suggestion.receiverId}-${suggestion.amount}`}
                    className="flex items-center justify-between gap-3 border-b py-4 last:border-0"
                  >
                    <div className="flex min-w-0 items-center gap-2 text-sm">
                      <Avatar className="size-8"><AvatarFallback className="bg-muted text-[9px] font-semibold">{initials(suggestion.payerName)}</AvatarFallback></Avatar>
                      <span className="truncate font-medium">{suggestion.payerName}</span>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                      <Avatar className="size-8"><AvatarFallback className="bg-muted text-[9px] font-semibold">{initials(suggestion.receiverName)}</AvatarFallback></Avatar>
                      <span className="hidden truncate font-medium sm:inline">{suggestion.receiverName}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{formatCurrency(suggestion.amount, currency)}</span>
                      <Button size="sm" onClick={() => handlePay(suggestion)}>Record</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <button type="button" onClick={returnToSuggestions} className="mb-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-3.5" />Suggestions
              </button>
              <DialogTitle>Record a payment</DialogTitle>
            </DialogHeader>
            <CreateSettlementForm
              jemawId={jemawId}
              members={members}
              currency={currency}
              defaultReceiverId={selected?.receiverId}
              defaultAmount={selected?.amount}
              onSuccess={() => {
                setOpen(false);
                setStep("suggestions");
                setSelected(null);
                setSuggestions(null);
                router.refresh();
              }}
              onBack={returnToSuggestions}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
