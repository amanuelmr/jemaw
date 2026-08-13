"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Check, ChevronRight, Home, LogOut, Plus } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brand } from "@/components/brand";
import { CreateJemawDialog } from "./dashboard/create-jemaw-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrency } from "@/lib/utils";
import { getGroupEmoji, initials } from "@/lib/presentation";
import { useEffect, useState, useTransition } from "react";

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

export function Sidebar({
  user,
  groups,
}: {
  user: { name: string; email: string };
  groups: GroupNav[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getNotifications()
      .then((data) => setNotifications(data as Notification[]))
      .catch(() => {});
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  function openNotification(notification: Notification) {
    if (!notification.read) {
      markAsRead({ notificationId: notification.id })
        .then(() =>
          setNotifications((current) =>
            current.map((item) =>
              item.id === notification.id ? { ...item, read: true } : item
            )
          )
        )
        .catch(() => {});
    }
    router.push(notification.link);
  }

  function markEverythingRead() {
    startTransition(async () => {
      await markAllAsRead().catch(() => {});
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    });
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[276px] flex-col bg-[#1d2923] px-4 py-5 text-[#f7f1e5] md:flex">
      <div className="px-2">
        <Brand inverse />
        <p className="mt-3 text-[11px] leading-relaxed text-[#aeb8b1]">Shared money, without the awkwardness.</p>
      </div>

      <nav className="mt-8" aria-label="Main navigation">
        <Link
          href="/dashboard"
          className={cn(
            "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
            pathname === "/dashboard"
              ? "bg-[#f7f1e5] text-[#1d2923]"
              : "text-[#c8d0cb] hover:bg-white/[0.07] hover:text-white"
          )}
        >
          <Home className="size-4" />
          Home
        </Link>
      </nav>

      <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#7f9187]">Your groups</p>
          <CreateJemawDialog>
            <button
              className="grid size-7 place-items-center rounded-full text-[#aeb8b1] transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Create a new group"
            >
              <Plus className="size-4" />
            </button>
          </CreateJemawDialog>
        </div>

        <div className="mt-2 space-y-1">
          {groups.length === 0 ? (
            <p className="px-3 py-4 text-xs leading-relaxed text-[#809086]">Your shared trips, homes, and plans will live here.</p>
          ) : (
            groups.map((group) => {
              const active = pathname.startsWith(`/jemaws/${group.id}`);
              const balance = Number(group.myBalance);
              return (
                <Link
                  key={group.id}
                  href={`/jemaws/${group.id}`}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                    active ? "bg-white/[0.09]" : "hover:bg-white/[0.05]"
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-[11px] bg-white/[0.08] text-base">
                    {getGroupEmoji(group.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[13px] font-semibold", active ? "text-white" : "text-[#d8ded9]")}>{group.name}</span>
                    <span className="block text-[10px] text-[#819188]">
                      {group.memberCount} {group.memberCount === 1 ? "person" : "people"}
                    </span>
                  </span>
                  {balance !== 0 ? (
                    <span className={cn("text-[10px] font-bold tabular-nums", balance > 0 ? "text-[#80d2a4]" : "text-[#f1a18c]") }>
                      {balance > 0 ? "+" : "−"}{formatCurrency(Math.abs(balance), group.currency)}
                    </span>
                  ) : (
                    <ChevronRight className="size-3.5 text-[#66766d] transition-transform group-hover:translate-x-0.5" />
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t border-white/10 pt-3">
        <Link
          href="/pending"
          className={cn(
            "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
            pathname.startsWith("/pending")
              ? "bg-[#f3c767] text-[#20231d]"
              : "text-[#c8d0cb] hover:bg-white/[0.07] hover:text-white"
          )}
        >
          <span className="relative">
            <Check className="size-4" />
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-[#ee775d]" />}
          </span>
          Requests
          {unreadCount > 0 && (
            <span className="ml-auto rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-extrabold">{unreadCount}</span>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mt-1 flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#c8d0cb] transition-colors hover:bg-white/[0.07] hover:text-white">
              <Bell className="size-4" />
              Updates
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-80 rounded-2xl border-border bg-card p-1.5 shadow-xl">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-extrabold">Updates</p>
              {unreadCount > 0 && (
                <button onClick={markEverythingRead} disabled={isPending} className="text-[11px] font-bold text-primary hover:underline">Mark all read</button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">Nothing new yet.</p>
            ) : (
              notifications.slice(0, 8).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => openNotification(notification)}
                  className={cn("cursor-pointer rounded-xl px-3 py-3", !notification.read && "bg-[#edf3ef]")}
                >
                  <div>
                    <p className="text-xs leading-relaxed text-foreground">{notification.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{new Date(notification.createdAt).toLocaleDateString()}</p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mt-3 flex items-center gap-2 border-t border-white/10 px-2 pt-4">
          <Avatar className="size-9">
            <AvatarFallback className="bg-[#f3c767] text-[11px] font-extrabold text-[#20231d]">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <Link href="/profile" className="min-w-0 flex-1 rounded-lg px-1 py-1">
            <p className="truncate text-xs font-bold text-white">{user.name}</p>
            <p className="truncate text-[10px] text-[#7f9187]">{user.email}</p>
          </Link>
          <button onClick={handleSignOut} className="grid size-8 place-items-center rounded-full text-[#7f9187] hover:bg-white/10 hover:text-[#f1a18c]" aria-label="Sign out">
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
