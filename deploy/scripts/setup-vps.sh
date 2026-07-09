#!/usr/bin/env bash
# Setup iniziale VPS Ubuntu per AllerTgy (Docker + firewall base).
set -euo pipefail

echo "==> Aggiornamento sistema"
sudo apt-get update && sudo apt-get upgrade -y

echo "==> Installazione Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

echo "==> Firewall (SSH + HTTP + HTTPS)"
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "==> Avvio stack"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."
docker compose up -d --build

echo ""
echo "Prossimi passi:"
echo "1. Punta api.TUO-DOMINIO.it all'IP del VPS"
echo "2. Ottieni certificato SSL:"
echo "   docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d api.TUO-DOMINIO.it --email TUO@EMAIL.it --agree-tos --no-eff-email"
echo "3. Riavvia nginx: docker compose restart nginx"
echo "4. Configura cron backup: 0 3 * * * $SCRIPT_DIR/backup-db.sh"
