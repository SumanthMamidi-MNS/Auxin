# Auxin v2.0 — End-User Operational Manual & Guide

Welcome to the Auxin v2.0 Operational Manual. This guide explains how to start, configure, and operate the Auxin farmer-to-customer marketplace system.

---

## 🚀 Getting Started & Startup Procedures

Auxin v2.0 consists of three core applications: a FastAPI backend and two Next.js 14 frontends (the main app for customers/farmers/delivery partners and the admin dashboard).

### Step 1: Start the Backend Service
The backend is built with FastAPI. It handles routing, database connections, and integrations with Supabase Auth and Razorpay.

1.  **Open a terminal** and navigate to the project root:
    ```powershell
    cd "The Auxin"
    ```
2.  **Activate the virtual environment**:
    *   **Windows (PowerShell):**
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```
    *   **Linux / macOS:**
        ```bash
        source venv/bin/activate
        ```
3.  **Run migrations** to set up database tables:
    ```bash
    alembic upgrade head
    ```
4.  **Start the server**:
    ```bash
    python main.py
    ```
    *   **Backend URL:** `http://localhost:8000`
    *   **Interactive Docs (Swagger):** `http://localhost:8000/docs` (only available in `DEBUG=true` mode)
    *   **Health Check:** `http://localhost:8000/health`

---

### Step 2: Start the Main Frontend (Customer/Farmer/Delivery Portal)
The main app serves the primary marketplace roles.

1.  **Open a new terminal** and navigate to the frontend folder:
    ```bash
    cd "The Auxin/auxin-frontend"
    ```
2.  **Install dependencies** (if running for the first time):
    ```bash
    npm install
    ```
3.  **Start the development server**:
    ```bash
    npm run dev
    ```
    *   **Frontend URL:** `http://localhost:3000`

---

### Step 3: Start the Admin Portal
The admin dashboard is a standalone portal used for platform management and dispute resolution.

1.  **Open a new terminal** and navigate to the admin folder:
    ```bash
    cd "The Auxin/auxin-admin"
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the development server**:
    ```bash
    npm run dev -- -p 3001
    ```
    *(Starts the admin portal on port 3001 to avoid conflicts with the main frontend).*
    *   **Admin Portal URL:** `http://localhost:3001`

---

## 👥 Roles and Permissions Matrix

| Feature / Page | Customer | Farmer | Delivery Partner | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Browse Marketplace** | ✅ | ❌ | ❌ | ❌ |
| **Add to Cart & Checkout** | ✅ | ❌ | ❌ | ❌ |
| **Accept/Reject Orders** | ❌ | ✅ | ❌ | ❌ |
| **List & Edit Products** | ❌ | ✅ | ❌ | ❌ |
| **Update GPS Location** | ❌ | ❌ | ✅ | ❌ |
| **Verify Delivery Handoff OTP**| ✅ | ❌ | ✅ | ❌ |
| **Raise Dispute** | ✅ | ✅ | ❌ | ❌ |
| **User Approvals / Suspensions**| ❌ | ❌ | ❌ | ✅ |
| **Refunds & Disputes Resolution**| ❌ | ❌ | ❌ | ✅ |

---

## 🔄 Core Platform Workflows

### 1. Registration & Authentication Flow
Auxin v2.0 implements **Mobile Number + Password** authentication. 

```
[ User enters Phone + Password ]
              │
              ▼
[ Client converts Phone to Synthetic Email (+919876543210@auxin.app) ]
              │
              ▼
[ Supabase Auth signs up/in user and returns JWT ]
              │
              ▼
[ Client calls POST /auth/sync-user with JWT and Profile parameters ]
              │
              ▼
[ Backend updates or inserts record in PostgreSQL 'users' table ]
```

*   **Session Persistence:** Sessions are persisted securely via the Supabase Client SDK and Zustand middleware.
*   **Logout Flow:** Triggering logout clears local stores (e.g., Zustand `auxin_auth` and `auxin_cart` in `localStorage`) and invalidates the session via `supabase.auth.signOut()`.

---

### 2. Registration & Admin Approval Workflow
Farmers and delivery partners require administrative approval before they can transact.

```
[ Register: status defaults to 'pending' ] ──► [ Login Attempted ] ──► [ Blocked with 403 / pending screen ]
                                                                                   │
                                                                                   ▼
[ Admin approves via /admin/farmers/{id}/approve ] ◄───────────────────────────────┘
  ├── Status updated to 'approved'
  └── Farmer/Delivery can now access platform dashboards
```

