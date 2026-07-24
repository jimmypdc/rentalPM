"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { NotificationItem } from "@/components/layout/notifications-menu";
import type { SearchEntry } from "@/components/layout/global-search";
import { cn } from "@/lib/utils";

export function AppShell({
  user,
  notifications,
  searchIndex,
  children,
}: {
  user: { name: string; email: string };
  notifications: NotificationItem[];
  searchIndex: SearchEntry[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("rpm.sidebar.collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);

  function toggleSidebar() {
    setCollapsed((c) => {
      localStorage.setItem("rpm.sidebar.collapsed", c ? "0" : "1");
      return !c;
    });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 transition-all duration-200 lg:block",
          collapsed ? "w-[68px]" : "w-64",
        )}
      >
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 transition-all duration-200",
            collapsed ? "w-[68px]" : "w-64",
          )}
        >
          <Sidebar collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={user}
          notifications={notifications}
          searchIndex={searchIndex}
          onToggleSidebar={toggleSidebar}
          onOpenMobile={() => setMobileOpen(true)}
          collapsed={collapsed}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
