#!/usr/bin/env bash
# Backup MySQL AllerTgy — esegui via cron giornaliero sul VPS.
# Richiede: mysqldump installato, variabili in backend/.env
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/backend/.env}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "File .env non trovato: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d_%H%M%S)
OUT="$BACKUP_DIR/allertgy_${DB_NAME}_${STAMP}.sql.gz"

mysqldump \
  -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
  --single-transaction --routines --triggers \
  "$DB_NAME" | gzip > "$OUT"

find "$BACKUP_DIR" -name 'allertgy_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
echo "Backup creato: $OUT"
