from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    CustomerUsage,
    DocumentAccessLog,
    MedicalDocument,
    MerchantReferral,
    Restaurant,
    Review,
    User,
    UserFavorite,
    UserProfile,
)
from ..schemas import (
    InternalCustomerBusinessIn,
    InternalCustomerDetailOut,
    InternalRestaurantBusinessIn,
    InternalRestaurantOut,
    InternalReviewOut,
    InternalSummaryOut,
    InternalUserOut,
    ModerateReviewIn,
    PlanDefinitionOut,
)
from ..security import require_internal_admin
from ..plans import PLAN_DEFINITIONS, PLAN_PRICES, CUSTOMER_PLAN_PRICES
from ..services.plan_limits import _month_start
from ..services.referrals import customer_has_plus, grant_customer_plus_comped

router = APIRouter(
    prefix="/internal-admin",
    tags=["internal admin"],
    dependencies=[Depends(require_internal_admin)],
)

REVENUE_STATUSES = {"trialing", "active"}
CUSTOMER_REVENUE_STATUSES = {"active", "trialing"}
PLUS_PRICE_CENTS = CUSTOMER_PLAN_PRICES.get("customer_plus", 399)


def _barcode_scans_map(db: Session, user_ids: list[int]) -> dict[int, int]:
    if not user_ids:
        return {}
    month_start = _month_start()
    rows = db.execute(
        select(CustomerUsage.user_id, func.count(CustomerUsage.id))
        .where(
            CustomerUsage.user_id.in_(user_ids),
            CustomerUsage.usage_type == "barcode_scan",
            CustomerUsage.created_at >= month_start,
        )
        .group_by(CustomerUsage.user_id)
    ).all()
    return {uid: int(cnt) for uid, cnt in rows}


def _referrals_map(db: Session, user_ids: list[int]) -> dict[int, int]:
    if not user_ids:
        return {}
    rows = db.execute(
        select(MerchantReferral.referrer_user_id, func.count(MerchantReferral.id))
        .where(MerchantReferral.referrer_user_id.in_(user_ids))
        .group_by(MerchantReferral.referrer_user_id)
    ).all()
    return {uid: int(cnt) for uid, cnt in rows}


def _favorites_map(db: Session, user_ids: list[int]) -> dict[int, int]:
    if not user_ids:
        return {}
    rows = db.execute(
        select(UserFavorite.user_id, func.count(UserFavorite.restaurant_id))
        .where(UserFavorite.user_id.in_(user_ids))
        .group_by(UserFavorite.user_id)
    ).all()
    return {uid: int(cnt) for uid, cnt in rows}


def _sub_profiles_map(db: Session, user_ids: list[int]) -> dict[int, int]:
    if not user_ids:
        return {}
    rows = db.execute(
        select(UserProfile.user_id, func.count(UserProfile.id))
        .where(UserProfile.user_id.in_(user_ids))
        .group_by(UserProfile.user_id)
    ).all()
    return {uid: int(cnt) for uid, cnt in rows}


def _reviews_map(db: Session, user_ids: list[int]) -> dict[int, int]:
    if not user_ids:
        return {}
    rows = db.execute(
        select(Review.user_id, func.count(Review.id))
        .where(Review.user_id.in_(user_ids))
        .group_by(Review.user_id)
    ).all()
    return {uid: int(cnt) for uid, cnt in rows}


def _user_to_internal(
    u: User,
    *,
    restaurant_count: int = 0,
    referrals_count: int = 0,
    allergen_count: int = 0,
    sub_profile_count: int = 0,
    favorites_count: int = 0,
    barcode_scans_month: int = 0,
    reviews_count: int = 0,
) -> InternalUserOut:
    return InternalUserOut(
        id=u.id,
        email=u.email,
        display_name=u.display_name,
        role=u.role,
        created_at=u.created_at,
        restaurant_count=restaurant_count,
        legal_consents_ok=u.legal_consents_ok,
        onboarding_completed=u.onboarding_completed,
        customer_plan=u.customer_plan or "customer_free",
        customer_subscription_status=u.customer_subscription_status or "free",
        has_customer_plus=u.has_customer_plus,
        invite_code=u.invite_code,
        referrals_count=referrals_count,
        allergen_count=allergen_count,
        sub_profile_count=sub_profile_count,
        favorites_count=favorites_count,
        barcode_scans_month=barcode_scans_month,
        reviews_count=reviews_count,
    )


def _plan_defs() -> list[PlanDefinitionOut]:
    return [PlanDefinitionOut(**p) for p in PLAN_DEFINITIONS]


