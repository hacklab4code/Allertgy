import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from typing import Optional

from ..models import MedicalDocument, PasswordResetToken, Restaurant, User
from ..schemas import (
    ChangePasswordIn,
    DeleteAccountIn,
    ForgotPasswordIn,
    LoginIn,
    RegisterIn,
    ResetPasswordIn,
    TokenOut,
)
from ..security import create_token, get_current_user, hash_password, verify_password
from ..rate_limit import rate_limiter
from ..legal import LEGAL_TERMS_VERSION, PRIVACY_VERSION
from ..services import storage
from ..services.emailer import send_password_reset
from ..services.referrals import ensure_customer_invite_code

router = APIRouter(prefix="/auth", tags=["auth"])

RESET_TOKEN_TTL_MINUTES = 30


def _validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(400, "La password deve contenere almeno 8 caratteri")
    if not any(c.islower() for c in password):
        raise HTTPException(400, "La password deve contenere almeno una lettera minuscola")
    if not any(c.isupper() for c in password):
        raise HTTPException(400, "La password deve contenere almeno una lettera maiuscola")
    if not any(c.isdigit() for c in password):
        raise HTTPException(400, "La password deve contenere almeno un numero")


@router.post("/register", response_model=TokenOut, status_code=201, dependencies=[Depends(rate_limiter(5, 60))])
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email già registrata")
    _validate_password_strength(data.password)
    if not data.accept_terms or not data.accept_privacy:
        raise HTTPException(400, "Per creare l'account devi accettare Termini e Informativa Privacy")
    if data.role == "customer" and not data.accept_health_data:
        raise HTTPException(400, "Per il profilo cliente serve il consenso esplicito al trattamento dei dati su allergie e preferenze alimentari")
    if data.role == "owner" and not data.accept_owner_responsibility:
        raise HTTPException(400, "Per il profilo ristoratore devi confermare la responsabilità sui dati pubblicati")

    now = datetime.now(timezone.utc)
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
        role=data.role,
        terms_accepted_at=now,
        privacy_accepted_at=now,
        health_data_consent_at=now if data.role == "customer" else None,
        legal_terms_version=LEGAL_TERMS_VERSION,
        privacy_version=PRIVACY_VERSION,
    )
    db.add(user)
    db.flush()
    if data.role == "customer":
        ensure_customer_invite_code(user, db)
    db.commit()
    db.refresh(user)
    return TokenOut(access_token=create_token(user), role=user.role)


@router.post("/login", response_model=TokenOut, dependencies=[Depends(rate_limiter(5, 60))])
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenziali errate")
    return TokenOut(access_token=create_token(user), role=user.role)


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/forgot-password", status_code=202, dependencies=[Depends(rate_limiter(3, 3600))])
def forgot_password(data: ForgotPasswordIn, request: Request, db: Session = Depends(get_db)):
    """Invia il link di reset. La risposta è identica sia che l'email esista o no
    (anti user-enumeration)."""
    user = db.scalar(select(User).where(User.email == data.email))
    if user:
        token = secrets.token_urlsafe(32)
        db.add(PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_reset_token(token),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES),
            requested_ip=request.client.host if request.client else None,
        ))
        db.commit()
        reset_url = f"{settings.public_web_url}/reset-password?token={token}"
        mobile_reset_url = f"allertgy://reset-password?token={token}"
        send_password_reset(user.email, reset_url, mobile_reset_url=mobile_reset_url)
    return {"detail": "Se l'indirizzo esiste, riceverai un'email con le istruzioni."}


@router.post("/reset-password", dependencies=[Depends(rate_limiter(5, 300))])
def reset_password(data: ResetPasswordIn, db: Session = Depends(get_db)):
    _validate_password_strength(data.new_password)
    prt = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == _hash_reset_token(data.token)
        )
    )
    now = datetime.now(timezone.utc)
    if (
        not prt
        or prt.used_at is not None
        or prt.expires_at.replace(tzinfo=timezone.utc) < now
    ):
        raise HTTPException(400, "Link di reset non valido o scaduto. Richiedine uno nuovo.")
    user = db.get(User, prt.user_id)
    if not user:
        raise HTTPException(400, "Link di reset non valido o scaduto. Richiedine uno nuovo.")
    user.password_hash = hash_password(data.new_password)
    prt.used_at = now
    db.commit()
    return {"detail": "Password aggiornata. Ora puoi accedere con la nuova password."}


@router.post("/change-password", dependencies=[Depends(rate_limiter(5, 300))])
def change_password(
    data: ChangePasswordIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cambio password da utente autenticato (richiede la password attuale)."""
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Password attuale non corretta")
    if data.current_password == data.new_password:
        raise HTTPException(400, "La nuova password deve essere diversa da quella attuale")
    _validate_password_strength(data.new_password)
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"detail": "Password aggiornata."}


@router.delete("/delete-account", dependencies=[Depends(rate_limiter(5, 300))])
@router.post("/delete-account", dependencies=[Depends(rate_limiter(5, 300))])
def delete_account(
    data: Optional[DeleteAccountIn] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancellazione definitiva dell'account e di tutti i dati personali e sanitari (GDPR & Apple Guideline 5.1.1(v))."""
    if data and data.password:
        if not verify_password(data.password, user.password_hash):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Password non corretta")

    # 1. Cancellazione file fisici dei documenti medici dell'utente
    docs = db.scalars(select(MedicalDocument).where(MedicalDocument.user_id == user.id)).all()
    for doc in docs:
        if doc.file_key:
            try:
                storage.delete(doc.file_key)
            except Exception:
                pass

    # 2. Cancellazione foto profilo se presente
    if user.photo_key:
        try:
            storage.delete(user.photo_key)
        except Exception:
            pass

    # 3. Se ristoratore, pulizia ristoranti e logo
    if user.role == "owner":
        restaurants = db.scalars(select(Restaurant).where(Restaurant.owner_id == user.id)).all()
        for rest in restaurants:
            if rest.logo_key:
                try:
                    storage.delete(rest.logo_key)
                except Exception:
                    pass
            db.delete(rest)

    # 4. Cancellazione sottoscrizioni Stripe se presenti
    if settings.stripe_configured and user.customer_stripe_subscription_id:
        try:
            import stripe
            stripe.api_key = settings.stripe_secret_key
            stripe.Subscription.delete(user.customer_stripe_subscription_id)
        except Exception:
            pass

    # 5. Cancellazione dell'utente (triggera cascate FK per allergeni, profili, reazioni, dispensa, preferiti)
    db.delete(user)
    db.commit()

    return {"detail": "Account e tutti i dati sanitari e personali sono stati eliminati definitivamente."}
