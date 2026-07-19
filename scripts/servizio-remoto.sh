#!/bin/bash
# Servizio persistente: backend + Expo sempre attivi via Tailscale
set -uo pipefail

ROOT="/Users/m1bookpro/Desktop/allerTgy"
LOG_DIR="$HOME/Library/Logs/AllerTgy"
STATUS_FILE="$LOG_DIR/status.txt"
BACKEND_LOG="$LOG_DIR/backend.log"
EXPO_LOG="$LOG_DIR/expo.log"
SUPERVISOR_LOG="$LOG_DIR/supervisor.log"

TAILSCALE="$(command -v tailscale || echo /usr/local/bin/tailscale)"
NODE="$(command -v node || echo /usr/local/bin/node)"
NPX="$(command -v npx || echo /usr/local/bin/npx)"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$SUPERVISOR_LOG"
}

get_tailscale_ip() {
  "$TAILSCALE" ip -4 2>/dev/null || true
}

pid_alive() {
  local pidfile="$1"
  [ -f "$pidfile" ] || return 1
  local pid
  pid=$(cat "$pidfile" 2>/dev/null) || return 1
  kill -0 "$pid" 2>/dev/null
}

backend_running() {
  curl -sf --max-time 3 http://127.0.0.1:8000/health >/dev/null 2>&1
}

expo_running() {
  curl -sf --max-time 3 http://127.0.0.1:8081/ >/dev/null 2>&1
}

kill_stale() {
  local pattern="$1"
  pkill -f "$pattern" 2>/dev/null || true
  sleep 1
}

start_backend() {
  if backend_running; then return 0; fi
  log "Avvio backend..."
  kill_stale "uvicorn app.main:app"
  cd "$ROOT/backend" || return 1
  CORS_ORIGINS='*' PUBLIC_API_URL="http://$(get_tailscale_ip):8000" \
    "$ROOT/backend/.venv/bin/python" -m uvicorn app.main:app \
    --host 0.0.0.0 --port 8000 \
    >> "$BACKEND_LOG" 2>&1 &
  echo $! > "$LOG_DIR/backend.pid"
  for _ in $(seq 1 20); do
    backend_running && return 0
    sleep 1
  done
  log "ERRORE: backend non partito"
  return 1
}

start_expo() {
  local IP
  IP=$(get_tailscale_ip)
  if [ -z "$IP" ]; then
    log "Tailscale non connesso"
    return 1
  fi
  if expo_running; then return 0; fi
  log "Avvio Expo su $IP..."
  kill_stale "expo start"
  cd "$ROOT/app-mobile" || return 1
  EXPO_PUBLIC_API_URL="http://${IP}:8000" \
  REACT_NATIVE_PACKAGER_HOSTNAME="$IP" \
  RCT_METRO_PORT=8081 \
  CI=false \
  "$NPX" expo start --go --lan --port 8081 --max-workers 2 \
    >> "$EXPO_LOG" 2>&1 &
  echo $! > "$LOG_DIR/expo.pid"
  for _ in $(seq 1 30); do
    expo_running && log "Expo OK su $IP:8081" && return 0
    sleep 1
  done
  log "ERRORE: Expo non partito — controlla $EXPO_LOG"
  return 1
}

write_status() {
  local IP
  IP=$(get_tailscale_ip)
  cat > "$STATUS_FILE" <<EOF
AllerTgy — Servizio remoto attivo
Aggiornato: $(date '+%Y-%m-%d %H:%M:%S')

Tailscale IP:  ${IP:-non connesso}
API:           http://${IP:-?}:8000
Expo Go:       exp://${IP:-?}:8081

Backend:       $(backend_running && echo "OK" || echo "OFF")
Expo Metro:    $(expo_running && echo "OK" || echo "OFF")

Log: $LOG_DIR/
Stop: bash scripts/ferma-servizio-remoto.sh
EOF
}

log "═══ Supervisor AllerTgy avviato (pid $$) ═══"

while true; do
  IP=$(get_tailscale_ip)
  if [ -n "$IP" ]; then
    start_backend || true
    start_expo || true
  else
    log "Tailscale offline — riprovo tra 30s"
  fi
  write_status
  sleep 30
done
