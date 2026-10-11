---
title: "Delivery Logistics Progression and GPS Location Updates"
category: "delivery"
role: "delivery"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["logistics", "picked_up", "out_for_delivery", "gps", "route", "tracking"]
---

# Delivery Logistics Progression and GPS Location Updates

## Purpose
Outlines delivery status progression from farm pickup to customer doorstep navigation.

## Content
Couriers update order status at key milestones to provide real-time tracking to customers.
- **Pickup Phase**: Courier arrives at farm and marks status `picked_up`.
- **Transit Phase**: Courier begins transit and updates status to `out_for_delivery`.
- **GPS Updates**: Courier app broadcasts real-time GPS coordinates to backend location endpoints.
- **Customer Alerts**: Customers receive instant push alerts as the courier approaches their delivery geofence.

## Examples
- **Update Status**: `PATCH /delivery/DEL-1765` with `{"status": "picked_up"}`
- **GPS Broadcast**: `POST /delivery/location` with `{"lat": 12.9716, "lng": 77.5946}`

## Notes & Warnings
> [!IMPORTANT]
> Status updates must be triggered sequentially: `assigned` ➡️ `picked_up` ➡️ `out_for_delivery` ➡️ `delivered`.

## Summary
Couriers progress delivery statuses from pickup to transit, streaming GPS updates for customer tracking.
