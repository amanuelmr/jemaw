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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, cn } from "@/lib/utils";
import { getCategoryMeta, initials } from "@/lib/presentation";
import { ArrowLeft, ArrowRight, Check, ImageIcon, Upload, X } from "lucide-react";

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
  const [step, setStep] = useState(1);
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

  function continueToSplit() {
    if (!description.trim()) {
      toast.error("Tell your friends what this expense was for");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter the total amount");
      return;
    }
    setSplitValues(getDefaultSplitValues(splitType, selectedUserIds, amount, currency));
    setStep(2);
  }

  function continueToReview() {
    if (!selectedUserIds.some((userId) => userId !== currentUserId)) {
      toast.error("Select at least one other group member");
      return;
    }
    if (splitError || calculatedSplits.length !== selectedUserIds.length) {
      toast.error(splitError || "Complete the split before continuing");
      return;
    }
    setStep(3);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-8 flex items-center gap-2" aria-label={`Step ${step} of 3`}>
        {[1, 2, 3].map((item) => (
          <span key={item} className={cn("h-1.5 flex-1 rounded-full transition-colors", item <= step ? "bg-primary" : "bg-[#ddd6c9]")} />
        ))}
      </div>

      {step === 1 && (
        <section>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Step 1 · The expense</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">What happened?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Start with the total and a name everyone will recognise.</p>

          <div className="mt-8 flex items-end gap-3 border-b-2 border-[#aaa397] pb-3 focus-within:border-primary">
            <span className="pb-1 text-sm font-extrabold text-[#777a72]">{currency}</span>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              step={getCurrencyDecimalPlaces(currency) === 0 ? "1" : "0.01"}
              min={getCurrencyDecimalPlaces(currency) === 0 ? "1" : "0.01"}
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="font-money min-w-0 flex-1 bg-transparent text-5xl font-semibold outline-none placeholder:text-[#c9c2b5]"
              autoFocus
              required
            />
          </div>

          <div className="mt-7 space-y-2">
            <Label htmlFor="description">What was it for?</Label>
            <Input id="description" placeholder="Dinner at Ben Abeba" value={description} onChange={(event) => setDescription(event.target.value)} required />
          </div>

          <div className="mt-7">
            <Label>Pick a category</Label>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((item) => {
                const meta = getCategoryMeta(item);
                return (
                  <button key={item} type="button" onClick={() => setCategory(item)} className={cn("flex min-h-16 flex-col items-center justify-center rounded-2xl border px-2 py-2 text-center transition-all", category === item ? "border-primary bg-[#e4eee8] text-primary shadow-[inset_0_0_0_1px_#185c48]" : "border-[#ddd6c9] bg-card/50 text-[#676a62] hover:bg-card") }>
                    <span className="text-xl">{meta.emoji}</span>
                    <span className="mt-1 text-[10px] font-extrabold">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button type="button" onClick={continueToSplit}>Choose people <ArrowRight className="size-4" /></Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Step 2 · The split</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Who was part of it?</h2>
          <p className="mt-1 text-sm text-muted-foreground">You paid {formatCurrency(amount, currency)}. Choose who should share it.</p>

          <div className="mt-7 flex items-center justify-between gap-3">
            <div className="inline-flex rounded-full bg-[#e5ded2] p-1">
              {SPLIT_TYPES.map((option) => (
                <button key={option.value} type="button" aria-pressed={splitType === option.value} onClick={() => changeSplitType(option.value)} className={cn("rounded-full px-3 py-1.5 text-[11px] font-extrabold transition-colors", splitType === option.value ? "bg-[#fffdf7] text-[#20231d] shadow-sm" : "text-[#74776f]")}>{option.label}</button>
              ))}
            </div>
            <button type="button" className="text-xs font-extrabold text-primary hover:underline" onClick={() => {
              const allIds = members.map((member) => member.userId);
              setSelectedUserIds(allIds);
              setSplitValues(getDefaultSplitValues(splitType, allIds, amount, currency));
            }}>Select all</button>
          </div>

          <div className="mt-4 border-y border-[#dcd5c8]">
            {members.map((member) => {
              const isSelected = selectedUserIds.includes(member.userId);
              return (
                <div key={member.userId} className="grid min-h-[68px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-[#e2dbcf] py-3 last:border-0">
                  <button type="button" onClick={() => toggleParticipant(member.userId)} aria-label={`${isSelected ? "Remove" : "Include"} ${member.user.name}`} className={cn("grid size-5 place-items-center rounded-full border transition-colors", isSelected ? "border-primary bg-primary text-white" : "border-[#bdb6a9]")}>{isSelected && <Check className="size-3" />}</button>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="size-9"><AvatarFallback className="bg-[#d9e5de] text-[10px] font-extrabold text-[#315747]">{initials(member.user.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0"><p className="truncate text-sm font-extrabold">{member.userId === currentUserId ? "You" : member.user.name}</p><p className="text-[10px] text-muted-foreground">{isSelected ? "Included" : "Not included"}</p></div>
                  </div>
                  {isSelected && <span className="font-money text-base font-semibold tabular-nums">{splitPreview.has(member.userId) ? formatCurrency(splitPreview.get(member.userId)!, currency) : "—"}</span>}

                  {isSelected && splitType !== "equal" && (
                    <div className="col-start-2 col-span-2 mt-1 flex items-center justify-end gap-1.5">
                      {splitType === "exact" && <span className="text-xs text-muted-foreground">{currency}</span>}
                      <Input type="number" inputMode="decimal" min={splitType === "shares" || (splitType === "exact" && getCurrencyDecimalPlaces(currency) === 0) ? "1" : "0.01"} max={splitType === "percentage" ? "100" : undefined} step={splitType === "shares" ? "1" : getCurrencyDecimalPlaces(currency) === 0 && splitType === "exact" ? "1" : "0.01"} value={splitValues[member.userId] ?? ""} onChange={(event) => setSplitValues((current) => ({ ...current, [member.userId]: event.target.value }))} aria-label={`${member.user.name} ${splitType}`} className="h-9 w-28 text-right tabular-nums" />
                      {splitType === "percentage" && <span className="text-xs text-muted-foreground">%</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {splitError && amount && <p className="mt-3 text-xs font-semibold text-destructive">{splitError}</p>}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="size-4" />Back</Button>
            <Button type="button" onClick={continueToReview}>Review split <ArrowRight className="size-4" /></Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Step 3 · Check it</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Ready to share?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Everyone included will be able to review this expense.</p>

          <div className="paper-grid mt-7 rounded-[24px] bg-[#1d4f3f] p-6 text-[#fffaf0]">
            <div className="flex items-start gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-2xl">{getCategoryMeta(category).emoji}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{description}</p><p className="mt-1 text-xs text-[#bfd0c7]">You paid · {selectedMembers.length} people included</p></div>
              <p className="font-money text-2xl font-semibold">{formatCurrency(amount, currency)}</p>
            </div>
            <div className="mt-5 border-t border-white/15 pt-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9eb7aa]">Split {splitType}</p>
              <div className="mt-3 flex flex-wrap gap-2">{selectedMembers.map((member) => <span key={member.userId} className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold">{member.userId === currentUserId ? "You" : member.user.name} · {formatCurrency(splitPreview.get(member.userId) || 0, currency)}</span>)}</div>
            </div>
          </div>

          <div className="mt-6">
            <Label>Receipt <span className="font-normal text-muted-foreground">optional</span></Label>
            {receiptPreview ? (
              <div className="relative mt-2 overflow-hidden rounded-2xl border bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={receiptPreview} alt="Receipt preview" className="max-h-52 w-full object-contain" />
                <button type="button" onClick={removeReceipt} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-[#20231d]/75 text-white"><X className="size-4" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#bdb6a9] p-4 text-left text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <span className="grid size-10 place-items-center rounded-xl bg-[#e8e2d7]"><ImageIcon className="size-4" /></span>
                <span><span className="block text-xs font-extrabold">Attach a receipt</span><span className="text-[10px]">PNG, JPG or WebP up to 10MB</span></span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(2)} disabled={isLoading}><ArrowLeft className="size-4" />Back</Button>
            <Button type="submit" disabled={isLoading}>{uploading ? <><Upload className="size-4 animate-bounce" />Uploading…</> : isPending ? "Sharing…" : "Share expense"}</Button>
          </div>
        </section>
      )}
    </form>
  );
}
