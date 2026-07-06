"""Crea i dati demo di AllerTgy: due account + locale con menù completo.

Esegui dalla cartella backend (con il venv attivo e il DB raggiungibile):

    python seed_demo.py

Account creati (idempotente: se esistono già, non li duplica):

  CLIENTE      cliente@allertgy.it      password: Cliente123!
               allergie: latte, crostacei

  RISTORATORE  ristoratore@allertgy.it  password: Ristorante1!
               locale: "Trattoria Da Matteo" (codice 100001) con 8 piatti
"""
from app.database import SessionLocal
from app.legal import LEGAL_TERMS_VERSION, MENU_CONFIRMATION_VERSION, PRIVACY_VERSION, SAFETY_DISCLAIMER_VERSION
from app.models import Allergen, Dish, DishAllergen, Restaurant, User, UserAllergen
from app.security import hash_password

MENU = [
    # (nome, descrizione, categoria, prezzo_cents, contenuti, tracce)
    ("Bruschette al pomodoro", "Pane tostato, pomodoro, basilico", "Antipasti", 500,
     ["glutine"], []),
    ("Insalata di mare", "Polpo, gamberi, sedano", "Antipasti", 1400,
     ["molluschi", "crostacei", "sedano"], ["pesce"]),
    ("Spaghetti alla carbonara", "Guanciale, uova, pecorino", "Primi", 1200,
     ["glutine", "uova", "latte"], []),
    ("Risotto alla milanese", "Zafferano, burro, parmigiano", "Primi", 1300,
     ["latte"], ["sedano"]),
    ("Frittura di calamari", "Calamari, farina di grano", "Secondi", 1500,
     ["molluschi", "glutine"], ["crostacei", "pesce"]),
    ("Tagliata di manzo", "Manzo, rucola, olio EVO", "Secondi", 1800,
     [], []),
    ("Grigliata di verdure", "Verdure di stagione, olio EVO", "Contorni", 700,
     [], ["solfiti"]),
    ("Tiramisù", "Mascarpone, savoiardi, caffè", "Dolci", 600,
     ["glutine", "uova", "latte"], ["frutta_a_guscio"]),
]


