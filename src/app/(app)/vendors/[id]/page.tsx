import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Pencil, Mail, Phone, Globe, MapPin, Star, Wrench, Receipt,
  Briefcase, DollarSign, Building2, FileText,
} from "lucide-react";
import { getVendor } from "@/server/vendors";
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
import { formatCurrency, formatDate, num } from "@/lib/utils";

export const metadata: Metadata = { title: "Vendor" };
export const dynamic = "force-dynamic";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getVendor(id);
  if (!data) notFound();
  const { vendor, stats } = data;

  return (
    <div className="space-y-6">
      <BackLink href="/vendors" label="Vendors" />
      <PageHeader
        title={vendor.companyName}
        description={`${label(vendor.category)}${vendor.contactName ? ` · ${vendor.contactName}` : ""}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/vendors/${vendor.id}/edit`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {vendor.preferred && (
          <Badge tone="amber">
            <Star className="mr-1 h-3 w-3 fill-current" /> Preferred
          </Badge>
        )}
        <StatusBadge value={vendor.wNineStatus} />
        {vendor.insuranceExpiration && (
          <span className="text-sm text-muted-foreground">
            Insurance until {formatDate(vendor.insuranceExpiration)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Spend" value={formatCurrency(stats.totalSpend, { compact: true })} icon={DollarSign} accent="green" />
        <StatCard label="Total Jobs" value={stats.totalJobs} icon={Briefcase} accent="blue" />
        <StatCard label="Open Work Orders" value={stats.openWorkOrders} icon={Wrench} accent={stats.openWorkOrders > 0 ? "amber" : "slate"} />
        <StatCard label="Avg Job Cost" value={formatCurrency(stats.avgJobCost, { compact: true })} icon={Receipt} accent="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <InfoRow icon={Mail} value={vendor.email} />
            <InfoRow icon={Phone} value={vendor.phone} />
            <InfoRow icon={Globe} value={vendor.website} />
            <InfoRow
              icon={MapPin}
              value={[vendor.street, vendor.city, vendor.state, vendor.zip].filter(Boolean).join(", ") || null}
            />
            <InfoRow icon={Building2} value={`${stats.propertiesServiced} properties serviced`} />
            {num(vendor.hourlyRate) > 0 && (
              <InfoRow icon={DollarSign} value={`${formatCurrency(vendor.hourlyRate)}/hr`} />
            )}
            {vendor.licenseNumber && (
              <InfoRow icon={FileText} value={`License ${vendor.licenseNumber}`} />
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="jobs">
            <TabsList>
              <TabsTrigger value="jobs">Jobs ({vendor.maintenanceRequests.length})</TabsTrigger>
              <TabsTrigger value="expenses">Expenses ({vendor.expenses.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({vendor.documents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="jobs">
              <Card>
                <CardContent className="p-0">
                  {vendor.maintenanceRequests.length === 0 ? (
                    <EmptyState title="No jobs yet" description="Work orders assigned to this vendor appear here." />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendor.maintenanceRequests.map((m) => (
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
                            <TableCell className="text-right">
                              <Money value={num(m.actualCost) || num(m.estimatedCost)} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expenses">
              <Card>
                <CardContent className="p-0">
                  {vendor.expenses.length === 0 ? (
                    <EmptyState title="No expenses" description="Expenses billed by this vendor appear here." />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendor.expenses.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell className="text-sm">{formatDate(e.date, "short")}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{e.property.name}</TableCell>
                            <TableCell><StatusBadge value={e.category} /></TableCell>
                            <TableCell className="text-right"><Money value={e.amount} /></TableCell>
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
                  {vendor.documents.length === 0 ? (
                    <EmptyState title="No documents" description="W-9s, insurance certificates, and invoices appear here." />
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
                        {vendor.documents.map((doc) => (
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

      {vendor.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm text-muted-foreground">{vendor.notes}</p></CardContent>
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
