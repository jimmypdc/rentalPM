import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Pencil, Mail, Phone, MapPin, Building2, Home, TrendingUp,
  Percent, HandCoins, DollarSign, FileText,
} from "lucide-react";
import { getOwner } from "@/server/owners";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { label } from "@/lib/enums";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";

export const metadata: Metadata = { title: "Owner" };
export const dynamic = "force-dynamic";

export default async function OwnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getOwner(id);
  if (!data) notFound();
  const { owner, properties, stats } = data;

  return (
    <div className="space-y-6">
      <BackLink href="/owners" label="Owners" />
      <PageHeader
        title={`${owner.firstName} ${owner.lastName}`}
        description={owner.company ?? undefined}
        actions={
          <Button asChild variant="outline">
            <Link href={`/owners/${owner.id}/edit`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {owner.isSelf && <Badge tone="blue">You</Badge>}
        {stats.feePercent > 0 && (
          <span className="text-sm text-muted-foreground">
            Management fee {formatPercent(stats.feePercent)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Properties Owned" value={stats.propertyCount} icon={Building2} accent="blue" />
        <StatCard label="Total Units" value={stats.totalUnits} icon={Home} accent="purple" />
        <StatCard label="Occupancy" value={formatPercent(stats.occupancy)} icon={Percent} accent="green" />
        <StatCard label="Monthly Rental Income" value={formatCurrency(stats.monthlyRentalIncome, { compact: true })} icon={TrendingUp} accent="green" />
        <StatCard label="Management Fees" value={formatCurrency(stats.managementFees, { compact: true })} icon={DollarSign} accent="amber" />
        <StatCard label="Owner Distributions" value={formatCurrency(stats.totalDistributions, { compact: true })} icon={HandCoins} accent="slate" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <InfoRow icon={Mail} value={owner.email} />
            <InfoRow icon={Phone} value={owner.phone} />
            <InfoRow
              icon={MapPin}
              value={[owner.street, owner.city, owner.state, owner.zip].filter(Boolean).join(", ") || null}
            />
            <InfoRow icon={Mail} value={`Prefers ${label(owner.contactMethod)}`} />
            {owner.taxId && <InfoRow icon={FileText} value={`Tax ID ${owner.taxId}`} />}
            {owner.paymentInfo && <InfoRow icon={DollarSign} value={owner.paymentInfo} />}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="properties">
            <TabsList>
              <TabsTrigger value="properties">Properties ({properties.length})</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="distributions">Distributions ({owner.distributions.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({owner.documents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <Card>
                <CardContent className="p-0">
                  {properties.length === 0 ? (
                    <EmptyState title="No properties" description="Properties owned by this owner appear here." />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>Units</TableHead>
                          <TableHead>Occupancy</TableHead>
                          <TableHead className="text-right">Monthly Income</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {properties.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <Link href={`/properties/${p.id}`} className="font-medium hover:text-primary">
                                {p.name}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {[p.city, p.state].filter(Boolean).join(", ")}
                                {p.ownershipPercent < 100 ? ` · ${formatPercent(p.ownershipPercent, 0)} owned` : ""}
                              </p>
                            </TableCell>
                            <TableCell className="text-sm tabular-nums">
                              {p.occupiedCount}/{p.unitCount}
                            </TableCell>
                            <TableCell className="text-sm tabular-nums">{formatPercent(p.occupancy, 0)}</TableCell>
                            <TableCell className="text-right"><Money value={p.monthlyIncome} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financials">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    <FinRow label="Monthly rental income" value={<Money value={stats.monthlyRentalIncome} />} />
                    <FinRow label="Trailing 12-mo expenses" value={<Money value={stats.trailing12Expenses} />} />
                    <FinRow label="Management fees (monthly)" value={<Money value={stats.managementFees} />} />
                    <FinRow label="Total distributions" value={<Money value={stats.totalDistributions} />} />
                    <FinRow label="Total contributions" value={<Money value={stats.totalContributions} />} />
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    Full owner statements are available on the Reports page.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distributions">
              <Card>
                <CardContent className="p-0">
                  {owner.distributions.length === 0 ? (
                    <EmptyState title="No distributions" description="Payouts to this owner appear here." />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {owner.distributions.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="text-sm">{formatDate(d.date, "short")}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {d.property?.name ?? d.periodLabel ?? "—"}
                            </TableCell>
                            <TableCell><StatusBadge value={d.method} /></TableCell>
                            <TableCell className="text-right"><Money value={d.amount} /></TableCell>
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
                  {owner.documents.length === 0 ? (
                    <EmptyState title="No documents" description="Owner agreements and statements appear here." />
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
                        {owner.documents.map((doc) => (
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

      {owner.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm text-muted-foreground">{owner.notes}</p></CardContent>
        </Card>
      )}
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

function FinRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
