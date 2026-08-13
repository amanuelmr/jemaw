"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { SUPPORTED_CURRENCIES, getCurrencyLabel, getCurrencyName } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CurrencyPicker({
  value,
  onValueChange,
  id,
}: {
  value: string;
  onValueChange: (currency: string) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const currencies = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return SUPPORTED_CURRENCIES;
    return SUPPORTED_CURRENCIES.filter((currency) =>
      `${currency} ${getCurrencyName(currency)}`.toLowerCase().includes(term)
    );
  }, [query]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-white px-3.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={cn(!value && "text-muted-foreground")}>{value ? getCurrencyLabel(value) : "Choose a currency"}</span>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-[70] w-[var(--radix-popover-trigger-width)] rounded-lg border bg-white p-2 shadow-[0_16px_45px_rgba(0,0,0,0.14)]"
        >
          <div className="flex h-10 items-center gap-2 border-b px-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search code or currency"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <div role="listbox" aria-label="Currencies" className="mt-1 max-h-64 overflow-y-auto py-1">
            {currencies.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">No matching currency</p>
            ) : (
              currencies.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  role="option"
                  aria-selected={currency === value}
                  onClick={() => {
                    onValueChange(currency);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <span className="font-mono w-10 shrink-0 text-xs font-semibold">{currency}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{getCurrencyName(currency)}</span>
                  {currency === value && <Check className="size-4" />}
                </button>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
