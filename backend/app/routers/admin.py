from __future__ import annotations

import json
import os
import secrets
import uuid
from io import BytesIO
from datetime import datetime, timezone

from typing import Optional

from fastapi import APIRouter, Body, Depends, File, Header, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Allergen,
    Dish,
    DishAllergen,
    MenuAuditLog,
    Restaurant,
    RestaurantPhoto,
    User,
    UserFavorite,
    Menu,
    DishTranslation,
)
from ..schemas import (
    AnalyzeOut,
    AnalyzeUrlIn,
    ApproveMenuIn,
    DishIn,
    DishOut,
    DishSaveOut,
    KitchenConfirmAllOut,
    MenuAuditOut,
    MenuSaveIn,
    PhotoOut,
    RestaurantIn,
    RestaurantOut,
    MenuIn,
    MenuOutItem,
)
from ..security import require_owner
from ..services import storage
from ..services.menu_analyze import analyze_menu_image, analyze_menu_url
from ..services.push import notify_users
from ..services.slugs import ensure_slug
from ..services.referrals import (
    owner_already_referred,
    process_merchant_referral,
    resolve_referrer,
)
from ..services.plan_limits import ensure_analytics_access, ensure_owner_ai_menu_scan_allowed
from ..legal import MENU_CONFIRMATION_VERSION
from .restaurants import dish_to_out

router = APIRouter(prefix="/admin", tags=["admin B2B"])

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_MENU_IMAGE_BYTES = 8 * 1024 * 1024
MAX_DISH_IMAGE_BYTES = 5 * 1024 * 1024
from ..plans import (
    PLAN_PHOTO_LIMITS,
    restaurant_has_menu_access,
)


async def _read_image_upload(file: UploadFile, *, max_bytes: int) -> tuple[bytes, str]:
    mime_type = (file.content_type or "").lower()
    if mime_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(415, "Carica un'immagine JPG, PNG o WebP")
    content = await file.read()
    if not content:
        raise HTTPException(400, "Il file immagine è vuoto")
    if len(content) > max_bytes:
        mb = max_bytes // (1024 * 1024)
        raise HTTPException(413, f"Immagine troppo grande: massimo {mb} MB")
    return content, mime_type


def _my_restaurant(rid: int, user: User, db: Session) -> Restaurant:
    r = db.get(Restaurant, rid)
    if not r or r.owner_user_id != user.id:
        raise HTTPException(404, "Ristorante non trovato")
    return r


def _ensure_menu_access(r: Restaurant) -> None:
    if not restaurant_has_menu_access(r.business_plan, r.subscription_status):
        raise HTTPException(
            402,
            "Il menù digitale con allergeni per piatto è incluso nei piani Base e Pro.",
        )


def _dish_codes_summary(piatti: list[DishIn]) -> dict:
    contains = sorted({c for p in piatti for c in p.allergeni_contenuti})
    traces = sorted({c for p in piatti for c in p.allergeni_tracce})
    return {
        "dish_count": len(piatti),
        "contains_codes": contains,
        "traces_codes": traces,
        "dishes": [
            {
                "name": p.nome_piatto,
                "category": p.categoria,
                "menu_group": p.menu_group or "Principale",
                "contains": sorted(set(p.allergeni_contenuti)),
                "traces": sorted(set(p.allergeni_tracce) - set(p.allergeni_contenuti)),
            }
            for p in piatti
        ],
    }


