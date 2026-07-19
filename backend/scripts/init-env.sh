#!/usr/bin/env bash
# Crea backend/.env da .env.example con JWT e admin key già generati.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"
EXAMPLE="$ROOT/.env.example"

if [[ -f "$ENV_FILE" ]]; then
  echo "⚠️  $ENV_FILE esiste già — non sovrascrivo."
  echo "   Per rigenerare solo i secret, esegui:"
  echo "   openssl rand -hex 64   # JWT_SECRET"
  echo "   openssl rand -hex 32   # INTERNAL_ADMIN_KEY"
  exit 0
fi

JWT_SECRET=$(openssl rand -hex 64)
ADMIN_KEY=$(openssl rand -hex 32)

cp "$EXAMPLE" "$ENV_FILE"

# macOS e Linux compatibile
if [[ "$(uname)" == "Darwin" ]]; then
  sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
  sed -i '' "s|^INTERNAL_ADMIN_KEY=.*|INTERNAL_ADMIN_KEY=$ADMIN_KEY|" "$ENV_FILE"
else
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
  sed -i "s|^INTERNAL_ADMIN_KEY=.*|INTERNAL_ADMIN_KEY=$ADMIN_KEY|" "$ENV_FILE"
fi

echo "✅ Creato $ENV_FILE"
echo "   JWT_SECRET e INTERNAL_ADMIN_KEY generati automaticamente."
echo ""
echo "   Prossimo passo: compila in .env le sezioni ← COMPILA"
echo "   Poi: python seed_demo.py && uvicorn app.main:app --reload"
