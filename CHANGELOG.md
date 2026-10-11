# Changelog — Auxin

All notable changes to the Auxin project will be documented in this file.

---

## [3.0.0] — 2026-07-12
### Added
- **Farmer Experience (V3.13)**: Farmer dashboard, packing queue, order preparation, stock and price managers, earning analytics.
- **Delivery Experience (V3.14)**: Rider logistics dashboard, trip assignments, and OTP delivery handshake verification.
- **Super Admin Control Center (V3.15)**: Master catalogue category manager, user/farmer/courier verification flows, transaction audits, and telemetry charts.
- **Demo Sandbox isolation (V3.16)**: Database isolation (`is_demo` flag) preventing sandbox operations from polluting production tables.
- **Milo AI Integration Framework (V3.20)**: Reusable, accessible floating assistant, right-drawer panel, rotating tips carousel, configuration schemas, and status endpoints.

### Changed
- **Visual Polish (V3.17)**: Color tokens unified for AAA accessibility contrast, form inputs glow rings, bottom-navigation backgrounds, and centralized toast notification themes.
- **Production Hardening (V3.21)**: Standardized logging middleware with request correlation IDs, non-wildcard production CORS config, connection pool optimizations, and backup strategies.

---

## [2.0.0] — 2026-06-15
### Added
- Multi-portal core layout (Customer and Admin web portals).
- Supabase Authentication integration (Phone & Password auth with session state).
- Razorpay test payment integrations.

---

## [1.0.0] — 2026-04-10
### Added
- Initial FastAPI backend services.
- Database schemas for users, addresses, products, orders, and payments.
- Simple customer homepage mockup.
