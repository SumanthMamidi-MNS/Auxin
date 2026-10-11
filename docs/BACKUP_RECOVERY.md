# Backup and Disaster Recovery Strategy — Auxin V3.0

This document outlines the backup, retention, recovery, and failover procedures for the Auxin production marketplace ecosystem.

---

## 1. Database Backups (PostgreSQL)

Auxin V3.0 runs on PostgreSQL (Supabase / RDS). 

### Automated Backups
1. **Daily Full Backup**: Automated physical backups executed daily at 02:00 UTC (during low traffic).
2. **Point-In-Time Recovery (PITR)**: Enable write-ahead log (WAL) archiving to an isolated S3 bucket to allow recovery to any second within the past 14 days.
3. **Retention Policy**:
   - Daily backups: Retained for 30 days.
   - Monthly backups: Retained for 365 days.

### Manual Backup Command
To execute a manual logical backup before running risky database migrations or schema updates:
```bash
pg_dump -h <host> -U <user> -d <database_name> -F c -b -v -f auxin_prod_backup_$(date +%F).dump
```

---

## 2. File Storage Backups

All user documents (farmer certifications, delivery partner licenses) and product images are stored in a Supabase Storage Bucket or S3 bucket.

1. **Bucket Versioning**: Enabled by default to protect against accidental overwrites or malicious deletions.
2. **Cross-Region Replication**: Replicate bucket contents in real time to a secondary target region.
3. **Backup Retention**: Same lifecycle policies as the primary database backup (version histories purged after 30 days).

---

## 3. Recovery Procedures

### Restoring a Dump File
In the event of database corruption:
1. Spin down all API application instances to freeze database writes.
2. Restore the database schema and data from the dump:
   ```bash
   pg_restore -h <host> -U <user> -d <database_name> -v --clean --no-owner --no-privileges auxin_prod_backup_XXXX.dump
   ```
3. Boot the application services and verify the health check endpoint `/health`.

---

## 4. Disaster Recovery Checklist

- [ ] Confirm secondary database replica status is active.
- [ ] Promote secondary database to primary.
- [ ] Update application deployment environment secrets with new DB connection strings.
- [ ] Run the `scripts/production_preflight.py` validation script.
- [ ] Redeploy API and frontend services.
- [ ] Perform smoke tests on `/health` and Supabase Auth.
