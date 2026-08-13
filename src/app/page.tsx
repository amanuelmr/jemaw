import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, LockKeyhole, ReceiptText } from "lucide-react";
import { Brand } from "@/components/brand";
import { getServerSession } from "@/lib/session";

const people = [
  { name: "Mina", initials: "MI", color: "bg-[#d8e6dc]" },
  { name: "Leo", initials: "LE", color: "bg-[#f6d8cf]" },
  { name: "Sofia", initials: "SO", color: "bg-[#dce1ef]" },
  { name: "You", initials: "YO", color: "bg-[#eee2bd]" },
];

const situations = [
  {
    index: "01",
    title: "The weekend away",
    body: "One person books the apartment. Someone else gets dinner. Nobody keeps a second notes app open.",
    group: "Lisbon weekend",
    currency: "EUR",
    activity: "Mina added Train to Sintra",
    amount: "€68.40",
  },
  {
    index: "02",
    title: "The shared home",
    body: "Rent, internet, groceries, and the things no one remembers buying until the receipt appears.",
    group: "House on 8th",
    currency: "USD",
    activity: "Leo added September internet",
    amount: "$72.00",
  },
  {
    index: "03",
    title: "The group that keeps meeting",
    body: "A running place for dinners, tickets, taxis, and the next plan already forming in the chat.",
    group: "Sunday supper",
    currency: "GBP",
    activity: "Sofia confirmed your payment",
    amount: "£24.50",
  },
];

function Person({ person }: { person: (typeof people)[number] }) {
  return (
    <span title={person.name} className={`grid size-8 place-items-center rounded-full border-2 border-white text-[9px] font-semibold ${person.color}`}>
      {person.initials}
    </span>
  );
}

