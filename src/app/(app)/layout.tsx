import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    const s = await getServerSession();
    if (!s) redirect("/sign-in");
    session = s;
  } catch {
    redirect("/sign-in");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />
      <main className="max-w-6xl mx-auto px-4 py-5 pb-24 sm:px-6 sm:py-8 md:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
