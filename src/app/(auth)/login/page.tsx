import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const demoEmail = process.env.ADMIN_EMAIL;

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Welcome to RentalPM
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to manage your real-estate portfolio.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <LoginForm defaultEmail={demoEmail} />
      </div>

      {process.env.NODE_ENV !== "production" && (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground">
          <span className="font-medium">Demo login</span> — use the seeded admin
          credentials from your <code>.env</code> ({demoEmail || "ADMIN_EMAIL"} /
          ADMIN_PASSWORD).
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Need help?{" "}
        <Link href="/forgot-password" className="text-primary hover:underline">
          Reset your password
        </Link>
      </p>
    </div>
  );
}
