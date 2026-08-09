"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBill } from "@/actions/bills";
import { uploadReceipt } from "@/lib/cloudinary";
import { splitMoneyEqually } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageIcon, Upload, X, Users } from "lucide-react";

const CATEGORIES = [
  "breakfast", "lunch", "dinner", "groceries", "transportation",
  "utilities", "rent", "entertainment", "vacation", "shopping",
  "healthcare", "other",
] as const;

type Member = {
  userId: string;
  user: { id: string; name: string };
};

export function CreateBillForm({
  jemawId,
  members,
  currentUserId,
  currency,
}: {
  jemawId: string;
  members: Member[];
  currentUserId: string;
  currency: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const splitUserIds = members.map((m) => m.userId);
  let splitPreview = new Map<string, string>();
  if (amount && splitUserIds.length > 0) {
    try {
      splitPreview = new Map(
        splitMoneyEqually(amount, splitUserIds, currency).map((split) => [
          split.userId,
          split.amount,
        ])
      );
    } catch {
      splitPreview = new Map();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Please select a JPEG, PNG, or WebP image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  function removeReceipt() {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let receiptUrl: string | undefined;
    if (receiptFile) {
      setUploading(true);
      try {
        receiptUrl = await uploadReceipt(receiptFile);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload receipt");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    startTransition(async () => {
      try {
        const result = await createBill({
          jemawId,
          description,
          amount,
          category: category as (typeof CATEGORIES)[number],
          splitUserIds,
          receiptUrl,
        });
        toast.success(result.message);
        router.push(`/jemaws/${jemawId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create bill");
      }
    });
  }

  const isLoading = uploading || isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Dinner at restaurant..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
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
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Split summary */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="w-4 h-4" />
          Split equally among all {members.length} members
        </div>
        <div className="divide-y">
          {members.map((m) => (
            <div key={m.userId} className="flex justify-between py-1.5 text-sm">
              <span className="text-muted-foreground">
                {m.user.name}
                {m.userId === currentUserId && <span className="ml-1 text-xs">(you)</span>}
              </span>
              <span className="font-medium tabular-nums">
                {splitPreview.has(m.userId)
                  ? `${currency} ${splitPreview.get(m.userId)}`
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Optional receipt upload */}
      <div className="space-y-2">
        <Label>Receipt / Invoice (optional)</Label>
        {receiptPreview ? (
          <div className="relative rounded-lg overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptPreview}
              alt="Receipt preview"
              className="w-full max-h-48 object-contain bg-muted"
            />
            <button
              type="button"
              onClick={removeReceipt}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <ImageIcon className="w-6 h-6" />
            <span className="text-sm">Click to attach receipt (optional)</span>
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
          ) : isPending ? "Adding…" : "Add bill"}
        </Button>
      </div>
    </form>
  );
}
