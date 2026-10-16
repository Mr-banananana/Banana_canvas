# Dot-source this file. Compatible with Windows PowerShell 5.1 and PowerShell 7.
# npm/PowerShell 7 can pass a PSModulePath that hides Windows PowerShell's own modules.
Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Utility\Microsoft.PowerShell.Utility.psd1') -ErrorAction Stop

function Get-BananaArchitecture {
  $architecture = $env:PROCESSOR_ARCHITEW6432
  if (-not $architecture) { $architecture = $env:PROCESSOR_ARCHITECTURE }
  switch -Regex ($architecture) {
    '^ARM64$' { return 'arm64' }
    '^AMD64$|^x64$' { return 'x64' }
    '^x86$' { return 'x86' }
    default { throw "Unsupported Windows architecture: $architecture" }
  }
}

function Get-BananaNodeSpec {
  param([string]$ProjectRoot, [string]$Architecture)
  $manifest = Get-Content -Raw -LiteralPath (Join-Path $ProjectRoot 'node-runtime.json') | ConvertFrom-Json
  # A collection must never be interpolated into a URL (Invoke-RestMethod returns arrays).
  if ($manifest.version -isnot [string] -or $manifest.version -notmatch '^v22\.\d+\.\d+$') {
    throw 'Invalid pinned Node.js version. Download a complete release package.'
  }
  if ($Architecture -notin @('x64', 'arm64', 'x86')) { throw 'Invalid runtime architecture.' }
  $hash = [string]$manifest.windows.$Architecture.sha256
  if ($hash -notmatch '^[a-fA-F0-9]{64}$') { throw 'Invalid pinned runtime checksum.' }
  $name = "node-$($manifest.version)-win-$Architecture"
  return [pscustomobject]@{
    Version = $manifest.version; Architecture = $Architecture
    DirectoryName = $name; ArchiveName = "$name.zip"; Sha256 = $hash.ToLowerInvariant()
    MinimumWindowsBuild = [int]$manifest.minimumWindowsBuild
  }
}

function Test-BananaNode {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
  try {
    $output = @(& $Path --version 2>$null)
    if ($LASTEXITCODE -eq 0 -and $output.Count -gt 0 -and [string]$output[0] -match '^v(\d+)\.\d+\.\d+$' -and [int]$Matches[1] -ge 18) {
      return [pscustomobject]@{ Path = $Path; Version = [string]$output[0] }
    }
  } catch {}
  return $null
}

function Get-BananaWritableRuntimeRoot {
  param([string[]]$Candidates)
  foreach ($candidate in $Candidates) {
    $probe = $null
    try {
      New-Item -ItemType Directory -Path $candidate -Force -ErrorAction Stop | Out-Null
      $probe = Join-Path $candidate ('.write-' + [guid]::NewGuid().ToString('N'))
      [IO.File]::WriteAllText($probe, 'ok')
      Remove-Item -LiteralPath $probe -Force -ErrorAction Stop
      return $candidate
    } catch {
      if ($probe) { Remove-Item -LiteralPath $probe -Force -ErrorAction SilentlyContinue }
    }
  }
  throw 'No writable runtime directory. Extract to a folder you own, such as Documents.'
}

function Invoke-BananaNodeDownload {
  param([string]$Uri, [string]$OutFile)
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $ProgressPreference = 'SilentlyContinue'
  try {
    Invoke-WebRequest -UseBasicParsing -Uri $Uri -OutFile $OutFile -TimeoutSec 180 -UserAgent 'BananaCanvas-Launcher' -ErrorAction Stop
    return
  } catch {
    $webError = $_.Exception.Message
    $curl = Get-Command curl.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $curl) { throw $webError }
    # curl honours HTTPS_PROXY/NO_PROXY; Windows PowerShell uses the system proxy.
    & $curl.Source --fail --location --silent --show-error --connect-timeout 15 --max-time 180 --output $OutFile $Uri
    if ($LASTEXITCODE -ne 0) { throw "PowerShell: $webError; curl exit $LASTEXITCODE" }
  }
}

