"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createBill } from "@/actions/bills";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadReceipt } from "@/lib/cloudinary";
import {
  getCurrencyDecimalPlaces,
  normalizeExactMoneySplits,
  splitMoneyByPercentages,
  splitMoneyByShares,
  splitMoneyEqually,
} from "@/lib/money";
import { getCategoryMeta, initials } from "@/lib/presentation";
import { cn, formatCurrency } from "@/lib/utils";

const CATEGORIES = ["breakfast", "lunch", "dinner", "groceries", "transportation", "utilities", "rent", "entertainment", "vacation", "shopping", "healthcare", "other"] as const;
type SplitType = "equal" | "exact" | "percentage" | "shares";
type Member = { userId: string; user: { id: string; name: string } };
const SPLIT_TYPES: Array<{ value: SplitType; label: string; help: string }> = [
  { value: "equal", label: "Equal", help: "Same amount for everyone" },
  { value: "exact", label: "Amounts", help: "Enter each person’s amount" },
  { value: "percentage", label: "Percent", help: "Divide by percentage" },
  { value: "shares", label: "Shares", help: "Use relative shares" },
];

function getDefaultSplitValues(type: SplitType, participantIds: string[], amount: string, currency: string) {
  if (type === "equal") return {};
  if (type === "shares") return Object.fromEntries(participantIds.map((userId) => [userId, "1"]));
  if (type === "percentage") {
    if (participantIds.length === 0) return {};
    const base = Math.floor(10000 / participantIds.length);
    const remainder = 10000 % participantIds.length;
    return Object.fromEntries(participantIds.map((userId, index) => [userId, ((base + (index < remainder ? 1 : 0)) / 100).toFixed(2).replace(/\.00$/, "")]));
  }
  try { return Object.fromEntries(splitMoneyEqually(amount, participantIds, currency).map((split) => [split.userId, split.amount])); }
  catch { return Object.fromEntries(participantIds.map((userId) => [userId, ""])); }
}

