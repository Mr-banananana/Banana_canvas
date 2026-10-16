#!/bin/bash

bootstrap_node() {
  local root_dir="$1"
  local system architecture target archive_extension version archive archive_path
  local expected_hash actual_hash candidate node_version major runtime_root index_json download_base release_url download_error downloaded
  local candidates=()
  local download_bases=(
    "https://nodejs.org/dist"
    "https://npmmirror.com/mirrors/node"
    "https://mirrors.tuna.tsinghua.edu.cn/nodejs-release"
  )

  if command -v node >/dev/null 2>&1; then
    candidates+=("$(command -v node)")
  fi
  candidates+=("/opt/homebrew/bin/node" "/usr/local/bin/node" "/opt/local/bin/node" "$HOME/.volta/bin/node")
  for candidate in "$HOME"/.nvm/versions/node/*/bin/node "$HOME"/.asdf/installs/nodejs/*/bin/node; do
    [ -x "$candidate" ] && candidates+=("$candidate")
  done

  system="$(uname -s)"
  architecture="$(uname -m)"
  case "$system:$architecture" in
    Darwin:arm64|Darwin:aarch64) target="darwin-arm64"; archive_extension="tar.gz" ;;
    Darwin:x86_64|Darwin:amd64) target="darwin-x64"; archive_extension="tar.gz" ;;
    Linux:aarch64|Linux:arm64) target="linux-arm64"; archive_extension="tar.xz" ;;
    Linux:x86_64|Linux:amd64) target="linux-x64"; archive_extension="tar.xz" ;;
    *)
      echo "[ERROR] 暂不支持自动准备 Node.js 的平台：$system $architecture" >&2
      return 1
      ;;
  esac

  runtime_root="$root_dir/.runtime"
  for candidate in "$runtime_root"/node-v*-"$target"/bin/node; do
    [ -x "$candidate" ] && candidates+=("$candidate")
  done

  for candidate in "${candidates[@]}"; do
    [ -x "$candidate" ] || continue
    node_version="$("$candidate" --version 2>/dev/null)" || continue
    major="${node_version#v}"
    major="${major%%.*}"
    case "$major" in ''|*[!0-9]*) continue ;; esac
    if [ "$major" -ge 18 ]; then
      NODE_BIN="$candidate"
      export PATH="$(dirname "$NODE_BIN"):$PATH"
      echo "使用 Node.js $node_version ($NODE_BIN)"
      return 0
    fi
  done

  echo "未找到 Node.js 18+，正在下载 Node.js 22 到项目本地 .runtime 目录..."
  if ! command -v curl >/dev/null 2>&1; then
    echo "[ERROR] 找不到 curl，无法自动下载 Node.js。请安装 Node.js 18+ 后重试。" >&2
    return 1
  fi

  mkdir -p "$runtime_root" || {
    echo "[ERROR] 无法写入项目目录：$runtime_root" >&2
    return 1
  }
  if ! command -v shasum >/dev/null 2>&1 && ! command -v sha256sum >/dev/null 2>&1; then
    echo "[ERROR] 找不到 SHA-256 校验工具，拒绝使用未校验的 Node.js 安装包。" >&2
    return 1
  fi

  downloaded=""
  for download_base in "${download_bases[@]}"; do
    archive_path=""
    download_error="下载请求失败"
    if ! index_json="$(curl -fsSL --connect-timeout 15 --max-time 45 "$download_base/index.json" 2>/dev/null)"; then
      download_error="无法读取版本索引"
    else
      version="$(printf '%s\n' "$index_json" | sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\(v22\.[0-9.]*\)".*/\1/p' | head -n 1)"
      if [ -z "$version" ]; then
        download_error="索引中没有找到 Node.js 22 版本"
      else
        archive="node-${version}-${target}.${archive_extension}"
        release_url="$download_base/$version"
        expected_hash="$(curl -fsSL --connect-timeout 15 --max-time 45 "$release_url/SHASUMS256.txt" 2>/dev/null | awk -v name="$archive" '$2 == name {print $1; exit}')"
        if [ -z "$expected_hash" ]; then
          download_error="SHA-256 清单中没有找到 $archive"
        else
          archive_path="$runtime_root/${archive}.download"
          if ! curl -fL --retry 1 --connect-timeout 15 --max-time 300 -o "$archive_path" "$release_url/$archive"; then
            download_error="安装包下载失败"
          else
            if command -v shasum >/dev/null 2>&1; then
              actual_hash="$(shasum -a 256 "$archive_path" | awk '{print $1}')"
            else
              actual_hash="$(sha256sum "$archive_path" | awk '{print $1}')"
            fi
            if [ "$actual_hash" != "$expected_hash" ]; then
              download_error="SHA-256 校验失败"
            else
              if [ "$archive_extension" = "tar.gz" ]; then
                tar -xzf "$archive_path" -C "$runtime_root" && downloaded="yes" || download_error="解压失败"
              else
                tar -xJf "$archive_path" -C "$runtime_root" && downloaded="yes" || download_error="解压失败"
              fi
            fi
          fi
        fi
      fi
    fi

    if [ -n "$archive_path" ]; then rm -f "$archive_path"; fi
    if [ "$downloaded" = "yes" ]; then
      NODE_BIN="$runtime_root/node-${version}-${target}/bin/node"
      if [ -x "$NODE_BIN" ]; then
        echo "已从 $download_base 准备 Node.js $version（SHA-256 校验通过）"
        break
      fi
      downloaded=""
      download_error="解压后没有找到 Node.js 可执行文件"
    fi
    echo "[WARN] 下载源不可用，尝试备用源：$download_base（$download_error）" >&2
    NODE_BIN=""
  done

  if [ -z "$NODE_BIN" ]; then
    echo "[ERROR] 所有 Node.js 下载源均失败。请检查网络/代理和项目目录写入权限。" >&2
    return 1
  fi

  export PATH="$(dirname "$NODE_BIN"):$PATH"
  node_version="$("$NODE_BIN" --version)"
  echo "已准备 Node.js $node_version ($NODE_BIN)"
}
