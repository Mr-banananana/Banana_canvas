$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js 18 or newer is required."
  Start-Process "https://nodejs.org/en/download/"
  exit 1
}

$cacheBuster = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$server = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $PSScriptRoot -NoNewWindow -PassThru
Start-Sleep -Seconds 2
Start-Process "http://localhost:5177/?startup=$cacheBuster"
Write-Host "Banana Canvas is running at http://localhost:5177/"
Write-Host "Close this PowerShell window to stop the local server."
Wait-Process -Id $server.Id
