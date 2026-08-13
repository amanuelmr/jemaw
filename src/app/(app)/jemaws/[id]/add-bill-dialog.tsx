"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateBillForm } from "./bills/new/create-bill-form";

type Member = {
  userId: string;
  user: { id: string; name: string };
};

export function AddBillDialog({
  children,
  jemawId,
  members,
  currentUserId,
  currency,
}: {
  children: React.ReactNode;
  jemawId: string;
  members: Member[];
  currentUserId: string;
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a bill</DialogTitle>
        </DialogHeader>
        <CreateBillForm
          jemawId={jemawId}
          members={members}
          currentUserId={currentUserId}
          currency={currency}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
