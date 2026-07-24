import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Record not found</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        The record you&apos;re looking for doesn&apos;t exist or may have been
        archived.
      </p>
      <Button className="mt-5" asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
