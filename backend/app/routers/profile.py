import uuid
from datetime import datetime, timezone
from io import BytesIO

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Allergen,
    AllergenExtraction,
    DeviceToken,
    DocumentAccessLog,
    MedicalDocument,
    Notification,
    User,
    UserAllergen,
    UserDocument,
)
from ..schemas import (
    AllergenOut,
    AppleHealthIn,
    ConfirmExtractionIn,
    DeviceTokenIn,
    DocumentExtractionResultOut,
    ExtractionOut,
    LegalConsentIn,
    MedicalDocumentOut,
    NotificationOut,
    ProfileAllergensIn,
    ProfilePhotoOut,
    UserDocumentOut,
    UserProfileOut,
)
from ..security import get_current_user
from ..rate_limit import rate_limiter
from ..legal import LEGAL_TERMS_VERSION, PRIVACY_VERSION, SAFETY_DISCLAIMER_VERSION
from ..services import storage
from ..services.medical_document_analyze import analyze_medical_document

router = APIRouter(prefix="/profile", tags=["profile"])

PHOTO_MAX_BYTES = 5 * 1024 * 1024
PHOTO_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
DOCUMENT_MAX_BYTES = 10 * 1024 * 1024
DOCUMENT_ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
# Firma magic bytes: la validazione non si fida del solo Content-Type dichiarato
_MAGIC_SIGNATURES = {
    "application/pdf": [b"%PDF"],
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG"],
    "image/webp": [b"RIFF"],
}
EXTRACTIONS_PER_MONTH = 5  # limite AI per utente (il cliente è gratuito)
MEDICAL_URL_TTL_SECONDS = 300  # 5 minuti, mai link permanenti


def _validate_magic(content: bytes, mime_type: str) -> None:
    signatures = _MAGIC_SIGNATURES.get(mime_type, [])
    if signatures and not any(content.startswith(s) for s in signatures):
        raise HTTPException(415, "Il contenuto del file non corrisponde al formato dichiarato")


@router.get("", response_model=UserProfileOut)
def get_profile(user: User = Depends(get_current_user)):
    """Restituisce il profilo completo dell'utente corrente (inclusi dati Apple Salute)."""
    return user


@router.get("/allergens", response_model=list[AllergenOut])
def get_my_allergens(user: User = Depends(get_current_user)):
    return [
        AllergenOut(
            id=ua.allergen.id,
            code=ua.allergen.code,
            name_it=ua.allergen.name_it,
            emoji=ua.allergen.emoji,
            is_diet=ua.allergen.is_diet,
            intensity=ua.intensity,
        )
        for ua in user.user_allergens
    ]


