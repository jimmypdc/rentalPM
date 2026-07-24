# CLAUDE.md — Project Rules & Coding Standards

Rules for the **RentalPM** property management platform. Read before modifying files.

## Product in one line

A single-administrator property-management operating system (AppFolio/Buildium
class, simplified) for tracking a real-estate portfolio: properties, units,
owners, tenants, leases, rent, expenses, maintenance, vendors, documents,
inspections, tasks, and financial reporting.

## Tech stack (do not swap without reason)

- **Next.js 16** App Router + **React 19** + **TypeScript** (strict)
- **PostgreSQL** + **Prisma ORM**
- **Tailwind CSS v4** + **shadcn-style** UI primitives (Radix) in `src/components/ui`
- **Lucide React** icons
- **React Hook Form** + **Zod** for forms & validation
- **Recharts** for charts
- **Auth.js (NextAuth v5)** credentials provider, JWT sessions
- **Server Actions** for mutations; route handlers only where a real HTTP
  surface is needed (auth, CSV export).

## Next.js 16 notes (differs from older training data)

- `params`, `searchParams`, `cookies()`, `headers()` are **async** — always `await`.
- Turbopack is the default bundler; no `--turbopack` flag needed.
- `next lint` is removed — lint via the ESLint CLI (`eslint`).
- Middleware convention is renamed to `proxy`; we protect routes in the
  `(app)/layout.tsx` server component with `auth()` + `redirect()` instead of
  edge middleware (keeps bcrypt off the edge runtime).
- Every Server Action verifies auth via `requireUser()` before any work.

## Folder architecture

```
src/
  app/
    (auth)/login            # public auth pages
    (app)/                  # protected shell (sidebar + header)
      dashboard/ properties/ units/ tenants/ leases/ payments/ rent-roll/
      maintenance/ vendors/ owners/ expenses/ accounting/ documents/
      inspections/ tasks/ reports/ calendar/ settings/
    api/                    # route handlers (auth, csv export)
  components/
    ui/                     # shadcn primitives
    layout/                 # sidebar, header, shell chrome
    shared/                 # cross-module widgets (data-table, kpi-card, ...)
    <module>/               # module-specific components
  lib/
    db.ts auth.ts utils.ts metrics.ts enums.ts
    validations/            # Zod schemas per module
  server/                   # data-access + server actions per module
prisma/ schema.prisma seed.ts
```

## Coding standards

1. **Strict TypeScript.** Avoid `any`; prefer Prisma generated types.
2. **Server-first.** Pages are Server Components reading through `src/server/*`.
   Client Components only where interactivity is needed (`"use client"`).
3. **One source of truth for money.** All financial formulas live in
   `src/lib/metrics.ts`. Never re-derive cap rate / cash flow inline.
4. **Validation everywhere.** Every mutation validates with a Zod schema before
   touching the DB.
5. **Authorization on the server.** Every action/route calls `requireUser()`.
6. **No dead UI.** Buttons work, are disabled, or say "Coming soon". No fake math.
7. **Reusable components.** No monolithic components. Tables use `DataTable`.
8. **States.** Loading (skeleton), empty, and error states for async views.
9. **Money** stored as Prisma `Decimal`; serialized to number at the data-access
   boundary. Never persist totals that can be computed.
10. **Auditability.** Financial records are never hard-deleted — use
    `status`/`voidedAt`. Writes append to `ActivityLog`.
11. **Soft delete** via `deletedAt`; always filtered in the data-access layer.

## Conventions

- Server actions return `ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }`.
- Currency via `formatCurrency()`; enum labels via `src/lib/enums.ts`.
- Protected app lives in the `(app)` route group; auth pages in `(auth)`.

## Definition of done

data-access → Zod validation → server action → UI (list + detail + form) →
loading/empty/error states → wired into nav → `npm run typecheck` and
`npm run build` pass.
