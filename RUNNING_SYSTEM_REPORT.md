# Running System Report: Auxin v2.0

This report details the route verification, active listeners, and component flow verifications for the active Auxin system.

---

## 1. Active Ports and Listeners Verification

Active listeners were validated via standard networking utility scans:
- **Port 3000** (Next.js Frontend App): **Active** (Listening on `::`)
- **Port 3001** (Next.js Admin Portal): **Active** (Listening on `::`)
- **Port 8000** (FastAPI Backend API): **Active** (Listening on `127.0.0.1`)

---

## 2. Route Verification Output

The running applications were queried using HTTP validation. The results are as follows:

```
=========================================
RUNNING SYSTEMS PORT VERIFICATION
=========================================
Checking Backend Health Endpoint (http://localhost:8000/health)...
  -> SUCCESS! Status: 200, Content-Type: application/json
  -> JSON Payload: {'status': 'ok', 'version': '2.0.0', 'env': 'development', 'demo_mode': False, 'db': 'connected', 'uptime_s': 38.3}

Checking Backend Docs Swagger (http://localhost:8000/docs)...
  -> SUCCESS! Status: 200, Content-Type: text/html; charset=utf-8
  -> HTML Title: Auxin API - Swagger UI

Checking Frontend Auth Page (http://localhost:3000/auth)...
  -> SUCCESS! Status: 200, Content-Type: text/html; charset=utf-8
  -> HTML Title: Auxin — Fresh From the Farm

Checking Admin Auth Page (http://localhost:3001/auth)...
  -> SUCCESS! Status: 200, Content-Type: text/html; charset=utf-8
  -> HTML Title: Auxin Admin
=========================================
```

---

## 3. Verified System Flows

### ✉️ Email OTP Flow
- **Client implementation**: `auxin-frontend/src/app/auth/page.tsx` renders role selection and email capture fields. Upon form submission:
  1. `supabase.auth.signInWithOtp({ email, options: { data: { role } } })` is executed.
  2. The email receives the 6-digit OTP code through Supabase and the Resend integration.
  3. The OTP verification form renders, capturing the code.
  4. `supabase.auth.verifyOtp({ email, token })` is invoked, returning a valid user session.
- **Backend Verification**: Validated in E2E tests (`e2e_flow_test.py`) where bearer token decoding successfully maps matching Supabase user metadata roles.

### 🛡️ Profile Creation & Redirect Flow
- **Enforcement Layout Guards**: Validated layout route guards across all core paths (`customer/layout.tsx`, `farmer/layout.tsx`, `delivery/layout.tsx`). If the authenticated user has an empty/null address, they are forced to `/profile/create`.
- **Sync Integration**: On page load at `/profile/create`, the frontend triggers `POST /auth/sync-user` to automatically seed user rows, avoiding database link failures. The form allows updating Name, Phone, and Address (autofilling Email).
- **Backend Phone Enforcement**: Verified by `test_profile_endpoints.py` that invalid formats (short strings) and blacklisted numbers (e.g. `9999999999`) return a `422 VALIDATION_ERROR` response, while valid 10-digit entries successfully format and prepend `+91`.

### 📊 Admin Dashboard Flow
- **Live Metrics**: Resolves `GET /admin/stats` to render stats cards (Total Users, Total Orders, Total Products, Open Disputes, Pending Farmers, Total Revenue).
- **Crash Prevention**: All empty name checks (`farmers/page.tsx`), navigation segment checks (`layout.tsx`), and currency formatting functions (`dashboard/page.tsx`, `orders/page.tsx`, `products/page.tsx` via `toLocaleString` checks) compile and run with undefined/null boundary safeguards.
