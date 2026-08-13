"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Home, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/pending", label: "Requests", icon: Check },
  { href: "/profile", label: "You", icon: UserRound },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 px-4 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname.startsWith(href) ||
            (href === "/dashboard" && pathname.startsWith("/jemaws"));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active ? "text-foreground before:absolute before:top-0 before:h-0.5 before:w-7 before:bg-[#f15b3a]" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
