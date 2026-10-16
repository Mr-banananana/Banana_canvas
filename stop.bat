@echo off
setlocal
pushd "%~dp0" >nul 2>&1
if errorlevel 1 exit /b 1
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1"
set "BANANA_EXIT=%ERRORLEVEL%"
popd
if not "%BANANA_EXIT%"=="0" echo [ERROR] Stop failed. Press Ctrl+C in the startup window.
if /i not "%~1"=="--no-pause" pause
exit /b %BANANA_EXIT%
