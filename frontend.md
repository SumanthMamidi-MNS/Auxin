# Auxin Frontends - Reference (current state)

Verified by reading the three Next.js apps on 2026-10-11. Build results recorded in `deployment.md` section 2: `auxin-frontend` (Next 16.2.4) and `auxin-admin` (Next 16.2.6) `next build` both pass. This document was not re-built; `auxin-landing` build status is not recorded there.
Backend contract: `backend.md`. Auth flow and risks: `architecture.md`.

Env var NAMES only. No values are written here.

---

## 1. The three apps at a glance

| App | Folder | Next.js | Dev port | Users | Auth method | Deployed as |
|---|---|---|---|---|---|---|
| Customer / Farmer / Delivery | `auxin-frontend/` | 16.2.4 | 3000 (Next default) | customer, farmer, delivery | email OTP (Supabase `signInWithOtp`) | Vercel |
| Admin | `auxin-admin/` | 16.2.6 | 3001 | admin (incl. super admin) | email + password (`signInWithPassword`) | Vercel |
| Landing | `auxin-landing/` | 16.2.4 | 3002 | public | none | Vercel |

Every app uses the Next.js App Router (`src/app/`). React 19.2.4 in all three. Tailwind CSS v4 via `@tailwindcss/postcss`. TypeScript 5.

Admin and landing are separate Vercel projects. Cross-app navigation uses full-page URLs from env: the customer app sends admin users to `NEXT_PUBLIC_ADMIN_URL`, and the landing page links to `NEXT_PUBLIC_APP_URL` and `.../auth`.

Next.js 16 note (from `AGENTS.md` in each app): APIs and conventions may differ from older Next.js. The bundled docs are in `auxin-frontend/node_modules/next/dist/docs/` (sections `01-app`, `02-pages`, `03-architecture`, `04-community`). The proxy doc is `01-app/01-getting-started/16-proxy.md`, which confirms Next 16 uses `proxy` where older versions used `middleware`. None of the three apps defines either file.

---

## 2. Build and run commands

From each app folder, after `npm install`:

| App | Dev | Build | Start | Lint |
|---|---|---|---|---|
| auxin-frontend | `npm run dev` (runs `next dev --webpack`, port 3000) | `npm run build` | `npm run start` | `npm run lint` (`next lint`) |
| auxin-admin | `npm run dev` (`next dev -p 3001`) | `npm run build` | `npm run start` (`next start -p 3001`) | `npm run lint` |
| auxin-landing | `npm run dev` (`next dev --port 3002`) | `npm run build` | `npm run start` | `npm run lint` (`eslint`) |

- `auxin-frontend` `next.config.ts` sets `output: "standalone"` only when `NEXT_PUBLIC_APP_ENV=production`. Development keeps `undefined` so HMR works.
- `auxin-landing` always sets `output: "standalone"`.
- `next lint` on Next 16: UNVERIFIED whether this command is still supported in 16.x (the docs under `node_modules/next/dist/docs` were not searched for it).
- No `engines` field and no Node version pin in any `package.json`. UNVERIFIED which Node version Vercel uses.
- Lockfiles: `package-lock.json` in `auxin-frontend/` and `auxin-admin/`. `auxin-landing/` has no lockfile in the tree listing.
- Version drift: auxin-frontend pins `next` 16.2.4, auxin-admin 16.2.6, landing 16.2.4.

Local full stack: `run_auxin.py` (repo root) starts backend 8000, Milo 8001, frontend 3000, admin 3001, then opens the browser. Landing is not started by it.

---

## 3. Vercel and hosting config

Each app has `vercel.json` with `framework: "nextjs"`, `buildCommand: "npm run build"`, `outputDirectory: ".next"`, `installCommand: "npm install"`.

| App | Extra in vercel.json | Notes |
|---|---|---|
| auxin-frontend | `env.NEXT_PUBLIC_APP_ENV = "production"`; `devCommand`; security headers (nosniff, DENY, XSS, Referrer-Policy, Permissions-Policy allowing geolocation for self) | Production CSP comes from `next.config.ts`, not vercel.json |
| auxin-admin | `env.NEXT_PUBLIC_APP_ENV = "production"`; headers (nosniff, DENY, XSS, Referrer-Policy, Permissions-Policy with geolocation off) | No CSP anywhere for admin |
| auxin-landing | only the base fields | Headers come from `next.config.ts` (DENY, nosniff, Referrer-Policy, HSTS) |

Vercel project settings (root directory per app) are UNVERIFIED; not visible in the repo.

