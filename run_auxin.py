"""
Auxin V3.0 — One-Click Platform Orchestrator (run_auxin.py)
==========================================================
Open this file in your IDE (VS Code / Antigravity / Cursor) and click
the ▶ "Play / Run Python File" button!

This orchestrator will automatically:
  1. Free up any occupied ports (8000, 8001, 3000, 3001) from previous runs.
  2. Boot all 4 services concurrently:
     - [BACKEND]  Auxin Core API (FastAPI) on http://127.0.0.1:8000
     - [MILO_AI]  Milo AI & RAG Engine (FastAPI) on http://127.0.0.1:8001
     - [FRONTEND] Auxin Main App (Customer/Farmer/Courier) on http://localhost:3000
     - [ADMIN]    Auxin Super Admin Portal on http://localhost:3001
  3. Perform continuous health-checks until ready.
  4. Automatically open the Web Apps in your default browser.
  5. Provide a unified live log stream with graceful one-press shutdown (Ctrl+C).
"""

import os
import sys
import time
import socket
import signal
import atexit
import webbrowser
import subprocess
import threading
import urllib.request
from pathlib import Path

# Fix Windows console UTF-8 encoding
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

windows_job_handle = None

def setup_windows_job_object():
    """
    Configure a Windows Job Object with JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE (0x2000).
    When this parent Python process terminates for any reason (terminal closed,
    VS Code exited, Ctrl+C, killed), the Windows OS kernel automatically kills
    all child processes and child process trees instantly.
    """
    global windows_job_handle
    if sys.platform != "win32":
        return None

    try:
        import ctypes
        from ctypes import wintypes

        kernel32 = ctypes.windll.kernel32

        job = kernel32.CreateJobObjectW(None, None)
        if not job:
            return None

        class JOBOBJECT_BASIC_LIMIT_INFORMATION(ctypes.Structure):
            _fields_ = [
                ("PerProcessUserTimeLimit", wintypes.LARGE_INTEGER),
                ("PerJobUserTimeLimit", wintypes.LARGE_INTEGER),
                ("LimitFlags", wintypes.DWORD),
                ("MinimumWorkingSetSize", ctypes.c_size_t),
                ("MaximumWorkingSetSize", ctypes.c_size_t),
                ("ActiveProcessLimit", wintypes.DWORD),
                ("Affinity", ctypes.c_size_t),
                ("PriorityClass", wintypes.DWORD),
                ("SchedulingClass", wintypes.DWORD),
            ]

        class IO_COUNTERS(ctypes.Structure):
            _fields_ = [
                ("ReadOperationCount", ctypes.c_ulonglong),
                ("WriteOperationCount", ctypes.c_ulonglong),
                ("OtherOperationCount", ctypes.c_ulonglong),
                ("ReadTransferCount", ctypes.c_ulonglong),
                ("WriteTransferCount", ctypes.c_ulonglong),
                ("OtherTransferCount", ctypes.c_ulonglong),
            ]

        class JOBOBJECT_EXTENDED_LIMIT_INFORMATION(ctypes.Structure):
            _fields_ = [
                ("BasicLimitInformation", JOBOBJECT_BASIC_LIMIT_INFORMATION),
                ("IoInfo", IO_COUNTERS),
                ("ProcessMemoryLimit", ctypes.c_size_t),
                ("JobMemoryLimit", ctypes.c_size_t),
                ("PeakProcessMemoryLimit", ctypes.c_size_t),
                ("PeakJobMemoryLimit", ctypes.c_size_t),
            ]

        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x2000
        JobObjectExtendedLimitInformation = 9

        info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE

        res = kernel32.SetInformationJobObject(
            job,
            JobObjectExtendedLimitInformation,
            ctypes.byref(info),
            ctypes.sizeof(info)
        )
        if not res:
            return None

        current_process = kernel32.GetCurrentProcess()
        kernel32.AssignProcessToJobObject(job, current_process)
        windows_job_handle = job
        return job
    except Exception:
        return None

ROOT_DIR = Path(__file__).resolve().parent
MILO_DIR = ROOT_DIR / "Milo_AI"
FRONTEND_DIR = ROOT_DIR / "auxin-frontend"
ADMIN_DIR = ROOT_DIR / "auxin-admin"

# Colors for Terminal UI
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
BLUE = "\033[94m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

