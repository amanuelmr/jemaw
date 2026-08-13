"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSettlement } from "@/actions/settlements";
import { uploadPaymentProof } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/presentation";
import { Check, Upload, X, ImageIcon } from "lucide-react";

type Member = {
  userId: string;
  user: { id: string; name: string };
};

export function CreateSettlementForm({
  jemawId,
  members,
  currency = "USD",
  defaultReceiverId,
  defaultAmount,
  onSuccess,
  onBack,
}: {
  jemawId: string;
  members: Member[];
  currency?: string;
  defaultReceiverId?: string;
  defaultAmount?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [receiverId, setReceiverId] = useState(defaultReceiverId ?? "");
  const [amount, setAmount] = useState(defaultAmount ?? "");
  const [description, setDescription] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WebP image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  function removeProof() {
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!proofFile) {
      toast.error("Please upload a payment screenshot as proof");
      return;
    }

    if (!receiverId) {
      toast.error("Please select who you paid");
      return;
    }

    setUploading(true);
    let proofUrl: string;
    try {
      proofUrl = await uploadPaymentProof(proofFile);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
      setUploading(false);
      return;
    }
    setUploading(false);

    startTransition(async () => {
      try {
        const result = await createSettlement({
          jemawId,
          receiverId,
          amount,
          description: description || undefined,
          paymentProofUrl: proofUrl,
        });
        toast.success(result.message);
        if (onSuccess) onSuccess();
        else router.push(`/jemaws/${jemawId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to record settlement");
      }
    });
  }

  if (members.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No other members in this group to settle with.
      </p>
    );
  }

  const isLoading = uploading || isPending;

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Payment details</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Who did you pay?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose the friend who received your payment.</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {members.map((member) => (
            <button key={member.userId} type="button" onClick={() => setReceiverId(member.userId)} className={cn("flex items-center gap-3 rounded-2xl border p-3 text-left transition-all", receiverId === member.userId ? "border-primary bg-[#e4eee8] shadow-[inset_0_0_0_1px_#185c48]" : "border-[#dcd5c8] bg-card/50 hover:bg-card") }>
              <Avatar className="size-10"><AvatarFallback className="bg-[#d9e5de] text-[10px] font-extrabold text-[#315747]">{initials(member.user.name)}</AvatarFallback></Avatar>
              <span className="min-w-0 flex-1 truncate text-sm font-extrabold">{member.user.name}</span>
              <span className={cn("grid size-5 place-items-center rounded-full border", receiverId === member.userId ? "border-primary bg-primary text-white" : "border-[#bdb6a9]")}>{receiverId === member.userId && <Check className="size-3" />}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-end gap-3 border-b-2 border-[#aaa397] pb-3 focus-within:border-primary">
        <span className="pb-1 text-sm font-extrabold text-[#777a72]">{currency}</span>
        <input
          id="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-money min-w-0 flex-1 bg-transparent text-5xl font-semibold outline-none placeholder:text-[#c9c2b5]"
          required
        />
      </div>

      <div className="mt-7 space-y-2">
        <Label htmlFor="description">Note (optional)</Label>
        <Textarea
          id="description"
          placeholder="What was this payment for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="mt-7 space-y-2">
        <Label>
          Show that it was paid <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Add a bank, mobile money, or receipt screenshot so the receiver can confirm it.
        </p>

        {proofPreview ? (
          <div className="relative mt-3 overflow-hidden rounded-2xl border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proofPreview}
              alt="Payment proof preview"
              className="max-h-72 w-full object-contain"
            />
            <button
              type="button"
              onClick={removeProof}
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-[#20231d]/75 text-white hover:bg-[#20231d]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 flex w-full items-center gap-4 rounded-2xl border border-dashed border-[#bdb6a9] p-5 text-left text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-[#e8e2d7]"><ImageIcon className="size-5" /></span>
            <span><span className="block text-sm font-extrabold">Upload payment proof</span><span className="mt-1 block text-[10px]">PNG, JPG or WebP up to 10MB</span></span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onBack ? onBack() : router.push(`/jemaws/${jemawId}`)}
          disabled={isLoading}
        >
          {onBack ? "Back" : "Cancel"}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {uploading ? (
            <><Upload className="w-4 h-4 mr-2 animate-bounce" /> Uploading…</>
          ) : isPending ? (
            "Recording…"
          ) : (
            "Send for confirmation"
          )}
        </Button>
      </div>
    </form>
  );
}
