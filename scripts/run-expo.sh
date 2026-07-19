#!/bin/bash
# Metro per Development Build (AllerTgy installata su iPhone). Usato da PM2.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IP=$(bash "$ROOT/scripts/sync-packager-ip.sh")
cd "$ROOT/app-mobile"
export EXPO_PUBLIC_API_URL="http://${IP}:8000"
export REACT_NATIVE_PACKAGER_HOSTNAME="$IP"
export RCT_METRO_PORT=8081
export CI=false
export npm_config_cache="$ROOT/app-mobile/.npm_cache"
exec npx expo start --dev-client --lan --port 8081 --max-workers 2
