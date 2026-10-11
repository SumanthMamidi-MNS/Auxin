# Production Deployment Guide — Auxin

Auxin V3.0 is built to run inside containerized environments (Docker) or serverless platforms (Railway, Render, AWS ECS).

---

## 1. Environment Configurations

Make sure to configure these environment variables on your hosting provider dashboard:

```env
APP_ENV=production
DEBUG=false
ALLOWED_ORIGINS=https://auxin.farm,https://admin.auxin.farm

# Database
DATABASE_URL=postgresql+asyncpg://<username>:<password>@<db-host>:5432/<db-name>

# Supabase Auth
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_JWT_SECRET=<your-jwt-secret>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Razorpay
RAZORPAY_KEY_ID=<razorpay-key-id>
RAZORPAY_SECRET=<razorpay-secret>

# Security
SUPER_ADMIN_PASSWORD=<strong-super-admin-password>
BANK_ACCOUNT_ENCRYPTION_KEY=<32-byte-fernet-key>
```

---

## 2. Docker Deployment

To build and run the production image:
```bash
docker build -t auxin-backend:v3.0.0 .
docker run -d --name auxin-api -p 8000:8000 --env-file .env.production auxin-backend:v3.0.0
```

---

## 3. Database Migrations

Run database migrations on release:
```bash
venv/bin/alembic upgrade head
```
