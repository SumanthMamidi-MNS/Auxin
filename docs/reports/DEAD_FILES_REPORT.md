# MISSION 7 — DEAD FILES REPORT
# Auxin v2.0 Dead/Obsolete File Identification
# Generated: 2026-06-20T07:14:00Z
# ─────────────────────────────────────────────────────────────────────────────

> **IMPORTANT:** This report IDENTIFIES dead files only. NO files were deleted.
> Deletion must be done manually by the team after review. Each file is assessed
> for risk, value, and recommended action.

---

## Category 1: Obsolete Test Files (v1 OTP auth)

### `tests/conftest.py`

| Property | Value |
|----------|-------|
| Size | 5,659 bytes |
| Status | ⚠️ INCOMPATIBLE (NOT dead — needs update) |
| Issue | Uses v1 OTP auth fixtures: `request-otp`, `verify-otp` endpoints that no longer exist |
| Fixtures | `customer_tokens`, `farmer_tokens`, `admin_tokens` all call removed OTP endpoints |
| Impact | All auth-dependent tests break when conftest is loaded |
| Action | **DO NOT DELETE** — Rewrite to use Supabase JWT mock pattern |

### `tests/test_auth.py`

| Property | Value |
|----------|-------|
| Size | 7,088 bytes |
| Status | ⚠️ INCOMPATIBLE (NOT dead — needs update) |
| Issue | Tests `POST /auth/request-otp`, `POST /auth/verify-otp` — both endpoints removed |
| Action | **DO NOT DELETE** — Rewrite to test `POST /auth/sync-user` and `GET /auth/me` |

### `tests/test_orders.py`

| Property | Value |
|----------|-------|
| Size | 7,412 bytes |
| Status | ⚠️ PARTIALLY INCOMPATIBLE |
| Issue | Depends on `customer_tokens` and `farmer_tokens` from broken conftest |
| Core logic | Order placement/status logic may still be valid |
| Action | **DO NOT DELETE** — Fix after conftest is updated |

---

## Category 2: Obsolete Script Files

### `scripts/db_setup.py`

| Property | Value |
|----------|-------|
| Size | 3,651 bytes |
| Status | ⚠️ OBSOLETE |
| Issue | Sets up a local PostgreSQL database. Project now uses Neon cloud DB — no local Postgres needed. |
| Risk | Misleading for new developers who might try to run it |
| Action | **ARCHIVE** — Move to `scripts/archive/db_setup_local_postgres.py` with a deprecation note, or delete |

### `scripts/check_schema.py`

| Property | Value |
|----------|-------|
| Size | 874 bytes |
| Status | ✅ POTENTIALLY USEFUL |
| Issue | Schema validation script — may still work against Neon |
| Action | **KEEP** — Small and potentially useful for verification |

---

## Category 3: Legacy Reference Files

### `schema.sql`

| Property | Value |
|----------|-------|
| Location | Project root |
| Status | ⚠️ OBSOLETE REFERENCE |
| Issue | Raw SQL schema from v1.0. Contains `otps` and `refresh_tokens` tables that no longer exist. Has `is_active` and `is_verified` columns that were removed. Contradicts the current Alembic-managed schema. |
| Risk | Misleading — a developer might try to apply it and break the DB |
| Alembic replaces this | Yes — `alembic/versions/` is the authoritative schema source |
| Action | **DELETE or ARCHIVE** — Add `# LEGACY: Do not apply. Use Alembic.` comment at top |

---

## Category 4: Old Report Files

### `docs/reports/FINAL_RELEASE_REPORT.md`

| Property | Value |
|----------|-------|
| Size | 9,417 bytes |
| Date | 2026-06-16 (June 16) |
| Status | 🗂️ HISTORICAL |
| Issue | Documents the Phase 1/Phase 2/Phase 3 implementation — valuable history |
| Action | **KEEP** — Renamed or preserved as `FINAL_RELEASE_REPORT_v1.0.md` for history |

---

## Category 5: Potentially Dead Documentation

### `docs/architecture/environment_variables.md`

| Status | ⚠️ NEEDS REVIEW |
| Issue | May reference v1 OTP env vars (JWT_SECRET, BCRYPT_ROUNDS, etc.) |
| Action | Review and update to match current `.env.example` |

### `docs/architecture/production_checklist.md`

| Status | ⚠️ NEEDS REVIEW |
| Issue | May reference v1 deployment steps |
| Action | Review against current render.yaml + Supabase setup |

### `docs/manuals/AUXIN_CREDENTIALS_REFERENCE.md`

| Status | ⚠️ NEEDS REVIEW |
| Issue | Likely documents v1 demo credentials (OTP-based) |
| Action | Update to document current Supabase-based auth credentials |

---

## Category 6: Frontend Dead Code

### `auxin-frontend/src/fallback/` directory

| Status | ⚠️ INVESTIGATE |
| Issue | From previous audit, this directory contained `demoAuth.ts` and `fallbackApi.ts` — fallback layers that may be remnants of the demo/OTP era |
| Action | Verify if still imported anywhere; delete if not |

### `auxin-admin/src/fallback/` directory

| Status | ⚠️ INVESTIGATE |
| Issue | Same as above — `demoAuth.ts`, `fallbackApi.ts`, `mockData.ts` |
| Action | Verify if still imported; remove if unused |

---

## Files NOT Dead (Confirmed Active)

| File | Reason |
|------|--------|
| `tests/test_security.py` | Tests `generate_delivery_otp`, `hash_delivery_otp`, `verify_delivery_otp` — all still in `security.py` |
| `tests/test_payment_unit.py` | Tests Razorpay signature logic — still valid |
| All `app/` Python files | Active backend code |
| All `alembic/versions/*.py` | Migration history — never delete |
| All `auxin-frontend/src/` files | Active frontend code |
| All `auxin-admin/src/` files | Active admin code |

---

## Summary Table

| File | Category | Recommended Action | Priority |
|------|----------|-------------------|----------|
| `tests/conftest.py` | Incompatible | Rewrite | HIGH |
| `tests/test_auth.py` | Incompatible | Rewrite | HIGH |
| `tests/test_orders.py` | Partially broken | Fix after conftest | MEDIUM |
| `scripts/db_setup.py` | Obsolete | Archive or delete | LOW |
| `schema.sql` | Legacy reference | Archive or delete | MEDIUM |
| `docs/reports/FINAL_RELEASE_REPORT.md` | Historical | Keep | — |
| `docs/architecture/environment_variables.md` | Outdated | Update | MEDIUM |
| `docs/architecture/production_checklist.md` | Outdated | Review | LOW |
| `docs/manuals/AUXIN_CREDENTIALS_REFERENCE.md` | Outdated | Update | MEDIUM |
| `auxin-frontend/src/fallback/` | Unknown | Verify + delete if unused | LOW |
| `auxin-admin/src/fallback/` | Unknown | Verify + delete if unused | LOW |

---

## Files Deleted This Session

**None.** This report identifies dead files but does not delete them per mission rules.
All files remain in place pending team review.
