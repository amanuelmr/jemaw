"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const CATEGORY_COLORS = [
  "#185c48", "#e2a84a", "#c96951", "#4a82a8", "#7d6a9d", "#5f8d72",
  "#d48691", "#8a7657", "#43909a", "#b58e4e", "#547b91", "#a7554a",
];

type CategoryData = { category: string; total: number };
type BalanceData = { name: string; balance: number; userId: string };

function CategoryTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { value: number; payload: CategoryData }[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#ded8cb] bg-[#fffdf7] px-3 py-2 shadow-lg">
      <p className="text-xs capitalize text-muted-foreground">{payload[0].payload.category}</p>
      <p className="font-money text-sm font-semibold text-[#20231d]">{formatCurrency(payload[0].value, currency)}</p>
    </div>
  );
}

function BalanceTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { value: number; payload: BalanceData }[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-xl border border-[#ded8cb] bg-[#fffdf7] px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{payload[0].payload.name}</p>
      <p className={`font-money text-sm font-semibold ${value > 0 ? "text-[#19734f]" : value < 0 ? "text-[#b84837]" : "text-[#777a72]"}`}>
        {value === 0 ? "Even" : `${value > 0 ? "+" : "−"}${formatCurrency(Math.abs(value), currency)}`}
      </p>
    </div>
  );
}

export function StatsCharts({
  byCategory,
  memberBalances,
  totalSpent,
  currency,
}: {
  byCategory: CategoryData[];
  memberBalances: BalanceData[];
  totalSpent: number;
  currency: string;
}) {
  const categories = [...byCategory].sort((a, b) => b.total - a.total);
  const members = [...memberBalances].sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-14">
      {categories.length > 0 && (
        <section>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#85877f]">Where the money went</p>
          <h2 className="mb-7 mt-1 text-xl font-extrabold text-[#20231d]">Spending by category</h2>

          <ResponsiveContainer width="100%" height={categories.length <= 3 ? 180 : 240}>
            <BarChart data={categories} margin={{ top: 24, right: 8, left: 8, bottom: 4 }} barCategoryGap="40%">
              <XAxis
                dataKey="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#777a72" }}
                tickFormatter={(value: string) => value.charAt(0).toUpperCase() + value.slice(1)}
              />
              <YAxis hide />
              <Tooltip content={<CategoryTooltip currency={currency} />} cursor={{ fill: "rgba(24, 92, 72, 0.05)", radius: 6 }} />
              <Bar dataKey="total" radius={[6, 6, 2, 2]} maxBarSize={52}>
                {categories.map((category, index) => (
                  <Cell key={category.category} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} fillOpacity={0.9} />
                ))}
                <LabelList
                  dataKey="total"
                  position="top"
                  formatter={(value: unknown) => formatCurrency(value as number, currency)}
                  style={{ fontSize: 11, fill: "#686b64", fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {categories.map((category, index) => (
              <span key={category.category} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                <span className="capitalize">{category.category}</span>
                <span className="font-money text-[#9b9c94]">{Math.round((category.total / totalSpent) * 100)}%</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && members.length > 0 && <div className="border-t border-[#dcd5c8]" />}

      {members.length > 0 && (
        <section>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#85877f]">How the group stands</p>
          <h2 className="mb-7 mt-1 text-xl font-extrabold text-[#20231d]">Member balances</h2>

          <ResponsiveContainer width="100%" height={members.length * 48 + 20}>
            <BarChart layout="vertical" data={members} margin={{ top: 0, right: 90, left: 0, bottom: 0 }} barCategoryGap="38%">
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 13, fill: "#494d45", fontWeight: 600 }}
                width={88}
              />
              <ReferenceLine x={0} stroke="#dcd5c8" strokeWidth={1} />
              <Tooltip content={<BalanceTooltip currency={currency} />} cursor={{ fill: "rgba(73, 77, 69, 0.04)", radius: 4 }} />
              <Bar dataKey="balance" radius={[2, 5, 5, 2]} maxBarSize={12}>
                {members.map((member) => (
                  <Cell
                    key={member.userId}
                    fill={member.balance > 0 ? "#19734f" : member.balance < 0 ? "#b84837" : "#9b9c94"}
                    fillOpacity={0.9}
                  />
                ))}
                <LabelList
                  dataKey="balance"
                  position="right"
                  formatter={(value: unknown) => {
                    const amount = value as number;
                    return amount === 0 ? "Even" : `${amount > 0 ? "+" : "−"}${formatCurrency(Math.abs(amount), currency)}`;
                  }}
                  style={{ fontSize: 12, fill: "#686b64", fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-5 rounded-full bg-[#19734f]" />money coming back</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-5 rounded-full bg-[#b84837]" />money to pay</span>
          </div>
        </section>
      )}
    </div>
  );
}
