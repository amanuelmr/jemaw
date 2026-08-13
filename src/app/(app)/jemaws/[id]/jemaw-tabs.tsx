"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Info, LogOut, Plus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { approveBill, rejectBill } from "@/actions/bills";
import { removeMember, leaveJemaw } from "@/actions/jemaws";
import { getMyJemawLedger } from "@/actions/ledger";
import { MoneyAmount } from "@/components/money-amount";
import { StatusLabel } from "@/components/status-label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency } from "@/lib/utils";
import { dayLabel, getCategoryMeta, initials } from "@/lib/presentation";

type Member = {
  userId: string;
  balance: string;
  isAdmin: boolean;
  user: { id: string; name: string; email: string };
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
  splits: { userId: string; amount: string; user: { id: string; name: string } }[];
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
  myBalance: string;
  members: Member[];
  bills: Bill[];
  settlements: Settlement[];
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

type LedgerData = { currentBalance: string; currency: string; entries: LedgerEntry[]; hasOlderEntries: boolean };

function PersonAvatar({ name }: { name: string }) {
  return <Avatar className="size-8"><AvatarFallback className="bg-muted text-[9px] font-semibold">{initials(name)}</AvatarFallback></Avatar>;
}

function JournalTab({ bills, settlements, currentUserId, currency }: { bills: Bill[]; settlements: Settlement[]; currentUserId: string; currency: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const entries = useMemo(() => [
    ...bills.map((item) => ({ kind: "bill" as const, item, createdAt: new Date(item.createdAt) })),
    ...settlements.map((item) => ({ kind: "settlement" as const, item, createdAt: new Date(item.createdAt) })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), [bills, settlements]);

  function handleBill(action: "approve" | "reject", billId: string) {
    startTransition(async () => {
      try {
        const result = await (action === "approve" ? approveBill : rejectBill)({ billId });
        toast.success(result.message);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  }

  if (entries.length === 0) {
    return <div className="border-b py-12"><h3 className="text-base font-semibold">No activity yet</h3><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Add the first expense when someone in the group pays for something.</p></div>;
  }

  return (
    <div>
      {entries.map((entry, index) => {
        const label = dayLabel(entry.createdAt);
        const showDay = index === 0 || dayLabel(entries[index - 1].createdAt) !== label;
        if (entry.kind === "bill") {
          const bill = entry.item;
          const mySplit = bill.splits.find((split) => split.userId === currentUserId);
          const isPayer = bill.paidBy.id === currentUserId;
          const canAct = bill.status === "pending" && Boolean(mySplit) && !isPayer;
          return (
            <div key={bill.id}>
              {showDay && <div className="flex items-center gap-3 border-b pb-2 pt-7 first:pt-0"><p className="font-mono text-[10px] text-muted-foreground">{label.toUpperCase()}</p><span className="h-px flex-1 bg-border" /></div>}
              <article className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3 border-b py-5 sm:gap-4">
                <PersonAvatar name={bill.paidBy.name} />
                <div className="min-w-0">
                  <p className="text-sm"><span className="font-semibold">{isPayer ? "You" : bill.paidBy.name}</span> added <span className="font-semibold">{bill.description}</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">{getCategoryMeta(bill.category).label} · split between {bill.splits.length}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <StatusLabel status={bill.status} />
                    {mySplit && <span className="text-xs text-muted-foreground">Your share {formatCurrency(mySplit.amount, currency)}</span>}
                    {bill.receiptUrl && <a href={bill.receiptUrl} target="_blank" rel="noreferrer" className="text-xs font-medium underline underline-offset-4">View receipt</a>}
                  </div>
                  {canAct && <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => handleBill("approve", bill.id)} disabled={isPending}><Check className="size-3.5" />Approve</Button><Button size="sm" variant="outline" onClick={() => handleBill("reject", bill.id)} disabled={isPending}>Dispute</Button></div>}
                </div>
                <div className="text-right"><MoneyAmount amount={bill.amount} currency={currency} className="text-sm font-semibold" /><p className="mt-1 font-mono text-[9px] text-muted-foreground">{entry.createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p></div>
              </article>
            </div>
          );
        }

        const settlement = entry.item;
        const payerName = settlement.payer.id === currentUserId ? "You" : settlement.payer.name;
        const receiverName = settlement.receiver.id === currentUserId ? "you" : settlement.receiver.name;
        const needsReview = settlement.status === "pending" && settlement.receiver.id === currentUserId;
        return (
          <div key={settlement.id}>
            {showDay && <div className="flex items-center gap-3 border-b pb-2 pt-7 first:pt-0"><p className="font-mono text-[10px] text-muted-foreground">{label.toUpperCase()}</p><span className="h-px flex-1 bg-border" /></div>}
            <article className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3 border-b py-5 sm:gap-4">
              <PersonAvatar name={settlement.payer.name} />
              <div className="min-w-0">
                <p className="text-sm"><span className="font-semibold">{payerName}</span> paid <span className="font-semibold">{receiverName}</span></p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{settlement.description || "Payment recorded outside Jemaw"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3"><StatusLabel status={settlement.status === "approved" ? "confirmed" : settlement.status} />{settlement.paymentProofUrl && <a href={settlement.paymentProofUrl} target="_blank" rel="noreferrer" className="text-xs font-medium underline underline-offset-4">View proof</a>}{needsReview && <Link href="/pending" className="text-xs font-semibold text-[#f15b3a]">Review payment</Link>}</div>
                {settlement.rejectionReason && <p className="mt-2 border-l-2 border-destructive pl-2 text-xs text-destructive">{settlement.rejectionReason}</p>}
              </div>
              <div className="text-right"><MoneyAmount amount={settlement.amount} currency={currency} className="text-sm font-semibold text-[#237a4b]" /><p className="mt-1 font-mono text-[9px] text-muted-foreground">{entry.createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p></div>
            </article>
          </div>
        );
      })}
    </div>
  );
}

function BalancesTab({ jemaw, currentUserId }: { jemaw: JemawData; currentUserId: string }) {
  const myBalance = Number(jemaw.myBalance);
  return (
    <div>
      <div className="border-b pb-6"><p className="text-xs text-muted-foreground">Your balance</p><MoneyAmount amount={myBalance} currency={jemaw.currency} signed className={cn("mt-2 inline-block text-3xl font-semibold", myBalance > 0 && "text-[#237a4b]", myBalance < 0 && "text-[#a13629]")} /><p className="mt-2 text-sm text-muted-foreground">{myBalance > 0 ? "Money the group owes you." : myBalance < 0 ? "Money you owe in this group." : "You are even in this group."}</p>{myBalance < 0 && <Button asChild className="mt-4"><Link href={`/jemaws/${jemaw.id}/settlements/new`}>Record a payment</Link></Button>}</div>
      <div className="border-b border-foreground py-3"><h3 className="text-sm font-semibold">Everyone</h3></div>
      {jemaw.members.map((member) => {
        const balance = Number(member.balance);
        return <div key={member.userId} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-b py-4"><PersonAvatar name={member.user.name} /><div className="min-w-0"><p className="truncate text-sm font-medium">{member.userId === currentUserId ? "You" : member.user.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{member.isAdmin ? "Admin" : "Member"}</p></div><div className="text-right"><MoneyAmount amount={balance} currency={jemaw.currency} signed className={cn("text-sm font-semibold", balance > 0 && "text-[#237a4b]", balance < 0 && "text-[#a13629]", balance === 0 && "text-muted-foreground")} /><p className="mt-0.5 text-[10px] text-muted-foreground">{balance > 0 ? "is owed" : balance < 0 ? "owes" : "even"}</p></div></div>;
      })}
    </div>
  );
}

function PeopleTab({ members, currentUserId, isAdmin, jemawId }: { members: Member[]; currentUserId: string; isAdmin: boolean; jemawId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmLeave, setConfirmLeave] = useState(false);
  function handleRemove(userId: string) { startTransition(async () => { try { const result = await removeMember({ jemawId, userId }); toast.success(result.message); router.refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to remove member"); } }); }
  function handleLeave() { if (!confirmLeave) { setConfirmLeave(true); return; } startTransition(async () => { try { const result = await leaveJemaw({ jemawId }); toast.success(result.message); router.push("/dashboard"); } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to leave group"); setConfirmLeave(false); } }); }
  return (
    <div>
      {members.map((member) => {
        const isMe = member.userId === currentUserId;
        return <div key={member.userId} className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b py-4"><PersonAvatar name={member.user.name} /><div className="min-w-0"><p className="truncate text-sm font-medium">{member.user.name}{isMe && <span className="font-normal text-muted-foreground"> · you</span>}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{member.user.email}</p></div><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{member.isAdmin ? "Admin" : "Member"}</span>{isAdmin && !isMe && <button onClick={() => handleRemove(member.userId)} disabled={isPending} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-[#fff2ef] hover:text-destructive" aria-label={`Remove ${member.user.name}`}><UserMinus className="size-4" /></button>}</div></div>;
      })}
      {!isAdmin && <div className="py-5"><Button variant="outline" size="sm" className="text-destructive" onClick={handleLeave} disabled={isPending}><LogOut className="size-4" />{confirmLeave ? "Confirm leaving group" : "Leave group"}</Button>{confirmLeave && <button className="ml-3 text-xs underline" onClick={() => setConfirmLeave(false)}>Cancel</button>}</div>}
    </div>
  );
}

function ledgerEntryLabel(entry: LedgerEntry) {
  if (entry.sourceType === "bill") return "Approved expense";
  if (entry.sourceType === "settlement") return "Confirmed payment";
  if (entry.sourceType === "reversal") return "Reversal";
  return "Balance adjustment";
}

function LedgerTab({ jemawId }: { jemawId: string }) {
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getMyJemawLedger(jemawId).then((data) => setLedger(data as LedgerData)).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load the ledger")); }, [jemawId]);
  if (error) return <p className="border-l-2 border-destructive py-2 pl-3 text-sm text-destructive">{error}</p>;
  if (!ledger) return <p className="py-8 text-sm text-muted-foreground">Loading ledger…</p>;
  return (
    <div>
      <div className="flex gap-3 border-b bg-white px-3 py-4 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" /><p>Only approved expenses and confirmed payments appear here. This record explains every change to your balance.</p></div>
      {ledger.entries.length === 0 ? <div className="border-b py-12"><BookOpen className="size-5 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No approved entries yet.</p></div> : ledger.entries.map((entry) => {
        const positive = !entry.amount.startsWith("-");
        return <div key={entry.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b py-4"><div className="min-w-0"><p className="text-sm font-medium">{ledgerEntryLabel(entry)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{entry.description || "Financial entry"}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">{new Date(entry.createdAt).toLocaleString()} · balance {formatCurrency(entry.balanceAfter, ledger.currency)}</p></div><MoneyAmount amount={entry.amount} currency={ledger.currency} signed className={cn("text-sm font-semibold", positive ? "text-[#237a4b]" : "text-[#a13629]")} /></div>;
      })}
      {ledger.hasOlderEntries && <p className="py-4 text-center text-xs text-muted-foreground">Showing the 200 most recent entries.</p>}
    </div>
  );
}

const tabClass = "h-11 rounded-none border-0 bg-transparent px-0 text-xs font-medium text-muted-foreground shadow-none after:bottom-0 after:bg-[#f15b3a] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

export function JemawTabs({ jemaw, currentUserId }: { jemaw: JemawData; currentUserId: string }) {
  const balance = Number(jemaw.myBalance);
  return (
    <Tabs defaultValue="journal">
      <div className="overflow-x-auto border-b"><TabsList variant="line" className="h-11 min-w-max gap-6 p-0"><TabsTrigger value="journal" className={tabClass}>Journal</TabsTrigger><TabsTrigger value="balances" className={tabClass}>Balances</TabsTrigger><TabsTrigger value="people" className={tabClass}>People <span className="font-mono text-[9px]">{jemaw.members.length}</span></TabsTrigger><TabsTrigger value="ledger" className={tabClass}>Ledger</TabsTrigger></TabsList></div>
      <div className="grid gap-10 pt-7 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-12">
        <div className="min-w-0">
          <TabsContent value="journal" className="mt-0"><JournalTab bills={jemaw.bills} settlements={jemaw.settlements} currentUserId={currentUserId} currency={jemaw.currency} /></TabsContent>
          <TabsContent value="balances" className="mt-0"><BalancesTab jemaw={jemaw} currentUserId={currentUserId} /></TabsContent>
          <TabsContent value="people" className="mt-0"><PeopleTab members={jemaw.members} currentUserId={currentUserId} isAdmin={jemaw.isAdmin} jemawId={jemaw.id} /></TabsContent>
          <TabsContent value="ledger" className="mt-0"><LedgerTab jemawId={jemaw.id} /></TabsContent>
        </div>
        <aside className="border-t pt-6 lg:sticky lg:top-8 lg:self-start lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <p className="text-xs text-muted-foreground">Your balance</p><MoneyAmount amount={balance} currency={jemaw.currency} signed className={cn("mt-2 inline-block text-2xl font-semibold", balance > 0 && "text-[#237a4b]", balance < 0 && "text-[#a13629]")} /><p className="mt-1 text-xs text-muted-foreground">{balance > 0 ? "owed to you" : balance < 0 ? "you owe" : "even"}</p>
          <div className="mt-6 space-y-1"><Button asChild className="w-full"><Link href={`/jemaws/${jemaw.id}/bills/new`}><Plus className="size-4" />Add expense</Link></Button>{balance < 0 && <Button asChild variant="outline" className="w-full"><Link href={`/jemaws/${jemaw.id}/settlements/new`}>Record payment</Link></Button>}</div>
          <div className="mt-7 border-t pt-5"><div className="flex items-center justify-between"><p className="text-xs font-medium">People</p><span className="font-mono text-[9px] text-muted-foreground">{jemaw.members.length}</span></div><div className="mt-3 space-y-3">{jemaw.members.slice(0, 5).map((member) => <div key={member.userId} className="flex items-center gap-2"><PersonAvatar name={member.user.name} /><span className="min-w-0 flex-1 truncate text-xs">{member.userId === currentUserId ? "You" : member.user.name}</span><MoneyAmount amount={member.balance} currency={jemaw.currency} signed className="text-[10px] text-muted-foreground" /></div>)}</div></div>
        </aside>
      </div>
    </Tabs>
  );
}