---

## 4. next.config summary

**auxin-frontend (`next.config.ts`)**
- `output`: `standalone` in production only.
- `images.remotePatterns`: `images.unsplash.com` only. `unoptimized` when not production. `minimumCacheTTL` 86400 in production.
- `reactStrictMode: true`.
- `headers()` (production only): DNS prefetch, nosniff, DENY, XSS, Referrer-Policy, Permissions-Policy, HSTS (2 years, preload), and CSP.
  - CSP: `default-src 'self'`; styles allow `fonts.googleapis.com`; fonts allow `fonts.gstatic.com`; images allow `data:`, `blob:`, unsplash; scripts allow `'unsafe-inline'` and `checkout.razorpay.com`; frames allow `api.razorpay.com` and `checkout.razorpay.com`; `connect-src 'self' https://api.auxin.in https://api.razorpay.com`.
  - The `api.auxin.in` host is hard-coded. See architecture risks.
- `redirects()`: `/login`, `/signin`, `/signup` -> `/auth` (permanent).

**auxin-admin (`next.config.ts`)**
- `images.remotePatterns`: unsplash and `via.placeholder.com`. `unoptimized` when `NEXT_PUBLIC_APP_ENV=development`.
- `reactStrictMode: true`. No headers, no redirects, no output setting.
- Comment says admin runs on 3001 to avoid conflict with the main app (port is set in package.json scripts).

**auxin-landing (`next.config.ts`)**
- `output: "standalone"`, `reactStrictMode: true`, unsplash image pattern.
- `headers()`: DENY, nosniff, Referrer-Policy, HSTS (always on, no env check).

---

## 5. Routes (App Router)

### 5.1 auxin-frontend (`src/app/`)

| Route | File | Who | Notes |
|---|---|---|---|
| `/` | `page.tsx` | all | Redirects: no session -> `/auth`; admin role -> admin portal URL; else role home via `getRoleRoute` |
| `/auth` | `auth/page.tsx` | public | Email OTP login; role selection on sign-up; includes demo login buttons (see risks) |
| `/pending-approval` | `pending-approval/page.tsx` | farmer, delivery with pending or rejected status | Holding page |
| `/profile` | `profile/page.tsx` (+ `layout.tsx`) | any signed-in user | Shared profile view |
| `/profile/create` | `profile/create/page.tsx` | any signed-in user without a profile | Redirect target when profile GET returns 404 |
| `/customer/home` | `customer/home/page.tsx` | customer | Catalogue browse, categories, search, hero |
| `/customer/cart` | `customer/cart/page.tsx` | customer | Cart, payment method (`razorpay` or `cod`), Razorpay checkout |
| `/customer/orders` | `customer/orders/page.tsx` | customer | Order list; shows delivery OTP when `out_for_delivery`; tracking; review |
| `/customer/product/[id]` | `customer/product/[id]/page.tsx` | customer | Product detail |
| `/customer/wishlist` | `customer/wishlist/page.tsx` | customer | Wishlist UI |
| `/farmer/dashboard` | `farmer/dashboard/page.tsx` | farmer | Overview |
| `/farmer/products` | `farmer/products/page.tsx` | farmer | Legacy products (`/products`) |
| `/farmer/inventory` | `farmer/inventory/page.tsx` | farmer | Inventory against master catalogue (`/inventory`) |
| `/farmer/orders` | `farmer/orders/page.tsx` | farmer | Incoming orders (`/orders/farmer/incoming`) and actions (packing, ready for pickup) |
| `/farmer/earnings` | `farmer/earnings/page.tsx` | farmer | Earnings view |
| `/farmer/profile` | `farmer/profile/page.tsx` | farmer | Farmer profile and bank details |
| `/delivery/dashboard` | `delivery/dashboard/page.tsx` | delivery | On/off duty, available deliveries (25 km), active run, status buttons, OTP verify |
| `/delivery/history` | `delivery/history/page.tsx` | delivery | Past deliveries |
| `/delivery/earnings` | `delivery/earnings/page.tsx` | delivery | Earnings view |
| `/delivery/profile` | `delivery/profile/page.tsx` | delivery | Partner profile, vehicle and bank details |
| `/api/health` | `api/health/route.ts` | public | Route handler: GET backend `/health` (base from `NEXT_PUBLIC_API_URL` minus `/api/v1`), returns frontend and backend status; 503 if backend is not ok |
| (special) | `error.tsx`, `global-error.tsx`, `not-found.tsx` | all | Error boundaries |

