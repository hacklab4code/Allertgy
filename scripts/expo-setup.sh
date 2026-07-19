#!/bin/bash
# Setup una tantum: login Expo + collegamento progetto EAS
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/app-mobile"

echo -e "${CYAN}${BOLD}Setup Expo (necessario per Expo Go)${NC}\n"
echo -e "Expo richiede un account gratuito per firmare il manifest dell'app."
echo -e "Se non hai un account: ${BOLD}https://expo.dev/signup${NC}\n"

if CI=false npx expo whoami >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Già loggato come: $(CI=false npx expo whoami)${NC}"
else
  echo -e "${YELLOW}→ Login Expo con Google (si aprirà il browser)...${NC}"
  echo -e "   Completa il login nel browser e torna al Terminale.${NC}\n"
  CI=false npx expo login --sso
fi

PROJECT_ID=$(node -e "const c=require('./app.json'); console.log(c.expo?.extra?.eas?.projectId||'')" 2>/dev/null || echo "")
if [ "$PROJECT_ID" = "INSERISCI_EAS_PROJECT_ID" ] || [ -z "$PROJECT_ID" ]; then
  echo -e "\n${YELLOW}→ Collegamento progetto EAS...${NC}"
  CI=false npx eas init --id 2>/dev/null || CI=false npx eas init
fi

echo -e "\n${GREEN}${BOLD}✅ Setup completato!${NC}"
echo -e "Ora avvia con: ${BOLD}npm run dev:remote${NC} (dal Terminale del Mac)\n"
