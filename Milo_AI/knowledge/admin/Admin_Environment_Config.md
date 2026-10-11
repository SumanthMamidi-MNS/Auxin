---
title: "Admin Environment Configuration and Sandbox Demo Mode"
category: "admin"
role: "admin"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["demo mode", "sandbox", "environment", "database url", "amber banner", "config"]
---

# Admin Environment Configuration and Sandbox Demo Mode

## Purpose
Details sandbox demo mode configuration, environment flags, and database isolation.

## Content
Auxin features a sandbox demo mode for investor demonstrations and testing.
- **Amber Warning Banner**: Displays `⚠ DEMO MODE — All actions affect sandbox data only.` in Admin Portal.
- **Database Isolation**: Setting `DEMO_MODE=true` routes queries to `DEMO_DATABASE_URL`, isolating production data.
- **Activation Flags**: Backend `.env` `DEMO_MODE=true` and Admin frontend `NEXT_PUBLIC_DEMO_MODE=true`.

## Examples
- **Backend Env**: `DEMO_MODE=true`
- **Demo Database**: `DEMO_DATABASE_URL=postgresql://user:pass@localhost:5432/auxin_sandbox`

## Notes & Warnings
> [!NOTE]
> Production data is completely isolated when DEMO_MODE is active.

## Summary
Demo mode isolates test transactions into a sandbox database with prominent UI amber banners.
