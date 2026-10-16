param([Parameter(Mandatory=$true)][string]$ArchivePath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('banana-integration-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
$saved = @{}
foreach ($name in @('PATH','HTTP_PROXY','HTTPS_PROXY','BANANA_OPEN_BROWSER','PORT')) { $saved[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
$started = $null
$bundle = $null
try {
  $extractRoot = Join-Path $testRoot '启动 test [1]'
  [IO.Compression.ZipFile]::ExtractToDirectory([IO.Path]::GetFullPath($ArchivePath), $extractRoot)
  $bundle = (Get-ChildItem -LiteralPath $extractRoot -Directory | Select-Object -First 1).FullName
  # Prove the offline BAT path does not depend on the PowerShell bootstrap at all.
  Rename-Item -LiteralPath (Join-Path $bundle 'start.ps1') -NewName 'start-disabled.ps1'
  Rename-Item -LiteralPath (Join-Path $bundle 'bootstrap-node.ps1') -NewName 'bootstrap-disabled.ps1'
  $env:PATH = "$env:SystemRoot\System32;$env:SystemRoot"
  $env:HTTP_PROXY = 'http://127.0.0.1:1'; $env:HTTPS_PROXY = 'http://127.0.0.1:1'
  $env:BANANA_OPEN_BROWSER = '0'
  $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
  $listener.Start(); $env:PORT = [string]$listener.LocalEndpoint.Port
  $servicePort = $null
  $batch = Join-Path $bundle 'start.bat'
  $arguments = '/d /s /c ""' + $batch + '""'
  $started = Start-Process -FilePath $env:ComSpec -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $testRoot 'stdout.log') -RedirectStandardError (Join-Path $testRoot 'stderr.log')
  $healthy = $false
  for ($attempt=0; $attempt -lt 60; $attempt++) {
    Start-Sleep -Milliseconds 250
    try {
      $runtime = Get-Content -LiteralPath (Join-Path $bundle '.banana-canvas.runtime.json') -Raw | ConvertFrom-Json
      $servicePort = [int]$runtime.port
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:$servicePort/healthz" -TimeoutSec 1
      if ($health.service -eq 'banana-canvas') { $healthy=$true; break }
    } catch {}
    if ($started.HasExited) { break }
  }
  if (-not $healthy) {
    Get-Content -LiteralPath (Join-Path $testRoot 'stdout.log') -ErrorAction SilentlyContinue
    Get-Content -LiteralPath (Join-Path $testRoot 'stderr.log') -ErrorAction SilentlyContinue
    throw 'Portable startup failed.'
  }
  Write-Host 'PASS portable BAT: no system Node, unavailable proxy, no bootstrap PowerShell, Chinese/space/bracket path'
  if ($servicePort -le [int]$env:PORT) { throw 'Port-conflict fallback did not select another port.' }
  Write-Host 'PASS occupied port selects another port without terminating its owner'
  $page = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$servicePort/" -TimeoutSec 3
  if ($page.StatusCode -ne 200 -or $page.Content -notmatch 'Banana') { throw 'App page did not load.' }
  Write-Host 'PASS real application HTTP page and health check'
  $second = Start-Process -FilePath $env:ComSpec -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $testRoot 'second.log') -RedirectStandardError (Join-Path $testRoot 'second-error.log')
  $null = $second.Handle
  if (-not $second.WaitForExit(10000)) { throw 'Second launcher did not reuse existing service.' }
  $second.Refresh()
  $secondOutput = Get-Content -LiteralPath (Join-Path $testRoot 'second.log') -Raw
  if ($secondOutput -notmatch '复用端口') { throw 'Second launcher did not report instance reuse.' }
  Write-Host 'PASS repeated launch reuses healthy instance'
  $stopArguments = '/d /s /c ""' + (Join-Path $bundle 'stop.bat') + '" --no-pause"'
  $stopped = Start-Process -FilePath $env:ComSpec -ArgumentList $stopArguments -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $testRoot 'stop.log') -RedirectStandardError (Join-Path $testRoot 'stop-error.log')
  if ($stopped.ExitCode -ne 0) { throw 'Stop BAT failed with minimal PATH.' }
  $stillHealthy = $false
  try { $null = Invoke-RestMethod -Uri "http://127.0.0.1:$servicePort/healthz" -TimeoutSec 1; $stillHealthy = $true } catch {}
  if ($stillHealthy) { throw 'Service remains active after stopping.' }
  if (Test-Path -LiteralPath (Join-Path $bundle '.banana-canvas.runtime.json')) { throw 'Runtime state remains after stopping.' }
  Write-Host 'PASS stop script stops owned launcher and server'
} finally {
  if ($listener) { $listener.Stop() }
  if ($started -and -not $started.HasExited) {
    Start-Process -FilePath (Join-Path $env:SystemRoot 'System32\taskkill.exe') -ArgumentList @('/PID',[string]$started.Id,'/T','/F') -WindowStyle Hidden -Wait -ErrorAction SilentlyContinue | Out-Null
  }
  foreach ($name in $saved.Keys) { [Environment]::SetEnvironmentVariable($name,$saved[$name],'Process') }
  # Retain logs for inspection; this is an isolated GUID directory under TEMP.
  Write-Host "Integration logs: $testRoot"
}
