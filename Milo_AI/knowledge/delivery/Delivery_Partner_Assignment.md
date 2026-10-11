---
title: "Delivery Courier Registration and Order Assignment"
category: "delivery"
role: "delivery"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["delivery", "courier", "assignment", "availability", "online toggle", "geofence"]
---

# Delivery Courier Registration and Order Assignment

## Purpose
Details delivery courier onboarding, online availability toggles, and order dispatch assignment.

## Content
Delivery partners manage last-mile logistics from local farms to customer addresses.
- **Courier Onboarding**: Delivery partners register and require admin approval (`status = 'approved'`).
- **Availability Toggle**: Couriers toggle `is_available = true` on their mobile app when ready for duty.
- **Order Assignment**: The system matches online couriers to accepted orders based on proximity geofences.

## Examples
- **Availability API**: `POST /delivery/availability` with `{"is_available": true}`

## Notes & Warnings
> [!NOTE]
> Couriers must keep location services active to receive nearby order dispatch requests.

## Summary
Approved delivery couriers toggle online availability to automatically receive proximity-based order assignments.
