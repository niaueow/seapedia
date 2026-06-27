# CLAUDE.md — SEAPEDIA

Operating instructions for Claude Code working on this repo. Read this fully before editing. The non-obvious, project-specific rules in **§3 Critical Conventions** are mandatory — most of them were learned the hard way and silently break the build if ignored.

> **Authoritative source documents (read these first):**
> - **`docs/PRD.md`** — the original challenge brief / product requirements (business rules, level breakdown, exact acceptance criteria). When this file and the PRD disagree on a *business rule*, the **PRD wins** — but only within **Levels 1–3** (see scope below). Ignore PRD requirements that belong to Levels 4–7.
> - **`docs/SEAPEDIA_Technical_Design.md`** — the original architecture rationale (optional background).
>
> This CLAUDE.md is the authoritative source for **implementation conventions, the as-built API contract, and the remaining-work plan**. The PRD is the authoritative source for **what the product must do**. Use both together.

---

## 1. What this is

SEAPEDIA is a multi-seller marketplace (COMPFEST 18 Software Engineering Academy challenge). A pnpm monorepo with a NestJS backend and a Next.js frontend.

**SCOPE: Levels 1–3 ONLY.** The backend is feature-complete for L1–3. The remaining work is **frontend pages** (see §8).

### Out of scope — do NOT build (Levels 4–7)
- Vouchers / promos / discounts
- Driver workflow, order pickup/delivery progression
- Admin monitoring dashboards / admin features (admin exists as a seed account only)
- Advancing order status beyond `SEDANG_DIKEMAS` (checkout sets that one status; nothing moves it forward)
- Overdue / auto-refund / time simulation
- Security hardening (rate limiting, refresh-token rotation, XSS sweeps, etc.)
- Deployment, CI/CD, Dockerfiles, hosting config

If a request implies any of the above, stop and confirm — it's almost certainly out of scope.

---

## 2. Stack & environment

- **Monorepo:** pnpm workspaces. Packages: `apps/*`, `packages/*`.
- **Backend (`apps/api`):** NestJS, TypeScript, Prisma **v7.8** (driver-adapter mode), PostgreSQL on **Neon** (serverless, pooled), JWT auth (`@nestjs/jwt` + `passport-jwt`), `argon2` password hashing, `class-validator`.
- **Frontend (`apps/web`):** Next.js **16** (App Router, `src/` dir), React **19**, TypeScript, **Tailwind v4**, Manrope via `next/font/google`.
- **Node** v22, **pnpm** v9+.
- **Ports:** API = **3000**, web = **3001**. (Web `dev` script is `next dev -p 3001`.) CORS on the API allows `http://localhost:3001`.
- **OS:** developed on Windows/PowerShell. Use `dir`, `type`, backslash paths when giving shell commands; servers stop with Ctrl+C.

### Run it
```bash
# Terminal 1 — backend
cd apps/api && pnpm run start:dev      # http://localhost:3000

# Terminal 2 — frontend
cd apps/web && pnpm dev                # http://localhost:3001
```
Prisma: `pnpm prisma migrate dev --name <x>`, `pnpm prisma generate`, `pnpm prisma db seed`, `pnpm prisma studio` (all from `apps/api`).

### Env files (git-ignored — never commit)
- `apps/api/.env`: `DATABASE_URL` (Neon pooled), `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL="15m"`.
- `apps/web/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3000`.

---

## 3. Critical conventions (READ — these break things silently)

### 3.1 Prisma v7 generated client
This project uses Prisma **v7 with `prisma.config.ts` and the `@prisma/adapter-pg` driver adapter**. The client is generated to `apps/api/src/generated/prisma/`, NOT to `@prisma/client`.

- **Import the client from the generated path, with a `.js` extension** (required even though source is `.ts`):
  - from `src/prisma/`: `import { PrismaClient } from '../generated/prisma/client.js'`
  - from `src/<feature>/`: enums via `'../generated/prisma/enums.js'`
  - from `src/<feature>/dto/`: enums via `'../../generated/prisma/enums.js'`
  - from `src/<feature>/guards|strategies/`: enums via `'../../generated/prisma/enums.js'`
  - from `prisma/seed.ts`: `'../src/generated/prisma/client.js'`