export default async function RootPage() {
  const session = await getServerSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center px-5 sm:px-8">
          <Brand href="/" />
          <nav className="ml-auto flex items-center gap-2" aria-label="Account">
            <Link href="/sign-in" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link href="/sign-up" className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-white hover:bg-[#30332e]">Create an account</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b">
          <div className="mx-auto grid max-w-[1320px] lg:grid-cols-[0.88fr_1.12fr]">
            <div className="flex min-h-[620px] flex-col justify-center border-b px-5 py-20 sm:px-8 lg:border-b-0 lg:border-r lg:px-12 xl:px-16">
              <p className="font-mono text-xs text-muted-foreground">For trips, homes, dinners, and everything between.</p>
              <h1 className="mt-7 max-w-2xl text-[clamp(3.25rem,7vw,6.6rem)] font-medium leading-[0.9] tracking-[-0.075em]">
                Shared expenses, without the payment chase.
              </h1>
              <p className="mt-8 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                Jemaw keeps every expense, approval, and payment in one shared record—so your group always knows what happened and what comes next.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/sign-up" className="inline-flex h-12 items-center gap-2 rounded-md bg-foreground px-5 text-sm font-semibold text-white hover:bg-[#30332e]">
                  Start a group <ArrowRight className="size-4" />
                </Link>
                <span className="text-xs text-muted-foreground">Free to start · No card required</span>
              </div>
            </div>

            <div className="flex items-center bg-white px-5 py-14 sm:px-8 lg:px-12 xl:px-16">
              <div className="w-full border-y border-foreground">
                <div className="flex items-start justify-between gap-5 border-b px-1 py-5">
                  <div>
                    <p className="text-xl font-semibold tracking-[-0.03em]">Lisbon weekend</p>
                    <p className="mt-1 text-xs text-muted-foreground">4 people · EUR</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xl font-semibold text-[#237a4b]">+€38.20</p>
                    <p className="mt-1 text-xs text-muted-foreground">owed to you</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 border-b px-1 py-4">
                  <div className="flex -space-x-2">{people.map((person) => <Person key={person.name} person={person} />)}</div>
                  <span className="font-mono text-[11px] text-muted-foreground">SAT 18:42</span>
                </div>

                <div className="border-b py-6">
                  <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3">
                    <Person person={people[0]} />
                    <div>
                      <p className="text-sm"><strong className="font-semibold">Mina</strong> added <strong className="font-semibold">Dinner at Prado</strong></p>
                      <p className="mt-1 text-xs text-muted-foreground">Mina paid · split equally between 4</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#8a6411]"><span className="size-1.5 rounded-full bg-[#d99a18]" />Your approval is needed</div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">€124.80</p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">you €31.20</p>
                    </div>
                  </div>
                  <div className="ml-11 mt-4 flex gap-2">
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-semibold text-white"><Check className="size-3.5" />Approve</span>
                    <span className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium">Review split</span>
                  </div>
                </div>

                <div className="border-b py-6">
                  <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3">
                    <Person person={people[2]} />
                    <div>
                      <p className="text-sm"><strong className="font-semibold">Sofia</strong> added <strong className="font-semibold">Train to Sintra</strong></p>
                      <p className="mt-1 text-xs text-muted-foreground">Sofia paid · approved by Leo</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#237a4b]"><span className="size-1.5 rounded-full bg-[#237a4b]" />Included in balances</div>
                    </div>
                    <p className="font-mono text-sm font-semibold">€68.40</p>
                  </div>
                </div>

                <div className="py-6">
                  <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3">
                    <Person person={people[1]} />
                    <div>
                      <p className="text-sm"><strong className="font-semibold">Leo</strong> paid you</p>
                      <p className="mt-1 text-xs text-muted-foreground">Bank transfer · waiting for confirmation</p>
                    </div>
                    <p className="font-mono text-sm font-semibold text-[#237a4b]">€22.00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-white">
          <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-2xl">
              <p className="font-mono text-xs text-muted-foreground">ONE RECORD. DIFFERENT KINDS OF GROUP.</p>
              <h2 className="mt-5 text-4xl font-medium leading-tight tracking-[-0.055em] sm:text-5xl">Money follows the plan. Jemaw keeps up.</h2>
            </div>
            <div className="mt-14 border-t border-foreground">
              {situations.map((situation) => (
                <article key={situation.index} className="grid gap-5 border-b py-8 md:grid-cols-[72px_0.8fr_1.2fr] md:items-start">
                  <span className="font-mono text-xs text-muted-foreground">{situation.index}</span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.025em]">{situation.title}</h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{situation.body}</p>
                  </div>
                  <div className="border-l-2 border-[#f15b3a] pl-4 md:ml-auto md:w-full md:max-w-lg">
                    <div className="flex items-center justify-between gap-4">
                      <div><p className="text-sm font-semibold">{situation.group}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{situation.currency}</p></div>
                      <p className="font-mono text-sm font-semibold">{situation.amount}</p>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">{situation.activity}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto grid max-w-[1320px] lg:grid-cols-[0.75fr_1.25fr]">
            <div className="border-b px-5 py-16 sm:px-8 lg:border-b-0 lg:border-r lg:px-12 xl:px-16">
              <p className="font-mono text-xs text-muted-foreground">THE TRUST PART</p>
              <h2 className="mt-5 text-4xl font-medium tracking-[-0.05em]">The numbers should be easy to believe.</h2>
            </div>
            <div className="divide-y bg-white px-5 sm:px-8 lg:px-12 xl:px-16">
              {[
                [ReceiptText, "Every change has a history", "Expenses and payments stay visible to the group. Approved records cannot quietly change later."],
                [Check, "Nothing counts before review", "Approvals make it clear who has seen a split and when it begins affecting balances."],
                [LockKeyhole, "Payments come with evidence", "Record an outside payment, attach proof, and let the receiver confirm it before balances move."],
              ].map(([Icon, title, body]) => {
                const ItemIcon = Icon as typeof Check;
                return (
                  <div key={title as string} className="grid grid-cols-[32px_1fr] gap-4 py-8">
                    <ItemIcon className="mt-0.5 size-5 text-[#f15b3a]" />
                    <div><h3 className="text-base font-semibold">{title as string}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{body as string}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#171916] text-white">
          <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-end lg:px-12 xl:px-16">
            <div><p className="font-mono text-xs text-white/50">YOUR NEXT SHARED TAB</p><h2 className="mt-4 max-w-2xl text-4xl font-medium tracking-[-0.055em] sm:text-5xl">Name the group. Add the people. Keep the record clear.</h2></div>
            <Link href="/sign-up" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#171916] hover:bg-[#e9eae5]">Create a group <ArrowRight className="size-4" /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t bg-[#171916] text-white/60">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-5 px-5 py-7 text-xs sm:px-8 lg:px-12 xl:px-16">
          <Brand href="/" inverse />
          <span>Shared expenses, kept clear.</span>
        </div>
      </footer>
    </div>
  );
}
