# Auxin v2.0 — Quality Assurance & Testing Guide

This QA manual outlines test cases, execution steps, expected outcomes, and URLs to verify the features of Auxin v2.0.

---

## 🚦 System Health & Liveness Checks

### Test Case 1: Backend Health Endpoint
*   **Test URL:** `GET http://localhost:8000/health` (or deployed equivalent)
*   **Procedure:**
    1.  Send a GET request to the `/health` endpoint.
*   **Expected Behavior:**
    *   **Status Code:** `200 OK` (when database is connected)
    *   **Payload:**
        ```json
        {
          "status": "ok",
          "version": "2.0.0",
          "env": "development",
          "demo_mode": false,
          "db": "connected",
          "uptime_s": 123.4
        }
        ```
    *   **Failure Mode:** If the database connection fails, the endpoint returns a `503 Service Unavailable` status and payload `status: "degraded", db: "unreachable"`.

### Test Case 2: Frontend Proxy Health Endpoint
*   **Test URL:** `GET http://localhost:3000/api/health`
*   **Procedure:**
    1.  Send a GET request to the Next.js health proxy.
*   **Expected Behavior:**
    *   **Status Code:** `200 OK`
    *   **Payload:**
        ```json
        {
          "frontend": "ok",
          "backend": { "status": "ok", "version": "2.0.0", ... },
          "timestamp": "2026-06-16T04:00:00.000Z"
        }
        ```

---

## 🔐 Authentication & Session Persistence Tests

### Test Case 3: Customer/Farmer/Delivery Sign-Up
*   **Test URL:** `http://localhost:3000/auth`
*   **Procedure:**
    1.  Open the sign-up tab, select a role (e.g., Customer), and enter a valid phone number and password.
    2.  Click **Sign Up**.
*   **Expected Behavior:**
    *   An email entry formatted as `<phone_number>@auxin.app` is created in Supabase Auth.
    *   The backend database `users` table is updated with a matching `supabase_uid` and real phone number.
    *   Farmers and delivery roles should immediately see a "Pending Admin Approval" screen upon successful registration.

### Test Case 4: Session Persistence & Logout
*   **Test URL:** `http://localhost:3000/customer/home`
*   **Procedure:**
    1.  Log in as an approved customer.
    2.  Refresh the web browser tab.
    3.  Click **Logout** in the navigation bar.
*   **Expected Behavior:**
    *   Refreshing does not log the user out; user details are restored from Zustand persistent store.
    *   Logging out invalidates the Supabase session, clears local storage tokens (`auxin_auth` and `auxin_cart`), and redirects the user to the `/auth` page.

---

## 🛍️ Customer Flow & Payment Verification

### Test Case 5: Add to Cart & Checkout (Razorpay Escrow)
*   **Test URL:** `http://localhost:3000/customer/home`
*   **Procedure:**
    1.  Browse items and add multiple quantities to the cart.
    2.  Go to the Cart drawer and click **Place Order**.
    3.  Select Razorpay checkout, enter standard test card details, and complete payment.
*   **Expected Behavior:**
    *   `POST /api/v1/payments/create` returns a valid Razorpay Order ID.
    *   Razorpay checkout modal loads successfully.
    *   Upon successful payment, the frontend sends signature parameters to `POST /api/v1/payments/verify`.
    *   Order is successfully created with status `pending`, and payment status becomes `paid` (held in escrow).

---

## 🚜 Farmer Portal & Product Management

### Test Case 6: Profile Setup & Approval Gate
*   **Test URL:** `http://localhost:3000/farmer/setup`
*   **Procedure:**
    1.  Register a new Farmer account.
    2.  Attempt to navigate to `http://localhost:3000/farmer/dashboard`.
*   **Expected Behavior:**
    *   The app blocks access and displays the setup/pending screen.
    *   Once the profile is complete, status changes to `pending`.
    *   After admin approval, the farmer is redirected to `http://localhost:3000/farmer/dashboard` with full access.

