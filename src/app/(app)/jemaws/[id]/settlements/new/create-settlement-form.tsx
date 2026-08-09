"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSettlement } from "@/actions/settlements";
import { uploadPaymentProof } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, ImageIcon } from "lucide-react";

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
}: {
  jemawId: string;
  members: Member[];
  currency?: string;
  defaultReceiverId?: string;
  defaultAmount?: string;
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
        router.push(`/jemaws/${jemawId}`);
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="receiver">Who did you pay?</Label>
        <Select value={receiverId} onValueChange={setReceiverId} required>
          <SelectTrigger id="receiver">
            <SelectValue placeholder="Select a member" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                {m.user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount ({currency})</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Note (optional)</Label>
        <Textarea
          id="description"
          placeholder="What was this payment for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Payment proof upload — required */}
      <div className="space-y-2">
        <Label>
          Payment proof screenshot <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Upload a screenshot of your bank transfer, mobile payment, or receipt.
          The receiver must see this before confirming payment.
        </p>

        {proofPreview ? (
          <div className="relative rounded-lg overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proofPreview}
              alt="Payment proof preview"
              className="w-full max-h-64 object-contain bg-muted"
            />
            <button
              type="button"
              onClick={removeProof}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <ImageIcon className="w-8 h-8" />
            <span className="text-sm font-medium">Click to upload screenshot</span>
            <span className="text-xs">PNG, JPG, WEBP up to 10MB</span>
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

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push(`/jemaws/${jemawId}`)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {uploading ? (
            <><Upload className="w-4 h-4 mr-2 animate-bounce" /> Uploading…</>
          ) : isPending ? (
            "Recording…"
          ) : (
            "Record payment"
          )}
        </Button>
      </div>
    </form>
  );
}
