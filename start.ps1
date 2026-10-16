param([switch]$PrepareOnly, [switch]$NoPause, [switch]$NoBrowser, [switch]$Offline, [switch]$RuntimeOnly, [string]$RuntimeCache)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if ($NoBrowser) { $env:BANANA_OPEN_BROWSER = '0' }
elseif (-not $env:BANANA_OPEN_BROWSER) { $env:BANANA_OPEN_BROWSER = '1' }
$logPath = $null
try {
  $logRoot = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'BananaCanvas\logs'
  New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
  $logPath = Join-Path $logRoot ("startup-{0}-{1}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $PID)
  Start-Transcript -LiteralPath $logPath -ErrorAction Stop | Out-Null
} catch {}
try {
  . (Join-Path $PSScriptRoot 'bootstrap-node.ps1')
  Write-Host "Windows $([Environment]::OSVersion.Version); PowerShell $($PSVersionTable.PSVersion); $(Get-BananaArchitecture)"
  $node = Resolve-BananaNode -ProjectRoot $PSScriptRoot -RuntimeOnly:$RuntimeOnly -Offline:$Offline -CacheRoot $RuntimeCache
  Write-Host "使用 Node.js $($node.Version) ($($node.Path))"
  if ($PrepareOnly) { exit 0 }
  & $node.Path (Join-Path $PSScriptRoot 'launcher.js')
  if ($LASTEXITCODE -ne 0) { throw "本地服务启动失败，退出码 $LASTEXITCODE。" }
} catch {
  Write-Host "[ERROR] $($_.Exception.Message)"
  Write-Host '建议下载 Release 中的 Windows 便携版，解压后双击 start.bat；便携版已内置 Node.js。'
  if ($logPath) { Write-Host "诊断日志：$logPath" }
  if (-not $NoPause) { Read-Host '按 Enter 退出' | Out-Null }
  exit 1
} finally {
  if ($logPath) { try { Stop-Transcript | Out-Null } catch {} }
}
