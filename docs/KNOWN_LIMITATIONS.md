# Known limitations and production checklist

Auxin is feature-complete as a portfolio and client-customisation base. It is **not** hardened for
unattended production use with real money or real personal data. This list is the honest gap.

## Fixed in this stabilisation pass (2026-10-11)

| Issue | Fix | Evidence |
|---|---|---|
| Anyone could register as `admin` | `sync-user` rejects admin except the configured super-admin email (verified JWT claim) | `tests/test_security_hardening.py` |
| Account takeover via phone/email in the sync body | Link only by verified JWT email, never re-link an owned row, reject reused phones | same |
| Any farmer could read any order | Farmer must own the order | same |
| Any user could read a farmer's bank/UPI/phone | Public view hides them; owner/admin see all | same |
| `/milo/chat` unauthenticated; browser called `127.0.0.1:8001` | Authenticated backend proxy; role from DB | same + build |
| `demo.*` login with a password baked into the bundle | Off unless `NEXT_PUBLIC_DEMO_MODE=true`; password from env | build + bundle scan |
| `000000` OTP backdoor under `DEBUG` | Removed | same |
| Partner received the customer's OTP | OTP only on the customer's order | functional tests |
| Unlimited OTP guessing | 5 failures per delivery per process | same |
| Demo reset ran for any admin, broke the button, left demo accounts pre-approved | Super admin only, one click; deletes `is_demo` rows only (test: real order and customer survive repeated resets); demo customer, farmer and courier return blank (no profile, address or listings) and the farmer and courier appear under Approvals after they submit their details; unapproved farmers' produce is hidden from customers | tests |
| Wildcard CORS + credentials; `create_all` in production | Rejected / skipped in production | code |
| Service-role key literal in Milo scripts | Removed (never committed) | scan |
| Production CSP blocked Supabase and non-`auxin.in` APIs | Derived from env | header check |
| Docker image lacked migrations | `.dockerignore` fixed | file |
| Live schema behind the code (enum, 4 columns) | Migration 010 | rendered SQL — **not applied** |
| RLS off on all public tables | Migration 011 | rendered SQL — **not applied** |

## Still open

### Security / correctness
- **OTP is stored in plaintext** (`deliveries.plain_otp`) so the customer can see it. The bcrypt hash is the
  verifier. Production alternative: derive/display via a short-lived signed value, or deliver by SMS/push.
- **OTP attempt counter is in-memory** (per process). Use a DB-backed counter with multiple workers.
- **Available-deliveries list** shows customer name, phone and full address to any on-duty partner within 25 km
  before they claim. Redact until claimed.
- **Auto-assign can stack deliveries** on one busy partner; `claim` has a check-then-act race.
- **Escrow release errors are swallowed** after delivery; a failed delivery cancels the order without refund.
- **Dead endpoints:** `PUT /orders/{id}/accept` and `/complete` always return 409 (transition table).
  The UI uses packing → ready-for-pickup; acceptance is payment-driven.
- **Two farmer-approval paths** (`/farmers/{id}/approve` and `/admin/farmers/{id}/approve`).
- **Milo trusts the role** forwarded by the API; Milo itself has no auth and must stay on a private network.
- **No application-level rate limiting** on sync-user, payments or OTP verification — put a WAF/proxy in front.
- **Bank account numbers are stored as `plain:`** unless `BANK_ACCOUNT_ENCRYPTION_KEY` is set.
- **Demo accounts share state.** Concurrent visitors see each other's actions (see `DEMO_DEPLOYMENT.md`).

### Operations
- Supabase advisors (warnings): leaked-password protection off, `vector` extension in `public`,
  two functions with mutable `search_path`.
- `LOG_LEVEL` and `DELIVERY_ASSIGNMENT_TIMEOUT_MINUTES` are declared but unused (no assignment SLA).
- `pytest` is in runtime `requirements.txt` (split into a dev file for lean images).
- Legacy SQLite-only scripts (`apply_009_migration.py`, `migrate_010_commerce_engine.py`,
  `make_order_items_product_id_nullable.py`) edit `auxin.db` outside Alembic. Never run them on Postgres.
- Free hosting tiers sleep (Render ~15 min, Supabase 1 week). First request after sleep is slow.

## Production checklist (when a client wants it)

1. Apply migrations `010` and `011` on a backed-up database; confirm the API role is `postgres`/`BYPASSRLS`.
2. `DEBUG=false`, `APP_ENV=production`, explicit `ALLOWED_ORIGINS`, real `BANK_ACCOUNT_ENCRYPTION_KEY`.
3. Rotate the Supabase service-role key and JWT secret; custom SMTP for email OTP; enable leaked-password protection.
4. Close the "Still open" security items above, then run an external review.
5. Add monitoring (uptime on `/health`, error tracking), backups, and a staging environment.
6. Move off Vercel Hobby (non-commercial only) before any commercial use.

## Dependency advisories (npm audit, production dependencies, 2026-10-11)

In-range fixes were applied to both web apps (axios, nanoid, form-data, source-map-js, postcss chain):
8 → 3 advisories each. **Remaining (both apps):** `next` 16.2.x (denial of service with Server Components,
proxy bypass on segment-prefetch routes) and the `sharp` image library it bundles — fixed in `next@16.4.0`,
which is outside the pinned range. Upgrade deliberately: read `node_modules/next/dist/docs` first (this Next.js
line has breaking changes), then rebuild and re-test. Python dependencies were not audited (`pip-audit` not
installed); the backend pins `fastapi 0.111`, `pydantic 2.7`, `python-jose 3.3` — review before production.
