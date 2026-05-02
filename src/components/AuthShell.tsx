// Will get a full visual treatment in Phase B. For now a clean skeleton.
import { BrandLogo } from "@/components/BrandLogo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandLogo />
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </main>
  );
}
