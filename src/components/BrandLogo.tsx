import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 shadow-sm">
        <div className="absolute inset-[3px] rounded-md bg-background/80" />
        <div className="absolute inset-0 flex items-center justify-center text-base font-bold tracking-tighter text-foreground">
          ✦
        </div>
      </div>
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">Crosspost</span>
      )}
    </div>
  );
}
