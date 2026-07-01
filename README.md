# SEAPEDIA

SEAPEDIA is a multi-seller online marketplace. It lets one account hold several roles (Buyer, Seller, Driver, Admin) and act as one role at a time. Buyers can browse products from many local stores, top up a digital wallet, add items to a cart, and check out. Sellers can open a store, manage products, and receive incoming orders.

This repository is a monorepo that contains two applications:

- **`apps/api`** - the backend REST API (NestJS).
- **`apps/web`** - the frontend web application (Next.js).

> **Scope:** This project implements Levels 1 to 3 of the challenge. Levels 4 to 7 (vouchers, driver delivery flow, admin dashboards, order progression, refunds, and so on) are intentionally out of scope.

---

## 1. Tech stack

| Area | Technology |
|------|------------|
| Package manager | pnpm workspaces (monorepo) |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL (developed on Neon serverless) |
| ORM | Prisma 7.8 (driver-adapter mode with `@prisma/adapter-pg`) |
| Auth | JWT (`@nestjs/jwt` + `passport-jwt`), passwords hashed with `argon2` |
| Validation | `class-validator` + `class-transformer` |
| Frontend | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS v4 (light and dark theme support) |
| UI language | Bahasa Indonesia |

---

## 2. Prerequisites

Make sure the following are installed before you start:

