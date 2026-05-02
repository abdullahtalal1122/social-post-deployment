import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? 24 : size === "lg" ? 40 : 32;
  const text =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0"
      >
        <defs>
          <linearGradient id="cp-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--brand-from))" />
            <stop offset="55%" stopColor="hsl(var(--brand-via))" />
            <stop offset="100%" stopColor="hsl(var(--brand-to))" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#cp-grad)" />
        {/* Two rounded squares overlapping — represents cross-posting */}
        <rect x="9" y="9" width="14" height="14" rx="3.5" fill="white" fillOpacity="0.95" />
        <rect x="17" y="17" width="14" height="14" rx="3.5" fill="white" fillOpacity="0.55" />
      </svg>
      {showWordmark && (
        <span className={cn("font-semibold tracking-tight", text)}>
          Crosspost
        </span>
      )}
    </div>
  );
}