def _dish_model_summary(dishes: list[Dish]) -> dict:
    piatti = [
        DishIn(
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
        for d in dishes
        if d.is_available
    ]
    return _dish_codes_summary(piatti)


def _add_menu_audit(
    db: Session,
    restaurant: Restaurant,
    user: User,
    action: str,
    *,
    snapshot: dict | None = None,
    legal_version: str | None = None,
    note: str | None = None,
) -> None:
    db.add(MenuAuditLog(
        restaurant_id=restaurant.id,
        owner_user_id=user.id,
        action=action,
        menu_version=restaurant.menu_version or 0,
        legal_version=legal_version,
        snapshot_json=json.dumps(snapshot, ensure_ascii=False) if snapshot else None,
        note=note,
    ))


def _allergen_names(dish: Dish, kind: str) -> str:
    names = [
        da.allergen.name_it
        for da in dish.dish_allergens
        if da.kind == kind
    ]
    return ", ".join(sorted(names)) if names else "-"


def _validate_allergen_codes(db: Session, codes: set[str]) -> dict[str, Allergen]:
    by_code = {a.code: a for a in db.scalars(select(Allergen)).all()}
    unknown = codes - set(by_code)
    if unknown:
        raise HTTPException(400, f"Codici allergene non validi: {sorted(unknown)}")
    return by_code


def _replace_dish_allergens(
    db: Session,
    dish: Dish,
    by_code: dict[str, Allergen],
    contenuti: list[str],
    tracce: list[str],
) -> None:
    dish.dish_allergens.clear()
    db.flush()
    for c in set(contenuti):
        db.add(DishAllergen(dish_id=dish.id, allergen_id=by_code[c].id, kind="contains"))
    for c in set(tracce) - set(contenuti):
        db.add(DishAllergen(dish_id=dish.id, allergen_id=by_code[c].id, kind="traces"))


def _apply_dish_fields(dish: Dish, data: DishIn) -> None:
    dish.name = data.nome_piatto.strip()
    dish.description = data.descrizione
    dish.category = data.categoria
    dish.price_cents = data.prezzo_cents
    dish.image_url = data.image_url
    dish.menu_group = data.menu_group or "Principale"
    dish.menu_id = data.menu_id
    dish.kitchen_protocol_confirmed = 1 if data.kitchen_protocol_confirmed else 0
    if dish.kitchen_protocol_confirmed:
        dish.cross_contamination_checked_at = (
            data.cross_contamination_checked_at
            or datetime.now(timezone.utc)
        )
    else:
        dish.cross_contamination_checked_at = None


def _maybe_live_publish_menu(r: Restaurant, *, publish: bool) -> bool:
    """Se il menù è già legalmente confermato, un edit piatto aggiorna subito QR/PDF."""
    if not publish:
        return False
    if not r.menu_legal_confirmed_at:
        return False
    if (r.menu_legal_version or "") != MENU_CONFIRMATION_VERSION:
        return False
    now = datetime.now(timezone.utc)
    r.menu_version = (r.menu_version or 0) + 1
    r.menu_updated_at = now
    r.is_active = 1
    return True


@router.get("/restaurants", response_model=list[RestaurantOut])
def my_restaurants(user: User = Depends(require_owner), db: Session = Depends(get_db)):
    return db.scalars(
        select(Restaurant).where(Restaurant.owner_user_id == user.id)
    ).all()


@router.post("/restaurants", response_model=RestaurantOut, status_code=201)
def create_restaurant(
    data: RestaurantIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    # codice numerico a 6 cifre, unico
    for _ in range(20):
        code = str(secrets.randbelow(900000) + 100000)
        if not db.scalar(select(Restaurant).where(Restaurant.public_code == code)):
            break
    else:
        raise HTTPException(500, "Impossibile generare un codice univoco")
    r = Restaurant(
        public_code=code,
        name=data.name,
        city=data.city,
        address=data.address,
        phone=data.phone,
        email_contact=data.email_contact,
        opening_hours=data.opening_hours,
        image_url=data.image_url,
        latitude=data.latitude,
        longitude=data.longitude,
        owner_user_id=user.id
    )
    ensure_slug(db, r)
    db.add(r)
    db.flush()

    if data.invite_code and not owner_already_referred(user.id, db):
        referrer = resolve_referrer(data.invite_code, db)
        if referrer and referrer.id != user.id:
            process_merchant_referral(
                referrer=referrer,
                owner=user,
                restaurant=r,
                db=db,
            )

    db.commit()
    db.refresh(r)
    return r


@router.put("/restaurants/{rid}", response_model=RestaurantOut)
def update_restaurant(
    rid: int,
    data: RestaurantIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Aggiorna le impostazioni del locale (indirizzo, telefono, contatti, orari, ecc.)."""
    r = _my_restaurant(rid, user, db)
    r.name = data.name
    r.city = data.city
    r.address = data.address
    r.phone = data.phone
    r.email_contact = data.email_contact
    r.opening_hours = data.opening_hours
    r.latitude = data.latitude
    r.longitude = data.longitude
    r.website = data.website
    r.description = data.description
    r.google_place_id = data.google_place_id
    r.google_rating = data.google_rating
    r.google_reviews_count = data.google_reviews_count
    r.tripadvisor_url = data.tripadvisor_url
    r.tripadvisor_rating = data.tripadvisor_rating
    r.tripadvisor_reviews_count = data.tripadvisor_reviews_count
    r.vat_number = data.vat_number
    r.allergen_manager = data.allergen_manager
    if data.image_url is not None:
        r.image_url = data.image_url
    ensure_slug(db, r)
    _add_menu_audit(db, r, user, "restaurant_updated", note="Impostazioni locale aggiornate")
    db.commit()
    db.refresh(r)
    return r


@router.post("/menu/analyze", response_model=AnalyzeOut)
async def analyze_menu(
    file: UploadFile = File(...),
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Riceve la foto del menù cartaceo e restituisce piatti+allergeni."""
    ensure_owner_ai_menu_scan_allowed(user, db)
    db.commit()
    content, mime_type = await _read_image_upload(file, max_bytes=MAX_MENU_IMAGE_BYTES)
    return analyze_menu_image(content, file.filename or "menu.jpg", mime_type)


@router.post("/menu/analyze-url", response_model=AnalyzeOut)
def analyze_url(
    data: AnalyzeUrlIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Riceve un link/URL di un menù online e lo analizza con Gemini."""
    ensure_owner_ai_menu_scan_allowed(user, db)
    db.commit()
    return analyze_menu_url(data.url)


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(require_owner),
):
    """Riceve un'immagine per un piatto o ristorante, la salva localmente e ne restituisce l'URL."""
    content, mime_type = await _read_image_upload(file, max_bytes=MAX_DISH_IMAGE_BYTES)

    os.makedirs("static/uploads", exist_ok=True)
    ext = ALLOWED_IMAGE_TYPES[mime_type]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join("static/uploads", filename)
    
    with open(filepath, "wb") as f:
        f.write(content)
        
    return {"url": f"/static/uploads/{filename}"}


@router.put("/restaurants/{rid}/menu", response_model=list[DishOut])
def save_menu(
    rid: int,
    data: MenuSaveIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Salva il menù corretto dal ristoratore (tabella di riepilogo)."""
    r = _my_restaurant(rid, user, db)
    _ensure_menu_access(r)
    by_code = {a.code: a for a in db.scalars(select(Allergen)).all()}

    unknown = {
        c for p in data.piatti
        for c in p.allergeni_contenuti + p.allergeni_tracce
        if c not in by_code
    }
    if unknown:
        raise HTTPException(400, f"Codici allergene non validi: {sorted(unknown)}")

    if data.replace:
        r.dishes.clear()
        db.flush()

    for p in data.piatti:
        dish = Dish(
            restaurant_id=r.id,
            name=p.nome_piatto,
            description=p.descrizione,
            category=p.categoria,
            price_cents=p.prezzo_cents,
            image_url=p.image_url,
            menu_group=p.menu_group,
            menu_id=p.menu_id,
            kitchen_protocol_confirmed=p.kitchen_protocol_confirmed or 0,
            cross_contamination_checked_at=p.cross_contamination_checked_at or (
                datetime.now(timezone.utc) if p.kitchen_protocol_confirmed else None
            ),
        )
        db.add(dish)
        db.flush()

        if p.translations:
            for tr in p.translations:
                db.add(DishTranslation(
                    dish_id=dish.id,
                    lang=tr.lang,
                    name=tr.name,
                    description=tr.description
                ))

        for c in set(p.allergeni_contenuti):
            db.add(DishAllergen(dish_id=dish.id, allergen_id=by_code[c].id, kind="contains"))
        for c in set(p.allergeni_tracce) - set(p.allergeni_contenuti):
            db.add(DishAllergen(dish_id=dish.id, allergen_id=by_code[c].id, kind="traces"))

    _add_menu_audit(
        db,
        r,
        user,
        "menu_saved",
        snapshot=_dish_codes_summary(data.piatti),
        note="Bozza menù salvata dal ristoratore",
    )
    db.commit()
    # Query esplicita: dopo replace la collection in sessione può non riflettere i nuovi id
    saved = db.scalars(select(Dish).where(Dish.restaurant_id == r.id)).all()
    return [dish_to_out(d) for d in saved]


@router.post("/restaurants/{rid}/dishes", response_model=DishSaveOut, status_code=201)
def create_dish(
    rid: int,
    data: DishIn,
    publish: bool = True,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Crea un piatto singolo con allergeni (loop rapido ristoratore)."""
    r = _my_restaurant(rid, user, db)
    _ensure_menu_access(r)
    name = (data.nome_piatto or "").strip()
    if not name:
        raise HTTPException(400, "Il nome del piatto è obbligatorio")
    by_code = _validate_allergen_codes(
        db, set(data.allergeni_contenuti) | set(data.allergeni_tracce)
    )
    dish = Dish(restaurant_id=r.id, name=name)
    _apply_dish_fields(dish, data)
    dish.name = name
    db.add(dish)
    db.flush()
    _replace_dish_allergens(
        db, dish, by_code, data.allergeni_contenuti, data.allergeni_tracce
    )
    if data.translations:
        for tr in data.translations:
            db.add(DishTranslation(
                dish_id=dish.id,
                lang=tr.lang,
                name=tr.name,
                description=tr.description,
            ))
    published = _maybe_live_publish_menu(r, publish=publish)
    if not published:
        r.menu_updated_at = datetime.now(timezone.utc)
    _add_menu_audit(
        db,
        r,
        user,
        "menu_saved",
        snapshot=_dish_codes_summary([data]),
        note=f"Piatto creato: {name}",
    )
    db.commit()
    db.refresh(dish)
    db.refresh(r)
    return DishSaveOut(
        dish=dish_to_out(dish),
        menu_version=r.menu_version or 0,
        menu_updated_at=r.menu_updated_at,
        published=published,
        registry_ready=True,
    )


@router.put("/restaurants/{rid}/dishes/{dish_id}", response_model=DishSaveOut)
def update_dish(
    rid: int,
    dish_id: int,
    data: DishIn,
    publish: bool = True,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Aggiorna un piatto e i suoi allergeni in pochi secondi senza riscrivere il menù."""
    r = _my_restaurant(rid, user, db)
    _ensure_menu_access(r)
    dish = db.get(Dish, dish_id)
    if not dish or dish.restaurant_id != r.id:
        raise HTTPException(404, "Piatto non trovato")
    name = (data.nome_piatto or "").strip()
    if not name:
        raise HTTPException(400, "Il nome del piatto è obbligatorio")
    by_code = _validate_allergen_codes(
        db, set(data.allergeni_contenuti) | set(data.allergeni_tracce)
    )
    _apply_dish_fields(dish, data)
    dish.name = name
    _replace_dish_allergens(
        db, dish, by_code, data.allergeni_contenuti, data.allergeni_tracce
    )
    published = _maybe_live_publish_menu(r, publish=publish)
    if not published:
        r.menu_updated_at = datetime.now(timezone.utc)
    _add_menu_audit(
        db,
        r,
        user,
        "menu_saved",
        snapshot=_dish_codes_summary([data]),
        note=f"Piatto aggiornato: {name}",
    )
    db.commit()
    db.refresh(dish)
    db.refresh(r)
    return DishSaveOut(
        dish=dish_to_out(dish),
        menu_version=r.menu_version or 0,
        menu_updated_at=r.menu_updated_at,
        published=published,
        registry_ready=True,
    )


@router.post(
    "/restaurants/{rid}/dishes/confirm-kitchen-all",
    response_model=KitchenConfirmAllOut,
)
def confirm_kitchen_all(
    rid: int,
    publish: bool = True,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Conferma protocollo cucina su tutti i piatti disponibili in un tap."""
    r = _my_restaurant(rid, user, db)
    _ensure_menu_access(r)
    now = datetime.now(timezone.utc)
    updated = 0
    for dish in r.dishes:
        if not dish.is_available:
            continue
        if (dish.kitchen_protocol_confirmed or 0) != 1:
            updated += 1
        dish.kitchen_protocol_confirmed = 1
        dish.cross_contamination_checked_at = now
    published = _maybe_live_publish_menu(r, publish=publish)
    if not published:
        r.menu_updated_at = now
    _add_menu_audit(
        db,
        r,
        user,
        "menu_saved",
        snapshot=_dish_model_summary(r.dishes),
        note=f"Conferma cucina su {updated} piatti",
    )
    db.commit()
    db.refresh(r)
    return KitchenConfirmAllOut(
        updated=updated,
        menu_version=r.menu_version or 0,
        menu_updated_at=r.menu_updated_at,
        published=published,
        registry_ready=True,
    )


@router.delete("/restaurants/{rid}/dishes/{dish_id}", status_code=204)
def delete_dish(
    rid: int,
    dish_id: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Elimina un piatto singolo dal menù. Non richiede piano a pagamento."""
    r = _my_restaurant(rid, user, db)
    dish = db.get(Dish, dish_id)
    if not dish or dish.restaurant_id != r.id:
        raise HTTPException(404, "Piatto non trovato")
    db.delete(dish)
    db.flush()
    # Rileggi i piatti rimasti (evita che la collection in sessione conti ancora il deleted)
    remaining = db.scalars(select(Dish).where(Dish.restaurant_id == r.id)).all()
    r.menu_updated_at = datetime.now(timezone.utc)
    if remaining:
        r.menu_version = (r.menu_version or 0) + 1
    else:
        # Menù ora vuoto: resetta stato pubblicazione
        r.is_active = 0
    db.commit()


@router.post("/restaurants/{rid}/approve", response_model=RestaurantOut)
def approve_menu(
    rid: int,
    data: ApproveMenuIn = Body(...),
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Approva e pubblica il menù: aggiorna la data e restituisce il codice per il QR."""
    r = _my_restaurant(rid, user, db)
    _ensure_menu_access(r)
    if not r.dishes:
        raise HTTPException(400, "Il menù è vuoto: salva i piatti prima di approvare")
    legal_current = (
        bool(r.menu_legal_confirmed_at)
        and (r.menu_legal_version or "") == MENU_CONFIRMATION_VERSION
    )
    if data.republish_only:
        if not legal_current:
            raise HTTPException(
                400,
                "Prima pubblicazione: conferma la responsabilità legale del menù",
            )
    elif not data.legal_acknowledged:
        raise HTTPException(
            400,
            "Devi confermare di aver verificato allergeni, tracce e responsabilità del menù",
        )
    now = datetime.now(timezone.utc)
    r.menu_version = (r.menu_version or 0) + 1
    r.menu_updated_at = now
    if not data.republish_only or not legal_current:
        r.menu_legal_confirmed_at = now
        r.menu_legal_confirmed_by = user.id
        r.menu_legal_version = MENU_CONFIRMATION_VERSION
    r.is_active = 1
    _add_menu_audit(
        db,
        r,
        user,
        "menu_approved",
        snapshot=_dish_model_summary(r.dishes),
        legal_version=MENU_CONFIRMATION_VERSION,
        note=(
            "Menù ripubblicato (modifica rapida)"
            if data.republish_only
            else "Menù approvato e pubblicato dal ristoratore"
        ),
    )
    # Push agli utenti che hanno il locale tra i preferiti
    fav_user_ids = list(db.scalars(
        select(UserFavorite.user_id).where(UserFavorite.restaurant_id == r.id)
    ).all())
    notify_users(
        db,
        fav_user_ids,
        "menu_updated",
        f"Menù aggiornato — {r.name}",
        "Un locale tra i tuoi preferiti ha pubblicato un nuovo menù. Controlla il semaforo!",
        {"public_code": r.public_code},
    )
    db.commit()
    db.refresh(r)
    return r


# ---------- Galleria foto locale (limite per piano) ----------

def _photo_to_out(p: RestaurantPhoto) -> PhotoOut:
    return PhotoOut(
        id=p.id,
        url=storage.signed_url(p.storage_key, 3600),
        is_cover=bool(p.is_cover),
        sort_order=p.sort_order,
    )


@router.get("/restaurants/{rid}/photos", response_model=list[PhotoOut])
def list_photos(
    rid: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    r = _my_restaurant(rid, user, db)
    return [_photo_to_out(p) for p in r.photos]


@router.post("/restaurants/{rid}/photos", response_model=PhotoOut, status_code=201)
async def upload_photo(
    rid: int,
    file: UploadFile = File(...),
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    r = _my_restaurant(rid, user, db)
    plan = r.business_plan or "free"
    limit = PLAN_PHOTO_LIMITS.get(plan, 1)
    if len(r.photos) >= limit:
        raise HTTPException(
            402,
            f"Il piano {plan.capitalize()} include al massimo {limit} foto in galleria. "
            "Passa a un piano superiore per aggiungerne altre.",
        )
    content, mime_type = await _read_image_upload(file, max_bytes=MAX_DISH_IMAGE_BYTES)
    key = f"gallery/{r.id}/{uuid.uuid4()}{ALLOWED_IMAGE_TYPES[mime_type]}"
    storage.put_bytes(key, content, mime_type)
    photo = RestaurantPhoto(
        restaurant_id=r.id,
        storage_key=key,
        is_cover=0 if r.photos else 1,  # la prima foto diventa copertina
        sort_order=len(r.photos),
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return _photo_to_out(photo)


@router.post("/restaurants/{rid}/photos/{photo_id}/cover", response_model=list[PhotoOut])
def set_cover_photo(
    rid: int,
    photo_id: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    r = _my_restaurant(rid, user, db)
    target = next((p for p in r.photos if p.id == photo_id), None)
    if not target:
        raise HTTPException(404, "Foto non trovata")
    for p in r.photos:
        p.is_cover = 1 if p.id == photo_id else 0
    db.commit()
    db.refresh(r)
    return [_photo_to_out(p) for p in r.photos]


@router.delete("/restaurants/{rid}/photos/{photo_id}", status_code=204)
def delete_photo(
    rid: int,
    photo_id: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    r = _my_restaurant(rid, user, db)
    target = next((p for p in r.photos if p.id == photo_id), None)
    if not target:
        raise HTTPException(404, "Foto non trovata")
    storage.delete(target.storage_key)
    db.delete(target)
    db.commit()


@router.get("/restaurants/{rid}/menu/audit", response_model=list[MenuAuditOut])
def menu_audit(
    rid: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Storico delle modifiche e approvazioni menù del ristorante."""
    _my_restaurant(rid, user, db)
    stmt = (
        select(MenuAuditLog)
        .where(MenuAuditLog.restaurant_id == rid)
        .order_by(MenuAuditLog.created_at.desc(), MenuAuditLog.id.desc())
        .limit(100)
    )
    return db.scalars(stmt).all()


@router.get("/restaurants/{rid}/analytics", status_code=200)
def get_restaurant_analytics(
    rid: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Restituisce le statistiche delle visite e dei match degli allergeni per il locale."""
    r = _my_restaurant(rid, user, db)
    ensure_analytics_access(r)
    from sqlalchemy import func
    from ..models import RestaurantAnalytics, Allergen
    
    total_views = db.scalar(
        select(func.count(RestaurantAnalytics.id))
        .where(RestaurantAnalytics.restaurant_id == r.id)
        .where(RestaurantAnalytics.allergen_code.is_(None))
    ) or 0
    
    total_allergen_queries = db.scalar(
        select(func.count(RestaurantAnalytics.id))
        .where(RestaurantAnalytics.restaurant_id == r.id)
        .where(RestaurantAnalytics.allergen_code.is_not(None))
    ) or 0
    
    allergen_stats = db.execute(
        select(RestaurantAnalytics.allergen_code, func.count(RestaurantAnalytics.id))
        .where(RestaurantAnalytics.restaurant_id == r.id)
        .where(RestaurantAnalytics.allergen_code.is_not(None))
        .group_by(RestaurantAnalytics.allergen_code)
        .order_by(func.count(RestaurantAnalytics.id).desc())
    ).all()
    
    allergens_mapped = {a.code: a for a in db.scalars(select(Allergen)).all()}
    distribution = []
    for code, count in allergen_stats:
        a_obj = allergens_mapped.get(code)
        name = a_obj.name_it if a_obj else code
        emoji = a_obj.emoji if a_obj else "⚠️"
        distribution.append({
            "code": code,
            "name": name,
            "emoji": emoji,
            "count": count
        })
        
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    views_by_day = db.execute(
        select(func.date(RestaurantAnalytics.created_at), func.count(RestaurantAnalytics.id))
        .where(RestaurantAnalytics.restaurant_id == r.id)
        .where(RestaurantAnalytics.allergen_code.is_(None))
        .where(RestaurantAnalytics.created_at >= thirty_days_ago)
        .group_by(func.date(RestaurantAnalytics.created_at))
        .order_by(func.date(RestaurantAnalytics.created_at))
    ).all()
    
    time_series = [{"date": str(day), "count": count} for day, count in views_by_day]
    
    return {
        "restaurant_id": r.id,
        "total_views": total_views,
        "total_allergen_queries": total_allergen_queries,
        "distribution": distribution,
        "time_series": time_series
    }


@router.get("/restaurants/{rid}/registry.pdf")
def export_allergen_registry(
    rid: int,
    token: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Esporta il Registro Allergeni (Reg. UE 1169/2011) in PDF stampabile per sala e controlli."""
    import jwt
    from xml.sax.saxutils import escape

    from ..config import settings
    from ..legal import (
        MENU_CONFIRMATION_VERSION,
        OWNER_DECLARATION_MARKDOWN,
        REGISTRY_PDF_CONSUMER_NOTICE,
        REGISTRY_PDF_LEGAL_NOTICE,
    )

    auth_user = None
    if token:
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
            auth_user = db.get(User, int(payload["sub"]))
        except Exception:
            pass
    elif authorization:
        try:
            parts = authorization.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                payload = jwt.decode(parts[1], settings.jwt_secret, algorithms=["HS256"])
                auth_user = db.get(User, int(payload["sub"]))
        except Exception:
            pass

    if not auth_user or auth_user.role != "owner":
        raise HTTPException(401, "Token non valido o scaduto")

    r = _my_restaurant(rid, auth_user, db)
    dishes = [d for d in r.dishes if d.is_available]
    if not dishes:
        raise HTTPException(
            400,
            "Pubblica almeno un piatto nel menù prima di stampare il Registro Allergeni.",
        )

    missing: list[str] = []
    if not (r.vat_number or "").strip():
        missing.append("Partita IVA")
    if not (r.allergen_manager or "").strip():
        missing.append("referente allergeni (HACCP)")
    if not r.menu_legal_confirmed_at:
        missing.append("conferma di responsabilità sul menù (pubblica il menù dopo aver accettato la dichiarazione)")
    if missing:
        raise HTTPException(
            400,
            "Per un Registro legalmente utilizzabile completa: " + "; ".join(missing) + ".",
        )

    try:
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import (
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
            TableStyle,
        )
    except ImportError:
        raise HTTPException(
            503,
            "Export PDF non disponibile: installa la dipendenza backend 'reportlab'.",
        )

    def P(text: str, style) -> Paragraph:
        return Paragraph(escape(text or "-").replace("\n", "<br/>"), style)

    generated_at = datetime.now(timezone.utc)
    generated_label = generated_at.strftime("%d/%m/%Y %H:%M UTC")
    menu_version = r.menu_version or 0
    legal_version = r.menu_legal_version or MENU_CONFIRMATION_VERSION
    kitchen_ok = sum(1 for d in dishes if (d.kitchen_protocol_confirmed or 0))
    kitchen_total = len(dishes)
    doc_id = f"REG-{r.public_code}-V{menu_version}-{generated_at.strftime('%Y%m%d%H%M')}"

    confirmer_name = r.allergen_manager
    if r.menu_legal_confirmed_by:
        confirmer = db.get(User, r.menu_legal_confirmed_by)
        if confirmer:
            confirmer_name = confirmer.display_name or confirmer.email or confirmer_name

    legal_confirmed_label = (
        r.menu_legal_confirmed_at.strftime("%d/%m/%Y %H:%M")
        if r.menu_legal_confirmed_at
        else "-"
    )
    menu_updated_label = (
        r.menu_updated_at.strftime("%d/%m/%Y %H:%M")
        if r.menu_updated_at
        else "-"
    )

    owner_decl = " ".join(
        line.strip()
        for line in OWNER_DECLARATION_MARKDOWN.splitlines()
        if line.strip() and not line.strip().startswith("#")
    )

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=14 * mm,
        bottomMargin=16 * mm,
        title=f"Registro Allergeni {r.name} v{menu_version}",
        author=r.allergen_manager or r.name,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "RegTitle",
        parent=styles["Title"],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#14532d"),
        spaceAfter=4,
        alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        "RegSub",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#166534"),
        alignment=TA_CENTER,
        spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "RegBody",
        parent=styles["Normal"],
        fontSize=8,
        leading=11,
        alignment=TA_JUSTIFY,
        spaceAfter=6,
    )
    meta_style = ParagraphStyle(
        "RegMeta",
        parent=styles["Normal"],
        fontSize=8,
        leading=11,
        alignment=TA_LEFT,
    )
    cell_style = ParagraphStyle(
        "RegCell",
        parent=styles["Normal"],
        fontSize=7.5,
        leading=9.5,
    )
    small_style = ParagraphStyle(
        "RegSmall",
        parent=styles["Normal"],
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#334155"),
    )
    warn_style = ParagraphStyle(
        "RegWarn",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#92400e"),
        spaceAfter=6,
    )

    story = [
        P(
            "REGISTRO DEGLI ALLERGENI ALIMENTARI",
            title_style,
        ),
        P(
            "Regolamento (UE) n. 1169/2011 — art. 44 e Allegato II · Documento da tenere in sala",
            subtitle_style,
        ),
        P(REGISTRY_PDF_LEGAL_NOTICE, body_style),
        P(REGISTRY_PDF_CONSUMER_NOTICE, body_style),
        Spacer(1, 4),
    ]

    header_rows = [
        [P("Esercizio", meta_style), P(r.name, meta_style)],
        [P("Codice locale AllerTgy", meta_style), P(str(r.public_code), meta_style)],
        [P("Indirizzo", meta_style), P(r.address or "—", meta_style)],
        [P("Città", meta_style), P(r.city or "—", meta_style)],
        [P("Telefono", meta_style), P(r.phone or "—", meta_style)],
        [P("Partita IVA", meta_style), P(r.vat_number or "—", meta_style)],
        [P("Referente allergeni (HACCP)", meta_style), P(r.allergen_manager or "—", meta_style)],
        [P("Versione menù", meta_style), P(str(menu_version), meta_style)],
        [P("Ultimo aggiornamento menù", meta_style), P(menu_updated_label, meta_style)],
        [P("Conferma responsabilità", meta_style), P(f"{legal_confirmed_label} · v.legale {legal_version}", meta_style)],
        [P("Conferme protocollo cucina", meta_style), P(f"{kitchen_ok}/{kitchen_total} piatti", meta_style)],
        [P("ID documento / stampa", meta_style), P(f"{doc_id} · generato {generated_label}", meta_style)],
    ]
    header_table = Table(header_rows, colWidths=[160, 520])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#ecfdf5")),
        ("BACKGROUND", (1, 0), (1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#166534")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#bbf7d0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))

    if kitchen_ok < kitchen_total:
        story.append(P(
            f"Attenzione: {kitchen_total - kitchen_ok} piatti senza conferma del protocollo anti-contaminazione crociata. "
            "Completare le conferme cucina e ristampare il registro.",
            warn_style,
        ))

    data = [[
        P("Piatto", cell_style),
        P("Categoria", cell_style),
        P("Contiene (All. II)", cell_style),
        P("Possibili tracce", cell_style),
        P("Cucina", cell_style),
    ]]
    for d in sorted(dishes, key=lambda x: ((x.category or ""), x.name)):
        kitchen_label = "Confermato" if (d.kitchen_protocol_confirmed or 0) else "Da confermare"
        data.append([
            P(d.name, cell_style),
            P(d.category or (d.menu_group or "—"), cell_style),
            P(_allergen_names(d, "contains"), cell_style),
            P(_allergen_names(d, "traces"), cell_style),
            P(kitchen_label, cell_style),
        ])

    table = Table(data, colWidths=[160, 90, 200, 200, 70], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#166534")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#94a3b8")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(table)
    story.append(Spacer(1, 10))

    story.append(P("Dichiarazione del responsabile", subtitle_style))
    story.append(P(owner_decl, body_style))
    story.append(Spacer(1, 6))

    sign_data = [[
        P(
            f"Referente / dichiarante: {confirmer_name or r.allergen_manager or '________________'}\n"
            f"Data conferma digitale: {legal_confirmed_label}\n"
            f"Data stampa: {generated_label}\n\n"
            "Firma del responsabile: ________________________________",
            meta_style,
        ),
        P(
            "Timbro del locale (facoltativo):\n\n\n\n"
            "________________________________",
            meta_style,
        ),
    ]]
    sign_table = Table(sign_data, colWidths=[360, 320])
    sign_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#166534")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#bbf7d0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
    ]))
    story.append(sign_table)
    story.append(Spacer(1, 8))
    story.append(P(
        "Nota: in caso di modifica del menù, ristampare immediatamente questo registro e sostituire "
        "la copia precedente. Conservare le versioni precedenti per eventuali controlli. "
        f"ID documento: {doc_id}.",
        small_style,
    ))

    def _footer(canvas, _doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.HexColor("#64748b"))
        canvas.drawString(18 * mm, 8 * mm, f"{r.name} · Registro allergeni v{menu_version} · {doc_id}")
        canvas.drawRightString(
            landscape(A4)[0] - 18 * mm,
            8 * mm,
            f"Pagina {_doc.page}",
        )
        canvas.restoreState()

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    buffer.seek(0)

    filename = f"registro-allergeni-{r.public_code}-v{menu_version}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------- Gestione Multi-menù & Traduzione AI ----------

@router.post("/restaurants/{rid}/menu/translate", status_code=200)
def auto_translate_menu(
    rid: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Chiama Gemini per tradurre tutti i piatti del menù in en, es, de, fr e li salva."""
    r = _my_restaurant(rid, user, db)
    _ensure_menu_access(r)
    
    if not r.dishes:
        raise HTTPException(400, "Nessun piatto presente nel menù da tradurre.")
        
    dishes_data = [
        {"id": d.id, "name": d.name, "description": d.description}
        for d in r.dishes
    ]
    
    from ..services.translate import translate_dishes
    
    translations = translate_dishes(dishes_data)
    
    # Cancella eventuali traduzioni precedenti per evitare duplicati
    for d in r.dishes:
        db.query(DishTranslation).filter(DishTranslation.dish_id == d.id).delete()
        
    db.commit()
    
    for item in translations:
        db.add(DishTranslation(
            dish_id=item["dish_id"],
            lang=item["lang"],
            name=item["name"],
            description=item.get("description"),
        ))
        
    db.commit()
    return {"status": "ok", "count": len(translations)}


@router.get("/restaurants/{rid}/menus", response_model=list[MenuOutItem])
def list_menus(
    rid: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Ritorna l'elenco dei menù del ristorante."""
    r = _my_restaurant(rid, user, db)
    return [
        MenuOutItem(
            id=m.id,
            restaurant_id=m.restaurant_id,
            name=m.name,
            is_active=bool(m.is_active),
            sort_order=m.sort_order,
            created_at=m.created_at
        )
        for m in r.menus
    ]


@router.post("/restaurants/{rid}/menus", response_model=MenuOutItem, status_code=201)
def create_menu(
    rid: int,
    data: MenuIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Crea un nuovo menù per il ristorante."""
    r = _my_restaurant(rid, user, db)
    _ensure_menu_access(r)
    
    new_menu = Menu(
        restaurant_id=r.id,
        name=data.name,
        is_active=1 if data.is_active else 0,
        sort_order=data.sort_order,
    )
    db.add(new_menu)
    db.commit()
    db.refresh(new_menu)
    return MenuOutItem(
        id=new_menu.id,
        restaurant_id=new_menu.restaurant_id,
        name=new_menu.name,
        is_active=bool(new_menu.is_active),
        sort_order=new_menu.sort_order,
        created_at=new_menu.created_at
    )


@router.put("/restaurants/{rid}/menus/{menu_id}", response_model=MenuOutItem)
def update_menu(
    rid: int,
    menu_id: int,
    data: MenuIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Modifica un menù esistente."""
    r = _my_restaurant(rid, user, db)
    menu = db.get(Menu, menu_id)
    if not menu or menu.restaurant_id != r.id:
        raise HTTPException(404, "Menù non trovato")
        
    menu.name = data.name
    menu.is_active = 1 if data.is_active else 0
    menu.sort_order = data.sort_order
    db.commit()
    db.refresh(menu)
    return MenuOutItem(
        id=menu.id,
        restaurant_id=menu.restaurant_id,
        name=menu.name,
        is_active=bool(menu.is_active),
        sort_order=menu.sort_order,
        created_at=menu.created_at
    )


@router.delete("/restaurants/{rid}/menus/{menu_id}", status_code=204)
def delete_menu(
    rid: int,
    menu_id: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Rimuove un menù (i piatti associati verranno scollegati, impostando menu_id = NULL)."""
    r = _my_restaurant(rid, user, db)
    menu = db.get(Menu, menu_id)
    if not menu or menu.restaurant_id != r.id:
        raise HTTPException(404, "Menù non trovato")
        
    db.delete(menu)
    db.commit()
    return None
