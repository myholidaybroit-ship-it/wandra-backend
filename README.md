# Wandra Backend

Multi-tenant SaaS + super-admin backend for Wandra Travel Software.
**Node.js + Express + MongoDB Atlas (Mongoose).** Serves both frontends:

| App | Realm | Base URL |
|-----|-------|----------|
| `wandra-crm` (agency SaaS) | agency users | `/api` |
| `wandra-admin` (super-admin) | platform admin | `/api/admin` |
| client-facing public pages | none (public) | `/api/public` |

Every admin-created agency is a **tenant**; all CRM data is scoped by `agency` and
a JWT can only ever read/write its own tenant's records (verified by the isolation test).

## Setup

```bash
cd wandra-backend
cp .env.example .env          # paste your MongoDB Atlas URI + a JWT secret
npm install
npm run seed:fresh            # seeds ONLY platform essentials: super admin + the 2 plans
npm run dev                   # http://localhost:4000
```

### Getting started (no demo/business data is seeded)

1. Log into the **admin panel** with `admin@wandra.travel / wandra@admin`
   (override via `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`).
2. Create your first **agency** — the admin UI returns/shows its owner password
   (e.g. `travel@0001`).
3. Log into the **CRM** as that agency: the email you entered + that password.
   The agency starts empty and builds its own clients, packages, bookings, etc.

Everything the apps display is fetched live from the backend — there is no seeded
business data and no static frontend fallback. A brand-new agency shows honest
zeros that grow as it uses the product.

## Architecture

```
src/
  config/        db connection, feature catalog, CRM defaults, demo analytics
  models/        Mongoose schemas (Agency=tenant, + admin & CRM collections)
  middleware/    auth (admin + agency realms), plan/feature gating, errors
  services/      pricing engine, lead round-robin, plan entitlements, provisioning
  controllers/   admin/* and crm/* + public; crudFactory for tenant-scoped CRUD
  routes/        admin.js, crm.js, public.js
  seed/          seedRunner + CLI + adminSeedData + integrationTest.mjs
```

- **Pricing** (`services/pricing.js`) and **lead assignment** (`services/assignment.js`)
  are ports of the exact logic from the CRM frontend store, so results match.
- **Feature/limit gating**: each agency carries a per-tenant `features`/`limits` map
  (admin-overridable). `middleware/planGate.js` exposes `requireFeature`/`enforceLimit`.
- **Codes** (CLI-/PKG-/BKG-/INV-/VCH-/AGY-) use atomic per-tenant counters.

## Testing

```bash
node src/seed/integrationTest.mjs   # spins up in-memory Mongo, seeds, drives 36 flows
```

## Key endpoints

**Admin** (`/api/admin`, Bearer admin token): `auth/login`, `dashboard`,
`agencies` (CRUD + `/status` `/features` `/limits` `/password`), `agencies/:id/activate-pro`
`/downgrade` `/renewal/*`, `plans` (+ `/features` `/limits` `/reset` `/apply`),
`feature-catalog`, `transactions`, `demos`.

**CRM** (`/api`, Bearer agency token): `auth/login` `auth/me`, `agency` (+`/features`),
`dashboard`, `users`, `roles`, `assignment` (+`/rules`), `destinations` `hotels` `cabs`
`services` `activities` `templates` (CRUD), `inclusions`, `clients` (+`/docs`),
`packages` (+`/status` `/logs` `/price` `/from-template`), `bookings`
(+`/from-package` `/cancel` `/payments` `/status`), `invoices` (+`/payments`),
`quotations`, `vouchers`, `stories`, `landing`.

**Public** (`/api/public`, no auth): `itinerary/:code`, `invoice/:code`, `voucher/:id`,
`site/:slug` (+ `POST /lead`), `stories/:slug` (GET published / POST submit).