- **Never** `import ... from '@prisma/client'`. It won't resolve.
- `PrismaService` uses `extends PrismaClient` + `super({ adapter })` where `adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })`. Therefore **DB calls are `prisma.user.findMany()`** — NOT `prisma.client.user...`.
- Enums (`RoleName`, `DeliveryMethod`, `OrderStatus`, `WalletTxnType`) are exported as **values** from `enums.js`. Use them directly (`RoleName.ADMIN`, or the string literal `'SEDANG_DIKEMAS'`). Do **not** wrap them in TS-only type utilities like `Extract<RoleName, ...>` — that errors.
- `ConfigModule.forRoot({ isGlobal: true })` must be **first** in `AppModule.imports` so `process.env.DATABASE_URL` is loaded before the adapter reads it.

### 3.2 TypeScript strict-mode (`isolatedModules` + decorators)
Any **type/interface** referenced in a decorated method signature must be imported with `import type`. Most common case:
```ts
import type { AuthUser } from '../auth/strategies/jwt.strategy';
```
Real values (classes, functions, enums) use normal `import`. Symptom if you forget: TS error `1272 "A type referenced in a decorated signature must be imported with 'import type'..."`.

### 3.3 JWT secret typing
`JwtModule.registerAsync` factory must be annotated `: JwtModuleOptions` (imported from `@nestjs/jwt`) or `expiresIn` rejects the `.env` string.

### 3.4 pnpm build approvals
New native deps (e.g. `sharp`, `argon2`, `unrs-resolver`, prisma engines) need build-script approval. They're allow-listed in **`pnpm-workspace.yaml`** under `onlyBuiltDependencies:` (the old `package.json` `pnpm` field is ignored by this pnpm version). If an install fails with `ERR_PNPM_IGNORED_BUILDS`, add the package there and re-run `pnpm install` from the repo root.

### 3.5 Money & tax
- All money is **integer Rupiah** (`Int`). Never floats, never decimals.
- **PPN (VAT) 12% applies to the SUBTOTAL ONLY.** `ppnAmount = Math.round(subtotal * 0.12)`; `total = subtotal + ppnAmount + deliveryFee`. Delivery fee is NOT taxed.
- Delivery fees: `INSTANT 30000`, `NEXT_DAY 20000`, `REGULAR 10000`.

### 3.6 Authorization model
- Auth = JWT in `Authorization: Bearer <token>`. Claims: `{ sub, username, roles, activeRole, tokenVersion }`.
- A user can hold multiple roles but acts under one **`activeRole`** at a time. Single-role users get it set automatically at login; multi-role users get `activeRole: null` + `requiresRoleSelection: true` and must call `/auth/select-role`.
- Protected routes use `@UseGuards(JwtAuthGuard, RolesGuard)` (identity guard FIRST) + `@Roles('BUYER'|'SELLER'|...)`. `RolesGuard` requires an active role that's still owned in the DB.
- Logout bumps `user.tokenVersion`, invalidating outstanding tokens; the JWT strategy rejects tokens whose `tokenVersion` is stale.
- The server is the source of truth. Re-check ownership in services (a seller only mutates its own store/products; a buyer only reads its own orders/cart/wallet).

### 3.7 Domain rules
- **One store per seller** (`Store.ownerId` unique), **unique store name**.
- **Single-store cart:** a cart holds products from one store only. `Cart.storeId` locks on first add, unlocks (null) when emptied. Adding from a different store → `409 { code: 'DIFFERENT_STORE' }`.
- **Soft-delete products** (`isActive=false`) — never hard-delete; orders reference them. Public catalog shows active only.
- **Checkout is one atomic `prisma.$transaction(async (tx) => ...)`** — every op uses `tx`. Stock decrement is the guarded `tx.product.updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } })`; if `count === 0` throw → full rollback. Order snapshots product name/price and the address text. New order status is always `SEDANG_DIKEMAS` + an `OrderStatusHistory` row. Cart is emptied + unlocked at the end.

### 3.8 Git
One commit per finished feature/page, present-tense imperative message (e.g. `"Add buyer wallet page"`). Don't commit `.env` / `.env.local` / `node_modules` / `.next`.

---

