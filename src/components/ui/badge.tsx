import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
        secondary:
          "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
        success:
          "bg-success/10 text-success ring-1 ring-inset ring-success/30",
        warning:
          "bg-warning/15 text-warning-foreground ring-1 ring-inset ring-warning/40",
        destructive:
          "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/30",
        outline: "ring-1 ring-inset ring-border text-foreground",
        brand:
          "text-white ring-1 ring-inset ring-white/20 brand-gradient",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
