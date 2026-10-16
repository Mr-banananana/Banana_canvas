$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
. (Join-Path $projectRoot 'bootstrap-node.ps1')
Add-Type -AssemblyName System.IO.Compression.FileSystem
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('banana-bootstrap-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
$checks = 0
function Assert-Bootstrap($Condition, [string]$Message) {
  if (-not $Condition) { throw "FAILED: $Message" }
  $script:checks += 1
  Write-Host "PASS $Message"
}
function Assert-BootstrapThrows([scriptblock]$Action, [string]$Message) {
  $thrown = $false
  try { & $Action | Out-Null } catch { $thrown = $true }
  Assert-Bootstrap $thrown $Message
}
$savedArchitecture = $env:PROCESSOR_ARCHITECTURE
$savedWow = $env:PROCESSOR_ARCHITEW6432
try {
  foreach ($case in @(@('AMD64','','x64'), @('x86','AMD64','x64'), @('ARM64','','arm64'), @('x86','ARM64','arm64'), @('x86','','x86'))) {
    $env:PROCESSOR_ARCHITECTURE = $case[0]; $env:PROCESSOR_ARCHITEW6432 = $case[1]
    Assert-Bootstrap ((Get-BananaArchitecture) -eq $case[2]) "Native architecture $($case -join '/')"
  }
  $spec = Get-BananaNodeSpec -ProjectRoot $projectRoot -Architecture x64
  Assert-Bootstrap ($spec.Version -is [string] -and $spec.ArchiveName.Length -lt 80) 'Single pinned version yields a short filename'
  Assert-BootstrapThrows { Get-BananaNodeSpec -ProjectRoot $projectRoot -Architecture '../x64' } 'Reject unknown or traversal architecture'
  $badManifestRoot = Join-Path $testRoot 'bad'
  New-Item -ItemType Directory -Path $badManifestRoot | Out-Null
  [IO.File]::WriteAllText((Join-Path $badManifestRoot 'node-runtime.json'), '{"version":["v22.1.0","v22.2.0"]}')
  Assert-BootstrapThrows { Get-BananaNodeSpec -ProjectRoot $badManifestRoot -Architecture x64 } 'Reject the array version that caused 400/414'

  $unicodeRoot = Join-Path $testRoot 'Chinese path 空格 [1]'
  $payload = Join-Path $unicodeRoot 'payload'
  $payloadRuntime = Join-Path $payload $spec.DirectoryName
  New-Item -ItemType Directory -Path $payloadRuntime -Force | Out-Null
  [IO.File]::WriteAllText((Join-Path $payloadRuntime 'node.exe'), 'archive fixture - not executable')
  $archive = Join-Path $unicodeRoot 'runtime.zip'
  [IO.Compression.ZipFile]::CreateFromDirectory($payload, $archive)
  $fixtureSpec = [pscustomobject]@{DirectoryName=$spec.DirectoryName; Sha256=(Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash}
  $runtimeRoot = Join-Path $unicodeRoot 'runtime'
  New-Item -ItemType Directory -Path $runtimeRoot | Out-Null
  $installed = Install-BananaNodeArchive -ArchivePath $archive -RuntimeRoot $runtimeRoot -Spec $fixtureSpec
  Assert-Bootstrap (Test-Path -LiteralPath $installed) 'Extract checked ZIP with Chinese, spaces and brackets in path'
  $fixtureSpec.Sha256 = '0' * 64
  Assert-BootstrapThrows { Install-BananaNodeArchive -ArchivePath $archive -RuntimeRoot $runtimeRoot -Spec $fixtureSpec } 'Reject bad hash before extracting or executing'
  Assert-Bootstrap (-not (Test-BananaNode $installed)) 'Reject a corrupted or non-executable runtime'

  $notDirectory = Join-Path $testRoot 'occupied-file'
  [IO.File]::WriteAllText($notDirectory, 'block directory creation')
  $fallback = Join-Path $testRoot 'user-cache'
  Assert-Bootstrap ((Get-BananaWritableRuntimeRoot -Candidates @($notDirectory,$fallback)) -eq $fallback) 'Use user cache when project runtime is not writable'
  Assert-Bootstrap (@(Get-ChildItem -LiteralPath $runtimeRoot -Directory -Filter '.extract-*').Count -eq 0) 'No extraction staging directories left behind'
  # Inject transport failure while exercising the real resolve/checksum/extract pipeline.
  $originalDownload = (Get-Item Function:Invoke-BananaNodeDownload).ScriptBlock
  $originalNodeTest = (Get-Item Function:Test-BananaNode).ScriptBlock
  $originalArchitecture = (Get-Item Function:Get-BananaArchitecture).ScriptBlock
  try {
    $mockProject = Join-Path $testRoot 'fallback-project'
    New-Item -ItemType Directory -Path $mockProject | Out-Null
    $mockManifest = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'node-runtime.json') | ConvertFrom-Json
    $mockManifest.windows.x64.sha256 = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash
    [IO.File]::WriteAllText((Join-Path $mockProject 'node-runtime.json'), ($mockManifest | ConvertTo-Json -Depth 5))
    [IO.File]::WriteAllText((Join-Path $mockProject '.runtime'), 'block project runtime directory')
    $script:downloadFixtureArchive = $archive
    $script:downloadCalls = @()
    function Get-BananaArchitecture { return 'x64' }
    function Invoke-BananaNodeDownload {
      param($Uri, $OutFile)
      $script:downloadCalls += $Uri
      if ($script:downloadCalls.Count -eq 1) { throw 'Simulated HTTP 400 from primary' }
      Copy-Item -LiteralPath $script:downloadFixtureArchive -Destination $OutFile
    }
    function Test-BananaNode {
      param($Path)
      if (Test-Path -LiteralPath $Path -PathType Leaf) { return [pscustomobject]@{Path=$Path;Version='v22.23.3'} }
      return $null
    }
    $resolved = Resolve-BananaNode -ProjectRoot $mockProject -CacheRoot (Join-Path $testRoot 'empty-cache') -RuntimeOnly
    Assert-Bootstrap ($script:downloadCalls.Count -eq 2 -and (Test-Path -LiteralPath $resolved.Path)) 'HTTP 400 falls back and installs a checksum-verified ZIP'
    Assert-Bootstrap ($resolved.Path.StartsWith((Join-Path $testRoot 'empty-cache'))) 'Full resolution installs in user cache when project runtime cannot be created'
    Assert-Bootstrap (@($script:downloadCalls | Where-Object { $_.Length -gt 200 -or $_ -notmatch '/v22\.\d+\.\d+/node-v22\.\d+\.\d+-win-x64\.zip$' }).Count -eq 0) 'Every download URL contains exactly one valid version'
    $reused = Resolve-BananaNode -ProjectRoot $mockProject -CacheRoot (Join-Path $testRoot 'empty-cache') -RuntimeOnly -Offline
    Assert-Bootstrap ($reused.Path -eq $resolved.Path -and $script:downloadCalls.Count -eq 2) 'Offline restart reuses local runtime without any network request'
  } finally {
    Set-Item Function:Invoke-BananaNodeDownload $originalDownload
    Set-Item Function:Test-BananaNode $originalNodeTest
    Set-Item Function:Get-BananaArchitecture $originalArchitecture
  }
  Write-Host "$checks bootstrap checks passed on PowerShell $($PSVersionTable.PSVersion)."
} finally {
  $env:PROCESSOR_ARCHITECTURE = $savedArchitecture
  $env:PROCESSOR_ARCHITEW6432 = $savedWow
  $expectedPrefix = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
  if ([IO.Path]::GetFullPath($testRoot).StartsWith($expectedPrefix, [StringComparison]::OrdinalIgnoreCase)) { Remove-Item -LiteralPath $testRoot -Recurse -Force }
}
