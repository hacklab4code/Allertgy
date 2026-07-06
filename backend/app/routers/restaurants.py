from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Allergen, Dish, Restaurant
from ..schemas import DishEvaluationOut, DishOut, MenuEvaluationIn, MenuEvaluationOut, MenuOut

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


def dish_to_out(d: Dish) -> DishOut:
    return DishOut(
        id=d.id,
        nome_piatto=d.name,
        descrizione=d.description,
        categoria=d.category,
        prezzo_cents=d.price_cents,
        image_url=d.image_url,
        menu_group=d.menu_group,
        allergeni_contenuti=[
            da.allergen.code for da in d.dish_allergens if da.kind == "contains"
        ],
        allergeni_tracce=[
            da.allergen.code for da in d.dish_allergens if da.kind == "traces"
        ],
    )


def restaurant_to_menu_out(r: Restaurant) -> MenuOut:
    return MenuOut(
        restaurant_id=r.id,
        public_code=r.public_code,
        nome_ristorante=r.name,
        citta=r.city,
        indirizzo=r.address,
        telefono=r.phone,
        email_contatto=r.email_contact,
        orari_apertura=r.opening_hours,
        aggiornato_il=r.menu_updated_at,
        menu_version=r.menu_version or 0,
        menu_legal_confirmed_at=r.menu_legal_confirmed_at,
        menu_legal_version=r.menu_legal_version,
        latitude=r.latitude,
        longitude=r.longitude,
        image_url=r.image_url,
        piatti=[dish_to_out(d) for d in r.dishes if d.is_available],
    )


def _evaluate_dish(
    dish: DishOut,
    allergen_codes: set[str],
    excluded_ingredients: list[str],
) -> DishEvaluationOut:
    diet_codes = {c for c in allergen_codes if c in {"vegano", "vegetariano"}}
    true_allergen_codes = allergen_codes - diet_codes

    match_contenuti = [
        c for c in dish.allergeni_contenuti if c in true_allergen_codes
    ]
    match_tracce = [
        c for c in dish.allergeni_tracce if c in true_allergen_codes
    ]

    diet_mismatches: list[str] = []
    if "vegano" in diet_codes and "vegano" not in dish.allergeni_contenuti:
        diet_mismatches.append("vegano")
    if (
        "vegetariano" in diet_codes
        and "vegetariano" not in dish.allergeni_contenuti
        and "vegano" not in dish.allergeni_contenuti
    ):
        diet_mismatches.append("vegetariano")

    haystack = f"{dish.nome_piatto} {dish.descrizione or ''}".lower()
    match_esclusi = [
        ingredient.strip()
        for ingredient in excluded_ingredients
        if ingredient.strip() and ingredient.strip().lower() in haystack
    ]

    red_matches = match_contenuti + diet_mismatches
    if red_matches or match_esclusi:
        return DishEvaluationOut(
            dish_id=dish.id,
            status="rosso",
            label="non_idoneo",
            match_contenuti=red_matches,
            match_tracce=match_tracce,
            match_esclusi=match_esclusi,
        )
    if match_tracce:
        return DishEvaluationOut(
            dish_id=dish.id,
            status="giallo",
            label="attenzione_tracce",
            match_tracce=match_tracce,
        )
    return DishEvaluationOut(dish_id=dish.id, status="verde", label="compatibile")


def _get_active_restaurant(public_code: str, db: Session) -> Restaurant:
    r = db.scalar(
        select(Restaurant).where(
            Restaurant.public_code == public_code, Restaurant.is_active == 1
        )
    )
    if not r:
        raise HTTPException(404, "Locale non trovato. Controlla il codice.")
    return r


@router.get("/{public_code}/menu", response_model=MenuOut)
def get_menu(public_code: str, db: Session = Depends(get_db)):
    """Endpoint B2C: menù del locale per codice/QR. Pubblico (il semaforo è client-side)."""
    return restaurant_to_menu_out(_get_active_restaurant(public_code, db))


@router.post("/{public_code}/menu/evaluate", response_model=MenuEvaluationOut)
def evaluate_menu(
    public_code: str,
    data: MenuEvaluationIn,
    db: Session = Depends(get_db),
):
    """Valuta un menu pubblico senza account e senza salvare dati sanitari.

    Utile per il futuro flusso QR web: il cliente seleziona allergeni/preferenze
    sul momento e riceve il semaforo personalizzato.
    """
    codes = {c.strip() for c in data.allergen_codes if c.strip()}
    if codes:
        valid_codes = set(db.scalars(select(Allergen.code)).all())
        unknown = codes - valid_codes
        if unknown:
            raise HTTPException(400, f"Codici allergene non validi: {sorted(unknown)}")

    menu = restaurant_to_menu_out(_get_active_restaurant(public_code, db))
    menu_payload = menu.model_dump() if hasattr(menu, "model_dump") else menu.dict()
    return MenuEvaluationOut(
        **menu_payload,
        evaluation=[
            _evaluate_dish(d, codes, data.excluded_ingredients)
            for d in menu.piatti
        ],
    )


@router.get("", response_model=list[MenuOut])
def list_restaurants(db: Session = Depends(get_db)):
    """Endpoint B2C: elenco di tutti i ristoranti attivi per consentire al cliente
    di sfogliarli sulla mappa e calcolarne la sicurezza in base alle proprie allergie."""
    rs = db.scalars(
        select(Restaurant).where(Restaurant.is_active == 1)
    ).all()
    return [restaurant_to_menu_out(r) for r in rs]
