import Link from "next/link";
import { notFound } from "next/navigation";
import { getJemawById } from "@/actions/jemaws";
import { getServerSession } from "@/lib/session";
import { CreateSettlementForm } from "./create-settlement-form";
import { ArrowLeft } from "lucide-react";
import { getGroupEmoji } from "@/lib/presentation";

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
        className="inline-flex items-center gap-2 text-xs font-bold text-[#777a72] transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Back to {jemaw.name}
      </Link>
      <div className="mb-8 mt-7 flex items-center gap-4 border-b border-[#dcd5c8] pb-7">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#e4ded2] text-xl">{getGroupEmoji(jemaw.name)}</span>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">{jemaw.name}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-[#20231d]">Record a payment</h1>
        </div>
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