## 4. Monorepo layout
```
seapedia/
├─ pnpm-workspace.yaml        # packages + onlyBuiltDependencies
├─ apps/
│  ├─ api/                    # NestJS — FEATURE COMPLETE for L1-3
│  │  ├─ prisma/{schema.prisma, seed.ts, migrations/}
│  │  ├─ prisma.config.ts
│  │  └─ src/
│  │     ├─ main.ts           # global ValidationPipe + enableCors(3001)
│  │     ├─ app.module.ts     # ConfigModule(global) first, then feature modules
│  │     ├─ generated/prisma/ # Prisma v7 client (import from here, .js paths)
│  │     ├─ prisma/{prisma.service.ts, prisma.module.ts(@Global)}
│  │     ├─ auth/   (controller, service, module, jwt.module config,
│  │     │          dto/, strategies/jwt.strategy.ts, guards/{jwt-auth,roles}.guard.ts,
│  │     │          decorators/{current-user,roles}.decorator.ts)
│  │     ├─ stores/ products/ catalog/ wallet/ address/ cart/ checkout/ orders/ reviews/
│  └─ web/                    # Next.js — IN PROGRESS (auth + navbar done)
│     ├─ .env.local
│     └─ src/
│        ├─ app/
│        │  ├─ layout.tsx     # Manrope + <AuthProvider> + <Navbar>
│        │  ├─ globals.css    # Tailwind import + design tokens + component classes
│        │  ├─ page.tsx       # landing (hero + product tiles, fetched server-side)
│        │  ├─ login/page.tsx  register/page.tsx
│        │  └─ (build the rest here — see §8)
│        ├─ auth/{auth-context.tsx (AuthProvider/useAuth), RoleSelectorModal.tsx}
│        ├─ components/Navbar.tsx
│        └─ lib/api.ts        # fetch wrapper (token + errors)
```

---

## 5. Backend API contract (what the frontend calls)

Base `http://localhost:3000`. Auth header `Authorization: Bearer <accessToken>`. Errors: `{ statusCode, message, error }` (message may be a string or string[]). Money is integer Rupiah.

### Auth
- `POST /auth/register` `{username,email,password,name?,roles:RoleName[]}` (no ADMIN) → `201 {id,username,email,name,roles}`. Also creates wallet+cart. 409 if username/email taken.
- `POST /auth/login` `{username,password}` → `200 {accessToken, requiresRoleSelection, roles, user:{id,username,email,name}}`. 401 generic on bad creds.
- `POST /auth/select-role` (auth) `{role}` → `200 {accessToken, activeRole}`. 400 if role not owned.
- `GET /auth/profile` (auth) → `{id,username,roles,activeRole}`.
- `POST /auth/logout` (auth) → `{success:true}`.

### Stores (active role SELLER)
- `POST /stores` `{name,description?}` → 201 store. 409 duplicate name / already has store.
- `GET /stores/mine` → store | null.
- `PATCH /stores/:id` `{name?,description?}` → store. 403 not owner.

### Seller products (active role SELLER)
- `POST /products` `{name,description?,price,stock,imageUrl?}` → 201. (price/stock int ≥0; imageUrl must be a URL.)
- `GET /products/mine?page&limit` → `{data,page,limit,total}`.
- `PATCH /products/:id` `{name?,description?,price?,stock?,imageUrl?,isActive?}`. 403 not owner.
- `DELETE /products/:id` → `{success:true}` (soft delete).

### Public catalog (no auth)
- `GET /catalog/products?page&limit&q&storeId` → `{data:[{id,name,description,price,stock,imageUrl,createdAt,store:{id,name}}],page,limit,total}` (active only).
- `GET /catalog/products/:id` → product detail incl `store:{id,name}`. 404 if missing/inactive.

### Wallet (active role BUYER)
- `GET /wallet` → `{balance}`.
- `POST /wallet/topup` `{amount}` (int ≥1) → `{balance, transaction}`.
- `GET /wallet/history?page&limit` → `{data,page,limit,total}` (newest first).

### Addresses (active role BUYER)
- `GET /addresses` → Address[] (default first).
- `POST /addresses` `{label?,recipientName,phone,fullAddress,city?,postalCode?,isDefault?}` → 201. First address auto-default.
- `PATCH /addresses/:id` `{...}` (setting isDefault unsets others). 403 not owner.
- `DELETE /addresses/:id` → `{success:true}` (deleting default promotes another).

### Cart (active role BUYER)
- `GET /cart` → `{storeId, store, items:[{id,quantity,lineTotal,product:{id,name,price,stock,imageUrl,storeId}}], subtotal, itemCount}`.
- `POST /cart/items` `{productId,quantity}` → cart summary. **409 `{code:'DIFFERENT_STORE'}`** if different store. 400 if qty > stock. 404 if product inactive/missing.
- `PATCH /cart/items/:id` `{quantity}` (0 removes) → summary.
- `DELETE /cart/items/:id` → summary (unlocks store if now empty).
- `DELETE /cart` → empty summary.