export function CreateBillForm({ jemawId, members, currentUserId, currency, onSuccess }: { jemawId: string; members: Member[]; currentUserId: string; currency: string; onSuccess?: () => void }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [selectedUserIds, setSelectedUserIds] = useState(() => members.map((member) => member.userId));
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  let calculatedSplits: Array<{ userId: string; amount: string }> = [];
  let splitError: string | null = null;
  let splitPreview = new Map<string, string>();
  if (amount && selectedUserIds.length > 0) {
    try {
      if (splitType === "equal") calculatedSplits = splitMoneyEqually(amount, selectedUserIds, currency);
      else if (splitType === "exact") calculatedSplits = normalizeExactMoneySplits(amount, selectedUserIds.map((userId) => ({ userId, amount: splitValues[userId] ?? "" })), currency);
      else if (splitType === "percentage") calculatedSplits = splitMoneyByPercentages(amount, selectedUserIds.map((userId) => ({ userId, percentage: splitValues[userId] ?? "" })), currency);
      else calculatedSplits = splitMoneyByShares(amount, selectedUserIds.map((userId) => ({ userId, shares: splitValues[userId] ?? "" })), currency);
      splitPreview = new Map(calculatedSplits.map((split) => [split.userId, split.amount]));
    } catch (error) { splitError = error instanceof Error ? error.message : "Invalid split"; }
  }

  const decimalPlaces = getCurrencyDecimalPlaces(currency);
  const minimum = decimalPlaces === 0 ? "1" : `0.${"0".repeat(decimalPlaces - 1)}1`;
  const isLoading = uploading || isPending;
  const canSubmit = Boolean(description.trim() && amount && Number(amount) > 0 && selectedUserIds.some((id) => id !== currentUserId) && !splitError && calculatedSplits.length === selectedUserIds.length);

  function changeSplitType(nextType: SplitType) {
    setSplitType(nextType);
    setSplitValues(getDefaultSplitValues(nextType, selectedUserIds, amount, currency));
  }

  function toggleParticipant(userId: string) {
    const selected = new Set(selectedUserIds);
    if (selected.has(userId)) selected.delete(userId); else selected.add(userId);
    const nextIds = members.map((member) => member.userId).filter((id) => selected.has(id));
    setSelectedUserIds(nextIds);
    setSplitValues(getDefaultSplitValues(splitType, nextIds, amount, currency));
  }

  function selectEveryone() {
    const ids = members.map((member) => member.userId);
    setSelectedUserIds(ids);
    setSplitValues(getDefaultSplitValues(splitType, ids, amount, currency));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Choose a JPEG, PNG, or WebP image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  function removeReceipt() {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) { toast.error(splitError || "Complete the expense and include at least one other person"); return; }
    let receiptUrl: string | undefined;
    if (receiptFile) {
      setUploading(true);
      try { receiptUrl = await uploadReceipt(receiptFile); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Could not upload the receipt"); setUploading(false); return; }
      setUploading(false);
    }
    startTransition(async () => {
      try {
        const result = await createBill({
          jemawId, description, amount, category: category as (typeof CATEGORIES)[number], splitType,
          splits: selectedUserIds.map((userId) => ({ userId, value: splitType === "equal" ? undefined : splitValues[userId] })),
          receiptUrl,
        });
        toast.success(result.message);
        if (onSuccess) onSuccess(); else router.push(`/jemaws/${jemawId}`);
      } catch (error) { toast.error(error instanceof Error ? error.message : "Could not add the expense"); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section>
        <div className="flex items-end gap-3 border-b border-foreground pb-3 focus-within:border-[#f15b3a]">
          <span className="pb-1 font-mono text-sm text-muted-foreground">{currency}</span>
          <input id="amount" type="number" inputMode="decimal" step={minimum} min={minimum} placeholder={decimalPlaces === 0 ? "0" : `0.${"0".repeat(decimalPlaces)}`} value={amount} onChange={(event) => setAmount(event.target.value)} className="font-mono min-w-0 flex-1 bg-transparent text-4xl font-semibold tracking-[-0.05em] outline-none placeholder:text-[#c7cac2] sm:text-5xl" autoFocus required />
        </div>
        <div className="mt-6 space-y-1.5"><Label htmlFor="description">What was this for?</Label><Input id="description" placeholder="Dinner, train tickets, groceries…" value={description} onChange={(event) => setDescription(event.target.value)} required /></div>
        <p className="mt-3 text-xs text-muted-foreground">Paid by <span className="font-medium text-foreground">you</span></p>
      </section>

      <section>
        <div className="flex items-end justify-between border-b border-foreground pb-3"><div><h2 className="text-sm font-semibold">Split with</h2><p className="mt-1 text-xs text-muted-foreground">Everyone is included by default.</p></div><button type="button" onClick={selectEveryone} className="text-xs font-medium underline underline-offset-4">Select everyone</button></div>
        <div>
          {members.map((member) => {
            const selected = selectedUserIds.includes(member.userId);
            return (
              <div key={member.userId} className="grid min-h-14 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-b py-3">
                <button type="button" onClick={() => toggleParticipant(member.userId)} aria-label={`${selected ? "Remove" : "Include"} ${member.user.name}`} className={cn("grid size-5 place-items-center rounded-sm border", selected ? "border-foreground bg-foreground text-white" : "border-input bg-white")}>{selected && <Check className="size-3" />}</button>
                <div className="flex min-w-0 items-center gap-2.5"><Avatar className="size-7"><AvatarFallback className="bg-muted text-[8px] font-semibold">{initials(member.user.name)}</AvatarFallback></Avatar><span className="truncate text-sm font-medium">{member.userId === currentUserId ? "You" : member.user.name}</span></div>
                {selected && <div className="flex items-center gap-1.5">{splitType !== "equal" && <>{splitType === "exact" && <span className="font-mono text-[10px] text-muted-foreground">{currency}</span>}<Input type="number" inputMode="decimal" min={splitType === "shares" ? "1" : minimum} max={splitType === "percentage" ? "100" : undefined} step={splitType === "shares" ? "1" : minimum} value={splitValues[member.userId] ?? ""} onChange={(event) => setSplitValues((values) => ({ ...values, [member.userId]: event.target.value }))} aria-label={`${member.user.name} ${splitType}`} className="h-8 w-24 text-right font-mono text-xs" />{splitType === "percentage" && <span className="text-xs text-muted-foreground">%</span>}</>}<span className={cn("font-mono text-xs font-medium", splitType !== "equal" && "hidden sm:inline")}>{splitPreview.has(member.userId) ? formatCurrency(splitPreview.get(member.userId)!, currency) : "—"}</span></div>}
              </div>
            );
          })}
        </div>

        <details className="border-b group" open={splitType !== "equal"}>
          <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-medium">Split method <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">{SPLIT_TYPES.find((item) => item.value === splitType)?.label}<ChevronDown className="size-4 transition-transform group-open:rotate-180" /></span></summary>
          <div className="grid gap-px border-t bg-border sm:grid-cols-2">
            {SPLIT_TYPES.map((option) => <button key={option.value} type="button" onClick={() => changeSplitType(option.value)} className={cn("bg-white p-3 text-left", splitType === option.value && "border-l-2 border-[#f15b3a] bg-[#fff7f4]")}><span className="block text-xs font-semibold">{option.label}</span><span className="mt-1 block text-[10px] text-muted-foreground">{option.help}</span></button>)}
          </div>
        </details>
        {splitError && amount && <p className="mt-3 border-l-2 border-destructive pl-3 text-xs text-destructive">{splitError}</p>}
      </section>

      <details className="border-y group">
        <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-medium">Category and receipt <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" /></summary>
        <div className="space-y-5 border-t py-5">
          <div className="space-y-1.5"><Label htmlFor="category">Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="category"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((item) => <SelectItem key={item} value={item}>{getCategoryMeta(item).label}</SelectItem>)}</SelectContent></Select></div>
          <div>
            <Label>Receipt <span className="font-normal text-muted-foreground">optional</span></Label>
            {receiptPreview ? (
              <div className="mt-2 flex items-center gap-3 border p-3">
                <div className="size-12 overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={receiptPreview} alt="Receipt preview" className="size-full object-cover" />
                </div>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{receiptFile?.name}</p><p className="mt-1 text-[10px] text-muted-foreground">Ready to attach</p></div>
                <button type="button" onClick={removeReceipt} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted" aria-label="Remove receipt"><X className="size-4" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 flex w-full items-center gap-3 border border-dashed border-input p-4 text-left hover:border-foreground"><ImageIcon className="size-4 text-muted-foreground" /><span><span className="block text-xs font-medium">Attach receipt</span><span className="mt-1 block text-[10px] text-muted-foreground">JPEG, PNG, or WebP up to 10MB</span></span></button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
          </div>
        </div>
      </details>

      <div className="sticky bottom-16 -mx-4 flex items-center justify-between gap-4 border-y bg-background/95 px-4 py-4 backdrop-blur md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:pb-0">
        <div className="min-w-0"><p className="text-xs font-medium">{selectedUserIds.length} {selectedUserIds.length === 1 ? "person" : "people"} included</p><p className="mt-1 truncate text-[10px] text-muted-foreground">Balances change after another participant approves.</p></div>
        <Button type="submit" disabled={isLoading || !canSubmit}>{uploading ? <><Upload className="size-4 animate-bounce" />Uploading…</> : isPending ? "Adding…" : "Add expense"}</Button>
      </div>
    </form>
  );
}
