---
title: "System Secret Keys and Environment Credentials Reference"
category: "admin"
role: "admin"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["credentials", "secret", "api key", "supabase key", "razorpay key", "jwt secret"]
---

# System Secret Keys and Environment Credentials Reference

## Purpose
Reference guide for platform secret keys, environment variables, and API credentials.

## Content
Secure management of system keys and environment variables across backend and frontends.
- **Supabase Keys**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Razorpay Keys**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
- **Database Connection**: `DATABASE_URL`, `DEMO_DATABASE_URL`.
- **JWT Config**: `JWT_SECRET_KEY`, `ALGORITHM=HS256`.

## Examples
- **Backend .env**: `RAZORPAY_KEY_ID=rzp_test_12345`

## Notes & Warnings
> [!CAUTION]
> Never commit real production API keys or `.env` files into source control repositories.

## Summary
Central reference for configuring Supabase, Razorpay, JWT, and PostgreSQL connection secrets.
