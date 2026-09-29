#!/bin/bash

bootstrap_node() {
  local root_dir="$1"
  local system architecture target archive_extension version archive archive_path
  local expected_hash actual_hash candidate node_version major runtime_root index_json
  local candidates=()

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

  index_json="$(curl -fsSL --connect-timeout 15 --max-time 45 https://nodejs.org/dist/index.json)" || {
    echo "[ERROR] 无法访问 nodejs.org。请检查网络后重试；启动器没有修改系统环境。" >&2
    return 1
  }
  version="$(printf '%s\n' "$index_json" | sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\(v22\.[0-9.]*\)".*/\1/p' | head -n 1)"
  if [ -z "$version" ]; then
    echo "[ERROR] 无法从 Node.js 官方版本索引读取 Node.js 22 LTS 版本。" >&2
    return 1
  fi

  archive="node-${version}-${target}.${archive_extension}"
  expected_hash="$(curl -fsSL --connect-timeout 15 --max-time 45 "https://nodejs.org/dist/${version}/SHASUMS256.txt" | awk -v name="$archive" '$2 == name {print $1; exit}')" || {
    echo "[ERROR] 无法读取 Node.js 官方 SHA-256 校验清单。" >&2
    return 1
  }
  if [ -z "$expected_hash" ]; then
    echo "[ERROR] 官方校验清单中没有找到 $archive。" >&2
    return 1
  fi

  mkdir -p "$runtime_root" || {
    echo "[ERROR] 无法写入项目目录：$runtime_root" >&2
    return 1
  }
  archive_path="$runtime_root/${archive}.download"
  if ! curl -fL --retry 2 --connect-timeout 15 --max-time 300 -o "$archive_path" "https://nodejs.org/dist/${version}/${archive}"; then
    rm -f "$archive_path"
    echo "[ERROR] Node.js 下载失败。请检查网络后重试。" >&2
    return 1
  fi

  if command -v shasum >/dev/null 2>&1; then
    actual_hash="$(shasum -a 256 "$archive_path" | awk '{print $1}')"
  elif command -v sha256sum >/dev/null 2>&1; then
    actual_hash="$(sha256sum "$archive_path" | awk '{print $1}')"
  else
    rm -f "$archive_path"
    echo "[ERROR] 找不到 SHA-256 校验工具，拒绝使用未校验的 Node.js 安装包。" >&2
    return 1
  fi
  if [ "$actual_hash" != "$expected_hash" ]; then
    rm -f "$archive_path"
    echo "[ERROR] Node.js 安装包 SHA-256 校验失败，已删除下载文件。" >&2
    return 1
  fi

  if [ "$archive_extension" = "tar.gz" ]; then
    tar -xzf "$archive_path" -C "$runtime_root"
  else
    tar -xJf "$archive_path" -C "$runtime_root"
  fi
  rm -f "$archive_path"

  NODE_BIN="$runtime_root/node-${version}-${target}/bin/node"
  if [ ! -x "$NODE_BIN" ]; then
    echo "[ERROR] 解压完成，但没有找到 Node.js 可执行文件。" >&2
    return 1
  fi
  export PATH="$(dirname "$NODE_BIN"):$PATH"
  node_version="$("$NODE_BIN" --version)"
  echo "已准备 Node.js $node_version ($NODE_BIN)"
}
