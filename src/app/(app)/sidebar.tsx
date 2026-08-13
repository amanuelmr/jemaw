"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Check, Home, LogOut, Plus } from "lucide-react";
import { getNotifications, markAllAsRead, markAsRead } from "@/actions/notifications";
import { Brand } from "@/components/brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";
import { cn, formatCurrency } from "@/lib/utils";
import { initials } from "@/lib/presentation";
import { CreateJemawDialog } from "./dashboard/create-jemaw-dialog";

type GroupNav = {
  id: string;
  name: string;
  currency: string;
  myBalance: string;
  memberCount: number;
};

type Notification = {
  id: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: Date;
};

export function Sidebar({ user, groups }: { user: { name: string; email: string }; groups: GroupNav[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getNotifications().then((items) => setNotifications(items as Notification[])).catch(() => {});
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  function openNotification(notification: Notification) {
    if (!notification.read) {
      markAsRead({ notificationId: notification.id })
        .then(() => setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item)))
        .catch(() => {});
    }
    router.push(notification.link);
  }

  function markEverythingRead() {
    startTransition(async () => {
      await markAllAsRead().catch(() => {});
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    });
  }

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  const navClass = (active: boolean) => cn(
    "relative flex h-9 items-center gap-2.5 px-2.5 text-sm font-medium transition-colors",
    active ? "text-foreground before:absolute before:-left-3 before:h-5 before:w-0.5 before:bg-[#f15b3a]" : "text-muted-foreground hover:text-foreground"
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r bg-white px-3 py-5 md:flex">
      <div className="px-2"><Brand /></div>

      <nav className="mt-8 space-y-1" aria-label="Main navigation">
        <Link href="/dashboard" className={navClass(pathname === "/dashboard")}><Home className="size-4" />Home</Link>
        <Link href="/pending" className={navClass(pathname.startsWith("/pending"))}>
          <Check className="size-4" />Requests
          {unreadCount > 0 && <span className="ml-auto font-mono text-[10px] text-[#f15b3a]">{unreadCount}</span>}
        </Link>
      </nav>

      <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2.5">
          <p className="font-mono text-[10px] text-muted-foreground">GROUPS</p>
          <CreateJemawDialog>
            <button className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Create group"><Plus className="size-4" /></button>
          </CreateJemawDialog>
        </div>
        <div className="mt-2">
          {groups.length === 0 ? (
            <p className="px-2.5 py-4 text-xs leading-5 text-muted-foreground">No groups yet.</p>
          ) : groups.map((group) => {
            const active = pathname.startsWith(`/jemaws/${group.id}`);
            const balance = Number(group.myBalance);
            return (
              <Link key={group.id} href={`/jemaws/${group.id}`} className={cn("relative block border-b px-2.5 py-3", active ? "bg-[#f4f4ef] before:absolute before:-left-3 before:inset-y-2 before:w-0.5 before:bg-[#f15b3a]" : "hover:bg-[#f8f8f5]") }>
                <span className="block truncate text-[13px] font-medium">{group.name}</span>
                <span className="mt-1 flex items-center justify-between gap-2 font-mono text-[9px] text-muted-foreground">
                  <span>{group.memberCount} people</span>
                  <span className={cn(balance > 0 && "text-[#237a4b]", balance < 0 && "text-[#a13629]")}>{balance === 0 ? "even" : `${balance > 0 ? "+" : "−"}${formatCurrency(Math.abs(balance), group.currency)}`}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="border-t pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-full items-center gap-2.5 px-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
              <span className="relative"><Bell className="size-4" />{unreadCount > 0 && <span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-[#f15b3a]" />}</span>
              Updates
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-80 rounded-lg bg-white p-1.5">
            <div className="flex items-center justify-between px-3 py-2"><p className="text-sm font-semibold">Updates</p>{unreadCount > 0 && <button onClick={markEverythingRead} disabled={isPending} className="text-xs underline">Mark all read</button>}</div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted-foreground">No updates.</p> : notifications.slice(0, 8).map((notification) => (
              <DropdownMenuItem key={notification.id} onClick={() => openNotification(notification)} className={cn("cursor-pointer rounded-md px-3 py-3", !notification.read && "border-l-2 border-[#f15b3a] bg-[#fff7f4]") }>
                <div><p className="text-xs leading-5">{notification.message}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">{new Date(notification.createdAt).toLocaleDateString()}</p></div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mt-3 flex items-center gap-2 border-t px-2 pt-4">
          <Avatar className="size-8"><AvatarFallback className="bg-[#e9eae5] text-[10px] font-semibold text-foreground">{initials(user.name)}</AvatarFallback></Avatar>
          <Link href="/profile" className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{user.name}</p><p className="truncate text-[10px] text-muted-foreground">{user.email}</p></Link>
          <button onClick={handleSignOut} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Sign out"><LogOut className="size-3.5" /></button>
        </div>
      </div>
    </aside>
  );
}
