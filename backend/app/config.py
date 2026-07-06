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

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
