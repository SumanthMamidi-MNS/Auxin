---
title: "Courier Wallet Credits and Farmer Settlement Releases"
category: "payments"
role: "payments"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["wallet", "settlement", "payout", "courier fee", "farmer release", "escrow payout"]
---

# Courier Wallet Credits and Farmer Settlement Releases

## Purpose
Explains financial settlement distribution to farmers and delivery partners.

## Content
Upon successful delivery handoff, the escrow engine triggers automated financial settlements.
- **Farmer Settlement**: Escrow releases product sales funds directly to the farmer's linked account balance.
- **Courier Wallet Credit**: Fixed ₹75 delivery fee is credited to courier's active digital wallet balance.
- **Transaction Logs**: Audit logs record every escrow release transaction for accounting compliance.

## Examples
- **Wallet Balance API**: `GET /users/me/wallet` -> Returns `{"balance": 150.0, "currency": "INR"}`

## Notes & Warnings
> [!NOTE]
> Farmers and couriers can request instant wallet payouts to their linked bank accounts.

## Summary
Delivery completion automatically releases escrow payouts to farmers and credits courier wallet balances.
