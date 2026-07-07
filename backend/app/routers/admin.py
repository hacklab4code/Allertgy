from __future__ import annotations

import json
import os
import secrets
import uuid
from io import BytesIO
from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select
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
)
from ..schemas import (
    AnalyzeOut,
    ApproveMenuIn,
    DishIn,
    DishOut,
    MenuAuditOut,
    MenuSaveIn,
    PhotoOut,
    RestaurantIn,
    RestaurantOut,
)
from ..security import require_owner
from ..services import storage
from ..services.menu_analyze import analyze_menu_image
from ..services.push import notify_users
from ..services.slugs import ensure_slug
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
MENU_PLANS = {"verified", "pro", "premium"}
MENU_ACCESS_STATUSES = {"trialing", "active", "comped"}
# Limiti galleria foto per piano (vedi PIANO_LANCIO.md §7)
PLAN_PHOTO_LIMITS = {"free": 1, "verified": 3, "pro": 8, "premium": 20}


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
    has_plan = (r.business_plan or "free") in MENU_PLANS
    has_status = (r.subscription_status or "free") in MENU_ACCESS_STATUSES
    if not ((has_plan and has_status) or r.subscription_status == "comped"):
        raise HTTPException(
            402,
            "Il menù digitale con allergeni per piatto è incluso nel piano Pro o Premium.",
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
):
    """Riceve la foto del menù cartaceo e restituisce piatti+allergeni.
    Per ora usa lo stub; con GEMINI_API_KEY configurata userà Gemini Vision."""
    content, mime_type = await _read_image_upload(file, max_bytes=MAX_MENU_IMAGE_BYTES)
    return analyze_menu_image(content, file.filename or "menu.jpg", mime_type)


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
        )
        db.add(dish)
        db.flush()
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
    db.refresh(r)
    return [dish_to_out(d) for d in r.dishes]


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
    if not data.legal_acknowledged:
        raise HTTPException(400, "Devi confermare di aver verificato allergeni, tracce e responsabilità del menù")
    now = datetime.now(timezone.utc)
    r.menu_version = (r.menu_version or 0) + 1
    r.menu_updated_at = now
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
        note="Menù approvato e pubblicato dal ristoratore",
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


@router.get("/restaurants/{rid}/registry.pdf")
def export_allergen_registry(
    rid: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Esporta il registro allergeni del locale in PDF per stampa o archivio."""
    r = _my_restaurant(rid, user, db)
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except ImportError:
        raise HTTPException(
            503,
            "Export PDF non disponibile: installa la dipendenza backend 'reportlab'.",
        )

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=24,
        rightMargin=24,
        topMargin=24,
        bottomMargin=24,
    )
    styles = getSampleStyleSheet()
    story = [
        Paragraph(f"Registro allergeni - {r.name}", styles["Title"]),
        Paragraph(
            (
                f"Codice locale: {r.public_code} | Citta: {r.city or '-'} | "
                f"Versione menu: {r.menu_version or 0}"
            ),
            styles["Normal"],
        ),
        Paragraph(
            (
                "Informazioni dichiarate dal ristoratore. Il cliente deve sempre "
                "comunicare allergie e intolleranze al personale prima di ordinare."
            ),
            styles["Normal"],
        ),
        Spacer(1, 12),
    ]

    data = [["Piatto", "Menu", "Categoria", "Contiene", "Possibili tracce"]]
    for d in sorted(r.dishes, key=lambda x: ((x.menu_group or ""), (x.category or ""), x.name)):
        if not d.is_available:
            continue
        data.append([
            Paragraph(d.name, styles["BodyText"]),
            Paragraph(d.menu_group or "Principale", styles["BodyText"]),
            Paragraph(d.category or "-", styles["BodyText"]),
            Paragraph(_allergen_names(d, "contains"), styles["BodyText"]),
            Paragraph(_allergen_names(d, "traces"), styles["BodyText"]),
        ])

    table = Table(data, colWidths=[170, 90, 90, 230, 230], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#166534")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(table)
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        (
            f"Ultimo aggiornamento: {r.menu_updated_at or '-'} | "
            f"Conferma responsabilita: {r.menu_legal_confirmed_at or '-'} | "
            f"Versione legale: {r.menu_legal_version or '-'}"
        ),
        styles["Normal"],
    ))
    doc.build(story)
    buffer.seek(0)

    filename = f"registro-allergeni-{r.public_code}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
