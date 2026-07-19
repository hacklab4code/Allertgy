#!/bin/bash
# Sblocca build Xcode quando compare "database is locked".
set -euo pipefail

echo "🛑 Chiudo Xcode e processi build..."
osascript -e 'tell application "Xcode" to quit' 2>/dev/null || true
sleep 2
pkill -9 Xcode 2>/dev/null || true
pkill -9 xcodebuild 2>/dev/null || true
pkill -9 XCBBuildService 2>/dev/null || true
pkill -9 SWBBuildService 2>/dev/null || true
sleep 2

echo "🧹 Cancello DerivedData AllerTgy..."
rm -rf "$HOME/Library/Developer/Xcode/DerivedData/AllerTgy-"*

echo "✅ Fatto. Riapri AllerTgy.xcworkspace e premi ▶ Run (una volta sola)."
