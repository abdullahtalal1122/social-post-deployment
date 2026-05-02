"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Plug2, History } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/dashboard",
    label: "Compose",
    icon: Sparkles,
    match: (p: string) => p === "/dashboard",
  },
  {
    href: "/dashboard/connections",
    label: "Connections",
    icon: Plug2,
    match: (p: string) => p.startsWith("/dashboard/connections"),
  },
  {
    href: "/dashboard/history",
    label: "History",
    icon: History,
    match: (p: string) => p.startsWith("/dashboard/history"),
  },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-3">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[11px] transition",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