function Install-BananaNodeArchive {
  param([string]$ArchivePath, [string]$RuntimeRoot, $Spec)
  $actual = (Get-FileHash -LiteralPath $ArchivePath -Algorithm SHA256).Hash
  if ($actual -ine $Spec.Sha256) { throw 'Node.js SHA-256 mismatch; archive was not installed.' }
  $stage = Join-Path $RuntimeRoot ('.extract-' + [guid]::NewGuid().ToString('N'))
  $target = Join-Path $RuntimeRoot $Spec.DirectoryName
  try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [IO.Compression.ZipFile]::ExtractToDirectory($ArchivePath, $stage)
    $extracted = Join-Path $stage $Spec.DirectoryName
    if (-not (Test-Path -LiteralPath (Join-Path $extracted 'node.exe') -PathType Leaf)) { throw 'Runtime archive does not contain node.exe.' }
    if (Test-Path -LiteralPath $target) {
      # Preserve damaged previous installations instead of recursively deleting user paths.
      Move-Item -LiteralPath $target -Destination ($target + '.broken-' + [guid]::NewGuid().ToString('N')) -ErrorAction Stop
    }
    Move-Item -LiteralPath $extracted -Destination $target -ErrorAction Stop
    return (Join-Path $target 'node.exe')
  } finally {
    $rootPrefix = [IO.Path]::GetFullPath($RuntimeRoot).TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
    if ([IO.Path]::GetFullPath($stage).StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $stage)) {
      Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
}

function Resolve-BananaNode {
  param([string]$ProjectRoot, [switch]$RuntimeOnly, [switch]$Offline, [string]$CacheRoot)
  $architecture = Get-BananaArchitecture
  $spec = Get-BananaNodeSpec -ProjectRoot $ProjectRoot -Architecture $architecture
  $os = [Environment]::OSVersion.Version
  if ($os.Major -lt 10 -or ($os.Major -eq 10 -and $os.Build -lt $spec.MinimumWindowsBuild)) {
    throw 'Node.js 22 requires Windows 10 / Server 2016 or later. Windows 7/8 are not supported.'
  }
  $cacheBase = [Environment]::GetFolderPath('LocalApplicationData')
  if (-not $cacheBase) { $cacheBase = [IO.Path]::GetTempPath() }
  if (-not $CacheRoot) { $CacheRoot = Join-Path $cacheBase 'BananaCanvas\runtime' }
  $roots = @((Join-Path $ProjectRoot '.runtime'), $CacheRoot)
  foreach ($root in $roots) {
    $result = Test-BananaNode (Join-Path (Join-Path $root $spec.DirectoryName) 'node.exe')
    if ($result) { return $result }
  }
  if (-not $RuntimeOnly) {
    $candidates = @()
    $fromPath = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($fromPath) { $candidates += $fromPath.Source }
    $candidates += @("$env:ProgramFiles\nodejs\node.exe", "$env:LOCALAPPDATA\Programs\nodejs\node.exe", "$env:LOCALAPPDATA\Volta\bin\node.exe", "$HOME\scoop\apps\nodejs-lts\current\node.exe", "$HOME\scoop\apps\nodejs\current\node.exe")
    if (${env:ProgramFiles(x86)}) { $candidates += "${env:ProgramFiles(x86)}\nodejs\node.exe" }
    foreach ($root in $roots) {
      foreach ($directory in @(Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue)) {
        if ($directory.Name -match '^node-v\d+\.\d+\.\d+-win-(x64|arm64|x86)$') { $candidates += Join-Path $directory.FullName 'node.exe' }
      }
    }
    foreach ($candidate in ($candidates | Select-Object -Unique)) {
      $result = Test-BananaNode $candidate
      if ($result) { return $result }
    }
  }
  if ($Offline) { throw 'No usable local runtime. Download the Windows portable release containing Node.js.' }
  $runtimeRoot = Get-BananaWritableRuntimeRoot -Candidates $roots
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $ProgressPreference = 'SilentlyContinue'
  $sources = @('https://nodejs.org/dist', 'https://registry.npmmirror.com/-/binary/node', 'https://npmmirror.com/mirrors/node')
  foreach ($source in $sources) {
    $uri = "$source/$($spec.Version)/$($spec.ArchiveName)"
    $archivePath = Join-Path $runtimeRoot ('.download-' + [guid]::NewGuid().ToString('N') + '.zip')
    try {
      Write-Host "[Node.js] $uri"
      Invoke-BananaNodeDownload -Uri $uri -OutFile $archivePath
      $nodePath = Install-BananaNodeArchive -ArchivePath $archivePath -RuntimeRoot $runtimeRoot -Spec $spec
      $result = Test-BananaNode $nodePath
      if (-not $result) { throw 'Runtime could not execute. Check OS support and security software.' }
      return $result
    } catch {
      Write-Host "[WARN] $uri : $($_.Exception.Message)"
    } finally {
      Remove-Item -LiteralPath $archivePath -Force -ErrorAction SilentlyContinue
    }
  }
  throw 'Runtime download failed. Use the Windows portable release to start without downloading Node.js. See source errors above.'
}
