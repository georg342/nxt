"""Supabase writer for `public.events`.

Talks to PostgREST with the service_role key: the scraper has no session and
writes `approved` rows, which the table's RLS would not allow for an anonymous
client. Reads also need the service key, otherwise `pending` rows are invisible
and the dedup check would miss them.

Schema discovered in the `nxt` repo (src/repositories/SupabaseEventRepository.js
plus a REST probe of the real table):

    id uuid PK | title text NOT NULL | start_date timestamptz
    end_date timestamptz | location text | lineup text[] | link text
    flyer text | status text ('pending'|'approved'|'rejected')
    created_by uuid | created_at timestamptz

There is no `source`/`external_id` column, so dedup happens against `link` and
(`title`, `start_date`), which the table already exposes.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import httpx

from models.event import canonical_url, normalize_for_match


class SupabaseError(RuntimeError):
    """Raised when PostgREST answers with an error. Never swallowed silently."""


@dataclass
class ExistingEvents:
    links: set[str] = field(default_factory=set)
    title_dates: set[tuple[str, str]] = field(default_factory=set)

    def contains(self, title: str, start_date_key: str, link: str | None) -> bool:
        if link and canonical_url(link) in self.links:
            return True
        return (normalize_for_match(title), start_date_key) in self.title_dates


class SupabaseEventsRepository:
    def __init__(
        self,
        url: str,
        service_role_key: str,
        logger=None,
        client: httpx.Client | None = None,
        timeout: float = 20.0,
    ) -> None:
        self._logger = logger
        self._client = client or httpx.Client(
            base_url=url.rstrip("/") + "/rest/v1",
            timeout=timeout,
            headers={
                "apikey": service_role_key,
                "Authorization": f"Bearer {service_role_key}",
                "Content-Type": "application/json",
            },
        )

    def close(self) -> None:
        self._client.close()

    # -- dedup index ----------------------------------------------------
    def existing_events(self, date_from: str, date_to: str) -> ExistingEvents:
        """All events whose start_date falls in [date_from, date_to]."""
        # Repeated `start_date` keys need a list of tuples (gte + lte on one column).
        response = self._client.get(
            "/events",
            params=[
                ("select", "id,title,start_date,link"),
                ("start_date", f"gte.{date_from}"),
                ("start_date", f"lte.{date_to}"),
                ("limit", "2000"),
            ],
        )
        if response.status_code >= 400:
            raise SupabaseError(
                f"dedup read failed ({response.status_code}): {response.text[:300]}"
            )

        index = ExistingEvents()
        rows = response.json()
        for row in rows:
            if row.get("link"):
                index.links.add(canonical_url(row["link"]))
            start = str(row.get("start_date") or "")[:10]
            if row.get("title") and start:
                index.title_dates.add((normalize_for_match(row["title"]), start))
        self._log("debug", "dedup_index_loaded", rows=len(rows))
        return index

    # -- write ----------------------------------------------------------
    def insert_event(self, row: dict) -> dict:
        response = self._client.post(
            "/events",
            json=row,
            headers={"Prefer": "return=representation"},
        )
        if response.status_code >= 400:
            raise SupabaseError(
                f"insert failed ({response.status_code}): {response.text[:300]}"
            )
        created = response.json()
        created_row = created[0] if isinstance(created, list) and created else created
        self._log(
            "info",
            "event_inserted",
            event_stage="insert",
            event_id=(created_row or {}).get("id"),
            event_title=row.get("title"),
            source_event_link=row.get("link"),
        )
        return created_row or {}

    def _log(self, level: str, message: str, **context) -> None:
        if self._logger is None:
            return
        getattr(self._logger, level)(message, source="supabase", **context)
