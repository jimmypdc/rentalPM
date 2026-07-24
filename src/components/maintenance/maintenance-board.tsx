"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { updateMaintenanceStatus } from "@/server/maintenance";
import { label, MaintenanceStatusValues } from "@/lib/enums";
import { cn } from "@/lib/utils";

export interface MaintenanceCard {
  id: string;
  number: number;
  title: string;
  property: string;
  unit: string | null;
  priority: string;
  vendor: string | null;
  estimatedCost: number;
  reportedDate: string;
}

// Columns rendered on the board, in flow order. Each maps directly to a status.
const COLUMNS = MaintenanceStatusValues;

export function MaintenanceBoard({ data }: { data: Record<string, MaintenanceCard[]> }) {
  const router = useRouter();
  const [board, setBoard] = React.useState(data);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overCol, setOverCol] = React.useState<string | null>(null);

  React.useEffect(() => setBoard(data), [data]);

  function findCard(id: string): { card: MaintenanceCard; from: string } | null {
    for (const status of Object.keys(board)) {
      const card = board[status]?.find((c) => c.id === id);
      if (card) return { card, from: status };
    }
    return null;
  }

  async function handleDrop(toStatus: string) {
    const id = dragId;
    setOverCol(null);
    setDragId(null);
    if (!id) return;
    const found = findCard(id);
    if (!found || found.from === toStatus) return;

    // Optimistic move
    setBoard((prev) => {
      const next: Record<string, MaintenanceCard[]> = {};
      for (const k of Object.keys(prev)) next[k] = prev[k].filter((c) => c.id !== id);
      next[toStatus] = [found.card, ...(next[toStatus] ?? [])];
      return next;
    });

    const result = await updateMaintenanceStatus(id, toStatus);
    if (result.ok) {
      toast.success(`Moved to ${label(toStatus)}`);
      router.refresh();
    } else {
      toast.error(result.error);
      setBoard(data); // revert
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {COLUMNS.map((status) => {
        const cards = board[status] ?? [];
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(status);
            }}
            onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              void handleDrop(status);
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30 transition-colors",
              overCol === status && "border-primary/50 bg-primary/5",
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <div className="flex items-center gap-2">
                <StatusBadge value={status} />
              </div>
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {cards.length}
              </span>
            </div>
            <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
              {cards.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">Drop here</p>
              ) : (
                cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => setDragId(card.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    className={cn(
                      "group rounded-lg border border-border bg-card p-3 shadow-sm transition-opacity",
                      dragId === card.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/maintenance/${card.id}`}
                        className="text-sm font-medium leading-snug text-foreground hover:text-primary"
                      >
                        {card.title}
                      </Link>
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      #{card.number} · {card.property}
                      {card.unit ? ` · ${card.unit}` : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusBadge value={card.priority} />
                      {card.estimatedCost > 0 && (
                        <Money value={card.estimatedCost} className="text-xs font-medium" />
                      )}
                    </div>
                    {card.vendor && (
                      <p className="mt-1.5 truncate text-xs text-muted-foreground">{card.vendor}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
