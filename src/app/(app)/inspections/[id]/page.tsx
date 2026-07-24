import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Pencil, Building2, Home, User, ClipboardCheck, Calendar, CalendarClock, AlertTriangle,
} from "lucide-react";
import { getInspection } from "@/server/inspections";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { label } from "@/lib/enums";
import { formatDate, fullName } from "@/lib/utils";

export const metadata: Metadata = { title: "Inspection" };
export const dynamic = "force-dynamic";

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const i = await getInspection(id);
  if (!i) notFound();

  return (
    <div className="space-y-6">
      <BackLink href="/inspections" label="Inspections" />
      <PageHeader
        title={`${label(i.type)} Inspection`}
        description={`${i.property.name}${i.unit ? ` · Unit ${i.unit.number}` : ""} · ${formatDate(i.inspectionDate)}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/inspections/${i.id}/edit`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={i.conditionRating} />
        {i.followUpRequired && (
          <Badge tone="amber">
            <AlertTriangle className="mr-1 h-3 w-3" /> Follow-up required
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <InfoRow icon={Building2} value={i.property.name} />
            <InfoRow icon={Home} value={i.unit ? `Unit ${i.unit.number}` : null} />
            <InfoRow icon={User} value={i.tenant ? fullName(i.tenant) : null} />
            <InfoRow icon={ClipboardCheck} value={i.inspector ? `Inspector: ${i.inspector}` : null} />
            <InfoRow icon={Calendar} value={`Inspected ${formatDate(i.inspectionDate)}`} />
            <InfoRow icon={CalendarClock} value={i.nextInspectionDate ? `Next ${formatDate(i.nextInspectionDate)}` : null} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Findings</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="mb-1 font-medium text-foreground">Issues found</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{i.issuesFound || "None recorded."}</p>
            </div>
            {i.notes && (
              <div>
                <p className="mb-1 font-medium text-foreground">Notes</p>
                <p className="whitespace-pre-wrap text-muted-foreground">{i.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Checklist ({i.items.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {i.items.length === 0 ? (
            <EmptyState title="No checklist items" description="This inspection has no checklist items." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {i.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.area}</TableCell>
                    <TableCell><StatusBadge value={item.rating} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-foreground">{value}</span>
    </div>
  );
}
