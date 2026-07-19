#!/bin/bash
# Collega iPhone a Metro via USB (localhost:8081) oppure Wi-Fi.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IP=$(bash "$ROOT/scripts/sync-packager-ip.sh")
UDID="00008120-001139E03ED8201E"
DEV_URL="http://${IP}:8081"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}AllerTgy — Collega iPhone${NC}"
echo -e "IP Mac: ${BOLD}${IP}${NC}"
echo -e "Metro:  ${BOLD}${DEV_URL}${NC}\n"

# Metro deve essere attivo (PM2: allertgy-expo)
if ! curl -sf http://127.0.0.1:8081/status >/dev/null 2>&1; then
  echo -e "${YELLOW}Metro non attivo — riavvio PM2...${NC}"
  npx pm2 restart allertgy-expo --update-env
  sleep 5
fi

if ! curl -sf http://127.0.0.1:8081/status >/dev/null 2>&1; then
  echo "ERRORE: Metro non risponde su :8081"
  exit 1
fi
echo -e "${GREEN}✅ Metro OK${NC}"

# USB: inoltra localhost:8081 del telefono → Mac:8081
if command -v iproxy >/dev/null 2>&1; then
  pkill -f "iproxy 8081 8081" 2>/dev/null || true
  sleep 1
  iproxy 8081 8081 >/tmp/allertgy-iproxy.log 2>&1 &
  echo $! >/tmp/allertgy-iproxy.pid
  sleep 1
  echo -e "${GREEN}✅ USB tunnel attivo (localhost:8081)${NC}"
else
  echo -e "${YELLOW}⚠ iproxy non installato — usa Wi-Fi e inserisci ${DEV_URL} manualmente${NC}"
fi

# Apri app con URL corretto (deep link dev client)
ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${DEV_URL}', safe=''))")
DEEPLINK="allertgy://expo-development-client/?url=${ENCODED}"

if xcrun devicectl device process launch \
  --device "$UDID" \
  --payload-url "$DEEPLINK" \
  com.allertgy.app 2>/dev/null; then
  echo -e "${GREEN}✅ App aperta con ${DEV_URL}${NC}"
else
  echo -e "${YELLOW}Apri AllerTgy sul telefono e incolla:${NC} ${BOLD}${DEV_URL}${NC}"
fi

echo ""
echo -e "Se non parte: schermata dev → ${BOLD}Enter URL manually${NC} → ${BOLD}${DEV_URL}${NC}"
