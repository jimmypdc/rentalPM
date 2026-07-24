import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Pencil, MapPin, Building2, DollarSign, TrendingUp, Percent, Home,
  Wallet,
} from "lucide-react";
import { getProperty } from "@/server/properties";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricTooltip } from "@/components/shared/metric-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { label } from "@/lib/enums";
import { METRIC_FORMULAS } from "@/lib/metrics";
import { formatCurrency, formatDate, formatPercent, fullName, num } from "@/lib/utils";

export const metadata: Metadata = { title: "Property" };
export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProperty(id);
  if (!data) notFound();
  const { property, financials, aggregates } = data;

  const fullAddress = [property.street, property.city, property.state, property.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <BackLink href="/properties" label="Properties" />
      <PageHeader
        title={property.name}
        description={`${label(property.type)} · ${fullAddress}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/properties/${property.id}/edit`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={property.status} />
        {property.ownerEntity && (
          <span className="text-sm text-muted-foreground">{property.ownerEntity}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Occupancy"
          value={formatPercent(aggregates.occupancyRate, 0)}
          hint={`${aggregates.occupiedCount}/${aggregates.unitCount} units`}
          icon={Home}
          accent="blue"
        />
        <StatCard
          label="Monthly Rent"
          value={formatCurrency(aggregates.monthlyRent, { compact: true })}
          icon={DollarSign}
          accent="green"
        />
        <StatCard
          label="Est. Value"
          value={formatCurrency(num(property.estimatedValue), { compact: true })}
          icon={Building2}
          accent="purple"
        />
        <StatCard
          label="Equity"
          value={formatCurrency(financials.equity, { compact: true })}
          icon={Wallet}
          accent="green"
        />
        <StatCard
          label="Cash Flow / mo"
          value={formatCurrency(financials.monthlyCashFlow, { compact: true })}
          icon={TrendingUp}
          accent={financials.monthlyCashFlow >= 0 ? "green" : "red"}
        />
        <StatCard
          label="Cap Rate"
          value={formatPercent(financials.capRate)}
          icon={Percent}
          accent="amber"
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="units">Units ({property.units.length})</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="leases">Leases ({property.leases.length})</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance ({property.maintenanceRequests.length})</TabsTrigger>
          <TabsTrigger value="expenses">Expenses ({property.expenses.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({property.documents.length})</TabsTrigger>
          <TabsTrigger value="inspections">Inspections ({property.inspections.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Location & facts</CardTitle></CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <InfoRow icon={MapPin} value={fullAddress} />
                {property.county && <Fact label="County" value={property.county} />}
                {property.squareFeet != null && <Fact label="Square feet" value={property.squareFeet.toLocaleString()} />}
                {property.yearBuilt != null && <Fact label="Year built" value={String(property.yearBuilt)} />}
                {property.bedrooms != null && <Fact label="Bedrooms" value={String(property.bedrooms)} />}
                {num(property.bathrooms) > 0 && <Fact label="Bathrooms" value={String(num(property.bathrooms))} />}
                {property.owners.length > 0 && (
                  <Fact
                    label="Owners"
                    value={property.owners.map((o) => `${fullName(o.owner)} (${num(o.ownershipPercent)}%)`).join(", ")}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Financing & carrying costs</CardTitle></CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                {property.mortgage ? (
                  <>
                    <Fact label="Lender" value={property.mortgage.lender ?? "—"} />
                    <Fact label="Balance" value={formatCurrency(property.mortgage.balance)} />
                    <Fact label="Monthly payment" value={formatCurrency(property.mortgage.monthlyPayment)} />
                    {num(property.mortgage.interestRate) > 0 && (
                      <Fact label="Rate" value={formatPercent(num(property.mortgage.interestRate))} />
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No mortgage on file (owned free & clear).</p>
                )}
                {num(property.propertyTaxAnnual) > 0 && <Fact label="Property tax / yr" value={formatCurrency(property.propertyTaxAnnual)} />}
                {num(property.insuranceAnnual) > 0 && <Fact label="Insurance / yr" value={formatCurrency(property.insuranceAnnual)} />}
                {num(property.hoaMonthly) > 0 && <Fact label="HOA / mo" value={formatCurrency(property.hoaMonthly)} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Coverage & taxes</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {property.insurancePolicies.length === 0 && property.propertyTaxes.length === 0 ? (
                  <p className="text-muted-foreground">No insurance policies or tax records.</p>
                ) : (
                  <>
                    {property.insurancePolicies.slice(0, 3).map((p) => (
                      <div key={p.id} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{p.carrier}</span>
                        <span>{p.expirationDate ? `exp ${formatDate(p.expirationDate, "short")}` : "—"}</span>
                      </div>
                    ))}
                    {property.propertyTaxes.slice(0, 2).map((t) => (
                      <div key={t.id} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Tax {t.year}</span>
                        <span><Money value={t.amount} /> {t.paid ? "(paid)" : ""}</span>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {property.notes && (
            <Card className="mt-4">
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{property.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Units */}
        <TabsContent value="units">
          <Card>
            <CardContent className="p-0">
              {property.units.length === 0 ? (
                <EmptyState title="No units" description="Add units to this property to track occupancy." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Beds/Baths</TableHead>
                      <TableHead>Sqft</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Market Rent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {property.units.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <Link href={`/units/${u.id}/edit`} className="font-medium hover:text-primary">{u.number}</Link>
                        </TableCell>
                        <TableCell className="text-sm">{u.bedrooms ?? "—"} bd / {num(u.bathrooms) || "—"} ba</TableCell>
                        <TableCell className="text-sm">{u.squareFeet ? u.squareFeet.toLocaleString() : "—"}</TableCell>
                        <TableCell><StatusBadge value={u.status} /></TableCell>
                        <TableCell className="text-right"><Money value={u.marketRent} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenants */}
        <TabsContent value="tenants">
          <Card>
            <CardContent className="p-0">
              {property.leases.every((l) => l.tenants.length === 0) ? (
                <EmptyState title="No active tenants" description="Tenants on active leases appear here." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {property.leases.flatMap((l) =>
                      l.tenants.map((lt) => (
                        <TableRow key={lt.id}>
                          <TableCell className="font-medium">{fullName(lt.tenant)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{l.unit?.number ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{lt.tenant.email ?? lt.tenant.phone ?? "—"}</TableCell>
                        </TableRow>
                      )),
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leases */}
        <TabsContent value="leases">
          <Card>
            <CardContent className="p-0">
              {property.leases.length === 0 ? (
                <EmptyState title="No active leases" description="Active and month-to-month leases appear here." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Rent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {property.leases.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.unit?.number ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(l.startDate, "short")} – {formatDate(l.endDate, "short")}
                        </TableCell>
                        <TableCell><StatusBadge value={l.status} /></TableCell>
                        <TableCell className="text-right"><Money value={l.rent} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financials */}
        <TabsContent value="financials">
          <Card>
            <CardHeader><CardTitle>Annualized performance</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              <FinRow label="Gross rental income" formula={METRIC_FORMULAS.egi} value={formatCurrency(financials.grossRent)} />
              <FinRow label="Effective gross income" formula={METRIC_FORMULAS.egi} value={formatCurrency(financials.egi)} />
              <FinRow label="Operating expenses (TTM)" value={formatCurrency(financials.operatingExpenses)} />
              <FinRow label="NOI" formula={METRIC_FORMULAS.noi} value={formatCurrency(financials.noi)} />
              <FinRow label="Annual debt service" value={formatCurrency(aggregates.annualDebtService)} />
              <FinRow label="Annual cash flow" formula={METRIC_FORMULAS.cashFlow} value={formatCurrency(financials.annualCashFlow)} />
              <FinRow label="Cap rate" formula={METRIC_FORMULAS.capRate} value={formatPercent(financials.capRate)} />
              <FinRow label="Cash-on-cash" formula={METRIC_FORMULAS.cashOnCash} value={formatPercent(financials.cashOnCash)} />
              <FinRow label="Equity" formula={METRIC_FORMULAS.equity} value={formatCurrency(financials.equity)} />
              <FinRow label="LTV" formula={METRIC_FORMULAS.ltv} value={formatPercent(financials.ltv)} />
              <FinRow label="Expense ratio" formula={METRIC_FORMULAS.expenseRatio} value={formatPercent(financials.expenseRatio)} />
              <FinRow label="Occupancy" formula={METRIC_FORMULAS.occupancy} value={formatPercent(aggregates.occupancyRate, 0)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance">
          <Card>
            <CardContent className="p-0">
              {property.maintenanceRequests.length === 0 ? (
                <EmptyState title="No maintenance requests" description="Recent work orders for this property appear here." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {property.maintenanceRequests.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <Link href={`/maintenance/${m.id}`} className="font-medium hover:text-primary">
                            #{m.number} {m.title}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.unit?.number ?? "—"}</TableCell>
                        <TableCell><StatusBadge value={m.priority} /></TableCell>
                        <TableCell><StatusBadge value={m.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses">
          <Card>
            <CardContent className="p-0">
              {property.expenses.length === 0 ? (
                <EmptyState title="No expenses" description="Recent expenses for this property appear here." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {property.expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm">{formatDate(e.date, "short")}</TableCell>
                        <TableCell><StatusBadge value={e.category} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.vendor?.companyName ?? "—"}</TableCell>
                        <TableCell className="text-right"><Money value={e.amount} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <Card>
            <CardContent className="p-0">
              {property.documents.length === 0 ? (
                <EmptyState title="No documents" description="Files attached to this property appear here." />
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
                    {property.documents.map((doc) => (
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

        {/* Inspections */}
        <TabsContent value="inspections">
          <Card>
            <CardContent className="p-0">
              {property.inspections.length === 0 ? (
                <EmptyState title="No inspections" description="Inspection history for this property appears here." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Inspector</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {property.inspections.map((ins) => (
                      <TableRow key={ins.id}>
                        <TableCell className="text-sm">{formatDate(ins.inspectionDate, "short")}</TableCell>
                        <TableCell><StatusBadge value={ins.type} /></TableCell>
                        <TableCell><StatusBadge value={ins.conditionRating} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ins.inspector ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="p-0">
              {property.activityLogs.length === 0 ? (
                <EmptyState title="No activity" description="Recent changes to this property appear here." />
              ) : (
                <ul className="divide-y divide-border">
                  {property.activityLogs.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="text-foreground">{a.summary}</p>
                        {a.user?.name && <p className="text-xs text-muted-foreground">{a.user.name}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.createdAt, "short")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

function Fact({ label: l, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{l}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

function FinRow({
  label: l,
  value,
  formula,
}: {
  label: string;
  value: string;
  formula?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {l}
        {formula && <MetricTooltip formula={formula} />}
      </span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}
