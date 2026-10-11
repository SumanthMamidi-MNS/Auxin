---
title: "Customer Dispute Resolution and Refund Policies"
category: "customer"
role: "customer"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["dispute", "refund", "razorpay", "damaged", "cancellation", "escrow"]
---

# Customer Dispute Resolution and Refund Policies

## Purpose
Outlines the customer dispute process, eligible refund conditions, and payment reversal timelines.

## Content
If delivered produce is damaged, missing, or incorrect, customers can initiate a dispute.
- **Filing a Dispute**: Submit a dispute request via `POST /disputes` selecting the order ID and describing the issue.
- **Review Period**: Administrators review dispute evidence within 24 hours.
- **Approved Refunds**: If approved with `trigger_refund=true`, the backend triggers an automated Razorpay payment reversal.
- **Refund Timeline**: Funds return to the original payment source (UPI, Credit/Debit Card, Netbanking) within 3-5 business days.

## Examples
- **Dispute API**: `POST /disputes` with `{"order_id": "ORD-3798", "reason": "Damaged goods during transit"}`

## Notes & Warnings
> [!WARNING]
> Disputes must be filed within 12 hours of delivery handoff to be eligible for full refund verification.

## Summary
Customers can file dispute requests for damaged goods, receiving admin moderation and automated Razorpay refunds.
