from datetime import datetime

import httpx
import respx

from models.event import ScrapedEvent
from scrapers.base import SAO_PAULO
from scrapers.http import HttpFetcher
from scrapers.ra import GRAPHQL_URL, RaLineupEnricher, parse_lineup, ra_event_id

UA = "WNXT-Test/1.0"
ROBOTS_URL = "https://ra.co/robots.txt"
RA_EVENT_URL = "https://ra.co/events/2579298"


def make_fetcher(logger=None) -> HttpFetcher:
    client = httpx.Client(headers={"User-Agent": UA}, follow_redirects=True)
    return HttpFetcher(
        UA, delay=0, max_retries=1, logger=logger, client=client, sleep=lambda s: None
    )


def make_event(lineup=None, genres=None, ticket_url=RA_EVENT_URL) -> ScrapedEvent:
    return ScrapedEvent(
        source="technoairlines",
        title="MOVING D-EDGE SP pres.: P1",
        source_url="https://www.technoairlines.com/event/moving-d-edge-2026-11-26",
        start_datetime=datetime(2026, 11, 26, 22, 0, tzinfo=SAO_PAULO),
        lineup=lineup or [],
        genres=genres or [],
        ticket_url=ticket_url,
    )


def allow_robots() -> None:
    respx.get(ROBOTS_URL).mock(
        return_value=httpx.Response(200, text="User-agent: *\nDisallow: /api")
    )


def test_ra_event_id_reads_the_url():
    assert ra_event_id(RA_EVENT_URL) == "2579298"
    assert ra_event_id("https://ra.co/events/2579298?utm_source=ig") == "2579298"
    assert ra_event_id("https://plurstation.com.br/evento/1") is None
    assert ra_event_id(None) is None


def test_parse_lineup_splits_lines_and_dedups():
    raw = "EHLLA \nCESAR NARDINI \nJAY MARIANI \nBEATRIC\n\n"
    assert parse_lineup(raw) == ["EHLLA", "CESAR NARDINI", "JAY MARIANI", "BEATRIC"]
    assert parse_lineup("Swam") == ["Swam"]
    assert parse_lineup("DJ One\ndj one") == ["DJ One"]
    assert parse_lineup(None) == []


@respx.mock
def test_enrich_queries_ra_and_fills_the_lineup():
    allow_robots()
    route = respx.post(GRAPHQL_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "data": {
                    "event": {
                        "lineup": "EHLLA\nCESAR NARDINI",
                        "genres": [{"name": "House"}, {"name": "Tech House"}],
                    }
                }
            },
        )
    )
    event = make_event()

    assert RaLineupEnricher(make_fetcher()).enrich(event) is True
    assert event.lineup == ["EHLLA", "CESAR NARDINI"]
    assert event.genres == ["House", "Tech House"]
    body = route.calls[0].request.content.decode()
    assert "event(id: 2579298)" in body
    assert "genres { name }" in body


@respx.mock
def test_enrich_fills_genres_when_only_the_lineup_is_known():
    allow_robots()
    respx.post(GRAPHQL_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "data": {
                    "event": {"lineup": "DJ One", "genres": [{"name": "Techno"}]}
                }
            },
        )
    )
    event = make_event(lineup=["DJ One"])

    assert RaLineupEnricher(make_fetcher()).enrich(event) is True
    assert event.lineup == ["DJ One"]
    assert event.genres == ["Techno"]


def test_enrich_skips_events_that_already_have_lineup_and_genres():
    event = make_event(lineup=["DJ One"], genres=["Techno"])
    assert RaLineupEnricher(make_fetcher()).enrich(event) is False
    assert event.lineup == ["DJ One"]
    assert event.genres == ["Techno"]


def test_enrich_skips_events_without_an_ra_link():
    event = make_event(ticket_url=None)
    assert RaLineupEnricher(make_fetcher()).enrich(event) is False


@respx.mock
def test_enrich_ignores_an_empty_lineup():
    allow_robots()
    respx.post(GRAPHQL_URL).mock(
        return_value=httpx.Response(200, json={"data": {"event": {"lineup": ""}}})
    )
    event = make_event()

    assert RaLineupEnricher(make_fetcher()).enrich(event) is False
    assert event.lineup == []


@respx.mock
def test_enrich_logs_and_survives_a_failed_request(recording_logger):
    allow_robots()
    respx.post(GRAPHQL_URL).mock(return_value=httpx.Response(500, text="boom"))
    event = make_event()

    assert RaLineupEnricher(make_fetcher(recording_logger), recording_logger).enrich(event) is False
    assert "ra_lineup_failed" in recording_logger.messages("warn")
    assert event.lineup == []
