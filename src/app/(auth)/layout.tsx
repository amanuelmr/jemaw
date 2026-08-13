import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { getServerSession } from "@/lib/session";

const events = [
  { time: "18:42", title: "Mina added Dinner at Prado", detail: "€124.80 · split between 4", state: "Waiting for review", active: true },
  { time: "18:47", title: "Leo approved the expense", detail: "Balances updated", state: "Approved", active: false },
  { time: "09:12", title: "Leo paid you €22.00", detail: "Bank transfer", state: "Needs confirmation", active: true },
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(420px,0.88fr)_minmax(520px,1.12fr)]">
      <main className="flex min-h-screen flex-col border-r bg-white px-5 py-6 sm:px-10 lg:px-12 xl:px-16">
        <Brand href="/" />
        <div className="my-auto flex justify-center py-14">{children}</div>
        <p className="text-xs text-muted-foreground">Expenses, approvals, and payments in one shared record.</p>
      </main>

      <aside className="hidden min-h-screen flex-col justify-between px-12 py-10 lg:flex xl:px-20 xl:py-14">
        <p className="font-mono text-xs text-muted-foreground">A GROUP LEDGER, NOT A GROUP CHAT THREAD</p>
        <div className="my-16 max-w-2xl">
          <div className="flex items-start justify-between gap-6 border-b border-foreground pb-5">
            <div><h2 className="text-2xl font-semibold tracking-[-0.04em]">Lisbon weekend</h2><p className="mt-1 text-xs text-muted-foreground">Mina, Leo, Sofia, and you · EUR</p></div>
            <div className="text-right"><p className="font-mono text-xl font-semibold text-[#237a4b]">+€38.20</p><p className="mt-1 text-xs text-muted-foreground">owed to you</p></div>
          </div>
          <div className="border-b">
            {events.map((event) => (
              <div key={`${event.time}-${event.title}`} className="grid grid-cols-[48px_10px_1fr_auto] gap-4 border-b py-6 last:border-0">
                <span className="font-mono text-[10px] text-muted-foreground">{event.time}</span>
                <span className={`mt-1.5 size-2 rounded-full ${event.active ? "bg-[#f15b3a]" : "bg-[#8b8f86]"}`} />
                <div><p className="text-sm font-medium">{event.title}</p><p className="mt-1 text-xs text-muted-foreground">{event.detail}</p></div>
                <span className="text-xs text-muted-foreground">{event.state}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="max-w-lg text-3xl font-medium leading-tight tracking-[-0.045em]">Everyone sees the same numbers. Everyone knows what happens next.</p>
      </aside>
    </div>
  );
}
