import secrets
import uuid
from datetime import datetime, timedelta, timezone
from io import BytesIO
from typing import Optional

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
    ProfileShare,
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
    SubProfileIn,
    SubProfileOut,
    SubProfileAllergenOut,
    ProfileShareCreateIn,
    ProfileShareOut,
    ReferralStatsOut,
    SharedProfileOut,
    ContactLookupIn,
    ContactLookupOut,
    AppContactMatch,
    RecentAppContactOut,
    BarcodeScanOut,
)
from ..security import get_current_user
from ..rate_limit import rate_limiter
from ..legal import LEGAL_TERMS_VERSION, PRIVACY_VERSION, SAFETY_DISCLAIMER_VERSION
from ..services import storage
from ..services.medical_document_analyze import analyze_medical_document
from ..services.push import notify_users
from ..services.plan_limits import ensure_barcode_scan_allowed, remaining_barcode_scans
from ..services.referrals import (
    customer_has_plus,
    ensure_customer_invite_code,
    referral_stats,
)

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
EXTRACTIONS_PER_MONTH_FREE = 0
EXTRACTIONS_PER_MONTH_PLUS = 5


def _medical_ai_limit(user: User) -> int:
    return EXTRACTIONS_PER_MONTH_PLUS if customer_has_plus(user) else EXTRACTIONS_PER_MONTH_FREE
MEDICAL_URL_TTL_SECONDS = 300  # 5 minuti, mai link permanenti


def _validate_magic(content: bytes, mime_type: str) -> None:
    signatures = _MAGIC_SIGNATURES.get(mime_type, [])
    if signatures and not any(content.startswith(s) for s in signatures):
        raise HTTPException(415, "Il contenuto del file non corrisponde al formato dichiarato")


@router.get("", response_model=UserProfileOut)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Restituisce il profilo completo dell'utente corrente (inclusi dati Apple Salute)."""
    if user.role == "customer" and not user.invite_code:
        ensure_customer_invite_code(user, db)
        db.commit()
        db.refresh(user)
    return user


@router.get("/referral", response_model=ReferralStatsOut)
def get_referral_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Codice invito e statistiche referral per clienti che portano commercianti."""
    if user.role != "customer":
        raise HTTPException(403, "Il programma inviti è riservato agli utenti cliente")
    stats = referral_stats(user, db)
    db.commit()
    reward_message = (
        "Porta un ristoratore con il tuo codice: quando crea il locale, "
        "sblocchi gratis Plus Famiglia e gli regali 1 mese di piano Pro."
    )
    return ReferralStatsOut(**stats, reward_message=reward_message)


@router.post("/barcode-scan", response_model=BarcodeScanOut)
def record_barcode_scan(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Verifica e registra una scansione barcode (limite 20/mese su piano free)."""
    if user.role != "customer":
        raise HTTPException(403, "Solo i clienti possono usare lo scanner spesa")
    remaining = ensure_barcode_scan_allowed(user, db)
    from ..services.plan_limits import customer_barcode_limit
    limit = customer_barcode_limit(user)
    db.commit()
    return BarcodeScanOut(allowed=True, remaining=remaining, limit=limit)


