"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createSettlement } from "@/actions/settlements";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadPaymentProof } from "@/lib/cloudinary";
import { getCurrencyDecimalPlaces } from "@/lib/money";
import { initials } from "@/lib/presentation";
import { cn } from "@/lib/utils";

type Member = { userId: string; user: { id: string; name: string } };

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
  const decimalPlaces = getCurrencyDecimalPlaces(currency);
  const minimum = decimalPlaces === 0 ? "1" : `0.${"0".repeat(decimalPlaces - 1)}1`;
  const isLoading = uploading || isPending;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Choose a JPEG, PNG, or WebP image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  function removeProof() {
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!receiverId) { toast.error("Choose who received the payment"); return; }
    if (!proofFile) { toast.error("Upload proof of the payment"); return; }
    setUploading(true);
    let paymentProofUrl: string;
    try { paymentProofUrl = await uploadPaymentProof(proofFile); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not upload the image"); setUploading(false); return; }
    setUploading(false);
    startTransition(async () => {
      try {
        const result = await createSettlement({ jemawId, receiverId, amount, description: description || undefined, paymentProofUrl });
        toast.success(result.message);
        if (onSuccess) onSuccess(); else router.push(`/jemaws/${jemawId}`);
      } catch (error) { toast.error(error instanceof Error ? error.message : "Could not record the payment"); }
    });
  }

  if (members.length === 0) return <p className="text-sm text-muted-foreground">There is no other member to pay in this group.</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold">Who received the payment?</h2>
        <p className="mt-1 text-xs text-muted-foreground">They will be asked to confirm it.</p>
        <div className="mt-4 border-y border-foreground">
          {members.map((member) => (
            <button key={member.userId} type="button" onClick={() => setReceiverId(member.userId)} className={cn("flex w-full items-center gap-3 border-b p-3 text-left last:border-0", receiverId === member.userId ? "border-l-2 border-l-[#f15b3a] bg-[#fff7f4]" : "hover:bg-white") }>
              <Avatar className="size-8"><AvatarFallback className="bg-muted text-[9px] font-semibold">{initials(member.user.name)}</AvatarFallback></Avatar>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{member.user.name}</span>
              <span className={cn("grid size-5 place-items-center rounded-sm border", receiverId === member.userId ? "border-foreground bg-foreground text-white" : "border-input")}>{receiverId === member.userId && <Check className="size-3" />}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-end gap-3 border-b border-foreground pb-3 focus-within:border-[#f15b3a]">
        <span className="pb-1 font-mono text-sm text-muted-foreground">{currency}</span>
        <input id="amount" type="number" inputMode="decimal" step={minimum} min={minimum} placeholder={decimalPlaces === 0 ? "0" : `0.${"0".repeat(decimalPlaces)}`} value={amount} onChange={(event) => setAmount(event.target.value)} className="font-mono min-w-0 flex-1 bg-transparent text-4xl font-semibold tracking-[-0.05em] outline-none placeholder:text-[#c7cac2] sm:text-5xl" required />
      </div>

      <div className="space-y-1.5"><Label htmlFor="description">Note <span className="font-normal text-muted-foreground">optional</span></Label><Textarea id="description" placeholder="Bank transfer, cash, mobile payment…" value={description} onChange={(event) => setDescription(event.target.value)} rows={2} /></div>

      <section>
        <Label>Payment proof <span className="text-destructive">required</span></Label>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Attach a bank, mobile-money, or receipt screenshot so the receiver can check the payment.</p>
        {proofPreview ? (
          <div className="relative mt-3 overflow-hidden border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proofPreview} alt="Payment proof preview" className="max-h-72 w-full object-contain" />
            <button type="button" onClick={removeProof} className="absolute right-3 top-3 grid size-8 place-items-center rounded-md bg-foreground text-white" aria-label="Remove payment proof"><X className="size-4" /></button>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 flex w-full items-center gap-4 border border-dashed border-input p-5 text-left text-muted-foreground hover:border-foreground hover:text-foreground"><ImageIcon className="size-5" /><span><span className="block text-sm font-medium">Upload proof</span><span className="mt-1 block text-[10px]">JPEG, PNG, or WebP up to 10MB</span></span></button>
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
      </section>

      <div className="flex items-center justify-between gap-3 border-t pt-5">
        <Button type="button" variant="outline" onClick={() => onBack ? onBack() : router.push(`/jemaws/${jemawId}`)} disabled={isLoading}>{onBack ? "Back" : "Cancel"}</Button>
        <Button type="submit" disabled={isLoading || !receiverId || !amount || !proofFile}>{uploading ? <><Upload className="size-4 animate-bounce" />Uploading…</> : isPending ? "Recording…" : "Send for confirmation"}</Button>
      </div>
    </form>
  );
}
