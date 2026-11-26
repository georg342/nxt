"""Typed runtime configuration loaded from the environment."""

from __future__ import annotations

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Env-driven settings. Every value has a sane default except Supabase."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    supabase_url: str = ""
    supabase_service_role_key: str = ""

    dry_run: bool = False
    log_level: str = "INFO"
    log_dir: str = "logs"

    scraper_user_agent: str = (
        "WNXT-EventScraper/0.1 (+https://wnxt.com.br; contato: dev@wnxt.com.br)"
    )
    request_timeout_seconds: float = 25.0
    request_delay_seconds: float = 3.0
    max_retries: int = 3

    sources: str = "technoairlines,plurstation"
    max_events_per_source: int = 40
    technoairlines_enrich: bool = True
    technoairlines_max_enrich: int = 15
    plurstation_cities: str = "sao paulo,carapicuiba,guarulhos,osasco,valinhos,campinas"

    @field_validator("log_level")
    @classmethod
    def _upper_level(cls, value: str) -> str:
        return value.upper()

    @property
    def source_names(self) -> list[str]:
        return [name.strip() for name in self.sources.split(",") if name.strip()]

    @property
    def city_allowlist(self) -> set[str]:
        return {name.strip() for name in self.plurstation_cities.split(",") if name.strip()}

    def require_supabase(self) -> None:
        """Raise if the write credentials are missing."""
        missing = [
            name
            for name, value in (
                ("SUPABASE_URL", self.supabase_url),
                ("SUPABASE_SERVICE_ROLE_KEY", self.supabase_service_role_key),
            )
            if not value
        ]
        if missing:
            raise RuntimeError(
                "Missing Supabase configuration: " + ", ".join(missing)
                + ". Copy .env.example to .env and fill it."
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
