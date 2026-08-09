"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBill } from "@/actions/bills";
import { uploadReceipt } from "@/lib/cloudinary";
import {
  getCurrencyDecimalPlaces,
  normalizeExactMoneySplits,
  splitMoneyByPercentages,
  splitMoneyByShares,
  splitMoneyEqually,
} from "@/lib/money";
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

type SplitType = "equal" | "exact" | "percentage" | "shares";

const SPLIT_TYPES: Array<{ value: SplitType; label: string }> = [
  { value: "equal", label: "Equal" },
  { value: "exact", label: "Amounts" },
  { value: "percentage", label: "Percent" },
  { value: "shares", label: "Shares" },
];

function getDefaultSplitValues(
  type: SplitType,
  participantIds: string[],
  amount: string,
  currency: string
) {
  if (type === "equal") return {};
  if (type === "shares") {
    return Object.fromEntries(participantIds.map((userId) => [userId, "1"]));
  }
  if (type === "percentage") {
    const count = participantIds.length;
    if (count === 0) return {};
    const base = Math.floor(10000 / count);
    const remainder = 10000 % count;
    return Object.fromEntries(
      participantIds.map((userId, index) => {
        const basisPoints = base + (index < remainder ? 1 : 0);
        const value = (basisPoints / 100).toFixed(2).replace(/\.00$/, "");
        return [userId, value];
      })
    );
  }

  try {
    return Object.fromEntries(
      splitMoneyEqually(amount, participantIds, currency).map((split) => [
        split.userId,
        split.amount,
      ])
    );
  } catch {
    return Object.fromEntries(participantIds.map((userId) => [userId, ""]));
  }
}

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
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [selectedUserIds, setSelectedUserIds] = useState(() =>
    members.map((member) => member.userId)
  );
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedMembers = members.filter((member) =>
    selectedUserIds.includes(member.userId)
  );
  let calculatedSplits: Array<{ userId: string; amount: string }> = [];
  let splitError: string | null = null;
  let splitPreview = new Map<string, string>();
  if (amount && selectedUserIds.length > 0) {
    try {
      if (splitType === "equal") {
        calculatedSplits = splitMoneyEqually(amount, selectedUserIds, currency);
      } else if (splitType === "exact") {
        calculatedSplits = normalizeExactMoneySplits(
          amount,
          selectedUserIds.map((userId) => ({
            userId,
            amount: splitValues[userId] ?? "",
          })),
          currency
        );
      } else if (splitType === "percentage") {
        calculatedSplits = splitMoneyByPercentages(
          amount,
          selectedUserIds.map((userId) => ({
            userId,
            percentage: splitValues[userId] ?? "",
          })),
          currency
        );
      } else {
        calculatedSplits = splitMoneyByShares(
          amount,
          selectedUserIds.map((userId) => ({
            userId,
            shares: splitValues[userId] ?? "",
          })),
          currency
        );
      }
      splitPreview = new Map(
        calculatedSplits.map((split) => [split.userId, split.amount])
      );
    } catch (error) {
      splitError = error instanceof Error ? error.message : "Invalid split";
    }
  }

  function changeSplitType(nextType: SplitType) {
    setSplitType(nextType);
    setSplitValues(
      getDefaultSplitValues(nextType, selectedUserIds, amount, currency)
    );
  }

  function toggleParticipant(userId: string) {
    const selected = new Set(selectedUserIds);
    if (selected.has(userId)) selected.delete(userId);
    else selected.add(userId);

    const nextIds = members
      .map((member) => member.userId)
      .filter((memberId) => selected.has(memberId));
    setSelectedUserIds(nextIds);
    setSplitValues(getDefaultSplitValues(splitType, nextIds, amount, currency));
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

    if (!selectedUserIds.some((userId) => userId !== currentUserId)) {
      toast.error("Select at least one other group member");
      return;
    }
    if (splitError || calculatedSplits.length !== selectedUserIds.length) {
      toast.error(splitError || "Complete the split before adding the bill");
      return;
    }

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
          splitType,
          splits: selectedUserIds.map((userId) => ({
            userId,
            value: splitType === "equal" ? undefined : splitValues[userId],
          })),
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
          step={getCurrencyDecimalPlaces(currency) === 0 ? "1" : "0.01"}
          min={getCurrencyDecimalPlaces(currency) === 0 ? "1" : "0.01"}
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

      {/* Split editor */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4" />
            Split with {selectedMembers.length} of {members.length}
          </div>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => {
              const allIds = members.map((member) => member.userId);
              setSelectedUserIds(allIds);
              setSplitValues(
                getDefaultSplitValues(splitType, allIds, amount, currency)
              );
            }}
          >
            Select all
          </button>
        </div>

        <div className="grid grid-cols-4 rounded-lg bg-muted p-1 gap-1">
          {SPLIT_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={splitType === option.value}
              onClick={() => changeSplitType(option.value)}
              className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                splitType === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="divide-y">
          {members.map((member) => {
            const isSelected = selectedUserIds.includes(member.userId);
            return (
              <div
                key={member.userId}
                className="grid min-h-12 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleParticipant(member.userId)}
                  aria-label={`Include ${member.user.name} in this split`}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span
                  className={`min-w-0 flex-1 truncate ${
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {member.user.name}
                  {member.userId === currentUserId && (
                    <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                  )}
                </span>

                {isSelected && (
                  <span className="text-right font-medium tabular-nums">
                    {splitPreview.has(member.userId)
                      ? `${currency} ${splitPreview.get(member.userId)}`
                      : "—"}
                  </span>
                )}

                {isSelected && splitType !== "equal" && (
                  <div className="col-start-2 col-span-2 flex items-center justify-end gap-1.5">
                    {splitType === "exact" && (
                      <span className="text-xs text-muted-foreground">{currency}</span>
                    )}
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={
                        splitType === "shares" ||
                        (splitType === "exact" &&
                          getCurrencyDecimalPlaces(currency) === 0)
                          ? "1"
                          : "0.01"
                      }
                      max={splitType === "percentage" ? "100" : undefined}
                      step={
                        splitType === "shares"
                          ? "1"
                          : getCurrencyDecimalPlaces(currency) === 0 &&
                              splitType === "exact"
                            ? "1"
                            : "0.01"
                      }
                      value={splitValues[member.userId] ?? ""}
                      onChange={(event) =>
                        setSplitValues((current) => ({
                          ...current,
                          [member.userId]: event.target.value,
                        }))
                      }
                      aria-label={`${member.user.name} ${splitType}`}
                      className="h-8 w-24 text-right tabular-nums"
                    />
                    {splitType === "percentage" && (
                      <span className="text-xs text-muted-foreground">%</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {splitError && amount && (
          <p className="text-xs text-destructive">{splitError}</p>
        )}
        {!selectedUserIds.some((userId) => userId !== currentUserId) && (
          <p className="text-xs text-destructive">
            Select at least one other member for a shared bill.
          </p>
        )}
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
