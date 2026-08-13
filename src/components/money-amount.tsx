import { cn, formatCurrency } from "@/lib/utils";

export function MoneyAmount({
  amount,
  currency,
  signed = false,
  className,
}: {
  amount: number | string;
  currency: string;
  signed?: boolean;
  className?: string;
}) {
  const value = Number(amount);
  const prefix = signed && value > 0 ? "+" : signed && value < 0 ? "−" : "";

  return (
    <span className={cn("font-money tabular-nums", className)}>
      {prefix}{formatCurrency(Math.abs(value), currency)}
    </span>
  );
}
