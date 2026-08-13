import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Check, Plus } from "lucide-react";
import { getMyJemaws } from "@/actions/jemaws";
import { getPendingBillsForUser } from "@/actions/bills";
import { getPendingSettlementsForUser } from "@/actions/settlements";
import { getServerSession } from "@/lib/session";
import { JemawCard } from "./jemaw-card";
import { CreateJemawDialog } from "./create-jemaw-dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const [session, jemaws, pendingBills, pendingSettlements] = await Promise.all([
    getServerSession(),
    getMyJemaws(),
    getPendingBillsForUser(),
    getPendingSettlementsForUser(),
  ]);

  const pendingCount = pendingBills.length + pendingSettlements.length;
  const firstName = session?.user.name.split(" ")[0] ?? "there";
  const byCurrency: Record<string, { owed: number; owe: number }> = {};

  for (const jemaw of jemaws) {
    const balance = Number(jemaw.myBalance);
    byCurrency[jemaw.currency] ??= { owed: 0, owe: 0 };
    if (balance > 0) byCurrency[jemaw.currency].owed += balance;
    if (balance < 0) byCurrency[jemaw.currency].owe += Math.abs(balance);
  }

  const currencies = Object.keys(byCurrency);
  const primaryCurrency = currencies[0] ?? "USD";
  const singleCurrency = currencies.length <= 1;
  const owed = singleCurrency ? byCurrency[primaryCurrency]?.owed ?? 0 : 0;
  const owe = singleCurrency ? byCurrency[primaryCurrency]?.owe ?? 0 : 0;
  const net = owed - owe;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">Your shared money</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#20231d] sm:text-4xl">Good to see you, {firstName}.</h1>
          <p className="mt-2 text-sm text-[#73766e]">Here&apos;s where things stand with your people.</p>
        </div>
        <CreateJemawDialog>
          <Button className="hidden sm:inline-flex"><Plus className="size-4" />New group</Button>
        </CreateJemawDialog>
      </header>

      <section className="paper-grid relative mt-8 overflow-hidden rounded-[30px] bg-[#1d4f3f] p-6 text-[#fffaf0] shadow-[0_22px_60px_rgba(29,79,63,0.18)] sm:p-8 lg:grid lg:grid-cols-[1.35fr_0.65fr] lg:gap-10 lg:p-10">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#b8d0c5]">Your position</p>
          {singleCurrency ? (
            <>
              <p className="mt-3 font-money text-5xl font-semibold leading-none tabular-nums sm:text-6xl">
                {net > 0 ? "+" : net < 0 ? "−" : ""}{formatCurrency(Math.abs(net), primaryCurrency)}
              </p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#c8d8d0]">
                {net > 0 ? "You are ahead overall. Your friends have money coming back to you." : net < 0 ? "You have a little settling up to do across your groups." : "Everything is balanced. That is a rare and beautiful thing."}
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 font-money text-5xl font-semibold leading-none sm:text-6xl">{jemaws.length}</p>
              <p className="mt-4 text-sm text-[#c8d8d0]">active groups across {currencies.length} currencies</p>
            </>
          )}
        </div>

        <div className="mt-8 border-t border-white/15 pt-6 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-1">
          {singleCurrency ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-xs font-semibold text-[#c8d8d0]"><ArrowDownLeft className="size-4 text-[#88d2a9]" />Coming to you</span>
                <span className="font-money text-lg font-semibold">{owed ? `+${formatCurrency(owed, primaryCurrency)}` : "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-xs font-semibold text-[#c8d8d0]"><ArrowUpRight className="size-4 text-[#f0a58e]" />Going out</span>
                <span className="font-money text-lg font-semibold">{owe ? `−${formatCurrency(owe, primaryCurrency)}` : "—"}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currencies.map((currency) => (
                <div key={currency} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-extrabold">{currency}</span>
                  <span className="text-xs text-[#c8d8d0]">
                    {byCurrency[currency].owed > 0 && `+${formatCurrency(byCurrency[currency].owed, currency)}`}
                    {byCurrency[currency].owed > 0 && byCurrency[currency].owe > 0 && " · "}
                    {byCurrency[currency].owe > 0 && `−${formatCurrency(byCurrency[currency].owe, currency)}`}
                    {byCurrency[currency].owed === 0 && byCurrency[currency].owe === 0 && "All square"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {pendingCount > 0 && (
            <Link href="/pending" className="mt-7 flex items-center justify-between rounded-2xl bg-[#f3c767] px-4 py-3 text-[#20231d] transition-transform hover:-translate-y-0.5">
              <span className="flex items-center gap-2 text-xs font-extrabold"><Check className="size-4" />{pendingCount} {pendingCount === 1 ? "request needs" : "requests need"} you</span>
              <ArrowUpRight className="size-4" />
            </Link>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4 pb-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#90928a]">Your circles</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight">Groups you share</h2>
          </div>
          <CreateJemawDialog>
            <button className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline sm:hidden"><Plus className="size-3.5" />New group</button>
          </CreateJemawDialog>
        </div>

        {jemaws.length === 0 ? (
          <div className="mt-4 border-y border-[#dcd5c8] py-14 text-center sm:py-20">
            <span className="text-4xl">🌱</span>
            <h3 className="mt-4 text-xl font-extrabold">Start a shared story</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Create a group for a trip, a home, or simply the friends you keep splitting dinner with.</p>
            <CreateJemawDialog><Button className="mt-6"><Plus className="size-4" />Create your first group</Button></CreateJemawDialog>
          </div>
        ) : (
          <div>
            {jemaws.map((jemaw) => <JemawCard key={jemaw.id} jemaw={jemaw} />)}
            <div className="border-t border-[#dcd5c8]" />
          </div>
        )}
      </section>
    </div>
  );
}
