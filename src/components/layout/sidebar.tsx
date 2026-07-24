"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
import { navSections } from "@/lib/nav";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">RentalPM</p>
            <p className="truncate text-[11px] text-slate-400">
              Property Management
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4 scrollbar-thin">
        <TooltipProvider delayDuration={0}>
          {navSections.map((section, i) => (
            <div key={i} className="space-y-1">
              {section.heading && !collapsed && (
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.heading}
                </p>
              )}
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-active text-white shadow-sm"
                        : "text-slate-300 hover:bg-sidebar-accent hover:text-white",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
                return collapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                );
              })}
            </div>
          ))}
        </TooltipProvider>
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-3">
          <p className="px-2 text-[11px] text-slate-500">
            © {new Date().getFullYear()} RentalPM
          </p>
        </div>
      )}
    </div>
  );
}
