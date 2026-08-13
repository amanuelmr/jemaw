"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const COLORS = [
  "#185c48", "#e2a84a", "#c96951", "#4a82a8", "#7d6a9d",
  "#5f8d72", "#d48691", "#8a7657", "#43909a", "#b58e4e",
  "#547b91", "#a7554a",
];

type CategoryData = { category: string; total: number };
type BalanceData = { name: string; balance: number; userId: string };

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#ded8cb] bg-[#fffdf7] px-3 py-2 text-sm shadow-lg">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-muted-foreground">{formatCurrency(payload[0].value, currency)}</p>
    </div>
  );
}

export function StatsCharts({
  byCategory,
  memberBalances,
  currency,
}: {
  byCategory: CategoryData[];
  memberBalances: BalanceData[];
  currency: string;
}) {
  return (
    <div className="space-y-14">
      {byCategory.length > 0 && (
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#85877f]">Where the money went</p>
          <h2 className="mb-5 mt-1 text-xl font-extrabold">Spending by category</h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={92}
                    labelLine={false}
                  >
                    {byCategory.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip currency={currency} />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs capitalize">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 w-full">
              {byCategory.map((cat, i) => (
                <div key={cat.category} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="capitalize">{cat.category}</span>
                  </div>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(cat.total, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {memberBalances.length > 0 && (
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#85877f]">How the group stands</p>
          <h2 className="mb-5 mt-1 text-xl font-extrabold">Member balances</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={memberBalances}
                margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => formatCurrency(v, currency)}
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value), currency),
                    "Balance",
                  ]}
                />
                <Bar
                  dataKey="balance"
                  radius={[4, 4, 0, 0]}
                  fill="#6366f1"
                  // Color bars: green if positive, red if negative
                  label={false}
                >
                  {memberBalances.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.balance > 0 ? "#19734f" : entry.balance < 0 ? "#b84837" : "#9b9c94"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-center text-[10px] font-semibold text-muted-foreground">
            Green is money coming back · Red is money to pay · Gray is even
          </p>
        </div>
      )}
    </div>
  );
}