def _restaurant_to_internal(r: Restaurant, owner: User | None) -> InternalRestaurantOut:
    return InternalRestaurantOut(
        id=r.id,
        public_code=r.public_code,
        name=r.name,
        city=r.city,
        is_active=r.is_active,
        address=r.address,
        phone=r.phone,
        email_contact=r.email_contact,
        opening_hours=r.opening_hours,
        image_url=r.image_url,
        menu_updated_at=r.menu_updated_at,
        menu_version=r.menu_version or 0,
        menu_legal_confirmed_at=r.menu_legal_confirmed_at,
        menu_legal_version=r.menu_legal_version,
        business_plan=r.business_plan or "free",
        subscription_status=r.subscription_status or "free",
        plan_price_cents=r.plan_price_cents or 0,
        is_verified=r.is_verified or 0,
        featured_priority=r.featured_priority or 0,
        plan_started_at=r.plan_started_at,
        trial_ends_at=r.trial_ends_at,
        billing_email=r.billing_email,
        vat_number=r.vat_number,
        sdi_code=r.sdi_code,
        pec_email=r.pec_email,
        commercial_notes=r.commercial_notes,
        created_at=r.created_at,
        owner_email=owner.email if owner else None,
        owner_display_name=owner.display_name if owner else None,
        dish_count=len([d for d in r.dishes if d.is_available]),
    )


@router.get("/plans", response_model=list[PlanDefinitionOut])
def list_plans():
    return _plan_defs()


@router.get("/summary", response_model=InternalSummaryOut)
def summary(db: Session = Depends(get_db)):
    users = db.scalars(select(User)).all()
    restaurants = db.scalars(select(Restaurant)).all()

    restaurants_by_plan: dict[str, int] = {p["code"]: 0 for p in PLAN_DEFINITIONS}
    restaurants_by_status: dict[str, int] = {}
    monthly_recurring_cents = 0
    paid_restaurants = 0
    published_menus = 0

    customers_plus_active = 0
    customers_plus_comped = 0
    customer_mrr_cents = 0
    customers_by_plan: dict[str, int] = {"customer_free": 0, "customer_plus": 0}

    for u in users:
        if u.role != "customer":
            continue
        plan = u.customer_plan or "customer_free"
        status = u.customer_subscription_status or "free"
        customers_by_plan[plan] = customers_by_plan.get(plan, 0) + 1
        if plan == "customer_plus" and status == "comped":
            customers_plus_comped += 1
        if plan == "customer_plus" and status in CUSTOMER_REVENUE_STATUSES:
            customers_plus_active += 1
            customer_mrr_cents += PLUS_PRICE_CENTS

    for r in restaurants:
        plan = r.business_plan or "free"
        status = r.subscription_status or "free"
        restaurants_by_plan[plan] = restaurants_by_plan.get(plan, 0) + 1
        restaurants_by_status[status] = restaurants_by_status.get(status, 0) + 1
        if r.menu_updated_at and (r.menu_version or 0) > 0:
            published_menus += 1
        if plan != "free" and status in REVENUE_STATUSES:
            paid_restaurants += 1
            monthly_recurring_cents += (
                r.plan_price_cents
                if r.plan_price_cents is not None
                else PLAN_PRICES.get(plan, 0)
            )

    return InternalSummaryOut(
        total_users=len(users),
        total_customers=len([u for u in users if u.role == "customer"]),
        total_owners=len([u for u in users if u.role == "owner"]),
        total_restaurants=len(restaurants),
        active_restaurants=len([r for r in restaurants if r.is_active]),
        published_menus=published_menus,
        paid_restaurants=paid_restaurants,
        monthly_recurring_cents=monthly_recurring_cents,
        customers_plus_active=customers_plus_active,
        customers_plus_comped=customers_plus_comped,
        customer_mrr_cents=customer_mrr_cents,
        plans=_plan_defs(),
        restaurants_by_plan=restaurants_by_plan,
        restaurants_by_status=restaurants_by_status,
        customers_by_plan=customers_by_plan,
    )


@router.get("/restaurants", response_model=list[InternalRestaurantOut])
def list_restaurants(db: Session = Depends(get_db)):
    restaurants = db.scalars(
        select(Restaurant).order_by(
            Restaurant.featured_priority.desc(),
            Restaurant.created_at.desc(),
            Restaurant.id.desc(),
        )
    ).all()
    owner_ids = {r.owner_user_id for r in restaurants if r.owner_user_id}
    owners = {}
    if owner_ids:
        owners = {u.id: u for u in db.scalars(select(User).where(User.id.in_(owner_ids))).all()}
    return [_restaurant_to_internal(r, owners.get(r.owner_user_id)) for r in restaurants]