Layouts with client-side role guards: `customer/layout.tsx` (role `customer`), `farmer/layout.tsx` (role `farmer`, then status `pending`/`rejected` -> `/pending-approval`), `delivery/layout.tsx` (role `delivery`, same status rule). Wrong role -> admin URL, or the matching home route. These guards are UX only; the backend enforces RBAC.

Root `layout.tsx` wraps everything in `Providers` and mounts `MiloAssistant` globally.

### 5.2 auxin-admin (`src/app/`)

| Route | File | Notes |
|---|---|---|
| `/` | `page.tsx` | Redirect: no session -> `/auth`; session -> `/dashboard` |
| `/auth` | `auth/page.tsx` | Password sign-in; calls `GET /auth/me` and requires an admin role on the client |
| `/dashboard` | `(admin)/dashboard/page.tsx` | Stats (`GET /admin/stats`), charts |
| `/farmers` | `(admin)/farmers/page.tsx` | Farmers list and actions |
| `/approvals` | `(admin)/approvals/page.tsx` | Pending farmers (`/admin/farmers/pending`) and delivery partners (`/admin/delivery/pending`) with approve and reject |
| `/catalogue` | `(admin)/catalogue/page.tsx` | Master catalogue (`/catalogue/admin/products`) |
| `/catalogue/categories` | `(admin)/catalogue/categories/page.tsx` | Categories |
| `/products` | `(admin)/products/page.tsx` | Products list with activate and deactivate (`/admin/products`) |
| `/orders` | `(admin)/orders/page.tsx` | All orders (`/admin/orders`) |
| `/deliveries` | `(admin)/deliveries/page.tsx` | All deliveries (`/admin/deliveries`) |
| `/delivery-partners` | `(admin)/delivery-partners/page.tsx` | Partner management |
| `/payments` | `(admin)/payments/page.tsx` | Payments (`/admin/payments`) |
| `/disputes` | `(admin)/disputes/page.tsx` | Disputes list and resolve (`PUT /admin/disputes/{id}`) |
| `/users` | `(admin)/users/page.tsx` | Users list, suspend and reinstate |
| `/admins` | `(admin)/admins/page.tsx` | Admin management (super-only endpoints) |
| `/logs` | `(admin)/logs/page.tsx` | Activity logs (`/admin/activity-logs`) |
| `/settings` | `(admin)/settings/page.tsx` | Settings UI (backend `POST /admin/settings` is a no-op audit write) |
| `/demo-workspace` | `(admin)/demo-workspace/page.tsx` | Demo data tools (`POST /admin/demo/reset`); shows the demo bypass note in UI |

`(admin)` is a route group (not in the URL). `(admin)/layout.tsx` guards the session client-side: no session or non-admin role -> sign out and `/auth`. It renders `Sidebar`, `SidebarToggle`, `DemoBanner` (shown when `NEXT_PUBLIC_DEMO_MODE === "true"`), and titles from a route map.

The client accepts admin sub-roles (`super_admin`, `support_admin`, `operations_admin`, `logistics_admin`) that the backend never returns (`UserRole` has only farmer, customer, delivery, admin). Super-admin behaviour is backend-enforced via `is_super_admin`.

### 5.3 auxin-landing (`src/app/`)

| Route | File | Notes |
|---|---|---|
| `/` | `page.tsx` | Single marketing page. Hero, sections, CTAs linking to `NEXT_PUBLIC_APP_URL` and `.../auth` |
| layout | `layout.tsx` | Metadata: title "Auxin - Fresh From the Farm", description "India's first farmer-direct marketplace." |

Styling is inline `style` objects with a color palette `C` in the page file, plus `globals.css`.

---

## 6. lib/ modules (API and auth clients)

### 6.1 auxin-frontend (`src/lib/`)

