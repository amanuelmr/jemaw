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

const CATEGORY_COLORS: Record<string, string> = {
  breakfast: "bg-amber-400", lunch: "bg-orange-400", dinner: "bg-rose-400",
  groceries: "bg-emerald-400", transportation: "bg-sky-400", utilities: "bg-violet-400",
  rent: "bg-indigo-400", entertainment: "bg-pink-400", vacation: "bg-cyan-400",
  shopping: "bg-fuchsia-400", healthcare: "bg-red-400", other: "bg-slate-300",
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
      <div className="py-24 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-900 mb-1">All caught up!</p>
        <p className="text-sm text-slate-400">No items pending your approval.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-start gap-6 md:flex-row md:gap-8">
        {/* Left sticky sidebar */}
        <div className="w-full shrink-0 md:sticky md:top-24 md:w-52">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Approvals</p>
          <div className="grid grid-cols-3 gap-1 md:block md:space-y-0.5">
            {filters.map(({ key, label, icon, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                  filter === key
                    ? "bg-slate-100 text-slate-900 font-medium"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                )}
              >
                <span className="flex items-center gap-2.5">
                  {icon}
                  {label}
                </span>
                {count > 0 && (
                  <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 font-medium tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right feed */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Bills section */}
          {showBills && pendingBills.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bills</span>
                <span className="text-xs text-slate-400">{pendingBills.length} pending</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div>
                {pendingBills.map((bill) => (
                  <div key={bill.id} className="flex flex-col border-b border-slate-100 last:border-0">
                    <div className="flex items-center px-2 py-4 hover:bg-slate-50/60 transition-colors rounded-lg">
                      <div className={cn("w-2 h-2 rounded-full mr-4 shrink-0", CATEGORY_COLORS[bill.category] ?? "bg-slate-300")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{bill.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-400 capitalize">{bill.category}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">paid by {bill.paidBy.name}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">{bill.jemaw.name}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">{new Date(bill.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Split between: {bill.splits.map((s) => s.user.name).join(", ")}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(bill.amount, bill.jemaw.currency)}</p>
                        <span className="text-amber-600 text-xs font-medium">Pending</span>
                      </div>
                    </div>
                    <div className="pb-4 px-2 flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50" disabled={isPending} onClick={() => handleBillAction("approve", bill.id)}>
                        <Check className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50" disabled={isPending} onClick={() => handleBillAction("reject", bill.id)}>
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
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settlements</span>
                <span className="text-xs text-slate-400">{pendingSettlements.length} pending</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div>
                {pendingSettlements.map((s) => (
                  <div key={s.id} className="flex flex-col border-b border-slate-100 last:border-0">
                    <div className="flex items-center px-2 py-4 hover:bg-slate-50/60 transition-colors rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-indigo-300 mr-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-medium text-slate-900">{s.payer.name}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                          <span className="font-medium text-slate-900">you</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {s.description && <><span className="text-xs text-slate-400 truncate">{s.description}</span><span className="text-slate-200">·</span></>}
                          <span className="text-xs text-slate-400">{s.jemaw.name}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(s.amount, s.jemaw.currency)}</p>
                        <span className="text-amber-600 text-xs font-medium">Pending</span>
                      </div>
                    </div>
                    <div className="pb-4 px-2 space-y-3">
                      {s.paymentProofUrl && (
                        <a href={s.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.paymentProofUrl} alt="Payment proof" className="rounded-lg border border-slate-200 max-h-36 object-contain bg-slate-50 hover:opacity-90 transition-opacity cursor-zoom-in" />
                        </a>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50" disabled={isPending} onClick={() => handleApproveSettlement(s.id)}>
                          <Check className="w-3 h-3 mr-1" /> Confirm received
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50" disabled={isPending} onClick={() => { setRejectTarget({ id: s.id, type: "settlement" }); setRejectReason(""); }}>
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