### Checkout (active role BUYER)
- `POST /checkout` `{addressId, deliveryMethod:'INSTANT'|'NEXT_DAY'|'REGULAR'}` → `201` full order `{...,subtotal,deliveryFee,ppnAmount,total,status:'SEDANG_DIKEMAS',items[],statusHistory[]}`.
- Errors: `400 EMPTY_CART`; `422 {code:'INSUFFICIENT_BALANCE'}`; `422 {code:'INSUFFICIENT_STOCK'}`; `404` address not found / `403` not owner.

### Orders
- `GET /orders?page&limit&status` (BUYER) → `{data:[{id,store,deliveryMethod,subtotal,deliveryFee,ppnAmount,total,status,createdAt,_count:{items}}],...}`.
- `GET /orders/:id` (BUYER owner) → detail with `items[]` + `statusHistory[]` + `store`. 403 not owner.
- `GET /seller/orders?page&limit&status` (SELLER) → orders for the seller's store (incl `recipientName`).
- `GET /seller/orders/:id` (SELLER owner) → detail. 403 if not this store's order.

### Reviews (public — guests allowed)
- `POST /reviews` `{reviewerName,rating(1-5),comment}` → 201 review.
- `GET /reviews?page&limit` → `{data,page,limit,total,averageRating}`.

---

## 6. Seed accounts (`pnpm prisma db seed`)
| username | password | roles | notes |
|---|---|---|---|
| admin  | Admin#123  | ADMIN | seed only |
| buyer  | Buyer#123  | BUYER | |
| seller | Seller#123 | SELLER | owns "Toko Demo" (2 products) |
| driver | Driver#123 | DRIVER | placeholder |
| multi  | Multi#123  | BUYER+SELLER | tests role selection |

Seed is idempotent (upsert). `pnpm prisma migrate reset` wipes + re-migrates + re-seeds (safe in dev).

---

## 7. Frontend design system (already established — reuse, don't reinvent)

**Brief identity:** "the marketplace of many shops." Signature element = the **marketplace tile** with an uppercase **store tag**. Spend boldness only there; keep everything else calm. UI copy is in **Bahasa Indonesia**, sentence case, plain verbs.

**Tokens** (CSS variables in `globals.css`; neutrals are deliberately violet-tinted):
- primary `#6D28D9`, primary-700 `#5B21B6`, accent `#5182EF`, accent-600 `#3B68D6`
- violet-50 `#F5F3FF`, violet-100 `#EDE9FE`
- ink `#1A1726`, muted `#6B6779`, border `#E7E4F0`, canvas `#FBFAFF`, surface `#FFFFFF`
- success `#15803D`, danger `#DC2626`
- radius `--r-sm:8px / --r:14px / --r-lg:20px`; shadows `--shadow-sm`, `--shadow-lift`
- font: **Manrope** (`--font-sans`); 800 tight-tracking for `.display`, 600/700 uppercase wide-tracking for `.eyebrow`/labels, tabular figures for `.price`.

**Existing reusable classes** (use these for consistency): `.page-container`, `.eyebrow`, `.display`, `.muted`, `.price`, `.btn` + `.btn-primary`/`.btn-ghost`/`.btn-sm`/`.btn-full`, `.brand-wordmark`, `.chip`, `.tile`/`.store-tag`/`.tile-name`/`.tile-stock`, `.app-nav` cluster + `.nav-link.is-active` + `.role-badge`/`.user-cluster`, `.auth-shell`/`.auth-card`/`.field`/`.input`/`.form-error`/`.role-pill`, `.modal-overlay`/`.modal-card`/`.role-choice`.
Add new component classes in `globals.css` in the same style when needed; prefer them over scattered inline styles for repeated brand elements.

**Quality floor for every page:** responsive to mobile, visible `:focus-visible` ring, loading state, empty state (an invitation to act, not just "no data"), and friendly error state in the interface's voice. Format money with `Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})`.

---

## 8. Frontend conventions

- **API calls:** always use `api()` from `src/lib/api.ts` (handles base URL, Bearer token from `localStorage['seapedia_token']`, JSON, and throws `ApiError {message,status,body}`). Don't hand-roll `fetch` for backend calls in pages.
- **Auth state:** `useAuth()` from `src/auth/auth-context.tsx` gives `{ user, loading, login, selectRole, logout }`. `user = {id,username,roles,activeRole}`.
- Interactive components (state, onClick, forms) need `"use client";` as the FIRST line. Pure data-fetch/SSR pages can stay server components.
- The shared `<Navbar>` is in the layout and is role-aware off `user.activeRole`; it hides on `/login` and `/register`.
- Handle the special API error codes in the UI: `DIFFERENT_STORE` (offer "clear cart & add"), `INSUFFICIENT_BALANCE` (prompt top-up), `INSUFFICIENT_STOCK` (tell which item).
- **Route protection:** these pages are role-specific but pages render client-side, so add a small client guard — e.g. a `useRequireRole(role)` hook (or `<RoleGuard allow={['BUYER']}>`) that waits for `useAuth().loading`, then redirects to `/login` if not logged in or to `/` (with a message) if `activeRole` doesn't match. Don't rely on the UI alone — the backend already enforces auth; the guard is for UX.

