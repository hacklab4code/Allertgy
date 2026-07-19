#!/usr/bin/env python3
"""Crea prodotti e prezzi Stripe Test Mode per AllerTgy e aggiorna backend/.env.

Uso:
  cd backend
  source .venv/bin/activate
  # Metti STRIPE_SECRET_KEY=sk_test_... in .env oppure:
  STRIPE_SECRET_KEY=sk_test_... python scripts/setup_stripe.py

Richiede account Stripe in Test mode (dashboard.stripe.com).
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_ROOT / ".env"

# Allineato a backend/app/plans.py
CATALOG = [
    {
        "env_key": "STRIPE_PRICE_BASE",
        "plan_code": "base",
        "name": "AllerTgy Base",
        "description": "Semaforo clienti, QR, menù digitale con allergeni (€9/mese)",
        "amount_cents": 900,
        "recurring": "month",
    },
    {
        "env_key": "STRIPE_PRICE_PRO_NOTIFY",
        "plan_code": "pro_notify",
        "name": "AllerTgy Pro",
        "description": "Base + push preferiti, AI illimitata, statistiche (€19/mese)",
        "amount_cents": 1900,
        "recurring": "month",
    },
    {
        "env_key": "STRIPE_PRICE_CUSTOMER_PLUS",
        "plan_code": "customer_plus",
        "name": "AllerTgy Plus Famiglia",
        "description": "Sottoprofili famiglia, scanner illimitato, profili condivisi (€3,99/mese)",
        "amount_cents": 399,
        "recurring": "month",
    },
    {
        "env_key": "STRIPE_PRICE_BOOST",
        "plan_code": "visibility_boost",
        "name": "AllerTgy Boost Visibilità",
        "description": "Visibilità in evidenza per 30 giorni (pagamento unico €9,90)",
        "amount_cents": 990,
        "recurring": None,
    },
]


def load_stripe_key() -> str:
    key = os.environ.get("STRIPE_SECRET_KEY", "").strip()
    if key:
        return key
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if line.startswith("STRIPE_SECRET_KEY="):
                key = line.split("=", 1)[1].strip()
                if key:
                    return key
    print("❌ Manca STRIPE_SECRET_KEY.")
    print("   1. Vai su https://dashboard.stripe.com/test/apikeys")
    print("   2. Copia la chiave segreta (sk_test_...)")
    print("   3. Aggiungila in backend/.env oppure:")
    print("      STRIPE_SECRET_KEY=sk_test_... python scripts/setup_stripe.py")
    sys.exit(1)


def _meta_dict(obj) -> dict:
    meta = getattr(obj, "metadata", None) or {}
    if hasattr(meta, "to_dict"):
        return meta.to_dict()
    return dict(meta) if meta else {}


def find_existing_price(stripe, plan_code: str, amount_cents: int, recurring: str | None) -> str | None:
    """Cerca prodotto/prezzo già creato da questo script (metadata allertgy_plan)."""
    products = stripe.Product.list(limit=100, active=True)
    for product in products.auto_paging_iter():
        meta = _meta_dict(product)
        if meta.get("allertgy_plan") != plan_code:
            continue
        prices = stripe.Price.list(product=product.id, active=True, limit=20)
        for price in prices.data:
            if price.unit_amount != amount_cents:
                continue
            if recurring:
                if price.recurring and price.recurring.interval == recurring:
                    return price.id
            elif price.type == "one_time":
                return price.id
    return None


def create_price(stripe, item: dict) -> str:
    existing = find_existing_price(
        stripe, item["plan_code"], item["amount_cents"], item["recurring"]
    )
    if existing:
        print(f"  ↪ già esistente: {item['name']} → {existing}")
        return existing

    product = stripe.Product.create(
        name=item["name"],
        description=item["description"],
        metadata={"allertgy_plan": item["plan_code"], "app": "allertgy"},
    )
    price_params: dict = {
        "product": product.id,
        "unit_amount": item["amount_cents"],
        "currency": "eur",
    }
    if item["recurring"]:
        price_params["recurring"] = {"interval": item["recurring"]}
    price = stripe.Price.create(**price_params)
    print(f"  ✓ creato: {item['name']} → {price.id}")
    return price.id


def update_env(updates: dict[str, str]) -> None:
    if not ENV_FILE.exists():
        print(f"⚠️  {ENV_FILE} non trovato — stampo i valori da copiare:")
        for k, v in updates.items():
            print(f"{k}={v}")
        return

    text = ENV_FILE.read_text()
    for key, value in updates.items():
        pattern = re.compile(rf"^{re.escape(key)}=.*$", re.MULTILINE)
        replacement = f"{key}={value}"
        if pattern.search(text):
            text = pattern.sub(replacement, text)
        else:
            text = text.rstrip() + f"\n{replacement}\n"

    # Assicura STRIPE_SECRET_KEY presente se passata via env
    sk = os.environ.get("STRIPE_SECRET_KEY", "").strip()
    if sk and not re.search(r"^STRIPE_SECRET_KEY=.+", text, re.MULTILINE):
        text = text.rstrip() + f"\nSTRIPE_SECRET_KEY={sk}\n"
    elif sk:
        text = re.sub(r"^STRIPE_SECRET_KEY=.*$", f"STRIPE_SECRET_KEY={sk}", text, flags=re.MULTILINE)

    ENV_FILE.write_text(text)
    print(f"\n✅ Aggiornato {ENV_FILE}")


def main() -> None:
    key = load_stripe_key()
    if not key.startswith("sk_test_"):
        print("⚠️  Attenzione: la chiave non inizia con sk_test_ — usa Test mode per i test locali.")

    try:
        import stripe
    except ImportError:
        print("❌ Installa stripe: pip install stripe")
        sys.exit(1)

    stripe.api_key = key

    try:
        stripe.Account.retrieve()
        print("Stripe Test mode: connessione OK")
    except Exception as e:
        print(f"❌ Chiave Stripe non valida: {e}")
        sys.exit(1)

    print("\nCreazione prezzi AllerTgy (EUR, Test mode)...\n")
    updates: dict[str, str] = {"STRIPE_SECRET_KEY": key}
    for item in CATALOG:
        price_id = create_price(stripe, item)
        updates[item["env_key"]] = price_id

    update_env(updates)

    print("\nProssimi passi (opzionali per webhook locale):")
    print("  brew install stripe/stripe-cli/stripe   # se non installato")
    print("  stripe login")
    print("  stripe listen --forward-to localhost:8000/billing/webhook")
    print("  # Copia whsec_... in STRIPE_WEBHOOK_SECRET nel .env")


if __name__ == "__main__":
    main()
