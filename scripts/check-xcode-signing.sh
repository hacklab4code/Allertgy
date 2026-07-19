#!/bin/bash
# Verifica che Xcode sia pronto per installare su iPhone.
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}Controllo firma Xcode...${NC}\n"

IDENTITIES=$(security find-identity -v -p codesigning 2>/dev/null | grep -c "Apple Development" || true)
PROFILES_DIR="$HOME/Library/MobileDevice/Provisioning Profiles"

if [ "$IDENTITIES" -gt 0 ]; then
  echo -e "${GREEN}✅ Certificato Apple Development trovato${NC}"
  security find-identity -v -p codesigning | grep "Apple Development" || true
else
  echo -e "${RED}❌ Nessun certificato — devi completare la firma in Xcode${NC}"
fi

if [ -d "$PROFILES_DIR" ] && [ "$(ls -A "$PROFILES_DIR" 2>/dev/null | wc -l)" -gt 0 ]; then
  echo -e "${GREEN}✅ Profili di provisioning presenti${NC}"
else
  echo -e "${RED}❌ Nessun profilo provisioning${NC}"
fi

if grep -q "DEVELOPMENT_TEAM" "$HOME/Desktop/allerTgy/app-mobile/ios/AllerTgy.xcodeproj/project.pbxproj" 2>/dev/null; then
  echo -e "${GREEN}✅ Team impostato nel progetto${NC}"
else
  echo -e "${RED}❌ Team NON salvato nel progetto AllerTgy${NC}"
fi

echo ""
if [ "$IDENTITIES" -gt 0 ]; then
  echo -e "${GREEN}${BOLD}Pronto! Esegui Build-Mobile-Local-iOS.command${NC}"
  exit 0
fi

echo -e "${YELLOW}${BOLD}Fai ORA in Xcode (si aprirà tra poco):${NC}"
echo "  1. Xcode → Settings → Accounts → + → Apple ID"
echo "     Accedi: demartinolimpia@icloud.com"
echo "  2. Progetto AllerTgy (icona blu) → target AllerTgy"
echo "  3. Signing & Capabilities → ✅ Automatically manage signing"
echo "  4. Team → scegli il tuo Personal Team"
echo "  5. Se compare errore bundle ID → cambia in com.allertgy.matteo"
echo ""
echo "Poi rilancia: bash scripts/check-xcode-signing.sh"

open /Users/m1bookpro/Desktop/allerTgy/app-mobile/ios/AllerTgy.xcworkspace
exit 1
