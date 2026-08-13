import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 grid-cols-2 gap-[3px] rounded-[10px] bg-[#f3c767] p-[7px] shadow-[inset_0_0_0_1px_rgba(32,35,29,0.08)]",
        className
      )}
    >
      <span className="rounded-full bg-[#20231d]" />
      <span className="rounded-full bg-[#185c48]" />
      <span className="rounded-full bg-[#185c48]" />
      <span className="rounded-full bg-[#20231d]" />
    </span>
  );
}

export function Brand({
  href = "/dashboard",
  inverse = false,
  compact = false,
}: {
  href?: string;
  inverse?: boolean;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="Jemaw home">
      <BrandMark />
      {!compact && (
        <span
          className={cn(
            "text-[15px] font-extrabold uppercase tracking-[0.18em]",
            inverse ? "text-[#fffaf0]" : "text-[#20231d]"
          )}
        >
          Jemaw
        </span>
      )}
    </Link>
  );
}
