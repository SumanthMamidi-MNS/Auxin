# Auxin v2.0 — Monitoring Strategy

Complete observability plan for the Auxin v2.0 production platform.

---

## Health Checks

### Backend Health Check — `GET /health`

The FastAPI backend exposes a production-grade health check at `/health`:

```json
{
  "status": "ok",
  "version": "2.0.0",
  "env": "production",
  "demo_mode": false,
  "db": "connected",
  "uptime_s": 3847.2
}
```

| Field | Description |
|-------|-------------|
| `status` | `"ok"` (200) or `"degraded"` (503 when DB unreachable) |
| `version` | Current API version |
| `env` | Deployment environment |
| `demo_mode` | Whether sandbox mode is active |
| `db` | Database connectivity status |
| `uptime_s` | Seconds since server process started |

**Implementation:** `main.py` — executes `SELECT 1` against the database on every call.

### Frontend Health Proxy — `GET /api/health`

The Next.js frontend proxies to the backend health check:

```json
{
  "frontend": "ok",
  "backend": { "status": "ok", "version": "2.0.0", ... },
  "timestamp": "2026-06-16T04:00:00.000Z"
}
```

If the backend is unreachable, it returns HTTP 503:
```json
{
  "frontend": "ok",
  "backend": "unreachable",
  "error": "fetch failed",
  "timestamp": "2026-06-16T04:00:00.000Z"
}
```

**Note:** The frontend is always `"ok"` if this endpoint responds — meaning Next.js itself is running. Only the backend field indicates backend health.

---

## Logging

### Backend Structured Logging

All backend logs are structured JSON via Python's `logging` module:

```python
# Example log entry
{
  "timestamp": "2026-06-16T04:00:00Z",
  "level": "INFO",
  "logger": "auxin.api",
  "event": "request_completed",
  "method": "GET",
  "path": "/api/v1/products",
  "status": 200,
  "duration_ms": 42,
  "request_id": "req_abc123"
}
```

**RequestLoggingMiddleware** logs every HTTP request:
- Method, path, status code, duration
- Request ID (passed via `X-Request-ID` header)
- Excludes health check noise (optional filtering)

**Log Levels:**
| Environment | Level | What's Logged |
|-------------|-------|---------------|
| Development | `DEBUG` | SQL queries + all requests |
| Production | `INFO` | Requests, errors, startup events |

**Special startup events:**
```
INFO  auxin.main: startup {"env": "production"}
INFO  auxin.db: db_connected
WARN  auxin.db: DEMO MODE ACTIVE — connected to sandbox database.
```

---

## Error Handling

### Frontend Error Boundaries

| Component | Path | Catches |
|-----------|------|---------|
| `error.tsx` | `src/app/error.tsx` | Errors in any page/layout below root |
| `global-error.tsx` | `src/app/global-error.tsx` | Errors in the root layout itself |
| `not-found.tsx` | `src/app/not-found.tsx` | 404 / missing routes |

**Network-aware messaging in `error.tsx`:**
- Detects fetch/network errors → shows "Connection issue" + backend wakeup message
- Other errors → shows "Something went wrong"
- Dev mode → shows raw error message for debugging

### Admin Error Boundaries

| Component | Path | Catches |
|-----------|------|---------|
| `error.tsx` | `src/app/error.tsx` | Admin page errors |
| `not-found.tsx` | `src/app/not-found.tsx` | Admin 404 routes |

### Backend Exception Handler

Centralized in `app/api/v1/router.py` — catches unhandled exceptions and returns structured JSON errors rather than 500 HTML responses.

---

## Cold Start Detection (Render Free Tier)

Render free tier sleeps after 15 minutes of inactivity. The first request wakes the backend (30-60 seconds).

**Client-side handling in `auxin-frontend/src/lib/api.ts`:**

```
Request → Backend (503 or ECONNABORTED)
         ↓
   setColdStart(true) in appStore
         ↓
   Wait 3 seconds
         ↓
   Auto-retry the original request
         ↓
   Request succeeds → setColdStart(false)
```

**UI response (`providers.tsx` + `ColdStartLoader.tsx`):**
- `isColdStart=true` → full-screen overlay renders
- Skeleton product cards + rotating messages + 45s progress bar
- Messages rotate every 2.8s: "Waking up the kitchen...", "Connecting to farmers...", etc.
- Disappears automatically once backend responds

**To eliminate cold starts:** Upgrade Render to Starter tier ($7/mo).

---

## Performance Monitoring

### React Query Cache Strategy

| Data Type | Stale Time | Refetch Interval |
|-----------|------------|-----------------|
| User profile | 5 min | On focus |
| Product listing | 1 min | None |
| Order list | 30s | None |
| Admin dashboard stats | 30s | 30s (auto) |
| Admin users list | 1 min | None |
| Admin deliveries | 30s | 30s (auto) |

### API Request Timeout

Frontend Axios: `timeout: 8000` (8 seconds) — includes cold start retry logic.

---

## Recommended Monitoring Tools

### 1. UptimeRobot (Uptime Monitoring)
**Cost:** Free tier available  
**Setup time:** 10 minutes

```
Monitor URL: https://api.auxin.in/health
Check interval: 5 minutes
Alert: Email/SMS when status != 200
```

Also monitor:
- `https://app.auxin.in` (frontend)
- `https://admin.auxin.in` (admin)

### 2. Sentry (Error Tracking)
**Cost:** Free tier available  
**Setup time:** 2 hours

**Frontend integration:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**Backend integration:**
```bash
pip install sentry-sdk[fastapi]
```

```python
import sentry_sdk
sentry_sdk.init(dsn="https://...", traces_sample_rate=0.1)
```

### 3. Vercel Analytics (Frontend Performance)
**Cost:** Included in Vercel Pro  
**Setup time:** 5 minutes

Enable in: Vercel Dashboard → Project → Analytics

Provides:
- Core Web Vitals (LCP, CLS, FID)
- Real User Monitoring
- Traffic by page

### 4. Render Metrics (Backend Performance)
**Cost:** Included in all Render tiers  
**Access:** Render Dashboard → Service → Metrics

Shows:
- CPU usage
- Memory usage
- Request count
- Response times

---

## Alert Thresholds (Recommended)

| Metric | Warning | Critical |
|--------|---------|---------|
| Backend response time | > 2s | > 8s |
| Error rate (5xx) | > 1% | > 5% |
| Database query time | > 500ms | > 2s |
| Memory usage | > 400MB | > 480MB |
| Uptime | < 99.9% | < 99% |

---

## Log Retention

| Service | Retention | Location |
|---------|-----------|---------|
| Render backend logs | 7 days (free), 30 days (paid) | Render Dashboard → Logs |
| Vercel build/runtime logs | 7 days | Vercel Dashboard → Logs |
| Neon query logs | Optional (enable in Neon settings) | Neon Dashboard |

---

## Incident Response

### When `/health` returns 503

1. Check Render logs for DB connection errors
2. Check Neon dashboard for database status
3. If DB is down: check Neon status page at status.neon.tech
4. If DB is up: restart the Render service

### When frontend is blank/crashes

1. Check Vercel deployment logs
2. Check browser console for error messages
3. Check if `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### When auth fails for all users

1. Verify `SUPABASE_JWT_SECRET` in Render env matches Supabase project
2. Check Supabase service status at status.supabase.com
3. Check backend logs for `auth` related errors