@router.patch("/restaurants/{restaurant_id}/business", response_model=InternalRestaurantOut)
def update_restaurant_business(
    restaurant_id: int,
    data: InternalRestaurantBusinessIn,
    db: Session = Depends(get_db),
):
    restaurant = db.get(Restaurant, restaurant_id)
    if not restaurant:
        raise HTTPException(404, "Locale non trovato")

    update = data.model_dump(exclude_unset=True)
    new_plan = update.get("business_plan")
    if new_plan is not None:
        old_plan = restaurant.business_plan or "free"
        restaurant.business_plan = new_plan
        if "plan_price_cents" not in update:
            restaurant.plan_price_cents = PLAN_PRICES.get(new_plan, 0)
        if new_plan == "free" and "subscription_status" not in update:
            restaurant.subscription_status = "free"
            restaurant.is_verified = 0
        if new_plan != "free" and old_plan == "free" and not restaurant.plan_started_at:
            restaurant.plan_started_at = datetime.now(timezone.utc)

    for field in [
        "subscription_status",
        "plan_price_cents",
        "is_active",
        "is_verified",
        "featured_priority",
        "trial_ends_at",
        "billing_email",
        "vat_number",
        "sdi_code",
        "pec_email",
        "commercial_notes",
    ]:
        if field in update:
            setattr(restaurant, field, update[field])

    if restaurant.business_plan in {"verified", "pro", "premium", "base", "pro_notify"} and "is_verified" not in update:
        restaurant.is_verified = 1
    if restaurant.subscription_status in {"active", "trialing", "comped"} and not restaurant.plan_started_at:
        restaurant.plan_started_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(restaurant)
    owner = db.get(User, restaurant.owner_user_id) if restaurant.owner_user_id else None
    return _restaurant_to_internal(restaurant, owner)


@router.get("/reviews", response_model=list[InternalReviewOut])
def list_reviews_for_moderation(db: Session = Depends(get_db)):
    """Tutte le recensioni (prima le più segnalate) per la moderazione."""
    reviews = db.scalars(
        select(Review).order_by(
            Review.reported_count.desc(), Review.created_at.desc()
        ).limit(500)
    ).all()
    restaurant_names = {
        r.id: r.name for r in db.scalars(select(Restaurant)).all()
    }
    return [
        InternalReviewOut(
            id=rev.id,
            restaurant_id=rev.restaurant_id,
            restaurant_name=restaurant_names.get(rev.restaurant_id, "?"),
            user_email=rev.user.email if rev.user else "?",
            rating=rev.rating,
            rating_staff=rev.rating_staff,
            rating_menu=rev.rating_menu,
            rating_safety=rev.rating_safety,
            comment=rev.comment,
            is_hidden=bool(rev.is_hidden),
            hidden_reason=rev.hidden_reason,
            reported_count=rev.reported_count or 0,
            created_at=rev.created_at,
        )
        for rev in reviews
    ]


@router.patch("/reviews/{review_id}/moderate", response_model=InternalReviewOut)
def moderate_review(
    review_id: int,
    data: ModerateReviewIn,
    db: Session = Depends(get_db),
):
    rev = db.get(Review, review_id)
    if not rev:
        raise HTTPException(404, "Recensione non trovata")
    rev.is_hidden = 1 if data.is_hidden else 0
    rev.hidden_reason = data.hidden_reason if data.is_hidden else None
    if not data.is_hidden:
        rev.reported_count = 0
    db.commit()
    restaurant = db.get(Restaurant, rev.restaurant_id)
    return InternalReviewOut(
        id=rev.id,
        restaurant_id=rev.restaurant_id,
        restaurant_name=restaurant.name if restaurant else "?",
        user_email=rev.user.email if rev.user else "?",
        rating=rev.rating,
        rating_staff=rev.rating_staff,
        rating_menu=rev.rating_menu,
        rating_safety=rev.rating_safety,
        comment=rev.comment,
        is_hidden=bool(rev.is_hidden),
        hidden_reason=rev.hidden_reason,
        reported_count=rev.reported_count or 0,
        created_at=rev.created_at,
    )


@router.get("/document-access-log")
def document_access_log(db: Session = Depends(get_db)):
    """Solo metadati (chi/quando/quale documento): mai i contenuti sanitari."""
    rows = db.execute(
        select(
            DocumentAccessLog.id,
            DocumentAccessLog.document_id,
            DocumentAccessLog.accessed_by,
            DocumentAccessLog.accessed_at,
            MedicalDocument.user_id,
        )
        .join(MedicalDocument, MedicalDocument.id == DocumentAccessLog.document_id)
        .order_by(DocumentAccessLog.accessed_at.desc())
        .limit(500)
    ).all()
    return [
        {
            "id": row.id,
            "document_id": row.document_id,
            "document_owner_user_id": row.user_id,
            "accessed_by_user_id": row.accessed_by,
            "accessed_at": row.accessed_at,
        }
        for row in rows
    ]


