from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="development", alias="APP_ENV")
    allowed_origins_raw: str = Field(default="http://localhost:5173", alias="ALLOWED_ORIGINS")
    default_language: str = Field(default="hi", alias="DEFAULT_LANGUAGE")
    vishnu_webhook_secret: str = Field(default="dev-secret", alias="VISHNU_WEBHOOK_SECRET")
    auth_required: bool = Field(default=False, alias="AUTH_REQUIRED")
    auth_provider: str = Field(default="dev", alias="AUTH_PROVIDER")
    dev_bearer_token: str = Field(default="dev-token", alias="DEV_BEARER_TOKEN")
    rate_limit_per_minute: int = Field(default=120, alias="RATE_LIMIT_PER_MINUTE")
    rate_limit_window_seconds: int = Field(default=60, alias="RATE_LIMIT_WINDOW_SECONDS")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins_raw.split(",") if origin.strip()]


settings = Settings()
