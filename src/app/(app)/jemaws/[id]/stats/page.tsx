import Link from "next/link";
import { notFound } from "next/navigation";
import { getJemawById, getJemawStats } from "@/actions/jemaws";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StatsCharts } from "./stats-charts";
import { getGroupEmoji } from "@/lib/presentation";

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
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/jemaws/${id}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#777a72] transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Back to {jemaw.name}
      </Link>

      <div className="mb-9 mt-7 flex items-center gap-4 border-b border-[#dcd5c8] pb-7">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#e4ded2] text-xl">{getGroupEmoji(jemaw.name)}</span>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Spending story</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.045em] text-[#20231d]">How {jemaw.name} spent</h1>
        </div>
      </div>

      <div className="paper-grid mb-10 grid overflow-hidden rounded-[28px] bg-[#1d4f3f] text-[#fffaf0] sm:grid-cols-[1.2fr_0.8fr]">
        <div className="p-7 sm:p-9">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#a9c2b6]">Total shared spending</p>
          <p className="mt-3 font-money text-4xl font-semibold sm:text-5xl">{formatCurrency(stats.totalSpent, jemaw.currency)}</p>
          <p className="mt-3 text-xs text-[#bfd0c7]">Only approved expenses are included.</p>
        </div>
        <div className="grid grid-cols-2 border-t border-white/15 sm:border-l sm:border-t-0">
          <div className="p-6 sm:self-center sm:p-7">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#9db5aa]">Your share</p>
            <p className="mt-2 font-money text-xl font-semibold">{formatCurrency(stats.myShare, jemaw.currency)}</p>
          </div>
          <div className="border-l border-white/15 p-6 sm:self-center sm:p-7">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#9db5aa]">Your balance</p>
            <p className={`mt-2 font-money text-xl font-semibold ${stats.myBalance > 0 ? "text-[#8ad2a8]" : stats.myBalance < 0 ? "text-[#f0a58e]" : "text-[#fffaf0]"}`}>
              {stats.myBalance === 0 ? "Even" : `${stats.myBalance > 0 ? "+" : "−"}${formatCurrency(Math.abs(stats.myBalance), jemaw.currency)}`}
            </p>
          </div>
        </div>
      </div>

      {stats.totalSpent === 0 ? (
        <div className="border-y border-[#dcd5c8] py-16 text-center">
          <span className="text-4xl">📊</span>
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