@router.get("/users", response_model=list[InternalUserOut])
def list_users(db: Session = Depends(get_db)):
    restaurant_counts = dict(
        db.execute(
            select(Restaurant.owner_user_id, func.count(Restaurant.id))
            .where(Restaurant.owner_user_id.is_not(None))
            .group_by(Restaurant.owner_user_id)
        ).all()
    )
    users = db.scalars(select(User).order_by(User.created_at.desc(), User.id.desc())).all()
    customer_ids = [u.id for u in users if u.role == "customer"]
    referrals = _referrals_map(db, customer_ids)
    favorites = _favorites_map(db, customer_ids)
    sub_profiles = _sub_profiles_map(db, customer_ids)
    barcodes = _barcode_scans_map(db, customer_ids)
    reviews = _reviews_map(db, customer_ids)

    return [
        _user_to_internal(
            u,
            restaurant_count=int(restaurant_counts.get(u.id, 0)),
            referrals_count=referrals.get(u.id, 0),
            allergen_count=len(u.user_allergens) if u.role == "customer" else 0,
            sub_profile_count=sub_profiles.get(u.id, 0),
            favorites_count=favorites.get(u.id, 0),
            barcode_scans_month=barcodes.get(u.id, 0),
            reviews_count=reviews.get(u.id, 0),
        )
        for u in users
    ]


@router.get("/users/{user_id}", response_model=InternalCustomerDetailOut)
def get_user_detail(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Utente non trovato")
    restaurant_count = int(
        db.scalar(
            select(func.count(Restaurant.id)).where(Restaurant.owner_user_id == user.id)
        )
        or 0
    )
    medical_docs = int(
        db.scalar(
            select(func.count(MedicalDocument.id)).where(MedicalDocument.user_id == user.id)
        )
        or 0
    )
    base = _user_to_internal(
        user,
        restaurant_count=restaurant_count,
        referrals_count=int(
            db.scalar(
                select(func.count(MerchantReferral.id)).where(
                    MerchantReferral.referrer_user_id == user.id
                )
            )
            or 0
        ),
        allergen_count=len(user.user_allergens),
        sub_profile_count=int(
            db.scalar(
                select(func.count(UserProfile.id)).where(UserProfile.user_id == user.id)
            )
            or 0
        ),
        favorites_count=int(
            db.scalar(
                select(func.count(UserFavorite.restaurant_id)).where(
                    UserFavorite.user_id == user.id
                )
            )
            or 0
        ),
        barcode_scans_month=_barcode_scans_map(db, [user.id]).get(user.id, 0),
        reviews_count=int(
            db.scalar(select(func.count(Review.id)).where(Review.user_id == user.id)) or 0
        ),
    )
    return InternalCustomerDetailOut(
        **base.model_dump(),
        allergen_codes=[ua.allergen.code for ua in user.user_allergens],
        medical_documents_count=medical_docs,
        customer_plan_started_at=user.customer_plan_started_at,
        customer_stripe_subscription_id=user.customer_stripe_subscription_id,
    )


@router.patch("/users/{user_id}/customer", response_model=InternalCustomerDetailOut)
def update_customer_business(
    user_id: int,
    data: InternalCustomerBusinessIn,
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Utente non trovato")
    if user.role != "customer":
        raise HTTPException(400, "Questo endpoint è solo per utenti cliente")

    update = data.model_dump(exclude_unset=True)
    if update.get("customer_plan") == "customer_plus" and "customer_subscription_status" not in update:
        if not customer_has_plus(user):
            grant_customer_plus_comped(user, db)
    elif update:
        if "customer_plan" in update:
            user.customer_plan = update["customer_plan"]
            if update["customer_plan"] == "customer_free":
                user.customer_subscription_status = "free"
        if "customer_subscription_status" in update:
            user.customer_subscription_status = update["customer_subscription_status"]
            if update["customer_subscription_status"] in {"active", "comped", "trialing"}:
                user.customer_plan = "customer_plus"
                if not user.customer_plan_started_at:
                    user.customer_plan_started_at = datetime.now(timezone.utc)
            elif update["customer_subscription_status"] in {"free", "canceled"}:
                user.customer_plan = "customer_free"

    db.commit()
    db.refresh(user)
    return get_user_detail(user_id, db)
