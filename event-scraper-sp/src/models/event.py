"""Event model shared by every scraper and by the Supabase writer."""

from __future__ import annotations

import hashlib
import re
import unicodedata
from datetime import datetime
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from zoneinfo import ZoneInfo

from pydantic import BaseModel, Field, field_validator

SAO_PAULO = ZoneInfo("America/Sao_Paulo")

# Query params that only carry tracking noise; they must not change the dedup key.
TRACKING_PARAMS = {
    "fbclid",
    "gclid",
    "igshid",
    "mc_cid",
    "mc_eid",
    "ref",
    "src",
}

_WHITESPACE = re.compile(r"\s+")


def collapse_whitespace(value: str) -> str:
    return _WHITESPACE.sub(" ", value).strip()


def normalize_for_match(value: str) -> str:
    """Lowercase + diacritics-free form used for title comparison."""
    decomposed = unicodedata.normalize("NFKD", value)
    without_accents = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return collapse_whitespace(without_accents).casefold()


def canonical_url(url: str) -> str:
    """Stable URL form for the dedup key.

    Rules: lowercase scheme/host, drop the fragment, drop tracking query params,
    keep the remaining params sorted. Path case is preserved (some sites are
    case sensitive).
    """
    parts = urlsplit(url.strip())
    query = [
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if key.lower() not in TRACKING_PARAMS and not key.lower().startswith("utm_")
    ]
    return urlunsplit(
        (
            parts.scheme.lower(),
            parts.netloc.lower(),
            parts.path,
            urlencode(sorted(query)),
            "",
        )
    )


def dedup_hash(source: str, url: str | None, title: str, start_date: str) -> str:
    """SHA-256 of `source|canonical_url`, falling back to `source|title|date`."""
    source_key = normalize_for_match(source).replace(" ", "-")
    if url:
        basis = f"{source_key}|{canonical_url(url)}"
    else:
        basis = f"{source_key}|{normalize_for_match(title)}|{start_date[:10]}"
    return hashlib.sha256(basis.encode("utf-8")).hexdigest()


class ScrapedEvent(BaseModel):
    """One event as extracted from a source, before it reaches the database.

    Fields the source does not expose stay ``None``: nothing is guessed.
    """

    source: str
    title: str
    source_url: str
    start_datetime: datetime
    end_datetime: datetime | None = None
    venue: str | None = None
    city: str | None = None
    state: str | None = None
    address: str | None = None
    lineup: list[str] = Field(default_factory=list)
    genres: list[str] = Field(default_factory=list)
    image_url: str | None = None
    ticket_url: str | None = None
    price: str | None = None
    description: str | None = None
    organizer: str | None = None

    @field_validator("title")
    @classmethod
    def _clean_title(cls, value: str) -> str:
        cleaned = collapse_whitespace(value)
        if not cleaned:
            raise ValueError("title cannot be empty")
        return cleaned

    @field_validator("lineup", "genres")
    @classmethod
    def _clean_lineup(cls, value: list[str]) -> list[str]:
        seen: set[str] = set()
        cleaned: list[str] = []
        for item in value:
            name = collapse_whitespace(item)
            key = normalize_for_match(name)
            if not name or key in seen:
                continue
            seen.add(key)
            cleaned.append(name)
        return cleaned

    @field_validator("state")
    @classmethod
    def _clean_state(cls, value: str | None) -> str | None:
        if not value:
            return None
        return collapse_whitespace(value).upper()

    @field_validator("start_datetime", "end_datetime")
    @classmethod
    def _ensure_timezone(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        return value if value.tzinfo else value.replace(tzinfo=SAO_PAULO)

    @property
    def start_date_key(self) -> str:
        """Local `YYYY-MM-DD` key, used for dedup and for the DB row."""
        return self.start_datetime.astimezone(SAO_PAULO).date().isoformat()

    @property
    def location_line(self) -> str | None:
        """Single-line location, following the `Venue, City - ST` shape of `nxt`."""
        parts = [part for part in (self.venue, self.city) if part]
        if not parts:
            return self.address or None
        line = ", ".join(parts)
        return f"{line} - {self.state}" if self.state else line

    @property
    def link(self) -> str:
        return self.ticket_url or self.source_url

    @property
    def dedup_hash(self) -> str:
        return dedup_hash(self.source, self.source_url, self.title, self.start_date_key)

    def to_db_row(self) -> dict:
        """Payload for `public.events`. Status is always approved."""
        return {
            "title": self.title,
            "start_date": self.start_datetime.isoformat(),
            "end_date": (
                self.end_datetime.isoformat() if self.end_datetime else None
            ),
            "location": self.location_line,
            "lineup": self.lineup,
            "link": self.link,
            "flyer": self.image_url,
            "status": "approved",
        }
