import { getPendingBillsForUser } from "@/actions/bills";
import { getPendingSettlementsForUser } from "@/actions/settlements";
import { PendingItems } from "./pending-items";
import { getServerSession } from "@/lib/session";
import { PageHeader } from "@/components/page-header";

export default async function PendingPage() {
  const [session, pendingBills, pendingSettlements] = await Promise.all([
    getServerSession(),
    getPendingBillsForUser(),
    getPendingSettlementsForUser(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader className="mb-9" title="Requests" description="Review an expense before it affects balances, or confirm a payment you received." />
      <PendingItems pendingBills={pendingBills} pendingSettlements={pendingSettlements} currentUserId={session!.user.id} />
    </div>
  );
}
