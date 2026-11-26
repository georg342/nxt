"""Plurstation (plurstation.com.br) — São Paulo electronic music agenda.

Listing is SvelteKit server-rendered: each card is `article.event-entry` with
date text ("13 de nov. de 2026 01:00" or a range), city, venue/address, poster
and the event URL. Event detail pages are rendered client-side, so the listing
is the only static source of data.
"""

from __future__ import annotations

import re
from datetime import datetime
from urllib.parse import urljoin

from selectolax.lexbor import LexborHTMLParser

from models.event import ScrapedEvent, normalize_for_match
from scrapers.base import SAO_PAULO, BaseScraper

PT_MONTHS = {
    "jan": 1,
    "fev": 2,
    "mar": 3,
    "abr": 4,
    "mai": 5,
    "jun": 6,
    "jul": 7,
    "ago": 8,
    "set": 9,
    "out": 10,
    "nov": 11,
    "dez": 12,
}

DATE_RE = re.compile(
    r"(\d{1,2})\s+de\s+([a-zà-ú]{3,4})\.?\s+de\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?",
    re.IGNORECASE,
)


class PlurstationScraper(BaseScraper):
    name = "plurstation"
    start_url = "https://plurstation.com.br/eventos"

    def __init__(self, fetcher, logger=None, city_allowlist: set[str] | None = None) -> None:
        super().__init__(fetcher, logger)
        self.city_allowlist = city_allowlist or set()

    def parse(self, html: str, now: datetime | None = None) -> list[ScrapedEvent]:
        tree = LexborHTMLParser(html)
        events: list[ScrapedEvent] = []
        skipped_city = 0
        skipped_date = 0

        for card in tree.css("article.event-entry"):
            link = card.css_first("h3 a")
            date_node = card.css_first(".event-date")
            if link is None or date_node is None:
                continue

            dates = self._parse_dates(date_node.text())
            if not dates:
                skipped_date += 1
                self._log(
                    "warn",
                    "unparseable_date",
                    event_title=link.text(strip=True),
                    raw_date=date_node.text(strip=True),
                )
                continue
            start, end = dates

            location = card.css_first(".event-location")
            city = self._city(location)
            if self.city_allowlist and normalize_for_match(city or "") not in self.city_allowlist:
                skipped_city += 1
                continue

            image = card.css_first("img.artwork-image")
            href = link.attributes.get("href") or ""
            events.append(
                ScrapedEvent(
                    source=self.name,
                    title=link.text(strip=True),
                    source_url=urljoin(self.start_url, href),
                    start_datetime=start,
                    end_datetime=end,
                    venue=self._venue(location),
                    city=city,
                    image_url=image.attributes.get("src") if image else None,
                )
            )

        if skipped_date:
            self.parse_errors += skipped_date
        self._log(
            "info",
            "parsed_cards",
            url=self.start_url,
            cards=len(events),
            skipped_outside_city=skipped_city,
            skipped_unparseable_date=skipped_date,
        )
        return events

    @staticmethod
    def _parse_dates(text: str) -> tuple[datetime, datetime | None] | None:
        matches = DATE_RE.findall(text)
        if not matches:
            return None

        def build(match) -> datetime | None:
            day, month_name, year, hour, minute = match
            month = PT_MONTHS.get(month_name.lower().rstrip("."))
            if not month:
                return None
            try:
                return datetime(
                    int(year),
                    month,
                    int(day),
                    int(hour or 0),
                    int(minute or 0),
                    tzinfo=SAO_PAULO,
                )
            except ValueError:
                return None

        start = build(matches[0])
        if start is None:
            return None
        end = build(matches[1]) if len(matches) > 1 else None
        return start, end

    @staticmethod
    def _city(location) -> str | None:
        if location is None:
            return None
        city = location.text(deep=False)
        return city.strip() or None

    @staticmethod
    def _venue(location) -> str | None:
        if location is None:
            return None
        node = location.css_first(".venue")
        if node is None:
            return None
        # The markup prefixes the venue with a separator ("· Av. Mário de Andrade, 141").
        return node.text(strip=True).lstrip("·").strip() or None
