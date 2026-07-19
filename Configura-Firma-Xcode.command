#!/bin/bash
osascript <<'EOF'
display dialog "FIRMA XCODE — 3 passi:

1) Xcode → Settings (⌘,) → Accounts
   Aggiungi Apple ID: demartinolimpia@icloud.com
   Deve comparire 'Personal Team'

2) Progetto AllerTgy → target AllerTgy
   Tab Signing & Capabilities
   Team: NON lasciare vuoto!
   Scegli il tuo Personal Team dal menu

3) Premi ⌘S per salvare, poi ▶ Run

Gli altri avvisi (maps, hermes) puoi ignorarli." buttons {"OK"} default button 1 with title "AllerTgy — Firma"
EOF
open /Users/m1bookpro/Desktop/allerTgy/app-mobile/ios/AllerTgy.xcworkspace
