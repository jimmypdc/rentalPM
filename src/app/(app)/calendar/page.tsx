import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { getCalendarEvents } from "@/server/calendar";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const events = await getCalendarEvents();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Rent due dates, lease expirations, inspections, maintenance, and renewals across your portfolio."
      />
      <CalendarView events={events} />
    </div>
  );
}
