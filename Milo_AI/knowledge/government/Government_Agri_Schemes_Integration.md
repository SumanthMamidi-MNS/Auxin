---
title: "Government Agricultural Schemes and APMC Compliance"
category: "government"
role: "government"
version: "2.0"
source: "Auxin Platform Knowledge Base"
last_updated: "2026-08-02"
keywords: ["government", "pm-kisan", "e-nam", "apmc", "organic", "schemes", "compliance"]
---

# Government Agricultural Schemes and APMC Compliance

## Purpose
Details alignment with government agricultural welfare schemes and APMC market compliance.

## Content
Auxin aligns with Indian national agricultural initiatives to support local farmers.
- **PM-KISAN Alignment**: Enables verified smallholder farmers to link direct benefit transfer accounts.
- **e-NAM Integration**: Standardizes produce grading and pricing in compliance with National Agriculture Market rules.
- **APMC Market Compliance**: Operates under direct-from-farm marketplace exemption frameworks.
- **Organic Produce Certification**: Farmers can upload NPOP (National Programme for Organic Production) certificates for verified organic badges.

## Examples
- **Organic Badge Check**: `GET /farmers/FARM-102/certification` -> Returns `{"is_organic_certified": true}`

## Notes & Warnings
> [!NOTE]
> Farmers with verified organic certificates receive an 'Organic Certified' badge on marketplace listings.

## Summary
Auxin integrates with PM-KISAN, e-NAM grading, APMC direct sale compliance, and organic certifications.
