# ─────────────────────────────────────────────────────────────────────────────
# Procfile — used by Railway, Heroku, and Render (fallback)
# ─────────────────────────────────────────────────────────────────────────────
# Railway auto-detects this file.
# Gunicorn starts with 2 UvicornWorkers (async FastAPI workers).
# Bind to $PORT which Railway/Render inject automatically.
# ─────────────────────────────────────────────────────────────────────────────

web: gunicorn main:app --worker-class uvicorn.workers.UvicornWorker --workers 2 --bind 0.0.0.0:$PORT --timeout 120
