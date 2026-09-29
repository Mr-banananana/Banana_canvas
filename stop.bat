@echo off
setlocal
cd /d "%~dp0"
if not exist "%~dp0.banana-canvas.runtime.json" (
  echo [INFO] 没有由启动脚本管理的 Banana Canvas 实例。
  pause
  exit /b 0
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1"
if errorlevel 1 echo [ERROR] 停止失败；请在 Banana Canvas 启动窗口按 Ctrl+C。
pause
