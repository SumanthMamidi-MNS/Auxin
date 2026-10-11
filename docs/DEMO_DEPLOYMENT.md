# Public portfolio demo — design, limits, and steps

Status: **prepared, not deployed.** Nothing here has been created, purchased or deployed; every
step in section 6 needs the owner's approval first.

## 1. Design in one picture

```
 recruiter's browser
        │
        ├─► Vercel (Hobby)  auxin-demo-app    ─┐
        └─► Vercel (Hobby)  auxin-demo-admin  ─┤  NEXT_PUBLIC_DEMO_MODE=true
                                               ▼
                         Render (free)  auxin-demo-api   APP_ENV=production, DEMO_MODE=true
                                               │                 │
                                               │                 └─► Render (free) auxin-demo-milo   (optional)
                                               ▼
                         Supabase project "auxin-demo"  (its own Auth + Postgres)
                                  ≠  Supabase project "Auxin"  (real data, untouched)
```

**Isolation rule:** the demo has its **own** Supabase project, API service and frontends. It shares no
database, key or user with the real project, so a visitor can never reach real users, bank details or
credentials, and admin actions in the demo can only touch sample data.

## 2. Verified platform limits (checked 2026-10-11)

| Platform | Free-tier facts that shape the demo | Source |
|---|---|---|
| **Render** web service | Spins down after 15 min without traffic; cold start about 1 min; 750 free instance hours per month; ephemeral filesystem (no persistent disk); outbound SMTP ports blocked. **Free Postgres expires after 30 days** — do not use it. | [render.com/docs/free](https://render.com/docs/free) |
| **Supabase** Free | 2 active projects; 500 MB database per project; 5 GB egress; 50,000 MAU; **projects pause after 1 week of inactivity**. | [supabase.com/pricing](https://supabase.com/pricing) |
| **Vercel** Hobby | **Non-commercial, personal use only**; any commercial use needs Pro. A portfolio demo qualifies; client work does not. 100 GB transfer / 1M invocations per month guideline. | [vercel.com/docs/limits/fair-use-guidelines](https://vercel.com/docs/limits/fair-use-guidelines) |
| **Hugging Face Spaces** (Milo alternative) | CPU Basic 2 vCPU / 16 GB free; sleeps after 48 h; ephemeral disk; docs conflict on whether free Docker Spaces are still available — verify before relying on it. | [huggingface.co/docs/hub/spaces-overview](https://huggingface.co/docs/hub/spaces-overview) |

Resulting cost: **$0/month** if the demo stays inside the limits above. The trade-off is latency: the
first visit after idle waits ~1 minute (the app already shows a cold-start loader) and the Supabase
project must be kept awake (section 5).

## 3. Demo accounts and data

| Account | How visitors enter | Capability |
|---|---|---|
| Demo Customer / Farmer / Courier | One-click buttons on the sign-in page (`NEXT_PUBLIC_DEMO_MODE=true`) | Full role flow on sample data |
| Demo Admin (regular admin, **not** super admin) | Credentials shown on the demo landing page | Admin portal over sample data only; cannot create or remove admins (super-admin only) |

- Sample data: catalogue (migration `009`), demo farmer inventory, demo orders — created by
  `alembic upgrade head`, `scripts/prod_seed.py --yes-wipe`, then the in-app **Reset demo** action.
- The shared demo password is public by nature; it is set from `DEMO_SEED_PASSWORD` /
  `NEXT_PUBLIC_DEMO_PASSWORD`, never committed, and only valid inside the demo project.
- **Reset:** admin → Demo workspace → Reset (server-side: admin role, password confirmation, `DEMO_MODE=true`).
  Refused on any non-demo production database.

### Visitor interference — honest limitation
All visitors share the same three demo identities, so two people walking the order flow at once will
see each other's orders and OTP. Mitigations in this design: periodic reset and a note on the sign-in
page. True per-visitor isolation (a throw-away account per session) is **not built**; it is the first
item to add if the demo gets heavy traffic (see `KNOWN_LIMITATIONS.md`).

## 4. Feature coverage in the hosted demo

| Capability | Hosted demo | Note |
|---|---|---|
| Browse produce, cart, order (COD) | ✅ | Online payments need Razorpay test keys (optional) |
| Farmer inventory, accept / pack / ready | ✅ | |
| Delivery job discovery, 25 km matching, guided delivery, OTP completion | ✅ | Partner location comes from the browser; allow location access |
| Order status updates; customer sees OTP in Orders | ✅ | |
| Milo AI | ⚠️ optional | Needs the `auxin-demo-milo` service; without it the chat shows "unavailable" gracefully |
| Admin demonstration | ✅ restricted | Regular admin on sample data |

## 5. Keeping it alive

- **Supabase pause (1 week idle):** schedule a weekly GitHub Actions request to the API `/health`
  (it runs `SELECT 1`, which counts as database activity). Free for a private repo within Actions minutes.
- **Render sleep (15 min):** accepted; the UI shows a loader. A paid instance or an external pinger
  would remove it — not recommended for a free demo.
- **If an always-on demo is not worth maintaining:** keep the stack **on demand** (deploy/resume when a
  recruiter asks) and rely on the **recorded walkthrough** in the public showcase repo.

## 6. Steps — each needs approval (none done)

| # | Step | Cost | Reversible |
|---|---|---|---|
| 1 | Create Supabase project `auxin-demo` (free) | $0 | Yes (delete project) |
| 2 | Back up nothing (new project); run `alembic upgrade head` against it, then `prod_seed.py --yes-wipe` | $0 | Yes |
| 3 | Create Render web service from `render.demo.yaml` (+ optional Milo) | $0 | Yes |
| 4 | Create two Vercel projects (`auxin-frontend`, `auxin-admin`) with demo env vars | $0 | Yes |
| 5 | Add weekly keep-alive workflow | $0 | Yes |
| 6 | Create public **showcase** repo from `docs/showcase/README.md` | $0 | Yes |

Required env values per service are listed in [ENVIRONMENT.md](ENVIRONMENT.md); the blueprint
`render.demo.yaml` has the demo-specific values.

## 7. Public showcase vs. private source

The source repository `auxin` stays **private**. The public face is a separate repository
(`auxin-showcase`, README + images only) containing: Live Demo link, description, screenshots,
architecture diagram, technology stack, and the "run it locally" summary. Template:
[`showcase/README.md`](showcase/README.md). Vercel serves compiled JavaScript only; Next.js does not
publish source maps in production builds by default, so the private source is not exposed.

Screenshots still to capture (needs a signed-in session, so the owner takes them once):
customer home, cart/checkout, farmer inventory, delivery mission with OTP, admin dashboard.
