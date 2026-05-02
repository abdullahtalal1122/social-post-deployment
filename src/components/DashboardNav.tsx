"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Compose", match: (p: string) => p === "/dashboard" },
  {
    href: "/dashboard/connections",
    label: "Connections",
    match: (p: string) => p.startsWith("/dashboard/connections"),
  },
  {
    href: "/dashboard/history",
    label: "History",
    match: (p: string) => p.startsWith("/dashboard/history"),
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {active && (
              <span className="absolute -bottom-[17px] left-2 right-2 h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
