# PRODUCT.md — RentalPM

## Vision

RentalPM is a **property-management operating system** for a single
administrator managing a real-estate portfolio — their own rentals and
properties they manage on behalf of other owners. It should feel like a
premium SaaS product (AppFolio / Buildium / DoorLoop class) but streamlined
for one power user who needs answers in seconds.

## Primary user & role

- **Admin** (the only active role today). The data model is designed so
  `Property Manager`, `Owner`, `Tenant`, and `Vendor` roles/portals can be
  layered on later without a rewrite (see `UserRole` enum + relations).

## Jobs to be done — the app must answer these in seconds

| Question | Where it's answered |
| --- | --- |
| How much rent should I collect this month? | Dashboard "Rent Collection", Rent Roll |
| How much have I collected? | Dashboard, Payments |
| Who owes me money? | Dashboard "Outstanding", Delinquency report |
| Which leases are expiring? | Dashboard "Upcoming", Lease Expiration report |
| Which units are vacant? | Dashboard "Occupancy", Units filter |
| What maintenance is unresolved? | Dashboard "Maintenance", Maintenance board |
| How much is each property making? | Property detail Financials, P&L report |
| What are my largest expenses? | Accounting, Expense report |
| What cash flow is each property producing? | Accounting, Property Performance |
| Which vendor should I contact? | Vendors, filter by category |
| What documents belong to a property? | Property → Documents tab |
| What tasks need attention? | Dashboard "Tasks", Tasks page |
| How is each owner's portfolio performing? | Owner detail, Owner Statement |

## Feature pillars

1. **Portfolio dashboard** — KPI cards, 12-month income/expense/cash-flow chart,
   occupancy, rent collection, maintenance summary, upcoming events, activity.
2. **Property management** — full property records with detail tabs (overview,
   units, tenants, leases, financials, maintenance, expenses, documents,
   inspections, photos, activity).
3. **People** — owners, tenants, vendors, each with a rich detail page and
   linked records.
4. **Leasing** — leases with tenants, deposits, terms, and automatic expiration
   alerts (120/90/60/30 days).
5. **Money** — rent ledger (charges + payments + allocations), security
   deposits, expenses, lightweight accounting, per-property financial metrics.
6. **Operations** — maintenance requests (table + kanban), inspections with
   checklists, tasks with reminders, calendar.
7. **Reporting** — rent roll, P&L, cash flow, delinquency, occupancy, owner
   statements, and more, with filtering, CSV export, print/PDF architecture.
8. **System** — global search, notifications/alerts, documents, settings, CSV
   import wizard.

## Design principles

- Clean light neutral canvas; dark charcoal/navy sidebar; blue accent.
- Green only for positive financial signal; red only for warnings/errors.
- Rounded cards, subtle shadows, generous spacing, professional typography.
- Desktop-first, fully responsive down to mobile.
- Every record links to its related records — nothing is an island.

## Non-goals (for now)

- Not a QuickBooks replacement (lightweight accounting only).
- No online payments, e-signature, screening, or syndication yet — but the
  schema and service layer are structured so they can be added later.

## Success criteria

The product is successful when the admin can open the dashboard and, within a
few clicks, answer every question in the table above against **real, seeded,
interconnected data** — not a static mockup.
