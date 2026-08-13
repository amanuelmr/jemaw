import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { Brand } from "@/components/brand";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="paper-grid relative hidden min-h-screen overflow-hidden bg-[#1d4f3f] p-10 text-[#fffaf0] lg:flex lg:flex-col xl:p-14">
        <Brand href="/sign-in" inverse />
        <div className="my-auto max-w-xl py-14">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#a9c2b6]">Money is better shared clearly</p>
          <h1 className="mt-5 font-money text-6xl font-semibold leading-[0.98] tracking-[-0.055em] xl:text-7xl">Keep the memories.<br />We&apos;ll keep the math.</h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-[#c5d6ce]">Jemaw is a shared money journal for trips, homes, dinners, and all the small things friends do together.</p>

          <div className="mt-12 max-w-lg rounded-[26px] bg-[#fffaf0] p-5 text-[#20231d] shadow-[0_25px_70px_rgba(4,20,13,0.22)]">
            <div className="flex items-center justify-between border-b border-[#ded8cb] pb-4">
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[14px] bg-[#e7e0d4] text-xl">🚌</span><div><p className="text-sm font-extrabold">Lalibela Trip</p><p className="text-[10px] text-[#8a8c84]">4 friends · ETB</p></div></div>
              <div className="text-right"><p className="font-money text-lg font-semibold text-[#19734f]">+ ETB 1,250</p><p className="text-[9px] font-bold text-[#8a8c84]">you are owed</p></div>
            </div>
            <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#9a9b94]">Today</p>
            <div className="mt-3 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[14px] bg-rose-100 text-lg">🍽️</span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold">Dinner at Ben Abeba</p><p className="mt-0.5 text-[10px] text-[#7d8078]">Amanuel paid · You owe ETB 600</p></div><p className="font-money text-sm font-semibold">ETB 2,400</p></div>
            <div className="mt-3 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[14px] bg-[#dfeae5] text-lg">💸</span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold">Nahom paid you</p><p className="mt-0.5 text-[10px] text-[#7d8078]">Waiting for your confirmation</p></div><p className="font-money text-sm font-semibold text-[#19734f]">ETB 500</p></div>
          </div>
        </div>
        <p className="text-[10px] font-semibold text-[#87a095]">Built for friends, not accountants.</p>
      </section>

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        {children}
      </main>
    </div>
  );
}
