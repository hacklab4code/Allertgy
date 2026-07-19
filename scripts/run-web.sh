#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/dashboard-web"
exec npm run dev -- --host 0.0.0.0 --port 5173
