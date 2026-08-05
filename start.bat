@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 18 or newer is required.
  echo Opening the official download page...
  start "" "https://nodejs.org/en/download/"
  pause
  exit /b 1
)

start "Banana Canvas Server" cmd /k "node server.js"
timeout /t 2 /nobreak >nul
start "" "http://localhost:5177/"
echo Banana Canvas is running at http://localhost:5177/
