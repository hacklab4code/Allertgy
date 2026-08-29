#!/bin/bash
# Scrive l'IP del Mac in ios/.xcode.env.local (usato da Xcode e Metro).
# Preferisce Tailscale (funziona fuori casa) → Wi‑Fi → localhost.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TS_IP=$(tailscale ip -4 2>/dev/null || true)
WIFI_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)

if [ "${ALLERTGY_REMOTE:-0}" = "1" ] && [ -n "$TS_IP" ]; then
  IP="$TS_IP"
elif [ -n "$WIFI_IP" ]; then
  IP="$WIFI_IP"
elif [ -n "$TS_IP" ]; then
  IP="$TS_IP"
else
  IP="localhost"
fi

NODE_BIN=$(command -v node)

cat > "$ROOT/app-mobile/ios/.xcode.env.local" <<EOF
export NODE_BINARY=$NODE_BIN
export REACT_NATIVE_PACKAGER_HOSTNAME=$IP
export RCT_METRO_PORT=8081
EOF

# Mantieni .env allineato (API + Metro sullo stesso IP)
printf 'EXPO_PUBLIC_API_URL=http://%s:8000\n' "$IP" > "$ROOT/app-mobile/.env"

echo "$IP"
