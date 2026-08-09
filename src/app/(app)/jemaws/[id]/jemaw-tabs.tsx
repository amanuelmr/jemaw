"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveBill, rejectBill } from "@/actions/bills";
import { approveSettlement, rejectSettlement } from "@/actions/settlements";
import { removeMember, leaveJemaw } from "@/actions/jemaws";
import { getJemawActivity } from "@/actions/activity";
import { getMyJemawLedger } from "@/actions/ledger";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, cn } from "@/lib/utils";
import { Check, X, ArrowRight, AlertCircle, Search, Clock, UserMinus, LogOut, Receipt, ArrowLeftRight, BookOpen, Info } from "lucide-react";

type Member = {
  userId: string;
  balance: string;
  isAdmin: boolean;
  user: { id: string; name: string; email: string };
};

type BillSplit = {
  userId: string;
  amount: string;
  user: { id: string; name: string };
};

type Bill = {
  id: string;
  description: string;
  amount: string;
  category: string;
  status: string;
  createdAt: Date;
  receiptUrl: string | null;
  paidBy: { id: string; name: string };
  splits: BillSplit[];
};

type Settlement = {
  id: string;
  amount: string;
  description: string | null;
  paymentProofUrl: string | null;
  rejectionReason: string | null;
  status: string;
  createdAt: Date;
  payer: { id: string; name: string };
  receiver: { id: string; name: string };
};

type JemawData = {
  id: string;
  currency: string;
  isAdmin: boolean;
  members: Member[];
  bills: Bill[];
  settlements: Settlement[];
};

type ActivityLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: string | null;
  createdAt: Date;
  user: { id: string; name: string };
};

type LedgerEntry = {
  id: string;
  amount: string;
  sourceType: "bill" | "settlement" | "reversal" | "adjustment";
  sourceId: string;
  description: string | null;
  balanceAfter: string;
  createdAt: Date;
};

type LedgerData = {
  currentBalance: string;
  currency: string;
  entries: LedgerEntry[];
  hasOlderEntries: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  breakfast: "bg-amber-400",
  lunch: "bg-orange-400",
  dinner: "bg-rose-400",
  groceries: "bg-emerald-400",
  transportation: "bg-sky-400",
  utilities: "bg-violet-400",
  rent: "bg-indigo-400",
  entertainment: "bg-pink-400",
  vacation: "bg-cyan-400",
  shopping: "bg-fuchsia-400",
  healthcare: "bg-red-400",
  other: "bg-slate-300",
};

