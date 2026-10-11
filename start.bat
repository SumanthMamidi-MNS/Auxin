@echo off
rem ============================================================================
rem  Auxin - one-click local launcher
rem
rem  Starts all four services and opens the app:
rem    Auxin Core API     http://127.0.0.1:8000   (FastAPI, SQLite by default)
rem    Milo AI engine     http://127.0.0.1:8001   (FastAPI RAG assistant)
rem    Main app           http://localhost:3000   (customer / farmer / delivery)
rem    Super admin portal http://localhost:3001
rem
rem  First run installs project-level dependencies into local folders only
rem  (venv, Milo_AI\.venv, node_modules). System software is never installed.
rem  Safe to re-run. Press Ctrl+C in this window to stop everything.
rem ============================================================================
setlocal EnableExtensions
set "PYTHONUTF8=1"
cd /d "%~dp0"
title Auxin launcher

echo.
echo  AUXIN - local stack
echo  ----------------------------------------

rem --- 1. Prerequisites -------------------------------------------------------
rem Pinned dependencies (pydantic 2.7, asyncpg 0.29) ship wheels for Python 3.11/3.12 only.
rem `py -3` would pick the newest installed Python (e.g. 3.14) and fail to build them.
set "PY="
py -3.12 -c "import sys" >nul 2>&1 && set "PY=py -3.12"
if not defined PY ( py -3.11 -c "import sys" >nul 2>&1 && set "PY=py -3.11" )
if not defined PY (
  python -c "import sys; sys.exit(0 if (3,11) <= sys.version_info[:2] <= (3,12) else 1)" >nul 2>&1 && set "PY=python"
)
if not defined PY (
  echo  [X] Python 3.11 or 3.12 is required ^(3.13+ is not supported by the pinned dependencies^).
  echo      Install Python 3.12 from python.org alongside your current one, then re-run.
  goto :fail
)
where node >nul 2>&1
if errorlevel 1 (
  echo  [X] Node.js 18+ not found. Install it from nodejs.org, then re-run.
  goto :fail
)
where npm >nul 2>&1
if errorlevel 1 (
  echo  [X] npm not found. Reinstall Node.js, then re-run.
  goto :fail
)
echo  [OK] Python and Node found

rem --- 2. Core API environment -----------------------------------------------
if exist "venv\Scripts\python.exe" (
  "venv\Scripts\python.exe" -c "import sys; sys.exit(0 if (3,11) <= sys.version_info[:2] <= (3,12) else 1)" >nul 2>&1
  if errorlevel 1 (
    echo  [X] venv was created with an unsupported Python. Delete the venv folder and re-run.
    goto :fail
  )
)
if not exist "venv\Scripts\python.exe" (
  echo  [..] Creating Python virtual environment
  %PY% -m venv venv
  if errorlevel 1 ( echo  [X] Could not create venv. & goto :fail )
)
call :needs_install "venv\.deps-ok" "requirements.txt"
if errorlevel 1 (
  echo  [..] Installing core API dependencies
  "venv\Scripts\python.exe" -m pip install --quiet --disable-pip-version-check --default-timeout=120 --retries 5 -r requirements.txt
  if errorlevel 1 ( echo  [X] pip install failed. & goto :fail )
  echo ok> "venv\.deps-ok"
)
echo  [OK] Core API dependencies ready

rem --- 3. Milo AI environment (lightweight core; ML extras are optional) -----
if not exist "Milo_AI\.venv\Scripts\python.exe" (
  echo  [..] Creating Milo AI virtual environment
  %PY% -m venv "Milo_AI\.venv"
  if errorlevel 1 ( echo  [X] Could not create Milo venv. & goto :fail )
)
call :needs_install "Milo_AI\.venv\.deps-ok" "Milo_AI\requirements.txt"
if errorlevel 1 (
  echo  [..] Installing Milo AI dependencies
  "Milo_AI\.venv\Scripts\python.exe" -m pip install --quiet --disable-pip-version-check --default-timeout=120 --retries 5 -r "Milo_AI\requirements.txt"
  if errorlevel 1 ( echo  [X] Milo pip install failed. & goto :fail )
  echo ok> "Milo_AI\.venv\.deps-ok"
)
echo  [OK] Milo AI dependencies ready

rem --- 4. Config files --------------------------------------------------------
if not exist ".env.development" (
  copy /y ".env.example" ".env.development" >nul
  echo  [!] Created .env.development from .env.example ^(SQLite, local^).
  echo      Add your Supabase keys there to enable sign-in, then re-run.
)
call :ensure_env "auxin-frontend"
if errorlevel 1 goto :fail
call :ensure_env "auxin-admin"
if errorlevel 1 goto :fail

findstr /i /c:"YOUR_PROJECT" "auxin-frontend\.env.local" >nul 2>&1
if not errorlevel 1 echo  [!] auxin-frontend\.env.local still has placeholders - sign-in needs real Supabase values.
findstr /i /c:"YOUR_PROJECT" "auxin-admin\.env.local" >nul 2>&1
if not errorlevel 1 echo  [!] auxin-admin\.env.local still has placeholders - sign-in needs real Supabase values.

rem --- 5. Frontend dependencies ----------------------------------------------
call :ensure_node_modules "auxin-frontend"
if errorlevel 1 goto :fail
call :ensure_node_modules "auxin-admin"
if errorlevel 1 goto :fail
echo  [OK] Frontend dependencies ready

rem --- 5b. Local database: tables + master catalogue (SQLite only, idempotent)
"venv\Scripts\python.exe" scripts\local_bootstrap.py
if errorlevel 1 (
  echo  [X] Local database bootstrap failed.
  goto :fail
)

rem --- 6. Hand over to the orchestrator (health checks, logs, browser, Ctrl+C)
echo  [..] Starting services - first start of the web apps can take a minute
echo.
"venv\Scripts\python.exe" run_auxin.py
set "RC=%errorlevel%"
echo.
echo  Auxin stopped.
pause
exit /b %RC%

:fail
echo.
echo  Startup stopped. Fix the item above and run start.bat again.
echo.
pause
exit /b 1

rem ---------------------------------------------------------------------------
:needs_install
rem %~1 = stamp file, %~2 = manifest. exit 0 when stamp is newer than manifest.
powershell -NoProfile -Command "$s=Get-Item '%~1' -ErrorAction SilentlyContinue; if($s -and $s.LastWriteTime -ge (Get-Item '%~2').LastWriteTime){exit 0}else{exit 1}"
exit /b %errorlevel%

:ensure_env
rem %~1 = frontend folder. Copies .env.example to .env.local when missing.
if exist "%~1\.env.local" exit /b 0
if exist "%~1\.env.example" (
  copy /y "%~1\.env.example" "%~1\.env.local" >nul
  echo  [!] Created %~1\.env.local from template - add your Supabase URL and anon key.
  exit /b 0
)
echo  [X] %~1\.env.local missing and no .env.example found.
exit /b 1

:ensure_node_modules
if exist "%~1\node_modules" exit /b 0
echo  [..] npm install in %~1
pushd "%~1"
call npm install --no-audit --no-fund --loglevel=error
set "NRC=%errorlevel%"
popd
if not "%NRC%"=="0" ( echo  [X] npm install failed in %~1 & exit /b 1 )
exit /b 0