def main() -> None:
    db = SessionLocal()
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    allergens = {a.code: a for a in db.query(Allergen).all()}
    if not allergens:
        raise SystemExit("Tabella allergens vuota: esegui prima database/schema.sql")

    # ---- cliente demo ----
    cliente = db.query(User).filter_by(email="cliente@allertgy.it").first()
    if not cliente:
        cliente = User(
            email="cliente@allertgy.it",
            password_hash=hash_password("Cliente123!"),
            display_name="Cliente Demo",
            role="customer",
            terms_accepted_at=now,
            privacy_accepted_at=now,
            health_data_consent_at=now,
            legal_terms_version=LEGAL_TERMS_VERSION,
            privacy_version=PRIVACY_VERSION,
            disclaimer_accepted_at=now,
            safety_disclaimer_version=SAFETY_DISCLAIMER_VERSION,
            onboarding_completed_at=now,
        )
        db.add(cliente)
        db.flush()
        for code in ("latte", "crostacei"):
            db.add(UserAllergen(user_id=cliente.id, allergen_id=allergens[code].id))
        print("✅ creato cliente@allertgy.it (allergie: latte, crostacei)")
    else:
        print("• cliente@allertgy.it esiste già")
        cliente.terms_accepted_at = cliente.terms_accepted_at or now
        cliente.privacy_accepted_at = cliente.privacy_accepted_at or now
        cliente.health_data_consent_at = cliente.health_data_consent_at or now
        cliente.legal_terms_version = cliente.legal_terms_version or LEGAL_TERMS_VERSION
        cliente.privacy_version = cliente.privacy_version or PRIVACY_VERSION
        cliente.disclaimer_accepted_at = cliente.disclaimer_accepted_at or now
        cliente.safety_disclaimer_version = cliente.safety_disclaimer_version or SAFETY_DISCLAIMER_VERSION
        cliente.onboarding_completed_at = cliente.onboarding_completed_at or now

    # ---- ristoratore demo ----
    owner = db.query(User).filter_by(email="ristoratore@allertgy.it").first()
    if not owner:
        owner = User(
            email="ristoratore@allertgy.it",
            password_hash=hash_password("Ristorante1!"),
            display_name="Matteo Ristoratore",
            role="owner",
            terms_accepted_at=now,
            privacy_accepted_at=now,
            legal_terms_version=LEGAL_TERMS_VERSION,
            privacy_version=PRIVACY_VERSION,
        )
        db.add(owner)
        db.flush()
        print("✅ creato ristoratore@allertgy.it")
    else:
        print("• ristoratore@allertgy.it esiste già")
        owner.terms_accepted_at = owner.terms_accepted_at or now
        owner.privacy_accepted_at = owner.privacy_accepted_at or now
        owner.legal_terms_version = owner.legal_terms_version or LEGAL_TERMS_VERSION
        owner.privacy_version = owner.privacy_version or PRIVACY_VERSION

    # ---- locale demo (assegnato al ristoratore) ----
    rest = db.query(Restaurant).filter_by(public_code="100001").first()
    if not rest:
        rest = Restaurant(
            public_code="100001",
            name="Trattoria Da Matteo",
            city="Milano",
            latitude=45.4642,
            longitude=9.1900,
            image_url="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&h=200&q=80"
        )
        db.add(rest)
        db.flush()
        print("✅ creato locale 100001 — Trattoria Da Matteo")
    else:
        rest.latitude = rest.latitude or 45.4642
        rest.longitude = rest.longitude or 9.1900
        rest.image_url = rest.image_url or "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&h=200&q=80"
    rest.owner_user_id = owner.id
    rest.business_plan = "pro"
    rest.subscription_status = "comped"
    rest.plan_price_cents = 0
    rest.is_verified = 1
    rest.commercial_notes = rest.commercial_notes or "Demo: piano Pro omaggio per testare menu, QR e registro allergeni."

    if not rest.dishes:
        for nome, desc, cat, prezzo, contenuti, tracce in MENU:
            dish = Dish(restaurant_id=rest.id, name=nome, description=desc,
                        category=cat, price_cents=prezzo)
            db.add(dish)
            db.flush()
            for c in contenuti:
                db.add(DishAllergen(dish_id=dish.id, allergen_id=allergens[c].id, kind="contains"))
            for c in tracce:
                db.add(DishAllergen(dish_id=dish.id, allergen_id=allergens[c].id, kind="traces"))
        rest.menu_updated_at = now
        rest.menu_version = rest.menu_version or 1
        rest.menu_legal_confirmed_at = rest.menu_legal_confirmed_at or now
        rest.menu_legal_confirmed_by = owner.id
        rest.menu_legal_version = rest.menu_legal_version or MENU_CONFIRMATION_VERSION
        print(f"✅ inseriti {len(MENU)} piatti nel menù")
    else:
        print(f"• il locale ha già {len(rest.dishes)} piatti")
        rest.menu_updated_at = rest.menu_updated_at or now
        rest.menu_version = rest.menu_version or 1
        rest.menu_legal_confirmed_at = rest.menu_legal_confirmed_at or now
        rest.menu_legal_confirmed_by = rest.menu_legal_confirmed_by or owner.id
        rest.menu_legal_version = rest.menu_legal_version or MENU_CONFIRMATION_VERSION

    db.commit()
    db.close()
    print("\nFatto! Credenziali demo:")
    print("  Cliente:      cliente@allertgy.it / Cliente123!")
    print("  Ristoratore:  ristoratore@allertgy.it / Ristorante1!")
    print("  Codice locale: 100001")


if __name__ == "__main__":
    main()
