import { prisma } from "@/lib/db";
import type { NotificationItem } from "@/components/layout/notifications-menu";

export async function getHeaderNotifications(): Promise<NotificationItem[]> {
  const rows = await prisma.notification.findMany({
    where: { readAt: null },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    severity: n.severity,
    href: n.href,
    createdAt: n.createdAt.toISOString(),
  }));
}