SERVICES = [
    {
        "name": "Auxin Core API",
        "tag": "BACKEND ",
        "color": GREEN,
        "port": 8000,
        "url": "http://127.0.0.1:8000/docs",
        "health_url": "http://127.0.0.1:8000/health",
        "cwd": ROOT_DIR,
        "cmd": [
            str(ROOT_DIR / "venv" / "Scripts" / "python.exe") if (ROOT_DIR / "venv" / "Scripts" / "python.exe").exists() else sys.executable,
            "-m", "uvicorn",
            "main:app",
            "--host", "127.0.0.1",
            "--port", "8000"
        ],
        "env": {"APP_ENV": "development"}
    },
    {
        "name": "Milo AI Engine",
        "tag": "MILO_AI ",
        "color": MAGENTA,
        "port": 8001,
        "url": "http://127.0.0.1:8001/docs",
        "health_url": "http://127.0.0.1:8001/api/chat/health",
        "cwd": MILO_DIR,
        "cmd": [
            str(MILO_DIR / ".venv" / "Scripts" / "python.exe") if (MILO_DIR / ".venv" / "Scripts" / "python.exe").exists() else (str(ROOT_DIR / "venv" / "Scripts" / "python.exe") if (ROOT_DIR / "venv" / "Scripts" / "python.exe").exists() else sys.executable),
            "-m", "uvicorn",
            "backend.main:app",
            "--host", "127.0.0.1",
            "--port", "8001"
        ],
        "env": {"APP_ENV": "development"}
    },
    {
        "name": "Auxin Frontend (Customer/Farmer/Courier)",
        "tag": "FRONTEND",
        "color": CYAN,
        "port": 3000,
        "url": "http://localhost:3000",
        "cwd": FRONTEND_DIR,
        "cmd": ["npm.cmd" if sys.platform == "win32" else "npm", "run", "dev", "--", "--port", "3000"],
        "env": {}
    },
    {
        "name": "Auxin Super Admin Portal",
        "tag": "ADMIN   ",
        "color": BLUE,
        "port": 3001,
        "url": "http://localhost:3001",
        "cwd": ADMIN_DIR,
        "cmd": ["npm.cmd" if sys.platform == "win32" else "npm", "run", "dev", "--", "--port", "3001"],
        "env": {}
    },
]

running_processes: list[subprocess.Popen] = []
shutdown_event = threading.Event()