### Test Case 7: Product Creation
*   **Test URL:** `http://localhost:3000/farmer/products`
*   **Procedure:**
    1.  Click **Add Product**.
    2.  Enter name, price, stock quantity, unit (e.g., kg), harvest date, and image URL. Click save.
*   **Expected Behavior:**
    *   Product is created and listed in the database under the farmer's ID.
    *   The product listing immediately appears in the customer marketplace search queries.

---

## 🚚 Delivery Logistics & OTP Verification

### Test Case 8: Availability & Assigned Flow
*   **Test URL:** `http://localhost:3000/delivery/dashboard`
*   **Procedure:**
    1.  Toggle the availability switch to **Online**.
    2.  Assign a delivery to this partner via the Admin panel.
*   **Expected Behavior:**
    *   Availability updates (`is_available = true`).
    *   The partner receives an incoming job notification.
    *   Partner progresses status: `assigned` ➡️ `picked_up` ➡️ `out_for_delivery`.

### Test Case 9: Geofenced Handoff & OTP Verification
*   **Test URL:** `http://localhost:3000/delivery/dashboard`
*   **Procedure:**
    1.  Set current latitude/longitude to match the destination coordinates.
    2.  Request the customer's 6-digit OTP code.
    3.  Enter the code in the confirmation modal and click **Verify**.
*   **Expected Behavior:**
    *   Inputting a wrong code displays a validation error.
    *   Correct code updates the delivery status to `delivered` and order status to `completed`.
    *   The backend triggers the release of escrow funds to the farmer's ledger.

---

## 👑 Admin Governance & Disputes

### Test Case 10: User Suspensions & Farmer Approvals
*   **Test URL:** `http://localhost:3001/users` and `http://localhost:3001/farmers`
*   **Procedure:**
    1.  Open the Users tab, select a user, click **Suspend**, and enter a reason.
    2.  Open the Farmers tab and click **Approve** on a pending farmer card.
*   **Expected Behavior:**
    *   Suspended users are immediately blocked from logging in (calls to `/auth/me` return HTTP 403).
    *   Approved farmers can log in and manage their inventory.
    *   Both actions create audit rows in the `admin_actions` table.

### Test Case 11: Dispute Resolution & Razorpay Refunds
*   **Test URL:** `http://localhost:3001/disputes`
*   **Procedure:**
    1.  Select an open dispute raised for a paid order.
    2.  Input a resolution note, check the **Trigger Refund** box, and click **Resolve**.
*   **Expected Behavior:**
    *   Dispute status changes to `resolved`.
    *   The Razorpay refund API is called.
    *   Payment status changes to `refunded` and the customer is reimbursed.

---

## ⚡ UX Resilience & Resilience Tests

### Test Case 12: Render Backend Cold Start UX
*   **Procedure:**
    1.  Ensure the backend has slept (inactive for 15+ minutes on Render free-tier).
    2.  Open `http://localhost:3000` and perform an action that triggers a backend call.
*   **Expected Behavior:**
    *   The axios API interceptor catches the timeout or HTTP 503 from the waking server.
    *   A full-screen skeleton loading view (`ColdStartLoader`) overlay renders.
    *   Rotating status messages display to keep the user engaged.
    *   The client auto-retries the request after 3 seconds, closing the loader once the backend responds successfully.

### Test Case 13: Next.js Error Boundaries & 404 Pages
*   **Test URLs:** `http://localhost:3000/invalid-page-xyz` and `http://localhost:3001/invalid-admin-path`
*   **Procedure:**
    1.  Enter an invalid route path in the address bar.
    2.  Stop the backend API service, and attempt to fetch product data.
*   **Expected Behavior:**
    *   Entering invalid paths correctly displays custom `404 Not Found` pages.
    *   Backend offline failures are caught by route-level error boundaries (`error.tsx`), displaying a user-friendly retry prompt instead of crashing the browser.
