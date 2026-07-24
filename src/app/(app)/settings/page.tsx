import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Upload,
  Download,
  Bell,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  optionsFrom,
  ExpenseCategoryValues,
  MaintenanceCategoryValues,
  PropertyTypeValues,
  DocumentCategoryValues,
  PaymentMethodValues,
} from "@/lib/enums";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const VOCABULARIES = [
  { title: "Financial Categories", values: ExpenseCategoryValues },
  { title: "Maintenance Categories", values: MaintenanceCategoryValues },
  { title: "Property Types", values: PropertyTypeValues },
  { title: "Document Categories", values: DocumentCategoryValues },
  { title: "Payment Methods", values: PaymentMethodValues },
] as const;

function ComingSoon() {
  return (
    <Badge tone="amber" className="ml-2 align-middle">
      Coming soon
    </Badge>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile, preferences, and system vocabularies." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="vocabularies">Categories</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account details.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                initial={{
                  name: user?.name ?? "",
                  email: user?.email ?? session.user.email ?? "",
                  phone: user?.phone ?? "",
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Application Preferences (placeholders) */}
        <TabsContent value="preferences">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Appearance", desc: "Light / dark theme and density options." },
              { title: "Localization", desc: "Currency, date format, and timezone." },
              { title: "Default Property State", desc: "Default state and county for new records." },
              { title: "Fiscal Year", desc: "Reporting period start for statements." },
            ].map((p) => (
              <Card key={p.title}>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
                    {p.title}
                    <ComingSoon />
                  </CardTitle>
                  <CardDescription>{p.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* System vocabularies */}
        <TabsContent value="vocabularies">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              These are the system vocabularies used across RentalPM. They are read-only.
            </p>
            {VOCABULARIES.map((v) => (
              <Card key={v.title}>
                <CardHeader>
                  <CardTitle className="text-base">{v.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {optionsFrom(v.values).map((o) => (
                      <Badge key={o.value} tone="slate">
                        {o.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Notification preferences (placeholders) */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
                Notification Preferences
                <ComingSoon />
              </CardTitle>
              <CardDescription>Choose which alerts you receive and how.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Rent overdue alerts",
                "Lease expiration reminders",
                "Maintenance status updates",
                "Insurance & tax renewals",
              ].map((n) => (
                <div
                  key={n}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5"
                >
                  <span className="text-sm text-foreground">{n}</span>
                  <span className="h-5 w-9 rounded-full bg-muted" aria-hidden />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data import / export */}
        <TabsContent value="data">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Upload className="mr-2 h-4 w-4 text-muted-foreground" />
                  Import
                </CardTitle>
                <CardDescription>
                  Bring in Properties, Tenants, Vendors, or Expenses from a CSV file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/settings/import">
                    Open CSV Import Wizard <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                  Export
                </CardTitle>
                <CardDescription>
                  Export is available per-table — use the Export button on any list
                  view (Properties, Tenants, Vendors, Expenses, Reports) to download a CSV.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
