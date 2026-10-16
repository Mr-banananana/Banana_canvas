param([string[]]$Architectures = @('x64', 'arm64', 'x86'))
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
. (Join-Path $projectRoot 'bootstrap-node.ps1')
$version = (Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'package.json') | ConvertFrom-Json).version
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid app version.' }
$cacheRoot = Join-Path $projectRoot '.release-cache'
$outputRoot = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Path $cacheRoot, $outputRoot -Force | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
foreach ($architecture in $Architectures) {
  $spec = Get-BananaNodeSpec -ProjectRoot $projectRoot -Architecture $architecture
  $archivePath = Join-Path $cacheRoot $spec.ArchiveName
  if (-not (Test-Path -LiteralPath $archivePath) -or (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash -ine $spec.Sha256) {
    Invoke-BananaNodeDownload -Uri "https://nodejs.org/dist/$($spec.Version)/$($spec.ArchiveName)" -OutFile $archivePath
  }
  if ((Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash -ine $spec.Sha256) { throw 'Official runtime checksum mismatch.' }
  $stage = Join-Path $cacheRoot ('package-' + [guid]::NewGuid().ToString('N'))
  $bundle = Join-Path $stage "Banana-Canvas-v$version"
  New-Item -ItemType Directory -Path $bundle -Force | Out-Null
  foreach ($name in @('server.js','launcher.js','public','start.bat','start.ps1','bootstrap-node.ps1','node-runtime.json','stop.bat','stop.ps1','package.json','README.md','CHANGELOG.md')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $name) -Destination $bundle -Recurse -Force
  }
  foreach ($name in @('LICENSE','LICENSE.md','LICENSE.txt')) {
    if (Test-Path -LiteralPath (Join-Path $projectRoot $name)) { Copy-Item -LiteralPath (Join-Path $projectRoot $name) -Destination $bundle }
  }
  $runtime = Join-Path (Join-Path $bundle '.runtime') $spec.DirectoryName
  New-Item -ItemType Directory -Path $runtime -Force | Out-Null
  $zip = [IO.Compression.ZipFile]::OpenRead($archivePath)
  try {
    foreach ($file in @('node.exe','LICENSE')) {
      $entry = $zip.GetEntry("$($spec.DirectoryName)/$file")
      if (-not $entry) { throw "Missing official runtime file: $file" }
      [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, (Join-Path $runtime $file), $true)
    }
  } finally { $zip.Dispose() }
  $instructions = @"
Banana Canvas v$version - Windows $architecture portable

1. Extract the entire ZIP to a local folder.
2. Double-click start.bat. Node.js is included; no npm or runtime download needed.
3. Double-click stop.bat or press Ctrl+C in the startup window to stop.

Requires Windows 10 / Server 2016 or later.
Choose x64 for most Intel/AMD PCs, arm64 for Windows on ARM, x86 for 32-bit Windows.
The local interface starts offline. AI generation still needs internet and your API Key.
Official Node.js $($spec.Version); third-party notices: .runtime/$($spec.DirectoryName)/LICENSE
"@
  [IO.File]::WriteAllText((Join-Path $bundle 'START-HERE.txt'), $instructions, [Text.UTF8Encoding]::new($true))
  $exe = [IO.File]::OpenRead((Join-Path $runtime 'node.exe'))
  $reader = [IO.BinaryReader]::new($exe)
  try {
    $exe.Position = 0x3c; $offset = $reader.ReadInt32(); $exe.Position = $offset
    if ($reader.ReadUInt32() -ne 0x4550) { throw 'Invalid Windows executable signature.' }
    $machine = $reader.ReadUInt16()
    $expected = @{ x64 = 0x8664; arm64 = 0xaa64; x86 = 0x14c }
    if ($machine -ne $expected[$architecture]) { throw 'Runtime CPU architecture does not match the package.' }
  } finally { $reader.Dispose(); $exe.Dispose() }
  $output = Join-Path $outputRoot "Banana-Canvas-windows-$architecture.zip"
  if (Test-Path -LiteralPath $output) { throw "Output already exists: $output. Use a new version or move the existing artifact first." }
  [IO.Compression.ZipFile]::CreateFromDirectory($bundle, $output, [IO.Compression.CompressionLevel]::Optimal, $true)
  Write-Host "Built $output"
}
$lines = @(Get-ChildItem -LiteralPath $outputRoot -Filter 'Banana-Canvas-windows-*.zip' | ForEach-Object {
  "{0}  {1}" -f (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant(), $_.Name
})
[IO.File]::WriteAllLines((Join-Path $outputRoot 'SHA256SUMS.txt'), $lines, [Text.UTF8Encoding]::new($false))
