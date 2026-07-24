# TASKS.md — RentalPM working checklist

Legend: [x] done · [~] partial/scaffolded · [ ] todo

## Foundation
- [x] Scaffold Next.js 16 / TS / Tailwind v4
- [x] Install Prisma, Auth.js, RHF, Zod, Recharts, Lucide, Radix
- [x] Planning docs (PRODUCT, ARCHITECTURE, DATABASE, ERD, ROADMAP, TASKS)
- [x] Prisma schema (all models + enums + indexes)
- [x] `prisma db push` + generate client
- [x] Seed data (5+ properties, units, tenants, leases, 12mo payments,
      expenses, maintenance, vendors, owners, tasks, documents)
- [x] Auth.js credentials + protected layout + `requireUser()`
- [x] UI kit + shared widgets + DataTable
- [x] App shell (sidebar + header + quick add)

## Modules
- [x] Dashboard (KPIs, 12-mo chart, occupancy, collection, maintenance,
      upcoming, activity)
- [x] Properties (list/detail-tabs/create/edit)
- [x] Units (list/create/edit)
- [x] Owners (list/detail/create/edit)
- [x] Tenants (list/detail-tabs/create/edit)
- [x] Leases (list/detail/create/edit + expiration alerts)
- [x] Payments & charges (rent ledger, record payment)
- [x] Rent Roll (search/filter/sort/CSV)
- [x] Security deposits
- [x] Expenses
- [x] Accounting dashboard + metrics
- [x] Maintenance (table + kanban)
- [x] Vendors (list/detail spend)
- [x] Documents
- [x] Inspections (+ checklist)
- [x] Tasks (list + calendar widget)
- [x] Calendar
- [x] Reports
- [x] Owner statements
- [x] Global search
- [x] Notifications
- [x] Settings
- [~] CSV import wizard (UI + validation; server import marked coming soon)

## Quality gates
- [x] `npm run lint` (clean)
- [x] `npm run typecheck` (clean)
- [x] `npm run build` (all ~55 routes)
- [x] Runtime smoke test — every route renders 200 under an authenticated
      session; auth protection redirects unauthenticated requests
