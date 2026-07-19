#!/usr/bin/env bash
# Inoltra webhook Stripe Test → backend locale (tenere questo terminale aperto durante i test pagamenti).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/backend/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Manca backend/.env"
  exit 1
fi

SK=$(grep '^STRIPE_SECRET_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
if [[ -z "$SK" ]]; then
  echo "❌ STRIPE_SECRET_KEY non impostata in backend/.env"
  exit 1
fi

API_URL="${WEBHOOK_FORWARD_URL:-http://localhost:8000/billing/webhook}"

echo "Stripe webhook → $API_URL"
echo "Premi Ctrl+C per fermare."
echo ""

stripe listen --api-key "$SK" --forward-to "$API_URL"
