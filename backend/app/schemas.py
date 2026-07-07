from __future__ import annotations
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: Optional[str] = None
    role: str = Field(default="customer", pattern="^(customer|owner)$")
    accept_terms: bool = False
    accept_privacy: bool = False
    accept_health_data: bool = False
    accept_owner_responsibility: bool = False


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


# ---------- Allergeni / profilo ----------
class AllergenOut(BaseModel):
    id: int
    code: str
    name_it: str
    emoji: Optional[str]
    is_diet: int
    category: str = "ue"
    intensity: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileAllergenItem(BaseModel):
    code: str
    intensity: str = "moderata"


class ProfileAllergensIn(BaseModel):
    allergen_codes: list[str] = []
    allergens: list[ProfileAllergenItem] = []


class LegalConsentIn(BaseModel):
    accept_terms: bool = False
    accept_privacy: bool = False
    accept_health_data: bool = False


# ---------- Menù (B2C) ----------
class DishOut(BaseModel):
    id: int
    nome_piatto: str
    descrizione: Optional[str]
    categoria: Optional[str]
    prezzo_cents: Optional[int]
    image_url: Optional[str] = None
    menu_group: Optional[str] = "Principale"
    allergeni_contenuti: list[str]
    allergeni_tracce: list[str]


class MenuOut(BaseModel):
    restaurant_id: int
    public_code: str
    nome_ristorante: str
    citta: Optional[str]
    indirizzo: Optional[str] = None
    telefono: Optional[str] = None
    email_contatto: Optional[str] = None
    orari_apertura: Optional[str] = None
    aggiornato_il: Optional[datetime]
    menu_version: int = 0
    menu_legal_confirmed_at: Optional[datetime] = None
    menu_legal_version: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    safety_notice: str = (
        "Informazioni sugli allergeni dichiarate dal ristoratore. "
        "Comunica sempre allergie e intolleranze al personale prima di ordinare."
    )
    piatti: list[DishOut]


class MenuEvaluationIn(BaseModel):
    allergen_codes: list[str] = []
    excluded_ingredients: list[str] = []


class DishEvaluationOut(BaseModel):
    dish_id: int
    status: str
    label: str
    match_contenuti: list[str] = []
    match_tracce: list[str] = []
    match_esclusi: list[str] = []


class MenuEvaluationOut(MenuOut):
    evaluation: list[DishEvaluationOut]


# ---------- Admin (B2B) ----------
class RestaurantIn(BaseModel):
    name: str
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email_contact: Optional[str] = None
    opening_hours: Optional[str] = None
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    website: Optional[str] = None
    description: Optional[str] = None


class RestaurantOut(BaseModel):
    id: int
    public_code: str
    slug: Optional[str] = None
    name: str
    city: Optional[str]
    website: Optional[str] = None
    description: Optional[str] = None
    is_active: int = 1
    address: Optional[str]
    phone: Optional[str]
    email_contact: Optional[str]
    opening_hours: Optional[str]
    image_url: Optional[str]
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    menu_updated_at: Optional[datetime]
    menu_version: int = 0
    menu_legal_confirmed_at: Optional[datetime] = None
    menu_legal_version: Optional[str] = None
    business_plan: str = "free"
    subscription_status: str = "free"
    plan_price_cents: int = 0
    is_verified: int = 0
    featured_priority: int = 0
    plan_started_at: Optional[datetime] = None
    trial_ends_at: Optional[datetime] = None
    billing_email: Optional[str] = None
    vat_number: Optional[str] = None
    sdi_code: Optional[str] = None
    pec_email: Optional[str] = None
    commercial_notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PlanDefinitionOut(BaseModel):
    code: str
    name: str
    price_cents: int
    tagline: str
    trial_days: Optional[int] = None
    features: list[str]
    photo_limit: int = 1
    has_menu: bool = False
    has_review_reply: bool = False
    has_priority: bool = False
    has_push_notify: bool = False


