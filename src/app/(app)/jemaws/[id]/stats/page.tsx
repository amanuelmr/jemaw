import Link from "next/link";
import { notFound } from "next/navigation";
import { getJemawById, getJemawStats } from "@/actions/jemaws";
import { ArrowLeft, PieChart } from "lucide-react";
import { MoneyAmount } from "@/components/money-amount";
import { cn } from "@/lib/utils";
import { StatsCharts } from "./stats-charts";

export default async function StatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let jemaw;
  let stats;
  try {
    [jemaw, stats] = await Promise.all([getJemawById(id), getJemawStats(id)]);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/jemaws/${id}`}
        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to {jemaw.name}
      </Link>

      <div className="mb-8 mt-6 border-b pb-6">
        <h1 className="text-3xl font-semibold tracking-[-0.045em]">Spending insights</h1>
        <p className="mt-2 text-sm text-muted-foreground">{jemaw.name} · {jemaw.currency}</p>
      </div>

      <div className="mb-10 grid gap-6 border-b pb-8 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Total shared spending</p>
          <MoneyAmount amount={stats.totalSpent} currency={jemaw.currency} className="mt-2 block text-2xl font-semibold" />
          <p className="mt-2 text-xs text-muted-foreground">Only approved expenses are included.</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Your share</p>
          <MoneyAmount amount={stats.myShare} currency={jemaw.currency} className="mt-2 block text-2xl font-semibold" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Your balance</p>
          <MoneyAmount
            amount={stats.myBalance}
            currency={jemaw.currency}
            signed
            className={cn("mt-2 block text-2xl font-semibold", stats.myBalance > 0 && "text-[#237a4b]", stats.myBalance < 0 && "text-[#a13629]")}
          />
        </div>
      </div>

      {stats.totalSpent === 0 ? (
        <div className="border-b py-16 text-center">
          <PieChart className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Insights will appear once the first expense is approved.</p>
        </div>
      ) : (
        <StatsCharts
          byCategory={stats.byCategory}
          memberBalances={stats.memberBalances}
          totalSpent={stats.totalSpent}
          currency={jemaw.currency}
        />
      )}
    </div>
  );
}
