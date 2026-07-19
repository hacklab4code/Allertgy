#!/bin/bash
# Build locale sul tuo iPhone — NO EAS, NO €99. Serve Xcode dall'App Store.
set -euo pipefail

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/app-mobile"

echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║  AllerTgy — Build locale iPhone    ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

if ! xcodebuild -version >/dev/null 2>&1; then
  echo -e "${RED}Xcode non installato.${NC}"
  echo ""
  echo "1. Apri App Store sul Mac"
  echo "2. Cerca ${BOLD}Xcode${NC} → Installa (~12 GB)"
  echo "3. Apri Xcode una volta → accetta licenza"
  echo "4. Rilancia questo script"
  exit 1
fi

echo -e "${YELLOW}Collega l'iPhone al Mac con cavo USB.${NC}"
echo "Sblocca il telefono e premi Fidati se richiesto."
echo ""

export npm_config_cache="$ROOT/app-mobile/.npm_cache"
export CI=false

npx expo prebuild --platform ios --clean
npx expo run:ios --device

echo ""
echo -e "${GREEN}${BOLD}App installata sul telefono.${NC}"
echo "Poi usa Avvia-Mobile-Dev.command per Metro + hot reload."
