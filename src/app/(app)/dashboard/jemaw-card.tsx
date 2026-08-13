import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { getGroupEmoji, initials } from "@/lib/presentation";

type JemawWithBalance = {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  myBalance: string;
  isAdmin: boolean;
  members: {
    id?: string;
    userId: string;
    user?: { name: string; image?: string | null };
  }[];
};

export function JemawCard({ jemaw }: { jemaw: JemawWithBalance }) {
  const balance = Number(jemaw.myBalance);
  return (
    <Link
      href={`/jemaws/${jemaw.id}`}
      className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-t border-[#dcd5c8] py-5 transition-colors hover:border-[#9faf9f] sm:gap-5 sm:py-6"
    >
      <div className="grid size-12 place-items-center rounded-[17px] bg-[#e4ded2] text-xl transition-transform group-hover:-rotate-3 group-hover:scale-105 sm:size-14">
        {getGroupEmoji(jemaw.name)}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[15px] font-extrabold text-[#20231d] sm:text-base">{jemaw.name}</h3>
          {jemaw.isAdmin && <span className="rounded-full bg-[#e5ede8] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary">Host</span>}
        </div>
        <p className="mt-0.5 truncate text-xs text-[#73766e]">
          {jemaw.description || `${jemaw.members.length} ${jemaw.members.length === 1 ? "person" : "people"} sharing in ${jemaw.currency}`}
        </p>
        <div className="mt-2 flex items-center">
          <div className="flex -space-x-2">
            {jemaw.members.slice(0, 4).map((member) => (
              <Avatar key={member.userId} className="size-6 border-2 border-[#f5f1e8]">
                {member.user?.image && <AvatarImage src={member.user.image} alt={member.user.name} />}
                <AvatarFallback className="bg-[#d9e5de] text-[8px] font-extrabold text-[#315747]">{initials(member.user?.name || "Member")}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="ml-2 text-[10px] font-semibold text-[#92938c]">{jemaw.members.length} members</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-right">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#96968e]">
            {balance > 0 ? "You get back" : balance < 0 ? "You owe" : "All square"}
          </p>
          <p className={`mt-1 font-money text-lg font-semibold tabular-nums sm:text-xl ${balance > 0 ? "text-[#19734f]" : balance < 0 ? "text-[#bd4b3d]" : "text-[#6f7169]"}`}>
            {balance > 0 ? "+" : balance < 0 ? "−" : ""}{formatCurrency(Math.abs(balance), jemaw.currency)}
          </p>
        </div>
        <span className="hidden size-9 place-items-center rounded-full bg-[#e7e1d5] text-[#4b5049] transition-all group-hover:bg-primary group-hover:text-white sm:grid">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
