---
title: "Customer Marketplace Browsing and Order Placement"
category: "customer"
role: "customer"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["marketplace", "browse", "cart", "checkout", "produce", "fresh", "order"]
---

# Customer Marketplace Browsing and Order Placement

## Purpose
Guides customers through searching produce, managing shopping carts, and placing marketplace orders.

## Content
Customers can browse fresh farm produce directly listed by verified local farmers.
- **Marketplace Browsing**: Filter items by category (Vegetables, Fruits, Herbs), harvest date, and farmer proximity.
- **Cart Management**: Add items to cart. The cart validates minimum order quantities and active stock levels.
- **Checkout Process**: Initiating checkout locks items and prepares payment processing via Razorpay.
- **Order History**: Track active and past orders, view real-time delivery status, and access digital receipts.

## Examples
- **Browse Items**: `GET /products?category=Vegetables&available=true`
- **Add to Cart**: Add 2 kg Tomatoes from Farmer Ramesh

## Notes & Warnings
> [!IMPORTANT]
> Items are reserved in cart during checkout for up to 15 minutes to prevent overselling.

## Summary
Customers browse fresh produce, manage items in cart, and place orders with real-time tracking from farm to doorstep.
