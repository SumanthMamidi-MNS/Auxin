# API Endpoint Documentation — Auxin

The API is fully documented using OpenAPI/Swagger. Below are the key endpoints exposed by the FastAPI backend server.

---

## 1. Authentication
* `POST /api/v1/auth/sync`: Sync authenticated user profile from Supabase JWT token.
* `GET /api/v1/auth/me`: Get current authenticated user details.

## 2. Customer Portal
* `GET /api/v1/products`: List and filter available products in the catalogue.
* `GET /api/v1/products/{id}`: Retrieve detailed specifications for a specific product.
* `POST /api/v1/orders`: Create a checkout order reservation. Supports cash-on-delivery and online prepayments.
* `GET /api/v1/orders/my`: List current customer's order history.

## 3. Farmer Portal
* `GET /api/v1/farmer/profile`: Retrieve farmer credentials, packing queues, and earnings.
* `PUT /api/v1/farmer/inventory`: Update crop listing stock availability and unit pricing.

## 4. Delivery Portal
* `GET /api/v1/delivery/trips`: List pending or active order assignments inside geofenced areas.
* `POST /api/v1/delivery/handshake`: Complete order handover with secure OTP confirmation.

## 5. Milo AI Framework
* `GET /api/v1/milo/status`: Fetch Milo status and availability parameters.
