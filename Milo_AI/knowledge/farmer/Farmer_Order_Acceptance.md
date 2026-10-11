---
title: "Farmer Order Acceptance and Escrow Release Flow"
category: "farmer"
role: "farmer"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["order acceptance", "reject", "escrow", "farmer payout", "cancellation"]
---

# Farmer Order Acceptance and Escrow Release Flow

## Purpose
Explains how farmers receive, accept, or reject incoming orders and earn escrow payouts.

## Content
When a customer pays for an order, funds enter escrow and the farmer receives an order notification.
- **Order Notification**: Farmers receive alerts for incoming paid orders.
- **Acceptance Window**: Farmers have 30 minutes to accept (`status = 'accepted'`) or reject the order.
- **Rejections & Auto-Refund**: If a farmer rejects an order, escrow funds are instantly refunded to the customer.
- **Escrow Settlement**: Upon customer OTP verification at delivery, escrow funds are released to the farmer's balance.

## Examples
- **Accept Order API**: `POST /orders/ORD-5629/accept`

## Notes & Warnings
> [!NOTE]
> Fast order acceptance increases farmer search ranking on the Auxin marketplace.

## Summary
Farmers accept paid orders to initiate delivery, receiving escrow payout release upon delivery OTP verification.