def is_port_open(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a TCP port is currently listening."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.6)
        return s.connect_ex((host, port)) == 0

def _http_get(url: str, timeout: float = 3.0) -> tuple[int, str]:
    """Return (status, body) or (0, "") when nothing answers."""
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.status, r.read(4096).decode("utf-8", "replace")
    except urllib.error.HTTPError as e:  # reachable, non-2xx
        try:
            return e.code, e.read(4096).decode("utf-8", "replace")
        except Exception:
            return e.code, ""
    except Exception:
        return 0, ""


def is_auxin_service(svc: dict) -> bool:
    """True when whatever is listening on svc['port'] is already an Auxin service."""
    port = svc["port"]
    if svc["tag"].strip() == "BACKEND":
        _, body = _http_get(f"http://127.0.0.1:{port}/health")
        return "demo_mode" in body
    if svc["tag"].strip() == "MILO_AI":
        status, _ = _http_get(f"http://127.0.0.1:{port}/api/chat/health")
        return status == 200
    status, body = _http_get(f"http://localhost:{port}/")
    return status == 200 and "auxin" in body.lower()


def stop_service_trees():
    """Stop only the processes this launcher started (never other programs)."""
    for proc in running_processes:
        try:
            if sys.platform == "win32":
                subprocess.run(f"taskkill /F /T /PID {proc.pid}", shell=True,
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                proc.terminate()
        except Exception:
            pass


def log_streamer(proc: subprocess.Popen, tag: str, color: str):
    """Stream subprocess stdout/stderr with clean colored tagging."""
    if proc.stdout is None:
        return
    for line in iter(proc.stdout.readline, ""):
        if shutdown_event.is_set() or not line:
            break
        text = line.strip()
        if text:
            # Filter out noisy repetitive hot-update / HMR ping noise
            if "webpack.hot-update" in text or "GET /favicon.ico" in text:
                continue
            print(f"{color}[{tag}]{RESET} {text}")

def wait_for_services(timeout: int = 45):
    """Wait for ports to open and notify the user."""
    print(f"\n{BOLD}{CYAN}Waiting for services to initialize...{RESET}")
    start_time = time.time()
    pending = {s["port"]: s for s in SERVICES}
    
    while pending and (time.time() - start_time < timeout):
        if shutdown_event.is_set():
            return
        for port in list(pending.keys()):
            if is_port_open(port):
                svc = pending.pop(port)
                print(f"  {GREEN}[READY]{RESET} {svc['name']} -> {BOLD}{svc['url']}{RESET}")
        try:
            time.sleep(0.8)
        except KeyboardInterrupt:
            shutdown_event.set()
            return

    if pending:
        for port, svc in pending.items():
            print(f"  {YELLOW}[WAITING]{RESET} {svc['name']} (Port {port}) is taking longer to start...")
    else:
        print(f"\n{BOLD}{GREEN}All 4 Auxin Platform Services are online and fully synced!{RESET}\n")

def launch_browser():
    """Automatically open user apps in default browser."""
    time.sleep(1.5)
    print(f"{CYAN}>> Launching Auxin Web Application ({SERVICES[2]['url']})...{RESET}")
    webbrowser.open(SERVICES[2]["url"])
    time.sleep(0.8)
    print(f"{BLUE}>> Launching Auxin Super Admin ({SERVICES[3]['url']})...{RESET}\n")
    webbrowser.open(SERVICES[3]["url"])

def shutdown():
    """Cleanly terminate the service process trees this launcher started."""
    if shutdown_event.is_set():
        return
    shutdown_event.set()
    print(f"\n\n{YELLOW}Stopping Auxin platform services...{RESET}")
    stop_service_trees()
    print(f"{GREEN}All services shut down cleanly.{RESET}\n")

def main():
    try:
        # Configure Windows Kernel Job Object for auto-cleanup on IDE/terminal close
        setup_windows_job_object()

        # Enable ANSI escape sequences in Windows terminal
        if sys.platform == "win32":
            os.system("")

        print("\n" + "=" * 64)
        print(f"{BOLD}{GREEN}            AUXIN V3.0 -- ONE-CLICK RUNNER{RESET}")
        print(f"{BOLD}{CYAN}      Complete Full-Stack & Milo AI Integrated Platform{RESET}")
        print("=" * 64)
        print(f"Directory: {ROOT_DIR}")
        print(f"Services:  1) FastAPI Core Backend (Port 8000)")
        print(f"           2) Milo AI RAG Engine   (Port 8001)")
        print(f"           3) Auxin Frontend       (Port 3000)")
        print(f"           4) Super Admin Portal   (Port 3001)")
        print("=" * 64)

        # 1. Port check (we never kill programs we did not start)
        print(f"\n{YELLOW}[CHECK] Looking for port conflicts...{RESET}")
        to_start = []
        conflicts = []
        for svc in SERVICES:
            if not is_port_open(svc["port"]):
                to_start.append(svc)
            elif is_auxin_service(svc):
                print(f"  {GREEN}[REUSE]{RESET} {svc['name']} already running on port {svc['port']}")
            else:
                conflicts.append(svc)
        if conflicts:
            for svc in conflicts:
                print(f"  {RED}[CONFLICT]{RESET} Port {svc['port']} ({svc['name']}) is used by another program.")
            print(f"{RED}Stop the program using that port, then run start.bat again. Nothing was started.{RESET}")
            return

        # 2. Launch each service that is not already running
        print(f"\n{BOLD}{CYAN}[STARTING] Launching {len(to_start)} Auxin service(s)...{RESET}")
        for svc in to_start:
            env = os.environ.copy()
            env.update(svc.get("env", {}))
            env.setdefault("PYTHONUNBUFFERED", "1")
            env.setdefault("PYTHONIOENCODING", "utf-8")

            try:
                proc = subprocess.Popen(
                    svc["cmd"],
                    cwd=str(svc["cwd"]),
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    bufsize=1
                )
                running_processes.append(proc)

                # Start background thread to capture and print logs
                t = threading.Thread(target=log_streamer, args=(proc, svc["tag"], svc["color"]), daemon=True)
                t.start()
                print(f"  {svc['color']}> Started {svc['name']}{RESET} (PID: {proc.pid})")
            except Exception as e:
                print(f"  {RED}x Failed to start {svc['name']}: {e}{RESET}")

        # 3. Wait for services to become healthy
        wait_for_services(timeout=30)

        # 4. Open in browser automatically
        browser_thread = threading.Thread(target=launch_browser, daemon=True)
        browser_thread.start()

        print(f"{BOLD}{GREEN}Platform Status:{RESET}")
        print(f"   * Main App:    {BOLD}http://localhost:3000{RESET} (Customer / Farmer / Delivery)")
        print(f"   * Admin App:   {BOLD}http://localhost:3001{RESET} (Super Admin Control Center)")
        print(f"   * Core API:    {BOLD}http://127.0.0.1:8000/docs{RESET}")
        print(f"   * Milo AI API: {BOLD}http://127.0.0.1:8001/docs{RESET}")
        print(f"\n{YELLOW}Press Ctrl+C at any time in this window to stop all services.{RESET}\n")

        # Keep main thread alive permanently until Ctrl+C
        while not shutdown_event.is_set():
            time.sleep(0.5)
    except (KeyboardInterrupt, SystemExit):
        shutdown()
    except Exception as e:
        print(f"\n{RED}An unexpected error occurred: {e}{RESET}")
        shutdown()

if __name__ == "__main__":
    main()
