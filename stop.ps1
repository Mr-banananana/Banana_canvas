$ErrorActionPreference = "Stop"
$runtimePath = Join-Path $PSScriptRoot ".banana-canvas.runtime.json"
$launcherPath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "launcher.js")).Path

if (-not (Test-Path -LiteralPath $runtimePath)) {
  Write-Host "[INFO] 没有由启动脚本管理的 Banana Canvas 实例。"
  exit 0
}

try {
  $runtime = Get-Content -LiteralPath $runtimePath -Raw | ConvertFrom-Json
  $processId = [int]$runtime.pid
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId"
} catch {
  Write-Host "[ERROR] 无法读取启动状态：$($_.Exception.Message)"
  exit 1
}

$isLauncher = $false
if ($process -and $process.Name -match '^node(\.exe)?$') {
  $isLauncher = $process.CommandLine.IndexOf($launcherPath, [StringComparison]::OrdinalIgnoreCase) -ge 0
}
if (-not $isLauncher) {
  Write-Host "[INFO] 启动器已退出或进程号已变化；不会结束其他程序。"
  Remove-Item -LiteralPath $runtimePath -Force
  exit 0
}

Write-Host "[INFO] 正在停止 Banana Canvas，端口 $($runtime.port)..."
Start-Process -FilePath "taskkill.exe" -ArgumentList @("/PID", "$processId", "/T", "/F") -NoNewWindow -Wait | Out-Null
Start-Sleep -Milliseconds 500
if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
  Write-Host "[ERROR] 启动器仍在运行。"
  exit 1
}
Remove-Item -LiteralPath $runtimePath -Force -ErrorAction SilentlyContinue
Write-Host "[OK] Banana Canvas 已停止。"
