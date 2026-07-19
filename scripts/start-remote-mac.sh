#!/bin/bash
# Doppio click su questo file per avviare AllerTgy in modalità remota.
cd "$(dirname "$0")/.."

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}AllerTgy — Avvio remoto${NC}\n"

if ! (cd app-mobile && CI=false npx expo whoami >/dev/null 2>&1); then
  echo -e "${YELLOW}Login Expo con Google (si apre il browser)...${NC}"
  (cd app-mobile && CI=false npx expo login --sso) || exit 1
fi

echo -e "${GREEN}✅ Expo: $(cd app-mobile && CI=false npx expo whoami)${NC}"

PROJECT_ID=$(node -e "console.log(require('./app-mobile/app.json').expo?.extra?.eas?.projectId||'')" 2>/dev/null)
if [ "$PROJECT_ID" = "INSERISCI_EAS_PROJECT_ID" ] || [ -z "$PROJECT_ID" ]; then
  echo -e "${YELLOW}Collegamento progetto EAS...${NC}"
  (cd app-mobile && CI=false npx eas-cli init) || (cd app-mobile && CI=false npx eas init) || true
fi

pkill -f "concurrently.*BACKEND,WEB,MOBILE" 2>/dev/null || true
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
sleep 1

npm run dev:remote
