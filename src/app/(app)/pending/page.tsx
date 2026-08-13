import { getPendingBillsForUser } from "@/actions/bills";
import { getPendingSettlementsForUser } from "@/actions/settlements";
import { PendingItems } from "./pending-items";

export default async function PendingPage() {
  const [pendingBills, pendingSettlements] = await Promise.all([
    getPendingBillsForUser(),
    getPendingSettlementsForUser(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">Your turn</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#20231d] sm:text-4xl">Requests</h1>
        <p className="mt-2 text-sm text-muted-foreground">A calm place to check expenses and confirm money you received.</p>
      </div>
      <PendingItems pendingBills={pendingBills} pendingSettlements={pendingSettlements} />
    </div>
  );
}
