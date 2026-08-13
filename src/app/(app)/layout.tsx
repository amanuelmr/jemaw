import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { getMyJemaws } from "@/actions/jemaws";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  let jemaws;
  try {
    const [s, groups] = await Promise.all([getServerSession(), getMyJemaws()]);
    if (!s) redirect("/sign-in");
    session = s;
    jemaws = groups;
  } catch {
    redirect("/sign-in");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        user={user}
        groups={jemaws.map((jemaw) => ({
          id: jemaw.id,
          name: jemaw.name,
          currency: jemaw.currency,
          myBalance: jemaw.myBalance,
          memberCount: jemaw.members.length,
        }))}
      />
      <Header user={user} />
      <div className="md:pl-[276px]">
        <main className="page-enter mx-auto max-w-[1240px] px-4 py-6 pb-28 sm:px-7 sm:py-9 md:px-10 md:pb-12 lg:px-12">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
