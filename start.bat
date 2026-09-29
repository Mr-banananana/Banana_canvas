@echo off
setlocal
cd /d "%~dp0"
if not defined PORT set "PORT=5337"
PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
if errorlevel 1 pause
