---
title: "Escrow Payment Architecture and Razorpay Integration"
category: "payments"
role: "payments"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["payments", "escrow", "razorpay", "paid", "verification", "transaction"]
---

# Escrow Payment Architecture and Razorpay Integration

## Purpose
Details the technical escrow model and Razorpay checkout lifecycle.

## Content
Auxin uses a secure escrow payment architecture to protect buyers and sellers.
- **Payment Creation**: Client calls `POST /payments/create` to generate a Razorpay order ID.
- **Razorpay Modal**: Customer completes payment via UPI, card, or netbanking on Razorpay modal.
- **Signature Verification**: Client sends payment signature to `POST /payments/verify`.
- **Escrow Hold**: Verified payments enter `paid` state and funds are held in escrow until delivery completion.

## Examples
- **Payment Verification API**: `POST /payments/verify` with `{"razorpay_order_id": "order_123", "razorpay_payment_id": "pay_456", "signature": "sig_789"}`

## Notes & Warnings
> [!IMPORTANT]
> Funds remain safely held in escrow and are only released to farmers upon verified delivery.

## Summary
Auxin processes payments via Razorpay into secure escrow, verifying signatures prior to order release.
