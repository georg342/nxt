from datetime import datetime

import pytest
from pydantic import ValidationError

from models.event import (
    ScrapedEvent,
    canonical_url,
    dedup_hash,
    normalize_for_match,
)
from scrapers.base import SAO_PAULO


def make_event(**overrides) -> ScrapedEvent:
    base = {
        "source": "test",
        "title": "  Tech House   Party ",
        "source_url": "https://example.com/evento/1",
        "start_datetime": datetime(2026, 11, 13, 23, 0, tzinfo=SAO_PAULO),
        "venue": "Komplexo Tempo",
        "city": "São Paulo",
        "state": "sp",
        "lineup": ["  DJ One ", "DJ One", "DJ TWO"],
    }
    base.update(overrides)
    return ScrapedEvent(**base)


def test_title_and_lineup_are_normalized():
    event = make_event()
    assert event.title == "Tech House Party"
    assert event.lineup == ["DJ One", "DJ TWO"]
    assert event.state == "SP"


def test_empty_title_is_rejected():
    with pytest.raises(ValidationError):
        make_event(title="   ")


def test_naive_datetime_gets_sao_paulo_timezone():
    event = make_event(start_datetime=datetime(2026, 11, 13, 23, 0))
    assert event.start_datetime.tzinfo is not None
    assert event.start_date_key == "2026-11-13"


def test_location_line_matches_nxt_shape():
    assert make_event().location_line == "Komplexo Tempo, São Paulo - SP"
    assert make_event(state=None).location_line == "Komplexo Tempo, São Paulo"
    assert make_event(venue=None, city=None, address="Rua X, 10").location_line == "Rua X, 10"


def test_db_row_is_always_approved_and_maps_columns():
    event = make_event(
        ticket_url="https://tickets.example.com/1",
        image_url="https://cdn.example.com/poster.jpg",
        end_datetime=datetime(2026, 11, 14, 5, 0, tzinfo=SAO_PAULO),
    )
    row = event.to_db_row()
    assert row["status"] == "approved"
    assert row["title"] == "Tech House Party"
    assert row["location"] == "Komplexo Tempo, São Paulo - SP"
    assert row["lineup"] == ["DJ One", "DJ TWO"]
    assert row["link"] == "https://tickets.example.com/1"
    assert row["flyer"] == "https://cdn.example.com/poster.jpg"
    assert row["start_date"].startswith("2026-11-13T23:00:00")
    # events has no genres column; the relation lives in event_genres.
    assert "genres" not in row


def test_link_falls_back_to_source_url():
    assert make_event().link == "https://example.com/evento/1"


def test_normalize_for_match_ignores_case_and_accents():
    assert normalize_for_match("  São   PAULO ") == normalize_for_match("sao paulo")


def test_canonical_url_drops_tracking_and_fragment():
    messy = "HTTPS://Example.com/E?utm_source=ig&b=2&a=1#section"
    assert canonical_url(messy) == "https://example.com/E?a=1&b=2"


def test_canonical_url_keeps_meaningful_query_params():
    first = canonical_url("https://example.com/event?id=10")
    second = canonical_url("https://example.com/event?id=11")
    assert first != second


def test_dedup_hash_is_stable_across_noise():
    one = dedup_hash("Techno Airlines", "https://EXAMPLE.com/e/1?utm_source=x", "A", "2026-11-13")
    two = dedup_hash("techno-airlines", "https://example.com/e/1", "B", "2026-11-14")
    assert one == two


def test_dedup_hash_falls_back_to_title_and_date():
    one = dedup_hash("src", None, "  São Paulo Rave ", "2026-11-13T23:00:00")
    two = dedup_hash("src", None, "sao paulo rave", "2026-11-13")
    assert one == two
    assert dedup_hash("src", None, "a", "2026-11-13") != dedup_hash("src", None, "a", "2026-11-14")
