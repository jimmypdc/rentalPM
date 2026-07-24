"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, FileText, Pencil, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { label } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { renameDocument, deleteDocument } from "@/server/documents";

export interface DocumentRow {
  id: string;
  name: string;
  category: string;
  related: string | null;
  mimeType: string | null;
  sizeBytes: number;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

export function DocumentsTable({ data }: { data: DocumentRow[] }) {
  const router = useRouter();
  const [renaming, setRenaming] = React.useState<DocumentRow | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [deleting, setDeleting] = React.useState<DocumentRow | null>(null);
  const [pending, setPending] = React.useState(false);

  function openRename(row: DocumentRow) {
    setRenameValue(row.name);
    setRenaming(row);
  }

  async function confirmRename() {
    if (!renaming) return;
    setPending(true);
    const result = await renameDocument(renaming.id, renameValue);
    if (result.ok) {
      toast.success("Document renamed");
      setRenaming(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setPending(false);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setPending(true);
    const result = await deleteDocument(deleting.id);
    if (result.ok) {
      toast.success("Document archived");
      setDeleting(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setPending(false);
  }

  const columns: Column<DocumentRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (r) => r.name,
      csv: (r) => r.name,
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-medium text-foreground">{r.name}</span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      sortValue: (r) => r.category,
      csv: (r) => label(r.category),
      cell: (r) => <StatusBadge value={r.category} />,
    },
    {
      key: "related",
      header: "Related To",
      hideable: true,
      sortValue: (r) => r.related ?? "",
      csv: (r) => r.related ?? "",
      cell: (r) =>
        r.related ? (
          <span className="text-sm">{r.related}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "size",
      header: "Size",
      hideable: true,
      sortable: true,
      sortValue: (r) => r.sizeBytes,
      csv: (r) => r.sizeBytes,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <span className="text-sm tabular-nums">{formatSize(r.sizeBytes)}</span>,
    },
    {
      key: "createdAt",
      header: "Uploaded",
      sortable: true,
      sortValue: (r) => r.createdAt,
      csv: (r) => formatDate(r.createdAt),
      cell: (r) => <span className="text-sm">{formatDate(r.createdAt, "short")}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-10 text-right",
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => e.stopPropagation()}
              aria-label="Document actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => openRename(r)}>
              <Pencil className="h-4 w-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeleting(r)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchable={(r) => `${r.name} ${label(r.category)} ${r.related ?? ""}`}
        searchPlaceholder="Search documents…"
        exportFilename="documents"
        emptyTitle="No documents yet"
        emptyDescription="Record your first document to keep leases, receipts, and policies organized."
      />

      <Dialog open={!!renaming} onOpenChange={(v) => !v && setRenaming(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename document</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Document name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmRename();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={confirmRename} disabled={pending || !renameValue.trim()}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete document?"
        description={
          deleting
            ? `"${deleting.name}" will be archived and removed from the list.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={pending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
