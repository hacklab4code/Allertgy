from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"  # development | production
    db_host: str
    db_port: int = 3306
    db_name: str
    db_user: str
    db_password: str
    jwt_secret: str
    jwt_expire_minutes: int = 43200  # 30 giorni
    cors_origins: str = "http://localhost:5173,http://localhost:8081,http://localhost:8085,http://localhost:19006"
    sentry_dsn: str = ""
    gemini_api_key: str = ""
    internal_admin_key: str = "dev-admin"

    # URL pubblici (link nelle email, redirect Stripe, sitemap)
    public_web_url: str = "http://localhost:5173"
    public_api_url: str = "http://localhost:8000"

    # Storage privato — Cloudflare R2 (S3-compatible); se vuoto: fallback locale
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = "allertgy-private"

    # Email transazionali — Resend; se vuoto: stampa nel log
    resend_api_key: str = ""
    email_from: str = "AllerTgy <noreply@allertgy.it>"

    # Stripe Billing; se vuoto: endpoint /billing rispondono 503
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    # Abbonamenti mensili
    stripe_price_base: str = ""        # piano Base €9/mese
    stripe_price_pro_notify: str = ""  # piano Pro Notifiche €19/mese
    # Add-on one-time
    stripe_price_boost: str = ""       # Boost Visibilità €9,90 / 30 giorni
    stripe_price_customer_plus: str = ""  # Plus Famiglia €3,99/mese

    # Titolare del trattamento (Informativa Privacy) — compilare prima del go-live
    legal_entity_name: str = "[Ragione sociale/nome del titolare da inserire]"
    legal_privacy_email: str = "[email privacy da inserire]"

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def r2_configured(self) -> bool:
        return bool(self.r2_account_id and self.r2_access_key_id and self.r2_secret_access_key)

    @property
    def stripe_configured(self) -> bool:
        return bool(self.stripe_secret_key)

    @property
    def is_production(self) -> bool:
        return (self.app_env or "development").lower() == "production"


def validate_production_settings() -> None:
    """Blocca l'avvio in produzione se mancano configurazioni critiche."""
    if not settings.is_production:
        return
    errors: list[str] = []
    weak_jwt = (
        not settings.jwt_secret
        or "cambiami" in settings.jwt_secret.lower()
        or len(settings.jwt_secret) < 32
    )
    if weak_jwt:
        errors.append("JWT_SECRET deve essere una stringa casuale di almeno 32 caratteri")
    if settings.internal_admin_key in {"", "dev-admin", "cambia-questa-chiave"}:
        errors.append("INTERNAL_ADMIN_KEY deve essere impostata in produzione")
    if "localhost" in (settings.public_web_url or ""):
        errors.append("PUBLIC_WEB_URL deve puntare al dominio pubblico (non localhost)")
    if "localhost" in (settings.public_api_url or ""):
        errors.append("PUBLIC_API_URL deve puntare all'API pubblica (non localhost)")
    if not settings.stripe_secret_key:
        errors.append("STRIPE_SECRET_KEY deve essere configurata in produzione")
    if not settings.stripe_webhook_secret:
        errors.append("STRIPE_WEBHOOK_SECRET deve essere configurato in produzione")
    if not settings.resend_api_key:
        errors.append("RESEND_API_KEY deve essere configurata in produzione (email transazionali)")
    if errors:
        raise RuntimeError("Configurazione produzione non valida:\n- " + "\n- ".join(errors))


settings = Settings()
validate_production_settings()
