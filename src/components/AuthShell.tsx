import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggleButton } from "@/components/ThemeToggle";
import { Facebook, Instagram, Sparkles, Layers, Zap } from "lucide-react";

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
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Left form panel */}
      <div className="relative flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <BrandLogo />
          <ThemeToggleButton />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-7 py-12 animate-fade-in">
            <div className="space-y-2 text-center sm:text-left">
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {children}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground sm:text-left">
          By continuing you agree to our terms of service.
        </p>
      </div>

      {/* Right marketing panel */}
      <FeatureSide />
    </main>
  );
}

function FeatureSide() {
  const features = [
    {
      icon: Layers,
      title: "One composer, every channel",
      body: "Write once, post to all your Facebook Pages and Instagram Business accounts.",
    },
    {
      icon: Sparkles,
      title: "Live previews",
      body: "See exactly how your post will look on each platform before you publish.",
    },
    {
      icon: Zap,
      title: "Per-target status",
      body: "If one platform fails, the rest still go through. Retry or fix in one click.",
    },
  ];
  return (
    <aside className="brand-glow relative hidden overflow-hidden border-l bg-card lg:flex">
      <div className="relative z-10 m-auto w-full max-w-md px-10 py-16">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          For social media teams
        </div>
        <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
          Publish to <span className="brand-text">Facebook</span> and{" "}
          <span className="brand-text">Instagram</span> in one click.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Stop juggling tabs. Crosspost connects to your Pages and Instagram
          Business accounts and ships your content with full visibility.
        </p>

        <div className="mt-8 space-y-4">
          {features.map((f) => (
            <div key={f.title} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg brand-gradient text-white shadow-soft-sm">
                <f.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-2 py-1">
            <Facebook className="h-3 w-3 text-[#1877F2]" /> Pages
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-2 py-1">
            <Instagram className="h-3 w-3 text-[#E1306C]" /> Business
          </span>
          <span className="text-muted-foreground/60">More platforms soon</span>
        </div>
      </div>

      {/* decorative chips */}
      <div className="pointer-events-none absolute -right-24 top-12 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
    </aside>
  );
}
