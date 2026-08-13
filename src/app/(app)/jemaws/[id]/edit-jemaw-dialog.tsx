"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateJemaw, archiveJemaw } from "@/actions/jemaws";
import type { SupportedCurrency } from "@/lib/constants";
import { CurrencyPicker } from "@/components/currency-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


type Props = {
  children: React.ReactNode;
  jemawId: string;
  initialName: string;
  initialDescription: string | null;
  initialCurrency: string;
};

export function EditJemawDialog({
  children,
  jemawId,
  initialName,
  initialDescription,
  initialCurrency,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [currency, setCurrency] = useState(initialCurrency);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await updateJemaw({
          jemawId,
          name,
          description: description || undefined,
          currency: currency as SupportedCurrency,
        });
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update group");
      }
    });
  }

  function handleArchive() {
    if (!confirmArchive) {
      setConfirmArchive(true);
      return;
    }
    startTransition(async () => {
      try {
        const result = await archiveJemaw({ jemawId });
        toast.success(result.message);
        router.push("/dashboard");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to archive group");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirmArchive(false); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Group settings</p>
          <DialogTitle className="text-2xl">Keep this circle recognisable</DialogTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">Update the details friends see when they open this group.</p>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="mt-1 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Group name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">A little context <span className="font-normal text-muted-foreground">optional</span></Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-currency">Currency</Label>
            <CurrencyPicker id="edit-currency" value={currency} onValueChange={setCurrency} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>

        <Separator />

        <div className="rounded-2xl bg-[#f5dfd9]/70 p-4">
          <p className="text-xs font-extrabold text-[#934438]">Done with this group?</p>
          <p className="mt-1 text-xs leading-relaxed text-[#785d57]">
            Archive it to hide it from everyone&apos;s active list. The full money history stays safe.
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="mt-3"
            disabled={isPending}
            onClick={handleArchive}
          >
            {confirmArchive ? "Click again to confirm archive" : "Archive group"}
          </Button>
          {confirmArchive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmArchive(false)}
            >
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
