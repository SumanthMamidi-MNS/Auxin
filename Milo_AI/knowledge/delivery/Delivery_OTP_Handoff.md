---
title: "Delivery Verification via Customer OTP Handoff"
category: "delivery"
role: "delivery"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["otp", "handoff", "verification", "delivered", "wallet credit", "escrow release"]
---

# Delivery Verification via Customer OTP Handoff

## Purpose
Explains the secure 6-digit OTP verification process during doorstep delivery handoff.

## Content
Delivery completion requires validation of a single-use 6-digit OTP generated for the customer.
- **Doorstep Handoff**: Upon arrival, the courier requests the customer's 6-digit OTP code.
- **OTP Verification**: Courier inputs OTP via app (`POST /delivery/verify-otp`).
- **Delivery Completion**: Correct OTP marks order as `delivered` and completes delivery record.
- **Driver Wallet Credit**: Verification immediately credits ₹75 delivery fee to courier's active wallet balance.

## Examples
- **OTP Verify Payload**: `POST /delivery/verify-otp` with `{"order_id": "ORD-3737", "otp": "965233"}`

## Notes & Warnings
> [!WARNING]
> Never hand over packages without verifying the customer's OTP code in the mobile application.

## Summary
Couriers verify customer OTP at doorstep handoff to complete delivery and claim immediate wallet fee credit.
