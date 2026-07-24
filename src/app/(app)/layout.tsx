import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { getHeaderNotifications } from "@/server/notifications";
import { getSearchIndex } from "@/server/search";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [notifications, searchIndex] = await Promise.all([
    getHeaderNotifications(),
    getSearchIndex(),
  ]);

  return (
    <AppShell
      user={{
        name: session.user.name ?? "Admin",
        email: session.user.email ?? "",
      }}
      notifications={notifications}
      searchIndex={searchIndex}
    >
      {children}
    </AppShell>
  );
}
