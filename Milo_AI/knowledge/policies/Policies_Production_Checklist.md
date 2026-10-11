---
title: "Production Deployment Readiness and Operational Checklist"
category: "policies"
role: "policies"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["production", "deployment", "checklist", "ssl", "cors", "rate limiting"]
---

# Production Deployment Readiness and Operational Checklist

## Purpose
Pre-flight operational checklist required before deploying Auxin to production.

## Content
Mandatory security and performance verification prior to production launch.
- **SSL / HTTPS**: Enforce HTTPS on all API endpoints and frontend domains.
- **CORS Configuration**: Restrict `CORS_ORIGINS` in FastAPI to production domain URLs only.
- **Rate Limiting**: Enable API rate limiting to prevent brute-force attacks.
- **Database Indexing**: Verify foreign key indexes on `orders`, `users`, and `products` tables.

## Examples
- **CORS Config**: `CORS_ORIGINS=["https://auxin.app", "https://admin.auxin.app"]`

## Notes & Warnings
> [!IMPORTANT]
> Ensure DEMO_MODE=false before executing production deployment scripts.

## Summary
Pre-flight production checklist requiring SSL, restricted CORS origins, rate limiting, and DB index checks.
