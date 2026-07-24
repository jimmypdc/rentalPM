# RentalPM — Property Management Platform

A premium, single-administrator property-management operating system for
tracking a real-estate portfolio: properties, units, owners, tenants, leases,
rent, expenses, maintenance, vendors, documents, inspections, tasks, and
financial reporting. Built to feel like AppFolio / Buildium / DoorLoop, but
streamlined for one power user.

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** (strict)
- **PostgreSQL** · **Prisma 6**
- **Tailwind CSS v4** · shadcn-style UI (Radix primitives)
- **Auth.js (NextAuth v5)** — credentials + JWT sessions
- **React Hook Form** + **Zod** · **Recharts** · **Lucide**

## Getting started

### 1. Prerequisites
- Node.js 20.9+
- A running PostgreSQL 16 instance

### 2. Environment
Copy `.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
# set DATABASE_URL, AUTH_SECRET (openssl rand -base64 32),
# ADMIN_EMAIL and ADMIN_PASSWORD
```

### 3. Install & set up the database

```bash
npm install
npm run db:push       # create the schema
npm run db:seed       # load realistic sample data (Florida portfolio)
```

### 4. Run

```bash
npm run dev           # http://localhost:3000
```

Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`
(the seed prints them).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Push the Prisma schema |
| `npm run db:seed` | Seed sample data |
| `npm run db:generate` | Regenerate the Prisma client |

## Architecture

See the `docs/` folder:
- `PRODUCT.md` — product vision & jobs-to-be-done
- `ARCHITECTURE.md` — system design
- `DATABASE.md` + `ERD.md` — data model & entity diagram
- `ROADMAP.md` — phased delivery plan
- `BUILD_CONTRACT.md` — module conventions
- `CLAUDE.md` (root) — coding standards

**Layering:** Server Components read through the data-access layer in
`src/server/*`; Server Actions perform validated mutations; all financial
formulas live in `src/lib/metrics.ts`; UI primitives in `src/components/ui`,
shared widgets in `src/components/shared`.

## Security notes

- Passwords are bcrypt-hashed; sessions are JWT.
- Routes under `(app)` are protected in the group layout; every Server Action
  calls `requireUser()`.
- Input is validated with Zod on the server; Prisma parameterizes all queries.
- Secrets live in `.env` (git-ignored).

## Roadmap / future

Designed so tenant/owner/vendor portals, online payments (Stripe/Plaid/ACH),
e-signature, screening, and QuickBooks sync can be layered on without a rewrite.