@router.get("/barcode-scan/remaining", response_model=BarcodeScanOut)
def barcode_scans_remaining(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    from ..services.plan_limits import customer_barcode_limit
    remaining = remaining_barcode_scans(user, db)
    limit = customer_barcode_limit(user)
    return BarcodeScanOut(allowed=True, remaining=remaining, limit=limit)


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
    limit = _medical_ai_limit(user)
    if limit <= 0:
        raise HTTPException(
            403,
            "Le analisi AI sui documenti medici sono incluse nel piano Plus Famiglia. "
            "Porta un ristoratore con il tuo codice invito per sbloccarlo gratis.",
        )
    if used >= limit:
        raise HTTPException(
            429,
            f"Hai raggiunto il limite di {limit} analisi AI questo mese. "
            "Puoi comunque inserire le allergie manualmente dal profilo.",
        )

    try:
        data = storage.get_bytes(doc.storage_key)
    except Exception:
        raise HTTPException(500, "Impossibile leggere il documento dallo storage")

    valid_allergens = [
        {"code": a.code, "name_it": a.name_it}
        for a in db.scalars(select(Allergen)).all()
    ]
    result = analyze_medical_document(data, doc.mime_type, valid_allergens=valid_allergens)

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
        remaining_this_month=max(0, _medical_ai_limit(user) - _extractions_used_this_month(user, db)),
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


# ---------- Gestione Sottoprofili (Fase 3) ----------

@router.get("/sub-profiles", response_model=list[SubProfileOut])
def list_sub_profiles(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Elenca tutti i profili dell'utente corrente (famiglia / sottoprofili)."""
    from ..models import UserProfile
    profiles = db.scalars(
        select(UserProfile)
        .where(UserProfile.user_id == user.id)
        .order_by(UserProfile.relationship == 'io', UserProfile.created_at)
    ).all()
    
    res = []
    for p in profiles:
        allergen_list = []
        for pa in p.profile_allergens:
            from ..models import Allergen
            a_obj = db.get(Allergen, pa.allergen_id)
            if a_obj:
                allergen_list.append(
                    SubProfileAllergenOut(
                        code=a_obj.code,
                        name_it=a_obj.name_it,
                        emoji=a_obj.emoji,
                        intensity=pa.intensity
                    )
                )
        res.append(
            SubProfileOut(
                id=p.id,
                name=p.name,
                relationship=p.relationship,
                allergens=allergen_list,
                created_at=p.created_at
            )
        )
    return res


@router.post("/sub-profiles", response_model=SubProfileOut)
def create_sub_profile(
    data: SubProfileIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea un nuovo sottoprofilo (es. figlio, coniuge)."""
    from ..models import UserProfile, ProfileAllergen, Allergen

    if not customer_has_plus(user):
        raise HTTPException(
            403,
            "I profili famiglia sono inclusi nel piano Plus Famiglia. "
            "Porta un ristoratore con il tuo codice invito per sbloccarlo gratis.",
        )
    
    p = UserProfile(user_id=user.id, name=data.name, relationship=data.relationship)
    db.add(p)
    db.commit()
    db.refresh(p)
    
    allergen_list = []
    for item in data.allergens:
        a_obj = db.scalar(select(Allergen).where(Allergen.code == item.code))
        if not a_obj:
            raise HTTPException(400, f"Codice allergene non valido: {item.code}")
        
        pa = ProfileAllergen(
            profile_id=p.id,
            allergen_id=a_obj.id,
            source="manual",
            intensity=item.intensity
        )
        db.add(pa)
        allergen_list.append(
            SubProfileAllergenOut(
                code=a_obj.code,
                name_it=a_obj.name_it,
                emoji=a_obj.emoji,
                intensity=item.intensity
            )
        )
    db.commit()
    
    return SubProfileOut(
        id=p.id,
        name=p.name,
        relationship=p.relationship,
        allergens=allergen_list,
        created_at=p.created_at
    )


@router.put("/sub-profiles/{pid}", response_model=SubProfileOut)
def update_sub_profile(
    pid: int,
    data: SubProfileIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggiorna un sottoprofilo esistente (inclusi allergeni)."""
    from ..models import UserProfile, ProfileAllergen, Allergen
    
    p = db.get(UserProfile, pid)
    if not p or p.user_id != user.id:
        raise HTTPException(404, "Sottoprofilo non trovato")
        
    p.name = data.name
    if p.relationship != 'io':
        p.relationship = data.relationship
        
    db.commit()
    
    db.execute(delete(ProfileAllergen).where(ProfileAllergen.profile_id == p.id))
    db.commit()
    
    allergen_list = []
    for item in data.allergens:
        a_obj = db.scalar(select(Allergen).where(Allergen.code == item.code))
        if not a_obj:
            raise HTTPException(400, f"Codice allergene non valido: {item.code}")
        
        pa = ProfileAllergen(
            profile_id=p.id,
            allergen_id=a_obj.id,
            source="manual",
            intensity=item.intensity
        )
        db.add(pa)
        allergen_list.append(
            SubProfileAllergenOut(
                code=a_obj.code,
                name_it=a_obj.name_it,
                emoji=a_obj.emoji,
                intensity=item.intensity
            )
        )
    db.commit()
    
    return SubProfileOut(
        id=p.id,
        name=p.name,
        relationship=p.relationship,
        allergens=allergen_list,
        created_at=p.created_at
    )


@router.delete("/sub-profiles/{pid}")
def delete_sub_profile(
    pid: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Elimina un sottoprofilo. Non è possibile eliminare il proprio profilo principale 'io'."""
    from ..models import UserProfile
    
    p = db.get(UserProfile, pid)
    if not p or p.user_id != user.id:
        raise HTTPException(404, "Sottoprofilo non trovato")
        
    if p.relationship == 'io':
        raise HTTPException(400, "Non è consentito eliminare il proprio profilo principale")
        
    db.delete(p)
    db.commit()
    return {"detail": "Sottoprofilo eliminato con successo"}


# ---------- Condivisione profilo allergie ----------

def _share_allergens_from_user(user: User) -> list[SubProfileAllergenOut]:
    return [
        SubProfileAllergenOut(
            code=ua.allergen.code,
            name_it=ua.allergen.name_it,
            emoji=ua.allergen.emoji,
            intensity=ua.intensity,
        )
        for ua in user.user_allergens
    ]


def _share_allergens_from_profile(profile) -> list[SubProfileAllergenOut]:
    return [
        SubProfileAllergenOut(
            code=pa.allergen.code,
            name_it=pa.allergen.name_it,
            emoji=pa.allergen.emoji,
            intensity=pa.intensity,
        )
        for pa in profile.profile_allergens
    ]


def _email_hint(email: str) -> str:
    local, _, domain = email.partition("@")
    if not domain:
        return email
    masked = (local[:1] + "***") if local else "***"
    return f"{masked}@{domain}"


def _resolve_share_recipient(
    data: ProfileShareCreateIn,
    owner: User,
    db: Session,
) -> Optional[User]:
    if data.recipient_user_id:
        recipient = db.get(User, data.recipient_user_id)
        if (
            not recipient
            or recipient.role != "customer"
            or recipient.id == owner.id
        ):
            raise HTTPException(404, "Contatto AllerTgy non trovato")
        return recipient

    if data.recipient_email:
        recipient = db.scalar(
            select(User).where(
                User.email == str(data.recipient_email).lower(),
                User.role == "customer",
            )
        )
        if not recipient or recipient.id == owner.id:
            return None
        return recipient

    return None


def _deliver_profile_share_in_app(
    share: ProfileShare,
    owner: User,
    recipient: User,
    db: Session,
) -> None:
    owner_name = owner.display_name or "Un contatto"
    duration_label = "24 ore" if share.scope == "24h" else "sempre"
    payload = {
        "token": share.token,
        "label": share.label,
        "scope": share.scope,
        "owner_display_name": owner_name,
    }
    notify_users(
        db,
        [recipient.id],
        "profile_share",
        "Profilo allergie condiviso",
        f"{owner_name} ha condiviso il profilo «{share.label}» ({duration_label}).",
        payload,
    )


@router.post("/shares", response_model=ProfileShareOut, status_code=201)
def create_profile_share(
    data: ProfileShareCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crea un token per condividere un profilo allergie.

    `duration=24h` è pensato per festa/spesa temporanea. `permanent` è per
    famiglia o caregiver abituali. Il token espone solo allergeni e intensità.
    Se `recipient_user_id` o `recipient_email` punta a un utente AllerTgy,
    invia anche notifica in-app e push.
    """
    if user.role != "customer":
        raise HTTPException(403, "La condivisione profilo è riservata agli utenti cliente")

    if data.duration == "permanent" and not customer_has_plus(user):
        raise HTTPException(
            403,
            "La condivisione permanente è inclusa nel piano Plus Famiglia. "
            "Porta un ristoratore con il tuo codice invito per sbloccarlo gratis.",
        )

    label = (data.label or "").strip()
    source_profile_id = None
    if data.profile_id is not None:
        from ..models import UserProfile

        profile = db.get(UserProfile, data.profile_id)
        if not profile or profile.user_id != user.id:
            raise HTTPException(404, "Profilo da condividere non trovato")
        source_profile_id = profile.id
        label = label or profile.name
    else:
        label = label or (user.display_name or "Io")

    recipient = _resolve_share_recipient(data, user, db)

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=24) if data.duration == "24h" else None
    token = secrets.token_urlsafe(24)
    share = ProfileShare(
        owner_user_id=user.id,
        source_profile_id=source_profile_id,
        recipient_user_id=recipient.id if recipient else None,
        token=token,
        label=label[:120],
        scope=data.duration,
        expires_at=expires_at,
    )
    db.add(share)
    db.flush()

    delivered = False
    if recipient:
        _deliver_profile_share_in_app(share, user, recipient, db)
        delivered = True

    db.commit()
    db.refresh(share)
    return ProfileShareOut(
        id=share.id,
        token=share.token,
        label=share.label,
        scope=share.scope,
        expires_at=share.expires_at,
        created_at=share.created_at,
        share_url=f"/shared-profile/{share.token}",
        delivered_in_app=delivered,
        recipient_display_name=recipient.display_name if recipient else None,
    )


@router.post("/contacts/lookup", response_model=ContactLookupOut)
def lookup_app_contacts(
    data: ContactLookupIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verifica quali email della rubrica corrispondono a utenti AllerTgy."""
    if user.role != "customer":
        raise HTTPException(403, "Funzione riservata agli utenti cliente")

    normalized = {
        str(email).strip().lower()
        for email in data.emails
        if str(email).strip()
    }
    if not normalized:
        return ContactLookupOut(matches=[])

    rows = db.scalars(
        select(User).where(
            User.email.in_(normalized),
            User.role == "customer",
            User.id != user.id,
        )
    ).all()
    return ContactLookupOut(
        matches=[
            AppContactMatch(
                user_id=u.id,
                display_name=u.display_name,
                email=u.email,
                email_hint=_email_hint(u.email),
            )
            for u in rows
        ]
    )


@router.get("/contacts/recent", response_model=list[RecentAppContactOut])
def list_recent_app_contacts(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Utenti AllerTgy con cui hai condiviso di recente un profilo allergie."""
    if user.role != "customer":
        raise HTTPException(403, "Funzione riservata agli utenti cliente")

    shares = db.scalars(
        select(ProfileShare)
        .where(
            ProfileShare.owner_user_id == user.id,
            ProfileShare.recipient_user_id.isnot(None),
        )
        .order_by(ProfileShare.created_at.desc())
        .limit(50)
    ).all()

    seen: set[int] = set()
    recent: list[RecentAppContactOut] = []
    for share in shares:
        recipient_id = share.recipient_user_id
        if not recipient_id or recipient_id in seen:
            continue
        recipient = share.recipient or db.get(User, recipient_id)
        if not recipient:
            continue
        seen.add(recipient_id)
        recent.append(
            RecentAppContactOut(
                user_id=recipient.id,
                display_name=recipient.display_name,
                email_hint=_email_hint(recipient.email),
                last_shared_at=share.created_at,
            )
        )
        if len(recent) >= 20:
            break

    return recent


@router.get("/shares/{token}", response_model=SharedProfileOut)
def get_shared_profile(token: str, db: Session = Depends(get_db)):
    share = db.scalar(select(ProfileShare).where(ProfileShare.token == token))
    if not share or share.revoked_at:
        raise HTTPException(404, "Profilo condiviso non trovato")

    now = datetime.now(timezone.utc)
    expires_at = share.expires_at
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at <= now:
        raise HTTPException(410, "Questo profilo condiviso è scaduto")

    if share.source_profile:
        profile_name = share.source_profile.name
        relationship = share.source_profile.kinship
        allergens = _share_allergens_from_profile(share.source_profile)
    else:
        profile_name = share.label
        relationship = "io"
        allergens = _share_allergens_from_user(share.owner)

    return SharedProfileOut(
        token=share.token,
        label=share.label,
        owner_display_name=share.owner.display_name,
        profile_name=profile_name,
        relationship=relationship,
        expires_at=share.expires_at,
        allergens=allergens,
    )
