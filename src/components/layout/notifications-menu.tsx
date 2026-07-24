"use client";

import Link from "next/link";
import { Bell, AlertTriangle, Info, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  severity: string;
  href: string | null;
  createdAt: string;
}

const sevIcon: Record<string, typeof Info> = {
  INFO: Info,
  WARNING: AlertTriangle,
  CRITICAL: AlertOctagon,
};
const sevColor: Record<string, string> = {
  INFO: "text-blue-500",
  WARNING: "text-amber-500",
  CRITICAL: "text-red-500",
};

export function NotificationsMenu({ items }: { items: NotificationItem[] }) {
  const count = items.length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600" />
          {count > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <span className="text-xs text-muted-foreground">{count} new</span>
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {count === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            items.map((n) => {
              const Icon = sevIcon[n.severity] ?? Info;
              const inner = (
                <div className="flex gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/50">
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", sevColor[n.severity])} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              );
              return n.href ? (
                <Link key={n.id} href={n.href}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })
          )}
        </div>
        <Link
          href="/dashboard"
          className="block border-t px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted/50"
        >
          View dashboard
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
