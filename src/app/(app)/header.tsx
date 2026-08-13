"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, UserRound } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { markAsRead, markAllAsRead } from "@/actions/notifications";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brand } from "@/components/brand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/presentation";
import { useEffect, useRef, useState, useTransition } from "react";

type Notification = {
  id: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: Date;
};

export function Header({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();
  const [bellFlash, setBellFlash] = useState(false);
  const bellFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/notifications/stream");
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type: string;
          notifications: (Omit<Notification, "createdAt"> & { createdAt: string })[];
        };
        const parse = (list: typeof data.notifications): Notification[] =>
          list.map((notification) => ({ ...notification, createdAt: new Date(notification.createdAt) }));

        if (data.type === "init") setNotifications(parse(data.notifications));
        if (data.type === "new") {
          setNotifications((current) => {
            const ids = new Set(current.map((item) => item.id));
            const incoming = parse(data.notifications).filter((item) => !ids.has(item.id));
            if (incoming.length === 0) return current;
            if (bellFlashTimer.current) clearTimeout(bellFlashTimer.current);
            setBellFlash(true);
            bellFlashTimer.current = setTimeout(() => setBellFlash(false), 1000);
            return [...incoming, ...current].slice(0, 20);
          });
        }
      } catch {}
    };
    return () => {
      source.close();
      if (bellFlashTimer.current) clearTimeout(bellFlashTimer.current);
    };
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  function openNotification(notification: Notification) {
    if (!notification.read) {
      markAsRead({ notificationId: notification.id })
        .then(() =>
          setNotifications((current) =>
            current.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
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

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-[#ded8cb] bg-[#f5f1e8]/92 px-4 backdrop-blur-md md:hidden">
      <Brand />
      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn("relative grid size-10 place-items-center rounded-full text-[#62665e] hover:bg-black/[0.05]", bellFlash && "text-primary")}
              aria-label={`Updates${unreadCount ? `, ${unreadCount} unread` : ""}`}
            >
              <Bell className={cn("size-[18px]", bellFlash && "animate-bounce")} />
              {unreadCount > 0 && <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-[#f5f1e8] bg-[#e66f55]" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl bg-card p-1.5 shadow-xl">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-extrabold">Updates</p>
              {unreadCount > 0 && <button onClick={markEverythingRead} disabled={isPending} className="text-[11px] font-bold text-primary">Mark all read</button>}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing new yet.</p>
            ) : (
              notifications.slice(0, 8).map((notification) => (
                <DropdownMenuItem key={notification.id} onClick={() => openNotification(notification)} className={cn("cursor-pointer rounded-xl px-3 py-3", !notification.read && "bg-[#edf3ef]") }>
                  <div>
                    <p className="text-xs leading-relaxed">{notification.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{new Date(notification.createdAt).toLocaleDateString()}</p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full p-1" aria-label="Open account menu">
              <Avatar className="size-8">
                <AvatarFallback className="bg-[#f3c767] text-[10px] font-extrabold text-[#20231d]">{initials(user.name)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-card p-1.5">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-extrabold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl">
              <Link href="/profile" className="cursor-pointer gap-2"><UserRound className="size-4" />Your profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2 rounded-xl text-destructive focus:text-destructive">
              <LogOut className="size-4" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
