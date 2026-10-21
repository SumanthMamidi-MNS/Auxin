<p align="center">
  <img src="docs/assets/logo-cropped.png" alt="Auxin Logo" height="110">
</p>

<h1 align="center">
  <strong>AUXIN</strong><br>
  <sub>Hyper-Local Direct-From-Farm Marketplace &bull; Autonomous Agritech Logistics &bull; Milo AI Intelligence</sub>
</h1>

<p align="center">
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.12" height="28"></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-Async_REST-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" height="28"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js_16-Turbopack-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16" height="28"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4_Tokens-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" height="28"></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Auth_&_Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" height="28"></a>
  <a href="https://razorpay.com/"><img src="https://img.shields.io/badge/Razorpay-Escrow_Commerce-02042B?style=for-the-badge&logo=razorpay&logoColor=0088FF" alt="Razorpay" height="28"></a>
  <a href="tests/"><img src="https://img.shields.io/badge/Pytest-73_Passed_100%25-22C55E?style=for-the-badge&logo=pytest&logoColor=white" alt="73 Tests Passing" height="28"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-D4AF37?style=for-the-badge" alt="MIT License" height="28"></a>
  <a href="https://github.com/SumanthMamidi-MNS"><img src="https://img.shields.io/badge/Architected_by-Sumanth_Mamidi-052E16?style=for-the-badge" alt="Sumanth Mamidi" height="28"></a>
</p>

<p align="center">
  <strong>Auxin</strong> eliminates the multi-tiered broker system in regional agriculture by connecting local farmers directly with consumers within a strict <strong>25 km hyper-local radius</strong>. Engineered with an atomic escrow commerce engine, turn-by-turn mobile delivery HUD, cryptographic doorstep OTP proof, and <strong>Milo</strong> — a domain-specialized agricultural AI copilot.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Zero_Middlemen-100%25_Farmer_Margins-22C55E?style=flat-square" alt="Zero Middlemen">
  &bull;
  <img src="https://img.shields.io/badge/25_KM_Geofence-Farm_to_Door_in_2_Hours-052E16?style=flat-square" alt="25 KM Geofence">
  &bull;
  <img src="https://img.shields.io/badge/Cryptographic_OTP-Zero_Dispute_Delivery-D4AF37?style=flat-square" alt="Cryptographic OTP">
  &bull;
  <img src="https://img.shields.io/badge/Role_Adaptive-3_Integrated_Portals-black?style=flat-square" alt="Role Adaptive">
</p>

---

<details open>
<summary><strong>📑 Table of Contents</strong></summary>

