"use client";

import { Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickAdd } from "@/components/layout/quick-add";
import {
  NotificationsMenu,
  type NotificationItem,
} from "@/components/layout/notifications-menu";
import { UserMenu } from "@/components/layout/user-menu";
import { GlobalSearch, type SearchEntry } from "@/components/layout/global-search";

export function Header({
  user,
  notifications,
  searchIndex,
  onToggleSidebar,
  onOpenMobile,
  collapsed,
}: {
  user: { name: string; email: string };
  notifications: NotificationItem[];
  searchIndex: SearchEntry[];
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
  collapsed: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobile}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        {collapsed ? (
          <PanelLeft className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </Button>

      <div className="flex-1">
        <GlobalSearch index={searchIndex} />
      </div>

      <div className="flex items-center gap-1.5">
        <QuickAdd />
        <NotificationsMenu items={notifications} />
        <UserMenu name={user.name} email={user.email} />
      </div>
    </header>
  );
}