- **Node.js** version 22 or newer.
- **pnpm** version 9 or newer. Install it with `npm install -g pnpm` if needed.
- **A PostgreSQL database.** You can use a local PostgreSQL server or a hosted one such as [Neon](https://neon.tech). You need a connection string (URL).

---

## 3. Project structure

```
seapedia/
├─ apps/
│  ├─ api/                  # NestJS backend
│  │  ├─ prisma/            # schema.prisma, seed.ts, migrations
│  │  ├─ prisma.config.ts
│  │  └─ src/               # source code (auth, stores, products, cart, checkout, orders, ...)
│  └─ web/                  # Next.js frontend
│     └─ src/app/           # pages (App Router)
├─ pnpm-workspace.yaml      # workspace + native build allow-list
└─ package.json             # root scripts
```

---

## 4. Environment variables

The application will not run without these files. They are ignored by Git, so you must create them yourself.

### 4.1 Backend - `apps/api/.env`

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql://user:password@host:5432/seapedia` | PostgreSQL connection string. Use the pooled connection string if you use Neon. |
| `JWT_ACCESS_SECRET` | Yes | `a-long-random-secret-string` | Secret key used to sign JWT access tokens. Use a long, random value. |
| `JWT_ACCESS_TTL` | Yes | `15m` | How long an access token stays valid (for example `15m`, `1h`). |
| `PORT` | No | `3000` | Port the API listens on. Defaults to `3000` if not set. |
| `WEB_ORIGIN` | No | `https://seapedianyaniaueow.vercel.app/` | Comma-separated list of allowed frontend origins for CORS. `http://localhost:3001` is always allowed automatically, so you only need this for production. |

Example `apps/api/.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/seapedia"
JWT_ACCESS_SECRET="change-this-to-a-long-random-string"
JWT_ACCESS_TTL="15m"
```

### 4.2 Frontend - `apps/web/.env.local`

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3000` | Base URL of the backend API. The browser uses this to call the API. |

Example `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 5. Setup and installation

Run all commands from the **repository root** unless stated otherwise.

### Step 1 - Install dependencies

```bash
pnpm install
```

This installs dependencies for both applications. Some packages need native build scripts (for example `argon2`, `sharp`, and the Prisma engines). They are already allow-listed in `pnpm-workspace.yaml`, so the install should complete without extra steps.

### Step 2 - Create the environment files

Create the two files described in [Section 4](#4-environment-variables):

- `apps/api/.env`
- `apps/web/.env.local`

### Step 3 - Set up the database

From the `apps/api` folder, run the Prisma commands:

```bash
cd apps/api

# Create the database tables (runs the migrations)
pnpm prisma migrate dev

# Generate the Prisma client
pnpm prisma generate

# Fill the database with sample data and test accounts
pnpm prisma db seed
```

> Tip: `pnpm prisma migrate reset` will wipe the database, re-apply all migrations, and re-run the seed. This is safe to use during development.

---

## 6. Running the application

You need the backend and the frontend running at the same time.

### Option A - Run both at once (from the repository root)

```bash
pnpm dev
```

### Option B - Run each app in its own terminal

```bash
# Terminal 1 - backend
cd apps/api
pnpm run start:dev        # http://localhost:3000

# Terminal 2 - frontend
cd apps/web
pnpm dev                  # http://localhost:3001
```

When both are running, open **http://localhost:3001** in your browser.

- Backend API: **http://localhost:3000**
- Frontend web app: **http://localhost:3001**

### Production build

```bash
# Backend
cd apps/api
pnpm build
pnpm run start:prod

# Frontend
cd apps/web
pnpm build
pnpm start
```

---

## 7. Test accounts

After you run the seed (`pnpm prisma db seed`), the following accounts are available. The seed is safe to run more than once (it updates existing rows instead of creating duplicates).

| Username | Password | Role(s) | Notes |
|----------|----------|---------|-------|
| `admin` | `Admin#123` | Admin | Seed account only |
| `buyer` | `Buyer#123` | Buyer | |
| `seller` | `Seller#123` | Seller | Owns the store "Toko Demo" with 2 products |
| `driver` | `Driver#123` | Driver | Placeholder role |
| `multi` | `Multi#123` | Buyer + Seller | Useful for testing role switching |

---

## 8. Admin account

The Admin role is **not** available through the public sign-up page. New users can only register as Buyer, Seller, or Driver. This is intentional: admin access is granted through the database seed, not through self-registration.

### How to get an admin account

**Default admin (recommended):**
Running the seed already creates a ready-to-use admin account:

- Username: `admin`
- Password: `Admin#123`

Just run the seed and log in with those details:

```bash
cd apps/api
pnpm prisma db seed
```

**Creating a custom admin account:**
If you want a different admin username or password, edit the seed file at `apps/api/prisma/seed.ts`, change the admin user's details (the seed hashes the password with `argon2` before saving), and run the seed again:

```bash
cd apps/api
pnpm prisma db seed
```

> Note: The admin account is used for identity and testing only. Admin-specific dashboards and features belong to Levels 4 to 7 and are outside the scope of this project. After logging in as admin, you can still browse the public catalog.

---

## 9. Useful scripts

Run these from the repository root:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run the backend and frontend together |
| `pnpm dev:api` | Run only the backend |
| `pnpm dev:web` | Run only the frontend |

Run these from `apps/api`:

| Command | Description |
|---------|-------------|
| `pnpm run start:dev` | Start the API in watch mode |
| `pnpm prisma migrate dev` | Apply database migrations |
| `pnpm prisma db seed` | Seed the database with sample data and accounts |
| `pnpm prisma studio` | Open a visual editor for the database |

---

## 10. Key features

- **Multi-role accounts.** One account can be a Buyer, Seller, and Driver. The user picks an active role after logging in and can switch roles at any time.
- **Public catalog.** Anyone can browse products and stores without logging in.
- **Digital wallet.** Buyers can top up a wallet (simulated) and pay for orders with the balance.
- **Single-store cart.** A cart can only hold products from one store at a time. This keeps delivery fees simple.
- **Checkout with correct totals.** Tax (PPN) is 12% of the subtotal only. Total = subtotal + PPN + delivery fee. Delivery fees: Instant 30,000, Next Day 20,000, Regular 10,000 (in Rupiah).
- **Order tracking.** Buyers see their orders with a status timeline. New orders start at "Sedang Dikemas" (being packed).
- **Seller tools.** Sellers can open one store (with a unique name), manage products, and see incoming orders.
- **Light and dark mode.** The interface has a full, dedicated color system for both themes and a working theme toggle.

---

## 11. Troubleshooting

- **Install fails with `ERR_PNPM_IGNORED_BUILDS`.** A native package needs build approval. Add the package name to `onlyBuiltDependencies` (allow list) in `pnpm-workspace.yaml`, then run `pnpm install` again from the repository root.
- **The frontend cannot reach the API (CORS or network error).** Confirm the backend is running on port 3000, that `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` points to it, and that the frontend origin is allowed. For production, set `WEB_ORIGIN` on the backend.
- **Database errors on start.** Make sure `DATABASE_URL` is correct and that you have run `pnpm prisma migrate dev` and `pnpm prisma generate`.
- **Windows users.** This project was developed on Windows with PowerShell. Stop a running server with `Ctrl + C`.
