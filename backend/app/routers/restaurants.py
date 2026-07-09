from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import Allergen, Dish, Restaurant, Review, User, UserFavorite, CustomerAnnotation, RestaurantAnalytics
from ..schemas import (
    DishEvaluationOut,
    DishOut,
    FavoriteOut,
    MenuEvaluationIn,
    MenuEvaluationOut,
    MenuOut,
    PhotoOut,
    PublicRestaurantOut,
    RestaurantOut,
    RestaurantSummaryOut,
    DishSummaryOut,
    CustomerAnnotationIn,
    CustomerAnnotationOut,
    MenuOutItem,
    DishTranslationOut,
)
from ..security import get_current_user
from ..services import storage
from ..services.external_reviews import get_external_reviews
from ..services.visibility import active_boost_expires_map, restaurant_has_active_boost
from ..services.analytics_buffer import enqueue_scan

router = APIRouter(prefix="/restaurants", tags=["restaurants"])

from ..plans import restaurant_has_menu_access


def dish_to_out(d: Dish, lang: str = "it") -> DishOut:
    nome = d.name
    desc = d.description

    # Se la lingua richiesta non è l'italiano, cerca una traduzione
    if lang and lang != "it":
        for trans in d.translations:
            if trans.lang == lang:
                nome = trans.name
                desc = trans.description
                break

    return DishOut(
        id=d.id,
        nome_piatto=nome,
        descrizione=desc,
        categoria=d.category,
        prezzo_cents=d.price_cents,
        image_url=d.image_url,
        menu_group=d.menu_group,
        menu_id=d.menu_id,
        kitchen_protocol_confirmed=d.kitchen_protocol_confirmed or 0,
        cross_contamination_checked_at=d.cross_contamination_checked_at,
        allergeni_contenuti=[
            da.allergen.code for da in d.dish_allergens if da.kind == "contains"
        ],
        allergeni_tracce=[
            da.allergen.code for da in d.dish_allergens if da.kind == "traces"
        ],
        translations=[
            DishTranslationOut(lang=t.lang, name=t.name, description=t.description)
            for t in d.translations
        ]
    )


def restaurant_to_summary_out(r: Restaurant, *, boost_active: bool = False) -> RestaurantSummaryOut:
    return RestaurantSummaryOut(
        restaurant_id=r.id,
        public_code=r.public_code,
        nome_ristorante=r.name,
        citta=r.city,
        latitude=r.latitude,
        longitude=r.longitude,
        boost_active=boost_active,
        piatti=[
            DishSummaryOut(
                id=d.id,
                nome_piatto=d.name,
                descrizione=d.description,
                allergeni_contenuti=[
                    da.allergen.code for da in d.dish_allergens if da.kind == "contains"
                ],
                allergeni_tracce=[
                    da.allergen.code for da in d.dish_allergens if da.kind == "traces"
                ],
            )
            for d in r.dishes if d.is_available
        ],
    )


def restaurant_to_menu_out(r: Restaurant, lang: str = "it", *, boost_active: bool = False) -> MenuOut:
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
        google_rating=r.google_rating,
        google_reviews_count=r.google_reviews_count,
        tripadvisor_rating=r.tripadvisor_rating,
        tripadvisor_reviews_count=r.tripadvisor_reviews_count,
        boost_active=boost_active,
        menus=[
            MenuOutItem(
                id=m.id,
                restaurant_id=m.restaurant_id,
                name=m.name,
                is_active=bool(m.is_active),
                sort_order=m.sort_order,
                created_at=m.created_at
            )
            for m in r.menus if m.is_active
        ],
        piatti=[dish_to_out(d, lang) for d in r.dishes if d.is_available],
    )


