import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggleButton } from "@/components/ThemeToggle";
import { DashboardNav } from "@/components/DashboardNav";

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="focus-ring rounded">
              <BrandLogo />
            </Link>
            <DashboardNav />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {session.user.email ?? session.user.name}
            </span>
            <ThemeToggleButton />
            <SignOutButton action={handleSignOut} />
          </div>
        </div>
      </header>
      <main className="container py-8 sm:py-10">{children}</main>
    </div>
  );
}
