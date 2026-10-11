---
title: "Farmer Registration and Administrative Approval Workflow"
category: "farmer"
role: "farmer"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["farmer", "approval", "registration", "pending", "403 forbidden", "onboarding"]
---

# Farmer Registration and Administrative Approval Workflow

## Purpose
Explains farmer account onboarding and the mandatory administrative verification process.

## Content
Farmer accounts require administrative approval before they can list produce or accept orders.
- **Initial Status**: New farmer registrations are assigned `status = 'pending'`.
- **Access Restrictions**: Pending farmers attempting to log in or create listings receive a 403 Forbidden pending screen.
- **Admin Review**: Admins review farm details, location geofences, and documentation in the Admin Portal.
- **Activation**: Upon admin approval, `status` changes to `'approved'`, granting full dashboard access.

## Examples
- **Pending Check**: `GET /farmers/me` returns `{"status": "pending", "can_transact": false}`

## Notes & Warnings
> [!IMPORTANT]
> Approval usually takes less than 24 hours after farm location verification.

## Summary
Farmers register in pending state and gain listing permissions only after explicit administrative review and approval.
