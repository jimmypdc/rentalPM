import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Pencil, Building2, Home, User, Wrench, Calendar, CalendarCheck, FileText,
} from "lucide-react";
import { getMaintenance } from "@/server/maintenance";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { label } from "@/lib/enums";
import { formatDate, fullName } from "@/lib/utils";

export const metadata: Metadata = { title: "Request" };
export const dynamic = "force-dynamic";

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await getMaintenance(id);
  if (!m) notFound();

  return (
    <div className="space-y-6">
      <BackLink href="/maintenance" label="Maintenance" />
      <PageHeader
        title={`#${m.number} · ${m.title}`}
        description={`${label(m.category)} · Reported ${formatDate(m.reportedDate)}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/maintenance/${m.id}/edit`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={m.status} />
        <StatusBadge value={m.priority} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <InfoRow icon={Building2} value={m.property.name} />
            <InfoRow icon={Home} value={m.unit ? `Unit ${m.unit.number}` : null} />
            <InfoRow icon={User} value={m.tenant ? fullName(m.tenant) : null} />
            <InfoRow icon={Wrench} value={m.vendor ? m.vendor.companyName : "Unassigned"} />
            <InfoRow icon={Calendar} value={m.scheduledDate ? `Scheduled ${formatDate(m.scheduledDate)}` : null} />
            <InfoRow icon={CalendarCheck} value={m.completedDate ? `Completed ${formatDate(m.completedDate)}` : null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Costs</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estimated</span>
              <Money value={m.estimatedCost} muteZero className="font-medium" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Actual</span>
              <Money value={m.actualCost} muteZero className="font-medium" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {m.description ? (
              <p className="whitespace-pre-wrap text-muted-foreground">{m.description}</p>
            ) : (
              <p className="text-muted-foreground">No description provided.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {m.internalNotes && (
        <Card>
          <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{m.internalNotes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Documents ({m.documents.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {m.documents.length === 0 ? (
            <EmptyState icon={FileText} title="No documents" description="Photos and invoices attached to this request appear here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {m.documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell><StatusBadge value={doc.category} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(doc.createdAt, "short")}</TableCell>
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
