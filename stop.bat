@echo off
setlocal
cd /d "%~dp0"

set "EXISTING_PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":5177 .*LISTENING"') do if not defined EXISTING_PID set "EXISTING_PID=%%P"

if not defined EXISTING_PID (
  echo [INFO] Banana Canvas is not running on port 5177.
  echo [OK] Nothing to stop.
  pause
  exit /b 0
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5177/healthz' -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  echo [ERROR] Port 5177 is used by another application, not Banana Canvas.
  echo [INFO] Process ID: %EXISTING_PID%
  echo [INFO] Nothing was stopped for safety.
  pause
  exit /b 1
)

echo [INFO] Stopping Banana Canvas, process ID: %EXISTING_PID%...
taskkill /PID %EXISTING_PID% /T /F >nul 2>&1
timeout /t 1 /nobreak >nul

set "REMAINING_PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":5177 .*LISTENING"') do if not defined REMAINING_PID set "REMAINING_PID=%%P"
if defined REMAINING_PID (
  echo [ERROR] Banana Canvas may still be running. Process ID: %REMAINING_PID%
  pause
  exit /b 1
)

echo [OK] Banana Canvas stopped successfully.
pause