| File | Role |
|---|---|
| `supabase.ts` | Singleton `createClient` (supabase-js) with `persistSession`, `autoRefreshToken`, `detectSessionInUrl`. Throws at import if the two `NEXT_PUBLIC_SUPABASE_*` values are missing |
| `api.ts` | Axios instance `api`. `baseURL` = `NEXT_PUBLIC_API_URL` or `http://localhost:8000/api/v1`; timeout 30 s. Request interceptor: Supabase session `access_token` (falls back to `authStore.token`). Response interceptor: on 503 or timeout/network error, sets cold-start state, waits 3 s, retries once. On 401, calls `supabase.auth.refreshSession()` once and retries; signs out if refresh fails. Exports `getErrorMessage` (reads `response.data.detail`) |
| `auth.ts` | `sendOtp`, `verifyOtp` (Supabase OTP plus demo and test bypass; see risks), `signOut`, `getSession`, `getMe` (fetch `GET /auth/me`), `syncUser` (fetch `POST /auth/sync-user`) |
| `profile.ts` | `GET /profile/me`, `POST /profile`, `PUT /profile`, `POST /profile/resubmit`, addresses `GET`/`POST`/`DELETE /profile/addresses...` |
| `farmers.ts` | `POST /farmers/profile`, `GET /farmers/profile/me`, `PUT /farmers/profile/me` |
| `inventory.ts` | `POST /inventory` and `GET /inventory/my` (with request config) |
| `products.ts` | Legacy: `GET /products`, `GET /products/my`, `POST /products`, `DELETE /products/{id}` |
| `catalogue.ts` | Read: `GET /catalogue`, `/catalogue/suggest`, `/catalogue/categories`. Admin write helpers under `/catalogue/admin/*` (ship in customer bundle; server enforces role) |
| `orders.ts` | `POST /orders` (items plus `payment_method`), `GET /orders/my`, `GET /orders/farmer/incoming`, `POST /orders/{id}/review` |
| `payments.ts` | `POST /payments/create`, `POST /payments/verify`, and `openRazorpayCheckout` (Razorpay Checkout) |
| `delivery.ts` | `GET/POST/PUT /delivery/profile...`, `PUT /delivery/location`, `GET /delivery/available`, `GET /delivery/assigned`, `PUT /delivery/{id}/status`, `POST /delivery/{id}/verify-otp` |

`src/types/index.ts`: shared types (`UserRole`, `User`, `Product`, `CartItem`, and others).
`src/fallback/mockData.ts`: demo data. Grep found no imports from it outside its own file, so it is probably dead code in the bundle (UNVERIFIED for dynamic imports).

### 6.2 auxin-admin (`src/lib/`)

| File | Role |
|---|---|
| `supabase.ts` | Same singleton pattern as the frontend (same env names) |
| `api.ts` | Axios instance, same design as the frontend's (`NEXT_PUBLIC_API_URL`, Supabase token injection, 401 refresh) |
| `auth.ts` | `adminSignIn` (password), `adminSignOut`, `getSession`, `getAdminMe` (`GET /auth/me`) |
| `admin.ts` | Everything under `/admin/*`: stats, users, suspend and reinstate, farmers and delivery pending lists, approve and reject (PATCH), orders, payments, disputes (PUT resolve), products activate and deactivate, deliveries, admins (list, create, disable, activate, delete), activity logs, review analytics, demo reset (`password_confirm` body), system health |
| `catalogue.ts` | `GET /catalogue`, `GET /catalogue/categories`, `POST /catalogue/admin/categories`, `POST /catalogue/admin/products` (and related) |

Other admin files: `src/types/index.ts` (includes `isAdminRole`, `adminRoleLabel`, `hasPermission`, `AdminRole`), `src/fallback/mockData.ts` (demo data, not imported per grep).

---

## 7. Zustand stores

| App | Store file | Hook | Persisted key | Contents |
|---|---|---|---|---|
| frontend | `store/authStore.ts` | `useAuthStore` | `auxin_auth` (localStorage via `persist`) | `user`, `token`, `isAuthenticated`; actions `setAuth`, `clearAuth` (also removes `auxin_cart`), `updateUser` |
| frontend | `store/cartStore.ts` | `useCartStore` | `auxin_cart` | `items` (product, quantity, `inventory_id`, `master_product_id`), derived `itemCount` and `cartTotal`; actions `addItem`, `removeItem`, `updateQty`, `clearCart`. Items keyed by inventory id when present |
| frontend | `store/appStore.ts` | `useAppStore` | none (memory only) | `isColdStart`, `coldStartAt`; `setColdStart`. Drives the `ColdStartLoader` banner |
| admin | `store/authStore.ts` | `useAuthStore` | `auxin_admin_auth` | `user`, `isAuthenticated`; `setAuth`, `clearAuth`, `updateAdmin` (no token; Supabase holds the session) |

