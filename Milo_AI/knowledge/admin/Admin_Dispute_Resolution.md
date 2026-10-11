---
title: "Admin Dispute Resolution and Manual Refund Controls"
category: "admin"
role: "admin"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["admin dispute", "resolution", "manual refund", "razorpay refund", "audit log"]
---

# Admin Dispute Resolution and Manual Refund Controls

## Purpose
Explains how admins moderate buyer-seller disputes and trigger manual refunds.

## Content
Admins resolve platform disputes submitted by customers or farmers.
- **Dispute Dashboard**: View open disputes under Admin Portal (`/disputes`).
- **Reviewing Evidence**: Inspect delivery notes, photos, and order timelines.
- **Resolving with Refund**: Admin clicks Resolve with `trigger_refund=true`. Backend invokes Razorpay Refund API.
- **Audit Logging**: Mandatory admin notes must be recorded for every dispute resolution.

## Examples
- **Resolve Dispute**: `POST /admin/disputes/DISP-89/resolve` with `{"trigger_refund": true, "notes": "Damaged goods confirmed"}`

## Notes & Warnings
> [!WARNING]
> Manual refund triggers directly reverse funds via Razorpay. Ensure evidence is verified.

## Summary
Admins moderate disputes, review evidence, and trigger automated Razorpay refunds with audit trail logging.