INGREDIENTI_ANIMALI = {
    'carne', 'pollo', 'manzo', 'maiale', 'agnello', 'vitello', 'prosciutto', 'speck', 'pancetta', 'guanciale',
    'pesce', 'salmone', 'tonno', 'acciughe', 'alici', 'gamberi', 'gamberetti', 'aragosta', 'polpo', 'calamari', 'seppia', 'molluschi', 'crostacei',
    'uova', 'uovo', 'latte', 'panna', 'burro', 'formaggio', 'parmigiano', 'pecorino', 'mozzarella', 'gorgonzola', 'ricotta', 'stracchino', 'mascarpone',
    'miele', 'gelatina animale', 'strutto', 'lardo',
}

VIETATI_VEGETARIANO = {
    'carne', 'pollo', 'manzo', 'maiale', 'agnello', 'vitello', 'prosciutto', 'speck', 'pancetta', 'guanciale',
    'pesce', 'salmone', 'tonno', 'acciughe', 'alici', 'gamberi', 'gamberetti', 'aragosta', 'polpo', 'calamari', 'seppia', 'molluschi', 'crostacei',
}

DIETA_REGOLE = {
    "vegano": INGREDIENTI_ANIMALI,
    "vegetariano": VIETATI_VEGETARIANO,
}

def _evaluate_dish(
    dish: DishOut,
    allergen_codes: set[str],
    excluded_ingredients: list[str],
) -> DishEvaluationOut:
    import re
    diet_codes = {c for c in allergen_codes if c in {"vegano", "vegetariano"}}
    true_allergen_codes = allergen_codes - diet_codes

    match_contenuti = [
        c for c in dish.allergeni_contenuti if c in true_allergen_codes
    ]
    match_tracce = [
        c for c in dish.allergeni_tracce if c in true_allergen_codes
    ]

    # Calcolo diete con lo stesso algoritmo del client (semaforo.ts)
    parole_nome = [w.strip().lower() for w in re.split(r'\s+', dish.nome_piatto or '') if w.strip()]
    parole_desc = [w.strip().lower() for w in re.split(r'\s+', dish.descrizione or '') if w.strip()]
    
    tutti_ingredienti_piatto = set(
        dish.allergeni_contenuti +
        dish.allergeni_tracce +
        parole_nome +
        parole_desc
    )

    diet_mismatches: list[str] = []
    for dieta in diet_codes:
        ingredienti_vietati = DIETA_REGOLE.get(dieta)
        if ingredienti_vietati:
            if any(ing in tutti_ingredienti_piatto for ing in ingredienti_vietati):
                diet_mismatches.append(dieta)

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


def log_restaurant_scan(restaurant_id: int, db: Session, allergen_code: Optional[str] = None):
    enqueue_scan(restaurant_id, allergen_code)


@router.get("/{public_code}/menu", response_model=MenuOut)
def get_menu(
    public_code: str,
    lang: Optional[str] = None,
    accept_language: Optional[str] = Header(None, alias="Accept-Language"),
    db: Session = Depends(get_db)
):
    """Endpoint B2C: menù del locale per codice/QR. Pubblico (il semaforo è client-side)."""
    selected_lang = lang or (accept_language.split(",")[0].split("-")[0] if accept_language else "it")
    if selected_lang not in {"it", "en", "es", "de", "fr"}:
        selected_lang = "it"
    r = _get_active_restaurant(public_code, db)
    log_restaurant_scan(r.id, db, allergen_code=None)
    return restaurant_to_menu_out(r, lang=selected_lang)