Server state uses TanStack Query (`QueryClientProvider` in each app's `providers.tsx`). Frontend defaults: `staleTime` 60 s, `retry` 1, `refetchOnWindowFocus` false. Admin: `staleTime` 30 s, `retry` 1.

Auth state sync in frontend `providers.tsx`: bootstraps from `supabase.auth.getSession()`, calls `getMe()` and `profileApi.getProfile()` (redirect to `/profile/create` on 404). Subscribes to `onAuthStateChange` for `SIGNED_IN`.

---

## 8. Supabase client usage

- Only Supabase Auth is used from the browser. There are no `.from()`, `.rpc()` or storage calls in any app (verified by grep).
- Frontend sign-in: `signInWithOtp` (with `shouldCreateUser: true` and `data.role`), `verifyOtp` (`type: "email"`), `signInWithPassword` (demo/test bypass only), `refreshSession`, `signOut`, `getSession`, `onAuthStateChange`.
- Admin sign-in: `signInWithPassword`, then `GET /auth/me` on the backend. Signs out if the role check fails.
- The backend, not the browser, validates the JWT. The frontend sends `Authorization: Bearer <access_token>` on every API call.

---

## 9. Payments in the browser

- `lib/payments.ts` calls `POST /payments/create` and then opens Razorpay Checkout (script from `checkout.razorpay.com`, allowed by the frontend CSP).
- On success, it posts the Razorpay response to `POST /payments/verify`. The backend is the source of truth.
- Cart page offers `razorpay` and `cod`. The backend allows COD only for `is_demo` users (403 for others), so the COD option is misleading for real customers (low-severity UX issue).

---

## 10. UI building blocks (for orientation)

- Layout: `components/layout/AppShell.tsx`, `BottomNav.tsx` (mobile), `DesktopSidebar.tsx`, `DesktopTopNav.tsx`, `TopBar.tsx`.
- Features: `AddressForm`, `AddressManagerSheet`, `CategoryRail`, `HeroCarousel`, `LeafletMap` (Leaflet map; `leaflet` and `@types/leaflet` in deps), `MissionStepper` and `OrderTimeline` (order and delivery progress), `NotificationCenter`, `ProductCard`, `ProductGrid`, `SearchBar`, `SeasonalCard`.
- UI primitives: `Button`, `Card`, `Input`, `OTPInput`, `QuantityStepper`, `PriceBadge`, `ETABadge`, `TrustBadge`, `SectionBlock`, `Skeletons`, `ImageWithOverlay`, `ColdStartLoader`, `MiloAssistant`.
- Illustrations: `EmptyCart`, `EmptyDelivery`, `EmptyOrders`, `EmptySearch`, `EmptyWishlist`, `NetworkError`.
- Admin: `components/layout/Sidebar.tsx`, `components/ui/Button|Card|Input|DemoBanner|MiloAssistant`.

Milo assistant: both `MiloAssistant.tsx` files call `http://127.0.0.1:8001` directly (hard-coded). This bypasses backend auth and works only on a developer machine. See architecture risks.

---

## 11. Environment variables (names only)

| App | Names | Read at |
|---|---|---|
| auxin-frontend | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_APP_ENV`, plus `NODE_ENV` (built-in) | `lib/api.ts`, `lib/auth.ts`, `lib/supabase.ts`, `app/layout.tsx`, `app/page.tsx`, role layouts, `auth/page.tsx`, `next.config.ts`, `api/health/route.ts` |
| auxin-admin | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_DEMO_MODE`, plus `NODE_ENV` | `lib/*`, `components/ui/DemoBanner.tsx`, `next.config.ts` |
| auxin-landing | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_URL` | `src/app/page.tsx` |

`NEXT_PUBLIC_*` values are inlined at build time, so changing them needs a rebuild or redeploy on Vercel.

Env files are git-ignored (`auxin-*/.env*`, with `.env.example` files allowed by the ignore rules). Their contents were not read for this document.

---

## 12. Known gaps for the frontends

- Demo and test login bypass ships in the production bundle (`auxin-frontend/src/lib/auth.ts`). Critical; see architecture risks.
- `auxin-frontend/src/app/auth/page.tsx` renders a demo login button and text that describes a fixed bypass code (not repeated here).
- Admin role list on the client includes sub-roles the backend does not return.
- CSP `connect-src` hard-codes `https://api.auxin.in` (production only).
- `auxin-admin` and `auxin-landing` have no CSP.
- Milo assistant URL is hard-coded to localhost in both apps.
- COD option shown to all customers in the cart UI; backend allows it only for demo users.
- `src/fallback/mockData.ts` in both apps appears unused (dead code in the bundle).
- Admin `/settings` page writes to a no-op backend endpoint.
- `next lint` and the `eslint` script in landing: UNVERIFIED behaviour on Next 16.
- Tests: no test suite or test script in any of the three apps (`package.json` scripts have no `test`).
