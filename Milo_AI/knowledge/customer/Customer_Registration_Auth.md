---
title: "Customer Registration and Authentication"
category: "customer"
role: "customer"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["login", "registration", "phone", "password", "supabase", "jwt", "synthetic email"]
---

# Customer Registration and Authentication

## Purpose
Explains how customers register, authenticate using phone number and password, and maintain active sessions.

## Content
Auxin implements phone-number-first authentication powered by Supabase Auth.
- **Login Credentials**: Customers log in using their primary mobile number and chosen password.
- **Synthetic Email Mapping**: Behind the scenes, the system maps phone numbers (e.g. `+919876543210`) to synthetic email addresses (`9876543210@auxin.app`) for Supabase compatibility.
- **JWT Token Session**: Successful logins return a JSON Web Token (JWT) authorizing API calls to backend endpoints.
- **Session Persistence**: Sessions persist securely across page refreshes via Supabase Client SDK and Zustand middleware.

## Examples
- **Login Payload**: `POST /auth/login` with `{"phone": "+919876543210", "password": "SecurePassword123"}`
- **Synthetic Email Format**: `9876543210@auxin.app`

## Notes & Warnings
> [!NOTE]
> Users do not need an actual email inbox. All OTPs and alerts are delivered to their mobile phone number.

## Summary
Customers authenticate via mobile phone numbers mapped to synthetic Supabase emails, receiving JWT tokens for persistent sessions.
