from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Allergen, User, UserAllergen, UserDocument
from ..schemas import (
    AllergenOut,
    AppleHealthIn,
    LegalConsentIn,
    ProfileAllergensIn,
    UserDocumentOut,
    UserProfileOut,
)
from ..security import get_current_user
from ..legal import LEGAL_TERMS_VERSION, PRIVACY_VERSION, SAFETY_DISCLAIMER_VERSION

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserProfileOut)
def get_profile(user: User = Depends(get_current_user)):
    """Restituisce il profilo completo dell'utente corrente (inclusi dati Apple Salute)."""
    return user


@router.get("/allergens", response_model=list[AllergenOut])
def get_my_allergens(user: User = Depends(get_current_user)):
    return user.allergens


@router.put("/allergens", response_model=list[AllergenOut])
def set_my_allergens(
    data: ProfileAllergensIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allergens = db.scalars(
        select(Allergen).where(Allergen.code.in_(data.allergen_codes))
    ).all()
    if len(allergens) != len(set(data.allergen_codes)):
        raise HTTPException(400, "Uno o più codici allergene non validi")
    db.execute(delete(UserAllergen).where(UserAllergen.user_id == user.id))
    for a in allergens:
        db.add(UserAllergen(user_id=user.id, allergen_id=a.id))
    user.onboarding_completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user.allergens


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
    db.commit()
    db.refresh(user)
    return user


@router.get("/documents", response_model=list[UserDocumentOut])
def get_my_documents(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Restituisce eventuali documenti storici.

    L'upload di nuovi certificati e' disabilitato nell'MVP: sono dati sanitari
    sensibili e non servono per il flusso principale ristoratore/cliente.
    """
    return db.scalars(
        select(UserDocument).where(UserDocument.user_id == user.id)
    ).all()


@router.post("/upload-document", status_code=410)
async def upload_document(user: User = Depends(get_current_user)):
    """Endpoint mantenuto per compatibilita', ma disabilitato nell'MVP."""
    raise HTTPException(
        410,
        "Upload certificati medici disabilitato nell'MVP per tutela privacy. "
        "Usa le note di emergenza senza caricare documenti sanitari.",
    )
