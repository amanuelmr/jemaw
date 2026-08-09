import Link from "next/link";
import { getMyJemaws } from "@/actions/jemaws";
import { getPendingBillsForUser } from "@/actions/bills";
import { getPendingSettlementsForUser } from "@/actions/settlements";
import { getServerSession } from "@/lib/session";
import { JemawCard } from "./jemaw-card";
import { CreateJemawDialog } from "./create-jemaw-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
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

  // Group balances by currency so mixed-currency groups don't collapse into USD
  const byCurrency: Record<string, { owed: number; owe: number }> = {};
  for (const j of jemaws) {
    const bal = parseFloat(j.myBalance);
    if (!byCurrency[j.currency]) byCurrency[j.currency] = { owed: 0, owe: 0 };
    if (bal > 0) byCurrency[j.currency].owed += bal;
    else if (bal < 0) byCurrency[j.currency].owe += Math.abs(bal);
  }
  const currencies = Object.keys(byCurrency);
  const primaryCurrency = currencies[0] ?? "USD";
  const isSingleCurrency = currencies.length <= 1;
  const totalOwedToMe = isSingleCurrency ? (byCurrency[primaryCurrency]?.owed ?? 0) : 0;
  const totalIOwe = isSingleCurrency ? (byCurrency[primaryCurrency]?.owe ?? 0) : 0;
  const netBalance = totalOwedToMe - totalIOwe;

  return (
    <div>
      {/* Hero balance section */}
      <div className="mb-10">
        <p className="text-sm text-slate-500 mb-1">Hi, {firstName}</p>

        {isSingleCurrency ? (
          <div className="flex items-baseline gap-3 mb-4">
            <p className={`text-4xl sm:text-5xl font-bold tracking-tight ${netBalance >= 0 ? "text-slate-900" : "text-rose-600"}`}>
              {netBalance >= 0
                ? netBalance === 0 ? formatCurrency(0, primaryCurrency) : `+${formatCurrency(netBalance, primaryCurrency)}`
                : `−${formatCurrency(Math.abs(netBalance), primaryCurrency)}`}
            </p>
            <p className="text-sm text-slate-400 pb-1">net balance</p>
          </div>
        ) : (
          <div className="flex items-baseline gap-3 mb-4">
            <p className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">{jemaws.length}</p>
            <p className="text-sm text-slate-400 pb-1">active groups · multiple currencies</p>
          </div>
        )}

        <div className="flex items-center gap-6 flex-wrap">
          {isSingleCurrency ? (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Owed to you</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {totalOwedToMe === 0 ? "—" : `+${formatCurrency(totalOwedToMe, primaryCurrency)}`}
                  </p>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                  <ArrowDownRight className="w-3 h-3 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">You owe</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {totalIOwe === 0 ? "—" : formatCurrency(totalIOwe, primaryCurrency)}
                  </p>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
            </>
          ) : (
            // Multi-currency: show per-currency owed/owe summary
            <>
              {currencies.map((cur, i) => (
                <div key={cur} className="flex items-center gap-1.5">
                  <div>
                    <p className="text-xs text-slate-500">{cur}</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {byCurrency[cur].owed > 0 && <span className="text-emerald-600">+{formatCurrency(byCurrency[cur].owed, cur)}</span>}
                      {byCurrency[cur].owed > 0 && byCurrency[cur].owe > 0 && <span className="text-slate-300 mx-1">/</span>}
                      {byCurrency[cur].owe > 0 && <span className="text-rose-500">−{formatCurrency(byCurrency[cur].owe, cur)}</span>}
                      {byCurrency[cur].owed === 0 && byCurrency[cur].owe === 0 && <span className="text-slate-400">—</span>}
                    </p>
                  </div>
                  {i < currencies.length - 1 && <div className="w-px h-8 bg-slate-200 ml-3" />}
                </div>
              ))}
              <div className="w-px h-8 bg-slate-200" />
            </>
          )}

          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="w-3 h-3 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Groups</p>
              <p className="text-sm font-semibold text-slate-900">{jemaws.length}</p>
            </div>
          </div>

          {pendingCount > 0 && (
            <>
              <div className="w-px h-8 bg-slate-200" />
              <Link href="/pending" className="flex items-center gap-1.5 group">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pending</p>
                  <p className="text-sm font-semibold text-amber-600 group-hover:underline">{pendingCount} item{pendingCount !== 1 ? "s" : ""}</p>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Groups list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-900 text-sm">Groups</h2>
            {jemaws.length > 0 && (
              <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">
                {jemaws.length}
              </span>
            )}
          </div>
          <CreateJemawDialog>
            <Button size="sm" className="h-7 text-xs gap-1 px-3">
              <Plus className="w-3 h-3" />
              New Group
            </Button>
          </CreateJemawDialog>
        </div>

        {jemaws.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">No groups yet</p>
            <p className="text-sm text-slate-400 mb-5">
              Create a group to start splitting expenses
            </p>
            <CreateJemawDialog>
              <Button size="sm" className="h-8 text-xs gap-1 px-4">
                <Plus className="w-3 h-3" />
                Create your first group
              </Button>
            </CreateJemawDialog>
          </div>
        ) : (
          <div>
            {jemaws.map((jemaw) => (
              <JemawCard key={jemaw.id} jemaw={jemaw} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
