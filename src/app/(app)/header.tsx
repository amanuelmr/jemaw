"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SplitSquareVertical, Bell, Check, LogOut, User } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { markAsRead, markAllAsRead } from "@/actions/notifications";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useTransition } from "react";

interface HeaderProps {
  user: { name: string; email: string };
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pending", label: "Pending" },
  { href: "/profile", label: "Profile" },
];

type Notification = {
  id: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: Date;
};

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
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

        // Normalise createdAt strings → Date objects
        const parse = (list: typeof data.notifications): Notification[] =>
          list.map((n) => ({ ...n, createdAt: new Date(n.createdAt) }));

        if (data.type === "init") {
          setNotifications(parse(data.notifications));
        } else if (data.type === "new") {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const incoming = parse(data.notifications).filter((n) => !existingIds.has(n.id));
            if (incoming.length === 0) return prev;
            if (bellFlashTimer.current) clearTimeout(bellFlashTimer.current);
            setBellFlash(true);
            bellFlashTimer.current = setTimeout(() => setBellFlash(false), 1000);
            return [...incoming, ...prev].slice(0, 20);
          });
        }
      } catch { /* ignore malformed events */ }
    };

    return () => {
      source.close();
      if (bellFlashTimer.current) clearTimeout(bellFlashTimer.current);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  function handleNotificationClick(n: Notification) {
    if (!n.read) {
      markAsRead({ notificationId: n.id })
        .then(() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x)))
        .catch(() => {});
    }
    router.push(n.link);
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead().catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 h-14 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center gap-3 md:gap-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <SplitSquareVertical className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-base">Jemaw</span>
        </Link>

        {/* Nav */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const active =
              pathname.startsWith(href) ||
              (href === "/dashboard" && pathname.startsWith("/jemaws"));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative px-3 py-1.5 text-sm rounded-md transition-colors",
                  active
                    ? "text-slate-900 font-medium"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-normal"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-1">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "relative w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors",
                bellFlash && "text-indigo-500"
              )}>
                <Bell className={cn("w-4 h-4 transition-transform", bellFlash && "animate-bounce")} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-sm font-semibold">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={isPending}
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-400">No notifications yet</div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn("cursor-pointer px-3 py-2.5 flex items-start gap-2.5", !n.read && "bg-indigo-50/40")}
                  >
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
                    <div className={cn("flex-1 min-w-0", n.read && "ml-4")}>
                      <p className="text-xs leading-snug text-slate-700">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-md hover:bg-slate-100 transition-colors ml-1">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-slate-700 max-w-[100px] truncate hidden sm:block">
                  {user.name.split(" ")[0]}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-3.5 h-3.5" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-rose-600 focus:text-rose-600 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