@router.post("/{public_code}/menu/evaluate", response_model=MenuEvaluationOut)
def evaluate_menu(
    public_code: str,
    data: MenuEvaluationIn,
    lang: Optional[str] = None,
    accept_language: Optional[str] = Header(None, alias="Accept-Language"),
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

    selected_lang = lang or (accept_language.split(",")[0].split("-")[0] if accept_language else "it")
    if selected_lang not in {"it", "en", "es", "de", "fr"}:
        selected_lang = "it"

    r = _get_active_restaurant(public_code, db)
    for code in codes:
        log_restaurant_scan(r.id, db, allergen_code=code)

    menu = restaurant_to_menu_out(r, lang=selected_lang)
    menu_payload = menu.model_dump() if hasattr(menu, "model_dump") else menu.dict()
    return MenuEvaluationOut(
        **menu_payload,
        evaluation=[
            _evaluate_dish(d, codes, data.excluded_ingredients)
            for d in menu.piatti
        ],
    )


@router.get("/{code_or_slug}/public", response_model=PublicRestaurantOut)
def public_restaurant_page(
    code_or_slug: str,
    lang: Optional[str] = None,
    accept_language: Optional[str] = Header(None, alias="Accept-Language"),
    db: Session = Depends(get_db)
):
    """Pagina pubblica del locale, senza login: per /r/{slug} sulla dashboard web.

    Il dettaglio allergeni per piatto è visibile solo con piano Pro/Premium attivo
    (coerente col gating dell'editor menù).
    """
    selected_lang = lang or (accept_language.split(",")[0].split("-")[0] if accept_language else "it")
    if selected_lang not in {"it", "en", "es", "de", "fr"}:
        selected_lang = "it"

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

    has_menu_plan = restaurant_has_menu_access(r.business_plan, r.subscription_status)
    menu_available = bool(has_menu_plan and (r.menu_version or 0) > 0)

    ext_revs = get_external_reviews(r.name, r.google_place_id, r.tripadvisor_url)

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
        vat_number=r.vat_number,
        allergen_manager=r.allergen_manager,
        rating_avg=round(float(rating_avg), 1) if rating_avg is not None else None,
        rating_count=int(rating_count or 0),
        google_place_id=r.google_place_id,
        google_rating=r.google_rating,
        google_reviews_count=r.google_reviews_count,
        tripadvisor_url=r.tripadvisor_url,
        tripadvisor_rating=r.tripadvisor_rating,
        tripadvisor_reviews_count=r.tripadvisor_reviews_count,
        external_reviews=ext_revs,
        menu_available=menu_available,
        boost_active=restaurant_has_active_boost(db, r.id),
        menus=[
            MenuOutItem(
                id=m.id,
                restaurant_id=m.restaurant_id,
                name=m.name,
                is_active=bool(m.is_active),
                sort_order=m.sort_order,
                created_at=m.created_at
            )
            for m in r.menus if m.is_active
        ],
        piatti=[dish_to_out(d, selected_lang) for d in r.dishes if d.is_available] if menu_available else [],
    )


# ---------- Preferiti (server-side, per notifiche menù aggiornato) ----------