---

## 9. Remaining work — build these (this is "finishing the project")

Backend is done. Build the following pages in `apps/web/src/app`, each wired to the contract in §5, styled with §7, following §8. Commit per page. Suggested order:

1. **Landing reviews (`/` additions):** add a testimonials section to `page.tsx` — fetch `GET /reviews`, show `averageRating` + a few reviews as tiles, and a public submit form (`POST /reviews`, guest-allowed) with rating 1–5, name, comment. (Form needs a client component.)
2. **Catalog list `/products`:** public. Search box (`?q=`), tile grid (reuse `.tile`/`.store-tag`), pagination, store filter. Each tile links to detail. Empty + loading states.
3. **Product detail `/products/[id]`:** public. Show product + store block (link to `/products?storeId=`). "Tambah ke keranjang" button: if not logged-in BUYER → prompt login; else `POST /cart/items` and surface `DIFFERENT_STORE` with a "kosongkan keranjang" action.
4. **Wallet `/wallet`** (BUYER): balance card, top-up modal (`POST /wallet/topup`), history list (`GET /wallet/history`) with `WalletTxnType` labels.
5. **Addresses `/addresses`** (BUYER): list (default first), create/edit form, delete, set-default toggle.
6. **Cart `/cart`** (BUYER): single-store summary, qty steppers (`PATCH /cart/items/:id`, 0=remove), subtotal, "Lanjut ke checkout". Conflict banner already prevented at add-time, but show store name + clear-cart.
7. **Checkout `/checkout`** (BUYER): pick address + delivery method; live summary showing **subtotal, PPN 12%, ongkir, total** (compute client-side for display but the server is authoritative); place order (`POST /checkout`); handle `INSUFFICIENT_BALANCE`/`INSUFFICIENT_STOCK`; on success go to the new order detail.
8. **Order history `/orders` + detail `/orders/[id]`** (BUYER): list with status chips + money; detail with item lines, money breakdown, and the `statusHistory` timeline.
9. **Seller store `/seller/store`** (SELLER): create store if none (handle 409 unique-name), else edit.
10. **Seller products `/seller/products`** (SELLER): table of own products (`GET /products/mine`), create/edit (modal or sub-page), soft-delete. Integer price/stock inputs.
11. **Seller incoming orders `/seller/orders` + `/seller/orders/[id]`** (SELLER): list + read-only detail (no status changes — out of scope).
12. **Role-based home/dashboard (optional):** a light buyer/seller landing summarizing wallet/store; or keep `/` as the public landing and let the navbar links suffice.
13. **`useRequireRole` guard + a Footer (optional)**: protect the role pages per §8; add a simple footer to the shell.

### Definition of done
- A guest can browse `/products`, view a detail, read/post reviews.
- A buyer can register → login → top up → add to cart (single-store enforced) → set address → checkout (totals incl. PPN 12% on subtotal, correct ongkir) → see the order at `Sedang Dikemas` with the status timeline → see wallet debited.
- A seller can login → create store (unique name) → CRUD products (appearing in the public catalog) → see incoming orders for their store.
- Multi-role `multi` user can switch active role and the UI/links follow.
- Every page: responsive, keyboard-focusable, with loading/empty/error states. No console errors. No L4–7 features.

---

## 10. How to verify
Mirror the backend REST tests through the UI. Use the seed accounts. Cross-check money math by hand: `ppn = round(subtotal*0.12)`, `total = subtotal + ppn + fee` (fee 30000/20000/10000). Confirm the single-store `409` path and the insufficient-balance rollback (cart + stock unchanged) still behave from the UI. Keep both servers running (api 3000, web 3001).

Before marking a level done, re-read the matching section of **`docs/PRD.md`** and confirm every L1–3 acceptance criterion is met. Treat the PRD's wording as the grading rubric for product behavior; treat this file's §3 as the rubric for *how* it must be implemented.
