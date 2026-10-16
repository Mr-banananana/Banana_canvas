@echo off
setlocal
pushd "%~dp0" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Extract the ZIP to a local folder before starting.
  pause
  exit /b 1
)
if not defined BANANA_OPEN_BROWSER set "BANANA_OPEN_BROWSER=1"
set "BANANA_ARCH=x86"
if /i "%PROCESSOR_ARCHITECTURE%"=="AMD64" set "BANANA_ARCH=x64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "BANANA_ARCH=arm64"
if /i "%PROCESSOR_ARCHITEW6432%"=="AMD64" set "BANANA_ARCH=x64"
if /i "%PROCESSOR_ARCHITEW6432%"=="ARM64" set "BANANA_ARCH=arm64"
rem Portable packages run directly, even if PowerShell is restricted or offline.
set "BANANA_NODE="
for /d %%D in ("%~dp0.runtime\node-v22.*-win-%BANANA_ARCH%") do (
  if exist "%%~fD\node.exe" (
    "%%~fD\node.exe" --version >nul 2>&1
    if not errorlevel 1 (
      set "BANANA_NODE=%%~fD\node.exe"
      goto portable
    )
  )
)
rem A 32-bit portable package also works on 64-bit Windows.
for /d %%D in ("%~dp0.runtime\node-v22.*-win-x86") do (
  if exist "%%~fD\node.exe" (
    "%%~fD\node.exe" --version >nul 2>&1
    if not errorlevel 1 (
      set "BANANA_NODE=%%~fD\node.exe"
      goto portable
    )
  )
)
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" -NoPause
set "BANANA_EXIT=%ERRORLEVEL%"
goto finished
:portable
"%BANANA_NODE%" "%~dp0launcher.js"
set "BANANA_EXIT=%ERRORLEVEL%"
:finished
popd
if not "%BANANA_EXIT%"=="0" pause
exit /b %BANANA_EXIT%
