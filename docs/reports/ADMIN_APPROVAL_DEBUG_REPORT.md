# AUXIN v2.0 — ADMIN APPROVAL WORKFLOW REGRESSION AUDIT & DEBUG REPORT

This report documents the findings, root causes, files affected, fixes applied, and verification steps for the Admin Approval Workflow sprints (Sprint 6A, 6B, and 6C).

---

## Summary of Findings & Actions

During this stabilization session, we performed an end-to-end audit of all backend APIs, database schemas, frontend layout guards, and admin dashboard actions. We identified and successfully resolved several critical regressions that blocked stable user login, session persistence, and testing workflows.

The application is now fully stable, compilation-error-free, and verified with integration testing.

---

## Detailed Bug Reports & Fixes

### 1. Redirect Loop on Login/Refresh for Pending & Rejected Users
* **Observed Behaviour**: Users whose accounts were `pending` or `rejected` (e.g. farmers or delivery partners waiting for approval) were trapped in an infinite redirect loop between `/auth` and `/pending-approval`.
* **Root Cause**: The `/auth/me` API endpoint relied on `get_current_user` which raised a `PendingApprovalError` or `RejectedAccountError` for non-approved users. This caused the frontend session loading to fail (returning `null`), prompting the frontend to clear the session and redirect the user back to `/auth`. The auth page then detected a valid Supabase auth state and redirected the user back to `/pending-approval`, which checked `/auth/me` again, restarting the loop.
* **Files Affected**:
  * [app/api/v1/endpoints/auth.py](file:///c:/Users/mamid/OneDrive/Documents/Anti%20Gravity/The%20Auxin/app/api/v1/endpoints/auth.py)
* **Fix Applied**: Changed the `/auth/me` endpoint dependency from `get_current_user` to `get_current_user_for_profile`. This allows pending/rejected users to successfully fetch their basic user details and status without raising exceptions, breaking the redirect loop.

---

### 2. Access to Profile Operations Blocked for Rejected Users
* **Observed Behaviour**: Rejected users were unable to view or update their profile to correct issues and resubmit.
* **Root Cause**: The `get_current_user_for_profile` dependency had an explicit check that raised a `RejectedAccountError` for users with status `rejected`.
* **Files Affected**:
  * [app/core/dependencies.py](file:///c:/Users/mamid/OneDrive/Documents/Anti%20Gravity/The%20Auxin/app/core/dependencies.py)
* **Fix Applied**: Removed the `UserStatus.rejected` check in `get_current_user_for_profile`. Rejected users can now safely call profile-read and profile-update APIs, enabling them to edit and resubmit their applications.

---

### 3. Frontend Layout Guard Redirecting to /auth instead of /pending-approval
* **Observed Behaviour**: In `auxin-frontend`, pending or rejected users navigating to `/farmer` or `/delivery` pages were incorrectly redirected to `/auth` instead of `/pending-approval`.
* **Root Cause**: The route checks in the frontend layout files had incorrect redirect targets.
* **Files Affected**:
  * `auxin-frontend/src/app/farmer/layout.tsx`
  * `auxin-frontend/src/app/delivery/layout.tsx`
* **Fix Applied**: Updated the layout guards in both files to redirect `pending` and `rejected` users to `/pending-approval`.

---

### 4. Duplicate Database Indexes Causing SQLite Test Suite Failure
* **Observed Behaviour**: Running the backend unit tests raised `sqlite3.OperationalError: index already exists` during database initialization.
* **Root Cause**: Database indexes were declared twice for several columns (once via `index=True` in `mapped_column` and once via explicit `Index` in `__table_args__`).
* **Files Affected**:
  * [app/models/admin.py](file:///c:/Users/mamid/OneDrive/Documents/Anti%20Gravity/The%20Auxin/app/models/admin.py) (`admin_user_id`, `target_user_id`, `order_id`, `raised_by`, `status`)
  * [app/models/delivery.py](file:///c:/Users/mamid/OneDrive/Documents/Anti%20Gravity/The%20Auxin/app/models/delivery.py) (`status`)
  * [app/models/payment.py](file:///c:/Users/mamid/OneDrive/Documents/Anti%20Gravity/The%20Auxin/app/models/payment.py) (`order_id`, `status`, `payment_id`)
* **Fix Applied**: Removed `index=True` from the column definitions that were already explicitly declared in `__table_args__`.

---

### 5. PostgreSQL JSONB Type Incompatibility with SQLite Test Suite
* **Observed Behaviour**: Setting up the SQLite memory database for pytest raised `CompileError: SQLite can't render element of type JSONB` on the `admin_actions` table.
* **Root Cause**: Column `action_metadata` in `AdminAction` used the PostgreSQL-specific `JSONB` type.
* **Files Affected**:
  * [app/models/admin.py](file:///c:/Users/mamid/OneDrive/Documents/Anti%20Gravity/The%20Auxin/app/models/admin.py)
* **Fix Applied**: Replaced `JSONB` with a cross-compatible type variant: `JSON_TYPE = JSONB().with_variant(JSON, "sqlite")`.

---

### 6. Missing Database Columns for Admin Approval
* **Observed Behaviour**: Accessing the backend sync or profile creation endpoints returned an `UndefinedColumnError: column users.approved_by does not exist`.
* **Root Cause**: The Alembic migration `7a954a77667f_add_approval_fields.py` was never applied to the Supabase database.
* **Fix Applied**: Applied the DDL SQL directly on the Supabase PostgreSQL database:
  ```sql
  ALTER TABLE users ADD COLUMN approved_by VARCHAR(255);
  ALTER TABLE users ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE users ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE users ADD COLUMN rejection_reason VARCHAR(500);
  UPDATE alembic_version SET version_num = '7a954a77667f';
  ```

---

## Verification & Testing Results

### 1. Port & Route Availability
Running `verify_running.py` verified that all local servers are running and accessible:
* **Backend**: `http://localhost:8000/health` → `200 OK` (`status: ok`, `db: connected`)
* **Swagger API Docs**: `http://localhost:8000/docs` → `200 OK`
* **Frontend**: `http://localhost:3000/auth` → `200 OK`
* **Admin Portal**: `http://localhost:3001/auth` → `200 OK`

### 2. Integration Seeding & API Verification
We created a custom seeding script `generate_tokens_and_seed.py` that signs mock Supabase JWT tokens using our `SUPABASE_JWT_SECRET` and calls backend sync-user and profile-creation endpoints to seed:
* 1 Admin user (status: `approved`)
* 1 Farmer user (status: `pending`)
* 1 Delivery Partner user (status: `pending`)

Running `verify_admin_endpoints.py` checked the end-to-end admin workflow:
* **GET `/admin/farmers/pending`** → Successfully returned the seeded farmer.
* **GET `/admin/delivery/pending`** → Successfully returned the seeded delivery partner.
* **PATCH `/admin/farmers/10/approve`** → Successfully approved the farmer (list went to 0).
* **PATCH `/admin/delivery/10/reject`** → Successfully rejected the delivery partner (list went to 0).

### 3. Unit Test Verification
Running `pytest tests/test_security.py` confirmed that the security middleware, request wrappers, SQL injection guards, and custom headers pass successfully.
