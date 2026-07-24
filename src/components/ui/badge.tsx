import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/lib/enums";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-transparent bg-slate-100 text-slate-700",
        slate: "border-transparent bg-slate-100 text-slate-600",
        blue: "border-transparent bg-blue-50 text-blue-700",
        green: "border-transparent bg-green-50 text-green-700",
        amber: "border-transparent bg-amber-50 text-amber-700",
        red: "border-transparent bg-red-50 text-red-700",
        purple: "border-transparent bg-violet-50 text-violet-700",
        outline: "border-border text-foreground bg-transparent",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  tone?: BadgeTone | "outline";
}

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
