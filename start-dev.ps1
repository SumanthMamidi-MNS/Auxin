# ─────────────────────────────────────────────────────────────────────────────
# start-dev.ps1 — Auxin Development Startup Script
# ─────────────────────────────────────────────────────────────────────────────
# Usage: .\start-dev.ps1                (backend only)
#        .\start-dev.ps1 -all           (backend + both frontends)
#        .\start-dev.ps1 -frontend      (frontend only)
#        .\start-dev.ps1 -admin         (admin portal only)
# ─────────────────────────────────────────────────────────────────────────────

param(
    [switch]$all,
    [switch]$frontend,
    [switch]$admin
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         Auxin v2.0 Dev Server            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Validate prerequisites
if (-not (Test-Path "venv\Scripts\uvicorn.exe")) {
    Write-Host "ERROR: Virtual environment not found." -ForegroundColor Red
    Write-Host "Run: python -m venv venv && .\venv\Scripts\pip install -r requirements.txt"
    exit 1
}

if (-not (Test-Path ".env.development")) {
    Write-Host "ERROR: .env.development not found." -ForegroundColor Red
    Write-Host "Copy .env.example to .env.development and fill in real values."
    exit 1
}

# Set environment
$env:APP_ENV = "development"
Write-Host "APP_ENV=development" -ForegroundColor Green

# Check Supabase credentials
$env_content = Get-Content ".env.development" -Raw
if ($env_content -match "SUPABASE_JWT_SECRET=REPLACE" -or -not ($env_content -match "SUPABASE_JWT_SECRET=\S")) {
    Write-Host "WARNING: SUPABASE_JWT_SECRET is not set in .env.development" -ForegroundColor Yellow
    Write-Host "         JWT validation will fail until this is set."
}

# Start backend
if (-not $frontend -and -not $admin) {
    Write-Host ""
    Write-Host "Starting backend on http://localhost:8000 ..." -ForegroundColor Green
    Write-Host "  Swagger: http://localhost:8000/docs" -ForegroundColor DarkCyan
    Write-Host "  Health:  http://localhost:8000/health" -ForegroundColor DarkCyan
    Write-Host ""

    if ($all) {
        # Start backend in background
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:APP_ENV='development'; .\venv\Scripts\uvicorn.exe main:app --reload --host 0.0.0.0 --port 8000" -WindowStyle Normal
    } else {
        # Run backend in foreground
        & .\venv\Scripts\uvicorn.exe main:app --reload --host 0.0.0.0 --port 8000
        exit 0
    }
}

# Start frontend (if requested)
if ($all -or $frontend) {
    if (-not (Test-Path "auxin-frontend\node_modules")) {
        Write-Host "Installing auxin-frontend dependencies..." -ForegroundColor Yellow
        Push-Location auxin-frontend; npm install; Pop-Location
    }
    Write-Host "Starting auxin-frontend on http://localhost:3000 ..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd auxin-frontend; npm run dev" -WindowStyle Normal
}

# Start admin (if requested)
if ($all -or $admin) {
    if (-not (Test-Path "auxin-admin\node_modules")) {
        Write-Host "Installing auxin-admin dependencies..." -ForegroundColor Yellow
        Push-Location auxin-admin; npm install; Pop-Location
    }
    Write-Host "Starting auxin-admin on http://localhost:3001 ..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd auxin-admin; npm run dev -- --port 3001" -WindowStyle Normal
}

Write-Host ""
Write-Host "All services started. Press Ctrl+C in each window to stop." -ForegroundColor Cyan
