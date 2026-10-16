$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot
$env:BANANA_OPEN_BROWSER = "1"

$runtimeRoot = Join-Path $PSScriptRoot ".runtime"
$nodeCandidates = @()
$pathNode = Get-Command node -CommandType Application -ErrorAction SilentlyContinue
if ($pathNode) { $nodeCandidates += $pathNode.Source }
$nodeCandidates += @("$env:ProgramFiles\nodejs\node.exe", "$env:LOCALAPPDATA\Programs\nodejs\node.exe", "$env:LOCALAPPDATA\Volta\bin\node.exe")
if (${env:ProgramFiles(x86)}) { $nodeCandidates += "${env:ProgramFiles(x86)}\nodejs\node.exe" }
$nodeCandidates += @("$HOME\scoop\apps\nodejs-lts\current\node.exe", "$HOME\scoop\apps\nodejs\current\node.exe")
$nodeCandidates += Get-ChildItem -Path (Join-Path $runtimeRoot "node-v*-win-*") -Filter "node.exe" -File -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName }

$nodePath = $null
$nodeVersion = $null
foreach ($candidate in ($nodeCandidates | Where-Object { $_ } | Select-Object -Unique)) {
  if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
  try {
    $candidateVersion = (& $candidate --version 2>$null | Select-Object -First 1).Trim()
    if ($candidateVersion -match '^v(\d+)\.') {
      $major = [int]$Matches[1]
      if ($major -ge 18) {
        $nodePath = $candidate
        $nodeVersion = $candidateVersion
        break
      }
    }
  } catch {}
}

if (-not $nodePath) {
  Write-Host "未找到可用的 Node.js，正在下载 Node.js 22 到项目本地 .runtime 目录（不会修改系统 PATH）..."
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $ProgressPreference = "SilentlyContinue"
    $architecture = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
    $architecture = switch -Regex ($architecture) {
      '^ARM64$' { 'arm64'; break }
      '^AMD64$' { 'x64'; break }
      '^x86$|^X86$' { 'x86'; break }
      default { throw "暂不支持的 Windows 架构：$architecture" }
    }

    New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
    $downloadBases = @(
      "https://nodejs.org/dist",
      "https://npmmirror.com/mirrors/node",
      "https://mirrors.tuna.tsinghua.edu.cn/nodejs-release"
    )
    $downloadErrors = @()
    foreach ($downloadBase in $downloadBases) {
      $archivePath = $null
      try {
        $release = Invoke-RestMethod -Uri "$downloadBase/index.json" -TimeoutSec 30 |
          Where-Object { $_.version -match '^v22\.' -and $_.lts } |
          Select-Object -First 1
        if (-not $release) { throw "索引中没有可用的 Node.js 22 LTS 版本。" }

        $version = $release.version
        $archiveName = "node-$version-win-$architecture.zip"
        $releaseUrl = "$downloadBase/$version"
        $manifest = (Invoke-WebRequest -UseBasicParsing -Uri "$releaseUrl/SHASUMS256.txt" -TimeoutSec 30).Content
        $manifestLine = $manifest -split "`n" | Where-Object { $_ -match "^([0-9a-fA-F]{64})\s+$([regex]::Escape($archiveName))\s*$" } | Select-Object -First 1
        if (-not $manifestLine) { throw "SHA-256 清单中没有找到 $archiveName。" }
        $expectedHash = [regex]::Match($manifestLine, '^([0-9a-fA-F]{64})').Groups[1].Value.ToLowerInvariant()

        $archivePath = Join-Path $runtimeRoot "$archiveName.download"
        $installPath = Join-Path $runtimeRoot "node-$version-win-$architecture"
        Invoke-WebRequest -UseBasicParsing -Uri "$releaseUrl/$archiveName" -OutFile $archivePath -TimeoutSec 180
        $actualHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actualHash -ne $expectedHash) { throw "Node.js 安装包 SHA-256 校验失败。" }
        Expand-Archive -LiteralPath $archivePath -DestinationPath $runtimeRoot -Force
        Remove-Item -LiteralPath $archivePath -Force

        $nodePath = Join-Path $installPath "node.exe"
        if (-not (Test-Path -LiteralPath $nodePath -PathType Leaf)) { throw "解压后没有找到 node.exe。" }
        $nodeVersion = (& $nodePath --version 2>$null | Select-Object -First 1).Trim()
        Write-Host "已从 $downloadBase 准备 Node.js $nodeVersion（SHA-256 校验通过）"
        break
      } catch {
        if ($archivePath) { Remove-Item -LiteralPath $archivePath -Force -ErrorAction SilentlyContinue }
        $downloadErrors += "${downloadBase}: $($_.Exception.Message)"
        Write-Host "[WARN] 下载源不可用，尝试备用源：$downloadBase（$($_.Exception.Message)）"
        $nodePath = $null
      }
    }
    if (-not $nodePath) { throw "所有 Node.js 下载源均失败：$($downloadErrors -join '；')" }
  } catch {
    Write-Host "[ERROR] 无法自动准备 Node.js：$($_.Exception.Message)"
    Write-Host "请检查网络/代理是否允许访问 Node.js 下载源，以及项目目录是否可写。"
    Read-Host "处理问题后重试；按 Enter 退出"
    exit 1
  }
}

Write-Host "使用 Node.js $nodeVersion ($nodePath)"
$env:PATH = "$(Split-Path -Parent $nodePath);$env:PATH"
& $nodePath (Join-Path $PSScriptRoot "launcher.js")
if ($LASTEXITCODE -ne 0) {
  Write-Host "启动失败。请根据上方诊断信息处理后重试。"
  Read-Host "按 Enter 退出"
}
exit $LASTEXITCODE
