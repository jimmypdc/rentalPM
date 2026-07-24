"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while loading this page. You can try again,
        or head back to the dashboard.
      </p>
      <div className="mt-5 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">Go to dashboard</a>
        </Button>
      </div>
    </div>
  );
}
