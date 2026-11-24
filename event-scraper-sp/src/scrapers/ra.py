"""RA (ra.co) lineups, read from the public GraphQL endpoint.

Event pages sit behind an anti-bot wall that answers plain HTTP clients with a
403, but `/graphql` accepts a normal POST and returns the same `lineup` text the
page renders: one artist per line.
"""

from __future__ import annotations

import re

from models.event import ScrapedEvent

GRAPHQL_URL = "https://ra.co/graphql"
EVENT_ID_RE = re.compile(r"ra\.co/events/(\d+)")


def ra_event_id(url: str | None) -> str | None:
    """Digits of `https://ra.co/events/<id>`, or None for any other URL."""
    if not url:
        return None
    match = EVENT_ID_RE.search(url)
    return match.group(1) if match else None


def parse_lineup(raw: str | None) -> list[str]:
    if not raw:
        return []
    seen: set[str] = set()
    names: list[str] = []
    for line in raw.splitlines():
        name = line.strip()
        key = name.casefold()
        if name and key not in seen:
            seen.add(key)
            names.append(name)
    return names


class RaLineupEnricher:
    """Fills `event.lineup` from RA, only when the event still has none."""

    def __init__(self, fetcher, logger=None) -> None:
        self.fetcher = fetcher
        self.logger = logger

    def enrich(self, event: ScrapedEvent) -> bool:
        if event.lineup:
            return False
        event_id = ra_event_id(event.link) or ra_event_id(event.source_url)
        if not event_id:
            return False

        # `event_id` comes from `\d+` only, so string interpolation is safe here.
        query = f"query {{ event(id: {event_id}) {{ lineup }} }}"
        try:
            payload = self.fetcher.post(GRAPHQL_URL, {"query": query})
        except Exception as exc:  # noqa: BLE001 - one event must not kill the source
            self._log(
                "warn",
                "ra_lineup_failed",
                url=event.link,
                event_title=event.title,
                error_type=type(exc).__name__,
                error_message=str(exc),
            )
            return False

        data = (payload or {}).get("data") or {}
        lineup = parse_lineup((data.get("event") or {}).get("lineup"))
        if not lineup:
            self._log("debug", "ra_lineup_empty", url=event.link, event_title=event.title)
            return False

        event.lineup = lineup
        self._log(
            "info",
            "ra_lineup_filled",
            url=event.link,
            event_title=event.title,
            names=len(lineup),
        )
        return True

    def _log(self, level: str, message: str, **context) -> None:
        if self.logger is None:
            return
        getattr(self.logger, level)(
            message, source="ra", event_stage="parse", **context
        )
