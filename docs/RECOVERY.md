# Recovery — restore Auxin from a clean clone

Goal: with only the private GitHub repository and your own accounts, get Auxin running again.

## 1. What the repository contains (and what it does not)

| In the repo | Not in the repo (regenerate / re-obtain) |
|---|---|
| All source for the 4 services + landing page | `venv/`, `Milo_AI/.venv/`, `node_modules/`, `.next/` — recreated by `start.bat` |
| `requirements.txt`, `Milo_AI/requirements*.txt`, `package-lock.json` | `.env`, `.env.development`, `.env.production`, `.env.local` — **secrets** |
| Alembic migrations `001`–`011` (catalogue seed is in `009`) | `auxin.db` (local SQLite; rebuilt by `scripts/local_bootstrap.py`) |
| `scripts/` (bootstrap, seed, preflight) | Real user data in Supabase |
| `.env.example` for every service | Hugging Face embedding model cache (optional, re-downloaded) |
| Milo knowledge base + training datasets (~60 MB) | |

## 2. External assets you must re-obtain

| Asset | Where | Used for | Required? |
|---|---|---|---|
| Supabase project (URL, anon key, JWT secret, service-role key, DB password) | supabase.com → your project → Settings → API / Database | Sign-in; hosted database | Required to sign in; not for tests |
| Razorpay test keys | dashboard.razorpay.com → Keys | Online payments | Optional (COD works) |
| `GEMINI_API_KEY` | aistudio.google.com | Milo generated answers | Optional |
| `BAAI/bge-small-en-v1.5` model | Hugging Face (auto-download) | Milo semantic retrieval | Optional (`requirements-ml.txt`) |

> **Rotate before reuse.** A Supabase service-role key was hard-coded in two Milo scripts in earlier
> versions and the demo accounts used a shared password that was visible in source. Treat both as
> compromised: rotate the service-role key and reset the demo passwords (see section 6).

## 3. Restore steps

Requires **Python 3.11 or 3.12** (the pinned dependencies have no wheels for 3.13+; `start.bat` selects 3.12
or 3.11 automatically when several are installed) and **Node.js 18+**.

```bat
git clone <private-repo-url> auxin
cd auxin
copy .env.example .env.development
```

1. Edit `.env.development`: set `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPER_ADMIN_EMAIL` (the one address allowed to self-register as admin). Leave
   `DATABASE_URL=sqlite+aiosqlite:///auxin.db` for local mode.
2. Run `start.bat` once. It creates `auxin-frontend\.env.local` and `auxin-admin\.env.local`
   from their templates and warns while they still contain placeholders.
3. Edit those two `.env.local` files: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Run `start.bat` again. Services come up on 8000 / 8001 / 3000 / 3001 and the browser opens.

## 4. Verification checklist

| Check | Command | Expect |
|---|---|---|
| Backend tests | `venv\Scripts\python.exe -m pytest tests -q` | all pass |
| One migration head | `venv\Scripts\python.exe -m alembic heads` | `011_enable_rls (head)` |
| API health | open `http://127.0.0.1:8000/health` | `status: ok`, `db: connected` |
| Milo health | open `http://127.0.0.1:8001/api/chat/health` | `healthy` |
| Web apps | `http://localhost:3000`, `http://localhost:3001` | sign-in page loads |
| Catalogue | SQLite `master_products` count | 120 |
| Builds | `npm run build` in `auxin-frontend` and `auxin-admin` | exit 0 |

## 5. Hosted database (Supabase)

Hosted databases are managed with Alembic, never `create_all`:

```bat
set APP_ENV=production
venv\Scripts\python.exe -m alembic upgrade head
```

Review `alembic/versions/010_*.py` (adds order statuses and columns) and `011_enable_rls.py`
(turns on RLS) before running them against real data. Back up first (Supabase → Database → Backups,
or `pg_dump`).

## 6. Resetting demo accounts

`scripts/prod_seed.py` recreates the demo users and **wipes the database it points at**. It refuses to
run without `--yes-wipe` and `DEMO_SEED_PASSWORD`, and refuses a production environment unless
`DEMO_MODE=true`. Use it only on a sandbox project.

## 7. Free-up laptop storage (after the recovery test passes)

Largest local items: `Milo_AI/.venv` (up to ~4 GB if the ML stack was installed), every `node_modules`,
`venv`. All are recreated by `start.bat`. Delete the original working folder only after sections 3–4
succeed on a **fresh clone**.
