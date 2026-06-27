# SEAPEDIA — Web (`apps/web`)

The Next.js frontend for SEAPEDIA, a multi-seller marketplace. Talks to the NestJS backend in `apps/api`.

> Scope: **Levels 1–3 only.** See the repo-root `CLAUDE.md` for the full project contract, API reference, and remaining-work plan. This README is the quick operational guide for the web app.

---

## Stack

- **Next.js 16** (App Router, `src/` directory)
- **React 19** + TypeScript
- **Tailwind v4** (CSS-first; tokens live in `src/app/globals.css`)
- **Manrope** via `next/font/google`
- Auth state in React Context; JWT stored in `localStorage`

---

## Prerequisites

- Node 22+, pnpm 9+
- The **backend must be running** for anything beyond the static landing. Start it first:
  ```bash
  cd apps/api && pnpm run start:dev      # http://localhost:3000
  ```
- The backend has CORS enabled for `http://localhost:3001` and seeds test accounts (see below).

---

## Environment

Create `apps/web/.env.local` (git-ignored):

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Only `NEXT_PUBLIC_`-prefixed vars are readable in browser code. Restart the dev server after changing this file.

---

## Run

```bash
cd apps/web
pnpm install        # first time (from repo root is fine too)
pnpm dev            # http://localhost:3001
```

The dev script pins port **3001** (`next dev -p 3001`) so it doesn't collide with the API on 3000. Run the API in one terminal and the web app in another.

```bash
pnpm build          # production build
pnpm start          # serve the build (also on 3001 if configured)
pnpm lint           # eslint
```

> If `pnpm install` fails with `ERR_PNPM_IGNORED_BUILDS` (e.g. `sharp`), add the package to `onlyBuiltDependencies` in the repo-root `pnpm-workspace.yaml` and reinstall. This is a one-time approval.

---

## Project structure

```
src/
├─ app/
│  ├─ layout.tsx        # Manrope font, <AuthProvider>, shared <Navbar>, metadata
│  ├─ globals.css       # Tailwind import + design tokens + reusable component classes
│  ├─ page.tsx          # Public landing (hero + product tiles, server-fetched)
│  ├─ login/page.tsx    # Login (+ role-selector modal on multi-role)
│  └─ register/page.tsx # Register (role multi-select)
│  └─ … (remaining pages: products, cart, wallet, addresses, checkout, orders, seller/*)
├─ auth/
│  ├─ auth-context.tsx  # AuthProvider + useAuth() — user, login, selectRole, logout
│  └─ RoleSelectorModal.tsx
├─ components/
│  └─ Navbar.tsx        # role-aware top nav, active-link highlight, logout
└─ lib/
   └─ api.ts            # fetch wrapper: base URL + Bearer token + error handling
```

---

## Conventions

