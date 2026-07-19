#!/bin/bash
# Avvio stabile con PM2 — si riavvia da solo, sempre
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo -e "${YELLOW}🛑 Fermo vecchi servizi...${NC}"
bash "$ROOT/scripts/ferma-servizio-remoto.sh" 2>/dev/null || true
npx pm2 delete all 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
pkill -f "uvicorn app.main" 2>/dev/null || true
pkill -f "servizio-remoto" 2>/dev/null || true
sleep 2

chmod +x "$ROOT/scripts/run-backend.sh" "$ROOT/scripts/run-expo.sh" "$ROOT/scripts/run-web.sh"

TS_IP=$(tailscale ip -4 2>/dev/null || true)
if [ -z "$TS_IP" ]; then
  echo -e "${RED}Tailscale non attivo. Aprilo e riprova.${NC}"
  exit 1
fi

echo -e "${YELLOW}🚀 Avvio con PM2 (resta sempre acceso)...${NC}"
npx pm2 start ecosystem.config.cjs
npx pm2 save

echo -e "\n${GREEN}${BOLD}✅ Servizio stabile attivo${NC}\n"
echo -e "  Expo Go:  ${BOLD}exp://${TS_IP}:8081${NC}"
echo -e "  API:      ${BOLD}http://${TS_IP}:8000${NC}"
echo -e "  Web:      ${BOLD}http://${TS_IP}:5173${NC}"
echo -e "\n  Stato:    ${BOLD}npx pm2 status${NC}"
echo -e "  Log:      ${BOLD}npx pm2 logs${NC}"
echo -e "  Stop:     ${BOLD}npx pm2 delete all${NC}"

# Auto-avvio ad ogni accensione Mac
STARTUP=$(npx pm2 startup 2>&1 | grep "sudo env" | tail -1 || true)
if [ -n "$STARTUP" ]; then
  echo -e "\n${YELLOW}Per avvio automatico al login Mac, esegui:${NC}"
  echo -e "${BOLD}$STARTUP${NC}"
fi

sleep 15
curl -sf http://127.0.0.1:8000/health >/dev/null && echo -e "\n${GREEN}Backend OK${NC}" || echo -e "\n${RED}Backend in avvio...${NC}"
curl -sf http://127.0.0.1:8081/ >/dev/null && echo -e "${GREEN}Expo OK${NC}" || echo -e "${RED}Expo in avvio (aspetta 30s)...${NC}"

python3 -c "
import urllib.parse, urllib.request
url='exp://${TS_IP}:8081'
qr='https://api.qrserver.com/v1/create-qr-code/?size=300x300&data='+urllib.parse.quote(url)
urllib.request.urlretrieve(qr,'/tmp/allertgy-qr.png')
" 2>/dev/null || true