1.  **Register:** A new user registers as a farmer or delivery partner. Their initial status is automatically set to `pending`.
2.  **Review:** The administrator reviews the pending applicant card under the **Farmers** or **Delivery** tab in the admin dashboard.
3.  **Action:** The admin clicks **Approve** or **Reject**. Rejections block access permanently, while approvals grant immediate system access.

---

### 3. Order Placement & Escrow Payment Flow
Payments are processed through a secure escrow model integrated with Razorpay.

```
[ Cart Checkout ] ──► [ POST /payments/create ] ──► [ Razorpay Modal opens on client ]
                                                                 │
                                                                 ▼
[ Payment Verified: status = 'paid' (Held in Escrow) ] ◄─────────┘
  ├── Order status = 'pending' (Awaiting Farmer acceptance)
  └── Delivery record is created automatically
```

1.  **Checkout:** The customer clicks "Place Order". The client requests `POST /payments/create` from the backend to generate a Razorpay order.
2.  **Payment Capture:** The Razorpay checkout modal opens. Upon payment completion, the client calls `POST /payments/verify` with the signature parameters.
3.  **Escrow State:** If the signature is verified, the payment status changes to `paid` and the funds are held in escrow. The order status changes to `pending` and a delivery record is initialized.

---

### 4. Order Acceptance & Logistics Fulfillment Flow
Once paid, orders are routed through accepted, assigned, picked up, and handoff stages.

```
[ Order Paid ] ──► [ Farmer accepts order ] ──► [ Delivery assigned ] ──► [ Delivery picked up ]
                                                                                    │
                                                                                    ▼
[ Order Completed & Funds Released ] ◄── [ Delivery completed via OTP handoff verification ]
```

1.  **Acceptance:** The farmer views the order and clicks **Accept** (status changes to `accepted`). If rejected, a refund is automatically triggered.
2.  **Courier Assignment:** A delivery partner goes online (`is_available = true`). The system or administrator assigns them to the delivery.
3.  **Logs Progression:** The courier updates the delivery status from `assigned` ➡️ `picked_up` ➡️ `out_for_delivery`.
4.  **OTP Handoff:** Arriving at the customer's geofence, the courier requests the customer's 6-digit verification code. The courier inputs this code.
5.  **Settlement Release:** When verified, the payment state changes to `completed`, and a `release` transaction is recorded to audit the release of escrow funds to the farmer.

---

### 5. Disputes & Refund Workflows
If things go wrong, customers or farmers can raise disputes which admins moderate.

```
[ Order accepts/completed ] ──► [ Customer / Farmer raises dispute via POST /disputes ]
                                                           │
                                                           ▼
                      [ Admin reviews dispute in Admin Portal (/disputes) ]
                                                           │
                                    ┌──────────────────────┴──────────────────────┐
                                    ▼                                             ▼
                          [ Action: APPROVE/RESOLVE ]                     [ Action: REJECT ]
                            ├── Set status = 'resolved'                     ├── Set status = 'rejected'
                            ├── If trigger_refund=true, Razorpay API        └── Funds remain in database
                            │   reverses payment.                           
                            └── Payment status = 'refunded'
```

1.  **Dispute Raised:** An involved party submits a dispute request detailing the issue.
2.  **Admin Review:** The administrator opens the **Disputes** page, reviews the reason, and decides whether to resolve or reject the dispute.
3.  **Resolve (with Refund):** If the admin resolves the dispute and flags `trigger_refund=true`, the backend initiates a Razorpay refund. The transaction status updates to `refunded` and the customer is reimbursed.
4.  **Reject:** If the admin rejects the dispute, the case is closed and any remaining escrow funds are processed according to system resolution guidelines.

---

## 🛠️ Sandbox Demo Mode Behavior

For investor demonstrations, Auxin v2.0 features a secure sandbox mode:
*   **Visual Warning:** An amber banner reads: `⚠ DEMO MODE — All actions affect sandbox data only.` at the top of the Admin portal.
*   **Database Isolation:** All backend database writes and queries are routed to the `DEMO_DATABASE_URL` instead of the production instance. Production data is completely isolated.
*   **Activation:** Set `DEMO_MODE=true` in the backend and `NEXT_PUBLIC_DEMO_MODE=true` in the admin settings.
*   **Deactivation:** Set `DEMO_MODE=false` in the backend and `NEXT_PUBLIC_DEMO_MODE=false` in the admin settings.
