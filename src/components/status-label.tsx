import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  approved: "text-[#237a4b] before:bg-[#237a4b]",
  confirmed: "text-[#237a4b] before:bg-[#237a4b]",
  pending: "text-[#8a6411] before:bg-[#d99a18]",
  rejected: "text-[#a13629] before:bg-[#b33a2b]",
  settled: "text-[#656960] before:bg-[#8b8f86]",
};

export function StatusLabel({ status, className }: { status: string; className?: string }) {
  const label = status === "approved" ? "Approved" : status === "confirmed" ? "Confirmed" : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium before:size-1.5 before:rounded-full", STATUS_STYLES[status] ?? STATUS_STYLES.settled, className)}>
      {label}
    </span>
  );
}
