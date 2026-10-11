---
title: "Administrative Portal User Approvals and Suspensions"
category: "admin"
role: "admin"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["admin", "approval", "suspension", "review", "pending", "governance"]
---

# Administrative Portal User Approvals and Suspensions

## Purpose
Guides administrators in reviewing, approving, or suspending marketplace user accounts.

## Content
Administrators oversee user access and review pending farmer and delivery applications.
- **Pending Review**: Admins open the Farmers or Delivery tab on Admin Portal (`http://localhost:3001`).
- **Approval Action**: Admin clicks Approve (`POST /admin/farmers/{id}/approve`), activating user status to `'approved'`.
- **Rejection & Suspension**: Rejections set status to `'rejected'`. Admins can suspend accounts for policy violations.

## Examples
- **Approve Farmer**: `POST /admin/farmers/FARM-102/approve`
- **Suspend User**: `POST /admin/users/USR-504/suspend`

## Notes & Warnings
> [!IMPORTANT]
> Admin actions are logged permanently in immutable audit trails.

## Summary
Admins review pending applicants on the Admin Portal, granting access approvals or issuing account suspensions.