function statusText(status: string) {
  if (status === "approved") return <span className="text-emerald-600 text-xs font-medium">Approved</span>;
  if (status === "rejected") return <span className="text-rose-600 text-xs font-medium">Rejected</span>;
  return <span className="text-amber-600 text-xs font-medium">Pending</span>;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function actionLabel(action: string, metadata: string | null): string {
  const meta = metadata ? JSON.parse(metadata) : {};
  switch (action) {
    case "bill.created": return `added a bill: "${meta.description ?? ""}" — ${meta.amount ?? ""}`;
    case "bill.approved": return `approved bill: "${meta.description ?? ""}"`;
    case "bill.rejected": return `rejected bill: "${meta.description ?? ""}"`;
    case "settlement.created": return `recorded a payment of ${meta.amount ?? ""} to ${meta.receiverName ?? ""}`;
    case "settlement.approved": return `confirmed payment of ${meta.amount ?? ""}`;
    case "settlement.rejected": return `rejected payment of ${meta.amount ?? ""}`;
    default: return action;
  }
}

function MembersTab({
  members,
  currency,
  currentUserId,
  isAdmin,
  jemawId,
}: {
  members: Member[];
  currency: string;
  currentUserId: string;
  isAdmin: boolean;
  jemawId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmLeave, setConfirmLeave] = useState(false);

  function handleRemove(userId: string) {
    startTransition(async () => {
      try {
        const result = await removeMember({ jemawId, userId });
        toast.success(result.message);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove member");
      }
    });
  }

  function handleLeave() {
    if (!confirmLeave) { setConfirmLeave(true); return; }
    startTransition(async () => {
      try {
        const result = await leaveJemaw({ jemawId });
        toast.success(result.message);
        router.push("/dashboard");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to leave group");
        setConfirmLeave(false);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {members.map((m) => {
        const bal = parseFloat(m.balance);
        const isMe = m.userId === currentUserId;
        return (
          <div key={m.userId} className="flex items-center px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
            <Avatar className="w-8 h-8 mr-3 shrink-0">
              <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700 font-semibold">{initials(m.user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-900 truncate">{m.user.name}</span>
                {m.isAdmin && <span className="text-[10px] text-indigo-600 font-medium">Admin</span>}
                {isMe && <span className="text-[10px] text-slate-400">(you)</span>}
              </div>
              <p className="text-xs text-slate-400 truncate">{m.user.email}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold">
                {bal === 0 ? (
                  <span className="text-slate-400 font-normal text-xs">Settled</span>
                ) : bal > 0 ? (
                  <span className="text-emerald-600">+{formatCurrency(bal, currency)}</span>
                ) : (
                  <span className="text-rose-500">−{formatCurrency(Math.abs(bal), currency)}</span>
                )}
              </span>
              {isAdmin && !isMe && (
                <button
                  className="text-slate-300 hover:text-rose-500 transition-colors"
                  disabled={isPending}
                  onClick={() => handleRemove(m.userId)}
                  title="Remove member"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {!isAdmin && (
        <div className="px-5 py-3 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-7 text-xs"
            disabled={isPending}
            onClick={handleLeave}
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            {confirmLeave ? "Click again to confirm leaving" : "Leave group"}
          </Button>
          {confirmLeave && (
            <Button variant="ghost" size="sm" className="ml-1 h-7 text-xs" onClick={() => setConfirmLeave(false)}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

const BILL_CATEGORIES = [
  "all", "breakfast", "lunch", "dinner", "groceries", "transportation",
  "utilities", "rent", "entertainment", "vacation", "shopping", "healthcare", "other",
];

function BillsTab({
  bills,
  currentUserId,
  currency,
}: {
  bills: Bill[];
  currentUserId: string;
  currency: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  function handleBill(action: "approve" | "reject", billId: string) {
    startTransition(async () => {
      try {
        const fn = action === "approve" ? approveBill : rejectBill;
        const result = await fn({ billId });
        toast.success(result.message);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  const filtered = useMemo(() => {
    return bills.filter((b) => {
      if (catFilter !== "all" && b.category !== catFilter) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (search && !b.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [bills, catFilter, statusFilter, search]);

  const hasFilters = catFilter !== "all" || statusFilter !== "all" || search;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input placeholder="Search bills…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-8 text-sm w-[130px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {BILL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c === "all" ? "All categories" : c.charAt(0).toUpperCase() + c.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-sm w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setSearch(""); setCatFilter("all"); setStatusFilter("all"); }}>
            Clear
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <Receipt className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {bills.length === 0 ? "No bills yet. Add one to get started." : "No bills match your filters."}
            </p>
          </div>
        ) : (
          filtered.map((bill) => {
            const isInSplit = bill.splits.some((s) => s.userId === currentUserId);
            const isPayer = bill.paidBy.id === currentUserId;
            const canAct = bill.status === "pending" && isInSplit && !isPayer;
            const dotColor = CATEGORY_COLORS[bill.category] ?? "bg-slate-300";

            return (
              <div key={bill.id} className="border-b border-slate-100 last:border-0">
                <div className="flex items-center px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  {/* Category dot */}
                  <div className={cn("w-2 h-2 rounded-full mr-4 shrink-0", dotColor)} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{bill.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 capitalize">{bill.category}</span>
                      <span className="text-slate-200 text-xs">·</span>
                      <span className="text-xs text-slate-400">paid by {bill.paidBy.name}</span>
                      <span className="text-slate-200 text-xs">·</span>
                      <span className="text-xs text-slate-400">{new Date(bill.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(bill.amount, currency)}</p>
                    {statusText(bill.status)}
                  </div>
                </div>

                {/* Receipt + actions */}
                {(bill.receiptUrl || canAct) && (
                  <div className={cn("px-5 pb-4 space-y-3", !bill.receiptUrl && "pt-0")}>
                    {bill.receiptUrl && (
                      <a href={bill.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={bill.receiptUrl}
                          alt="Receipt"
                          className="rounded-lg border border-slate-200 max-h-36 object-contain bg-slate-50 hover:opacity-90 transition-opacity cursor-zoom-in"
                        />
                      </a>
                    )}
                    {canAct && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50" disabled={isPending} onClick={() => handleBill("approve", bill.id)}>
                          <Check className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50" disabled={isPending} onClick={() => handleBill("reject", bill.id)}>
                          <X className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SettlementsTab({
  settlements,
  currentUserId,
  currency,
}: {
  settlements: Settlement[];
  currentUserId: string;
  currency: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  function handleApprove(settlementId: string) {
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

  function handleRejectConfirm() {
    if (!rejectTarget || !rejectReason.trim()) return;
    startTransition(async () => {
      try {
        const result = await rejectSettlement({ settlementId: rejectTarget, reason: rejectReason.trim() });
        toast.success(result.message);
        setRejectTarget(null);
        setRejectReason("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  const filtered = useMemo(() => {
    return settlements.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.payer.name.toLowerCase().includes(q) && !s.receiver.name.toLowerCase().includes(q) && !(s.description?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [settlements, statusFilter, search]);

  const hasFilters = statusFilter !== "all" || search;

  return (
    <>
      {settlements.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-sm w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
              Clear
            </Button>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <ArrowLeftRight className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {settlements.length === 0 ? "No settlements yet." : "No settlements match your filters."}
            </p>
          </div>
        ) : (
          filtered.map((s) => {
            const isReceiver = s.receiver.id === currentUserId;
            const canAct = s.status === "pending" && isReceiver;

            return (
              <div key={s.id} className="border-b border-slate-100 last:border-0">
                <div className="flex items-center px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-indigo-300 mr-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium text-slate-900">{s.payer.name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                      <span className="font-medium text-slate-900">{s.receiver.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {s.description && <span className="text-xs text-slate-400 truncate">{s.description}</span>}
                      {s.description && <span className="text-slate-200 text-xs">·</span>}
                      <span className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(s.amount, currency)}</p>
                    {statusText(s.status)}
                  </div>
                </div>

                {(s.paymentProofUrl || s.rejectionReason || canAct) && (
                  <div className="px-5 pb-4 space-y-3">
                    {s.paymentProofUrl && (
                      <a href={s.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.paymentProofUrl}
                          alt="Payment proof"
                          className="rounded-lg border border-slate-200 max-h-36 object-contain bg-slate-50 hover:opacity-90 transition-opacity cursor-zoom-in"
                        />
                      </a>
                    )}
                    {s.status === "rejected" && s.rejectionReason && (
                      <div className="flex gap-2 p-3 rounded-lg bg-rose-50 border border-rose-100">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-600">{s.rejectionReason}</p>
                      </div>
                    )}
                    {canAct && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50" disabled={isPending} onClick={() => handleApprove(s.id)}>
                          <Check className="w-3 h-3 mr-1" /> Confirm received
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50" disabled={isPending} onClick={() => { setRejectTarget(s.id); setRejectReason(""); }}>
                          <X className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject settlement</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-500">The payer will see your reason. Be specific so they know what to fix.</p>
            <Textarea
              placeholder="e.g. Screenshot doesn't match amount, payment wasn't received..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={isPending || !rejectReason.trim()}>
              {isPending ? "Rejecting…" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ledgerEntryLabel(entry: LedgerEntry) {
  const isPositive = !entry.amount.startsWith("-");
  if (entry.sourceType === "bill") {
    return isPositive ? "You paid for other members" : "Your share of a bill";
  }
  if (entry.sourceType === "settlement") {
    return isPositive ? "A payment reduced what you owe" : "A payment reduced what you are owed";
  }
  if (entry.sourceType === "reversal") return "A previous entry was reversed";
  return "Balance adjustment";
}

function BalanceTab({ jemawId }: { jemawId: string }) {
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    getMyJemawLedger(jemawId)
      .then((data) => setLedger(data as LedgerData))
      .catch(() => setLoadError(true));
  }, [jemawId]);

  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50 py-12 text-center text-sm text-rose-600">
        Balance details could not be loaded. Please refresh and try again.
      </div>
    );
  }

  if (!ledger) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-12 flex items-center justify-center gap-2 text-slate-400 text-sm">
        <BookOpen className="w-4 h-4 animate-pulse" />
        Explaining your balance…
      </div>
    );
  }

  const balance = parseFloat(ledger.currentBalance);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Your current balance
        </p>
        <p
          className={cn(
            "mt-1 text-2xl font-bold tabular-nums",
            balance > 0
              ? "text-emerald-600"
              : balance < 0
                ? "text-rose-600"
                : "text-slate-500"
          )}
        >
          {balance > 0 && "+"}
          {formatCurrency(ledger.currentBalance, ledger.currency)}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {balance > 0
            ? "Group members owe you this amount."
            : balance < 0
              ? "You owe this amount across the group."
              : "You are settled up with this group."}
        </p>
      </div>

      <div className="flex gap-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-700">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Only approved bills and confirmed payments affect this balance.
          Pending or rejected items are excluded.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {ledger.entries.length === 0 ? (
          <div className="py-14 text-center">
            <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              No approved financial entries yet.
            </p>
          </div>
        ) : (
          ledger.entries.map((entry) => {
            const isPositive = !entry.amount.startsWith("-");
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 last:border-0"
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    isPositive
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  )}
                >
                  {isPositive ? "+" : "−"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {ledgerEntryLabel(entry)}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {entry.description ||
                      (entry.sourceType === "bill" ? "Approved bill" : "Confirmed payment")}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {new Date(entry.createdAt).toLocaleString()} · Balance after: {formatCurrency(entry.balanceAfter, ledger.currency)}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    isPositive ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {isPositive ? "+" : "−"}
                  {formatCurrency(entry.amount.replace("-", ""), ledger.currency)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {ledger.hasOlderEntries && (
        <p className="text-center text-xs text-slate-400">
          Showing the 200 most recent balance entries.
        </p>
      )}
    </div>
  );
}

function ActivityTab({ jemawId }: { jemawId: string }) {
  const [logs, setLogs] = useState<ActivityLog[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJemawActivity(jemawId)
      .then((data) => setLogs(data as ActivityLog[]))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [jemawId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-12 flex items-center justify-center gap-2 text-slate-400 text-sm">
        <Clock className="w-4 h-4 animate-spin" />
        Loading activity…
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-14 text-center">
        <Clock className="w-8 h-8 text-slate-200 mx-auto mb-3" />
        <p className="text-sm text-slate-400">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {logs.map((log, i) => (
        <div key={log.id} className="flex items-start px-5 py-4 border-b border-slate-100 last:border-0 gap-3">
          {/* Timeline dot + line */}
          <div className="flex flex-col items-center shrink-0 mt-1">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            {i < logs.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-1 min-h-[20px]" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">{log.user.name}</span>{" "}
              {actionLabel(log.action, log.metadata)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function JemawTabs({
  jemaw,
  currentUserId,
}: {
  jemaw: JemawData;
  currentUserId: string;
}) {
  return (
    <Tabs defaultValue="bills">
      <div className="mb-4 overflow-x-auto pb-1">
        <TabsList className="bg-slate-100 p-0.5 rounded-xl h-9">
          <TabsTrigger value="bills" className="text-xs rounded-lg h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Bills {jemaw.bills.length > 0 && <span className="ml-1 text-slate-400 font-normal">{jemaw.bills.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="settlements" className="text-xs rounded-lg h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Settlements {jemaw.settlements.length > 0 && <span className="ml-1 text-slate-400 font-normal">{jemaw.settlements.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="balance" className="text-xs rounded-lg h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            My balance
          </TabsTrigger>
          <TabsTrigger value="members" className="text-xs rounded-lg h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Members {jemaw.members.length > 0 && <span className="ml-1 text-slate-400 font-normal">{jemaw.members.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs rounded-lg h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Activity
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="bills">
        <BillsTab bills={jemaw.bills} currentUserId={currentUserId} currency={jemaw.currency} />
      </TabsContent>
      <TabsContent value="settlements">
        <SettlementsTab settlements={jemaw.settlements} currentUserId={currentUserId} currency={jemaw.currency} />
      </TabsContent>
      <TabsContent value="balance">
        <BalanceTab jemawId={jemaw.id} />
      </TabsContent>
      <TabsContent value="members">
        <MembersTab
          members={jemaw.members}
          currency={jemaw.currency}
          currentUserId={currentUserId}
          isAdmin={jemaw.isAdmin}
          jemawId={jemaw.id}
        />
      </TabsContent>
      <TabsContent value="activity">
        <ActivityTab jemawId={jemaw.id} />
      </TabsContent>
    </Tabs>
  );
}
