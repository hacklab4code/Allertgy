from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import LoginIn, RegisterIn, TokenOut
from ..security import create_token, hash_password, verify_password
from ..rate_limit import rate_limiter
from ..legal import LEGAL_TERMS_VERSION, PRIVACY_VERSION

router = APIRouter(prefix="/auth", tags=["auth"])


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
    db.commit()
    db.refresh(user)
    return TokenOut(access_token=create_token(user), role=user.role)


@router.post("/login", response_model=TokenOut, dependencies=[Depends(rate_limiter(5, 60))])
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenziali errate")
    return TokenOut(access_token=create_token(user), role=user.role)