class InternalSummaryOut(BaseModel):
    total_users: int
    total_customers: int
    total_owners: int
    total_restaurants: int
    active_restaurants: int
    published_menus: int
    paid_restaurants: int
    monthly_recurring_cents: int
    plans: list[PlanDefinitionOut]
    restaurants_by_plan: dict[str, int]
    restaurants_by_status: dict[str, int]


class InternalRestaurantOut(RestaurantOut):
    owner_email: Optional[str] = None
    owner_display_name: Optional[str] = None
    dish_count: int = 0


class InternalRestaurantBusinessIn(BaseModel):
    business_plan: Optional[str] = Field(default=None, pattern="^(free|base|pro_notify)$")
    subscription_status: Optional[str] = Field(default=None, pattern="^(free|trialing|active|past_due|canceled|comped)$")
    plan_price_cents: Optional[int] = Field(default=None, ge=0)
    is_active: Optional[int] = Field(default=None, ge=0, le=1)
    is_verified: Optional[int] = Field(default=None, ge=0, le=1)
    featured_priority: Optional[int] = Field(default=None, ge=0)
    trial_ends_at: Optional[datetime] = None
    billing_email: Optional[str] = None
    vat_number: Optional[str] = None
    sdi_code: Optional[str] = None
    pec_email: Optional[str] = None
    commercial_notes: Optional[str] = None


class InternalUserOut(BaseModel):
    id: int
    email: str
    display_name: Optional[str] = None
    role: str
    created_at: datetime
    restaurant_count: int = 0
    legal_consents_ok: bool
    onboarding_completed: bool

    class Config:
        from_attributes = True


class DishIn(BaseModel):
    nome_piatto: str
    descrizione: Optional[str] = None
    categoria: Optional[str] = None
    prezzo_cents: Optional[int] = None
    image_url: Optional[str] = None
    menu_group: Optional[str] = "Principale"
    allergeni_contenuti: list[str] = []
    allergeni_tracce: list[str] = []


class MenuSaveIn(BaseModel):
    """Salvataggio in blocco del menù (da tabella AI corretta)."""
    piatti: list[DishIn]
    replace: bool = True  # True = sostituisce il menù esistente


class ApproveMenuIn(BaseModel):
    legal_acknowledged: bool = False


class AnalyzeOut(BaseModel):
    ai_stub: bool
    piatti: list[DishIn]
    note: str


class MenuAuditOut(BaseModel):
    id: int
    restaurant_id: int
    owner_user_id: Optional[int]
    action: str
    menu_version: int
    legal_version: Optional[str] = None
    snapshot_json: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserDocumentOut(BaseModel):
    id: int
    filename: str
    file_path: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AppleHealthIn(BaseModel):
    apple_health_connected: int
    emergency_medicines: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class UserProfileOut(BaseModel):
    id: int
    email: str
    display_name: Optional[str]
    role: str
    terms_accepted_at: Optional[datetime] = None
    privacy_accepted_at: Optional[datetime] = None
    health_data_consent_at: Optional[datetime] = None
    legal_terms_version: Optional[str] = None
    privacy_version: Optional[str] = None
    disclaimer_accepted_at: Optional[datetime] = None
    safety_disclaimer_version: Optional[str] = None
    onboarding_completed_at: Optional[datetime] = None
    legal_consents_ok: bool
    disclaimer_accepted: bool
    onboarding_completed: bool
    apple_health_connected: int
    emergency_medicines: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Foto (storage privato, URL firmati) ----------
class PhotoOut(BaseModel):
    id: int
    url: str  # signed URL a scadenza
    is_cover: bool = False
    sort_order: int = 0


class ProfilePhotoOut(BaseModel):
    photo_url: str


# ---------- Pagina pubblica ristorante ----------
class PublicReviewOut(BaseModel):
    id: int
    rating: int
    comment: Optional[str] = None
    author_name: str
    reply: Optional[str] = None
    created_at: datetime


