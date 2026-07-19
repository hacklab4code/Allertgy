#!/bin/bash
# AllerTgy — avvio con accesso remoto (Mac come "VPS" personale)
# Uso: bash scripts/dev-remote.sh [tailscale|ngrok|cloudflare]
set -euo pipefail

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-tailscale}"
TUNNEL_PID=""
NGROK_PID=""
CLOUDFLARE_PID=""

cleanup() {
  echo -e "\n${YELLOW}Arresto tunnel e servizi...${NC}"
  [ -n "$TUNNEL_PID" ] && kill "$TUNNEL_PID" 2>/dev/null || true
  [ -n "$NGROK_PID" ] && kill "$NGROK_PID" 2>/dev/null || true
  [ -n "$CLOUDFLARE_PID" ] && kill "$CLOUDFLARE_PID" 2>/dev/null || true
  pkill -f "concurrently.*BACKEND,WEB,MOBILE" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

detect_local_ip() {
  ipconfig getifaddr en0 2>/dev/null \
    || ipconfig getifaddr en1 2>/dev/null \
    || ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1
}

wait_for_url() {
  local pattern="$1"
  local file="$2"
  local timeout="${3:-45}"
  local i=0
  while [ "$i" -lt "$timeout" ]; do
    if [ -f "$file" ]; then
      local url
      url=$(grep -Eo "$pattern" "$file" | head -n 1 || true)
      if [ -n "$url" ]; then
        echo "$url"
        return 0
      fi
    fi
    sleep 1
    i=$((i + 1))
  done
  return 1
}

echo -e "${CYAN}${BOLD}======================================================"
echo -e "    AllerTgy — Accesso remoto (Mac come VPS)"
echo -e "======================================================${NC}\n"

API_URL=""
EXPO_MODE="lan"
REACT_NATIVE_PACKAGER_HOSTNAME=""

case "$MODE" in
  tailscale)
    if ! command -v tailscale >/dev/null 2>&1; then
      echo -e "${RED}Tailscale non installato.${NC}"
      echo -e "Installa con: ${BOLD}brew install --cask tailscale${NC}"
      echo -e "Poi avvia l'app Tailscale, fai login e rilancia questo script."
      exit 1
    fi
    TS_IP=$(tailscale ip -4 2>/dev/null || true)
    if [ -z "$TS_IP" ]; then
      echo -e "${RED}Tailscale non connesso.${NC} Apri l'app Tailscale e accedi al tuo account."
      exit 1
    fi
    API_URL="http://${TS_IP}:8000"
    REACT_NATIVE_PACKAGER_HOSTNAME="$TS_IP"
    EXPO_MODE="lan"
    echo -e "${GREEN}✅ Tailscale attivo — IP: ${BOLD}${TS_IP}${NC}"
    echo -e "${CYAN}📱 Sul telefono: installa Tailscale e accedi allo stesso account.${NC}"
    ;;

  ngrok)
    if ! command -v ngrok >/dev/null 2>&1; then
      echo -e "${RED}ngrok non installato.${NC} Installa con: brew install ngrok"
      exit 1
    fi
    if ! ngrok config check >/dev/null 2>&1; then
      echo -e "${RED}ngrok non configurato.${NC}"
      echo -e "1. Crea account su https://ngrok.com"
      echo -e "2. Esegui: ${BOLD}ngrok config add-authtoken <TOKEN>${NC}"
      exit 1
    fi
    LOG="/tmp/allertgy-ngrok.log"
    : > "$LOG"
    ngrok http 8000 --log=stdout > "$LOG" 2>&1 &
    NGROK_PID=$!
    API_URL=$(wait_for_url 'https://[a-z0-9.-]+\.ngrok-free\.app' "$LOG" 60 || true)
    if [ -z "$API_URL" ]; then
      API_URL=$(wait_for_url 'https://[a-z0-9.-]+\.ngrok\.io' "$LOG" 15 || true)
    fi
    if [ -z "$API_URL" ]; then
      echo -e "${RED}Impossibile ottenere URL ngrok. Controlla $LOG${NC}"
      exit 1
    fi
    EXPO_MODE="tunnel"
    echo -e "${GREEN}✅ Tunnel ngrok API: ${BOLD}${API_URL}${NC}"
    echo -e "${YELLOW}⚠️  L'URL ngrok cambia a ogni riavvio (piano gratuito).${NC}"
    ;;

  cloudflare)
    if ! command -v cloudflared >/dev/null 2>&1; then
      echo -e "${YELLOW}Installazione cloudflared...${NC}"
      brew install cloudflared
    fi
    LOG="/tmp/allertgy-cloudflare.log"
    : > "$LOG"
    cloudflared tunnel --url http://localhost:8000 > "$LOG" 2>&1 &
    CLOUDFLARE_PID=$!
    API_URL=$(wait_for_url 'https://[a-z0-9.-]+\.trycloudflare\.com' "$LOG" 60 || true)
    if [ -z "$API_URL" ]; then
      echo -e "${RED}Impossibile ottenere URL Cloudflare. Controlla $LOG${NC}"
      exit 1
    fi
    EXPO_MODE="tunnel"
    echo -e "${GREEN}✅ Tunnel Cloudflare API: ${BOLD}${API_URL}${NC}"
    echo -e "${YELLOW}⚠️  L'URL cambia a ogni riavvio (quick tunnel).${NC}"
    ;;

  *)
    echo -e "${RED}Modalità sconosciuta: $MODE${NC}"
    echo -e "Uso: bash scripts/dev-remote.sh [tailscale|ngrok|cloudflare]"
    exit 1
    ;;
