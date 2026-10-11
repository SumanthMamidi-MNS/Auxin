---
title: "Auxin System Architecture and Service Topologies"
category: "admin"
role: "admin"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["architecture", "fastapi", "nextjs", "postgresql", "supabase", "alembic", "swagger"]
---

# Auxin System Architecture and Service Topologies

## Purpose
Provides an architectural overview of Auxin's backend, frontends, and database services.

## Content
Auxin v2.0 is built on a modern decoupled microservices-capable architecture.
- **FastAPI Backend**: Runs on Python (`http://localhost:8000`), presenting REST endpoints and Swagger docs (`/docs`).
- **Next.js Frontends**: Main App (`http://localhost:3000`) for Customer/Farmer/Delivery; Admin Portal (`http://localhost:3001`).
- **PostgreSQL & Alembic**: Relational database schema managed via Alembic migrations (`alembic upgrade head`).
- **Supabase Auth**: External identity provider for phone-number authentication.

## Examples
- **Start Backend**: `python main.py`
- **Run Migrations**: `alembic upgrade head`

## Notes & Warnings
> [!NOTE]
> Interactive Swagger API docs are available at http://localhost:8000/docs when DEBUG mode is enabled.

## Summary
Auxin combines a FastAPI backend, dual Next.js frontends, PostgreSQL schema, and Supabase authentication.
