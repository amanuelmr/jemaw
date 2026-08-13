"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inviteMember } from "@/actions/jemaws";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InviteMemberDialog({
  jemawId,
  children,
}: {
  jemawId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await inviteMember({ jemawId, email });
        toast.success(result.message);
        setOpen(false);
        setEmail("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send invitation");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <span className="mb-1 text-3xl">👋</span>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Grow the circle</p>
          <DialogTitle className="text-2xl">Bring a friend in</DialogTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">They&apos;ll be able to add expenses, see the journal, and settle their share.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-1 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <p className="rounded-2xl bg-[#e9e3d7] p-3 text-xs leading-relaxed text-[#676a62]">
            We&apos;ll send one friendly invitation with a private link. It expires after seven days.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending…" : "Invite friend"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
