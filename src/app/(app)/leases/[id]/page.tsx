import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Pencil, DollarSign, Wallet, Landmark, CalendarClock, User, FileText, AlertTriangle,
} from "lucide-react";
import { getLease } from "@/server/leases";
import { chargeBalance } from "@/server/finance";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { LeaseActions } from "@/components/lease/lease-actions";
import { label } from "@/lib/enums";
import { formatCurrency, formatDate, num, fullName, daysUntil } from "@/lib/utils";

export const metadata: Metadata = { title: "Lease" };
export const dynamic = "force-dynamic";

const ALERT_STYLES: Record<number, string> = {
  30: "border-destructive/40 bg-destructive/5 text-destructive",
  60: "border-amber-400/50 bg-amber-50 text-amber-700",
  90: "border-amber-400/40 bg-amber-50 text-amber-700",
  120: "border-border bg-muted/40 text-muted-foreground",
};

export default async function LeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getLease(id);
  if (!data) notFound();
  const { lease, charges, balance, depositHeld, alert } = data;

  const days = daysUntil(lease.endDate);
  const terminated = lease.status === "TERMINATED" || lease.status === "EXPIRED";

  return (
    <div className="space-y-6">
      <BackLink href="/leases" label="Leases" />
      <PageHeader
        title={`${lease.property.name} · Unit ${lease.unit.number}`}
        description={`${formatDate(lease.startDate)} – ${formatDate(lease.endDate)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/leases/${lease.id}/edit`}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
            <LeaseActions id={lease.id} disabled={terminated} />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={lease.status} />
        <StatusBadge value={lease.renewalStatus} />
      </div>

      {alert && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${ALERT_STYLES[alert.level]}`}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This lease expires in {alert.days} day{alert.days === 1 ? "" : "s"} ({formatDate(lease.endDate)}).
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Monthly Rent" value={formatCurrency(lease.rent)} icon={DollarSign} accent="green" />
        <StatCard label="Balance" value={formatCurrency(balance)} icon={Wallet} accent={balance > 0 ? "red" : "slate"} />
        <StatCard label="Deposit Held" value={formatCurrency(depositHeld)} icon={Landmark} accent="blue" />
        <StatCard
          label="Days to Expiry"
          value={days === null ? "—" : days < 0 ? "Expired" : days}
          icon={CalendarClock}
          accent={days !== null && days <= 30 ? "red" : days !== null && days <= 90 ? "amber" : "slate"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Tenants</CardTitle></CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {lease.tenants.length === 0 ? (
              <p className="text-muted-foreground">No tenants on this lease.</p>
            ) : (
              lease.tenants.map((t) => (
                <div key={t.id} className="flex items-center gap-2.5">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Link href={`/tenants/${t.tenant.id}`} className="text-foreground hover:text-primary">
                    {fullName(t.tenant)}
                  </Link>
                  {t.isPrimary && <span className="text-xs text-muted-foreground">Primary</span>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Term</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Start" value={formatDate(lease.startDate)} />
            <Row label="End" value={formatDate(lease.endDate)} />
            <Row label="Move-in" value={lease.moveInDate ? formatDate(lease.moveInDate) : "—"} />
            <Row label="Move-out" value={lease.moveOutDate ? formatDate(lease.moveOutDate) : "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Terms</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Rent due day" value={`Day ${lease.rentDueDay}`} />
            <Row label="Grace period" value={`${lease.gracePeriodDays} days`} />
            <Row label="Late fee" value={num(lease.lateFee) > 0 ? formatCurrency(lease.lateFee) : "—"} />
            <Row label="Security deposit" value={num(lease.securityDeposit) > 0 ? formatCurrency(lease.securityDeposit) : "—"} />
            <Row label="Pet deposit" value={num(lease.petDeposit) > 0 ? formatCurrency(lease.petDeposit) : "—"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Charges ledger</CardTitle></CardHeader>
        <CardContent className="p-0">
          {charges.length === 0 ? (
            <EmptyState title="No charges" description="Rent and other charges for this lease appear here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((c) => {
                  const bal = chargeBalance(c);
                  const paid = num(c.amount) - bal;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">{formatDate(c.dueDate, "short")}</TableCell>
                      <TableCell className="text-sm">
                        {label(c.type)}
                        {c.description && <span className="block text-xs text-muted-foreground">{c.description}</span>}
                      </TableCell>
                      <TableCell className="text-right"><Money value={c.amount} /></TableCell>
                      <TableCell className="text-right"><Money value={paid} muteZero /></TableCell>
                      <TableCell><StatusBadge value={c.voidedAt ? "VOID" : c.status} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Security deposits</CardTitle></CardHeader>
          <CardContent className="p-0">
            {lease.securityDeposits.length === 0 ? (
              <EmptyState title="No deposits" description="Security deposits for this lease appear here." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Received</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lease.securityDeposits.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm">{d.receivedOn ? formatDate(d.receivedOn, "short") : "—"}</TableCell>
                      <TableCell className="text-right"><Money value={d.amount} /></TableCell>
                      <TableCell><StatusBadge value={d.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent className="p-0">
            {lease.documents.length === 0 ? (
              <EmptyState title="No documents" description="Signed leases and addenda appear here." />
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
                  {lease.documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="flex items-center gap-2 font-medium">
                        <FileText className="h-4 w-4 text-muted-foreground" /> {doc.name}
                      </TableCell>
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

      {lease.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm text-muted-foreground">{lease.notes}</p></CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
