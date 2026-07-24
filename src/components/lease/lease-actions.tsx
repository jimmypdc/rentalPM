"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { terminateLease } from "@/server/leases";

export function LeaseActions({ id, disabled }: { id: string; disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onConfirm() {
    setLoading(true);
    const result = await terminateLease(id);
    if (result.ok) {
      toast.success("Lease terminated");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={disabled}>
        <Ban className="h-4 w-4" /> Terminate
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Terminate this lease?"
        description="The lease status will be set to Terminated and today recorded as the move-out date. This cannot be undone."
        confirmLabel="Terminate lease"
        destructive
        onConfirm={onConfirm}
        loading={loading}
      />
    </>
  );
}
