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
import { initials } from "@/lib/presentation";

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
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-3.5" />All groups
      </Link>

      <header className="mt-5 border-b pb-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{jemaw.name}</h1>
                <span className="font-mono text-[10px] text-muted-foreground">{jemaw.currency}</span>
              </div>
              {jemaw.description && <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{jemaw.description}</p>}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {jemaw.members.slice(0, 5).map((member) => (
                    <Avatar key={member.userId} className="size-7 border-2 border-background">
                      {member.user.image && <AvatarImage src={member.user.image} alt={member.user.name} />}
                      <AvatarFallback className="bg-muted text-[8px] font-semibold">{initials(member.user.name)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">{jemaw.members.length} {jemaw.members.length === 1 ? "person" : "people"}</span>
              </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SettleUpDialog jemawId={id} currency={jemaw.currency} members={jemaw.members}>
              <Button variant="outline">Settle up</Button>
            </SettleUpDialog>
            <InviteMemberDialog jemawId={id}>
              <Button variant="ghost" size="icon" aria-label="Invite member" title="Invite member"><UserPlus className="size-4" /></Button>
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
              <DropdownMenuContent align="end" className="w-48 rounded-lg bg-white p-1.5">
                <DropdownMenuItem asChild className="rounded-md">
                  <Link href={`/jemaws/${id}/stats`} className="cursor-pointer gap-2"><BarChart3 className="size-4" />Spending insights</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-md">
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
      <Button asChild className="fixed bottom-20 right-4 z-30 shadow-lg md:hidden"><Link href={`/jemaws/${id}/bills/new`}><Plus className="size-4" />Add expense</Link></Button>
    </div>
  );
}
