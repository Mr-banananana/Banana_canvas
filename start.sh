#!/bin/bash
set -e
cd "$(dirname "$0")"
export PORT="${PORT:-5337}"
export BANANA_OPEN_BROWSER=1

source "$(dirname "$0")/bootstrap-node.sh"
if ! bootstrap_node "$(cd "$(dirname "$0")" && pwd)"; then
  exit 1
fi

"$NODE_BIN" "$(pwd)/launcher.js"
