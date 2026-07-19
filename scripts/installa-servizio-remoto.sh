#!/bin/bash
# Installa servizio remoto permanente (parte ad ogni accensione Mac)
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$HOME/Library/Logs/AllerTgy"
SUPPORT_DIR="$HOME/Library/Application Support/AllerTgy"
LOGIN_ITEM="$SUPPORT_DIR/avvia-servizio.command"

echo -e "${YELLOW}Installazione servizio remoto AllerTgy...${NC}\n"

if ! command -v tailscale >/dev/null 2>&1; then
  echo -e "${RED}Tailscale non installato.${NC}"
  exit 1
fi

TS_IP=$(tailscale ip -4 2>/dev/null || true)
if [ -z "$TS_IP" ]; then
  echo -e "${RED}Tailscale non connesso.${NC} Apri Tailscale e riprova."
  exit 1
fi

if ! (cd "$ROOT/app-mobile" && CI=false npx expo whoami >/dev/null 2>&1); then
  echo -e "${RED}Expo non loggato.${NC} Esegui: bash scripts/expo-setup.sh"
  exit 1
fi

bash "$ROOT/scripts/ferma-servizio-remoto.sh" 2>/dev/null || true

mkdir -p "$LOG_DIR" "$SUPPORT_DIR"
cp "$ROOT/scripts/servizio-remoto.sh" "$SUPPORT_DIR/servizio-remoto.sh"
cp "$ROOT/scripts/ferma-servizio-remoto.sh" "$SUPPORT_DIR/ferma-servizio-remoto.sh"
chmod +x "$SUPPORT_DIR/servizio-remoto.sh"
chmod +x "$SUPPORT_DIR/ferma-servizio-remoto.sh"
chmod +x "$LOGIN_ITEM"

# Aggiungi a Login Items (parte ad ogni accensione Mac)
osascript <<EOF 2>/dev/null || true
tell application "System Events"
  set itemPath to POSIX file "$LOGIN_ITEM"
  try
    delete login item "avvia-servizio.command"
  end try
  make login item at end with properties {path:itemPath, hidden:true}
end tell
EOF

# Avvia subito
bash "$LOGIN_ITEM"
sleep 20

echo -e "\n${GREEN}${BOLD}✅ Servizio remoto SEMPRE ATTIVO${NC}\n"
echo -e "  Si riavvia da solo ad ogni accensione del Mac"
echo -e "  Tailscale IP:  ${BOLD}$TS_IP${NC}"
echo -e "  Expo Go:       ${BOLD}exp://$TS_IP:8081${NC}"
echo -e "  API:           ${BOLD}http://$TS_IP:8000${NC}"
echo -e "\n  Stato:  ${BOLD}npm run servizio:stato${NC}"
echo -e "  Stop:   ${BOLD}bash scripts/ferma-servizio-remoto.sh${NC}"
echo -e "\n${YELLOW}Mac acceso + Tailscale attivo sul telefono = app sempre raggiungibile${NC}"

python3 -c "
import urllib.parse, urllib.request
url = 'exp://$TS_IP:8081'
qr = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + urllib.parse.quote(url)
urllib.request.urlretrieve(qr, '/tmp/allertgy-servizio-qr.png')
" 2>/dev/null || true

if [ -f "$LOG_DIR/status.txt" ]; then
  echo ""
  cat "$LOG_DIR/status.txt"
fi
