import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { SplitSquareVertical, Receipt, Users, CheckCircle, ArrowRight } from "lucide-react";

export default async function RootPage() {
  const session = await getServerSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white">
      {/* Nav — transparent, sits over hero */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16">
        <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <SplitSquareVertical className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-base drop-shadow-sm">Jemaw</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-white/80 hover:text-white transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm bg-white text-slate-900 hover:bg-slate-100 px-4 py-1.5 rounded-lg font-semibold transition-colors shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — full-bleed editorial layout */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Full-bleed background photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&q=85"
          alt="Friends sharing a meal"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark overlay — left heavy, fades right */}
        <div className="absolute inset-0 bg-slate-950/60" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 h-screen flex flex-col justify-center">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-widest mb-6">
              <span className="w-5 h-px bg-white/40" />
              Expense sharing
            </span>

            <h1 className="text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-7">
              Every shared<br />
              expense,<br />
              <span className="text-indigo-300">settled.</span>
            </h1>

            <p className="text-lg text-white/65 leading-relaxed mb-10 max-w-md">
              Track bills, approve expenses, and settle up with your group — all in one place. No more WhatsApp math.
            </p>

            <div className="flex items-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg"
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors backdrop-blur-sm"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Floating UI cards */}
        {/* Bill card — bottom right */}
        <div className="absolute bottom-16 right-16 hidden lg:block">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/60 p-5 w-64">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Latest bill</span>
              <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">Pending</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">Hotel in Lalibela</p>
            <p className="text-2xl font-bold text-slate-900 mb-3">2,800</p>
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {["Y", "M", "A", "B"].map((l) => (
                  <div key={l} className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">{l}</span>
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-400 ml-1">Split 4 ways</span>
            </div>
          </div>
        </div>

        {/* Balance card — middle right */}
        <div className="absolute top-1/2 -translate-y-1/2 right-24 hidden xl:block">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/60 px-5 py-4">
            <p className="text-xs font-medium text-slate-400 mb-1">Your balance</p>
            <p className="text-xl font-bold text-emerald-600">+1,200</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-xs text-slate-400">owed to you</p>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/30">
          <div className="w-px h-10 bg-white/20" />
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-28">
        <div className="max-w-6xl mx-auto px-8">
          <div className="max-w-sm mb-16">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Features</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-3 leading-tight">Everything your group needs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: Receipt,
                title: "Track bills",
                desc: "Add expenses with receipt photos. Every transaction is logged and visible to the whole group.",
              },
              {
                icon: Users,
                title: "Split fairly",
                desc: "Equal splits calculated instantly. Every member sees their exact share before approving.",
              },
              {
                icon: CheckCircle,
                title: "Settle up",
                desc: "Upload payment proof and get confirmed by the receiver. No disputes, full transparency.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-6">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Second photo section — full-bleed reversed */}
      <section className="relative h-[520px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1800&q=85"
          alt="Friends on a trip"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="relative z-10 max-w-6xl mx-auto px-8 h-full flex items-center">
          <div className="max-w-lg">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Built for real life</span>
            <h2 className="text-4xl font-bold text-white mt-3 mb-5 leading-snug">
              For trips, dinners,<br />housemates — any group.
            </h2>
            <p className="text-white/60 leading-relaxed mb-8 max-w-sm">
              Whether it&apos;s a weekend getaway, a shared apartment, or a group lunch — Jemaw keeps everyone on the same page.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg"
            >
              Start a group <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">How it works</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-3">Up and running in minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
            <div className="hidden md:block absolute top-7 left-[calc(16.6%+1rem)] right-[calc(16.6%+1rem)] h-px border-t-2 border-dashed border-slate-200" />
            {[
              { n: "1", title: "Create a group", desc: "Invite your friends, housemates, or travel crew." },
              { n: "2", title: "Add bills together", desc: "Anyone can add expenses. Members approve their share." },
              { n: "3", title: "Settle up", desc: "Pay and upload proof. Done — no chasing, no confusion." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center px-8 relative">
                <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-5 z-10 shadow-sm">
                  <span className="text-xl font-bold text-slate-300">{n}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-24">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-3">Ready to start splitting?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Join groups already using Jemaw to stay fair.</p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 hover:bg-slate-50 px-8 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-lg"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-10">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
              <SplitSquareVertical className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Jemaw</span>
            <span className="text-slate-600 text-sm ml-3">© 2025</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/sign-in" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">Sign in</Link>
            <Link href="/sign-up" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
