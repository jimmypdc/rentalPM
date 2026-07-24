# ROADMAP.md — RentalPM

Phased delivery. Each phase ends with `lint` + `typecheck` + `build` green.

## Phase 1 — Foundation ✅
- Next.js 16 + TS + Tailwind v4 + Prisma + Auth.js scaffolding
- Full Prisma schema + migration + realistic Florida seed data
- Auth (login/logout, protected routes, session, password-reset scaffold)
- App shell: collapsible responsive sidebar, header (search, notifications,
  quick add, profile), active-route highlighting
- UI kit (shadcn-style primitives, shared widgets, DataTable)
- Dashboard foundation with real KPIs & charts

## Phase 2 — Portfolio & people
- Properties (list, detail w/ tabs, create/edit)
- Units (list, per-property, create/edit)
- Owners (list, detail, create/edit)
- Tenants (list, detail w/ tabs, create/edit)

## Phase 3 — Leasing & money-in
- Leases (list, detail, create/edit, expiration alerts)
- Rent ledger: charges + payments + allocations
- Rent Roll page (search/filter/sort/export)
- Security deposits

## Phase 4 — Money-out & accounting
- Expenses (list, create/edit, receipt metadata)
- Accounting dashboard (income/NOI/cash flow, filters)
- Per-property financial metrics (cap rate, CoC, equity, LTV, …)

## Phase 5 — Operations
- Maintenance requests (table + kanban, drag status)
- Vendors (list, detail w/ spend & jobs)

## Phase 6 — Docs, inspections, tasks, calendar
- Documents (upload metadata, categorize, search, associate)
- Inspections (with checklist items)
- Tasks (list + calendar), reminders
- Calendar aggregating events

## Phase 7 — Reporting & owner statements
- Reports dashboard (rent roll, P&L, cash flow, delinquency, occupancy,
  maintenance/vendor spend, deposits, property performance)
- Owner statements (per-owner, per-period, property breakdown, print/PDF arch)

## Phase 8 — Polish & system
- Global search (command palette)
- Notifications/alerts center
- CSV import wizard
- Settings (profile, categories, preferences, import/export)
- Mobile responsiveness pass, empty/loading/error states, toasts

## Delivery note

This is a large surface. Phases 1–6 form the working core (schema, auth, shell,
dashboard, all CRUD modules, maintenance kanban, accounting, docs/inspections/
tasks/calendar). Phases 7–8 (reports, owner statements, search, notifications,
settings, import wizard) are built on top of the same data-access layer;
anything not fully finished is clearly marked "Coming soon" rather than faked.
