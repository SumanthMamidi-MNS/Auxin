@echo off
rem ============================================================================
rem  Auxin - one-click local launcher
rem  Starts: API (8000), customer/farmer/delivery app (3000), admin (3001).
rem  Optional: Milo AI (8001) only if Milo_AI\.venv already exists.
rem  Safe to re-run: services already listening are skipped.
rem ============================================================================
setlocal EnableExtensions
cd /d "%~dp0"
set "ROOT=%~dp0"
title Auxin launcher

echo.
echo  AUXIN - starting local stack
echo  ----------------------------------------

rem --- 1. Prerequisites (we never install system software) -------------------
set "PY="
where py >nul 2>&1 && set "PY=py -3"
if not defined PY ( where python >nul 2>&1 && set "PY=python" )
if not defined PY (
  echo  [X] Python 3.11+ not found. Install it from python.org, then re-run.
  goto :fail
)
%PY% -c "import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)" >nul 2>&1
if errorlevel 1 (
  echo  [X] Python 3.11 or newer is required.
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

rem --- 2. Backend: local virtualenv + dependencies ---------------------------
if not exist "venv\Scripts\python.exe" (
  echo  [..] Creating Python virtual environment
  %PY% -m venv venv
  if errorlevel 1 ( echo  [X] Could not create venv. & goto :fail )
)
powershell -NoProfile -Command "$s=Get-Item 'venv\.deps-ok' -ErrorAction SilentlyContinue; if($s -and $s.LastWriteTime -ge (Get-Item 'requirements.txt').LastWriteTime){exit 0}else{exit 1}"
if errorlevel 1 (
  echo  [..] Installing backend dependencies
  "venv\Scripts\python.exe" -m pip install --quiet --disable-pip-version-check -r requirements.txt
  if errorlevel 1 ( echo  [X] pip install failed. & goto :fail )
  echo ok> "venv\.deps-ok"
)
echo  [OK] Backend dependencies ready

rem --- 3. Config files --------------------------------------------------------
if not exist ".env.development" (
  if exist ".env.example" (
    copy /y ".env.example" ".env.development" >nul
    echo  [!] Created .env.development from .env.example - fill in real values, then re-run.
    goto :fail
  )
  echo  [X] .env.development missing and no .env.example to copy from.
  goto :fail
)
call :ensure_env "auxin-frontend"
call :ensure_env "auxin-admin"
if errorlevel 1 goto :fail

rem Warn (do not block) when Supabase values are still template placeholders.
findstr /i /c:"YOUR_PROJECT" "auxin-frontend\.env.local" >nul 2>&1
if not errorlevel 1 echo  [!] auxin-frontend\.env.local still has YOUR_PROJECT placeholders - login will fail.
findstr /i /c:"YOUR_PROJECT" "auxin-admin\.env.local" >nul 2>&1
if not errorlevel 1 echo  [!] auxin-admin\.env.local still has YOUR_PROJECT placeholders - login will fail.

rem --- 4. Frontend dependencies ----------------------------------------------
call :ensure_node_modules "auxin-frontend"
if errorlevel 1 goto :fail
call :ensure_node_modules "auxin-admin"
if errorlevel 1 goto :fail
echo  [OK] Frontend dependencies ready

rem Port 8000 must be free or already held by the Auxin API (never kill foreign processes).
netstat -ano | findstr /r /c:":8000 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
  curl.exe -s -m 5 http://127.0.0.1:8000/health 2>nul | findstr /c:"demo_mode" >nul
  if errorlevel 1 (
    echo  [X] Port 8000 is used by another program, not the Auxin API.
    echo      Stop that program or free the port, then re-run. Find it with: netstat -ano
    goto :fail
  )
)

rem --- 5. Launch services (each in its own window; close a window to stop it)
echo  [..] Starting services
call :launch 8000 "Auxin API" "%ROOT%" "set APP_ENV=development&& venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000"
call :launch 3000 "Auxin App" "%ROOT%auxin-frontend" "npm run dev -- --port 3000"
call :launch 3001 "Auxin Admin" "%ROOT%auxin-admin" "npm run dev -- --port 3001"
if exist "Milo_AI\.venv\Scripts\python.exe" (
  call :launch 8001 "Auxin Milo AI" "%ROOT%Milo_AI" ".venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8001"
)

rem --- 6. Wait for the app, then open the browser -----------------------------
echo  [..] Waiting for the app to come up (first start can take a minute)
call :wait_port 8000 60
if errorlevel 1 echo  [!] API did not open port 8000 in time - check the "Auxin API" window.
call :wait_port 3000 120
if errorlevel 1 (
  echo  [!] App did not open port 3000 in time - check the "Auxin App" window.
) else (
  start "" "http://localhost:3000"
)

echo.
echo  App    : http://localhost:3000   (customer / farmer / delivery)
echo  Admin  : http://localhost:3001
echo  API    : http://127.0.0.1:8000/health   (docs at /docs when DEBUG=true)
echo  Stop   : close the Auxin API / App / Admin windows.
echo.
pause
exit /b 0

:fail
echo.
echo  Startup stopped. Fix the item above and run start.bat again.
echo.
pause
exit /b 1

rem ---------------------------------------------------------------------------
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
set "RC=%errorlevel%"
popd
if not "%RC%"=="0" ( echo  [X] npm install failed in %~1 & exit /b 1 )
exit /b 0

:launch
rem %1 port, %2 window title, %3 start dir, %4 command
netstat -ano | findstr /r /c:":%~1 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo  [OK] %~2 already running on port %~1
  exit /b 0
)
start "%~2" /D "%~3" cmd /k "%~4"
exit /b 0

:wait_port
rem %1 port, %2 timeout seconds. exit 0 when something is listening.
powershell -NoProfile -Command "$e=(Get-Date).AddSeconds(%~2); while((Get-Date) -lt $e){ try{ $c=New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1',%~1); $c.Close(); exit 0 }catch{ Start-Sleep -Milliseconds 700 } }; exit 1"
exit /b %errorlevel%
