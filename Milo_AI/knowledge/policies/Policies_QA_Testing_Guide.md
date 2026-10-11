---
title: "Platform QA Testing Guide and Test Suite Execution"
category: "policies"
role: "policies"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["testing", "pytest", "qa", "test suite", "regression", "coverage"]
---

# Platform QA Testing Guide and Test Suite Execution

## Purpose
Outlines quality assurance testing protocols, Pytest execution, and API regression checks.

## Content
Auxin maintains high code quality through automated unit and integration testing.
- **Running Pytest**: Execute `pytest` in the project root to run backend test suites.
- **Test Scenarios**: Covers auth sync, cart calculations, order state transitions, and dispute resolutions.
- **Regression Verification**: Ensure all API routes pass before pushing changes to production.

## Examples
- **Run All Tests**: `pytest -v`
- **Run Specific File**: `pytest tests/test_orders.py`

## Notes & Warnings
> [!NOTE]
> Test configuration is maintained in `pytest.ini` in the project root.

## Summary
QA protocols rely on Pytest suites covering auth, cart, orders, and dispute API route regressions.
