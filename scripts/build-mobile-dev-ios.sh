#!/bin/bash
# Build Development iOS su EAS (cloud) — richiede Apple Developer registrato.
set -euo pipefail

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/app-mobile"

echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║  AllerTgy — Build iOS (Dev Client)   ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${YELLOW}Prima di iniziare${NC} (se non l'hai già fatto):"
echo "  1. Apri https://developer.apple.com/register/"
echo "  2. Accedi con demartinolimpia@icloud.com"
echo "  3. Accetta l'accordo Apple Developer (gratis)"
echo "  4. Attendi 2-5 minuti, poi continua qui"
echo ""
echo -e "${YELLOW}Durante la build:${NC}"
echo "  • 2FA Apple: scegli ${BOLD}sms${NC} e tieni il telefono pronto"
echo "  • Rispondi Yes/Continue alle domande EAS"
echo ""
echo -e "${YELLOW}Al termine:${NC} link Install sul telefono → app AllerTgy"
echo ""

export npm_config_cache="$ROOT/app-mobile/.npm_cache"

if ! npx eas build --profile development --platform ios; then
  echo ""
  echo -e "${RED}${BOLD}Build fallita.${NC}"
  echo ""
  echo "Se vedi: ${BOLD}You are not registered as an Apple Developer${NC}"
  echo "  → Completa https://developer.apple.com/register/ e riprova"
  echo ""
  echo "Se vedi: ${BOLD}You have no team / paid Apple Developer account${NC}"
  echo "  → EAS cloud richiede il programma Apple a €99/anno"
  echo "  → PERCORSO GRATIS: installa Xcode (App Store) poi usa:"
  echo "     ${BOLD}Build-Mobile-Local-iOS.command${NC}"
  exit 1
fi

echo ""
echo -e "${CYAN}${BOLD}Build completata o avviata su EAS.${NC}"
echo "Monitor: https://expo.dev/accounts/lerry34534/projects/allertgy/builds"
echo "Poi usa Avvia-Mobile-Dev.command per sviluppare."
