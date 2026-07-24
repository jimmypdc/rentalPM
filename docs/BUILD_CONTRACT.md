# BUILD_CONTRACT.md — module build rules for contributors/agents

Follow this EXACTLY. The **Vendors module is the canonical reference** — read
these files and mirror their structure precisely:

- `src/lib/validations/vendor.ts`
- `src/server/vendors.ts`
- `src/components/vendor/vendor-form.tsx`
- `src/components/vendor/vendors-table.tsx`
- `src/app/(app)/vendors/page.tsx`
- `src/app/(app)/vendors/new/page.tsx`
- `src/app/(app)/vendors/[id]/page.tsx`
- `src/app/(app)/vendors/[id]/edit/page.tsx`

## Hard rules

1. **Do NOT run** `npm run build`, `npm run dev`, `tsc`, `next`, `prisma`, or
   the seed. Other work is happening in parallel in the same directory. Just
   write correct code that follows the reference pattern.
2. **Do NOT modify** any shared file: anything in `src/components/ui/**`,
   `src/components/shared/**`, `src/lib/**` (except adding a NEW file under
   `src/lib/validations/`), `src/server/common.ts`, `src/server/dashboard.ts`,
   `prisma/**`, `src/app/(app)/layout.tsx`, `src/lib/nav.ts`, or the vendor
   module. Only create the files you are assigned.
3. **Next.js 16**: `params` and `searchParams` are **Promises** — always
   `await` them. Pages that read the DB must `export const dynamic = "force-dynamic";`
4. **Server Components** fetch data via your `src/server/<module>.ts` functions.
   **Client Components** (`"use client"`) are only for forms, tables (DataTable
   wrapper), kanban, and other interactivity.
5. Every mutating server action starts with `const user = await requireUser();`
   (from `@/lib/auth`), validates with your Zod schema, writes via Prisma,
   calls `logActivity({...})` and `revalidatePath(...)`, returns `ActionResult`.

## Form-schema pattern (CRITICAL to avoid type errors)

Form Zod schemas must keep **input === output**. That means:
- **NO** `.transform()`, **NO** `.default()`, **NO** `.coerce`.
- Optional text/number/date fields: `z.string().trim().optional()` (keep numbers
  and dates as strings in the form; coerce in the server action with `toNum` /
  `toDate` from `@/server/common`).
- Enums: `z.enum(SomeValues)` (from `@/lib/enums`).
- Booleans: `z.boolean()`.
- Email: `z.union([z.literal(""), z.string().email("Invalid email")]).optional()`.

The client form uses `useForm<XInput>({ resolver: zodResolver(schema), defaultValues })`
and submits by building a `FormData` (`fd.set(k, String(v))`) passed to the
server action. See `vendor-form.tsx`.

## Available shared helpers (import, don't recreate)

From `@/lib/utils`: `cn`, `num(decimal|string)→number`, `formatCurrency(v,{compact,cents})`,
`formatPercent(v,digits)`, `formatNumber`, `formatDate(v,'short'|'medium'|'long')`,
`formatDateTime`, `timeAgo`, `initials`, `daysUntil(v)→number|null`, `fullName({firstName,lastName})`.

From `@/lib/enums`: `label(enumValue)→string`, `tone(enumValue)→BadgeTone`,
`optionsFrom(Values)→{value,label}[]`, and value lists:
`PropertyTypeValues, PropertyStatusValues, UnitStatusValues, TenantStatusValues,
LeaseStatusValues, RenewalStatusValues, ChargeTypeValues, ChargeStatusValues,
PaymentMethodValues, DepositStatusValues, ExpenseCategoryValues,
MaintenanceCategoryValues, PriorityValues, MaintenanceStatusValues,
VendorCategoryValues, InspectionTypeValues, ConditionRatingValues,
TaskStatusValues, TaskCategoryValues, DocumentCategoryValues, ContactMethodValues,
WNineStatusValues`.

From `@/lib/metrics`: `computePropertyFinancials(inputs)`, `capRate`, `cashFlow`,
`cashOnCash`, `equity`, `ltv`, `expenseRatio`, `occupancyRate`, `collectionRate`,
`noi`, `effectiveGrossIncome`, and `METRIC_FORMULAS` (for tooltips).

From `@/lib/dates`: `lastNMonths(n)`, `monthKey(date)`, `startOfMonth`, `endOfMonth`,
`addMonths`, `addDays`.

From `@/server/common`: `logActivity({action,entityType,entityId?,summary,propertyId?,userId})`,
`toDate(v)→Date|null`, `toNum(v)→number|null`.

From `@/types`: `type ActionResult<T>`, `ok(data)`, `fail(msg, fieldErrors?)`,
`type SelectOption`.

Shared UI (import from these exact paths):
- `@/components/shared/page-header` → `PageHeader`
- `@/components/shared/back-link` → `BackLink`
- `@/components/shared/stat-card` → `StatCard`
- `@/components/shared/money` → `Money` (accepts Prisma Decimal)
- `@/components/shared/status-badge` → `StatusBadge` (renders enum label + tone)
- `@/components/shared/empty-state` → `EmptyState`
- `@/components/shared/metric-tooltip` → `MetricTooltip`
- `@/components/shared/confirm-dialog` → `ConfirmDialog`
- `@/components/shared/data-table` → `DataTable`, `type Column<T>`
- `@/components/shared/form-field` → `FormField`, `FormGrid`, `FormSection`
- `@/components/shared/rhf` → `SelectField`, `CheckboxField`
- `@/components/shared/charts` → `PerformanceChart`, `OccupancyDonut`, `MiniBarChart`, `TrendArea`
- `@/components/ui/*` → card, button, input, textarea, label, badge, table,
  tabs, select, dialog, dropdown-menu, tooltip, popover, checkbox, progress,
  separator, avatar, skeleton, sheet.

## DataTable usage

`DataTable` is a client component; column `cell`/`sortValue`/`csv` are functions,
so the page that uses it MUST be a Client Component wrapper (see
`vendors-table.tsx`). Server page fetches plain serializable rows and renders
`<XTable data={rows} />`.

`Column<T>` = `{ key, header, cell:(row)=>ReactNode, sortValue?, csv?, className?,
headClassName?, sortable?, hideable? }`. DataTable props: `columns, data,
searchable?:(row)=>string, searchPlaceholder?, pageSize?, getRowHref?,
exportFilename?, initialSort?, emptyTitle?, emptyDescription?, toolbarExtras?`.

## Serialization

Server `list*` functions should return plain objects (numbers via `num()`,
dates via `.toISOString()`) for client tables. Detail pages that render server
components can pass Prisma objects directly to server-rendered UI (Money accepts
Decimal), but anything crossing into a Client Component must be serializable.

## Loading & empty states

Add a `loading.tsx` (skeleton) to each list route where helpful, and use
`EmptyState` when there are no rows.
