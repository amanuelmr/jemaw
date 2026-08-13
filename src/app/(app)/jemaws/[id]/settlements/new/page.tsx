import Link from "next/link";
import { notFound } from "next/navigation";
import { getJemawById } from "@/actions/jemaws";
import { getServerSession } from "@/lib/session";
import { CreateSettlementForm } from "./create-settlement-form";
import { ArrowLeft } from "lucide-react";

export default async function NewSettlementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ receiverId?: string; amount?: string }>;
}) {
  const { id } = await params;
  const { receiverId: defaultReceiverId, amount: defaultAmount } = await searchParams;

  let jemaw;
  try {
    jemaw = await getJemawById(id);
  } catch {
    notFound();
  }

  const session = await getServerSession();
  const currentUserId = session!.user.id;

  const otherMembers = jemaw.members.filter((m) => m.userId !== currentUserId);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/jemaws/${id}`}
        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to {jemaw.name}
      </Link>
      <div className="mb-8 mt-6 border-b pb-6">
        <h1 className="text-3xl font-semibold tracking-[-0.045em]">Record a payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">{jemaw.name} · {jemaw.currency}</p>
      </div>
      <div className="mx-auto max-w-xl">
        <CreateSettlementForm
          jemawId={id}
          members={otherMembers}
          currency={jemaw.currency}
          defaultReceiverId={defaultReceiverId}
          defaultAmount={defaultAmount}
        />
      </div>
    </div>
  );
}