- **Backend calls go through `api()`** in `src/lib/api.ts` — it adds the base URL, attaches the Bearer token from `localStorage['seapedia_token']`, parses JSON, and throws `ApiError { message, status, body }`. Don't hand-roll `fetch` for API calls in pages.
- **Auth anywhere:** `const { user, loading, login, selectRole, logout } = useAuth()`. `user = { id, username, roles, activeRole }` or `null`.
- **`"use client";`** must be the first line of any component using state, effects, events, or `useAuth()`. Pure server-rendered data pages can stay server components.
- **Role-aware UI:** the navbar and protected pages key off `user.activeRole`. Guard role-specific pages with a client check (wait for `loading`, then redirect to `/login` if logged out or `/` if the active role doesn't match). The backend enforces auth regardless — the guard is for UX.
- **Money formatting:** `new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`. All amounts from the API are integer Rupiah.
- **UI copy is in Bahasa Indonesia**, sentence case, plain verbs.
- **Handle the API error codes in the UI:** `DIFFERENT_STORE` (offer "kosongkan keranjang & tambah"), `INSUFFICIENT_BALANCE` (prompt top-up), `INSUFFICIENT_STOCK` (name the item).

---

## Design system

Identity: "the marketplace of many shops." The signature element is the **marketplace tile** with an uppercase **store tag**; keep everything else quiet. Neutrals are intentionally violet-tinted.

**Tokens** (CSS variables in `globals.css`):

| Token | Value | Use |
|---|---|---|
| `--primary` | `#6D28D9` | brand, primary actions |
| `--primary-700` | `#5B21B6` | hover/pressed |
| `--accent` | `#5182EF` | links, focus rings, info |
| `--accent-600` | `#3B68D6` | accent hover |
| `--violet-50 / --violet-100` | `#F5F3FF / #EDE9FE` | tints |
| `--ink` | `#1A1726` | text |
| `--muted` | `#6B6779` | secondary text |
| `--border` | `#E7E4F0` | hairlines |
| `--canvas` | `#FBFAFF` | page background |
| `--surface` | `#FFFFFF` | cards |
| `--success / --danger` | `#15803D / #DC2626` | feedback |
| radius | `--r-sm 8 / --r 14 / --r-lg 20` | shape |

Font: **Manrope** (`--font-sans`) — 800 tight-tracking for `.display`, 600/700 uppercase wide-tracking for `.eyebrow`/labels, tabular figures for `.price`.

**Reuse the existing component classes** rather than reinventing: `.page-container`, `.eyebrow`, `.display`, `.muted`, `.price`, `.btn` (+ `.btn-primary` / `.btn-ghost` / `.btn-sm` / `.btn-full`), `.brand-wordmark`, `.chip`, `.tile` / `.store-tag` / `.tile-name` / `.tile-stock`, `.app-nav` cluster + `.nav-link.is-active` + `.role-badge` / `.user-cluster`, `.auth-shell` / `.auth-card` / `.field` / `.input` / `.form-error` / `.role-pill`, `.modal-overlay` / `.modal-card` / `.role-choice`. Add new classes in the same style when needed.

**Quality floor for every page:** responsive to mobile, visible `:focus-visible` ring, loading state, empty state (an invitation to act), and a friendly in-voice error state. No console errors.

> Tailwind v4 note: keep `@import "tailwindcss";` at the very top of `globals.css`; the design tokens and component classes go below it.

---

## Test accounts

Seeded by `cd apps/api && pnpm prisma db seed`:

| username | password | roles |
|---|---|---|
| `buyer` | `Buyer#123` | BUYER |
| `seller` | `Seller#123` | SELLER (owns "Toko Demo") |
| `multi` | `Multi#123` | BUYER + SELLER (triggers role selection) |
| `driver` | `Driver#123` | DRIVER |
| `admin` | `Admin#123` | ADMIN (seed only) |

---

## Pages

Built:

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Landing — hero + featured product tiles |
| `/login` | public | Login + role-selector modal for multi-role users |
| `/register` | public | Register with role multi-select |

To build (see `CLAUDE.md` §9 for details):

| Route | Access | Purpose |
|---|---|---|
| `/` (reviews section) | public | Testimonials list + average rating + submit form |
| `/products` | public | Catalog: search, store filter, paginated tile grid |
| `/products/[id]` | public | Product detail + store block + add-to-cart |
| `/wallet` | BUYER | Balance, top-up modal, transaction history |
| `/addresses` | BUYER | Address CRUD with single default |
| `/cart` | BUYER | Single-store cart, quantities, proceed to checkout |
| `/checkout` | BUYER | Address + delivery method, totals (subtotal + PPN 12% + ongkir), place order |
| `/orders` | BUYER | Order history with status chips |
| `/orders/[id]` | BUYER | Order detail + status timeline |
| `/seller/store` | SELLER | Create/edit store (unique name) |
| `/seller/products` | SELLER | Product CRUD (soft delete) |
| `/seller/orders` | SELLER | Incoming orders for the store |
| `/seller/orders/[id]` | SELLER | Order detail (read-only) |

---

## Verify

Run both servers (api 3000, web 3001) and click through with the seed accounts. Cross-check money by hand: `ppn = round(subtotal × 0.12)`, `total = subtotal + ppn + fee` where fee is 30000 (Instant) / 20000 (NextDay) / 10000 (Regular). Confirm the single-store add path (`409 DIFFERENT_STORE`) and that a failed checkout (insufficient balance) leaves the cart and stock untouched. New orders should land at status **Sedang Dikemas**.
