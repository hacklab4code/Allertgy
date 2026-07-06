from __future__ import annotations
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )

    allergens: Mapped[list["Allergen"]] = relationship(
        secondary="user_allergens", lazy="selectin"
    )

    @property
    def legal_consents_ok(self) -> bool:
        if not self.terms_accepted_at or not self.privacy_accepted_at:
            return False
        if self.role == "customer" and not self.health_data_consent_at:
            return False
        return True

    @property
    def disclaimer_accepted(self) -> bool:
        return self.disclaimer_accepted_at is not None

    @property
    def onboarding_completed(self) -> bool:
        return self.onboarding_completed_at is not None


class Allergen(Base):
    __tablename__ = "allergens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True)
    name_it: Mapped[str] = mapped_column(String(100))
    emoji: Mapped[Optional[str]] = mapped_column(String(8))
    is_diet: Mapped[int] = mapped_column(Integer, default=0)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class UserAllergen(Base):
    __tablename__ = "user_allergens"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    allergen_id: Mapped[int] = mapped_column(
        ForeignKey("allergens.id", ondelete="CASCADE"), primary_key=True
    )


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
    sdi_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    pec_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    commercial_notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )

    dishes: Mapped[list["Dish"]] = relationship(
        back_populates="restaurant", cascade="all, delete-orphan", lazy="selectin"
    )


class Dish(Base):
    __tablename__ = "dishes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(60))
    price_cents: Mapped[Optional[int]] = mapped_column(Integer)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_available: Mapped[int] = mapped_column(Integer, default=1)
    menu_group: Mapped[Optional[str]] = mapped_column(String(100), default="Principale")

    restaurant: Mapped["Restaurant"] = relationship(back_populates="dishes")
    dish_allergens: Mapped[list["DishAllergen"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )


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

    allergen: Mapped["Allergen"] = relationship(lazy="joined")


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
