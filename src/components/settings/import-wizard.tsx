"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  Columns3,
  ShieldCheck,
  Table as TableIcon,
  Rocket,
  CheckCircle2,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { importVendors } from "@/server/settings";

interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
}

interface EntityDef {
  key: string;
  label: string;
  fields: FieldDef[];
  committable: boolean;
}

const ENTITIES: EntityDef[] = [
  {
    key: "properties",
    label: "Properties",
    committable: false,
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "type", label: "Type" },
      { key: "street", label: "Street" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "zip", label: "ZIP" },
    ],
  },
  {
    key: "tenants",
    label: "Tenants",
    committable: false,
    fields: [
      { key: "firstName", label: "First Name", required: true },
      { key: "lastName", label: "Last Name", required: true },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
    ],
  },
  {
    key: "vendors",
    label: "Vendors",
    committable: true,
    fields: [
      { key: "companyName", label: "Company Name", required: true },
      { key: "contactName", label: "Contact Name" },
      { key: "category", label: "Category" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
    ],
  },
  {
    key: "expenses",
    label: "Expenses",
    committable: false,
    fields: [
      { key: "date", label: "Date", required: true },
      { key: "category", label: "Category" },
      { key: "amount", label: "Amount", required: true },
      { key: "description", label: "Description" },
    ],
  },
];

const STEPS = [
  { label: "Upload", icon: Upload },
  { label: "Map Columns", icon: Columns3 },
  { label: "Validate", icon: ShieldCheck },
  { label: "Preview", icon: TableIcon },
  { label: "Import", icon: Rocket },
  { label: "Results", icon: CheckCircle2 },
];

const SKIP = "__skip__";

/** Minimal CSV parser (handles double-quoted fields with embedded commas). */
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

