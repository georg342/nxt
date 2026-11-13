"""Common scraper interface: one class per source, one method to parse HTML."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import ClassVar
from zoneinfo import ZoneInfo

from models.event import ScrapedEvent
from scrapers.http import HttpFetcher

SAO_PAULO = ZoneInfo("America/Sao_Paulo")


class BaseScraper(ABC):
    """A source is `start_url` + a parser. Adding a source = adding one class."""

    name: ClassVar[str] = "base"
    start_url: ClassVar[str] = ""

    def __init__(self, fetcher: HttpFetcher, logger=None) -> None:
        self.fetcher = fetcher
        self.logger = logger
        # Rows the parser saw but could not turn into an event (reported in the summary).
        self.parse_errors = 0

    @abstractmethod
    def parse(self, html: str, now: datetime | None = None) -> list[ScrapedEvent]:
        """Turn listing HTML into events. No network here: unit-testable."""

    def fetch(self, now: datetime | None = None) -> list[ScrapedEvent]:
        html = self.fetcher.get(self.start_url)
        return self.parse(html, now=now)

    def _log(self, level: str, message: str, **context) -> None:
        if self.logger is None:
            return
        getattr(self.logger, level)(
            message, source=self.name, event_stage="parse", **context
        )
