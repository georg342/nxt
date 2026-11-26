"""Techno Airlines (technoairlines.com) — São Paulo city agenda.

Listing page is server-rendered: month/day headings plus `li.tev-row` rows with
title, event URL, venue, start time and lineup. Event pages expose a schema.org
`MusicEvent` JSON-LD block, used to enrich end time, ticket URL, description and
the real city/address.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timedelta

from selectolax.lexbor import LexborHTMLParser

from models.event import ScrapedEvent
from scrapers.base import SAO_PAULO, BaseScraper
from scrapers.ra import RaLineupEnricher

MONTHS = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}

TIME_RE = re.compile(r"\b(\d{1,2}):(\d{2})\b")
MONTH_NAME_RE = re.compile(r"\b(" + "|".join(MONTHS) + r")\b", re.IGNORECASE)
DAY_IN_HEADING = re.compile(r"\b(\d{1,2})\b")
YEAR_RE = re.compile(r"\b(20\d{2})\b")
MORE_RE = re.compile(r"\+\s*\d+\s*more", re.IGNORECASE)
# Event URLs end with the full date: `...-fabriketa-2026-11-14`.
URL_DATE_RE = re.compile(r"(\d{4})-(\d{2})-(\d{2})/?$")


def _iter_json_objects(node):
    if isinstance(node, dict):
        yield node
        for value in node.values():
            yield from _iter_json_objects(value)
    elif isinstance(node, list):
        for item in node:
            yield from _iter_json_objects(item)


def _parse_dt(value: str | None, fallback_tz=SAO_PAULO) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=fallback_tz)


class TechnoAirlinesScraper(BaseScraper):
    name = "technoairlines"
    start_url = "https://www.technoairlines.com/events/sao-paulo"
    default_city = "São Paulo"

    def __init__(
        self,
        fetcher,
        logger=None,
        enrich: bool = True,
        max_enrich: int = 15,
    ) -> None:
        super().__init__(fetcher, logger)
        self.enrich = enrich
        self.max_enrich = max_enrich
        self.ra_lineup = RaLineupEnricher(fetcher, logger)

    # -- listing --------------------------------------------------------
    def parse(self, html: str, now: datetime | None = None) -> list[ScrapedEvent]:
        now = now or datetime.now(tz=SAO_PAULO)
        tree = LexborHTMLParser(html)
        events: list[ScrapedEvent] = []
        seen_urls: set[str] = set()
        heading: dict | None = None
        skipped_no_date = 0

        for node in tree.root.traverse(include_text=False):
            classes = node.attributes.get("class") or ""
            if node.tag == "h3" and "tev-day" in classes:
                heading = self._parse_heading(node.text(), now)
                continue
            if node.tag != "li" or "tev-row" not in classes:
                continue

            event = self._parse_row(node, heading, now)
            if event is None:
                skipped_no_date += 1
                continue
            if event.source_url in seen_urls:
                continue
            seen_urls.add(event.source_url)
            events.append(event)

        if skipped_no_date:
            self.parse_errors += skipped_no_date
            self._log(
                "warn",
                "rows_without_parseable_date",
                count=skipped_no_date,
                url=self.start_url,
            )
        return events

    def _parse_heading(self, text: str, now: datetime) -> dict | None:
        month_match = MONTH_NAME_RE.search(text)
        if not month_match:
            return None
        month = MONTHS[month_match.group(1).lower()]
        year_match = YEAR_RE.search(text)
        day_matches = [
            int(match.group(1))
            for match in DAY_IN_HEADING.finditer(text)
            if int(match.group(1)) <= 31
        ]
        day = day_matches[0] if day_matches else None
        year = int(year_match.group(1)) if year_match else None
        if year is None:
            year = self._resolve_year(month, day or 1, now)
        return {"year": year, "month": month, "day": day}

    @staticmethod
    def _resolve_year(month: int, day: int, now: datetime) -> int:
        """Headings without a year ("Tomorrow 15 November") roll over in January."""
        candidate = datetime(now.year, month, day, tzinfo=SAO_PAULO)
        if candidate.date() < (now - timedelta(days=1)).date():
            return now.year + 1
        return now.year

    def _parse_row(self, row, heading: dict | None, now: datetime) -> ScrapedEvent | None:
        anchor = row.css_first("a.tev-tt")
        if anchor is None:
            return None
        title = anchor.text(strip=True)
        href = anchor.attributes.get("href") or ""
        if not title or not href:
            return None

        small = row.css_first("small")
        small_text = small.text(strip=True) if small else ""
        venue, start_time = self._split_small(small_text)
        hour, minute = start_time if start_time else (0, 0)

        start = self._start_from_heading(row, heading, now, hour, minute)
        if start is None:
            # "Tonight"/"This week" rows have no month heading, but the URL does.
            start = self._start_from_url(href, hour, minute)
        if start is None:
            return None

        lineup_node = row.css_first(".tev-ln")
        return ScrapedEvent(
            source=self.name,
            title=title,
            source_url=href,
            start_datetime=start,
            venue=venue,
            city=self.default_city,
            lineup=self._parse_lineup(lineup_node),
        )

    def _start_from_heading(
        self, row, heading: dict | None, now: datetime, hour: int, minute: int
    ) -> datetime | None:
        if heading is None:
            return None
        day_node = row.css_first(".tev-d b")
        day_text = day_node.text(strip=True) if day_node else ""
        day = int(day_text) if day_text.isdigit() else heading.get("day")
        if not day:
            return None

        year = heading["year"]
        if heading.get("day") is None:
            year = self._resolve_year(heading["month"], day, now)
        try:
            return datetime(year, heading["month"], day, hour, minute, tzinfo=SAO_PAULO)
        except ValueError:
            return None

    @staticmethod
    def _start_from_url(href: str, hour: int, minute: int) -> datetime | None:
        match = URL_DATE_RE.search(href)
        if not match:
            return None
        year, month, day = (int(part) for part in match.groups())
        try:
            return datetime(year, month, day, hour, minute, tzinfo=SAO_PAULO)
        except ValueError:
            return None

    @staticmethod
    def _split_small(text: str) -> tuple[str | None, tuple[int, int] | None]:
        venue = None
        start_time = None
        for part in text.split("·"):
            part = part.strip()
            if not part:
                continue
            match = TIME_RE.search(part)
            if match:
                start_time = (int(match.group(1)), int(match.group(2)))
            else:
                venue = part
        return venue, start_time

    @staticmethod
    def _parse_lineup(node) -> list[str]:
        if node is None:
            return []
        text = MORE_RE.sub("", node.text(strip=True))
        return [name.strip() for name in re.split(r",|&|/", text) if name.strip()]

    # -- detail enrichment ----------------------------------------------
    def fetch(self, now: datetime | None = None) -> list[ScrapedEvent]:
        html = self.fetcher.get(self.start_url)
        events = self.parse(html, now=now)
        if self.enrich and events:
            for event in events[: self.max_enrich]:
                self._enrich_one(event)
        return events

    def _enrich_one(self, event: ScrapedEvent) -> None:
        try:
            html = self.fetcher.get(event.source_url)
        except Exception as exc:  # noqa: BLE001 - one event must not kill the source
            self._log(
                "warn",
                "detail_fetch_failed",
                url=event.source_url,
                event_title=event.title,
                error_type=type(exc).__name__,
                error_message=str(exc),
            )
            return

        detail = self.parse_detail(html)
        if detail:
            updates = {
                field: detail[field]
                for field in (
                    "ticket_url",
                    "lineup",
                    "description",
                    "organizer",
                    "city",
                    "address",
                    "image_url",
                )
                if detail.get(field)
            }
            if detail.get("end_date"):
                updates["end_datetime"] = detail["end_date"]
            if updates:
                enriched = event.model_copy(update=updates)
                for key, value in enriched.__dict__.items():
                    setattr(event, key, value)
        else:
            self._log("debug", "detail_without_jsonld", url=event.source_url)

        # RA tickets carry the authoritative lineup; fill it when still empty.
        self.ra_lineup.enrich(event)

    @staticmethod
    def parse_detail(html: str) -> dict:
        """Read the schema.org MusicEvent block from an event page."""
        tree = LexborHTMLParser(html)
        for script in tree.css('script[type="application/ld+json"]'):
            try:
                payload = json.loads(script.text())
            except json.JSONDecodeError:
                continue
            for candidate in _iter_json_objects(payload):
                if candidate.get("@type") in ("MusicEvent", "Event"):
                    return TechnoAirlinesScraper._detail_from_jsonld(candidate)
        return {}

    @staticmethod
    def _detail_from_jsonld(data: dict) -> dict:
        location = data.get("location") or {}
        address = location.get("address") or {}
        offers = data.get("offers") or {}
        if isinstance(offers, list):
            offers = offers[0] if offers else {}
        performers = data.get("performer") or []
        if isinstance(performers, dict):
            performers = [performers]
        organizer = data.get("organizer") or {}
        image = data.get("image")
        if isinstance(image, dict):
            image = image.get("url")
        if isinstance(image, list):
            image = image[0] if image else None

        return {
            "start_date": _parse_dt(data.get("startDate")),
            "end_date": _parse_dt(data.get("endDate")),
            "ticket_url": offers.get("url"),
            "city": address.get("addressLocality"),
            "address": address.get("streetAddress"),
            "lineup": [
                person.get("name")
                for person in performers
                if isinstance(person, dict) and person.get("name")
            ],
            "description": data.get("description"),
            "organizer": organizer.get("name") if isinstance(organizer, dict) else None,
            "image_url": image,
        }
