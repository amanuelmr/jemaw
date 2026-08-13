"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createJemaw } from "@/actions/jemaws";
import type { SupportedCurrency } from "@/lib/constants";
import { CurrencyPicker } from "@/components/currency-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


export function CreateJemawDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await createJemaw({
          name,
          description: description || undefined,
          currency: currency as SupportedCurrency,
        });
        toast.success(result.message);
        setOpen(false);
        setName("");
        setDescription("");
        setCurrency("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create group");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create a group</DialogTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">Keep expenses, balances, and payments for one group in the same record.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-1 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="jemaw-name">Group name</Label>
            <Input
              id="jemaw-name"
              placeholder="Lalibela trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jemaw-desc">Description <span className="font-normal text-muted-foreground">optional</span></Label>
            <Textarea
              id="jemaw-desc"
              placeholder="A short note about this group"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5 border-t pt-5">
            <Label htmlFor="jemaw-currency">Group currency</Label>
            <CurrencyPicker id="jemaw-currency" value={currency} onValueChange={setCurrency} />
            <p className="text-xs leading-5 text-muted-foreground">All expenses and payments in this group use this currency.</p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !currency}>
              {isPending ? "Creating…" : "Create group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
