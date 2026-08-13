import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, Download, MoreHorizontal, Plus, Settings, UserPlus } from "lucide-react";
import { getJemawById } from "@/actions/jemaws";
import { getServerSession } from "@/lib/session";
import { JemawTabs } from "./jemaw-tabs";
import { InviteMemberDialog } from "./invite-member-dialog";
import { EditJemawDialog } from "./edit-jemaw-dialog";
import { SettleUpDialog } from "./settle-up-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getGroupEmoji, initials } from "@/lib/presentation";

export default async function JemawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let jemaw;
  try {
    jemaw = await getJemawById(id);
  } catch {
    notFound();
  }

  const session = await getServerSession();
  const currentUserId = session!.user.id;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-[#777a72] transition-colors hover:text-primary">
        <ArrowLeft className="size-3.5" />All groups
      </Link>

      <header className="mt-6 border-b border-[#dcd5c8] pb-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-[19px] bg-[#e4ded2] text-2xl sm:size-16 sm:text-3xl">
              {getGroupEmoji(jemaw.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-3xl font-extrabold tracking-[-0.045em] text-[#20231d] sm:text-4xl">{jemaw.name}</h1>
                <span className="rounded-full bg-[#e8e2d7] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#686b63]">{jemaw.currency}</span>
              </div>
              {jemaw.description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#71746c]">{jemaw.description}</p>}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {jemaw.members.slice(0, 5).map((member) => (
                    <Avatar key={member.userId} className="size-7 border-2 border-background">
                      {member.user.image && <AvatarImage src={member.user.image} alt={member.user.name} />}
                      <AvatarFallback className="bg-[#d9e5de] text-[8px] font-extrabold text-[#315747]">{initials(member.user.name)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-[#8a8c85]">{jemaw.members.length} {jemaw.members.length === 1 ? "friend" : "friends"} sharing</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SettleUpDialog jemawId={id} currency={jemaw.currency}>
              <Button variant="secondary">Settle up</Button>
            </SettleUpDialog>
            <InviteMemberDialog jemawId={id}>
              <Button variant="ghost" size="icon" aria-label="Invite a friend" title="Invite a friend"><UserPlus className="size-4" /></Button>
            </InviteMemberDialog>
            {jemaw.isAdmin && (
              <EditJemawDialog jemawId={id} initialName={jemaw.name} initialDescription={jemaw.description} initialCurrency={jemaw.currency}>
                <Button variant="ghost" size="icon" aria-label="Group settings" title="Group settings"><Settings className="size-4" /></Button>
              </EditJemawDialog>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More group options"><MoreHorizontal className="size-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl bg-card p-1.5">
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link href={`/jemaws/${id}/stats`} className="cursor-pointer gap-2"><BarChart3 className="size-4" />Spending insights</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl">
                  <a href={`/api/jemaws/${id}/export`} download className="cursor-pointer gap-2"><Download className="size-4" />Export history</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild className="ml-auto sm:ml-1">
              <Link href={`/jemaws/${id}/bills/new`}><Plus className="size-4" />Add expense</Link>
            </Button>
          </div>
        </div>
      </header>

      <JemawTabs jemaw={jemaw} currentUserId={currentUserId} />
    </div>
  );
}
