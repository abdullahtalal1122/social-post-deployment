import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { BrandLogo } from "@/components/BrandLogo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/signin" });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <BrandLogo />
            </Link>
            <nav className="hidden items-center gap-4 text-sm sm:flex">
              <Link
                href="/dashboard"
                className="text-muted-foreground transition hover:text-foreground"
              >
                Compose
              </Link>
              <Link
                href="/dashboard/connections"
                className="text-muted-foreground transition hover:text-foreground"
              >
                Connections
              </Link>
              <Link
                href="/dashboard/history"
                className="text-muted-foreground transition hover:text-foreground"
              >
                History
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {session.user.email ?? session.user.name}
            </span>
            <SignOutButton action={handleSignOut} />
          </div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
