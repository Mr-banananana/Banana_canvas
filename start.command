#!/bin/bash
set -e
cd "$(dirname "$0")"
export BANANA_OPEN_BROWSER=1

source "$(dirname "$0")/bootstrap-node.sh"
if ! bootstrap_node "$(cd "$(dirname "$0")" && pwd)"; then
  read -r -p "自动准备 Node.js 失败。处理上方问题后重试；按回车退出。"
  exit 1
fi

if "$NODE_BIN" "$(pwd)/launcher.js"; then
  status=0
else
  status=$?
fi
if [ "$status" -ne 0 ]; then
  read -r -p "启动失败。处理上方问题后重试；按回车退出。"
fi
exit "$status"
