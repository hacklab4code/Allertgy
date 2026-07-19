from datetime import datetime
from typing import Optional


from sqlalchemy import (
    DateTime, Enum, ForeignKey, Integer, String, Text, text, Float
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[Optional[str]] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(
        Enum("customer", "owner", name="user_role"), default="customer"
    )
    terms_accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    privacy_accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    health_data_consent_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    legal_terms_version: Mapped[Optional[str]] = mapped_column(String(40))
    privacy_version: Mapped[Optional[str]] = mapped_column(String(40))
    disclaimer_accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    safety_disclaimer_version: Mapped[Optional[str]] = mapped_column(String(40))
    onboarding_completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    apple_health_connected: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    emergency_medicines: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    photo_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    invite_code: Mapped[Optional[str]] = mapped_column(String(12), unique=True, nullable=True)
    customer_plan: Mapped[str] = mapped_column(String(30), default="customer_free")
    customer_subscription_status: Mapped[str] = mapped_column(String(30), default="free")
    customer_plan_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    customer_stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    customer_stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )

    allergens = relationship(
        "Allergen", secondary="user_allergens", lazy="selectin"
    )
    user_allergens = relationship(
        "UserAllergen", cascade="all, delete-orphan", lazy="selectin", overlaps="allergens"
    )

    @property
    def legal_consents_ok(self) -> bool:
        from .legal import LEGAL_TERMS_VERSION, PRIVACY_VERSION

        if not self.terms_accepted_at or not self.privacy_accepted_at:
            return False
        if self.role == "customer" and not self.health_data_consent_at:
            return False
        if self.legal_terms_version != LEGAL_TERMS_VERSION:
            return False
        if self.privacy_version != PRIVACY_VERSION:
            return False
        return True

    @property
    def disclaimer_accepted(self) -> bool:
        from .legal import SAFETY_DISCLAIMER_VERSION

        if self.disclaimer_accepted_at is None:
            return False
        return self.safety_disclaimer_version == SAFETY_DISCLAIMER_VERSION

    @property
    def onboarding_completed(self) -> bool:
        return self.onboarding_completed_at is not None

    @property
    def has_customer_plus(self) -> bool:
        return (
            (self.customer_plan or "customer_free") == "customer_plus"
            and (self.customer_subscription_status or "free")
            in {"active", "comped", "trialing"}
        )


class Allergen(Base):
    __tablename__ = "allergens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True)
    name_it: Mapped[str] = mapped_column(String(100))
    emoji: Mapped[Optional[str]] = mapped_column(String(8))
    is_diet: Mapped[int] = mapped_column(Integer, default=0)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    category: Mapped[str] = mapped_column(String(30), default="ue")


class UserAllergen(Base):
    __tablename__ = "user_allergens"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    allergen_id: Mapped[int] = mapped_column(
        ForeignKey("allergens.id", ondelete="CASCADE"), primary_key=True
    )
    source: Mapped[str] = mapped_column(
        Enum("manual", "document_ai", name="user_allergen_source"), default="manual"
    )
    intensity: Mapped[str] = mapped_column(
        Enum("lieve", "moderata", "grave", name="user_allergen_intensity"), default="moderata"
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    allergen: Mapped["Allergen"] = relationship(lazy="joined", overlaps="allergens")


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    public_code: Mapped[str] = mapped_column(String(6), unique=True)
    name: Mapped[str] = mapped_column(String(150))
    city: Mapped[Optional[str]] = mapped_column(String(100))
    is_active: Mapped[int] = mapped_column(Integer, default=1)
    owner_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    referred_by_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email_contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    opening_hours: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    menu_updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    menu_version: Mapped[int] = mapped_column(Integer, default=0)
    menu_legal_confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    menu_legal_confirmed_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    menu_legal_version: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    business_plan: Mapped[str] = mapped_column(String(30), default="free")
    subscription_status: Mapped[str] = mapped_column(String(30), default="free")
    plan_price_cents: Mapped[int] = mapped_column(Integer, default=0)
    is_verified: Mapped[int] = mapped_column(Integer, default=0)
    featured_priority: Mapped[int] = mapped_column(Integer, default=0)
    plan_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    billing_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    vat_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    allergen_manager: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sdi_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    pec_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    commercial_notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    slug: Mapped[Optional[str]] = mapped_column(String(160), unique=True, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    menu_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    stripe_price_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    google_place_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    google_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    google_reviews_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tripadvisor_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tripadvisor_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tripadvisor_reviews_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )

    photos = relationship(
        "RestaurantPhoto", back_populates="restaurant", cascade="all, delete-orphan",
        lazy="selectin", order_by="RestaurantPhoto.sort_order",
    )
    menus = relationship(
        "Menu", back_populates="restaurant", cascade="all, delete-orphan",
        lazy="selectin", order_by="Menu.sort_order",
    )
    dishes = relationship(
        "Dish", back_populates="restaurant", cascade="all, delete-orphan",
        lazy="selectin"
    )


class Menu(Base):
    __tablename__ = "menus"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[int] = mapped_column(Integer, default=1)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )

    restaurant = relationship("Restaurant", back_populates="menus")
    dishes = relationship(
        "Dish", back_populates="menu", cascade="all, delete-orphan", lazy="selectin"
    )