class PublicRestaurantOut(BaseModel):
    public_code: str
    slug: Optional[str] = None
    name: str
    city: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    opening_hours: Optional[str] = None
    image_url: Optional[str] = None
    photos: list[PhotoOut] = []
    business_plan: str = "free"
    is_verified: bool = False
    rating_avg: Optional[float] = None
    rating_count: int = 0
    menu_available: bool = False  # dettaglio allergeni visibile solo con piano Base o Pro Notifiche
    boost_active: bool = False     # True se il locale ha un Boost Visibilità attivo
    piatti: list[DishOut] = []
    safety_notice: str = (
        "Informazioni sugli allergeni dichiarate dal ristoratore. "
        "Comunica sempre allergie e intolleranze al personale prima di ordinare."
    )


# ---------- Documenti medici + estrazione AI ----------
class MedicalDocumentOut(BaseModel):
    id: int
    filename: str
    mime_type: str
    status: str
    ai_consent_at: Optional[datetime] = None
    uploaded_at: datetime
    url: Optional[str] = None  # signed URL breve (5 min), generato a richiesta

    class Config:
        from_attributes = True


class ExtractionOut(BaseModel):
    id: int
    allergen_code: str
    confidence: Optional[float] = None
    applied: int = 0

    class Config:
        from_attributes = True


class DocumentExtractionResultOut(BaseModel):
    document_id: int
    status: str
    extractions: list[ExtractionOut]
    remaining_this_month: int
    note: str = ""


class ConfirmExtractionIn(BaseModel):
    document_id: int
    allergen_codes: list[str]  # sottoinsieme di quelli estratti che l'utente conferma


# ---------- Recensioni ----------
class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=2000)


class ReviewOut(BaseModel):
    id: int
    restaurant_id: int
    rating: int
    comment: Optional[str] = None
    author_name: str
    is_mine: bool = False
    reply: Optional[str] = None
    created_at: datetime


class ReviewReplyIn(BaseModel):
    reply: str = Field(min_length=1, max_length=2000)


class InternalReviewOut(BaseModel):
    id: int
    restaurant_id: int
    restaurant_name: str
    user_email: str
    rating: int
    comment: Optional[str] = None
    is_hidden: bool = False
    hidden_reason: Optional[str] = None
    reported_count: int = 0
    created_at: datetime


class ModerateReviewIn(BaseModel):
    is_hidden: bool
    hidden_reason: Optional[str] = Field(default=None, max_length=255)


# ---------- Notifiche ----------
class DeviceTokenIn(BaseModel):
    expo_token: str = Field(min_length=10, max_length=255)


class NotificationOut(BaseModel):
    id: int
    type: str
    payload_json: Optional[str] = None
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Billing (Stripe) ----------
class CheckoutSessionIn(BaseModel):
    restaurant_id: int
    plan: str = Field(pattern="^(base|pro_notify)$")


class CheckoutSessionOut(BaseModel):
    checkout_url: str


class PortalSessionIn(BaseModel):
    restaurant_id: int


class PortalSessionOut(BaseModel):
    portal_url: str


class StartTrialIn(BaseModel):
    restaurant_id: int
    plan: str = Field(default="base", pattern="^(base|pro_notify)$")


class InvoiceOut(BaseModel):
    id: int
    stripe_invoice_id: str
    amount_cents: int
    status: str
    pdf_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Boost Visibilità (one-time) ----------
class StartBoostIn(BaseModel):
    restaurant_id: int


class BoostSessionOut(BaseModel):
    checkout_url: str


class VisibilityBoostOut(BaseModel):
    id: int
    restaurant_id: int
    amount_cents: int
    duration_days: int
    activated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Notifiche push ai preferiti (solo piano Pro Notifiche) ----------
class SendNotificationIn(BaseModel):
    restaurant_id: int
    title: str = Field(min_length=1, max_length=100)
    body: str = Field(min_length=1, max_length=500)


class SendNotificationOut(BaseModel):
    sent_count: int
    message: str


# ---------- Documenti legali ----------
class LegalDocOut(BaseModel):
    doc: str
    title: str
    version: str
    content_markdown: str
