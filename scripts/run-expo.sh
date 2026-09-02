#!/bin/bash
# Metro per Development Build (AllerTgy). Usato da PM2.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Preferisci Wi‑Fi locale (più affidabile). Tailscale solo se ALLERTGY_REMOTE=1
if [ "${ALLERTGY_REMOTE:-0}" = "1" ]; then
  IP=$(tailscale ip -4 2>/dev/null || true)
fi
if [ -z "${IP:-}" ]; then
  IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")
fi

# Scrivi env per Xcode / app
NODE_BIN=$(command -v node)
cat > "$ROOT/app-mobile/ios/.xcode.env.local" <<XEOF
export NODE_BINARY=$NODE_BIN
export REACT_NATIVE_PACKAGER_HOSTNAME=$IP
export RCT_METRO_PORT=8081
XEOF
printf 'EXPO_PUBLIC_API_URL=http://%s:8000\n' "$IP" > "$ROOT/app-mobile/.env"

cd "$ROOT/app-mobile"
export EXPO_PUBLIC_API_URL="http://${IP}:8000"
export REACT_NATIVE_PACKAGER_HOSTNAME="$IP"
export RCT_METRO_PORT=8081
export CI=false
export EXPO_NO_TELEMETRY=1
export npm_config_cache="$ROOT/app-mobile/.npm_cache"
echo "[run-expo] Metro su http://${IP}:8081  API=http://${IP}:8000"
CLIENT_FLAG="--go"
if [ "${ALLERTGY_DEV_CLIENT:-0}" = "1" ]; then
  CLIENT_FLAG="--dev-client"
fi
exec npx expo start $CLIENT_FLAG --lan --port 8081
