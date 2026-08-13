"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { approveBill, rejectBill } from "@/actions/bills";
import { approveSettlement, rejectSettlement } from "@/actions/settlements";
import { MoneyAmount } from "@/components/money-amount";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/presentation";

type PendingBill = {
  id: string;
  description: string;
  amount: string;
  category: string;
  receiptUrl: string | null;
  createdAt: Date;
  paidBy: { name: string };
  jemaw: { name: string; currency: string };
  splits: { userId: string; amount: string; user: { name: string } }[];
};

type PendingSettlement = {
  id: string;
  amount: string;
  description: string | null;
  paymentProofUrl: string | null;
  createdAt: Date;
  payer: { name: string };
  jemaw: { name: string; currency: string };
};

export function PendingItems({ pendingBills, pendingSettlements, currentUserId }: { pendingBills: PendingBill[]; pendingSettlements: PendingSettlement[]; currentUserId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: "bill" | "settlement"; label: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const totalCount = pendingBills.length + pendingSettlements.length;

  function approveExpense(billId: string) {
    startTransition(async () => { try { const result = await approveBill({ billId }); toast.success(result.message); router.refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not approve the expense"); } });
  }

  function confirmPayment(settlementId: string) {
    startTransition(async () => { try { const result = await approveSettlement({ settlementId }); toast.success(result.message); router.refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not confirm the payment"); } });
  }

  function confirmDispute() {
    if (!rejectTarget) return;
    if (rejectTarget.type === "settlement" && !rejectReason.trim()) return;
    startTransition(async () => {
      try {
        const result = rejectTarget.type === "bill" ? await rejectBill({ billId: rejectTarget.id }) : await rejectSettlement({ settlementId: rejectTarget.id, reason: rejectReason.trim() });
        toast.success(result.message);
        setRejectTarget(null);
        setRejectReason("");
        router.refresh();
      } catch (error) { toast.error(error instanceof Error ? error.message : "Could not dispute this request"); }
    });
  }

  if (totalCount === 0) return <div className="border-y py-14"><Check className="size-5 text-[#237a4b]" /><h2 className="mt-4 text-base font-semibold">Nothing needs review</h2><p className="mt-2 text-sm text-muted-foreground">New expenses and payments will appear here when they need you.</p></div>;

  return (
    <>
      <div className="mx-auto max-w-3xl">
        {pendingBills.length > 0 && (
          <section>
            <div className="flex items-center justify-between border-b border-foreground pb-3"><h2 className="text-sm font-semibold">Expenses</h2><span className="font-mono text-[10px] text-muted-foreground">{pendingBills.length}</span></div>
            {pendingBills.map((bill) => {
              const mySplit = bill.splits.find((split) => split.userId === currentUserId);
              return (
                <article key={bill.id} className="border-b py-6">
                  <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3 sm:gap-4">
                    <Avatar className="size-8"><AvatarFallback className="bg-muted text-[9px] font-semibold">{initials(bill.paidBy.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0"><p className="text-sm"><span className="font-semibold">{bill.paidBy.name}</span> added <span className="font-semibold">{bill.description}</span></p><p className="mt-1 text-xs text-muted-foreground">{bill.jemaw.name} · split between {bill.splits.length}</p><p className="mt-3 text-xs">Your share <MoneyAmount amount={mySplit?.amount ?? 0} currency={bill.jemaw.currency} className="font-semibold" /></p>{bill.receiptUrl && <a href={bill.receiptUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-4"><ReceiptText className="size-3.5" />View receipt</a>}</div>
                    <div className="text-right"><MoneyAmount amount={bill.amount} currency={bill.jemaw.currency} className="text-sm font-semibold" /><p className="mt-1 font-mono text-[9px] text-muted-foreground">{new Date(bill.createdAt).toLocaleDateString()}</p></div>
                  </div>
                  <div className="ml-11 mt-4 flex gap-2 sm:ml-12"><Button size="sm" onClick={() => approveExpense(bill.id)} disabled={isPending}><Check className="size-3.5" />Approve</Button><Button size="sm" variant="outline" onClick={() => setRejectTarget({ id: bill.id, type: "bill", label: bill.description })} disabled={isPending}>Dispute</Button></div>
                </article>
              );
            })}
          </section>
        )}

        {pendingSettlements.length > 0 && (
          <section className={pendingBills.length > 0 ? "mt-12" : ""}>
            <div className="flex items-center justify-between border-b border-foreground pb-3"><h2 className="text-sm font-semibold">Payments</h2><span className="font-mono text-[10px] text-muted-foreground">{pendingSettlements.length}</span></div>
            {pendingSettlements.map((payment) => (
              <article key={payment.id} className="border-b py-6">
                <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3 sm:gap-4">
                  <Avatar className="size-8"><AvatarFallback className="bg-muted text-[9px] font-semibold">{initials(payment.payer.name)}</AvatarFallback></Avatar>
                  <div className="min-w-0">
                    <p className="text-sm"><span className="font-semibold">{payment.payer.name}</span> says they paid you</p>
                    <p className="mt-1 text-xs text-muted-foreground">{payment.jemaw.name}{payment.description ? ` · ${payment.description}` : ""}</p>
                    {payment.paymentProofUrl && (
                      <a href={payment.paymentProofUrl} target="_blank" rel="noreferrer" className="mt-3 block w-fit border bg-white p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={payment.paymentProofUrl} alt="Payment proof" className="max-h-40 max-w-full object-contain" />
                      </a>
                    )}
                  </div>
                  <div className="text-right"><MoneyAmount amount={payment.amount} currency={payment.jemaw.currency} className="text-sm font-semibold text-[#237a4b]" /><p className="mt-1 font-mono text-[9px] text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()}</p></div>
                </div>
                <div className="ml-11 mt-4 flex gap-2 sm:ml-12"><Button size="sm" onClick={() => confirmPayment(payment.id)} disabled={isPending}><Check className="size-3.5" />Confirm received</Button><Button size="sm" variant="outline" onClick={() => { setRejectTarget({ id: payment.id, type: "settlement", label: `Payment from ${payment.payer.name}` }); setRejectReason(""); }} disabled={isPending}>Dispute</Button></div>
              </article>
            ))}
          </section>
        )}
      </div>

      <Dialog open={Boolean(rejectTarget)} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dispute this {rejectTarget?.type === "bill" ? "expense" : "payment"}</DialogTitle><p className="text-sm text-muted-foreground">{rejectTarget?.label}</p></DialogHeader>
          {rejectTarget?.type === "settlement" ? <div className="space-y-2"><p className="text-sm leading-6 text-muted-foreground">Tell the payer what did not match so they can correct it.</p><Textarea placeholder="Payment not received, amount differs from proof…" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={4} autoFocus /></div> : <p className="text-sm leading-6 text-muted-foreground">This expense will be marked disputed and will not affect balances.</p>}
          <DialogFooter><Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button><Button variant="destructive" onClick={confirmDispute} disabled={isPending || (rejectTarget?.type === "settlement" && !rejectReason.trim())}>{isPending ? "Disputing…" : "Dispute"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
