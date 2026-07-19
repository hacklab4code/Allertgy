#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IP=$(tailscale ip -4 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || echo "127.0.0.1")
cd "$ROOT/backend"
export CORS_ORIGINS='*'
export PUBLIC_API_URL="http://${IP}:8000"
exec "$ROOT/backend/.venv/bin/python" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
