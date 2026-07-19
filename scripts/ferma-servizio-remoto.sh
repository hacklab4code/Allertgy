#!/bin/bash
# Ferma il servizio remoto permanente
set -euo pipefail

echo "Arresto servizio AllerTgy..."

launchctl bootout "gui/$(id -u)/com.allertgy.remote" 2>/dev/null || true

osascript <<'EOF' 2>/dev/null || true
tell application "System Events"
  try
    delete login item "avvia-servizio.command"
  end try
end tell
EOF

if [ -f "$HOME/Library/Logs/AllerTgy/backend.pid" ]; then
  kill "$(cat "$HOME/Library/Logs/AllerTgy/backend.pid")" 2>/dev/null || true
fi
if [ -f "$HOME/Library/Logs/AllerTgy/expo.pid" ]; then
  kill "$(cat "$HOME/Library/Logs/AllerTgy/expo.pid")" 2>/dev/null || true
fi

pkill -f "Application Support/AllerTgy/servizio-remoto.sh" 2>/dev/null || true
pkill -f "servizio-remoto.sh" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
pkill -f "uvicorn app.main" 2>/dev/null || true

echo "✅ Servizio fermato."
