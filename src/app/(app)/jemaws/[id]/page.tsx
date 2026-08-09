import Link from "next/link";
import { notFound } from "next/navigation";
import { getJemawById } from "@/actions/jemaws";
import { getServerSession } from "@/lib/session";
import { JemawTabs } from "./jemaw-tabs";
import { InviteMemberDialog } from "./invite-member-dialog";
import { EditJemawDialog } from "./edit-jemaw-dialog";
import { SettleUpDialog } from "./settle-up-dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Plus, ArrowLeftRight, UserPlus, ArrowLeft, Settings, BarChart2 } from "lucide-react";

export default async function JemawPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let jemaw;
  try {
    jemaw = await getJemawById(id);
  } catch {
    notFound();
  }

  const session = await getServerSession();
  const currentUserId = session!.user.id;
  const balance = parseFloat(jemaw.myBalance);

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        All groups
      </Link>

      {/* Group header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900 truncate">{jemaw.name}</h1>
              <span className="text-xs font-mono text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                {jemaw.currency}
              </span>
            </div>
            {jemaw.description && (
              <p className="text-sm text-slate-500 mb-3">{jemaw.description}</p>
            )}
            <p className="text-sm font-semibold">
              {balance === 0 ? (
                <span className="text-slate-400">Settled up</span>
              ) : balance > 0 ? (
                <span className="text-emerald-600">+{formatCurrency(balance, jemaw.currency)} owed to you</span>
              ) : (
                <span className="text-rose-600">You owe {formatCurrency(Math.abs(balance), jemaw.currency)}</span>
              )}
            </p>
          </div>

          <div className="flex w-full items-center gap-2 flex-wrap sm:w-auto sm:justify-end sm:shrink-0">
            {jemaw.isAdmin && (
              <EditJemawDialog
                jemawId={id}
                initialName={jemaw.name}
                initialDescription={jemaw.description}
                initialCurrency={jemaw.currency}
              >
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Settings className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              </EditJemawDialog>
            )}
            <Link href={`/jemaws/${id}/stats`}>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <BarChart2 className="w-3.5 h-3.5 mr-1.5" />
                Stats
              </Button>
            </Link>
            <InviteMemberDialog jemawId={id}>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Invite
              </Button>
            </InviteMemberDialog>
            <SettleUpDialog jemawId={id} currency={jemaw.currency}>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" />
                Settle up
              </Button>
            </SettleUpDialog>
            <Link href={`/jemaws/${id}/bills/new`}>
              <Button size="sm" className="h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add bill
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <JemawTabs jemaw={jemaw} currentUserId={currentUserId} />
    </div>
  );
}
