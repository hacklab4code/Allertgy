#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Avvio mobile AllerTgy (backend + Metro)
#
#  Expo Go:
#    bash scripts/avvia-mobile.sh [casa|fuori]
#    Avvia-Mobile.command / Avvia-Mobile-Fuori.command
#
#  Development Build (app AllerTgy installata, no Expo Go):
#    bash scripts/avvia-mobile.sh [casa|fuori] dev
#    Avvia-Mobile-Dev.command / Avvia-Mobile-Dev-Fuori.command
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-casa}"     # casa = stessa WiFi | fuori = Tailscale
CLIENT="${2:-go}"     # go = Expo Go | dev = Development Build

echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║     AllerTgy — Avvio Mobile          ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ── 1. SPEGNI TUTTO (evita blocchi) ──────────────────────────
echo -e "${YELLOW}🧹 Pulizia processi vecchi...${NC}"
pkill -f "expo start" 2>/dev/null || true
pkill -f "npm exec expo" 2>/dev/null || true
pkill -f "expo login" 2>/dev/null || true
pkill -f "uvicorn app.main" 2>/dev/null || true
pkill -f "concurrently" 2>/dev/null || true
sleep 2

bash "$ROOT/scripts/sync-packager-ip.sh" >/dev/null

# ── 2. IP ────────────────────────────────────────────────────
if [ "$MODE" = "fuori" ]; then
  IP=$(tailscale ip -4 2>/dev/null || true)
  if [ -z "$IP" ]; then
    echo -e "${RED}Tailscale non attivo. Apri l'app Tailscale e riprova.${NC}"
    echo -e "Oppure usa: ${BOLD}bash scripts/avvia-mobile.sh casa${NC} (stessa WiFi)"
    exit 1
  fi
  echo -e "${GREEN}📡 Modalità FUORI CASA (Tailscale)${NC}"
else
  IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
  echo -e "${GREEN}🏠 Modalità CASA (stessa WiFi)${NC}"
fi

API_URL="http://${IP}:8000"
EXPO_URL="exp://${IP}:8081"

echo -e "   IP:     ${BOLD}${IP}${NC}"
echo -e "   API:    ${BOLD}${API_URL}${NC}"
echo -e "   Expo:   ${BOLD}${EXPO_URL}${NC}\n"

# ── 3. BACKEND (in background, leggero) ──────────────────────
echo -e "${YELLOW}🐍 Avvio backend...${NC}"
cd "$ROOT/backend"
CORS_ORIGINS='*' .venv/bin/python -m uvicorn app.main:app \
  --host 0.0.0.0 --port 8000 \
  > /tmp/allertgy-backend.log 2>&1 &
BACKEND_PID=$!
cd "$ROOT"

for i in $(seq 1 15); do
  if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend OK${NC}\n"
    break
  fi
  sleep 1
done

# ── 4. EXPO (in primo piano — vedi i log qui) ────────────────
cleanup() {
  echo -e "\n${YELLOW}Arresto...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  exit 0
}
trap cleanup EXIT INT TERM

cd "$ROOT/app-mobile"
export EXPO_PUBLIC_API_URL="$API_URL"
export REACT_NATIVE_PACKAGER_HOSTNAME="$IP"
export RCT_METRO_PORT=8081
export CI=false
export npm_config_cache="$ROOT/app-mobile/.npm_cache"

if [ "$CLIENT" = "dev" ]; then
  DEV_URL="http://${IP}:8081"
  echo -e "${YELLOW}📱 Avvio Development Build (AllerTgy)...${NC}"
  echo -e "${CYAN}────────────────────────────────────────${NC}"
  echo -e "  Apri l'app ${BOLD}AllerTgy${NC} sul telefono (non Expo Go)"
  echo -e "  Metro:  ${BOLD}${DEV_URL}${NC}"
  echo -e "  API:    ${BOLD}${API_URL}${NC}"
  echo -e "  ${RED}IMPORTANTE:${NC} se chiede l'URL, incolla ${BOLD}${DEV_URL}${NC}"
  echo -e "  ${RED}NON usare${NC} 192.168.1.1 (è il router, non il Mac)"
  echo -e "  Prima installazione? ${BOLD}Build-Mobile-Local-iOS.command${NC}"
  echo -e "  ${YELLOW}Premi R${NC} nel terminale = ricarica app"
  echo -e "  ${YELLOW}Premi Ctrl+C${NC} = spegni tutto"
  echo -e "${CYAN}────────────────────────────────────────${NC}\n"
  exec npx expo start --dev-client --lan --port 8081 --clear --max-workers 2
else
  echo -e "${YELLOW}📱 Avvio Expo Go...${NC}"
  echo -e "${CYAN}────────────────────────────────────────${NC}"
  echo -e "  Scansiona con Expo Go: ${BOLD}${EXPO_URL}${NC}"
  echo -e "  ${YELLOW}Premi R${NC} nel terminale = ricarica app"
  echo -e "  ${YELLOW}Premi Ctrl+C${NC} = spegni tutto"
  echo -e "${CYAN}────────────────────────────────────────${NC}\n"
  exec npx expo start --go --lan --clear --max-workers 2
fi
