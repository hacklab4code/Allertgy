#!/bin/bash
cd "$(dirname "$0")"
bash scripts/collega-iphone-dev.sh
read -n 1 -s -r -p "Premi un tasto per chiudere..."
