#!/bin/bash
# ─────────────────────────────────────────────────────────
#  🦋 Sumaiya Tribute — Local Dev Server
#  Auto-opens browser, handles port conflicts, clean exit
# ─────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ──
DEFAULT_PORT=8080
DIR="$(cd "$(dirname "$0")" && pwd)"
PID=""

# ── Colors (disabled if not a terminal) ──
if [ -t 1 ]; then
  BOLD="\033[1m"
  DIM="\033[2m"
  GREEN="\033[32m"
  YELLOW="\033[33m"
  CYAN="\033[36m"
  RED="\033[31m"
  RESET="\033[0m"
else
  BOLD="" DIM="" GREEN="" YELLOW="" CYAN="" RED="" RESET=""
fi

# ── Find an available port ──
find_port() {
  local port=$1
  while ss -tlnp 2>/dev/null | grep -q ":${port} " || \
        lsof -i ":${port}" 2>/dev/null | grep -q LISTEN; do
    port=$((port + 1))
  done
  echo "$port"
}

# ── Detect browser ──
open_browser() {
  local url="$1"
  if command -v xdg-open &>/dev/null; then
    xdg-open "$url" 2>/dev/null &
  elif command -v open &>/dev/null; then
    open "$url" 2>/dev/null &
  elif command -v wslview &>/dev/null; then
    wslview "$url" 2>/dev/null &
  elif command -v start &>/dev/null; then
    start "$url" 2>/dev/null &
  fi
}

# ── Cleanup on exit ──
cleanup() {
  echo ""
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    echo -e "  ${DIM}Stopping server (PID $PID)...${RESET}"
    kill "$PID" 2>/dev/null
    wait "$PID" 2>/dev/null
    echo -e "  ${GREEN}✓ Server stopped.${RESET}"
  fi
  echo ""
}
trap cleanup EXIT INT TERM

# ── Main ──
PORT=$(find_port "$DEFAULT_PORT")
URL="http://localhost:${PORT}/index.html"

# Check that the built page exists
if [ ! -f "$DIR/index.html" ]; then
  echo -e "\n  ${RED}✗ index.html not found in:${RESET}"
  echo -e "  ${DIM}  $DIR${RESET}\n"
  echo -e "  ${YELLOW}  Run 'npm run build' first (builds styles.min.css / app.min.js).${RESET}\n"
  exit 1
fi

echo ""
echo -e "  ${BOLD}🦋 Sumaiya Mehrima Tasnim${RESET}"
echo -e "  ${DIM}────────────────────────────────${RESET}"
echo ""
echo -e "  ${CYAN}🌐 ${URL}${RESET}"
echo ""

if [ "$PORT" != "$DEFAULT_PORT" ]; then
  echo -e "  ${YELLOW}⚠ Port $DEFAULT_PORT busy — using port $PORT${RESET}"
  echo ""
fi

echo -e "  ${DIM}Serving from: $DIR${RESET}"
echo -e "  ${DIM}Press Ctrl+C to stop${RESET}"
echo ""

# Auto-open browser after a short delay
sleep 0.5
open_browser "$URL"

# Run server in foreground
cd "$DIR"
exec python3 server.py "$PORT"