@router.get("/favorites/mine", response_model=list[FavoriteOut])
def my_favorites(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Locali preferiti dell'utente con codice e nome per sincronizzare l'app."""
    rows = db.execute(
        select(Restaurant.public_code, Restaurant.name)
        .join(UserFavorite, UserFavorite.restaurant_id == Restaurant.id)
        .where(UserFavorite.user_id == user.id)
        .order_by(Restaurant.name)
    ).all()
    return [FavoriteOut(public_code=code, name=name) for code, name in rows]


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


@router.get("/summary", response_model=list[RestaurantSummaryOut])
def list_restaurants_summary(db: Session = Depends(get_db)):
    """Elenco leggero locali attivi (senza traduzioni, foto, prezzi) per mappa e geofencing."""
    rs = db.scalars(
        select(Restaurant).where(Restaurant.is_active == 1)
    ).all()
    boost_map = active_boost_expires_map(db, [r.id for r in rs])
    rs_sorted = sorted(
        rs,
        key=lambda r: (0 if r.id in boost_map else 1, r.name.lower()),
    )
    return [
        restaurant_to_summary_out(r, boost_active=r.id in boost_map)
        for r in rs_sorted
    ]


@router.get("", response_model=list[MenuOut])
def list_restaurants(db: Session = Depends(get_db)):
    """Endpoint B2C: elenco di tutti i ristoranti attivi per consentire al cliente
    di sfogliarli sulla mappa e calcolarne la sicurezza in base alle proprie allergie."""
    rs = db.scalars(
        select(Restaurant).where(Restaurant.is_active == 1)
    ).all()
    boost_map = active_boost_expires_map(db, [r.id for r in rs])
    rs_sorted = sorted(
        rs,
        key=lambda r: (0 if r.id in boost_map else 1, r.name.lower()),
    )
    return [
        restaurant_to_menu_out(r, boost_active=r.id in boost_map)
        for r in rs_sorted
    ]


@router.post("/{public_code}/sync-external", response_model=RestaurantOut)
def sync_external_reviews(
    public_code: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Simula la sincronizzazione delle valutazioni esterne da Google e TripAdvisor.
    Vengono generati dati casuali realistici basati sulla presenza dei relativi ID/URL.
    """
    r = _get_active_restaurant(public_code, db)
    if r.owner_user_id != user.id and user.role != "admin":
        raise HTTPException(403, "Non hai i permessi per modificare questo locale")

    import random

    # Se il Place ID di Google è configurato, simuliamo la sincronizzazione
    if r.google_place_id and r.google_place_id.strip():
        r.google_rating = round(random.uniform(4.2, 4.8), 1)
        r.google_reviews_count = random.randint(50, 450)
    else:
        r.google_rating = None
        r.google_reviews_count = None

    # Se l'URL di TripAdvisor è configurato, simuliamo la sincronizzazione
    if r.tripadvisor_url and r.tripadvisor_url.strip():
        r.tripadvisor_rating = round(random.uniform(4.0, 4.7), 1)
        r.tripadvisor_reviews_count = random.randint(30, 350)
    else:
        r.tripadvisor_rating = None
        r.tripadvisor_reviews_count = None

    db.commit()
    db.refresh(r)
    return r


def _get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        import jwt
        from ..config import settings
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return db.get(User, int(payload["sub"]))
    except Exception:
        return None


def _annotation_to_out(ann: CustomerAnnotation, current_user_id: Optional[int] = None) -> CustomerAnnotationOut:
    return CustomerAnnotationOut(
        id=ann.id,
        restaurant_id=ann.restaurant_id,
        allergen_id=ann.allergen_id,
        allergen_code=ann.allergen.code,
        allergen_name_it=ann.allergen.name_it,
        allergen_emoji=ann.allergen.emoji,
        ingredient=ann.ingredient,
        notes=ann.notes,
        author_name=ann.user.display_name or "Utente AllerTgy",
        is_mine=(current_user_id is not None and ann.user_id == current_user_id),
        created_at=ann.created_at,
    )


@router.get("/{public_code}/annotations", response_model=list[CustomerAnnotationOut])
def list_annotations(
    public_code: str,
    user: Optional[User] = Depends(_get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Restituisce le annotazioni/warning dei clienti per questo ristorante."""
    r = _get_active_restaurant(public_code, db)
    annots = db.scalars(
        select(CustomerAnnotation)
        .where(CustomerAnnotation.restaurant_id == r.id)
        .order_by(CustomerAnnotation.created_at.desc())
    ).all()
    uid = user.id if user else None
    return [_annotation_to_out(ann, uid) for ann in annots]


@router.post("/{public_code}/annotations", response_model=CustomerAnnotationOut)
def create_annotation(
    public_code: str,
    data: CustomerAnnotationIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crea una nuova annotazione/warning di sicurezza per un ingrediente."""
    if user.role != "customer":
        raise HTTPException(403, "Solo i clienti possono inserire segnalazioni o warning")
    r = _get_active_restaurant(public_code, db)

    # Verifica validità allergen_id
    allergen = db.get(Allergen, data.allergen_id)
    if not allergen:
        raise HTTPException(400, "Allergene non valido")

    ann = CustomerAnnotation(
        restaurant_id=r.id,
        user_id=user.id,
        allergen_id=data.allergen_id,
        ingredient=data.ingredient,
        notes=data.notes,
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return _annotation_to_out(ann, user.id)

