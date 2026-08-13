import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-mono inline-flex h-7 min-w-7 shrink-0 items-center justify-center border border-current px-1 text-[12px] font-semibold tracking-[-0.08em]",
        className
      )}
    >
      j<span className="text-[#f15b3a]">.</span>
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
    <Link href={href} className="inline-flex items-center gap-2" aria-label="Jemaw home">
      {compact && <BrandMark className={inverse ? "text-white" : "text-[#171916]"} />}
      {!compact && (
        <span
          className={cn(
            "text-[19px] font-semibold tracking-[-0.055em]",
            inverse ? "text-white" : "text-[#171916]"
          )}
        >
          jemaw<span className="text-[#f15b3a]">.</span>
        </span>
      )}
    </Link>
  );
}
