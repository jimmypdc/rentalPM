import { cn } from "@/lib/utils";
import { formatCurrency, num } from "@/lib/utils";

/** Renders a currency figure; positive values green, negative red when `signed`. */
export function Money({
  value,
  signed = false,
  cents = false,
  compact = false,
  className,
  muteZero = false,
}: {
  value: number | string | null | undefined;
  signed?: boolean;
  cents?: boolean;
  compact?: boolean;
  className?: string;
  muteZero?: boolean;
}) {
  const n = num(value);
  const color = signed
    ? n > 0
      ? "text-success"
      : n < 0
        ? "text-destructive"
        : "text-muted-foreground"
    : undefined;
  return (
    <span
      className={cn(
        "tabular-nums",
        color,
        muteZero && n === 0 && "text-muted-foreground",
        className,
      )}
    >
      {signed && n > 0 ? "+" : ""}
      {formatCurrency(n, { cents, compact })}
    </span>
  );
}
