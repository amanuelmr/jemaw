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
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
  "#06b6d4", "#e11d48",
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
    <div className="bg-background border rounded-md px-3 py-2 text-sm shadow-md">
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
    <div className="space-y-8">
      {byCategory.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Spending by category</h2>
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
                    outerRadius={90}
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
                      className="w-3 h-3 rounded-sm shrink-0"
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
          <h2 className="text-base font-semibold mb-4">Member balances</h2>
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
                      fill={entry.balance > 0 ? "#16a34a" : entry.balance < 0 ? "#dc2626" : "#94a3b8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Green = owed money · Red = owes money · Gray = settled
          </p>
        </div>
      )}
    </div>
  );
}
