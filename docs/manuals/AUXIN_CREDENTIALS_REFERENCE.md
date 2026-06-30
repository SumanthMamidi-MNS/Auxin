# Auxin v2.0 — Credentials & Environment Variables Reference

This reference manual provides a complete list of required environment variables, database connections, and user credential information for the Auxin v2.0 platform.

---

## 🔑 Default & Seed Credentials

> [!IMPORTANT]
> **NO DEFAULT CREDENTIALS FOUND.**
> Auxin v2.0 uses Supabase Auth for identity management. Because Supabase Auth is an external cloud service, there are no default or hardcoded logins in the codebase. All users must be registered through Supabase Auth (or the Supabase Dashboard) and subsequently synced to the application database.

### Database Seeded Accounts (Local/Development Only)

When running the database setup script (`python scripts/db_setup.py seed`), the following user record is created in the local/development PostgreSQL database:

*   **Admin Profile (DB Only):**
    *   **Name:** Aarav Kumar
    *   **Phone:** `+919999999999`
    *   **Role:** `admin`
    *   **Status:** `approved`
    *   **Supabase UUID:** *Initially unset. Linked upon first authentication sync.*
    *   **Note:** To log in as this user, you must first register a user in your Supabase Auth dashboard with the synthetic email `+919999999999@auxin.app` and then log in. The backend will link the existing database record to the Supabase account.

### Historical Mock Accounts (Obsolete in v2.0)

In v1.x, the following mock accounts were used by the offline fallback layer. The fallback layer has been permanently removed in v2.0, meaning these logins will not work unless they are manually added to Supabase Auth and synced to the database:

*   **Mock Customer:** `+918888888888` (Synthetic Email: `+918888888888@auxin.app`)
*   **Mock Farmer:** `+917777777777` (Synthetic Email: `+917777777777@auxin.app`)
*   **Mock Delivery:** `+916666666666` (Synthetic Email: `+916666666666@auxin.app`)

---

## ⚙️ Environment Variables Reference

### 1. Backend (`.env` or Render Dashboard)

#### Application Configuration
*   **`APP_ENV`**: Environment profile. Values: `development`, `production`. (Default: `development`)
*   **`APP_HOST`**: Server host binding IP. (Default: `0.0.0.0`)
*   **`APP_PORT`**: Server port binding. (Default: `8000`)
*   **`DEBUG`**: Enables Swagger/ReDoc interactive APIs and SQL query logging. (Default: `false` in production)
*   **`LOG_LEVEL`**: Logging verbosity. Values: `DEBUG`, `INFO`, `WARNING`, `ERROR`. (Default: `INFO`)
*   **`ALLOWED_ORIGINS`**: Comma-separated list of allowed CORS origins. (e.g., `https://app.auxin.in,https://admin.auxin.in`)

#### Database Connection
*   **`DATABASE_URL`**: PostgreSQL connection string with `postgresql+asyncpg://` schema.
*   **`DEMO_MODE`**: Boolean. If `true`, redirects database sessions to `DEMO_DATABASE_URL`.
*   **`DEMO_DATABASE_URL`**: Separate sandbox database connection string. Used for investor demonstrations.

#### Supabase Auth Integration
*   **`SUPABASE_URL`**: Your Supabase project URL (e.g., `https://xxxx.supabase.co`).
*   **`SUPABASE_JWT_SECRET`**: Project Settings -> API -> JWT Secret. Used to decode and verify bearer JWTs.
*   **`SUPABASE_SERVICE_ROLE_KEY`**: Project Settings -> API -> service_role key. Used for administrative API operations.

#### Cryptography & Financial Security
*   **`BANK_ACCOUNT_ENCRYPTION_KEY`**: A Fernet symmetric key used to encrypt farmer bank account numbers at rest. Generate using:
    ```python
    from cryptography.fernet import Fernet
    print(Fernet.generate_key().decode())
    ```

#### Razorpay Payments Gateway
*   **`RAZORPAY_KEY_ID`**: Public Razorpay Key ID (starts with `rzp_test_` or `rzp_live_`).
*   **`RAZORPAY_SECRET`**: Private API secret key. Must never be exposed to the frontends.

#### Delivery Logistics Rules
*   **`DELIVERY_OTP_EXPIRY_MINUTES`**: Handoff OTP lifespan in minutes. (Default: `10`)
*   **`DELIVERY_ASSIGNMENT_TIMEOUT_MINUTES`**: Auto-unassign timeout in minutes. (Default: `30`)
*   **`DELIVERY_GEOFENCE_RADIUS_METERS`**: Handoff distance verification radius. (Default: `100.0` meters)

---

### 2. Main Frontend (`auxin-frontend/.env.local` or Vercel Settings)

*   **`NEXT_PUBLIC_API_URL`**: Backend API base URL (e.g., `https://api.auxin.in/api/v1` or `http://localhost:8000/api/v1`).
*   **`NEXT_PUBLIC_SUPABASE_URL`**: Supabase project URL (must match backend configuration).
*   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Supabase public/anonymous API key.
*   **`NEXT_PUBLIC_APP_ENV`**: Next.js client environment mode. (e.g., `development`, `production`)
*   **`NEXT_PUBLIC_DEMO_MODE`**: Boolean. Set to `true` to display the investor demo warning banner.
*   **`NEXT_PUBLIC_ADMIN_URL`**: Standalone admin portal redirect URL (e.g., `https://admin.auxin.in`).
*   **`NEXT_PUBLIC_APP_URL`**: Deployed frontend canonical URL (e.g., `https://app.auxin.in`).
*   **`NEXT_PUBLIC_RAZORPAY_KEY_ID`**: Public Razorpay Key ID (starts with `rzp_test_` or `rzp_live_`).

---

### 3. Admin Portal (`auxin-admin/.env.local` or Vercel Settings)

*   **`NEXT_PUBLIC_API_URL`**: Backend API base URL.
*   **`NEXT_PUBLIC_SUPABASE_URL`**: Supabase project URL.
*   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Supabase public/anonymous API key.
*   **`NEXT_PUBLIC_APP_ENV`**: Next.js client environment mode.
*   **`NEXT_PUBLIC_DEMO_MODE`**: Boolean. Set to `true` to display the amber "DEMO MODE — Sandbox data only" banner.
*   **`NEXT_PUBLIC_APP_URL`**: Deployed admin portal canonical URL (e.g., `https://admin.auxin.in`).
*   **`NEXT_PUBLIC_RAZORPAY_KEY_ID`**: Public Razorpay Key ID (for display purposes).

---

## 🛑 Security & Compliance Rules

1.  **Strict Confidentiality:** The variables `DATABASE_URL`, `DEMO_DATABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `BANK_ACCOUNT_ENCRYPTION_KEY`, and `RAZORPAY_SECRET` must **never** be prefixed with `NEXT_PUBLIC_` or included in frontend client bundles.
2.  **Fernet Encryption Key Rotation:** If the `BANK_ACCOUNT_ENCRYPTION_KEY` is changed, all encrypted bank account fields in the `farmers` table must be decrypted with the old key and re-encrypted with the new key to prevent data corruption.
