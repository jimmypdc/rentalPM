# ARCHITECTURE.md — RentalPM

## Overview

RentalPM is a **Next.js 16 App Router** monolith. Server Components read data
directly through a data-access layer; Server Actions perform mutations. Prisma
talks to PostgreSQL. Auth is handled by Auth.js (NextAuth v5) with a credentials
provider and JWT sessions.

```
Browser ──▶ Next.js (App Router)
              │  Server Components ──▶ src/server/*  (data-access) ──▶ Prisma ──▶ PostgreSQL
              │  Server Actions     ──▶ Zod validate ──▶ Prisma + ActivityLog
              │  Route Handlers     ──▶ /api/auth/*, /api/export/*
              └─ Client Components (forms, charts, kanban, command palette)
```

## Layers

### 1. Data layer — `prisma/schema.prisma`
Single normalized schema. Money as `Decimal`. Enums for every controlled
vocabulary. `createdAt`/`updatedAt` everywhere; `deletedAt` for soft delete;
`voidedAt` for financial records. Indexes on foreign keys and common filters.

### 2. Data-access layer — `src/server/*.ts`
One module per domain (`properties.ts`, `leases.ts`, `payments.ts`, …). These
files:
- expose typed query functions used by Server Components,
- expose Server Actions (`"use server"`) for mutations,
- are the **only** place Prisma is imported from app code,
- serialize `Decimal` → `number` at the boundary (`toNumber()` helpers),
- append `ActivityLog` entries on meaningful writes,
- always filter `deletedAt: null`.

Every action calls `requireUser()` (from `lib/auth`) first and validates input
with a Zod schema from `lib/validations`.

### 3. Domain logic — `src/lib/metrics.ts`
Pure functions for all financial formulas: NOI, cap rate, cash-on-cash, equity,
LTV, expense ratio, occupancy, collection rate, cash flow. UI and reports call
these — no inline money math. Formulas are documented and surfaced via tooltips.

### 4. Presentation — `src/app` + `src/components`
- `(auth)` group: login (+ password-reset scaffold).
- `(app)` group: protected shell. `(app)/layout.tsx` calls `auth()` and
  redirects unauthenticated users; renders the sidebar + header chrome.
- `components/ui`: shadcn-style primitives (Radix + CVA).
- `components/shared`: `DataTable`, `KpiCard`, `PageHeader`, `EmptyState`,
  `StatusBadge`, `Money`, chart wrappers, `ConfirmDialog`, `QuickAdd`.
- `components/<module>`: forms and views specific to a module.

## Authentication & authorization

- **Auth.js credentials provider**; passwords hashed with bcrypt.
- **JWT session strategy** (no DB session table needed for a single admin, but
  the `Session`/`Account` adapter models exist for future OAuth).
- Route protection in the protected layout (server-side redirect).
- `requireUser()` guards every Server Action and route handler.
- Role stored on `User.role` (`ADMIN` today) for future RBAC.

## Data flow example — recording a payment

1. `PaymentForm` (client) submits via a Server Action `recordPayment`.
2. Action: `requireUser()` → Zod `paymentSchema.parse()` →
   `prisma.$transaction` creates `Payment` + `PaymentAllocation`s, updates
   related `Charge.status`, writes `ActivityLog` → `revalidatePath()`.
3. Returns `ActionResult`; client shows a toast and the list refreshes.

## Financial integrity

- Charges and payments are **never hard-deleted**; they are voided
  (`voidedAt`, `voidReason`) or waived (status). Balances are always derived
  from `sum(charges) - sum(payments)`.
- `PaymentAllocation` links a payment to the specific charges it satisfies,
  enabling partial payments and accurate per-charge status.

## Extensibility (future-proofing)

- **Roles/portals**: `UserRole` enum + `User↔Owner/Tenant/Vendor` optional
  links let tenant/owner/vendor portals mount later.
- **Payments/integrations**: `Payment.method`/`processorRef` fields and an
  isolated payments service allow Stripe/Plaid/ACH later.
- **Documents**: `Document` stores metadata + a storage key, so swapping local
  stubs for S3 is a one-file change.
- **AI-ready**: clean relations (property↔units↔leases↔charges↔payments,
  property↔expenses↔vendors) make natural-language queries a thin layer on top
  of the data-access functions.

## Cross-cutting concerns

- **Validation**: Zod at every server boundary.
- **Errors**: Server Actions return typed results; UI shows toasts; route
  segments have `error.tsx` + `loading.tsx`.
- **Activity/Audit**: `ActivityLog` + `createdAt/updatedAt/enteredById` on
  financial records.
- **Notifications**: `Notification` table + derived alerts (rent overdue, lease
  expiring, insurance expiring, inspection due, task overdue).
