from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Allergen, Dish, Restaurant, Review, User, UserFavorite
from ..schemas import (
    DishEvaluationOut,
    DishOut,
    MenuEvaluationIn,
    MenuEvaluationOut,
    MenuOut,
    PhotoOut,
    PublicRestaurantOut,
)
from ..security import get_current_user
from ..services import storage

router = APIRouter(prefix="/restaurants", tags=["restaurants"])

MENU_PLANS = {"verified", "pro", "premium"}
MENU_ACCESS_STATUSES = {"trialing", "active", "comped"}


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


@router.get("/{code_or_slug}/public", response_model=PublicRestaurantOut)
def public_restaurant_page(code_or_slug: str, db: Session = Depends(get_db)):
    """Pagina pubblica del locale, senza login: per /r/{slug} sulla dashboard web.

    Il dettaglio allergeni per piatto è visibile solo con piano Pro/Premium attivo
    (coerente col gating dell'editor menù).
    """
    r = db.scalar(
        select(Restaurant).where(
            (Restaurant.slug == code_or_slug) | (Restaurant.public_code == code_or_slug),
            Restaurant.is_active == 1,
        )
    )
    if not r:
        raise HTTPException(404, "Locale non trovato")

    rating_avg, rating_count = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.restaurant_id == r.id, Review.is_hidden == 0
        )
    ).one()

    has_menu_plan = (
        (r.business_plan or "free") in MENU_PLANS
        and (r.subscription_status or "free") in MENU_ACCESS_STATUSES
    ) or r.subscription_status == "comped"
    menu_available = bool(has_menu_plan and (r.menu_version or 0) > 0)

    return PublicRestaurantOut(
        public_code=r.public_code,
        slug=r.slug,
        name=r.name,
        city=r.city,
        address=r.address,
        latitude=r.latitude,
        longitude=r.longitude,
        phone=r.phone,
        website=r.website,
        description=r.description,
        opening_hours=r.opening_hours,
        image_url=r.image_url,
        photos=[
            PhotoOut(
                id=p.id,
                url=storage.signed_url(p.storage_key, 3600),
                is_cover=bool(p.is_cover),
                sort_order=p.sort_order,
            )
            for p in r.photos
        ],
        business_plan=r.business_plan or "free",
        is_verified=bool(r.is_verified),
        rating_avg=round(float(rating_avg), 1) if rating_avg is not None else None,
        rating_count=int(rating_count or 0),
        menu_available=menu_available,
        piatti=[dish_to_out(d) for d in r.dishes if d.is_available] if menu_available else [],
    )


# ---------- Preferiti (server-side, per notifiche menù aggiornato) ----------

@router.get("/favorites/mine", response_model=list[str])
def my_favorites(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Codici pubblici dei locali preferiti dell'utente (per sincronizzare l'app)."""
    return list(db.scalars(
        select(Restaurant.public_code)
        .join(UserFavorite, UserFavorite.restaurant_id == Restaurant.id)
        .where(UserFavorite.user_id == user.id)
    ).all())


@router.post("/{public_code}/favorite", status_code=204)
def add_favorite(
    public_code: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = _get_active_restaurant(public_code, db)
    if not db.get(UserFavorite, (user.id, r.id)):
        db.add(UserFavorite(user_id=user.id, restaurant_id=r.id))
        db.commit()


@router.delete("/{public_code}/favorite", status_code=204)
def remove_favorite(
    public_code: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = _get_active_restaurant(public_code, db)
    fav = db.get(UserFavorite, (user.id, r.id))
    if fav:
        db.delete(fav)
        db.commit()


@router.get("", response_model=list[MenuOut])
def list_restaurants(db: Session = Depends(get_db)):
    """Endpoint B2C: elenco di tutti i ristoranti attivi per consentire al cliente
    di sfogliarli sulla mappa e calcolarne la sicurezza in base alle proprie allergie."""
    rs = db.scalars(
        select(Restaurant).where(Restaurant.is_active == 1)
    ).all()
    return [restaurant_to_menu_out(r) for r in rs]
