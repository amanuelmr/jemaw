"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveBill, rejectBill } from "@/actions/bills";
import { approveSettlement, rejectSettlement } from "@/actions/settlements";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, cn } from "@/lib/utils";
import { getCategoryMeta } from "@/lib/presentation";
import { Check, X, Receipt, ArrowLeftRight, ArrowRight, LayoutList } from "lucide-react";

type PendingBill = {
  id: string;
  description: string;
  amount: string;
  category: string;
  createdAt: Date;
  paidBy: { name: string };
  jemaw: { name: string; currency: string };
  splits: { userId: string; user: { name: string } }[];
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

type Filter = "all" | "bills" | "settlements";

export function PendingItems({
  pendingBills,
  pendingSettlements,
}: {
  pendingBills: PendingBill[];
  pendingSettlements: PendingSettlement[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: "bill" | "settlement" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  function handleBillAction(action: "approve" | "reject", billId: string) {
    if (action === "reject") {
      setRejectTarget({ id: billId, type: "bill" });
      setRejectReason("");
      return;
    }
    startTransition(async () => {
      try {
        const result = await approveBill({ billId });
        toast.success(result.message);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  function handleApproveSettlement(settlementId: string) {
    startTransition(async () => {
      try {
        const result = await approveSettlement({ settlementId });
        toast.success(result.message);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  function handleConfirmReject() {
    if (!rejectTarget) return;
    if (rejectTarget.type === "settlement" && !rejectReason.trim()) return;
    startTransition(async () => {
      try {
        if (rejectTarget.type === "bill") {
          const result = await rejectBill({ billId: rejectTarget.id });
          toast.success(result.message);
        } else {
          const result = await rejectSettlement({ settlementId: rejectTarget.id, reason: rejectReason.trim() });
          toast.success(result.message);
        }
        setRejectTarget(null);
        setRejectReason("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  const totalCount = pendingBills.length + pendingSettlements.length;
  const showBills = filter === "all" || filter === "bills";
  const showSettlements = filter === "all" || filter === "settlements";

  const filters: { key: Filter; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "all", label: "All", icon: <LayoutList className="w-4 h-4" />, count: totalCount },
    { key: "bills", label: "Bills", icon: <Receipt className="w-4 h-4" />, count: pendingBills.length },
    { key: "settlements", label: "Settlements", icon: <ArrowLeftRight className="w-4 h-4" />, count: pendingSettlements.length },
  ];

  if (totalCount === 0) {
    return (
      <div className="border-y border-[#dcd5c8] py-20 text-center">
        <span className="text-4xl">✨</span>
        <p className="mt-4 text-lg font-extrabold text-[#20231d]">All caught up</p>
        <p className="mt-1 text-sm text-muted-foreground">There is nothing waiting on you.</p>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="mb-9 flex items-center justify-between gap-4 border-b border-[#dcd5c8] pb-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8d8f87]">Show me</p>
          <div className="inline-flex rounded-full bg-[#e7e0d4] p-1">
            {filters.map(({ key, label, icon, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold transition-colors",
                  filter === key
                    ? "bg-[#fffdf7] text-[#20231d] shadow-sm"
                    : "text-[#74776f] hover:text-[#20231d]"
                )}
              >
                <span className="flex items-center gap-1.5 [&_svg]:size-3.5">
                  {icon}
                  {label}
                </span>
                {count > 0 && (
                  <span className="text-[9px] text-[#8c8e87] tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-12">
          {/* Bills section */}
          {showBills && pendingBills.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#797c74]">Expenses to check</span>
                <span className="text-[10px] font-semibold text-[#9a9b94]">{pendingBills.length}</span>
                <div className="h-px flex-1 bg-[#dcd5c8]" />
              </div>
              <div>
                {pendingBills.map((bill) => (
                  <div key={bill.id} className="flex flex-col border-b border-[#ded8cb] last:border-0">
                    <div className="flex items-center py-5">
                      <div className={cn("mr-4 grid size-11 shrink-0 place-items-center rounded-[16px] text-xl", getCategoryMeta(bill.category).tint)}>{getCategoryMeta(bill.category).emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[15px] font-extrabold text-[#20231d]">{bill.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs font-semibold text-[#777a72]">{bill.paidBy.name} paid</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-[#8d8f87]">{bill.jemaw.name}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-[#8d8f87]">{new Date(bill.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-[#96978f]">
                          Split between: {bill.splits.map((s) => s.user.name).join(", ")}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-money text-xl font-semibold text-[#20231d]">{formatCurrency(bill.amount, bill.jemaw.currency)}</p>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9a731d]">Waiting</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pb-5 pl-[60px]">
                      <Button size="sm" disabled={isPending} onClick={() => handleBillAction("approve", bill.id)}>
                        <Check className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" disabled={isPending} onClick={() => handleBillAction("reject", bill.id)}>
                        <X className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state for filtered view */}
          {showBills && pendingBills.length === 0 && filter === "bills" && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">No bills pending your approval.</p>
            </div>
          )}

          {/* Settlements section */}
          {showSettlements && pendingSettlements.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#797c74]">Payments to confirm</span>
                <span className="text-[10px] font-semibold text-[#9a9b94]">{pendingSettlements.length}</span>
                <div className="h-px flex-1 bg-[#dcd5c8]" />
              </div>
              <div>
                {pendingSettlements.map((s) => (
                  <div key={s.id} className="flex flex-col border-b border-[#ded8cb] last:border-0">
                    <div className="flex items-center py-5">
                      <div className="mr-4 grid size-11 shrink-0 place-items-center rounded-[16px] bg-[#dfeae5] text-xl">💸</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-extrabold text-[#20231d]">{s.payer.name}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                          <span className="font-extrabold text-[#20231d]">you</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {s.description && <><span className="text-xs text-slate-400 truncate">{s.description}</span><span className="text-slate-200">·</span></>}
                          <span className="text-xs text-slate-400">{s.jemaw.name}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-money text-xl font-semibold text-[#19734f]">{formatCurrency(s.amount, s.jemaw.currency)}</p>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9a731d]">Waiting</span>
                      </div>
                    </div>
                    <div className="space-y-3 pb-5 pl-[60px]">
                      {s.paymentProofUrl && (
                        <a href={s.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.paymentProofUrl} alt="Payment proof" className="rounded-lg border border-slate-200 max-h-36 object-contain bg-slate-50 hover:opacity-90 transition-opacity cursor-zoom-in" />
                        </a>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" disabled={isPending} onClick={() => handleApproveSettlement(s.id)}>
                          <Check className="w-3 h-3 mr-1" /> Confirm received
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" disabled={isPending} onClick={() => { setRejectTarget({ id: s.id, type: "settlement" }); setRejectReason(""); }}>
                          <X className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state for filtered view */}
          {showSettlements && pendingSettlements.length === 0 && filter === "settlements" && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">No settlements pending your approval.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{rejectTarget?.type === "bill" ? "Reject bill" : "Reject settlement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {rejectTarget?.type === "settlement" && (
              <>
                <p className="text-sm text-slate-500">The payer will see your reason. Be specific so they know what to fix.</p>
                <Textarea
                  placeholder="e.g. Screenshot doesn't match amount, payment wasn't received..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  autoFocus
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={isPending || (rejectTarget?.type === "settlement" && !rejectReason.trim())}
            >
              {isPending ? "Rejecting…" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