export function ImportWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [entityKey, setEntityKey] = React.useState("vendors");
  const [fileName, setFileName] = React.useState("");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<string[][]>([]);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<{ imported: number; skipped: number } | null>(null);

  const entity = ENTITIES.find((e) => e.key === entityKey)!;

  function autoMap(hdrs: string[], ent: EntityDef) {
    const map: Record<string, string> = {};
    for (const f of ent.fields) {
      const match = hdrs.findIndex(
        (h) => h.toLowerCase().replace(/[^a-z]/g, "") === f.key.toLowerCase().replace(/[^a-z]/g, "") ||
          h.toLowerCase() === f.label.toLowerCase(),
      );
      map[f.key] = match >= 0 ? String(match) : SKIP;
    }
    return map;
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.headers.length === 0) {
      toast.error("Could not read any rows from that file.");
      return;
    }
    setFileName(file.name);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(autoMap(parsed.headers, entity));
  }

  const mappedRows = React.useMemo(() => {
    return rows.map((row) => {
      const obj: Record<string, string> = {};
      for (const f of entity.fields) {
        const idx = mapping[f.key];
        obj[f.key] = idx && idx !== SKIP ? row[Number(idx)] ?? "" : "";
      }
      return obj;
    });
  }, [rows, mapping, entity]);

  const validation = React.useMemo(() => {
    const required = entity.fields.filter((f) => f.required);
    let validCount = 0;
    const invalid: { row: number; issue: string }[] = [];
    mappedRows.forEach((r, i) => {
      const missing = required.filter((f) => !r[f.key]?.trim());
      if (missing.length > 0) {
        invalid.push({ row: i + 2, issue: `Missing ${missing.map((m) => m.label).join(", ")}` });
      } else {
        validCount++;
      }
    });
    return { validCount, invalid };
  }, [mappedRows, entity]);

  async function commit() {
    if (!entity.committable) return;
    setPending(true);
    const valid = mappedRows.filter((r) =>
      entity.fields.filter((f) => f.required).every((f) => r[f.key]?.trim()),
    );
    const res = await importVendors(valid);
    if (res.ok) {
      setResult(res.data);
      toast.success(`Imported ${res.data.imported} vendors`);
      setStep(5);
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setPending(false);
  }

  function reset() {
    setStep(0);
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
  }

  const canNext =
    (step === 0 && headers.length > 0) ||
    (step === 1 && entity.fields.filter((f) => f.required).every((f) => mapping[f.key] && mapping[f.key] !== SKIP)) ||
    step === 2 ||
    step === 3;

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
                  active && "border-primary bg-primary/10 text-primary",
                  done && "border-transparent bg-primary text-primary-foreground",
                  !active && !done && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" />}
            </li>
          );
        })}
      </ol>

      <Card>
        <CardContent className="pt-6">
          {/* Step 0 — Upload */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="max-w-xs space-y-1.5">
                <label className="text-sm font-medium text-foreground">Import into</label>
                <Select
                  value={entityKey}
                  onValueChange={(v) => {
                    setEntityKey(v);
                    if (headers.length) setMapping(autoMap(headers, ENTITIES.find((e) => e.key === v)!));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITIES.map((e) => (
                      <SelectItem key={e.key} value={e.key}>
                        {e.label}
                        {!e.committable ? " (preview only)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center hover:bg-muted/50">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {fileName || "Choose a CSV file"}
                </span>
                <span className="text-xs text-muted-foreground">
                  First row must be column headers.
                </span>
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
              </label>

              {headers.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Detected <span className="font-medium text-foreground">{headers.length}</span> columns and{" "}
                  <span className="font-medium text-foreground">{rows.length}</span> rows.
                </p>
              )}
            </div>
          )}

          {/* Step 1 — Map columns */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Match each {entity.label.toLowerCase()} field to a column from your file.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {entity.fields.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      {f.label}
                      {f.required && <span className="ml-0.5 text-destructive">*</span>}
                    </label>
                    <Select
                      value={mapping[f.key] ?? SKIP}
                      onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SKIP}>— Skip —</SelectItem>
                        {headers.map((h, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Validate */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm">
                    <span className="font-semibold tabular-nums">{validation.validCount}</span> valid rows
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">
                    <span className="font-semibold tabular-nums">{validation.invalid.length}</span> rows with issues
                  </span>
                </div>
              </div>
              {validation.invalid.length > 0 && (
                <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Row</TableHead>
                        <TableHead>Issue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validation.invalid.slice(0, 50).map((v) => (
                        <TableRow key={v.row}>
                          <TableCell className="tabular-nums">{v.row}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{v.issue}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Rows with issues will be skipped on import.
              </p>
            </div>
          )}

          {/* Step 3 — Preview */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Previewing the first {Math.min(mappedRows.length, 20)} of {mappedRows.length} rows as they will be imported.
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {entity.fields.map((f) => (
                        <TableHead key={f.key}>{f.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappedRows.slice(0, 20).map((r, i) => (
                      <TableRow key={i}>
                        {entity.fields.map((f) => (
                          <TableCell key={f.key} className="whitespace-nowrap text-sm">
                            {r[f.key] || <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Step 4 — Import */}
          {step === 4 && (
            <div className="space-y-4">
              {entity.committable ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Ready to import{" "}
                    <span className="font-semibold text-foreground tabular-nums">{validation.validCount}</span>{" "}
                    valid {entity.label.toLowerCase()}.{" "}
                    {validation.invalid.length > 0 && (
                      <>{validation.invalid.length} rows with issues will be skipped.</>
                    )}
                  </p>
                  <Button onClick={commit} disabled={pending || validation.validCount === 0}>
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Import {validation.validCount} {entity.label}
                  </Button>
                </>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-4">
                  <Badge tone="amber" className="mt-0.5">Coming soon</Badge>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Importing {entity.label} isn&apos;t wired yet.
                    </p>
                    <p>
                      The wizard has parsed, mapped, and validated your file. Committing{" "}
                      {entity.label.toLowerCase()} to the database is on the roadmap — Vendors
                      import is available today.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5 — Results */}
          {step === 5 && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Import complete</h3>
                <p className="text-sm text-muted-foreground">
                  Imported{" "}
                  <span className="font-semibold text-foreground tabular-nums">{result?.imported ?? 0}</span>{" "}
                  {entity.label.toLowerCase()}
                  {result && result.skipped > 0 && <> · {result.skipped} skipped</>}.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={reset}>
                  Import another file
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer nav */}
      {step < 5 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < 4 && (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
