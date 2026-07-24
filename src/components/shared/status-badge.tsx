import { Badge } from "@/components/ui/badge";
import { label, tone } from "@/lib/enums";
import { cn } from "@/lib/utils";

export function StatusBadge({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge tone={tone(value)} className={cn("capitalize", className)}>
      {label(value)}
    </Badge>
  );
}
