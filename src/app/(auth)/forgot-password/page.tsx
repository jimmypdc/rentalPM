import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Password reset is wired into the data model (verification tokens) and
          ready to connect to an email provider. For this single-admin
          deployment, reset your credentials by updating <code>ADMIN_PASSWORD</code>{" "}
          in <code>.env</code> and re-running the seed, or hashing a new password
          directly in the database.
        </p>
        <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          Coming soon: email-based reset flow (token issue → email link → set new
          password). The <code>VerificationToken</code> model already supports it.
        </div>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
