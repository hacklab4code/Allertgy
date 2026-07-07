#!/bin/bash

# --- COLOR DEFINITIONS ---
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;m' # No Color
BOLD='\033[1m'

echo -e "${CYAN}${BOLD}======================================================"
echo -e "         🥗 AllerTgy - Unified Dev Runner 🥗"
echo -e "======================================================${NC}\n"

# 1. Detect macOS Local IP
echo -e "${YELLOW}🔍 Rilevamento IP locale del tuo Mac...${NC}"
LOCAL_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
    echo -e "${RED}⚠️  Impossibile determinare l'IP locale. L'app mobile userà 'localhost' (funzionerà solo su simulatori).${NC}"
else
    echo -e "${GREEN}✅ IP locale rilevato: ${BOLD}$LOCAL_IP${NC}"
    echo -e "${GREEN}📱 L'app mobile si collegherà al backend su: ${BOLD}http://$LOCAL_IP:8000${NC}\n"
fi

# 2. Check Backend Virtual Environment
echo -e "${YELLOW}🐍 Verifica ambiente Python (Backend)...${NC}"
if [ ! -d "backend/.venv" ]; then
    echo -e "${CYAN}Creazione ambiente virtuale in backend/.venv...${NC}"
    python3 -m venv backend/.venv
    echo -e "${CYAN}Installazione dipendenze backend...${NC}"
    backend/.venv/bin/pip install -r backend/requirements.txt
else
    echo -e "${GREEN}✅ Ambiente Python (.venv) esistente.${NC}"
fi

# 3. Check Dashboard Web Node Modules
echo -e "${YELLOW}🌐 Verifica moduli Node (Dashboard Web)...${NC}"
if [ ! -d "dashboard-web/node_modules" ]; then
    echo -e "${CYAN}Installazione dipendenze dashboard-web...${NC}"
    (cd dashboard-web && npm install)
else
    echo -e "${GREEN}✅ Dipendenze Dashboard Web installate.${NC}"
fi

# 4. Check Mobile App Node Modules
echo -e "${YELLOW}📱 Verifica moduli Node (App Mobile)...${NC}"
if [ ! -d "app-mobile/node_modules" ]; then
    echo -e "${CYAN}Installazione dipendenze app-mobile...${NC}"
    (cd app-mobile && npm install)
else
    echo -e "${GREEN}✅ Dipendenze App Mobile installate.${NC}"
fi

# 5. Check Root Workspace Node Modules for concurrently
echo -e "${YELLOW}📁 Verifica pacchetti radice per il runner...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}Installazione dipendenze radice (concurrently)...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Dipendenze radice installate.${NC}"
fi

echo -e "\n${GREEN}${BOLD}🚀 Avvio di tutti i servizi in corso...${NC}"
echo -e "${CYAN}------------------------------------------------------"
echo -e "  - Backend API:       ${BOLD}http://localhost:8000${NC} (Docs: /docs)"
echo -e "  - Dashboard Web:     ${BOLD}http://localhost:5173${NC}"
echo -e "  - Mobile Metro:      ${BOLD}http://localhost:8081${NC}"
echo -e "${CYAN}------------------------------------------------------${NC}\n"
echo -e "${YELLOW}Premi Ctrl+C per fermare tutti i servizi contemporaneamente.${NC}\n"

# Export the variables so they are available in concurrently processes
export EXPO_PUBLIC_API_URL="http://$LOCAL_IP:8000"

# Run concurrently
npm run dev