esac

# Expo Go richiede login per firmare il manifest
if ! (cd app-mobile && CI=false npx expo whoami >/dev/null 2>&1); then
  echo -e "${RED}❌ Non sei loggato su Expo.${NC}"
  echo -e "Esegui nel ${BOLD}Terminale del Mac${NC} (non da Cursor):"
  echo -e "  ${BOLD}bash scripts/expo-setup.sh${NC}"
  echo -e "Poi riavvia con: ${BOLD}npm run dev:remote${NC}\n"
  exit 1
fi

LOCAL_IP=$(detect_local_ip || echo "localhost")

export EXPO_PUBLIC_API_URL="$API_URL"
export REACT_NATIVE_PACKAGER_HOSTNAME="${REACT_NATIVE_PACKAGER_HOSTNAME:-$LOCAL_IP}"
export CORS_ORIGINS="*"
export PUBLIC_API_URL="$API_URL"

echo -e "\n${CYAN}------------------------------------------------------${NC}"
echo -e "  Modalità:     ${BOLD}$MODE${NC}"
echo -e "  API remota:   ${BOLD}$API_URL${NC}"
echo -e "  Expo:         ${BOLD}$EXPO_MODE${NC}"
echo -e "  Backend:      http://localhost:8000"
echo -e "  Dashboard:    http://localhost:5173"
echo -e "${CYAN}------------------------------------------------------${NC}\n"

if [ "$MODE" = "tailscale" ]; then
  echo -e "${GREEN}QR Expo Go:${NC} exp://${REACT_NATIVE_PACKAGER_HOSTNAME}:8081"
  echo -e "${YELLOW}Il Mac deve restare acceso e connesso a internet.${NC}\n"
  EXPO_SCRIPT="start"
else
  echo -e "${GREEN}Expo userà il tunnel integrato (funziona anche fuori casa).${NC}\n"
  EXPO_SCRIPT="start:tunnel"
fi

if [ ! -d "node_modules" ]; then npm install; fi

npx concurrently \
  --names "BACKEND,WEB,MOBILE" \
  -c "magenta.bold,cyan.bold,green.bold" \
  "cd backend && CORS_ORIGINS='*' PUBLIC_API_URL='$API_URL' .venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" \
  "cd dashboard-web && npm run dev" \
  "cd app-mobile && EXPO_PUBLIC_API_URL='$API_URL' REACT_NATIVE_PACKAGER_HOSTNAME='$REACT_NATIVE_PACKAGER_HOSTNAME' CI=false npm run $EXPO_SCRIPT"
