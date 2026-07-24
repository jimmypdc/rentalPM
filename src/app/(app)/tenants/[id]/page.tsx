import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Pencil, Mail, Phone, Wallet, DollarSign, CalendarClock, Shield,
  Building2, Briefcase, User, Cake,
} from "lucide-react";
import { getTenant } from "@/server/tenants";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { label } from "@/lib/enums";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Tenant" };
export const dynamic = "force-dynamic";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getTenant(id);
  if (!data) notFound();
  const { tenant, activeLease, stats, payments, maintenance, documents } = data;

  return (
    <div className="space-y-6">
      <BackLink href="/tenants" label="Tenants" />
      <PageHeader
        title={`${tenant.firstName} ${tenant.lastName}`}
        description={
          activeLease
            ? `${activeLease.property.name}${activeLease.unit ? ` · Unit ${activeLease.unit.number}` : ""}`
            : undefined
        }
        actions={
          <Button asChild variant="outline">
            <Link href={`/tenants/${tenant.id}/edit`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={tenant.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Current Balance"
          value={formatCurrency(stats.currentBalance)}
          icon={Wallet}
          accent={stats.currentBalance > 0 ? "red" : "green"}
        />
        <StatCard label="Rent" value={formatCurrency(stats.rentAmount)} icon={DollarSign} accent="blue" />
        <StatCard
          label="Next Rent Due"
          value={stats.nextRentDue ? formatDate(stats.nextRentDue, "short") : "—"}
          icon={CalendarClock}
          accent="amber"
        />
        <StatCard label="Security Deposit" value={formatCurrency(stats.securityDeposit)} icon={Shield} accent="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <InfoRow icon={Mail} value={tenant.email} />
            <InfoRow icon={Phone} value={tenant.phone} />
            <InfoRow icon={Cake} value={tenant.dateOfBirth ? formatDate(tenant.dateOfBirth) : null} />
            {tenant.vehicleInfo && <InfoRow icon={User} value={tenant.vehicleInfo} />}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lease">Lease</TabsTrigger>
              <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance ({maintenance.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    <InfoField icon={Shield} label="Emergency contact" value={tenant.emergencyName} />
                    <InfoField icon={Phone} label="Emergency phone" value={tenant.emergencyPhone} />
                    <InfoField icon={Briefcase} label="Employer" value={tenant.employer} />
                    <InfoField
                      icon={DollarSign}
                      label="Monthly income"
                      value={tenant.monthlyIncome ? formatCurrency(tenant.monthlyIncome) : null}
                    />
                    <InfoField
                      icon={Building2}
                      label="Current lease"
                      value={
                        activeLease
                          ? `${activeLease.property.name}${activeLease.unit ? ` · Unit ${activeLease.unit.number}` : ""}`
                          : null
                      }
                    />
                    <InfoField icon={User} label="Pets" value={tenant.pets} />
                    <InfoField
                      icon={CalendarClock}
                      label="Move-in / Move-out"
                      value={
                        tenant.moveInDate || tenant.moveOutDate
                          ? `${tenant.moveInDate ? formatDate(tenant.moveInDate, "short") : "—"} → ${tenant.moveOutDate ? formatDate(tenant.moveOutDate, "short") : "—"}`
                          : null
                      }
                    />
                  </dl>
                  {tenant.notes && (
                    <p className="whitespace-pre-wrap border-t border-border/50 pt-3 text-sm text-muted-foreground">
                      {tenant.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lease">
              <Card>
                <CardContent className="pt-6">
                  {!activeLease ? (
                    <EmptyState title="No active lease" description="This tenant is not linked to an active lease." />
                  ) : (
                    <div className="space-y-4">
                      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                        <InfoField icon={Building2} label="Property" value={activeLease.property.name} />
                        <InfoField icon={Building2} label="Unit" value={activeLease.unit?.number ?? "—"} />
                        <InfoField icon={DollarSign} label="Rent" value={formatCurrency(activeLease.rent)} />
                        <InfoField icon={Shield} label="Status" value={label(activeLease.status)} />
                        <InfoField
                          icon={CalendarClock}
                          label="Term"
                          value={`${formatDate(activeLease.startDate, "short")} → ${formatDate(activeLease.endDate, "short")}`}
                        />
                      </dl>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/leases/${activeLease.id}`}>View lease</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardContent className="p-0">
                  {payments.length === 0 ? (
                    <EmptyState title="No payments" description="Payments received from this tenant appear here." />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-sm">{formatDate(p.receivedOn, "short")}</TableCell>
                            <TableCell><StatusBadge value={p.method} /></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.reference ?? "—"}</TableCell>
                            <TableCell className="text-right"><Money value={p.amount} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance">
              <Card>
                <CardContent className="p-0">
                  {maintenance.length === 0 ? (
                    <EmptyState title="No requests" description="Maintenance requests reported by this tenant appear here." />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reported</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maintenance.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>
                              <Link href={`/maintenance/${m.id}`} className="font-medium hover:text-primary">
                                #{m.number} {m.title}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {m.property.name}{m.unit ? ` · ${m.unit.number}` : ""}
                            </TableCell>
                            <TableCell><StatusBadge value={m.status} /></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(m.reportedDate, "short")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardContent className="p-0">
                  {documents.length === 0 ? (
                    <EmptyState title="No documents" description="Applications, IDs, and lease documents appear here." />
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
                        {documents.map((doc) => (
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
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

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
