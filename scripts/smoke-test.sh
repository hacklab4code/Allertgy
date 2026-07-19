#!/usr/bin/env bash
# Smoke test end-to-end: ristoratore pubblica menù → cliente vede semaforo
# Prerequisiti: backend su :8000 con seed_demo.py già eseguito
set -euo pipefail

API="${API_URL:-http://localhost:8000}"
PASS=0
FAIL=0

ok()   { echo "  ✓ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }

api_login() {
  local email="$1" password="$2"
  local resp http_code
  resp=$(curl -s -w '\n%{http_code}' -X POST "$API/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>/dev/null) || true
  http_code=$(echo "$resp" | tail -1)
  resp=$(echo "$resp" | sed '$d')
  if [ "$http_code" = "200" ] && echo "$resp" | grep -q 'access_token'; then
    echo "$resp"
    return 0
  fi
  if echo "$resp" | grep -q 'Troppe richieste'; then
    sleep 12
    resp=$(curl -s -w '\n%{http_code}' -X POST "$API/auth/login" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>/dev/null) || true
    http_code=$(echo "$resp" | tail -1)
    resp=$(echo "$resp" | sed '$d')
    if [ "$http_code" = "200" ] && echo "$resp" | grep -q 'access_token'; then
      echo "$resp"
      return 0
    fi
  fi
  return 1
}

echo "=== AllerTgy smoke test ==="
echo "API: $API"
echo ""

# 1. Health
if curl -sf "$API/health" | grep -q '"status"'; then
  ok "GET /health"
else
  fail "GET /health"
fi

# 2. Login cliente demo
LOGIN=$(api_login "cliente@allertgy.it" "Cliente123!") || true
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")
if [ -n "$TOKEN" ]; then
  ok "Login cliente demo"
else
  fail "Login cliente demo (esegui: cd backend && python seed_demo.py)"
  echo ""
  echo "Risultato: $PASS ok, $FAIL fail"
  exit 1
fi

AUTH="Authorization: Bearer $TOKEN"

# 3. Allergeni profilo
ALLERGENS=$(curl -sf "$API/profile/allergens" -H "$AUTH") || true
if echo "$ALLERGENS" | grep -q 'latte\|crostacei'; then
  ok "Profilo allergeni caricato"
else
  fail "Profilo allergeni (attesi latte/crostacei nel seed)"
fi

# 4. Menù locale demo 100001
MENU=$(curl -sf "$API/restaurants/100001/menu") || true
DISH_COUNT=$(echo "$MENU" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('piatti',[])))" 2>/dev/null || echo "0")
if [ "$DISH_COUNT" -gt 0 ]; then
  ok "Menù locale 100001 ($DISH_COUNT piatti)"
else
  fail "Menù locale 100001"
fi

# 5. Valutazione semaforo server-side
EVAL=$(curl -sf -X POST "$API/restaurants/100001/menu/evaluate" \
  -H 'Content-Type: application/json' \
  -d '{"allergen_codes":["latte","crostacei"],"intensities":{}}') || true
HAS_VERDICT=$(echo "$EVAL" | python3 -c "
import sys,json
d=json.load(sys.stdin)
ev=d.get('evaluation',[])
print('yes' if ev and 'status' in ev[0] else 'no')
" 2>/dev/null || echo "no")
if [ "$HAS_VERDICT" = "yes" ]; then
  ok "Semaforo menù valutato"
else
  fail "Semaforo menù valutato"
fi

# 6. Preferiti
curl -sf -X POST "$API/restaurants/100001/favorite" -H "$AUTH" -o /dev/null || true
FAVS=$(curl -sf "$API/restaurants/favorites/mine" -H "$AUTH") || true
if echo "$FAVS" | grep -q '100001'; then
  ok "Preferiti sync"
else
  fail "Preferiti sync"
fi

# 7. Login ristoratore
OWNER_LOGIN=$(api_login "ristoratore@allertgy.it" "Ristorante1!") || true
OWNER_TOKEN=$(echo "$OWNER_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")
if [ -n "$OWNER_TOKEN" ]; then
  ok "Login ristoratore demo"
else
  fail "Login ristoratore demo"
fi

# 8. Catalogo allergeni UE
if curl -sf "$API/allergens" | grep -q 'glutine\|gluten'; then
  ok "Catalogo allergeni"
else
  fail "Catalogo allergeni"
fi

echo ""
echo "Risultato: $PASS ok, $FAIL fail"
[ "$FAIL" -eq 0 ]
