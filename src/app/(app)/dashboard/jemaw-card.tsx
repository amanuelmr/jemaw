import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoneyAmount } from "@/components/money-amount";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/presentation";

type JemawWithBalance = {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  myBalance: string;
  members: { userId: string; user?: { name: string; image?: string | null } }[];
};

export function JemawCard({ jemaw, lastActivity }: { jemaw: JemawWithBalance; lastActivity?: string }) {
  const balance = Number(jemaw.myBalance);
  return (
    <Link href={`/jemaws/${jemaw.id}`} className="group grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b py-4 hover:bg-white sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:px-2">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="truncate text-sm font-semibold">{jemaw.name}</h3>
          <span className="font-mono text-[9px] text-muted-foreground">{jemaw.currency}</span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{lastActivity || jemaw.description || `${jemaw.members.length} people in this group`}</p>
        <div className="mt-2 flex -space-x-1.5 sm:hidden">
          {jemaw.members.slice(0, 4).map((member) => (
            <Avatar key={member.userId} className="size-5 border border-white">
              {member.user?.image && <AvatarImage src={member.user.image} alt={member.user.name} />}
              <AvatarFallback className="bg-muted text-[7px] font-semibold">{initials(member.user?.name || "Member")}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>

      <div className="hidden items-center sm:flex">
        <div className="flex -space-x-2">
          {jemaw.members.slice(0, 4).map((member) => (
            <Avatar key={member.userId} className="size-7 border-2 border-background">
              {member.user?.image && <AvatarImage src={member.user.image} alt={member.user.name} />}
              <AvatarFallback className="bg-muted text-[8px] font-semibold">{initials(member.user?.name || "Member")}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span className="ml-2 text-[10px] text-muted-foreground">{jemaw.members.length}</span>
      </div>

      <div className="flex items-center gap-3 text-right">
        <div>
          <MoneyAmount amount={balance} currency={jemaw.currency} signed className={cn("text-sm font-semibold", balance > 0 && "text-[#237a4b]", balance < 0 && "text-[#a13629]", balance === 0 && "text-muted-foreground")} />
          <p className="mt-1 text-[10px] text-muted-foreground">{balance > 0 ? "you are owed" : balance < 0 ? "you owe" : "even"}</p>
        </div>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
}
