import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type JemawWithBalance = {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  myBalance: string;
  isAdmin: boolean;
  members: { id?: string; userId: string }[];
};

const GROUP_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-indigo-100 text-indigo-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
];

function getGroupColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % GROUP_COLORS.length;
  return GROUP_COLORS[hash];
}

export function JemawCard({ jemaw }: { jemaw: JemawWithBalance }) {
  const balance = parseFloat(jemaw.myBalance);
  const colorClass = getGroupColor(jemaw.name);
  const initial = jemaw.name.charAt(0).toUpperCase();

  return (
    <Link href={`/jemaws/${jemaw.id}`}>
      <div className="flex items-center px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer">
        {/* Group avatar */}
        <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center font-bold text-sm mr-4 shrink-0 select-none`}>
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900 text-sm truncate">{jemaw.name}</p>
            {jemaw.isAdmin && (
              <span className="text-[10px] text-indigo-600 font-medium shrink-0">Admin</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {jemaw.members.length} member{jemaw.members.length !== 1 ? "s" : ""} · {jemaw.currency}
          </p>
        </div>

        {/* Balance */}
        <div className="text-right shrink-0 ml-4">
          {balance === 0 ? (
            <p className="text-xs text-slate-400">Settled</p>
          ) : balance > 0 ? (
            <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(balance, jemaw.currency)}</p>
          ) : (
            <p className="text-sm font-semibold text-rose-500">−{formatCurrency(Math.abs(balance), jemaw.currency)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
