"""Recensioni: una per utente per ristorante (upsert), risposta del ristoratore
(piano Verificato in su), segnalazioni. La moderazione è in internal_admin.py."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Restaurant, Review, ReviewReply, User
from ..schemas import ReviewIn, ReviewOut, ReviewReplyIn
from ..security import get_current_user, require_owner
from ..rate_limit import rate_limiter
from ..services.push import notify_users
from .restaurants import _get_active_restaurant

router = APIRouter(tags=["reviews"])

REPLY_PLANS = {"verified", "pro", "premium"}


def _review_to_out(rev: Review, current_user_id: int | None = None) -> ReviewOut:
    return ReviewOut(
        id=rev.id,
        restaurant_id=rev.restaurant_id,
        rating=rev.rating,
        comment=rev.comment,
        author_name=rev.user.display_name or "Utente AllerTgy",
        is_mine=(current_user_id is not None and rev.user_id == current_user_id),
        reply=rev.reply.reply if rev.reply else None,
        created_at=rev.created_at,
    )


@router.get("/restaurants/{public_code}/reviews", response_model=list[ReviewOut])
def list_reviews(public_code: str, db: Session = Depends(get_db)):
    """Recensioni visibili del locale. Endpoint pubblico (per la pagina /r/{slug})."""
    r = _get_active_restaurant(public_code, db)
    reviews = db.scalars(
        select(Review)
        .where(Review.restaurant_id == r.id, Review.is_hidden == 0)
        .order_by(Review.created_at.desc())
        .limit(100)
    ).all()
    return [_review_to_out(rev) for rev in reviews]


@router.post(
    "/restaurants/{public_code}/reviews",
    response_model=ReviewOut,
    dependencies=[Depends(rate_limiter(10, 3600))],
)
def upsert_review(
    public_code: str,
    data: ReviewIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crea o aggiorna la propria recensione (una sola per locale, mai anonima)."""
    if user.role != "customer":
        raise HTTPException(403, "Solo i clienti possono lasciare recensioni")
    r = _get_active_restaurant(public_code, db)
    if r.owner_user_id == user.id:
        raise HTTPException(403, "Non puoi recensire il tuo locale")

    rev = db.scalar(
        select(Review).where(
            Review.restaurant_id == r.id, Review.user_id == user.id
        )
    )
    if rev:
        rev.rating = data.rating
        rev.comment = data.comment
        rev.is_hidden = 0  # una modifica rimette la recensione in chiaro
        rev.hidden_reason = None
    else:
        rev = Review(
            restaurant_id=r.id,
            user_id=user.id,
            rating=data.rating,
            comment=data.comment,
        )
        db.add(rev)
    db.commit()
    db.refresh(rev)
    return _review_to_out(rev, user.id)


@router.get("/restaurants/{public_code}/reviews/mine", response_model=ReviewOut)
def my_review(
    public_code: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = _get_active_restaurant(public_code, db)
    rev = db.scalar(
        select(Review).where(Review.restaurant_id == r.id, Review.user_id == user.id)
    )
    if not rev:
        raise HTTPException(404, "Non hai ancora recensito questo locale")
    return _review_to_out(rev, user.id)


@router.delete("/restaurants/{public_code}/reviews/mine", status_code=204)
def delete_my_review(
    public_code: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = _get_active_restaurant(public_code, db)
    rev = db.scalar(
        select(Review).where(Review.restaurant_id == r.id, Review.user_id == user.id)
    )
    if rev:
        db.delete(rev)
        db.commit()


@router.post("/reviews/{review_id}/report", status_code=204, dependencies=[Depends(rate_limiter(10, 3600))])
def report_review(
    review_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Segnala una recensione offensiva/falsa: finisce in coda moderazione admin."""
    rev = db.get(Review, review_id)
    if not rev or rev.is_hidden:
        raise HTTPException(404, "Recensione non trovata")
    rev.reported_count = (rev.reported_count or 0) + 1
    db.commit()


@router.post("/reviews/{review_id}/reply", response_model=ReviewOut)
def reply_to_review(
    review_id: int,
    data: ReviewReplyIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Risposta del ristoratore — riservata ai piani Verificato, Pro e Premium."""
    rev = db.get(Review, review_id)
    if not rev:
        raise HTTPException(404, "Recensione non trovata")
    restaurant = db.get(Restaurant, rev.restaurant_id)
    if not restaurant or restaurant.owner_user_id != user.id:
        raise HTTPException(403, "Puoi rispondere solo alle recensioni dei tuoi locali")
    if (restaurant.business_plan or "free") not in REPLY_PLANS:
        raise HTTPException(
            402,
            "La risposta alle recensioni è inclusa dal piano Verificato in su.",
        )
    if rev.reply:
        rev.reply.reply = data.reply
    else:
        db.add(ReviewReply(review_id=rev.id, reply=data.reply))
    notify_users(
        db,
        [rev.user_id],
        "review_reply",
        f"{restaurant.name} ti ha risposto",
        "Il ristoratore ha risposto alla tua recensione.",
        {"public_code": restaurant.public_code, "review_id": rev.id},
    )
    db.commit()
    db.refresh(rev)
    return _review_to_out(rev, None)