1. [Why This Exists](#-why-this-exists)
2. [Three Role-Adaptive Portals](#-three-role-adaptive-portals)
3. [Mobile-First Real-Time Experience](#-mobile-first-real-time-experience)
   - [Customer Mobile Portal (Discovery & Provenance)](#1-customer-mobile-portal-discovery--provenance)
   - [Farmer Mobile Portal (Business & Operations Radar)](#2-farmer-mobile-portal-business--operations-radar)
   - [Delivery Partner Mission HUD (GPS & Doorstep OTP)](#3-delivery-partner-mission-hud-gps--doorstep-otp)
   - [Milo AI (Autonomous Agritech Assistant)](#4-milo-ai-autonomous-agritech-assistant)
4. [End-to-End System Architecture](#-end-to-end-system-architecture)
5. [Core Engineering Highlights](#-core-engineering-highlights)
   - [25 KM Haversine Geofencing Engine](#1-25-km-haversine-geofencing-engine)
   - [Two-Phase Atomic Escrow Commerce](#2-two-phase-atomic-escrow-commerce)
   - [Doorstep Cryptographic OTP Verification](#3-doorstep-cryptographic-otp-verification)
   - [Milo AI 7-Stage RAG Pipeline](#4-milo-ai-7-stage-rag-pipeline)
6. [Automated Verification & Test Suite](#-automated-verification--test-suite)
7. [Tech Stack](#-tech-stack)
8. [Quickstart (Local Run)](#-quickstart-local-run)
9. [Repository Layout](#-repository-layout)
10. [Author & License](#-author--license)

</details>

---

## 🌾 Why This Exists

In traditional agricultural supply chains, harvested crops pass through 4 to 6 tiers of brokers, commission agents (arhtiyas), and wholesale mandis before reaching urban consumers. 

```
TRADITIONAL CHAIN (BROKEN):
[Farmer] ──(₹15/kg)──► [Local Agent] ──► [APMC Mandi] ──► [Wholesaler] ──► [Retailer] ──(₹60/kg)──► [Consumer]
                        ▲ 48–72 hr transit delays &bull; 30% spoilage &bull; 75% margin lost to middlemen ▲

THE AUXIN PARADIGM:
[Farmer] ─────────────────────── 25 KM Hyper-Local Delivery ───────────────────────► [Consumer]
 (Gets ₹45/kg)                  (Delivered within 2 hours by Courier)                  (Pays ₹50/kg)
```

### The Auxin Breakthrough
1. **100% Margin Flow to Cultivator**: Middlemen fees are eliminated; farmers set their own live prices per harvest.
2. **2-Hour Harvest-to-Door Window**: Crops are picked in the morning and delivered within hours, locking in peak vitamins, aroma, and crisp cellular texture.
3. **Hyper-Local Geofencing (25 km)**: Delivery partners and orders are strictly bound to a 25 km radius using the Haversine spatial coordinate validation model.
4. **Escrow Dispute Protection**: Customer funds remain safely locked in escrow until the customer inspects the produce and provides a single-use 6-digit OTP to the courier.

---

## 🏛️ Three Role-Adaptive Portals

Auxin is **one unified product ecosystem** designed from first principles with **three distinct role personas**:

```
                              ┌─────────────────────────────────────────┐
                              │           AUXIN DESIGN SYSTEM           │
                              │       Warm Cream (#FDFBF6) Canvas       │
                              │       Forest Green (#22C55E) Brand      │
                              │       Harvest Gold (#D4AF37) Accent     │
                              │       Poppins Display + Inter Sans      │
                              └────────────────────┬────────────────────┘
                                                   │
             ┌─────────────────────────────────────┼─────────────────────────────────────┐
             ▼                                     ▼                                     ▼
  ┌───────────────────────┐             ┌───────────────────────┐             ┌───────────────────────┐
  │    CUSTOMER PORTAL    │             │     FARMER PORTAL     │             │    DELIVERY PORTAL    │
  │ Discovery & Provenance│             │ Operations & Business │             │  Action & Mission HUD │
  ├───────────────────────┤             ├───────────────────────┤             ├───────────────────────┤
  │ &bull; Horizontal rails    │             │ &bull; Operations radar   │             │ &bull; Mission HUD focus │
  │ &bull; 4:5 Crop cards     │             │ &bull; Stock health meters│             │ &bull; Turn-by-turn steps│
  │ &bull; Multi-farmer select│             │ &bull; 6-Stage pipeline   │             │ &bull; 25km job radar    │
  │ &bull; Escrow checkout    │             │ &bull; Revenue analytics  │             │ &bull; Doorstep OTP card │
  │ &bull; Milestone tracking │             │ &bull; Escrow direct bank │             │ &bull; ₹40/drop payout   │
  └───────────────────────┘             └───────────────────────┘             └───────────────────────┘
```

---

## 📱 Mobile-First Real-Time Experience

Auxin is built **mobile-first** for the real world — where farmers manage produce in sunlit fields, delivery partners navigate traffic on two-wheelers, and consumers shop on their smartphones.

### 1. Customer Mobile Portal (Discovery & Provenance)

Designed for freshness, trust, and zero-confusion ordering. Features editorial category rails, 4:5 portrait crop cards, and real-time delivery timelines.

```
┌──────────────────────────────────────┐
│  🌿 Auxin              🔔 (2)  🛒 3  │
├──────────────────────────────────────┤
│  GOOD MORNING ☀️                      │
│  Namaste, Sumanth!                   │
│  • 100% Farm Direct • 25 KM Radius   │
├──────────────────────────────────────┤
│  🔍 Search fresh mangoes, spinach... │
├──────────────────────────────────────┤
│  [🌱 All] [🌾 Grains] [🥛 Dairy] [🌿] │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ 🥭 SEASON'S BEST               │  │
│  │ Ratnagiri Alphonso Mangoes     │  │
│  │ Naturally tree-ripened • ₹180  │  │
│  │ [ Shop Fresh Harvest ]         │  │
│  └────────────────────────────────┘  │
├──────────────────────────────────────┤
│  POPULAR THIS WEEK                   │
│  ┌─────────────────┐┌────────────────┐│
│  │ [4:5 PHOTO]     ││ [4:5 PHOTO]    ││
│  │ 🌿 Organic      ││ 🌿 Organic     ││
│  │ Ratnagiri Mango ││ Palak Spinach  ││
│  │ Green Meadows   ││ Ramesh Farm    ││
│  │ ₹180 / kg       ││ ₹20 / bunch    ││
│  │ [   + ADD   ]   ││ [   + ADD   ]  ││
│  └─────────────────┘└────────────────┘│
├──────────────────────────────────────┤
│  [🏠 Home] [🛒 Cart (3)] [❤️] [📦] [👤]│
└──────────────────────────────────────┘
```

* **4:5 Vertical Crop Photography**: Eliminates squished images; displays natural soil and farm provenance.
* **Multi-Farmer Selector**: When viewing an item (e.g., Tomatoes), customers compare neighboring farmers by distance, harvest timestamp, and organic certification.
* **Segmented 5-Stage Order Timeline**: `Confirmed` $\rightarrow$ `Harvesting & Packing` $\rightarrow$ `Courier Assigned` $\rightarrow$ `On The Road` $\rightarrow$ `Delivered`.

---

### 2. Farmer Mobile Portal (Business & Operations Radar)

Empowers rural producers with real-time sales intelligence, inventory health gauges, and packaging alerts.

```
┌──────────────────────────────────────┐
│  🚜 Farmer Center       🟢 Online    │
├──────────────────────────────────────┤
│  Namaste, Ramesh Patil!              │
│  🏡 Green Meadows Farm • Bengaluru   │
├──────────────────────────────────────┤
│  OPERATIONS RADAR                    │
│  ┌─────────────────┐┌────────────────┐│
│  │ TODAY'S REVENUE ││ PENDING PACK   ││
│  │ ₹4,850          ││ 3 Orders       ││
│  │ +24% vs y'day   ││ ⏳ 45m SLA     ││
│  └─────────────────┘└────────────────┘│
├──────────────────────────────────────┤
│  CROP INVENTORY HEALTH               │
│  ┌──────────────────────────────────┐ │
│  │ 🥦 Broccoli (Organic) • ₹90/kg   │ │
│  │ Stock: [████████████░░░] 42 kg   │ │
│  │ Harvest: Today 06:30 AM  • Active│ │
│  │ [ Edit Price ] [ Quick Restock ] │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ 🍅 Country Tomato • ₹35/kg       │ │
│  │ Stock: [███░░░░░░░░░░░░] 6 kg    │ │
│  │ ⚠️ LOW STOCK: Needs immediate field│ │
│  └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│  [🏠 Home] [📦 Stock] [📋 Orders] [💰]│
└──────────────────────────────────────┘
```

* **Operations Radar**: Instant notification when a customer places an order, triggering a 2-hour packing countdown SLA.
* **Visual Stock Meters (`ProgressBar`)**: Color-graded capacity bars (Emerald $\ge 50\%$, Amber $< 20\%$, Red = Depleted).
* **Direct Escrow Payouts**: Daily revenue settlement directly to the verified IFSC bank account.

---

### 3. Delivery Partner Mission HUD (GPS & Doorstep OTP)

A high-contrast, distraction-free **Mission Heads-Up Display** built for riders navigating in bright sunlight. When on a run, the mission *is* the entire screen.

```
┌──────────────────────────────────────┐
│  🛵 Delivery HUD       Duty: 🟢 ON   │
├──────────────────────────────────────┤
│  TODAY: ₹320 (8 Runs) • 4.95 ★       │
├──────────────────────────────────────┤
│  CURRENT MISSION: ORDER #1042        │
│  Reward: ₹40.00 • 25 km Geofenced    │
├──────────────────────────────────────┤
│  [ STEP 1: PICKUP ] ──► ( STEP 2: DROP )│
│                                      │
│  📍 FARM PICKUP: Green Meadows       │
│  Distance: 3.4 km • 12 mins          │
│  [ 📞 Call Farmer ] [ 🗺️ Maps Nav ]   │
│                                      │
│  ┌────────────────────────────────┐  │
│  │   [LEAFLET GPS ROUTE MAP]      │  │
│  │   Rider 🛵 ────────► Farm 🏡   │  │
│  └────────────────────────────────┘  │
│                                      │
│  CUSTOMER DOORSTEP VERIFICATION:     │
│  Ask customer for 6-digit OTP code   │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │ 4 │ │ 8 │ │ 2 │ │ 1 │ │ 9 │ │ 0 │ │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │
│  [    CONFIRM & COMPLETE TRIP   ]    │
├──────────────────────────────────────┤
│  [🛵 Runs] [📜 History] [💰 Wallet]  │
└──────────────────────────────────────┘
```

* **Color-Coded Mission Stages**: **Amber** for Farm Pickup $\rightarrow$ **Emerald** for Customer Dropstep.
* **Leaflet GPS Map**: Live location tracking with automatic marker interpolation and zero layout thrashing.
* **Cryptographic 6-Digit Doorstep Handshake**: Delivery is irrevocably confirmed only when the customer's private OTP is verified by the backend API.

---

### 4. Milo AI (Autonomous Agritech Assistant)

Available on every portal via the floating emerald badge, **Milo** is a fine-tuned RAG assistant trained on agricultural sciences, crop seasonal charts, and Auxin order logistics.

```
┌──────────────────────────────────────┐
│  🤖 Milo Agritech Assistant       ✕  │
├──────────────────────────────────────┤
│  [Milo]: Namaste! How can I assist   │
│  your harvest or order today? 🌱     │
│                                      │
│  [You]: How do I store Alphonso      │
│  mangoes to last 7 days?             │
│                                      │
│  [Milo]: Alphonso mangoes from our   │
│  Ratnagiri farmers are tree-ripened! │
│  1. Keep at room temp (20-25°C) until│
│     they release a strong aroma.     │
│  2. Never refrigerate before ripe.   │
│  3. Once ripe, chill at 10-12°C for  │
│     up to 5-7 days. 🥭               │
│                                      │
│  Quick Prompts:                      │
│  [ Track Order #1042 ] [ Crop Tips ] │
├──────────────────────────────────────┤
│  💬 Ask Milo about crops or orders...│
└──────────────────────────────────────┘
```

---

## ⚡ End-to-End System Architecture

```
                                  CUSTOMER BROWSER / MOBILE
                                              │
                                              ▼
                             ┌─────────────────────────────────┐
                             │    NEXT.JS 16 APPSHELL (SSR)    │
                             │  Tailwind 4 &bull; React Query v5    │
                             └────────────────┬────────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
            [ Supabase Auth ]          [ Core FastAPI ]        [ Leaflet Maps ]
            JWT Bearer & Roles         Uvicorn ASGI Engine     OpenStreetMap
                      │                       │
                      │                       ├───────────────────────┐
                      ▼                       ▼                       ▼
              [ SQLite / PG ]         [ Razorpay Escrow ]     [ Milo AI Agent ]
              Async SQLAlchemy        Webhook Settlement      FastAPI + Gemini RAG
```

---

## ⚙️ Core Engineering Highlights

### 1. 25 KM Haversine Geofencing Engine
To guarantee that produce is delivered fresh without cold-storage additives, Auxin enforces a strict **25-kilometer spherical distance boundary** calculated in PostgreSQL / SQLite:

$$\Delta\sigma = 2 \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$

$$d = R \cdot \Delta\sigma \quad (\text{where } R = 6371.0 \text{ km})$$

* Delivery couriers only see jobs located within 25 km of their active coordinates.
* Customers can only order from farms whose harvest coordinate falls within 25 km of the delivery pin code.

### 2. Two-Phase Atomic Escrow Commerce
1. **Phase 1 (Order Placement)**: Funds are debited from the customer's card/UPI and held in the Auxin Escrow Reserve account.
2. **Phase 2 (Doorstep Handshake)**: The courier enters the customer's OTP. In a single atomic database transaction, the delivery is marked `DELIVERED`, courier receives ₹40, and the farmer's wallet is credited.
3. **Dispute Safeguard**: If quality issues arise at the doorstep, the customer rejects the order, the OTP is not shared, and a full automated refund triggers via Razorpay API.

### 3. Doorstep Cryptographic OTP Verification
* Generated using a cryptographically secure pseudo-random number generator (CSPRNG).
* Stored as a salted hash in the database.
* Rate-limited to 3 failed attempts to eliminate brute-force risk.

### 4. Milo AI 7-Stage RAG Pipeline
* **Knowledge Store**: 120+ curated agricultural chunks covering pesticide-free shelf lives, organic certifications, and farm logistics.
* **Vector Indexing**: Fast hybrid retrieval using similarity scoring with fallback intent classification.
* **Zero Hallucination Shield**: Milo answers strictly from validated agricultural knowledge vectors or responds with support contact options.

---

## 🧪 Automated Verification & Test Suite

Auxin features a comprehensive automated testing suite ensuring zero regressions across all business logic, role-based access control, and mathematical boundaries:

```bash
$ pytest tests/ -v
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-8.2.0, pluggy-1.6.0
collected 73 items

tests/test_auth.py .................................... PASSED [  8%]
tests/test_catalogue_orders.py ......................... PASSED [  9%]
tests/test_commerce_engine.py .......................... PASSED [ 12%]
tests/test_delivery_location_and_matching.py ........... PASSED [ 21%]
tests/test_delivery_otp_eta_and_mission.py ............. PASSED [ 28%]
tests/test_functional_workflows.py ..................... PASSED [ 34%]
tests/test_milo.py ..................................... PASSED [ 36%]
tests/test_orders.py ................................... PASSED [ 47%]
tests/test_payment_unit.py ............................. PASSED [ 64%]
tests/test_security.py ................................. PASSED [ 78%]
tests/test_security_hardening.py ....................... PASSED [ 93%]
tests/test_super_admin.py .............................. PASSED [100%]

====================== 73 passed, 0 failures in 44.48s ======================
```

---

## 💻 Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Framework** | **Next.js 16** (App Router, Turbopack) | Server-side rendering, sub-second routing |
| **Styling & Design** | **Tailwind CSS v4** + Custom Tokens | Light Cream (`#FDFBF6`) & Forest Green (`#22C55E`) design system |
| **State & Cache** | **Zustand** + **TanStack Query v5** | Zero-flicker client state and optimistic cart mutations |
| **Backend API** | **FastAPI** + **Uvicorn** (Python 3.12) | Asynchronous REST and real-time WebSocket endpoints |
| **Database ORM** | **SQLAlchemy 2.0 (Async)** + **Alembic** | Type-safe migrations and connection pooling |
| **Authentication** | **Supabase Auth** (JWT + RBAC) | Role-based token authentication (Customer, Farmer, Courier, Admin) |
| **Payments & Escrow** | **Razorpay SDK** | Two-phase escrow hold and automated instant payouts |
| **Maps & Geo** | **Leaflet** + **OpenStreetMap** | Real-time GPS navigation without expensive Google Maps API bills |
| **AI Copilot** | **FastAPI** + **Gemini 2.5 Flash** | Agricultural RAG engine with domain knowledge embeddings |

---

## 🚀 Quickstart (Local Run)

### Prerequisites
* **Python 3.11 or 3.12**
* **Node.js 18+** & **npm**

### One-Click Launch (Windows)
```bat
git clone https://github.com/SumanthMamidi-MNS/Auxin.git
cd Auxin
start.bat
```

`start.bat` automatically:
1. Provisions virtual environments and installs Python dependencies.
2. Runs Alembic database migrations.
3. Seeds the master 120-item agricultural harvest catalog.
4. Boots Core API (Port `8000`), Milo AI (Port `8001`), and Customer Frontend (Port `3000`).

---

## 📂 Repository Layout

```
Auxin/
├── app/                        # Core FastAPI Backend
│   ├── api/v1/endpoints/       # Orders, Catalogue, Delivery, Farmer, Profile, Milo
│   ├── core/                   # Security, Geolocation, Haversine, Exceptions
│   ├── models/                 # SQLAlchemy Async ORM entities
│   ├── repositories/           # Data access layer
│   ├── schemas/                # Pydantic v2 validation contracts
│   └── services/               # Business logic & Escrow Commerce Engine
├── auxin-frontend/             # Main Consumer App (Customer, Farmer, Delivery)
│   ├── src/app/                # Next.js App Router (customer/*, farmer/*, delivery/*)
│   ├── src/components/         # 4:5 ProductCard, MissionStepper, OTPInput, Skeletons
│   └── src/store/              # Zustand cartStore & authStore
├── auxin-admin/                # Desktop Super-Admin Operations Portal
├── Milo_AI/                    # Autonomous Agritech Intelligence & RAG
│   ├── backend/                # RAG engine, memory, embeddings
│   └── knowledge/              # Validated agricultural domain vectors
├── docs/                       # Architecture specs, recovery, API references
├── scripts/                    # Migration, database seeding, preflight checks
├── tests/                      # 73-test automated regression suite
└── start.bat                   # Zero-config one-click local launcher
```

---

## 👤 Author & License

Designed, architected, and engineered with pride by:

<p align="center">
  <strong>Sumanth Mamidi</strong><br>
  <sub>AI Systems Engineer & Full-Stack Architect</sub><br>
  <a href="https://github.com/SumanthMamidi-MNS">GitHub: @SumanthMamidi-MNS</a> &bull; 
  <a href="mailto:mamidinagasaisumanth@gmail.com">mamidinagasaisumanth@gmail.com</a>
</p>

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete details.
