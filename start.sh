#!/bin/bash
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18 or newer is required."
  open "https://nodejs.org/en/download/"
  exit 1
fi

node server.js &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT INT TERM
sleep 2
open "http://localhost:5177/"
echo "Banana Canvas is running at http://localhost:5177/"
wait "$SERVER_PID"
