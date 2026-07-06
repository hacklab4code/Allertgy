from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_host: str
    db_port: int = 3306
    db_name: str
    db_user: str
    db_password: str
    jwt_secret: str
    jwt_expire_minutes: int = 43200  # 30 giorni
    cors_origins: str = "http://localhost:5173"
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
    stripe_price_verified: str = ""
    stripe_price_pro: str = ""
    stripe_price_premium: str = ""

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def r2_configured(self) -> bool:
        return bool(self.r2_account_id and self.r2_access_key_id and self.r2_secret_access_key)

    @property
    def stripe_configured(self) -> bool:
        return bool(self.stripe_secret_key)


settings = Settings()
