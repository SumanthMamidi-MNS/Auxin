---
title: "Farmer Product Inventory and Unit Enum Validation"
category: "farmer"
role: "farmer"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["inventory", "unit", "kg", "enum", "validation", "harvest date", "stock"]
---

# Farmer Product Inventory and Unit Enum Validation

## Purpose
Details how farmers manage produce inventory, set pricing, and conform to standardized unit enums.

## Content
Farmers list fresh harvests using strict standardized units to maintain catalog consistency.
- **Standardized Unit Enums**: Only system-defined unit enums (e.g. `'kg'`, `'bunch'`, `'piece'`) are accepted. Free-text entries like `'Kilos'` or `'KG'` throw validation errors.
- **Harvest Date**: Farmers must update harvest dates to assure customers of freshness.
- **Stock Management**: Inventory counts auto-decrement when orders are accepted, preventing overbooking.

## Examples
- **Valid Unit Enum**: `{"unit": "kg", "price_per_unit": 40.0}`
- **Invalid Unit Enum**: `{"unit": "Kilos"}` -> Returns `422 Unprocessable Entity`

## Notes & Warnings
> [!WARNING]
> Always select units from the dropdown menu to avoid validation errors when creating new listings.

## Summary
Farmers list inventory using strict unit enums ('kg', 'piece') and keep stock and harvest dates updated.