class Dish(Base):
    __tablename__ = "dishes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    menu_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("menus.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(60))
    price_cents: Mapped[Optional[int]] = mapped_column(Integer)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_available: Mapped[int] = mapped_column(Integer, default=1)
    menu_group: Mapped[Optional[str]] = mapped_column(String(100), default="Principale")
    kitchen_protocol_confirmed: Mapped[int] = mapped_column(Integer, default=0)
    cross_contamination_checked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    restaurant = relationship("Restaurant", back_populates="dishes")
    menu = relationship("Menu", back_populates="dishes")
    dish_allergens = relationship(
        "DishAllergen", cascade="all, delete-orphan", lazy="selectin"
    )
    translations = relationship(
        "DishTranslation", back_populates="dish", cascade="all, delete-orphan", lazy="selectin"
    )


class DishTranslation(Base):
    __tablename__ = "dish_translations"

    dish_id: Mapped[int] = mapped_column(
        ForeignKey("dishes.id", ondelete="CASCADE"), primary_key=True
    )
    lang: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    dish = relationship("Dish", back_populates="translations")


class DishAllergen(Base):
    __tablename__ = "dish_allergens"

    dish_id: Mapped[int] = mapped_column(
        ForeignKey("dishes.id", ondelete="CASCADE"), primary_key=True
    )
    allergen_id: Mapped[int] = mapped_column(
        ForeignKey("allergens.id", ondelete="CASCADE"), primary_key=True
    )
    kind: Mapped[str] = mapped_column(
        Enum("contains", "traces", name="dish_allergen_kind"), primary_key=True
    )

    allergen = relationship("Allergen", lazy="joined")


class MenuAuditLog(Base):
    __tablename__ = "menu_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    owner_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(
        Enum("menu_saved", "menu_approved", "restaurant_updated", name="menu_audit_action")
    )
    menu_version: Mapped[int] = mapped_column(Integer, default=0)
    legal_version: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    snapshot_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    note: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )


class UserDocument(Base):
    __tablename__ = "user_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    filename: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(50), default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(String(255))
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    requested_ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )


class RestaurantPhoto(Base):
    __tablename__ = "restaurant_photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    storage_key: Mapped[str] = mapped_column(String(255))
    is_cover: Mapped[int] = mapped_column(Integer, default=0)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )

    restaurant = relationship("Restaurant", back_populates="photos")


class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    storage_key: Mapped[str] = mapped_column(String(255))
    filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(
        Enum("pending", "processed", "failed", name="medical_document_status"),
        default="pending",
    )
    ai_consent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )

    extractions = relationship(
        "AllergenExtraction", cascade="all, delete-orphan", lazy="selectin"
    )


class AllergenExtraction(Base):
    __tablename__ = "allergen_extractions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("medical_documents.id", ondelete="CASCADE")
    )
    allergen_code: Mapped[str] = mapped_column(String(30))
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    applied: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )


class DocumentAccessLog(Base):
    __tablename__ = "document_access_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("medical_documents.id", ondelete="CASCADE")
    )
    accessed_by: Mapped[int] = mapped_column(Integer)
    accessed_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    rating: Mapped[int] = mapped_column(Integer)
    rating_staff: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rating_menu: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rating_safety: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_hidden: Mapped[int] = mapped_column(Integer, default=0)
    hidden_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reported_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    user = relationship("User", lazy="joined")
    reply = relationship(
        "ReviewReply", cascade="all, delete-orphan", lazy="selectin", uselist=False
    )


class ReviewReply(Base):
    __tablename__ = "review_replies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    review_id: Mapped[int] = mapped_column(
        ForeignKey("reviews.id", ondelete="CASCADE"), unique=True
    )
    reply: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )


class UserFavorite(Base):
    __tablename__ = "user_favorites"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )


class DeviceToken(Base):
    __tablename__ = "device_tokens"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    expo_token: Mapped[str] = mapped_column(String(255), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(50))
    payload_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    stripe_invoice_id: Mapped[str] = mapped_column(String(100), unique=True)
    amount_cents: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(30))
    pdf_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )


class VisibilityBoost(Base):
    """Boost visibilità acquistato on-demand dal ristoratore (pagamento unico).

    Ogni acquisto crea un record separato; il backend considera il locale
    "in boost" se esiste almeno un record con expires_at > now() e
    stripe_payment_intent_id non nullo (= pagato con successo).
    """
    __tablename__ = "visibility_boosts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True, unique=True
    )
    amount_cents: Mapped[int] = mapped_column(Integer, default=990)
    duration_days: Mapped[int] = mapped_column(Integer, default=30)
    # Impostato quando il PaymentIntent è confermato via webhook
    activated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )

    restaurant = relationship("Restaurant", lazy="joined")


class CustomerAnnotation(Base):
    __tablename__ = "customer_annotations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    allergen_id: Mapped[int] = mapped_column(
        ForeignKey("allergens.id", ondelete="CASCADE")
    )
    ingredient: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )

    user = relationship("User", lazy="joined")
    allergen = relationship("Allergen", lazy="joined")


class RestaurantAnalytics(Base):
    __tablename__ = "restaurant_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False
    )
    allergen_code: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )


class CustomerUsage(Base):
    """Tracciamento mensile scansioni barcode e analisi AI menù per utente."""
    __tablename__ = "customer_usage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    usage_type: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )


class ProductLabelCache(Base):
    """Etichette prodotto analizzate con AI, condivise per barcode (no ripetizione AI)."""
    __tablename__ = "product_label_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    barcode: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    brand: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    ingredients: Mapped[str] = mapped_column(Text, nullable=False, default="")
    allergeni_contenuti_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    allergeni_tracce_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    created_by_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    kinship: Mapped[str] = mapped_column(String(50), default="altro")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )

    allergens = relationship(
        "Allergen", secondary="profile_allergens", lazy="selectin"
    )
    profile_allergens = relationship(
        "ProfileAllergen", cascade="all, delete-orphan", lazy="selectin", overlaps="allergens"
    )

    @property
    def relationship(self) -> str:
        return self.kinship

    @relationship.setter
    def relationship(self, value: str) -> None:
        self.kinship = value


class ProfileAllergen(Base):
    __tablename__ = "profile_allergens"

    profile_id: Mapped[int] = mapped_column(
        ForeignKey("user_profiles.id", ondelete="CASCADE"), primary_key=True
    )
    allergen_id: Mapped[int] = mapped_column(
        ForeignKey("allergens.id", ondelete="CASCADE"), primary_key=True
    )
    source: Mapped[str] = mapped_column(
        String(30), default="manual"
    )
    intensity: Mapped[str] = mapped_column(
        String(30), default="moderata"
    )

    allergen: Mapped["Allergen"] = relationship(lazy="joined", overlaps="allergens")


class MerchantReferral(Base):
    """Traccia quando un cliente porta un commerciante con il proprio codice invito."""
    __tablename__ = "merchant_referrals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    referrer_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    referred_owner_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False
    )
    reward_granted_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )

    referrer = relationship("User", foreign_keys=[referrer_user_id], lazy="joined")
    referred_owner = relationship("User", foreign_keys=[referred_owner_user_id], lazy="joined")
    restaurant = relationship("Restaurant", lazy="joined")


class ProfileShare(Base):
    """Token privacy-safe per condividere un profilo allergie.

    Espone solo nome profilo, relazione e allergeni; non include email, documenti,
    contatti SOS o altri dati sanitari non necessari allo scopo.
    """
    __tablename__ = "profile_shares"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    source_profile_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=True
    )
    token: Mapped[str] = mapped_column(String(80), unique=True)
    label: Mapped[str] = mapped_column(String(120))
    scope: Mapped[str] = mapped_column(String(30), default="24h")
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    recipient_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )

    owner = relationship("User", foreign_keys=[owner_user_id], lazy="joined")
    recipient = relationship("User", foreign_keys=[recipient_user_id], lazy="joined")
    source_profile = relationship("UserProfile", lazy="joined")

