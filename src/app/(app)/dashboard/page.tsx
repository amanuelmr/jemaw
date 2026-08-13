import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { getMyRecentActivity } from "@/actions/activity";
import { getPendingBillsForUser } from "@/actions/bills";
import { getMyJemaws } from "@/actions/jemaws";
import { getPendingSettlementsForUser } from "@/actions/settlements";
import { MoneyAmount } from "@/components/money-amount";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { dayLabel, initials } from "@/lib/presentation";
import { CreateJemawDialog } from "./create-jemaw-dialog";
import { JemawCard } from "./jemaw-card";

type Activity = Awaited<ReturnType<typeof getMyRecentActivity>>[number];

function activityText(activity: Activity) {
  let metadata: Record<string, string> = {};
  try { metadata = activity.metadata ? JSON.parse(activity.metadata) as Record<string, string> : {}; } catch {}
  if (activity.action === "bill.created") return `${activity.user.name} added ${metadata.description || "an expense"}`;
  if (activity.action === "bill.approved") return `${activity.user.name} approved ${metadata.description || "an expense"}`;
  if (activity.action === "bill.rejected") return `${activity.user.name} disputed ${metadata.description || "an expense"}`;
  if (activity.action === "settlement.created") return `${activity.user.name} recorded a payment`;
  if (activity.action === "settlement.approved") return `${activity.user.name} confirmed a payment`;
  if (activity.action === "settlement.rejected") return `${activity.user.name} disputed a payment`;
  return `${activity.user.name} updated the group`;
}

export default async function DashboardPage() {
  const [session, jemaws, pendingBills, pendingSettlements, recentActivity] = await Promise.all([
    getServerSession(), getMyJemaws(), getPendingBillsForUser(), getPendingSettlementsForUser(), getMyRecentActivity(),
  ]);
  const pendingCount = pendingBills.length + pendingSettlements.length;
  const firstName = session?.user.name.split(" ")[0] ?? "there";
  const byCurrency: Record<string, { owed: number; owe: number }> = {};
  for (const group of jemaws) {
    const balance = Number(group.myBalance);
    byCurrency[group.currency] ??= { owed: 0, owe: 0 };
    if (balance > 0) byCurrency[group.currency].owed += balance;
    if (balance < 0) byCurrency[group.currency].owe += Math.abs(balance);
  }
  const currencies = Object.keys(byCurrency);
  const singleCurrency = currencies.length <= 1;
  const primaryCurrency = currencies[0] ?? "USD";
  const net = singleCurrency ? (byCurrency[primaryCurrency]?.owed ?? 0) - (byCurrency[primaryCurrency]?.owe ?? 0) : 0;
  const lastActivityByGroup = new Map<string, string>();
  for (const activity of recentActivity) if (!lastActivityByGroup.has(activity.jemawId)) lastActivityByGroup.set(activity.jemawId, activityText(activity));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`Home, ${firstName}`}
        description="Your groups, balances, and recent changes."
        action={<CreateJemawDialog><Button><Plus className="size-4" />New group</Button></CreateJemawDialog>}
      />

      <section className="grid border-b py-7 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs text-muted-foreground">Across your groups</p>
          {singleCurrency ? (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <MoneyAmount amount={net} currency={primaryCurrency} signed className={cn("text-3xl font-semibold sm:text-4xl", net > 0 && "text-[#237a4b]", net < 0 && "text-[#a13629]")} />
              <span className="text-sm text-muted-foreground">{net > 0 ? "owed to you overall" : net < 0 ? "you owe overall" : "all balances are even"}</span>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
              {currencies.map((currency) => (
                <div key={currency}>
                  <p className="font-mono text-[10px] text-muted-foreground">{currency}</p>
                  <p className="mt-1 text-sm font-semibold">
                    <MoneyAmount amount={byCurrency[currency].owed} currency={currency} signed className="text-[#237a4b]" />
                    <span className="mx-2 text-border">/</span>
                    <MoneyAmount amount={-byCurrency[currency].owe} currency={currency} signed className="text-[#a13629]" />
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        {pendingCount > 0 && (
          <Link href="/pending" className="mt-6 flex items-center gap-3 border-l-2 border-[#f15b3a] py-1 pl-3 md:mt-0">
            <Check className="size-4" /><span className="text-sm font-medium">{pendingCount} {pendingCount === 1 ? "request needs" : "requests need"} review</span>
          </Link>
        )}
      </section>

      <div className="grid gap-12 pt-9 lg:grid-cols-[1.25fr_0.75fr]">
        <section>
          <div className="flex items-center justify-between border-b border-foreground pb-3"><h2 className="text-lg font-semibold tracking-[-0.025em]">Groups</h2><span className="font-mono text-[10px] text-muted-foreground">{jemaws.length}</span></div>
          {jemaws.length === 0 ? (
            <div className="border-b py-12"><h3 className="text-base font-semibold">No groups yet</h3><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Create one for a trip, a home, or any people who keep sharing expenses.</p><CreateJemawDialog><Button className="mt-5"><Plus className="size-4" />Create a group</Button></CreateJemawDialog></div>
          ) : jemaws.map((jemaw) => <JemawCard key={jemaw.id} jemaw={jemaw} lastActivity={lastActivityByGroup.get(jemaw.id)} />)}
        </section>

        <section>
          <div className="flex items-center justify-between border-b border-foreground pb-3"><h2 className="text-lg font-semibold tracking-[-0.025em]">Recent activity</h2><span className="font-mono text-[10px] text-muted-foreground">LATEST</span></div>
          {recentActivity.length === 0 ? <p className="border-b py-8 text-sm text-muted-foreground">Activity will appear after someone adds an expense or payment.</p> : recentActivity.slice(0, 8).map((activity) => (
            <Link key={activity.id} href={`/jemaws/${activity.jemawId}`} className="grid grid-cols-[28px_1fr] gap-3 border-b py-4 hover:bg-white">
              <Avatar className="size-7"><AvatarFallback className="bg-muted text-[8px] font-semibold">{initials(activity.user.name)}</AvatarFallback></Avatar>
              <div className="min-w-0"><p className="truncate text-xs font-medium">{activityText(activity)}</p><p className="mt-1 flex items-center justify-between gap-3 text-[10px] text-muted-foreground"><span className="truncate">{activity.jemaw.name}</span><span className="font-mono shrink-0">{dayLabel(activity.createdAt)}</span></p></div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
