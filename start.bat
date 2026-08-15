@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js 18 or newer is required.
  echo Opening the official download page...
  start "" "https://nodejs.org/en/download/"
  pause
  exit /b 1
)

set "EXISTING_PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":5177 .*LISTENING"') do if not defined EXISTING_PID set "EXISTING_PID=%%P"
if defined EXISTING_PID (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5177/healthz' -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
  if not errorlevel 1 (
    echo [OK] Banana Canvas is already running on http://localhost:5177/
    echo [INFO] Existing process ID: %EXISTING_PID%
    start "" "http://localhost:5177/"
    echo [INFO] To stop it, double-click stop.bat.
    pause
    exit /b 0
  )
  echo [ERROR] Port 5177 is occupied by another application.
  echo [INFO] Process ID: %EXISTING_PID%
  echo [INFO] Close that application or choose another PORT before starting Banana Canvas.
  pause
  exit /b 1
)

start "Banana Canvas Server" cmd /k "node server.js"
for /l %%N in (1,1,15) do (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5177/healthz' -TimeoutSec 1; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
  if not errorlevel 1 goto :ready
  timeout /t 1 /nobreak >nul
)

echo [ERROR] Banana Canvas did not become ready within 15 seconds.
echo [INFO] Check the Banana Canvas Server window for details.
pause
exit /b 1

:ready
start "" "http://localhost:5177/"
echo [OK] Service is ready: http://localhost:5177/
echo [INFO] Keep the Banana Canvas Server window open while using the app.
echo [INFO] To exit, double-click stop.bat or press Ctrl+C in the server window.
pause