@router.put("/allergens", response_model=list[AllergenOut])
def set_my_allergens(
    data: ProfileAllergensIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    codes = data.allergen_codes
    intensity_map = {}
    if data.allergens:
        codes = [a.code for a in data.allergens]
        intensity_map = {a.code: a.intensity for a in data.allergens}

    allergens = db.scalars(
        select(Allergen).where(Allergen.code.in_(codes))
    ).all()
    if len(allergens) != len(set(codes)):
        raise HTTPException(400, "Uno o più codici allergene non validi")

    db.execute(delete(UserAllergen).where(UserAllergen.user_id == user.id))
    now = datetime.now(timezone.utc)
    for a in allergens:
        intensity = intensity_map.get(a.code, "moderata")
        db.add(UserAllergen(
            user_id=user.id, allergen_id=a.id, source="manual", confirmed_at=now, intensity=intensity
        ))
    user.onboarding_completed_at = now
    db.commit()
    db.refresh(user)

    return [
        AllergenOut(
            id=ua.allergen.id,
            code=ua.allergen.code,
            name_it=ua.allergen.name_it,
            emoji=ua.allergen.emoji,
            is_diet=ua.allergen.is_diet,
            intensity=ua.intensity,
        )
        for ua in user.user_allergens
    ]


@router.post("/legal-consents", response_model=UserProfileOut)
def accept_legal_consents(
    data: LegalConsentIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not data.accept_terms or not data.accept_privacy:
        raise HTTPException(400, "Termini e Informativa Privacy sono obbligatori")
    if user.role == "customer" and not data.accept_health_data:
        raise HTTPException(400, "Serve il consenso esplicito al trattamento dei dati su allergie e preferenze alimentari")

    now = datetime.now(timezone.utc)
    user.terms_accepted_at = now
    user.privacy_accepted_at = now
    user.legal_terms_version = LEGAL_TERMS_VERSION
    user.privacy_version = PRIVACY_VERSION
    if user.role == "customer":
        user.health_data_consent_at = now
    db.commit()
    db.refresh(user)
    return user


@router.post("/disclaimer", status_code=204)
def accept_disclaimer(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    user.disclaimer_accepted_at = datetime.now(timezone.utc)
    user.safety_disclaimer_version = SAFETY_DISCLAIMER_VERSION
    db.commit()


@router.put("/apple-health", response_model=UserProfileOut)
def update_apple_health(
    data: AppleHealthIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggiorna lo stato di connessione con Apple Salute e l'elenco dei farmaci salvavita/medicinali."""
    user.apple_health_connected = data.apple_health_connected
    user.emergency_medicines = data.emergency_medicines
    user.emergency_contact_name = data.emergency_contact_name
    user.emergency_contact_phone = data.emergency_contact_phone
    db.commit()
    db.refresh(user)
    return user


# ---------- Foto profilo (storage privato + URL firmato) ----------

@router.post("/photo", response_model=ProfilePhotoOut)
async def upload_profile_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Carica la foto profilo: resize a 512px, storage privato, URL firmato 1h."""
    mime_type = (file.content_type or "").lower()
    if mime_type not in PHOTO_ALLOWED_TYPES:
        raise HTTPException(415, "Carica un'immagine JPG, PNG o WebP")
    content = await file.read()
    if not content:
        raise HTTPException(400, "Il file immagine è vuoto")
    if len(content) > PHOTO_MAX_BYTES:
        raise HTTPException(413, "Immagine troppo grande: massimo 5 MB")
    _validate_magic(content, mime_type)

    try:
        from PIL import Image, ImageOps
        img = Image.open(BytesIO(content))
        img = ImageOps.exif_transpose(img).convert("RGB")
        img.thumbnail((512, 512))
        out = BytesIO()
        img.save(out, format="JPEG", quality=85)
        content = out.getvalue()
    except ImportError:
        pass  # Pillow assente: salva l'originale (già validato per tipo e dimensione)
    except Exception:
        raise HTTPException(400, "Immagine non valida o corrotta")

    old_key = user.photo_key
    key = f"profile/{user.id}/{uuid.uuid4()}.jpg"
    storage.put_bytes(key, content, "image/jpeg")
    user.photo_key = key
    db.commit()
    if old_key:
        storage.delete(old_key)
    return ProfilePhotoOut(photo_url=storage.signed_url(key, 3600))


@router.get("/photo", response_model=ProfilePhotoOut)
def get_profile_photo(user: User = Depends(get_current_user)):
    if not user.photo_key:
        raise HTTPException(404, "Nessuna foto profilo")
    return ProfilePhotoOut(photo_url=storage.signed_url(user.photo_key, 3600))


@router.delete("/photo", status_code=204)
def delete_profile_photo(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if user.photo_key:
        storage.delete(user.photo_key)
        user.photo_key = None
        db.commit()


# ---------- Documenti medici + estrazione AI (art. 9 GDPR) ----------

def _my_document(doc_id: int, user: User, db: Session) -> MedicalDocument:
    doc = db.get(MedicalDocument, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(404, "Documento non trovato")
    return doc


def _extractions_used_this_month(user: User, db: Session) -> int:
    """Documenti dell'utente analizzati con AI nel mese corrente (i falliti non contano)."""
    now = datetime.now(timezone.utc)
    return db.scalar(
        select(func.count(func.distinct(AllergenExtraction.document_id)))
        .join(MedicalDocument, MedicalDocument.id == AllergenExtraction.document_id)
        .where(
            MedicalDocument.user_id == user.id,
            func.year(AllergenExtraction.created_at) == now.year,
            func.month(AllergenExtraction.created_at) == now.month,
        )
    ) or 0


def _doc_to_out(doc: MedicalDocument, with_url: bool = False) -> MedicalDocumentOut:
    return MedicalDocumentOut(
        id=doc.id,
        filename=doc.filename,
        mime_type=doc.mime_type,
        status=doc.status,
        ai_consent_at=doc.ai_consent_at,
        uploaded_at=doc.uploaded_at,
        url=storage.signed_url(doc.storage_key, MEDICAL_URL_TTL_SECONDS) if with_url else None,
    )


@router.get("/medical-documents", response_model=list[MedicalDocumentOut])
def list_medical_documents(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    docs = db.scalars(
        select(MedicalDocument)
        .where(MedicalDocument.user_id == user.id)
        .order_by(MedicalDocument.uploaded_at.desc())
    ).all()
    return [_doc_to_out(d) for d in docs]


@router.post("/medical-documents", response_model=MedicalDocumentOut, status_code=201)
async def upload_medical_document(
    file: UploadFile = File(...),
    ai_consent: bool = Form(False),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Carica un referto medico su storage PRIVATO (mai /static).

    `ai_consent` è il consenso specifico e separato all'analisi AI di QUESTO
    documento (distinto dal consenso generale sui dati sanitari).
    """
    if user.role != "customer":
        raise HTTPException(403, "I documenti medici sono riservati ai profili cliente")
    if not user.health_data_consent_at:
        raise HTTPException(403, "Serve prima il consenso al trattamento dei dati sanitari")
    mime_type = (file.content_type or "").lower()
    if mime_type not in DOCUMENT_ALLOWED_TYPES:
        raise HTTPException(415, "Formati accettati: PDF, JPG, PNG, WebP")
    content = await file.read()
    if not content:
        raise HTTPException(400, "Il file è vuoto")
    if len(content) > DOCUMENT_MAX_BYTES:
        raise HTTPException(413, "File troppo grande: massimo 10 MB")
    _validate_magic(content, mime_type)

    ext = DOCUMENT_ALLOWED_TYPES[mime_type]
    key = f"medical/{user.id}/{uuid.uuid4()}{ext}"
    storage.put_bytes(key, content, mime_type)
    doc = MedicalDocument(
        user_id=user.id,
        storage_key=key,
        filename=file.filename or f"documento{ext}",
        mime_type=mime_type,
        ai_consent_at=datetime.now(timezone.utc) if ai_consent else None,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _doc_to_out(doc)


@router.get("/medical-documents/{doc_id}/download", response_model=MedicalDocumentOut)
def download_medical_document(
    doc_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """URL firmato valido 5 minuti. Ogni accesso viene tracciato (GDPR)."""
    doc = _my_document(doc_id, user, db)
    db.add(DocumentAccessLog(document_id=doc.id, accessed_by=user.id))
    db.commit()
    return _doc_to_out(doc, with_url=True)


@router.post(
    "/medical-documents/{doc_id}/extract",
    response_model=DocumentExtractionResultOut,
    dependencies=[Depends(rate_limiter(5, 300))],
)
def extract_allergens_from_document(
    doc_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Estrazione AI degli allergeni. L'AI NON scrive mai il profilo: i risultati
    restano suggerimenti (applied=0) finché l'utente non li conferma."""
    doc = _my_document(doc_id, user, db)
    if not doc.ai_consent_at:
        raise HTTPException(
            403,
            "Per questo documento non hai autorizzato l'analisi AI. "
            "Ricaricalo spuntando il consenso specifico.",
        )
    used = _extractions_used_this_month(user, db)
    if used >= EXTRACTIONS_PER_MONTH:
        raise HTTPException(
            429,
            f"Hai raggiunto il limite di {EXTRACTIONS_PER_MONTH} analisi AI questo mese. "
            "Puoi comunque inserire le allergie manualmente dal profilo.",
        )

    try:
        data = storage.get_bytes(doc.storage_key)
    except Exception:
        raise HTTPException(500, "Impossibile leggere il documento dallo storage")

    result = analyze_medical_document(data, doc.mime_type)

    # Sostituisce le estrazioni non ancora applicate di questo documento
    db.execute(
        delete(AllergenExtraction).where(
            AllergenExtraction.document_id == doc.id,
            AllergenExtraction.applied == 0,
        )
    )
    valid_codes = set(db.scalars(select(Allergen.code)).all())
    rows: list[AllergenExtraction] = []
    for a in result.allergeni:
        if a.codice in valid_codes:
            row = AllergenExtraction(
                document_id=doc.id, allergen_code=a.codice, confidence=a.confidenza
            )
            db.add(row)
            rows.append(row)
    doc.status = "processed" if (rows or not result.ai_stub) else "failed"
    db.commit()

    return DocumentExtractionResultOut(
        document_id=doc.id,
        status=doc.status,
        extractions=[ExtractionOut.model_validate(r) for r in rows],
        remaining_this_month=max(0, EXTRACTIONS_PER_MONTH - _extractions_used_this_month(user, db)),
        note=result.note,
    )


@router.post("/allergens/confirm-extraction", response_model=list[AllergenOut])
def confirm_extraction(
    data: ConfirmExtractionIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Conferma umana obbligatoria: solo qui i suggerimenti AI entrano nel profilo."""
    doc = _my_document(data.document_id, user, db)
    extracted_codes = {e.allergen_code for e in doc.extractions}
    unknown = set(data.allergen_codes) - extracted_codes
    if unknown:
        raise HTTPException(400, f"Codici non presenti nell'estrazione: {sorted(unknown)}")

    now = datetime.now(timezone.utc)
    allergens = db.scalars(
        select(Allergen).where(Allergen.code.in_(data.allergen_codes))
    ).all()
    existing_ids = {
        ua.allergen_id
        for ua in db.scalars(
            select(UserAllergen).where(UserAllergen.user_id == user.id)
        ).all()
    }
    for a in allergens:
        if a.id not in existing_ids:
            db.add(UserAllergen(
                user_id=user.id, allergen_id=a.id, source="document_ai", confirmed_at=now
            ))
    for e in doc.extractions:
        if e.allergen_code in set(data.allergen_codes):
            e.applied = 1
    db.commit()
    db.refresh(user)
    return [
        AllergenOut(
            id=ua.allergen.id,
            code=ua.allergen.code,
            name_it=ua.allergen.name_it,
            emoji=ua.allergen.emoji,
            is_diet=ua.allergen.is_diet,
            intensity=ua.intensity,
        )
        for ua in user.user_allergens
    ]


@router.delete("/medical-documents/{doc_id}", status_code=204)
def delete_medical_document(
    doc_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancellazione REALE: rimuove sia la riga a DB sia il file dallo storage."""
    doc = _my_document(doc_id, user, db)
    storage.delete(doc.storage_key)
    db.delete(doc)
    db.commit()


# ---------- Notifiche e device token ----------

@router.post("/device-token", status_code=204)
def register_device_token(
    data: DeviceTokenIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exists = db.get(DeviceToken, (user.id, data.expo_token))
    if not exists:
        db.add(DeviceToken(user_id=user.id, expo_token=data.expo_token))
        db.commit()


@router.delete("/device-token", status_code=204)
def unregister_device_token(
    data: DeviceTokenIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    token = db.get(DeviceToken, (user.id, data.expo_token))
    if token:
        db.delete(token)
        db.commit()


@router.get("/notifications", response_model=list[NotificationOut])
def list_notifications(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return db.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    ).all()


@router.post("/notifications/{notif_id}/read", status_code=204)
def mark_notification_read(
    notif_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    n = db.get(Notification, notif_id)
    if not n or n.user_id != user.id:
        raise HTTPException(404, "Notifica non trovata")
    if not n.read_at:
        n.read_at = datetime.now(timezone.utc)
        db.commit()


# ---------- Cancellazione account (GDPR) ----------

@router.delete("", status_code=204)
def delete_account(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Diritto alla cancellazione: rimuove file privati dallo storage e l'account.

    Le righe a DB collegate cadono in cascata (FK ON DELETE CASCADE).
    """
    docs = db.scalars(
        select(MedicalDocument).where(MedicalDocument.user_id == user.id)
    ).all()
    for d in docs:
        storage.delete(d.storage_key)
    if user.photo_key:
        storage.delete(user.photo_key)
    db.delete(user)
    db.commit()


# ---------- Documenti storici (endpoint legacy) ----------

@router.get("/documents", response_model=list[UserDocumentOut])
def get_my_documents(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Documenti caricati con il vecchio flusso (deprecato: usa /medical-documents)."""
    return db.scalars(
        select(UserDocument).where(UserDocument.user_id == user.id)
    ).all()
